/**
 * GET /api/cron/billing — 구독 정기결제 자동청구 배치
 *
 * Vercel Cron 이 매일 실행한다 (vercel.json 참고).
 * 하는 일
 *  1) 청구일(nextBillingAt)이 지난 Pro 구독을 빌링키로 자동결제
 *  2) 실패하면 past_due 로 두고 다음 날 재시도, MAX_BILLING_RETRY 회 실패하면 해지
 *  3) 기간이 끝난 맛보기(taste) 구독을 expired 로 정리
 *
 * 보안: CRON_SECRET 이 설정돼 있으면 `Authorization: Bearer <CRON_SECRET>` 필수.
 *       (Vercel Cron 은 프로젝트 환경변수 CRON_SECRET 을 자동으로 이 헤더에 넣어 보낸다)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chargeBillingKey } from "@/lib/toss";
import {
  PLANS,
  applyRenewalSuccess,
  applyRenewalFailure,
  MAX_BILLING_RETRY,
} from "@/lib/subscription";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** 결제 1건당 orderId — 같은 청구주기·같은 재시도회차면 항상 같은 값(중복청구 방지) */
function buildOrderId(tenantId: string, billedFor: Date, retry: number) {
  const ymd = billedFor.toISOString().slice(0, 10).replace(/-/g, "");
  const short = tenantId.slice(-12);
  return `pro_${short}_${ymd}${retry > 0 ? `r${retry}` : ""}`;
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const result = {
    ranAt: now.toISOString(),
    charged: 0,
    failed: 0,
    skipped: 0,
    expiredTaste: 0,
    details: [] as Array<Record<string, unknown>>,
  };

  // ── 1. 맛보기 만료 정리 ────────────────────────────────────
  const expired = await prisma.subscription.updateMany({
    where: {
      plan: "taste",
      status: "active",
      expiresAt: { lt: now },
    },
    data: { status: "expired" },
  });
  result.expiredTaste = expired.count;

  // ── 2. 청구 대상 조회 ──────────────────────────────────────
  const due = await prisma.subscription.findMany({
    where: {
      plan: "pro",
      status: { in: ["active", "past_due"] },
      billingKey: { not: null },
      nextBillingAt: { not: null, lte: now },
    },
    include: { tenant: { include: { users: { take: 1 } } } },
  });

  for (const sub of due) {
    const billedFor = sub.nextBillingAt!;
    const orderId = buildOrderId(sub.tenantId, billedFor, sub.billingRetry);

    // 이미 같은 orderId 로 성공한 기록이 있으면 건너뛴다 (중복청구 방지)
    const already = await prisma.payment.findUnique({ where: { orderId } });
    if (already && already.status === "done") {
      await applyRenewalSuccess(sub.id, billedFor, sub.billingType);
      result.skipped++;
      continue;
    }

    const amount =
      sub.billingType === "yearly"
        ? PLANS.pro.priceYearly * 12
        : PLANS.pro.price;
    const orderName =
      sub.billingType === "yearly" ? "소싱킷 Pro 연간 구독" : "소싱킷 Pro 월간 구독";
    const user = sub.tenant?.users?.[0];

    try {
      const paid = await chargeBillingKey(sub.billingKey!, {
        customerKey: sub.customerKey || sub.tenantId,
        amount,
        orderId,
        orderName,
        customerEmail: user?.email,
        customerName: user?.name,
      });

      await prisma.payment.upsert({
        where: { orderId },
        create: {
          tenantId: sub.tenantId,
          subscriptionId: sub.id,
          orderId,
          paymentKey: paid.paymentKey,
          amount,
          status: "done",
          method: paid.method,
          receiptUrl: paid.receipt?.url,
          approvedAt: new Date(paid.approvedAt || Date.now()),
        },
        update: {
          paymentKey: paid.paymentKey,
          status: "done",
          method: paid.method,
          receiptUrl: paid.receipt?.url,
          approvedAt: new Date(paid.approvedAt || Date.now()),
        },
      });

      await applyRenewalSuccess(sub.id, billedFor, sub.billingType);
      result.charged++;
      result.details.push({ tenantId: sub.tenantId, orderId, status: "done", amount });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);

      await prisma.payment.upsert({
        where: { orderId },
        create: {
          tenantId: sub.tenantId,
          subscriptionId: sub.id,
          orderId,
          amount,
          status: "failed",
        },
        update: { status: "failed" },
      });

      const updated = await applyRenewalFailure(sub.id, sub.billingRetry, reason);
      result.failed++;
      result.details.push({
        tenantId: sub.tenantId,
        orderId,
        status: updated.status,
        retry: `${updated.billingRetry}/${MAX_BILLING_RETRY}`,
        reason,
      });
      console.error(`[cron/billing] ${sub.tenantId} 결제 실패:`, reason);
    }
  }

  console.log("[cron/billing]", JSON.stringify(result));
  return NextResponse.json(result);
}

// Vercel Cron 이 POST 로 오는 환경도 있어 동일 처리
export const POST = GET;
