"use client";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

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
    setSocialLoading(provider);
    await signIn(provider, { callbackUrl });
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex flex-col">
      <div className="bg-[var(--primary)] text-white px-5 pt-16 pb-8 text-center">
        <div className="text-3xl font-black mb-1">소싱킷</div>
        <p className="text-sm text-white/70">무역 소싱 관리 앱</p>
      </div>
      <div className="flex-1 px-5 py-8">
        {/* 소셜 로그인 */}
        <div className="space-y-3 mb-6">
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
          <button
            type="button"
            onClick={() => handleSocialLogin("naver")}
            disabled={!!socialLoading}
            className="w-full bg-[#03C75A] text-white rounded-xl py-3.5 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" fill="white"/>
            </svg>
            {socialLoading === "naver" ? "연결 중..." : "네이버로 시작하기"}
          </button>
          <button
            type="button"
            onClick={() => handleSocialLogin("google")}
            disabled={!!socialLoading}
            className="w-full bg-white text-gray-700 border border-gray-300 rounded-xl py-3.5 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {socialLoading === "google" ? "연결 중..." : "구글로 시작하기"}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">또는 이메일로 로그인</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* 이메일 로그인 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary)]"
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
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4F6FA]" />}>
      <LoginForm />
    </Suspense>
  );
}
