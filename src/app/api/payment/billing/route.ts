/**
 * POST /api/payment/billing
 * 빌링키 발급 + 첫 달 즉시 결제 + 구독 활성화
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { issueBillingKey, chargeBillingKey, generateOrderId } from "@/lib/toss";
import { activateProPlan } from "@/lib/subscription";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { authKey, customerKey } = await req.json();
    if (!authKey || !customerKey) {
      return NextResponse.json({ error: "인증키가 없습니다" }, { status: 400 });
    }

    const tenantId = session.user.tenantId;
    const amount = Number(process.env.NEXT_PUBLIC_PRO_PRICE) || 19900;

    // 1. 빌링키 발급
    const billingData = await issueBillingKey(authKey, customerKey);
    const { billingKey } = billingData;

    // 2. 첫 달 즉시 결제
    const orderId = generateOrderId("sub");
    const user = session.user;

    const paymentResult = await chargeBillingKey(billingKey, {
      customerKey,
      amount,
      orderId,
      orderName: "소싱킷 Pro 월간 구독",
      customerEmail: user.email,
      customerName: user.name,
    });

    // 3. DB에 결제 기록 저장
    const sub = await activateProPlan(tenantId, billingKey, customerKey);

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

    return NextResponse.json({ ok: true, plan: "pro" });
  } catch (err) {
    console.error("[payment/billing] error:", err);
    const message = err instanceof Error ? err.message : "결제 처리 중 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
