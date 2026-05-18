"use client";

import { useState, useEffect } from "react";
import { Bell, X, ChevronRight, Users } from "lucide-react";

interface Props {
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function WaitlistBanner({ onClose, showCloseButton = false }: Props) {
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
        setMessage("이미 등록된 이메일입니다 😊");
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
    <div className="mx-4 my-3 rounded-2xl overflow-hidden shadow-md">
      {/* 헤더 그라디언트 배너 */}
      <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark,var(--primary))] px-4 pt-4 pb-5 relative">
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-full bg-white/20 text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Pro 플랜 사전 등록</p>
            <p className="text-white/80 text-xs">출시 알림 + 얼리버드 30% 할인</p>
          </div>
        </div>

        {/* 사회적 증거 */}
        {count !== null && count > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <Users className="w-3.5 h-3.5 text-white/70" />
            <span className="text-white/90 text-xs font-medium">
              현재 <span className="font-bold text-white">{count.toLocaleString()}명</span> 대기 중
            </span>
          </div>
        )}

        {/* 폼 or 완료 */}
        {status === "success" ? (
          <div className="bg-white/15 rounded-xl px-4 py-3 text-center">
            <p className="text-white font-semibold text-sm">{message}</p>
            <p className="text-white/70 text-xs mt-1">출시 시 이메일로 알려드릴게요</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소 입력"
              className="flex-1 rounded-xl px-3 py-2.5 text-sm bg-white/90 placeholder-gray-400 text-gray-800 focus:outline-none focus:bg-white min-w-0"
              disabled={status === "loading"}
            />
            <button
              type="submit"
              disabled={status === "loading" || !email.trim()}
              className="bg-white text-[var(--primary)] font-bold text-sm rounded-xl px-4 py-2.5 flex items-center gap-1 disabled:opacity-50 shrink-0 active:scale-95 transition-transform"
            >
              {status === "loading" ? (
                <span className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>등록<ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="text-red-200 text-xs mt-2 pl-1">{message}</p>
        )}
      </div>

      {/* 혜택 리스트 */}
      <div className="bg-white border-t border-gray-100 px-4 py-3">
        <div className="flex justify-around text-center">
          {[
            { emoji: "🎁", text: "30% 할인" },
            { emoji: "⚡", text: "우선 접근" },
            { emoji: "🔔", text: "출시 알림" },
          ].map(({ emoji, text }) => (
            <div key={text} className="flex flex-col items-center gap-0.5">
              <span className="text-lg">{emoji}</span>
              <span className="text-xs text-gray-500 font-medium">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
