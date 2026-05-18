"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Plus, Search, Phone, MessageCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { SkeletonRow } from "@/components/SkeletonCard";

interface Buyer {
  id: string;
  name: string;
  contact?: string | null;
  phone?: string | null;
  kakaoId?: string | null;
  email?: string | null;
  category?: string | null;
  memo?: string | null;
}

const BLANK: Partial<Buyer> = {};

export default function BuyersPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Buyer>>(BLANK);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/buyers");
      if (!res.ok) throw new Error();
      setBuyers(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = buyers.filter(
    (b) => b.name.includes(search) || b.contact?.includes(search) || b.category?.includes(search)
  );

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (form.id) {
        const res = await fetch(`/api/buyers/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const updated = await res.json();
        setBuyers((prev) => prev.map((b) => b.id === updated.id ? updated : b));
      } else {
        const res = await fetch("/api/buyers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const created = await res.json();
        setBuyers((prev) => [created, ...prev]);
      }
      setShowForm(false);
      setForm(BLANK);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("이 바이어를 삭제할까요?")) return;
    await fetch(`/api/buyers/${id}`, { method: "DELETE" });
    setBuyers((prev) => prev.filter((b) => b.id !== id));
  };

  if (showForm) {
    return (
      <div className="min-h-screen pb-28 bg-[#F4F6FA]">
        <header className="text-white px-5 pt-14 pb-5 flex items-center gap-3 bg-[var(--primary)]">
          <button onClick={() => { setShowForm(false); setForm(BLANK); }} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-bold">{form.id ? "바이어 수정" : "바이어 추가"}</h1>
        </header>
        <div className="px-4 py-4 space-y-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
            {[
              { label: "업체명 *", key: "name", placeholder: "서울잡화(주)" },
              { label: "담당자", key: "contact", placeholder: "김대표" },
              { label: "전화번호", key: "phone", placeholder: "010-0000-0000" },
              { label: "카카오톡 ID", key: "kakaoId", placeholder: "kakao_id" },
              { label: "이메일", key: "email", placeholder: "buyer@email.com" },
              { label: "관심 카테고리", key: "category", placeholder: "완구, 잡화..." },
              { label: "메모", key: "memo", placeholder: "소량 다품종 선호..." },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                <input
                  type="text"
                  value={(form[key as keyof Buyer] as string) || ""}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400"
                />
              </div>
            ))}
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="w-full text-white rounded-2xl py-4 font-bold disabled:opacity-50 bg-[var(--primary)]"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 bg-[#F4F6FA]">
      <header className="text-white px-5 pt-14 pb-5 flex items-center gap-3 bg-[var(--primary)]">
        <Link href="/" className="p-1"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-lg font-bold flex-1">바이어 관리</h1>
        <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{buyers.length}개</span>
      </header>

      <div className="px-4 py-4 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 bg-white border border-gray-200 rounded-xl flex items-center gap-2 px-3">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="업체명, 담당자 검색..."
              className="flex-1 py-3 text-sm focus:outline-none"
            />
          </div>
          <button onClick={() => { setForm(BLANK); setShowForm(true); }} className="text-white w-12 rounded-xl flex items-center justify-center bg-[var(--primary)]">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">⚠️</div>
            <div className="font-medium text-gray-600">데이터를 불러오지 못했습니다.</div>
            <div className="text-sm mt-1 mb-4">다시 시도해 주세요.</div>
            <button
              onClick={load}
              className="text-white text-sm px-5 py-2.5 rounded-xl bg-[var(--primary)]"
            >
              다시 시도
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🤝</div>
            <div className="font-medium">바이어가 없습니다</div>
            <div className="text-sm mt-1">+ 버튼으로 추가하세요</div>
          </div>
        ) : (
          filtered.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{b.name}</div>
                  {b.contact && <div className="text-sm text-gray-500 mt-0.5">{b.contact}</div>}
                </div>
                <div className="flex items-center gap-2">
                  {b.category && (
                    <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">{b.category}</span>
                  )}
                  <button onClick={() => { setForm(b); setShowForm(true); }} className="text-xs text-gray-400 px-2 py-1">수정</button>
                  <button onClick={() => del(b.id)} className="p-1"><Trash2 className="w-3.5 h-3.5 text-gray-300" /></button>
                </div>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {b.phone && (
                  <a href={`tel:${b.phone}`} className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                    <Phone className="w-3.5 h-3.5" /> {b.phone}
                  </a>
                )}
                {b.kakaoId && (
                  <div className="flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 px-3 py-1.5 rounded-lg">
                    <MessageCircle className="w-3.5 h-3.5" /> {b.kakaoId}
                  </div>
                )}
              </div>
              {b.memo && <div className="mt-2 text-xs text-gray-400">{b.memo}</div>}
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-24 right-4 z-10">
        <button onClick={() => { setForm(BLANK); setShowForm(true); }} className="w-14 h-14 text-white rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform bg-[var(--primary)]">
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

