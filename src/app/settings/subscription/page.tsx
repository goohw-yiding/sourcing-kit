"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Zap, Clock, BarChart2, Loader2, AlertTriangle, Gift } from "lucide-react";
import Link from "next/link";

interface SubData {
  plan: string;
  planName: string;
  status: string;
  billingType: string;
  nextBillingAt: string | null;
  expiresAt: string | null;
  cancelledAt: string | null;
  limits: {
    productLimit: number;
    supplierLimit: number;
    proposalLimit: number;
    aiAnalysisDaily: number;
  };
  usage: {
    aiUsedToday: number;
    aiRemainingToday: number | null;
  };
  payments: {
    id: string;
    orderId: string;
    amount: number;
    status: string;
    method: string | null;
    approvedAt: string | null;
  }[];
}

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined) return "-";
  if (!isFinite(n)) return "무제한";
  return n.toLocaleString();
}

export default function SubscriptionPage() {
  const router = useRouter();
  const [data, setData] = useState<SubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cancelDone, setCancelDone] = useState(false);

  // 초대 코드
  const [giftCode, setGiftCode]       = useState("");
  const [giftLoading, setGiftLoading] = useState(false);
  const [giftResult, setGiftResult]   = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleGiftCode = async () => {
    if (!giftCode.trim()) return;
    setGiftLoading(true);
    setGiftResult(null);
    try {
      const res = await fetch("/api/gift-code/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: giftCode }),
      });
      const d = await res.json() as { ok?: boolean; message?: string; error?: string };
      if (res.ok && d.ok) {
        setGiftResult({ ok: true, message: d.message ?? "활성화 완료!" });
        setGiftCode("");
        // 구독 정보 갱신
        const fresh = await fetch("/api/subscription").then(r => r.json());
        setData(fresh);
      } else {
        setGiftResult({ ok: false, message: d.error ?? "코드 사용 실패" });
      }
    } catch {
      setGiftResult({ ok: false, message: "네트워크 오류가 발생했습니다" });
    } finally {
      setGiftLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch("/api/subscription", { method: "DELETE" });
      const d = await res.json();
      if (d.ok) {
        setCancelDone(true);
        setShowConfirm(false);
        // 구독 상태 갱신
        const fresh = await fetch("/api/subscription").then((r) => r.json());
        setData(fresh);
      }
    } finally {
      setCancelling(false);
    }
  };

  const planLabel = {
    free: { label: "무료", color: "text-gray-500", bg: "bg-gray-100" },
    taste: { label: "맛보기", color: "text-amber-700", bg: "bg-amber-100" },
    pro: { label: "Pro", color: "text-orange-600", bg: "bg-orange-100" },
  }[data?.plan ?? "free"] ?? { label: "무료", color: "text-gray-500", bg: "bg-gray-100" };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-1 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-gray-900">구독 관리</h1>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-gray-300" />
          </div>
        ) : !data ? (
          <p className="text-center text-gray-400 py-20">불러오기 실패</p>
        ) : (
          <>
            {/* 현재 플랜 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">현재 플랜</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xl font-bold ${planLabel.color}`}>{planLabel.label}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${planLabel.bg} ${planLabel.color}`}>
                      {data.status === "cancelled" ? "취소됨" : "이용 중"}
                    </span>
                  </div>
                </div>
                {data.plan !== "pro" && (
                  <Link
                    href="/pricing"
                    className="bg-[var(--primary)] text-white text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-1"
                  >
                    <Zap className="w-4 h-4" /> 업그레이드
                  </Link>
                )}
              </div>

              {/* 만료/결제일 */}
              {data.plan === "taste" && data.expiresAt && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs text-amber-700 font-semibold">맛보기 만료일</p>
                    <p className="text-sm font-bold text-amber-800">
                      {new Date(data.expiresAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                </div>
              )}
              {data.plan === "pro" && data.nextBillingAt && data.status !== "cancelled" && (
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5">
                  <Zap className="w-4 h-4 text-orange-500 shrink-0" />
                  <div>
                    <p className="text-xs text-orange-600 font-semibold">
                      {data.billingType === "yearly" ? "연간" : "월간"} 구독 · 다음 결제일
                    </p>
                    <p className="text-sm font-bold text-orange-700">
                      {new Date(data.nextBillingAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                </div>
              )}
              {data.status === "cancelled" && data.plan === "pro" && (
                <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-500">
                  구독이 취소되었습니다. 이번 달 말까지 Pro 기능을 이용할 수 있어요.
                </div>
              )}
            </div>

            {/* 오늘 AI 사용 현황 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-bold text-gray-700">오늘 AI 분석 사용량</p>
              </div>
              {isFinite(data.limits.aiAnalysisDaily) ? (
                <>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-2xl font-bold text-gray-900">{data.usage.aiUsedToday}</span>
                    <span className="text-sm text-gray-400">/ {data.limits.aiAnalysisDaily}회</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-[var(--primary)] h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (data.usage.aiUsedToday / data.limits.aiAnalysisDaily) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    오늘 {data.usage.aiRemainingToday}회 남음 · 매일 자정 초기화
                  </p>
                </>
              ) : (
                <p className="text-lg font-bold text-green-600">무제한 ∞</p>
              )}
            </div>

            {/* 플랜 한도 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-sm font-bold text-gray-700 mb-3">플랜 한도</p>
              <div className="space-y-2">
                {[
                  { label: "상품 등록", value: data.limits.productLimit },
                  { label: "공급업체 등록", value: data.limits.supplierLimit },
                  { label: "견적서 생성", value: data.limits.proposalLimit },
                  { label: "AI 분석 (일일)", value: data.limits.aiAnalysisDaily },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-600">{label}</span>
                    <span className={`text-sm font-bold ${isFinite(value) ? "text-gray-900" : "text-green-600"}`}>
                      {fmt(value)}{isFinite(value) ? "개" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 결제 내역 */}
            {data.payments.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-sm font-bold text-gray-700 mb-3">결제 내역</p>
                <div className="space-y-2">
                  {data.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm text-gray-700 font-medium">
                          ₩{p.amount.toLocaleString()}
                        </p>
                        {p.approvedAt && (
                          <p className="text-xs text-gray-400">
                            {new Date(p.approvedAt).toLocaleDateString("ko-KR")}
                            {p.method && ` · ${p.method}`}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.status === "done" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {p.status === "done" ? "결제완료" : p.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 초대 코드 입력 ── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-4 h-4 text-purple-500" />
                <p className="text-sm font-bold text-gray-700">초대 코드 입력</p>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                받으신 초대 코드를 입력하면 Pro 플랜이 무료로 활성화됩니다.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={giftCode}
                  onChange={e => setGiftCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && handleGiftCode()}
                  placeholder="GIFT-XXXX-XXXX"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:border-purple-400 uppercase"
                  maxLength={14}
                />
                <button
                  onClick={handleGiftCode}
                  disabled={giftLoading || !giftCode.trim()}
                  className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold disabled:opacity-40 flex items-center gap-1.5"
                >
                  {giftLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : "적용"}
                </button>
              </div>
              {giftResult && (
                <div className={`mt-2.5 text-sm font-medium px-3 py-2 rounded-xl ${
                  giftResult.ok
                    ? "bg-green-50 text-green-700 border border-green-100"
                    : "bg-red-50 text-red-600 border border-red-100"
                }`}>
                  {giftResult.ok ? "🎉 " : "⚠️ "}{giftResult.message}
                </div>
              )}
            </div>

            {/* 취소 버튼 (Pro 구독 중이고 아직 취소 안 한 경우만) */}
            {data.plan === "pro" && data.status === "active" && !cancelDone && (
              <button
                onClick={() => setShowConfirm(true)}
                className="w-full py-3 text-sm text-gray-400 underline"
              >
                구독 취소
              </button>
            )}
            {cancelDone && (
              <p className="text-center text-sm text-gray-400">구독이 취소 처리됐습니다.</p>
            )}
          </>
        )}
      </div>

      {/* 취소 확인 모달 */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900">구독을 취소하시겠어요?</p>
                <p className="text-sm text-gray-500 mt-1">
                  취소 후에도 이번 달 말까지 Pro 기능을 이용할 수 있습니다.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600"
              >
                유지하기
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : "취소하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
