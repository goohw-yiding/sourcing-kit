"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Plus, Search, Phone, MessageCircle, MapPin, ExternalLink, Trash2, Camera, Loader2, QrCode, Navigation } from "lucide-react";
import Link from "next/link";
import { QRScanner } from "@/components/QRScanner";
import { detectMarketLocation } from "@/lib/location";
import { SkeletonRow } from "@/components/SkeletonCard";

interface Supplier {
  id: string;
  name: string;
  contact?: string | null;
  phone?: string | null;
  wechatId?: string | null;
  marketArea?: string | null;
  address?: string | null;
  category?: string | null;
  url1688?: string | null;
  memo?: string | null;
}

const BLANK: Partial<Supplier> = {};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [form, setForm] = useState<Partial<Supplier>>(BLANK);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [locating, setLocating] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);

  const handleLocate = async () => {
    setLocating(true);
    try {
      const loc = await detectMarketLocation();
      setForm((prev) => ({ ...prev, marketArea: loc }));
    } catch {
      alert("위치를 가져올 수 없습니다.\n위치 권한을 허용했는지 확인해주세요.");
    } finally {
      setLocating(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/suppliers");
      if (!res.ok) throw new Error();
      setSuppliers(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = suppliers.filter(
    (s) =>
      s.name.includes(search) ||
      s.category?.includes(search) ||
      s.marketArea?.includes(search)
  );

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (form.id) {
        const res = await fetch(`/api/suppliers/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const updated = await res.json();
        setSuppliers((prev) => prev.map((s) => s.id === updated.id ? updated : s));
        setSelected(updated);
      } else {
        const res = await fetch("/api/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const created = await res.json();
        setSuppliers((prev) => [created, ...prev]);
      }
      setShowForm(false);
      setForm(BLANK);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("이 거래처를 삭제할까요?")) return;
    await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    setSelected(null);
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    try {
      const buffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      const res = await fetch("/api/scan-supplier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.error) setForm((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(data).filter(([, v]) => v !== null)) }));
      }
    } finally {
      setScanning(false);
      if (scanInputRef.current) scanInputRef.current.value = "";
    }
  };

  const startEdit = (s: Supplier) => {
    setForm(s);
    setSelected(null);
    setShowForm(true);
  };

  if (selected) {
    return (
      <div className="min-h-screen pb-28 bg-[#F4F6FA]">
        <header className="text-white px-5 pt-14 pb-5 flex items-center gap-3 bg-[var(--primary)]">
          <button onClick={() => setSelected(null)} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-bold flex-1">거래처 상세</h1>
          <button onClick={() => startEdit(selected)} className="text-sm bg-white/20 px-3 py-1.5 rounded-lg">수정</button>
          <button onClick={() => del(selected.id)} className="p-1.5"><Trash2 className="w-4 h-4" /></button>
        </header>
        <div className="px-4 py-4 space-y-3">
          <div className="bg-purple-600 rounded-2xl p-5 text-white">
            <div className="text-xl font-bold">{selected.name}</div>
            {selected.contact && <div className="text-purple-200 mt-1">{selected.contact}</div>}
            {selected.category && (
              <span className="mt-2 inline-block text-xs bg-purple-500 px-2 py-1 rounded-full">{selected.category}</span>
            )}
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
            {selected.phone && (
              <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-gray-400" /><span className="text-sm">{selected.phone}</span></div>
            )}
            {selected.wechatId && (
              <div className="flex items-center gap-3"><MessageCircle className="w-4 h-4 text-gray-400" /><span className="text-sm">{selected.wechatId}</span></div>
            )}
            {selected.marketArea && (
              <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-gray-400" /><span className="text-sm">{selected.marketArea}</span></div>
            )}
            {selected.url1688 && (
              <div className="flex items-center gap-3"><ExternalLink className="w-4 h-4 text-gray-400" /><span className="text-sm text-blue-500 truncate">{selected.url1688}</span></div>
            )}
            {selected.memo && (
              <div className="pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-400 mb-1">메모</div>
                <div className="text-sm text-gray-700">{selected.memo}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen pb-28 bg-[#F4F6FA]">
        <header className="text-white px-5 pt-14 pb-5 flex items-center gap-3 bg-[var(--primary)]">
          <button onClick={() => { setShowForm(false); setForm(BLANK); }} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-bold flex-1">{form.id ? "거래처 수정" : "거래처 추가"}</h1>
          {!form.id && (
            <button
              type="button"
              onClick={() => scanInputRef.current?.click()}
              disabled={scanning}
              className="flex items-center gap-1.5 bg-white/20 text-white text-sm px-3 py-1.5 rounded-xl disabled:opacity-70"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {scanning ? "분석중..." : "명함 스캔"}
            </button>
          )}
        </header>
        <input ref={scanInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScan} />
        <div className="px-4 py-4 space-y-3">
          {scanning && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center text-sm text-purple-600">
              AI가 명함/간판을 분석하고 있습니다...
            </div>
          )}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
            {[
              { label: "업체명 *", key: "name", placeholder: "义乌好品质百货" },
              { label: "담당자명", key: "contact", placeholder: "张经理" },
              { label: "전화번호", key: "phone", placeholder: "138-0000-0000" },
              { label: "위챗 ID", key: "wechatId", placeholder: "wechat_id", isWechat: true },
              { label: "시장 위치", key: "marketArea", placeholder: "国际商贸城 A区 3栋 201号", isLocation: true },
              { label: "취급 카테고리", key: "category", placeholder: "완구, 잡화, 의류..." },
              { label: "1688 URL", key: "url1688", placeholder: "https://shop.1688.com/..." },
              { label: "메모", key: "memo", placeholder: "소량주문 가능..." },
            ].map(({ label, key, placeholder, isWechat, isLocation }) => (
              <div key={key}>
                <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                <div className="flex gap-2">
                <input
                  type="text"
                  value={(form[key as keyof Supplier] as string) || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400"
                />
                {isWechat && (
                  <button
                    type="button"
                    onClick={() => setShowQR(true)}
                    className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-3 flex items-center gap-1 text-xs font-medium whitespace-nowrap"
                  >
                    <QrCode className="w-4 h-4" />
                    QR스캔
                  </button>
                )}
                {isLocation && (
                  <button
                    type="button"
                    onClick={handleLocate}
                    disabled={locating}
                    className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-3 flex items-center gap-1 text-xs font-medium whitespace-nowrap disabled:opacity-60"
                  >
                    {locating
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Navigation className="w-4 h-4" />
                    }
                    {locating ? "감지중" : "현위치"}
                  </button>
                )}
                </div>
              </div>
            ))}
            {showQR && (
              <QRScanner
                hint="위챗 QR코드 스캔"
                onResult={(text) => {
                  const wechatMatch = text.match(/weixin:\/\/([^\/?&]+)/i) ||
                                       text.match(/(wxid_[\w]+)/i);
                  setForm((prev) => ({ ...prev, wechatId: wechatMatch ? wechatMatch[1] : text.slice(0, 50) }));
                  setShowQR(false);
                }}
                onClose={() => setShowQR(false)}
              />
            )}
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="w-full text-white rounded-2xl py-4 font-bold text-base disabled:opacity-50 bg-[var(--primary)]"
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
        <h1 className="text-lg font-bold flex-1">공급업체 관리</h1>
        <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{suppliers.length}개</span>
      </header>

      <div className="px-4 py-4 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 bg-white border border-gray-200 rounded-xl flex items-center gap-2 px-3">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="업체명, 카테고리, 위치 검색..."
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
            <div className="text-4xl mb-3">🏪</div>
            <div className="font-medium">거래처가 없습니다</div>
            <div className="text-sm mt-1">+ 버튼으로 추가하세요</div>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left active:scale-95 transition-transform"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{s.name}</div>
                    {s.contact && <div className="text-sm text-gray-500 mt-0.5">{s.contact}</div>}
                    {s.marketArea && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" />{s.marketArea}
                      </div>
                    )}
                  </div>
                  {s.category && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full whitespace-nowrap ml-2">{s.category}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-24 right-4 z-10">
        <button
          onClick={() => { setForm(BLANK); setShowForm(true); }}
          className="w-14 h-14 text-white rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform bg-[var(--primary)]"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

