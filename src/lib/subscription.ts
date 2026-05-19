/**
 * 구독 플랜 관리 유틸리티
 */
import { prisma } from "@/lib/prisma";

// ── 요금제 정의 ──────────────────────────────────────────────
export const PLANS = {
  free: {
    name: "무료",
    price: 0,
    billingType: "free" as const,
    productLimit: 10,        // 상품 최대 등록 수
    supplierLimit: 5,         // 공급업체 최대 등록 수
    proposalLimit: 3,         // 견적서 최대 생성 수
    aiAnalysisDaily: 3,       // AI 분석 일일 횟수
  },
  taste: {
    name: "맛보기",
    price: 9900,
    billingType: "once" as const,
    durationDays: 30,         // 30일 사용권
    productLimit: 100,        // 상품 최대 등록 수
    supplierLimit: 30,        // 공급업체 최대 등록 수
    proposalLimit: 20,        // 견적서 최대 생성 수
    aiAnalysisDaily: 20,      // AI 분석 일일 횟수
  },
  pro: {
    name: "Pro",
    price: 7900,              // 월구독
    priceYearly: 5900,        // 연구독 월 환산 (연 ₩70,800)
    billingType: "monthly" as const,
    productLimit: Infinity,
    supplierLimit: Infinity,
    proposalLimit: Infinity,
    aiAnalysisDaily: Infinity,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

// ── 플랜 조회 ─────────────────────────────────────────────────

/** 테넌트의 현재 유효 플랜 반환 */
export async function getTenantPlan(tenantId: string): Promise<PlanKey> {
  const sub = await prisma.subscription.findUnique({
    where: { tenantId },
    select: { plan: true, status: true, expiresAt: true },
  });

  if (!sub || sub.status === "cancelled") return "free";

  // taste 플랜: 만료 여부 확인
  if (sub.plan === "taste") {
    if (sub.expiresAt && sub.expiresAt < new Date()) return "free";
    return "taste";
  }

  // pro 플랜
  if (sub.plan === "pro" && sub.status === "active") return "pro";

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

// ── 플랜 활성화 ───────────────────────────────────────────────

/** 맛보기 플랜 활성화 (30일 단건 결제) */
export async function activateTastePlan(tenantId: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + PLANS.taste.durationDays);

  return prisma.subscription.upsert({
    where: { tenantId },
    create: {
      tenantId,
      plan: "taste",
      billingType: "once",
      status: "active",
      expiresAt,
    },
    update: {
      plan: "taste",
      billingType: "once",
      status: "active",
      expiresAt,
      billingKey: null,
      cancelledAt: null,
    },
  });
}

/** Pro 월구독 플랜 활성화 (빌링키 기반) */
export async function activateProPlan(
  tenantId: string,
  billingKey: string,
  customerKey: string,
  billingType: "monthly" | "yearly" = "monthly"
) {
  const nextBillingAt = new Date();
  if (billingType === "yearly") {
    nextBillingAt.setFullYear(nextBillingAt.getFullYear() + 1);
  } else {
    nextBillingAt.setMonth(nextBillingAt.getMonth() + 1);
  }

  return prisma.subscription.upsert({
    where: { tenantId },
    create: {
      tenantId,
      plan: "pro",
      billingType,
      status: "active",
      billingKey,
      customerKey,
      nextBillingAt,
      expiresAt: null,
    },
    update: {
      plan: "pro",
      billingType,
      status: "active",
      billingKey,
      customerKey,
      nextBillingAt,
      expiresAt: null,
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

// ── 일일 AI 사용량 관리 ────────────────────────────────────────

/** KST 기준 오늘 날짜 문자열 반환 (YYYY-MM-DD) */
function getTodayKST(): string {
  const now = new Date();
  // UTC+9 보정
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split("T")[0];
}

/** 오늘 AI 사용 횟수 조회 */
export async function getDailyAiUsage(tenantId: string): Promise<number> {
  const date = getTodayKST();
  const log = await prisma.aiUsageLog.findUnique({
    where: { tenantId_date: { tenantId, date } },
  });
  return log?.count ?? 0;
}

/**
 * AI 사용 가능 여부 확인 후 횟수 증가
 * @returns { allowed: boolean, used: number, limit: number }
 */
export async function checkAndIncrementAiUsage(
  tenantId: string
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const plan = await getTenantPlan(tenantId);
  const limit = PLANS[plan].aiAnalysisDaily as number;

  // 무제한 플랜
  if (!isFinite(limit)) {
    const date = getTodayKST();
    await prisma.aiUsageLog.upsert({
      where: { tenantId_date: { tenantId, date } },
      create: { tenantId, date, count: 1 },
      update: { count: { increment: 1 } },
    });
    return { allowed: true, used: 0, limit: Infinity };
  }

  const date = getTodayKST();
  const log = await prisma.aiUsageLog.findUnique({
    where: { tenantId_date: { tenantId, date } },
  });
  const current = log?.count ?? 0;

  if (current >= limit) {
    return { allowed: false, used: current, limit };
  }

  // 횟수 증가
  await prisma.aiUsageLog.upsert({
    where: { tenantId_date: { tenantId, date } },
    create: { tenantId, date, count: 1 },
    update: { count: { increment: 1 } },
  });

  return { allowed: true, used: current + 1, limit };
}
