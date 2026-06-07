"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, Copy, Check, RefreshCw, ChevronDown, ChevronUp, Users } from "lucide-react";
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

interface Product {
  id: string;
  nameKr: string;
  nameCn: string | null;
  status: string;
  createdAt: string;
  costCny: number;
}

interface TenantUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface TenantInfo {
  tenantId: string;
  tenantName: string;
  createdAt: string;
  plan: string;
  planStatus: string;
  planExpiresAt: string | null;
  users: TenantUser[];
  productCount: number;
  products: Product[];
  aiUsageTotal: number;
}

const PLAN_LABELS: Record<string, string> = {
  free:  "무료",
  pro:   "⚡ Pro",
  taste: "🍯 맛보기",
};

const PLAN_COLORS: Record<string, string> = {
  free:  "bg-gray-100 text-gray-500",
  taste: "bg-amber-100 text-amber-700",
  pro:   "bg-orange-100 text-orange-700",
};

export default function AdminPage() {
  const [tab, setTab] = useState<"codes" | "users">("users");

  // 코드 탭
  const [codes, setCodes]     = useState<GiftCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [plan,      setPlan]     = useState("pro");
  const [maxUses,   setMaxUses]  = useState(1);
  const [memo,      setMemo]     = useState("");
  const [creating,  setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // 유저 탭
  const [tenants, setTenants]       = useState<TenantInfo[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [expandedTenant, setExpandedTenant] = useState<string | null>(null);

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

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setTenants(await res.json());
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => { loadCodes(); loadUsers(); }, []);

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

      {/* 탭 */}
      <div className="px-4 pt-4 flex gap-2">
        <button
          onClick={() => setTab("users")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-1.5 ${tab === "users" ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-white text-gray-500 border-gray-200"}`}
        >
          <Users className="w-4 h-4" /> 유저 현황
        </button>
        <button
          onClick={() => setTab("codes")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${tab === "codes" ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-white text-gray-500 border-gray-200"}`}
        >
          🎫 초대 코드
        </button>
      </div>

      <div className="px-4 pt-2 space-y-4">

        {/* ── 유저 현황 탭 ── */}
        {tab === "users" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">전체 유저 {tenants.length}명</p>
              <button onClick={loadUsers} className="flex items-center gap-1 text-xs text-gray-400">
                <RefreshCw className={`w-3 h-3 ${usersLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {usersLoading && (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse h-24" />
                ))}
              </div>
            )}

            {!usersLoading && tenants.map(t => {
              const isExpanded = expandedTenant === t.tenantId;
              const mainUser = t.users[0];
              return (
                <div key={t.tenantId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <button
                    className="w-full px-4 py-3.5 flex items-center gap-3 active:bg-gray-50"
                    onClick={() => setExpandedTenant(isExpanded ? null : t.tenantId)}
                  >
                    <div className="w-9 h-9 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-sm font-bold text-[var(--primary)] shrink-0">
                      {(mainUser?.name ?? t.tenantName).charAt(0)}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{mainUser?.name ?? t.tenantName}</p>
                      <p className="text-xs text-gray-400 truncate">{mainUser?.email ?? "-"}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PLAN_COLORS[t.plan]}`}>
                        {PLAN_LABELS[t.plan]}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
                    </div>
                  </button>

                  {/* 요약 배지 */}
                  <div className="px-4 pb-3 flex gap-3 text-xs text-gray-500">
                    <span>📦 상품 {t.productCount}개</span>
                    <span>🤖 AI {t.aiUsageTotal}회</span>
                    <span>📅 {new Date(t.createdAt).toLocaleDateString("ko-KR")} 가입</span>
                  </div>

                  {/* 상품 목록 (펼침) */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-4 py-3 space-y-2 bg-gray-50">
                      <p className="text-xs font-semibold text-gray-500 mb-1">등록 상품 ({t.productCount})</p>
                      {t.products.length === 0 ? (
                        <p className="text-xs text-gray-400">등록된 상품 없음</p>
                      ) : (
                        t.products.map(p => (
                          <div key={p.id} className="bg-white rounded-xl px-3 py-2.5 border border-gray-100 flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{p.nameKr}</p>
                              {p.nameCn && <p className="text-xs text-gray-400 truncate">{p.nameCn}</p>}
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <p className="text-xs font-bold text-[var(--primary)]">¥{p.costCny}</p>
                              <p className="text-[10px] text-gray-400">{new Date(p.createdAt).toLocaleDateString("ko-KR")}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── 초대코드 탭 ── */}
        {tab === "codes" && <>

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

        </>}

      </div>
    </div>
  );
}
