"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

const STEPS = [
  { key: "ordered", label: "발주완료", color: "bg-gray-500" },
  { key: "producing", label: "생산중", color: "bg-yellow-500" },
  { key: "arrived", label: "입고완료", color: "bg-blue-500" },
  { key: "inspected", label: "검품완료", color: "bg-orange-500" },
  { key: "shipped", label: "선적완료", color: "bg-green-500" },
];

interface Order {
  id: string;
  orderNo?: string | null;
  buyerId?: string | null;
  buyer?: { name: string } | null;
  totalCny?: number | null;
  status: string;
  orderedAt: string;
  memo?: string | null;
}

const BLANK: Partial<Order> = { status: "ordered" };

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Order>>(BLANK);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      setOrders(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const advance = async (order: Order) => {
    const idx = STEPS.findIndex((s) => s.key === order.status);
    if (idx >= STEPS.length - 1) return;
    const next = STEPS[idx + 1].key;
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...order, status: next }),
    });
    const updated = await res.json();
    setOrders((prev) => prev.map((o) => o.id === updated.id ? updated : o));
    setSelected(updated);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const created = await res.json();
      setOrders((prev) => [created, ...prev]);
      setShowForm(false);
      setForm(BLANK);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("이 주문을 삭제할까요?")) return;
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    setOrders((prev) => prev.filter((o) => o.id !== id));
    setSelected(null);
  };

  if (showForm) {
    return (
      <div className="min-h-screen pb-28 bg-[#F4F6FA]">
        <header className="text-white px-5 pt-14 pb-5 flex items-center gap-3 bg-[var(--primary)]">
          <button onClick={() => { setShowForm(false); setForm(BLANK); }} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-bold">주문 추가</h1>
        </header>
        <div className="px-4 py-4 space-y-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
            {[
              { label: "주문번호", key: "orderNo", placeholder: "ORD-2026-001" },
              { label: "바이어명", key: "buyerName", placeholder: "서울잡화(주)" },
              { label: "메모 (품목 등)", key: "memo", placeholder: "면 니트 스웨터 200pcs..." },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                <input
                  type="text"
                  value={(form[key as keyof Order] as string) || ""}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">총 금액 (CNY)</label>
              <input
                type="number"
                inputMode="decimal"
                value={form.totalCny || ""}
                onChange={(e) => setForm((p) => ({ ...p, totalCny: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
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

  if (selected) {
    const stepIdx = STEPS.findIndex((s) => s.key === selected.status);
    return (
      <div className="min-h-screen pb-28 bg-[#F4F6FA]">
        <header className="text-white px-5 pt-14 pb-5 flex items-center gap-3 bg-[var(--primary)]">
          <button onClick={() => setSelected(null)} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-bold flex-1">{selected.orderNo || "주문 상세"}</h1>
          <button onClick={() => del(selected.id)} className="p-1.5"><Trash2 className="w-4 h-4" /></button>
        </header>
        <div className="px-4 py-4 space-y-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            {selected.buyer && <div className="text-sm text-gray-500">바이어: {selected.buyer.name}</div>}
            {selected.memo && <div className="text-sm text-gray-700 mt-1">{selected.memo}</div>}
            {selected.totalCny && <div className="text-lg font-bold mt-2">¥{selected.totalCny.toLocaleString()}</div>}
            <div className="text-xs text-gray-400 mt-1">{new Date(selected.orderedAt).toLocaleDateString("ko-KR")} 발주</div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">진행 단계</h3>
            <div className="space-y-3">
              {STEPS.map((step, i) => (
                <div key={step.key} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${i <= stepIdx ? step.color : "bg-gray-200"}`}>
                    {i < stepIdx ? "✓" : i + 1}
                  </div>
                  <span className={`text-sm ${i === stepIdx ? "font-bold text-gray-900" : i < stepIdx ? "text-gray-400 line-through" : "text-gray-400"}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {stepIdx < STEPS.length - 1 && (
            <button
              onClick={() => advance(selected)}
              className="w-full text-white rounded-2xl py-4 font-bold bg-[var(--primary)]"
            >
              다음 단계로: {STEPS[stepIdx + 1].label} →
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 bg-[#F4F6FA]">
      <header className="text-white px-5 pt-14 pb-5 flex items-center gap-3 bg-[var(--primary)]">
        <Link href="/" className="p-1"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-lg font-bold flex-1">주문 관리</h1>
        <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{orders.length}건</span>
      </header>

      <div className="px-4 py-4 space-y-2">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">불러오는 중...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <div className="font-medium">주문이 없습니다</div>
            <div className="text-sm mt-1">+ 버튼으로 추가하세요</div>
          </div>
        ) : (
          orders.map((o) => {
            const step = STEPS.find((s) => s.key === o.status);
            return (
              <button
                key={o.id}
                onClick={() => setSelected(o)}
                className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left active:scale-95 transition-transform"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{o.orderNo || "주문 #" + o.id.slice(-4)}</div>
                    {o.buyer && <div className="text-sm text-gray-500 mt-0.5">{o.buyer.name}</div>}
                    {o.memo && <div className="text-xs text-gray-400 mt-1 truncate max-w-[200px]">{o.memo}</div>}
                  </div>
                  <div className="text-right">
                    <span className={`text-xs text-white px-2 py-1 rounded-full ${step?.color || "bg-gray-400"}`}>
                      {step?.label}
                    </span>
                    {o.totalCny && <div className="text-sm font-bold text-gray-900 mt-2">¥{o.totalCny.toLocaleString()}</div>}
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-2">{new Date(o.orderedAt).toLocaleDateString("ko-KR")}</div>
              </button>
            );
          })
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

