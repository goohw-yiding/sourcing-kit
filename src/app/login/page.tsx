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
