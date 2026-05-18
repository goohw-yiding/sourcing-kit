"use client";

import { useState, useEffect } from "react";
import { X, Bell, Users, Star } from "lucide-react";

interface Props {
  onClose: () => void;
  trigger?: "limit" | "pricing"; // limit: 무료 한도 초과, pricing: 가격 페이지에서
}

export function WaitlistModal({ onClose, trigger = "limit" }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/waitlist")
      .then((r) => r.json())
      .then((d) => setCount(d.count ?? null))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === "loading") return;

    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "오류가 발생했습니다");
        return;
      }

      setStatus("success");
      if (data.already) {
        setMessage("이미 등록되어 있어요 😊 출시 시 알려드릴게요!");
      } else {
        setMessage(`등록 완료! 현재 ${data.count}번째 대기자입니다 🎉`);
        setCount(data.count);
      }
    } catch {
      setStatus("error");
      setMessage("네트워크 오류가 발생했습니다");
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl w-full max-w-sm pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* 닫기 버튼 */}
        <div className="flex justify-end px-4">
          <button onClick={onClose} className="p-2 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-8 space-y-5">
          {/* 아이콘 + 제목 */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark,var(--primary))] flex items-center justify-center mx-auto mb-3 shadow-lg">
              {trigger === "limit" ? (
                <Star className="w-8 h-8 text-white" />
              ) : (
                <Bell className="w-8 h-8 text-white" />
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {trigger === "limit" ? "무료 한도 도달" : "Pro 플랜 사전 등록"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {trigger === "limit"
                ? "더 많이 사용하려면 Pro 플랜이 필요해요"
                : "출시 알림을 받고 얼리버드 혜택을 누리세요"}
            </p>
          </div>

          {/* 사회적 증거 */}
          {count !== null && count > 0 && (
            <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-xl py-2.5">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                현재 <span className="font-bold text-gray-900">{count.toLocaleString()}명</span> 사전 등록 중
              </span>
            </div>
          )}

          {/* 혜택 */}
          <div className="space-y-2">
            {[
              { emoji: "🎁", text: "얼리버드 30% 할인", sub: "출시 시 자동 적용" },
              { emoji: "⚡", text: "Pro 기능 우선 접근", sub: "무제한 상품·AI 분석" },
              { emoji: "🔔", text: "출시 즉시 알림", sub: "이메일로 바로 안내" },
            ].map(({ emoji, text, sub }) => (
              <div key={text} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                <span className="text-xl w-8 text-center">{emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{text}</p>
                  <p className="text-xs text-gray-400">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 등록 폼 or 완료 */}
          {status === "success" ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-4 text-center">
              <p className="text-green-700 font-bold">{message}</p>
              <p className="text-green-600 text-sm mt-1">출시되면 바로 연락드릴게요 😊</p>
              <button
                onClick={onClose}
                className="mt-3 text-sm text-green-600 font-medium underline"
              >
                닫기
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소를 입력하세요"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-[var(--primary)] transition-colors"
                disabled={status === "loading"}
                autoFocus
              />
              {status === "error" && (
                <p className="text-red-500 text-sm px-1">{message}</p>
              )}
              <button
                type="submit"
                disabled={status === "loading" || !email.trim()}
                className="w-full bg-[var(--primary)] disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-xl py-3.5 font-bold text-base transition-colors active:scale-[0.98]"
              >
                {status === "loading" ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    등록 중...
                  </span>
                ) : (
                  "🔔 사전 등록하기"
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full text-gray-400 text-sm py-1"
              >
                나중에 할게요
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
