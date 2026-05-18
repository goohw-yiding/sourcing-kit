/**
 * GET /api/subscription  - 현재 구독 상태 조회
 * DELETE /api/subscription - 구독 취소
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getSubscription, cancelProPlan, PLANS } from "@/lib/subscription";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await getSubscription(session.user.tenantId);
  const plan = (sub?.plan === "pro" && sub?.status === "active") ? "pro" : "free";

  return NextResponse.json({
    plan,
    status: sub?.status ?? "active",
    nextBillingAt: sub?.nextBillingAt ?? null,
    cancelledAt: sub?.cancelledAt ?? null,
    limits: PLANS[plan as keyof typeof PLANS],
    payments: sub?.payments ?? [],
  });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await cancelProPlan(session.user.tenantId);
  return NextResponse.json({ ok: true, message: "구독이 취소됩니다. 이번 달 말까지 Pro 기능을 이용할 수 있습니다." });
}
