"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Check, Zap, Star, ArrowLeft, Loader2, X, Clock } from "lucide-react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;
const TASTE_PRICE = 9900;
const PRO_MONTHLY = 7900;
const PRO_YEARLY_MONTH = 5900;   // 월 환산
const PRO_YEARLY_TOTAL = 70800;  // 연 일시결제

const FREE_FEATURES = [
  { text: "상품 등록 최대 10개", ok: true },
  { text: "공급업체 최대 5곳", ok: true },
  { text: "견적서 최대 3건", ok: true },
  { text: "AI 시장분석 하루 3회", ok: true },
  { text: "환율 계산기", ok: true },
  { text: "엑셀/PDF 내보내기", ok: false },
  { text: "팀 공유 기능", ok: false },
];

const TASTE_FEATURES = [
  { text: "상품 등록 최대 100개", ok: true },
  { text: "공급업체 최대 30곳", ok: true },
  { text: "견적서 최대 20건", ok: true },
  { text: "AI 시장분석 하루 20회", ok: true },
  { text: "환율 계산기", ok: true },
  { text: "엑셀/PDF 내보내기", ok: true },
  { text: "팀 공유 기능", ok: false },
];

const PRO_FEATURES = [
  { text: "상품 무제한 등록", ok: true },
  { text: "공급업체 무제한", ok: true },
  { text: "견적서 무제한", ok: true },
  { text: "AI 시장분석 무제한", ok: true },
  { text: "환율 계산기", ok: true },
  { text: "엑셀/PDF 내보내기", ok: true },
  { text: "팀 공유 기능", ok: true },
  { text: "우선 고객 지원", ok: true },
];

type BillingTab = "monthly" | "yearly";

interface SubInfo {
  plan: string;
  status: string;
  nextBillingAt?: string;
  expiresAt?: string;
}

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubInfo | null>(null);
  const [billingTab, setBillingTab] = useState<BillingTab>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [subLoading, setSubLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/subscription")
        .then((r) => r.json())
        .then((d) => setSubscription(d))
        .catch(() => {})
        .finally(() => setSubLoading(false));
    } else if (status !== "loading") {
      setSubLoading(false);
    }
  }, [status]);

  const currentPlan = subscription?.plan ?? "free";

  // 맛보기: 토스 단건결제
  const handleTaste = async () => {
    if (!session) { router.push("/login?callbackUrl=/pricing"); return; }
    setLoadingPlan("taste");
    try {
      const toss = await loadTossPayments(CLIENT_KEY);
      const customerKey = `customer_${session.user.tenantId}`;
      const payment = toss.payment({ customerKey });
      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: TASTE_PRICE },
        orderId: `taste_${Date.now()}`,
        orderName: "소싱킷 맛보기 30일",
        successUrl: `${window.location.origin}/payment/billing?planType=taste`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail: session.user.email ?? undefined,
        customerName: session.user.name ?? undefined,
      });
    } catch (err) {
      console.error(err);
      alert("결제 창을 열지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setLoadingPlan(null);
    }
  };

  // Pro: 빌링키 기반 자동결제
  const handlePro = async (billingType: "monthly" | "yearly") => {
    if (!session) { router.push("/login?callbackUrl=/pricing"); return; }
    setLoadingPlan(billingType);
    try {
      const toss = await loadTossPayments(CLIENT_KEY);
      const customerKey = `customer_${session.user.tenantId}`;
      const payment = toss.payment({ customerKey });
      await payment.requestBillingAuth({
        method: "CARD",
        successUrl: `${window.location.origin}/payment/billing?planType=${billingType}`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail: session.user.email ?? undefined,
        customerName: session.user.name ?? undefined,
      });
    } catch (err) {
      console.error(err);
      alert("결제 창을 열지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-1 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-gray-900">플랜 선택</h1>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-4">
        {/* 타이틀 */}
        <div className="text-center space-y-1 mb-2">
          <h2 className="text-2xl font-bold text-gray-900">소싱킷 플랜</h2>
          <p className="text-gray-500 text-sm">출장 패턴에 맞는 플랜을 선택하세요</p>
        </div>

        {/* Pro 월/연 탭 */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setBillingTab("monthly")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${billingTab === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
          >
            월결제
          </button>
          <button
            onClick={() => setBillingTab("yearly")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${billingTab === "yearly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
          >
            연결제
            <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">25% 할인</span>
          </button>
        </div>

        {/* ── FREE ── */}
        <div className={`bg-white rounded-2xl border-2 p-5 space-y-4 ${currentPlan === "free" ? "border-[var(--primary)]" : "border-gray-100"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-700 text-base">무료</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">₩0</p>
            </div>
            {!subLoading && currentPlan === "free" && (
              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">현재 플랜</span>
            )}
          </div>
          <ul className="space-y-2">
            {FREE_FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-2 text-sm">
                {f.ok
                  ? <Check className="w-4 h-4 text-gray-400 shrink-0" />
                  : <X className="w-4 h-4 text-gray-300 shrink-0" />}
                <span className={f.ok ? "text-gray-600" : "text-gray-300"}>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── 맛보기 ── */}
        <div className={`bg-white rounded-2xl border-2 p-5 space-y-4 ${currentPlan === "taste" ? "border-[var(--primary)]" : "border-amber-200"}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-amber-700 text-base flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> 맛보기
              </p>
              <div className="mt-0.5">
                <span className="text-2xl font-bold text-gray-900">₩{TASTE_PRICE.toLocaleString()}</span>
                <span className="text-sm text-gray-400 ml-1">/ 30일</span>
              </div>
              <p className="text-xs text-amber-600 mt-0.5">1회 결제 · 자동 갱신 없음</p>
            </div>
            {!subLoading && currentPlan === "taste" && (
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">이용 중</span>
            )}
          </div>

          <ul className="space-y-2">
            {TASTE_FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-2 text-sm">
                {f.ok
                  ? <Check className="w-4 h-4 text-amber-500 shrink-0" />
                  : <X className="w-4 h-4 text-gray-300 shrink-0" />}
                <span className={f.ok ? "text-gray-700" : "text-gray-300"}>{f.text}</span>
              </li>
            ))}
          </ul>

          {subLoading ? (
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ) : currentPlan === "taste" ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center">
              <p className="text-amber-700 font-bold text-sm">⏱ 맛보기 이용 중</p>
              {subscription?.expiresAt && (
                <p className="text-amber-600 text-xs mt-0.5">
                  만료일: {new Date(subscription.expiresAt).toLocaleDateString("ko-KR")}
                </p>
              )}
            </div>
          ) : currentPlan === "pro" ? (
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
              <p className="text-gray-400 text-sm">Pro 플랜 이용 중</p>
            </div>
          ) : (
            <button
              onClick={handleTaste}
              disabled={!!loadingPlan}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl text-base disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              {loadingPlan === "taste" ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 처리 중...</>
              ) : (
                "30일 맛보기 시작 ₩9,900"
              )}
            </button>
          )}
        </div>

        {/* ── Pro ── */}
        <div className={`rounded-2xl border-2 p-5 space-y-4 relative overflow-hidden ${currentPlan === "pro" ? "border-[var(--primary)] bg-white" : "border-[var(--primary)] bg-gradient-to-br from-orange-50 to-white"}`}>
          <div className="absolute top-3 right-3">
            <span className="bg-[var(--primary)] text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3" /> 추천
            </span>
          </div>

          <div>
            <p className="font-bold text-gray-900 text-base flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[var(--primary)]" /> Pro
            </p>
            <div className="mt-0.5">
              {billingTab === "yearly" ? (
                <>
                  <span className="text-2xl font-bold text-gray-900">₩{PRO_YEARLY_MONTH.toLocaleString()}</span>
                  <span className="text-sm text-gray-400 ml-1">/월</span>
                  <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold">
                    연 ₩{PRO_YEARLY_TOTAL.toLocaleString()} 일시결제
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5 line-through">월결제 ₩{PRO_MONTHLY.toLocaleString()}/월</p>
                </>
              ) : (
                <>
                  <span className="text-2xl font-bold text-gray-900">₩{PRO_MONTHLY.toLocaleString()}</span>
                  <span className="text-sm text-gray-400 ml-1">/월</span>
                  <p className="text-xs text-gray-400 mt-0.5">매월 자동 결제 · 언제든 취소</p>
                </>
              )}
            </div>
          </div>

          <ul className="space-y-2">
            {PRO_FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-[var(--primary)] shrink-0" />
                <span className="text-gray-700">{f.text}</span>
              </li>
            ))}
          </ul>

          {subLoading ? (
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ) : currentPlan === "pro" ? (
            <div className="space-y-2">
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
                <p className="text-green-700 font-bold text-sm">✅ Pro 플랜 이용 중</p>
                {subscription?.nextBillingAt && (
                  <p className="text-green-600 text-xs mt-0.5">
                    다음 결제일: {new Date(subscription.nextBillingAt).toLocaleDateString("ko-KR")}
                  </p>
                )}
              </div>
              <button
                onClick={() => router.push("/settings/subscription")}
                className="w-full py-2 text-sm text-gray-400 underline"
              >
                구독 관리
              </button>
            </div>
          ) : (
            <button
              onClick={() => handlePro(billingTab)}
              disabled={!!loadingPlan}
              className="w-full bg-[var(--primary)] text-white font-bold py-3.5 rounded-xl text-base disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              {(loadingPlan === "monthly" || loadingPlan === "yearly") ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 처리 중...</>
              ) : billingTab === "yearly" ? (
                `⚡ Pro 연구독 ₩${PRO_YEARLY_TOTAL.toLocaleString()}`
              ) : (
                `⚡ Pro 구독하기 ₩${PRO_MONTHLY.toLocaleString()}/월`
              )}
            </button>
          )}
        </div>

        {/* 비교 힌트 */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
          <p className="text-xs text-orange-700 font-semibold mb-1">💡 맛보기 vs 구독, 어떤 게 유리할까요?</p>
          <p className="text-xs text-orange-600">
            출장이 월 1회라면 맛보기(₩9,900)가 유리합니다.
            월 2회 이상이라면 Pro 구독(₩7,900/월)이 더 저렴해요.
          </p>
        </div>

        {/* 결제 수단 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 font-semibold mb-2">지원 결제 수단</p>
          <div className="flex gap-2 flex-wrap">
            {["카카오페이", "네이버페이", "신용카드", "체크카드"].map((m) => (
              <span key={m} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-lg font-medium">{m}</span>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center px-4 pb-4">
          결제는 토스페이먼츠를 통해 안전하게 처리됩니다.
          Pro 구독은 언제든지 취소 가능하며 취소 후에도 해당 월 말까지 이용 가능합니다.
        </p>
      </div>
    </div>
  );
}
