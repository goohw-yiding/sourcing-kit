"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== passwordConfirm) { setError("비밀번호가 일치하지 않습니다"); return; }
    if (password.length < 6) { setError("비밀번호는 6자리 이상이어야 합니다"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "회원가입 실패"); return; }
      const loginRes = await signIn("credentials", { email, password, redirect: false });
      if (loginRes?.error) { setError("자동 로그인 실패. 로그인 페이지로 이동합니다"); setTimeout(() => router.push("/login"), 1500); return; }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex flex-col">
      <div className="bg-[var(--primary)] text-white px-5 pt-16 pb-8 text-center">
        <div className="text-3xl font-black mb-1">소싱킷</div>
        <p className="text-sm text-white/70">무역 소싱 관리 앱</p>
      </div>
      <div className="flex-1 px-5 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6">회원가입</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">이름</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary)]" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">이메일</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary)]" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">비밀번호 (6자리 이상)</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary)]" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">비밀번호 확인</label>
              <input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="비밀번호 재입력" required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary)]" />
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-[var(--primary)] text-white rounded-xl py-3.5 font-bold text-sm disabled:opacity-50 cursor-pointer select-none active:scale-[0.97] active:brightness-90 transition-all duration-150">
              {loading ? "처리 중..." : "회원가입"}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-[var(--primary)] font-bold">로그인</Link>
        </p>
      </div>
    </div>
  );
}
