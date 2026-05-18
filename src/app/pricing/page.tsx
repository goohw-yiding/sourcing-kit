"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Check, Zap, Star, ArrowLeft, Loader2 } from "lucide-react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

const PRO_PRICE = Number(process.env.NEXT_PUBLIC_PRO_PRICE) || 19900;
const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;

const FREE_FEATURES = [
  "상품 등록 최대 10개",
  "공급업체 최대 5곳",
  "견적서 최대 3건",
  "환율 계산기",
  "AI 분석 하루 3회",
];

const PRO_FEATURES = [
  "상품 무제한 등록",
  "공급업체 무제한",
  "견적서 무제한",
  "환율 계산기",
  "AI 분석 무제한",
  "엑셀 내보내기",
  "주변 시장 검색",
  "카카오페이 · 네이버페이 · 카드 결제",
  "우선 고객 지원",
];

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState<{ plan: string; nextBillingAt?: string } | null>(null);
  const [loading, setLoading] = useState(false);
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

  const handleProSubscribe = async () => {
    if (!session) {
      router.push("/login?callbackUrl=/pricing");
      return;
    }

    setLoading(true);
    try {
      const toss = await loadTossPayments(CLIENT_KEY);
      // 고객 키: 테넌트 ID 기반 (일관성 유지)
      const customerKey = `customer_${session.user.tenantId}`;
      const payment = toss.payment({ customerKey });

      await payment.requestBillingAuth({
        method: "CARD",
        successUrl: `${window.location.origin}/payment/billing`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail: session.user.email,
        customerName: session.user.name,
      });
    } catch (err) {
      console.error(err);
      alert("결제 창을 열지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const isPro = subscription?.plan === "pro";

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
        <div className="text-center space-y-1 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">소싱킷 플랜</h2>
          <p className="text-gray-500 text-sm">나에게 맞는 플랜을 선택하세요</p>
        </div>

        {/* 무료 플랜 */}
        <div className={`bg-white rounded-2xl border-2 p-5 space-y-4 ${!isPro ? "border-[var(--primary)]" : "border-gray-200"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900 text-lg">무료 플랜</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₩0<span className="text-base font-normal text-gray-400">/월</span>
              </p>
            </div>
            {!isPro && !subLoading && (
              <span className="bg-[var(--primary)] text-white text-xs font-bold px-3 py-1 rounded-full">현재 플랜</span>
            )}
          </div>
          <ul className="space-y-2">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-gray-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro 플랜 */}
        <div className={`rounded-2xl border-2 p-5 space-y-4 relative overflow-hidden ${isPro ? "border-[var(--primary)] bg-white" : "border-[var(--primary)] bg-gradient-to-br from-orange-50 to-white"}`}>
          {/* 추천 배지 */}
          <div className="absolute top-3 right-3">
            <span className="bg-[var(--primary)] text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3" /> 추천
            </span>
          </div>

          <div>
            <p className="font-bold text-gray-900 text-lg flex items-center gap-1">
              <Zap className="w-5 h-5 text-[var(--primary)]" /> Pro 플랜
            </p>
            <div className="mt-1">
              <span className="text-2xl font-bold text-gray-900">
                ₩{PRO_PRICE.toLocaleString()}
              </span>
              <span className="text-base font-normal text-gray-400">/월</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">매월 자동 결제 · 언제든 취소 가능</p>
          </div>

          <ul className="space-y-2">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-[var(--primary)] shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {subLoading ? (
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ) : isPro ? (
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
              onClick={handleProSubscribe}
              disabled={loading}
              className="w-full bg-[var(--primary)] text-white font-bold py-3.5 rounded-xl text-base disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                "⚡ Pro 구독하기"
              )}
            </button>
          )}
        </div>

        {/* 결제 수단 안내 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 font-semibold mb-2">지원 결제 수단</p>
          <div className="flex gap-3 flex-wrap">
            {["카카오페이", "네이버페이", "신용카드", "체크카드"].map((m) => (
              <span key={m} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-lg font-medium">
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* 안내 */}
        <p className="text-xs text-gray-400 text-center px-4">
          Pro 구독은 언제든지 취소할 수 있으며, 취소 후에도 해당 월 말까지 이용 가능합니다.
          결제는 토스페이먼츠를 통해 안전하게 처리됩니다.
        </p>
      </div>
    </div>
  );
}
