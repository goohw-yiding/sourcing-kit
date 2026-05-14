"use client";
import { useState } from "react";

interface Props {
  phrases: Array<{ cn: string; pinyin: string; kr: string }>;
}

export function ChinesePhrase({ phrases }: Props) {
  const [open, setOpen] = useState(false);

  const speak = (cn: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(cn);
    u.lang = "zh-CN";
    u.rate = 0.8;
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-red-500 font-medium bg-red-50 border border-red-100 rounded-full px-2.5 py-1 active:scale-95 transition-transform"
      >
        <span>🇨🇳</span>
        <span>현장 중국어 {open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {phrases.map((p, i) => (
            <div key={i} className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-lg font-bold text-red-700 leading-tight">{p.cn}</div>
                <div className="text-xs text-red-400 mt-0.5">{p.pinyin}</div>
                <div className="text-xs text-gray-500 mt-0.5">{p.kr}</div>
              </div>
              <button
                onClick={() => speak(p.cn)}
                className="shrink-0 w-9 h-9 bg-red-500 text-white rounded-full flex items-center justify-center text-base active:scale-95 shadow"
                title="발음 듣기"
              >
                🔊
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
