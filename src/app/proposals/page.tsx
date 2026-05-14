"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Plus, Trash2, Share2, Check, ChevronRight, Eye } from "lucide-react";
import Link from "next/link";

interface Buyer { id: string; name: string; }
interface Product { id: string; nameKr: string; nameCn?: string | null; imageUrl?: string | null; costCny: number; landedCost?: number | null; supplier?: { name: string } | null; }
interface ProposalItem { productId: string; product: Product; priceKrw: number; quantity: number; memo?: string | null; }
interface Proposal {
  id: string;
  title: string;
  shareToken: string;
  viewedAt?: string | null;
  createdAt: string;
  buyer: Buyer;
  items: ProposalItem[];
}

type Step = "list" | "selectBuyer" | "selectProducts" | "setPrices" | "done";

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("list");
  const [copied, setCopied] = useState<string | null>(null);

  // wizard state
  const [selBuyer, setSelBuyer] = useState<Buyer | null>(null);
  const [newBuyerName, setNewBuyerName] = useState("");
  const [selProducts, setSelProducts] = useState<string[]>([]);
  const [prices, setPrices] = useState<Record<string, { priceKrw: number; quantity: number }>>({});
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pr, bu, prods] = await Promise.all([
        fetch("/api/proposals").then((r) => r.json()),
        fetch("/api/buyers").then((r) => r.json()),
        fetch("/api/products").then((r) => r.json()),
      ]);
      setProposals(pr);
      setBuyers(bu);
      setProducts(prods);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const copyLink = async (token: string) => {
    const url = `${window.location.origin}/proposal/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const del = async (id: string) => {
    if (!confirm("제안서를 삭제할까요?")) return;
    await fetch(`/api/proposals/${id}`, { method: "DELETE" });
    setProposals((p) => p.filter((x) => x.id !== id));
  };

  const toggleProduct = (id: string) => {
    setSelProducts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const goToPrices = () => {
    const init: Record<string, { priceKrw: number; quantity: number }> = {};
    selProducts.forEach((pid) => {
      const p = products.find((x) => x.id === pid);
      init[pid] = { priceKrw: Math.ceil((p?.landedCost ?? 0) * 1.3 / 100) * 100, quantity: 1 };
    });
    setPrices(init);
    setStep("setPrices");
  };

  const pickBuyer = async (buyer?: Buyer) => {
    if (buyer) {
      setSelBuyer(buyer);
      setStep("selectProducts");
      return;
    }
    const name = newBuyerName.trim();
    if (!name) return;
    // 새 바이어 즉석 생성
    const res = await fetch("/api/buyers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const created = await res.json();
    setBuyers((p) => [created, ...p]);
    setSelBuyer(created);
    setNewBuyerName("");
    setStep("selectProducts");
  };

  const save = async () => {
    if (!selBuyer || selProducts.length === 0) return;
    setSaving(true);
    try {
      const items = selProducts.map((pid) => ({
        productId: pid,
        priceKrw: prices[pid]?.priceKrw ?? 0,
        quantity: prices[pid]?.quantity ?? 1,
      }));
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerId: selBuyer.id, title: title || `${selBuyer.name} 제안서`, items }),
      });
      const created = await res.json();
      setProposals((p) => [created, ...p]);
      setStep("done");
      setTimeout(() => {
        setStep("list");
        setSelBuyer(null);
        setSelProducts([]);
        setPrices({});
        setTitle("");
      }, 3000);
    } finally {
      setSaving(false);
    }
  };

  // ── STEP: selectBuyer ──
  if (step === "selectBuyer") {
    return (
      <div className="min-h-screen pb-28 bg-[#F4F6FA]">
        <header className="text-white px-5 pt-14 pb-5 flex items-center gap-3 bg-[var(--primary)]">
          <button onClick={() => setStep("list")} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-bold">누구에게 보낼까요?</h1>
        </header>
        <div className="px-4 py-4 space-y-3">
          {/* 즉석 입력 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 mb-2">이름 직접 입력</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBuyerName}
                onChange={(e) => setNewBuyerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && pickBuyer()}
                placeholder="바이어 이름 입력 (예: 서울잡화)"
                className="flex-1 border-2 border-green-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-green-500"
                autoFocus
              />
              <button
                onClick={() => pickBuyer()}
                disabled={!newBuyerName.trim()}
                className="bg-green-600 text-white px-4 rounded-xl font-bold disabled:opacity-30"
              >
                다음
              </button>
            </div>
          </div>

          {/* 기존 바이어 */}
          {buyers.length > 0 && (
            <>
              <p className="text-xs text-gray-400 px-1">또는 기존 바이어 선택</p>
              {buyers.map((b) => (
                <button
                  key={b.id}
                  onClick={() => pickBuyer(b)}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left flex items-center justify-between active:scale-95 transition-transform"
                >
                  <span className="font-semibold text-gray-900">{b.name}</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    );
  }

  // ── STEP: selectProducts ──
  if (step === "selectProducts") {
    return (
      <div className="min-h-screen pb-28 bg-[#F4F6FA]">
        <header className="text-white px-5 pt-14 pb-5 flex items-center gap-3 bg-[var(--primary)]">
          <button onClick={() => setStep("selectBuyer")} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-bold flex-1">{selBuyer?.name} · 상품 선택</h1>
          <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{selProducts.length}개 선택</span>
        </header>
        <div className="px-4 py-4 space-y-2">
          {products.length === 0 ? (
            <div className="text-center py-16 text-gray-400">소싱 품목이 없습니다.</div>
          ) : (
            products.map((p) => {
              const sel = selProducts.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleProduct(p.id)}
                  className={`w-full bg-white rounded-2xl p-4 shadow-sm border text-left flex items-center gap-3 active:scale-95 transition-transform ${sel ? "border-green-400 bg-green-50" : "border-gray-100"}`}
                >
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    : <div className="w-14 h-14 rounded-xl bg-gray-100 shrink-0 flex items-center justify-center text-2xl">📦</div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{p.nameKr}</div>
                    {p.supplier && <div className="text-xs text-gray-500">{p.supplier.name}</div>}
                    <div className="text-xs text-orange-600 font-semibold mt-0.5">매입 {p.landedCost ? p.landedCost.toLocaleString() : "?"}원</div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${sel ? "bg-green-500 border-green-500" : "border-gray-300"}`}>
                    {sel && <Check className="w-4 h-4 text-white" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
        {selProducts.length > 0 && (
          <div className="fixed bottom-24 left-4 right-4 z-10">
            <button
              onClick={goToPrices}
              className="w-full bg-green-600 text-white rounded-2xl py-4 font-bold shadow-xl"
            >
              {selProducts.length}개 선택 완료 → 판매가 입력
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── STEP: setPrices ──
  if (step === "setPrices") {
    return (
      <div className="min-h-screen pb-28 bg-[#F4F6FA]">
        <header className="text-white px-5 pt-14 pb-5 flex items-center gap-3 bg-[var(--primary)]">
          <button onClick={() => setStep("selectProducts")} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-bold">판매가 설정</h1>
        </header>
        <div className="px-4 py-4 space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">제안서 제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${selBuyer?.name} 제안서`}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
            />
          </div>
          {selProducts.map((pid) => {
            const p = products.find((x) => x.id === pid)!;
            return (
              <div key={pid} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
                <div className="flex items-center gap-3">
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl">📦</div>
                  }
                  <div>
                    <div className="font-semibold text-gray-900">{p.nameKr}</div>
                    <div className="text-xs text-gray-400">매입 {p.landedCost ? p.landedCost.toLocaleString() : "?"}원</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">판매가 (원)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={prices[pid]?.priceKrw || ""}
                      onChange={(e) => setPrices((prev) => ({ ...prev, [pid]: { ...prev[pid], priceKrw: parseInt(e.target.value) || 0 } }))}
                      className="w-full border-2 border-green-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-green-400"
                    />
                  </div>
                  <div className="w-20">
                    <label className="text-xs text-gray-500 mb-1 block">수량</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={prices[pid]?.quantity || 1}
                      onChange={(e) => setPrices((prev) => ({ ...prev, [pid]: { ...prev[pid], quantity: parseInt(e.target.value) || 1 } }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                    />
                  </div>
                </div>
                {prices[pid]?.priceKrw > 0 && p.landedCost && (
                  <div className="text-xs text-right">
                    <span className={prices[pid].priceKrw >= p.landedCost ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
                      마진 {((prices[pid].priceKrw - p.landedCost) / p.landedCost * 100).toFixed(0)}%
                      ({(prices[pid].priceKrw - p.landedCost).toLocaleString()}원)
                    </span>
                  </div>
                )}
              </div>
            );
          })}
          <button
            onClick={save}
            disabled={saving}
            className="w-full bg-green-600 text-white rounded-2xl py-4 font-bold text-base disabled:opacity-50"
          >
            {saving ? "생성 중..." : "제안서 생성 →"}
          </button>
        </div>
      </div>
    );
  }

  // ── STEP: done ──
  if (step === "done") {
    const latest = proposals[0];
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 gap-6">
        <div className="text-6xl">✅</div>
        <div className="text-xl font-bold text-gray-900">제안서 생성 완료!</div>
        {latest && (
          <button
            onClick={() => copyLink(latest.shareToken)}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-2xl font-bold text-base"
          >
            <Share2 className="w-5 h-5" />
            링크 복사 (카카오톡 전송)
          </button>
        )}
        <p className="text-sm text-gray-400">잠시 후 목록으로 이동합니다...</p>
      </div>
    );
  }

  // ── STEP: list ──
  return (
    <div className="min-h-screen pb-28 bg-[#F4F6FA]">
      <header className="text-white px-5 pt-14 pb-5 flex items-center gap-3 bg-[var(--primary)]">
        <Link href="/" className="p-1"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-lg font-bold flex-1">바이어 제안서</h1>
        <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{proposals.length}건</span>
      </header>

      <div className="px-4 py-4 space-y-2">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">불러오는 중...</div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <div className="font-medium">제안서가 없습니다</div>
            <div className="text-sm mt-1">+ 버튼으로 만들어보세요</div>
          </div>
        ) : (
          proposals.map((pr) => (
            <div key={pr.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{pr.title}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{pr.buyer.name}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {pr.items.length}개 품목 · {new Date(pr.createdAt).toLocaleDateString("ko-KR")}
                    {pr.viewedAt && <span className="ml-2 text-green-500">열람됨</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <Link
                    href={`/proposal/${pr.shareToken}`}
                    target="_blank"
                    className="flex items-center gap-1 text-xs px-2.5 py-2 rounded-xl font-medium bg-gray-100 text-gray-600"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    미리보기
                  </Link>
                  <button
                    onClick={() => copyLink(pr.shareToken)}
                    className={`flex items-center gap-1 text-xs px-2.5 py-2 rounded-xl font-medium transition-colors ${copied === pr.shareToken ? "bg-green-100 text-green-600" : "bg-green-600 text-white"}`}
                  >
                    {copied === pr.shareToken ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    {copied === pr.shareToken ? "복사됨" : "공유"}
                  </button>
                  <button onClick={() => del(pr.id)} className="p-2 text-gray-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-24 right-4 z-10">
        <button
          onClick={() => setStep("selectBuyer")}
          className="w-14 h-14 text-white rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform bg-[var(--primary)]"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

