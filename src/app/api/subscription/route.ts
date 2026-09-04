/**
 * GET /api/subscription  - 현재 구독 상태 조회
 * DELETE /api/subscription - 구독 취소
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import {
  getSubscription,
  cancelProPlan,
  getTenantPlan,
  getDailyAiUsage,
  PLANS,
} from "@/lib/subscription";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const [sub, plan, aiUsedToday] = await Promise.all([
    getSubscription(tenantId),
    getTenantPlan(tenantId),
    getDailyAiUsage(tenantId),
  ]);

  const planInfo = PLANS[plan];
  const aiLimit = planInfo.aiAnalysisDaily as number;

  return NextResponse.json({
    plan,
    planName: planInfo.name,
    status: sub?.status ?? "active",
    billingType: sub?.billingType ?? "free",
    nextBillingAt: sub?.nextBillingAt ?? null,
    expiresAt: sub?.expiresAt ?? null,
    cancelledAt: sub?.cancelledAt ?? null,
    billingRetry: sub?.billingRetry ?? 0,
    lastBillingError: sub?.lastBillingError ?? null,
    lastBilledAt: sub?.lastBilledAt ?? null,
    limits: {
      productLimit: planInfo.productLimit,
      supplierLimit: planInfo.supplierLimit,
      proposalLimit: planInfo.proposalLimit,
      aiAnalysisDaily: aiLimit,
    },
    usage: {
      aiUsedToday,
      aiRemainingToday: isFinite(aiLimit) ? Math.max(0, aiLimit - aiUsedToday) : null,
    },
    payments: sub?.payments ?? [],
  });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await cancelProPlan(session.user.tenantId);
  const until = sub.expiresAt
    ? new Date(sub.expiresAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return NextResponse.json({
    ok: true,
    expiresAt: sub.expiresAt,
    message: until
      ? `구독이 해지 예약되었습니다. ${until}까지 Pro 기능을 그대로 이용할 수 있고, 이후에는 자동결제되지 않습니다.`
      : "구독이 해지되었습니다.",
  });
}
