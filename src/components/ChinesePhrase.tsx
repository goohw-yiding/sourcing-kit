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
      audioRef.current = null;
    }
    if (playing === idx) {
      setPlaying(null);
      return;
    }

    setPlaying(idx);
    setError(null);

    // 1차: 서버 프록시 (Google TTS) — 가장 자연스러운 중국어 음성
    try {
      const url = `/api/tts?text=${encodeURIComponent(cn)}&lang=zh-CN`;
      const audio = new Audio(url);
      audioRef.current = audio;

      await new Promise<void>((resolve, reject) => {
        audio.oncanplaythrough = () => {
          audio.play().then(resolve).catch(reject);
        };
        audio.onerror = () => reject(new Error("audio load error"));
        audio.onended = () => {
          setPlaying(null);
        };
        // 타임아웃 3초
        setTimeout(() => reject(new Error("timeout")), 3000);
      });
      return;
    } catch (e) {
      console.warn("[TTS] Google TTS 실패, Web Speech API 시도:", e);
    }

    // 2차 폴백: Web Speech API (기기 내장 음성)
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const trySpeak = () => {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(cn);
        u.lang = "zh-CN";
        u.rate = 0.8;

        // zh-CN 음성 선택 (있으면)
        const voices = window.speechSynthesis.getVoices();
        const zhVoice =
          voices.find((v) => v.lang === "zh-CN") ||
          voices.find((v) => v.lang.startsWith("zh"));
        if (zhVoice) u.voice = zhVoice;

        u.onend = () => setPlaying(null);
        u.onerror = () => {
          setPlaying(null);
          setError(idx);
        };

        window.speechSynthesis.speak(u);
      };

      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        // 음성 로딩 대기
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
          trySpeak();
        };
      } else {
        trySpeak();
      }
      return;
    }

    // 둘 다 실패
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
            <div
              key={i}
              className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="text-lg font-bold text-red-700 leading-tight">{p.cn}</div>
                <div className="text-xs text-red-400 mt-0.5">{p.pinyin}</div>
                <div className="text-xs text-gray-500 mt-0.5">{p.kr}</div>
                {error === i && (
                  <div className="text-[10px] text-orange-500 mt-0.5">음성 재생 불가 (네트워크 확인)</div>
                )}
              </div>

              <button
                onClick={() => speak(p.cn, i)}
                className={`shrink-0 w-9 h-9 text-white rounded-full flex items-center justify-center text-base active:scale-95 shadow transition-colors ${
                  playing === i
                    ? "bg-red-300 animate-pulse"
                    : error === i
                    ? "bg-orange-400"
                    : "bg-red-500"
                }`}
                title="발음 듣기"
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
