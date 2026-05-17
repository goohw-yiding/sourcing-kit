"use client";
import { useState, useRef, useCallback } from "react";

interface Props {
  phrases: Array<{ cn: string; pinyin: string; kr: string }>;
}

export function ChinesePhrase({ phrases }: Props) {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);
  const [error, setError] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (cn: string, idx: number) => {
    // 재생 중이면 정지
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (playing === idx) {
      setPlaying(null);
      return;
    }

    setPlaying(idx);
    setError(null);

    // 1차: 서버 TTS (Edge TTS → Google TTS 폴백)
    // fetch → blob → objectURL 방식 (모바일 자동재생 제한 우회)
    try {
      const res = await fetch(`/api/tts?text=${encodeURIComponent(cn)}&lang=zh-CN`);
      if (!res.ok) throw new Error(`TTS API ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const audio = new Audio();
      audioRef.current = audio;

      audio.src = url;
      audio.onended = () => {
        setPlaying(null);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setPlaying(null);
        URL.revokeObjectURL(url);
      };

      await audio.play();
      return;
    } catch (e) {
      console.warn("[TTS] 서버 TTS 실패, Web Speech 시도:", e);
    }

    // 2차 폴백: Web Speech API (기기 내장 음성)
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        await new Promise<void>((resolve, reject) => {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(cn);
          u.lang = "zh-CN";
          u.rate = 0.8;

          const voices = window.speechSynthesis.getVoices();
          const zhVoice =
            voices.find((v) => v.lang === "zh-CN") ||
            voices.find((v) => v.lang.startsWith("zh"));
          if (zhVoice) u.voice = zhVoice;

          u.onend = () => { setPlaying(null); resolve(); };
          u.onerror = (e) => reject(e);

          // 음성 로딩 대기 후 실행
          if (voices.length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
              window.speechSynthesis.onvoiceschanged = null;
              window.speechSynthesis.speak(u);
            };
          } else {
            window.speechSynthesis.speak(u);
          }

          setTimeout(() => reject(new Error("timeout")), 5000);
        });
        return;
      } catch (e) {
        console.warn("[TTS] Web Speech 실패:", e);
      }
    }

    // 모두 실패
    setPlaying(null);
    setError(idx);
  }, [playing]);

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
                {error === i && (
                  <div className="text-[10px] text-orange-500 mt-0.5">음성 재생 실패 · 네트워크를 확인해주세요</div>
                )}
              </div>
              <button
                onClick={() => speak(p.cn, i)}
                className={`shrink-0 w-10 h-10 text-white rounded-full flex items-center justify-center text-lg active:scale-95 shadow transition-all ${
                  playing === i ? "bg-red-300 scale-95" :
                  error === i  ? "bg-orange-400" : "bg-red-500"
                }`}
              >
                {playing === i ? "⏸" : error === i ? "⚠️" : "🔊"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
