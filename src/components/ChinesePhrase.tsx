"use client";
import { useState, useRef, useCallback } from "react";

interface Props {
  phrases: Array<{ cn: string; pinyin: string; kr: string; pinyinKr?: string }>;
}

export function ChinesePhrase({ phrases }: Props) {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);
  const [error, setError] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Web Speech API 폴백 (기기 내장 음성)
  const tryWebSpeech = useCallback((cn: string, idx: number) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setError(idx);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(cn);
    u.lang = "zh-CN";
    u.rate = 0.8;

    const applyVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const zhVoice =
        voices.find((v) => v.lang === "zh-CN") ||
        voices.find((v) => v.lang.startsWith("zh"));
      if (zhVoice) u.voice = zhVoice;
    };

    applyVoice();
    u.onend = () => setPlaying(null);
    u.onerror = () => setError(idx);

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        applyVoice();
        window.speechSynthesis.speak(u);
      };
    } else {
      window.speechSynthesis.speak(u);
    }
  }, []);

  const speak = useCallback((cn: string, idx: number) => {
    // 재생 중이면 정지
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();

    if (playing === idx) {
      setPlaying(null);
      return;
    }

    setPlaying(idx);
    setError(null);

    // ✅ iOS 자동재생 핵심 수정:
    // fetch + blob 방식 대신 audio.src 를 API URL 로 직접 설정 후 즉시 play()
    // → 사용자 클릭 이벤트 컨텍스트가 깨지지 않아 iOS Safari 에서도 작동
    const audio = new Audio();
    audioRef.current = audio;
    audio.preload = "auto";

    audio.onended = () => {
      setPlaying(null);
      audioRef.current = null;
    };

    audio.onerror = () => {
      setPlaying(null);
      audioRef.current = null;
      // 서버 TTS 실패 → Web Speech API 폴백
      tryWebSpeech(cn, idx);
    };

    audio.src = `/api/tts?text=${encodeURIComponent(cn)}&lang=zh-CN`;

    audio.play().catch(() => {
      setPlaying(null);
      audioRef.current = null;
      tryWebSpeech(cn, idx);
    });
  }, [playing, tryWebSpeech]);

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
                <div className="text-xs text-blue-400 mt-0.5">{p.pinyinKr}</div>
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
