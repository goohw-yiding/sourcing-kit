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
    productLimit: 10,
    supplierLimit: 5,
    proposalLimit: 3,
    aiAnalysisDaily: 3,       // 기본 일일 횟수
    aiAnalysisDailyFirst: 10, // 첫날 일일 횟수
  },
  taste: {
    name: "맛보기",
    price: 9900,
    billingType: "once" as const,
    durationDays: 30,
    productLimit: 100,
    supplierLimit: 30,
    proposalLimit: 20,
    aiAnalysisDaily: 100,
    aiAnalysisDailyFirst: 100,
  },
  pro: {
    name: "Pro",
    price: 7900,
    priceYearly: 5900,
    billingType: "monthly" as const,
    productLimit: Infinity,
    supplierLimit: Infinity,
    proposalLimit: Infinity,
    aiAnalysisDaily: Infinity,
    aiAnalysisDailyFirst: Infinity,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

// ── 플랜 조회 ─────────────────────────────────────────────────

/**
 * 테넌트의 현재 유효 플랜 반환
 *
 * 원칙: **이미 받은 돈만큼은 반드시 쓰게 한다.**
 * - taste : expiresAt 까지 유효
 * - pro / active : 유효
 * - pro / past_due : 결제 재시도 중 → 유예기간(PAST_DUE_GRACE_DAYS) 동안 유효
 * - pro / cancelled : 해지했어도 **결제한 기간(expiresAt)이 끝날 때까지** 유효
 */
export const PAST_DUE_GRACE_DAYS = 5;

export async function getTenantPlan(tenantId: string): Promise<PlanKey> {
  const sub = await prisma.subscription.findUnique({
    where: { tenantId },
    select: {
      plan: true,
      status: true,
      expiresAt: true,
      nextBillingAt: true,
      cancelledAt: true,
    },
  });

  if (!sub) return "free";
  const now = new Date();

  // taste 플랜: 만료 여부만 확인 (취소 개념 없음)
  if (sub.plan === "taste") {
    if (sub.status === "expired") return "free";
    if (sub.expiresAt && sub.expiresAt < now) return "free";
    return "taste";
  }

  if (sub.plan === "pro") {
    if (sub.status === "active") return "pro";

    // 해지 신청 → 이미 결제한 기간까지는 그대로 사용
    if (sub.status === "cancelled") {
      if (sub.expiresAt && sub.expiresAt > now) return "pro";
      return "free";
    }

    // 결제 실패 → 유예기간 동안은 끊지 않는다
    if (sub.status === "past_due") {
      const base = sub.nextBillingAt ?? sub.expiresAt;
      if (!base) return "free";
      const grace = new Date(base);
      grace.setDate(grace.getDate() + PAST_DUE_GRACE_DAYS);
      return grace > now ? "pro" : "free";
    }
  }

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
      expiresAt: nextBillingAt,
      billingRetry: 0,
      lastBillingError: null,
      lastBilledAt: new Date(),
    },
    update: {
      plan: "pro",
      billingType,
      status: "active",
      billingKey,
      customerKey,
      nextBillingAt,
      expiresAt: nextBillingAt,
      cancelledAt: null,
      billingRetry: 0,
      lastBillingError: null,
      lastBilledAt: new Date(),
    },
  });
}

/** 다음 청구일 계산 — 기준일에서 한 달(또는 1년) 뒤 */
export function addBillingPeriod(from: Date, billingType: string): Date {
  const next = new Date(from);
  if (billingType === "yearly") next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
  return next;
}

/** 자동결제 성공 처리 — 다음 청구일 이월, 실패 카운터 초기화 */
export async function applyRenewalSuccess(
  subscriptionId: string,
  billedFor: Date,
  billingType: string
) {
  const nextBillingAt = addBillingPeriod(billedFor, billingType);
  return prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: "active",
      nextBillingAt,
      expiresAt: nextBillingAt,
      billingRetry: 0,
      lastBillingError: null,
      lastBilledAt: new Date(),
    },
  });
}

/** 자동결제 실패 처리 — MAX_BILLING_RETRY 회 연속 실패하면 해지 */
export const MAX_BILLING_RETRY = 3;

export async function applyRenewalFailure(
  subscriptionId: string,
  retryCount: number,
  reason: string
) {
  const nextRetry = retryCount + 1;
  const giveUp = nextRetry >= MAX_BILLING_RETRY;

  return prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: giveUp ? "cancelled" : "past_due",
      billingRetry: nextRetry,
      lastBillingError: reason.slice(0, 500),
      ...(giveUp ? { cancelledAt: new Date() } : {}),
    },
  });
}

/**
 * 구독 취소 (해지 예약)
 * 이미 결제한 기간까지는 계속 쓸 수 있도록 expiresAt 을 남기고,
 * nextBillingAt 을 비워 다음 자동결제를 막는다.
 */
export async function cancelProPlan(tenantId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { tenantId },
    select: { nextBillingAt: true, expiresAt: true },
  });

  // 남은 이용기간 = 다음 청구일(=이번 결제분 종료일). 없으면 즉시 종료.
  const expiresAt = sub?.nextBillingAt ?? sub?.expiresAt ?? new Date();

  return prisma.subscription.update({
    where: { tenantId },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
      expiresAt,
      nextBillingAt: null,
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
  const date = getTodayKST();

  // 무제한 플랜
  if (!isFinite(PLANS[plan].aiAnalysisDaily as number)) {
    await prisma.aiUsageLog.upsert({
      where: { tenantId_date: { tenantId, date } },
      create: { tenantId, date, count: 1 },
      update: { count: { increment: 1 } },
    });
    return { allowed: true, used: 0, limit: Infinity };
  }

  // 첫날 여부: 오늘 이전 날짜의 로그가 없으면 첫날
  const prevLogCount = await prisma.aiUsageLog.count({
    where: { tenantId, date: { lt: date } },
  });
  const isFirstDay = prevLogCount === 0;

  const dailyLimit = PLANS[plan].aiAnalysisDaily as number;
  const firstDayLimit = PLANS[plan].aiAnalysisDailyFirst as number;
  const limit = isFirstDay ? firstDayLimit : dailyLimit;

  const log = await prisma.aiUsageLog.findUnique({
    where: { tenantId_date: { tenantId, date } },
  });
  const current = log?.count ?? 0;

  if (current >= limit) {
    return { allowed: false, used: current, limit };
  }

  await prisma.aiUsageLog.upsert({
    where: { tenantId_date: { tenantId, date } },
    create: { tenantId, date, count: 1 },
    update: { count: { increment: 1 } },
  });

  return { allowed: true, used: current + 1, limit };
}
