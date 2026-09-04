/**
 * POST /api/webhooks/toss — 토스페이먼츠 웹훅 수신
 *
 * 개발자센터 → 웹훅 에 이 URL을 등록한다.
 *   https://www.sourcing-kit.kr/api/webhooks/toss?key=<TOSS_WEBHOOK_SECRET>
 *
 * 처리하는 이벤트 (개발자센터에서 실제로 고를 수 있는 이름 기준)
 *  - PAYMENT_STATUS_CHANGED : 결제 상태 변경(승인/취소/실패)
 *  - CANCEL_STATUS_CHANGED  : 취소 상태 변경
 *  - BILLING_DELETED        : 빌링키 삭제(카드 해지·만료 등) → 자동결제 불가
 *
 * ★ 토스는 2xx가 아니면 계속 재시도한다. 우리가 모르는 이벤트여도 200을 돌려주고
 *   로그만 남긴다. 그래야 재시도 폭주가 안 생긴다.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type TossWebhook = {
  eventType?: string;
  createdAt?: string;
  data?: {
    orderId?: string;
    paymentKey?: string;
    status?: string;
    method?: string;
    totalAmount?: number;
    approvedAt?: string;
    billingKey?: string;
    customerKey?: string;
    receipt?: { url?: string };
    cancels?: Array<{ cancelAmount?: number; canceledAt?: string }>;
  };
};

/** 토스 결제상태 → 우리 Payment.status */
function mapStatus(tossStatus?: string): string {
  switch (tossStatus) {
    case "DONE":
      return "done";
    case "CANCELED":
    case "PARTIAL_CANCELED":
      return "cancelled";
    case "ABORTED":
    case "EXPIRED":
      return "failed";
    case "READY":
    case "IN_PROGRESS":
    case "WAITING_FOR_DEPOSIT":
      return "pending";
    default:
      return "pending";
  }
}

export async function POST(req: NextRequest) {
  // 공유 시크릿이 설정돼 있으면 검증 (쿼리스트링 ?key=)
  const secret = process.env.TOSS_WEBHOOK_SECRET;
  if (secret && req.nextUrl.searchParams.get("key") !== secret) {
    console.warn("[webhooks/toss] 잘못된 key 로 호출됨");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: TossWebhook;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true, note: "본문 파싱 실패" });
  }

  const { eventType, data } = body;
  console.log("[webhooks/toss]", eventType, JSON.stringify(data ?? {}).slice(0, 800));

  try {
    // ── 빌링키 삭제: 더 이상 자동결제 불가 → 해지 예약 ──────────
    // BILLING_DELETED 가 실제 이벤트명. (구 문서의 BILLING_KEY_STATUS_CHANGED 도 같이 받아둔다)
    if (eventType === "BILLING_DELETED" || eventType === "BILLING_KEY_STATUS_CHANGED") {
      const sub = data?.billingKey
        ? await prisma.subscription.findFirst({ where: { billingKey: data.billingKey } })
        : data?.customerKey
        ? await prisma.subscription.findFirst({ where: { customerKey: data.customerKey } })
        : null;

      // 상태값이 함께 오면 ACTIVE 가 아닐 때만, 안 오면(삭제 통보) 그대로 해지
      const deleted = !data?.status || data.status !== "ACTIVE";

      if (sub && deleted) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: "cancelled",
            cancelledAt: new Date(),
            nextBillingAt: null,
            billingKey: null,
            // 이미 결제한 기간까지는 계속 사용
            expiresAt: sub.nextBillingAt ?? sub.expiresAt ?? new Date(),
            lastBillingError: `빌링키 삭제(${eventType}${data?.status ? `/${data.status}` : ""})`,
          },
        });
      }
      return NextResponse.json({ ok: true, handled: eventType });
    }

    // ── 결제 상태 변경 ────────────────────────────────────────
    const orderId = data?.orderId;
    if (!orderId) return NextResponse.json({ ok: true, note: "orderId 없음" });

    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: { subscription: true },
    });
    if (!payment) {
      // 우리가 만들지 않은 주문(테스트 결제 등)은 무시
      return NextResponse.json({ ok: true, note: "알 수 없는 orderId" });
    }

    const status = mapStatus(data?.status);
    await prisma.payment.update({
      where: { orderId },
      data: {
        status,
        paymentKey: data?.paymentKey ?? payment.paymentKey,
        method: data?.method ?? payment.method,
        receiptUrl: data?.receipt?.url ?? payment.receiptUrl,
        approvedAt: data?.approvedAt ? new Date(data.approvedAt) : payment.approvedAt,
      },
    });

    // 결제가 취소되면 그 결제로 살아 있던 구독도 내린다
    if (status === "cancelled" && payment.subscriptionId) {
      const sub = payment.subscription;
      await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
          nextBillingAt: null,
          // 환불된 건이므로 이용기간도 즉시 종료
          expiresAt: new Date(),
          lastBillingError: `결제 취소(${data?.status ?? "CANCELED"})`,
          ...(sub?.plan === "taste" ? { status: "expired" } : {}),
        },
      });
    }

    return NextResponse.json({ ok: true, orderId, status });
  } catch (err) {
    console.error("[webhooks/toss] 처리 실패:", err);
    // 우리 쪽 오류로 토스가 무한 재시도하지 않도록 200을 돌려준다 (로그로 추적)
    return NextResponse.json({ ok: false, note: "internal error logged" });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, note: "토스 웹훅 수신 엔드포인트" });
}
