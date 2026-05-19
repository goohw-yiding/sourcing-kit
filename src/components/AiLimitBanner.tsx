"use client";

/**
 * AI 분석 일일 한도 초과 시 표시되는 배너/토스트
 * usage: <AiLimitBanner used={3} limit={3} plan="free" onUpgrade={() => router.push('/pricing')} />
 */
import { useRouter } from "next/navigation";
import { Zap, X } from "lucide-react";
import { useState } from "react";

interface Props {
  used: number;
  limit: number;
  plan: string;
  onClose?: () => void;
}

export function AiLimitBanner({ used, limit, plan, onClose }: Props) {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  const nextPlan = plan === "free" ? "맛보기" : "Pro";
  const nextLimit = plan === "free" ? "일 20회" : "무제한";

  const handleClose = () => {
    setHidden(true);
    onClose?.();
  };

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-gray-900 text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3">
        <div className="bg-orange-500 rounded-xl p-2 shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">오늘 AI 분석 {limit}회 소진</p>
          <p className="text-xs text-gray-300 mt-0.5">
            {nextPlan} 플랜으로 업그레이드하면 {nextLimit} 분석 가능해요.
          </p>
          <button
            onClick={() => router.push("/pricing")}
            className="mt-2 bg-[var(--primary)] text-white text-xs font-bold px-3 py-1.5 rounded-lg"
          >
            ⚡ {nextPlan} 플랜 보기
          </button>
        </div>
        <button onClick={handleClose} className="text-gray-400 shrink-0 p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
