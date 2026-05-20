"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, Copy, Check, RefreshCw } from "lucide-react";
import Link from "next/link";

interface GiftCode {
  id:             string;
  code:           string;
  plan:           string;
  memo:           string | null;
  maxUses:        number;
  usedCount:      number;
  expiresAt:      string | null;
  usedByTenants:  string[];
  createdAt:      string;
}

const PLAN_LABELS: Record<string, string> = {
  pro:   "⚡ Pro",
  taste: "🍯 맛보기",
};

export default function AdminPage() {
  const [codes, setCodes]     = useState<GiftCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // 신규 코드 폼
  const [plan,      setPlan]     = useState("pro");
  const [maxUses,   setMaxUses]  = useState(1);
  const [memo,      setMemo]     = useState("");
  const [creating,  setCreating] = useState(false);

  // 복사 완료
  const [copied, setCopied] = useState<string | null>(null);

  const loadCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/gift-codes");
      if (res.status === 403) { setError("관리자 권한이 없습니다"); return; }
      setCodes(await res.json());
    } catch {
      setError("불러오기 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCodes(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/gift-codes", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ plan, maxUses, memo: memo || null }),
      });
      if (!res.ok) throw new Error();
      setMemo("");
      await loadCodes();
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 코드를 삭제할까요?")) return;
    await fetch("/api/admin/gift-codes", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id }),
    });
    await loadCodes();
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-4xl mb-3">🔒</div>
          <p className="text-gray-700 font-bold">{error}</p>
          <Link href="/" className="mt-4 inline-block text-sm text-[var(--primary)]">홈으로</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6FA] pb-20">
      {/* 헤더 */}
      <div className="bg-[var(--primary)] text-white px-4 pt-14 pb-5">
        <div className="flex items-center gap-3 mb-1">
          <Link href="/more" className="p-1.5 rounded-xl bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">관리자 페이지</h1>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>초대 코드 생성 및 관리</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* ── 코드 생성 카드 ── */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm font-bold text-gray-800 mb-3">✦ 새 초대 코드 생성</p>

          <div className="space-y-3">
            {/* 플랜 선택 */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block font-medium">플랜</label>
              <div className="flex gap-2">
                {["pro", "taste"].map(p => (
                  <button
                    key={p}
                    onClick={() => setPlan(p)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                      plan === p
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "bg-white text-gray-500 border-gray-200"
                    }`}
                  >
                    {PLAN_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            {/* 사용 횟수 */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block font-medium">사용 가능 횟수</label>
              <div className="flex gap-2">
                {[1, 3, 5, 10].map(n => (
                  <button
                    key={n}
                    onClick={() => setMaxUses(n)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                      maxUses === n
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-500 border-gray-200"
                    }`}
                  >
                    {n}회
                  </button>
                ))}
              </div>
            </div>

            {/* 메모 */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block font-medium">메모 (누구에게 줬는지)</label>
              <input
                type="text"
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder="예: 김과장, 이우 현장팀"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full bg-[var(--primary)] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {creating
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> 생성 중...</>
                : <><Plus className="w-4 h-4" /> 코드 생성</>}
            </button>
          </div>
        </div>

        {/* ── 코드 목록 ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">발급된 코드</p>
            <button onClick={loadCodes} className="flex items-center gap-1 text-xs text-gray-400">
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading && (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse h-20" />
              ))}
            </div>
          )}

          {!loading && codes.length === 0 && (
            <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-gray-200">
              <div className="text-3xl mb-2">🎫</div>
              <p className="text-sm text-gray-500">아직 생성된 코드가 없습니다</p>
            </div>
          )}

          <div className="space-y-2">
            {codes.map(c => {
              const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
              const isExhausted = c.usedCount >= c.maxUses;
              const isActive = !isExpired && !isExhausted;

              return (
                <div key={c.id}
                  className={`bg-white rounded-2xl p-4 border shadow-sm ${
                    isActive ? "border-gray-100" : "border-gray-100 opacity-60"
                  }`}
                >
                  {/* 코드 + 복사 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-extrabold text-gray-900 tracking-widest">
                        {c.code}
                      </span>
                      {isActive
                        ? <span className="text-[10px] font-bold bg-green-100 text-green-600 px-2 py-0.5 rounded-full">사용 가능</span>
                        : isExhausted
                          ? <span className="text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">소진됨</span>
                          : <span className="text-[10px] font-bold bg-red-100 text-red-400 px-2 py-0.5 rounded-full">만료됨</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => copyCode(c.code)}
                        className={`p-2 rounded-xl transition-all ${
                          copied === c.code
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-500 active:opacity-70"
                        }`}
                      >
                        {copied === c.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-2 rounded-xl bg-red-50 text-red-400 active:opacity-70"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 상세 정보 */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span>{PLAN_LABELS[c.plan]}</span>
                    <span>사용 {c.usedCount}/{c.maxUses}회</span>
                    {c.memo && <span>📝 {c.memo}</span>}
                    {c.expiresAt && (
                      <span>만료 {new Date(c.expiresAt).toLocaleDateString("ko-KR")}</span>
                    )}
                    <span className="text-gray-400">
                      생성 {new Date(c.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 사용 안내 ── */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-blue-700 mb-2">📖 코드 전달 방법</p>
          <ol className="text-xs text-blue-600 space-y-1 leading-relaxed list-decimal list-inside">
            <li>코드 복사 → 카카오톡/문자로 전달</li>
            <li>받은 분이 앱에서 <strong>더보기 → 구독 관리</strong> 이동</li>
            <li>하단 <strong>&quot;초대 코드 입력&quot;</strong> 칸에 코드 입력</li>
            <li>Pro 플랜 즉시 활성화 🎉</li>
          </ol>
        </div>

      </div>
    </div>
  );
}
