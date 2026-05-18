"use client";
import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const FEATURES = [
  { icon: "📸", title: "사진 찍고", sub: "원가계산 한방에" },
  { icon: "💱", title: "실시간 환율", sub: "자동 적용" },
  { icon: "📋", title: "바이어 제안서", sub: "간편 공유" },
  { icon: "🗂️", title: "시장조사", sub: "현장에서 즉시 정리" },
];

/** 카카오톡, 라인, 인스타그램 등 인앱브라우저 감지 */
function detectWebView(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  return /KAKAOTALK|NAVER|Line|Instagram|FB_IAB|FBAN|Twitter|Snapchat|MicroMessenger|WebView/i.test(ua);
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [isWebView, setIsWebView] = useState(false);
  const [showWebViewHint, setShowWebViewHint] = useState(false);

  useEffect(() => {
    setIsWebView(detectWebView());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email, password, redirect: false,
      });
      if (res?.error) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    // 구글은 인앱 브라우저에서 차단됨 → 안내 메시지 표시
    if (provider === "google" && isWebView) {
      setShowWebViewHint(true);
      return;
    }
    setSocialLoading(provider);
    await signIn(provider, { callbackUrl });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--primary)]">

      {/* ── 첫번째 블럭: 앱 소개 헤더 ── */}
      <div className="px-5 pt-14 pb-20 text-white relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute right-4 top-10 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -left-8 bottom-4 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative">
          <div className="text-center mb-7">
            <h1 className="text-4xl font-black tracking-tight mb-1">소싱킷</h1>
            <p className="text-sm text-white/60 font-medium">무역 소싱 관리 앱</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="bg-white/10 rounded-2xl px-3.5 py-3.5 backdrop-blur-sm border border-white/10"
              >
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="text-xs font-bold text-white leading-tight">{f.title}</div>
                <div className="text-[11px] text-white/70 leading-tight mt-0.5">{f.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 두번째 블럭: 로그인 폼 ── */}
      <div className="flex-1 bg-white rounded-t-[2rem] -mt-6 shadow-2xl overflow-y-auto">
        <div className="px-5 pt-8 pb-28">

          {/* 구글 인앱브라우저 안내 */}
          {showWebViewHint && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5 text-sm">
              <div className="font-bold text-amber-700 mb-1">⚠️ 구글 로그인 안내</div>
              <div className="text-amber-600 leading-relaxed">
                카카오톡/앱 내 브라우저에서는 구글 로그인이 지원되지 않습니다.
                <br />
                <strong>우측 하단 … 버튼 → 기본 브라우저로 열기</strong>를 선택해 주세요.
              </div>
              <button
                onClick={() => setShowWebViewHint(false)}
                className="mt-2 text-xs text-amber-500 underline"
              >
                닫기
              </button>
            </div>
          )}

          {/* 소셜 로그인 */}
          <div className="space-y-3 mb-6">
            {/* 카카오 */}
            <button
              type="button"
              onClick={() => handleSocialLogin("kakao")}
              disabled={!!socialLoading}
              className="w-full bg-[#FEE500] text-[#3C1E1E] rounded-xl py-3.5 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M10 2C5.582 2 2 4.918 2 8.514c0 2.26 1.413 4.247 3.556 5.41l-.906 3.377c-.08.297.27.534.52.352l4.01-2.701C9.453 14.985 9.724 15 10 15c4.418 0 8-2.918 8-6.486S14.418 2 10 2z" fill="#3C1E1E"/>
              </svg>
              {socialLoading === "kakao" ? "연결 중..." : "카카오로 시작하기"}
            </button>

            {/* 구글 */}
            <button
              type="button"
              onClick={() => handleSocialLogin("google")}
              disabled={!!socialLoading}
              className="w-full bg-white text-gray-700 border border-gray-300 rounded-xl py-3.5 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 relative"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {socialLoading === "google" ? "연결 중..." : "구글로 시작하기"}
              {isWebView && (
                <span className="absolute right-3 text-[10px] text-amber-500 font-normal">외부브라우저 필요</span>
              )}
            </button>

            {/* 위챗 */}
            <button
              type="button"
              onClick={() => handleSocialLogin("wechat")}
              disabled={!!socialLoading}
              className="w-full bg-[#07C160] text-white rounded-xl py-3.5 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 relative"
            >
              {/* 위챗 아이콘 */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M9.5 4C5.36 4 2 6.91 2 10.5c0 1.98 1.02 3.75 2.63 4.97L4 18l2.96-1.48A8.6 8.6 0 009.5 17c.34 0 .67-.02 1-.05A5.5 5.5 0 0110 15.5C10 12.46 12.91 10 16.5 10c.35 0 .69.03 1.03.07C16.88 6.6 13.55 4 9.5 4z" fill="white"/>
                <path d="M16.5 11.5c-2.76 0-5 1.79-5 4s2.24 4 5 4c.65 0 1.27-.1 1.84-.28L21 20.5l-.64-2.43C21.33 17.16 22 16.1 22 15.5c0-2.21-2.24-4-5.5-4z" fill="white" opacity="0.8"/>
              </svg>
              {socialLoading === "wechat" ? "연결 중..." : "위챗으로 시작하기 (微信)"}
              <span className="absolute right-3 text-[10px] text-green-100 font-normal">준비중</span>
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">또는 이메일로 로그인</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* 이메일 로그인 */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block font-medium">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary)] bg-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block font-medium">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary)] bg-white"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--primary)] text-white rounded-xl py-3.5 font-bold text-sm disabled:opacity-50"
              >
                {loading ? "로그인 중..." : "이메일로 로그인"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            아직 계정이 없으신가요?{" "}
            <Link href="/signup" className="text-[var(--primary)] font-bold">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--primary)]" />}>
      <LoginForm />
    </Suspense>
  );
}
