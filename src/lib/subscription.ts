/**
 * 구독 플랜 관리 유틸리티
 */
import { prisma } from "@/lib/prisma";

export const PLANS = {
  free: {
    name: "무료",
    price: 0,
    productLimit: 10,       // 상품 최대 등록 수
    supplierLimit: 5,        // 공급업체 최대 등록 수
    aiAnalysisLimit: 3,      // AI 분석 일일 횟수
    proposalLimit: 3,        // 견적서 최대 생성 수
  },
  pro: {
    name: "Pro",
    price: Number(process.env.NEXT_PUBLIC_PRO_PRICE) || 19900,
    productLimit: Infinity,
    supplierLimit: Infinity,
    aiAnalysisLimit: Infinity,
    proposalLimit: Infinity,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

/** 테넌트의 현재 플랜 조회 */
export async function getTenantPlan(tenantId: string): Promise<PlanKey> {
  const sub = await prisma.subscription.findUnique({
    where: { tenantId },
    select: { plan: true, status: true },
  });
  if (sub && sub.plan === "pro" && sub.status === "active") return "pro";
  return "free";
}

/** 구독 정보 전체 조회 */
export async function getSubscription(tenantId: string) {
  return prisma.subscription.findUnique({
    where: { tenantId },
    include: {
      payments: {
        orderBy: { requestedAt: "desc" },
        take: 5,
      },
    },
  });
}

/** 플랜 업그레이드 (빌링키 기반) */
export async function activateProPlan(
  tenantId: string,
  billingKey: string,
  customerKey: string
) {
  const nextBillingAt = new Date();
  nextBillingAt.setMonth(nextBillingAt.getMonth() + 1);

  return prisma.subscription.upsert({
    where: { tenantId },
    create: {
      tenantId,
      plan: "pro",
      status: "active",
      billingKey,
      customerKey,
      nextBillingAt,
    },
    update: {
      plan: "pro",
      status: "active",
      billingKey,
      customerKey,
      nextBillingAt,
      cancelledAt: null,
    },
  });
}

/** 구독 취소 */
export async function cancelProPlan(tenantId: string) {
  return prisma.subscription.update({
    where: { tenantId },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
    },
  });
}
