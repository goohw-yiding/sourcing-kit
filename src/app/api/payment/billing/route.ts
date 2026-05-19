/**
 * POST /api/payment/billing
 *
 * planType: "taste"   → 단건 결제 (confirmPayment) + 맛보기 30일 활성화
 * planType: "monthly" → 빌링키 발급 + 첫 달 즉시 결제 + Pro 월구독 활성화
 * planType: "yearly"  → 빌링키 발급 + 연간 결제 + Pro 연구독 활성화
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { issueBillingKey, chargeBillingKey, confirmPayment, generateOrderId } from "@/lib/toss";
import { activateProPlan, activateTastePlan, PLANS } from "@/lib/subscription";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const body = await req.json();
    const { planType, authKey, customerKey, paymentKey, orderId: bodyOrderId } = body;
    const tenantId = session.user.tenantId;
    const user = session.user;

    // ── 맛보기: 단건 결제 승인 ────────────────────────────────
    if (planType === "taste") {
      const amount = PLANS.taste.price; // 9900
      const orderId = bodyOrderId || generateOrderId("taste");

      // 토스 단건 결제 승인
      const paymentResult = await confirmPayment(paymentKey, orderId, amount);

      // 구독 활성화 (30일)
      const sub = await activateTastePlan(tenantId);

      // 결제 기록
      await prisma.payment.create({
        data: {
          tenantId,
          subscriptionId: sub.id,
          orderId,
          paymentKey: paymentResult.paymentKey,
          amount,
          status: "done",
          method: paymentResult.method,
          receiptUrl: paymentResult.receipt?.url,
          approvedAt: new Date(paymentResult.approvedAt || Date.now()),
        },
      });

      return NextResponse.json({ ok: true, plan: "taste" });
    }

    // ── Pro 월구독 / 연구독: 빌링키 발급 후 즉시 결제 ─────────
    if (planType === "monthly" || planType === "yearly") {
      if (!authKey || !customerKey) {
        return NextResponse.json({ error: "인증키가 없습니다" }, { status: 400 });
      }

      const amount = planType === "yearly"
        ? PLANS.pro.priceYearly * 12  // 연간 ₩70,800 일시결제
        : PLANS.pro.price;            // 월간 ₩7,900

      const orderName = planType === "yearly"
        ? "소싱킷 Pro 연간 구독"
        : "소싱킷 Pro 월간 구독";

      // 1. 빌링키 발급
      const billingData = await issueBillingKey(authKey, customerKey);
      const { billingKey } = billingData;

      // 2. 즉시 결제
      const orderId = generateOrderId(planType === "yearly" ? "proY" : "proM");
      const paymentResult = await chargeBillingKey(billingKey, {
        customerKey,
        amount,
        orderId,
        orderName,
        customerEmail: user.email,
        customerName: user.name,
      });

      // 3. Pro 구독 활성화
      const sub = await activateProPlan(tenantId, billingKey, customerKey, planType);

      // 4. 결제 기록
      await prisma.payment.create({
        data: {
          tenantId,
          subscriptionId: sub.id,
          orderId,
          paymentKey: paymentResult.paymentKey,
          amount,
          status: "done",
          method: paymentResult.method,
          receiptUrl: paymentResult.receipt?.url,
          approvedAt: new Date(paymentResult.approvedAt || Date.now()),
        },
      });

      return NextResponse.json({ ok: true, plan: "pro", billingType: planType });
    }

    return NextResponse.json({ error: "잘못된 planType입니다" }, { status: 400 });

  } catch (err) {
    console.error("[payment/billing] error:", err);
    const message = err instanceof Error ? err.message : "결제 처리 중 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
