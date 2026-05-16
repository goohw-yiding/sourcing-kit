"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Plus, Camera, Search, Trash2, X, Calculator, ChevronDown, ChevronUp, ChevronRight, QrCode, Navigation, Loader2, TrendingUp, ShieldAlert, ExternalLink, Sparkles } from "lucide-react";
import { QRScanner } from "@/components/QRScanner";
import { CbmCalculator } from "@/components/CbmCalculator";
import Link from "next/link";
import { ChinesePhrase } from "@/components/ChinesePhrase";
import { useRouter, useSearchParams } from "next/navigation";
import { calcLandedCost, formatKrw } from "@/lib/calc";
import { detectMarketLocation } from "@/lib/location";

interface NaverShopItem {
  title: string;
  link: string;
  image: string;
  lprice: string;
  mallName: string;
}

interface MarketResult {
  productNameKr: string;
  productNameCn: string;
  category: string;
  features: string[];
  hsCode?: string;
  customsRateKr?: number;
  naverItems: NaverShopItem[];
  lowestPrice: number;
  highestPrice: number;
  avgPrice: number;
  sourcingPriceEstimate: string;
  marginEstimate: string;
  competitionLevel: "낮음" | "보통" | "높음";
  trend: "상승" | "보합" | "하락";
  recommendKeywords: string[];
  aiComment: string;
  recommendation: "추천" | "검토필요" | "비추천";
  recommendReason: string;
  kcRequired: string;
  searchLinks: { naver: string; coupang: string; elevenst: string };
}

interface Product {
  id: string;
  nameKr: string;
  nameCn?: string | null;
  imageUrl?: string | null;
  costCny: number;
  exchangeRate: number;
  customsRate: number;
  agentFeeRate: number;
  cbm: number;
  cbmRate: number;
  packagingCost: number;
  chinaShipping: number;
  hasCoOrigin: boolean;
  coOriginCost: number;
  inlandShipping: number;
  supplierId?: string | null;
  supplier?: { name: string; marketArea?: string | null } | null;
  hsCode?: string | null;
  moq?: number | null;
  status: string;
  createdAt: string;
  landedCost?: number | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string; dot: string }> = {
  sourcing: { label: "검토중", color: "bg-amber-100 text-amber-700", dot: "bg-amber-400" },
  proposed: { label: "제안완료", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  ordered: { label: "발주완료", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
};

const DEFAULT_FORM = {
  exchangeRate: 193.5,
  customsRate: 0.08,
  agentFeeRate: 0,
  cbmRate: 90000,
  cbm: 0,
  packagingCost: 0,
  chinaShipping: 0,
  hasCoOrigin: false,
  coOriginCost: 0,
  inlandShipping: 0,
};

export default function SourcingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(() => searchParams.get("new") === "1");
  const [selected, setSelected] = useState<Product | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "price_desc" | "price_asc" | "landed_desc">("date_desc");
  const [form, setForm] = useState<Partial<Product>>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [currentRate, setCurrentRate] = useState<number>(0);
  const [locating, setLocating] = useState(false);
  const [showCbmCalc, setShowCbmCalc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageFileRef = useRef<File | null>(null);
  const [showMarket, setShowMarket] = useState(false);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketResult, setMarketResult] = useState<MarketResult | null>(null);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [targetMarginForm, setTargetMarginForm] = useState(40);

  // ── New state ──
  const [rateInfo, setRateInfo] = useState<{baseRate: number; ttSell: number; ttBuy: number; usdKrw: number; date: string} | null>(null);
  const [priceMode, setPriceMode] = useState<"cny" | "krw" | "usd">("cny");
  const [krwInput, setKrwInput] = useState(0);
  const [usdInput, setUsdInput] = useState(0);
  const [usdKrwRate, setUsdKrwRate] = useState(1350);
  const [hsQuery, setHsQuery] = useState("");
  const [hsResults, setHsResults] = useState<{hsCode: string; description: string}[]>([]);
  const [hsLoading, setHsLoading] = useState(false);
  const [showHsPanel, setShowHsPanel] = useState(false);
  const [importNotes, setImportNotes] = useState("");
  const [hsDescription, setHsDescription] = useState("");
  const [cbmMode, setCbmMode] = useState<"direct" | "box" | "total">("direct");
  const [boxL, setBoxL] = useState(0);
  const [boxW, setBoxW] = useState(0);
  const [boxH, setBoxH] = useState(0);
  const [boxQty, setBoxQty] = useState(1);
  const [shippingTotal, setShippingTotal] = useState(0);
  const [inlandRate, setInlandRate] = useState(100000);
  const [inlandManual, setInlandManual] = useState(false);
  const [showTaxSection, setShowTaxSection] = useState(false);
  const [showShippingSection, setShowShippingSection] = useState(false);
  const [showSurchargeSection, setShowSurchargeSection] = useState(false);

  const handleLocate = async () => {
    setLocating(true);
    try {
      const loc = await detectMarketLocation();
      setF("marketArea", loc);
    } catch {
      alert("위치를 가져올 수 없습니다.\n위치 권한을 허용했는지 확인해주세요.");
    } finally {
      setLocating(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRate = useCallback(async () => {
    try {
      const d = await fetch("/api/exchange-rate").then(r => r.json());
      const rate = d.ttSell || d.rate || 193.5;
      setCurrentRate(rate);
      setForm((p) => ({ ...p, exchangeRate: rate }));
      setRateInfo({ baseRate: d.baseRate || rate, ttSell: d.ttSell || rate, ttBuy: d.ttBuy || rate, usdKrw: d.usdKrw || 1350, date: d.date || "" });
      if (d.usdKrw) setUsdKrwRate(d.usdKrw);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchRate(); }, [fetchRate]);

  useEffect(() => { load(); }, [load]);

  // 박스 CBM 자동계산
  useEffect(() => {
    if (cbmMode === "box" && boxQty > 0 && boxL > 0 && boxW > 0 && boxH > 0) {
      const itemCbm = (boxL * boxW * boxH) / 1_000_000 / boxQty;
      setF("cbm", Math.round(itemCbm * 1_000_000) / 1_000_000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cbmMode, boxL, boxW, boxH, boxQty]);

  // 합계 모드
  useEffect(() => {
    if (cbmMode === "total") {
      setF("cbm", 1);
      setF("cbmRate", shippingTotal);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cbmMode, shippingTotal]);

  // 내륙운송비 자동계산
  useEffect(() => {
    if (!inlandManual && (form.cbm as number ?? 0) > 0 && inlandRate > 0) {
      setF("inlandShipping", Math.round(((form.cbm as number) / 4) * inlandRate));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.cbm, inlandRate, inlandManual]);

  const filtered = items
    .filter((i) => {
      const matchSearch = i.nameKr.includes(search) || i.nameCn?.includes(search) || i.supplier?.name?.includes(search);
      const matchStatus = statusFilter === "all" || i.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const calcA = a.landedCost ?? calcLandedCost(a).landedCost;
      const calcB = b.landedCost ?? calcLandedCost(b).landedCost;
      switch (sortBy) {
        case "date_desc": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "date_asc":  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "price_desc": return b.costCny - a.costCny;
        case "price_asc":  return a.costCny - b.costCny;
        case "landed_desc": return calcB - calcA;
        default: return 0;
      }
    });

  const save = async () => {
    if (!form.nameKr || !form.costCny) return;
    setSaving(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          supplierName: (form as Record<string, unknown>)._supplierName || undefined,
        }),
      });
      const created = await res.json();
      setItems((prev) => [created, ...prev]);
      setShowForm(false);
      setForm(DEFAULT_FORM);
      setImagePreview(null);
    } finally {
      setSaving(false);
    }
  };

  const openInCalc = (p: Product) => {
    const params = new URLSearchParams({
      costCny: String(p.costCny),
      exchangeRate: String(p.exchangeRate),
      customsRate: String(p.customsRate),
      agentFeeRate: String(p.agentFeeRate),
      cbm: String(p.cbm),
      cbmRate: String(p.cbmRate),
      packagingCost: String(p.packagingCost),
      chinaShipping: String(p.chinaShipping),
      inlandShipping: String(p.inlandShipping),
      name: p.nameKr,
    });
    router.push(`/calculator?${params.toString()}`);
  };

  // 계산기에서 돌아왔을 때 값 복원 (backward compat)
  useEffect(() => {
    if (searchParams.get("fromCalc") !== "1") return;
    const raw = sessionStorage.getItem("calc_return_data");
    const meta = sessionStorage.getItem("sourcing_form_meta");
    if (!raw) return;
    try {
      const calcData = JSON.parse(raw);
      const metaData = meta ? JSON.parse(meta) : {};
      setForm({
        ...DEFAULT_FORM,
        ...calcData,
        nameKr: metaData.nameKr || "",
        nameCn: metaData.nameCn || "",
        moq: metaData.moq || null,
        imageUrl: metaData.imageUrl || "",
        _supplierName: metaData.supplierName || "",
        marketArea: metaData.marketArea || "",
      } as Partial<Product>);
      if (metaData.imageUrl) setImagePreview(metaData.imageUrl);
      setShowForm(true);
      sessionStorage.removeItem("calc_return_data");
      sessionStorage.removeItem("sourcing_form_meta");
    } catch { /* ignore */ }
  }, [searchParams]);

  const del = async (id: string) => {
    if (!confirm("이 품목을 삭제할까요?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelected(null);
  };

  const setF = (key: string, value: unknown) => setForm((p) => ({ ...p, [key]: value }));

  const openNewTab = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ── New helpers ──
  const searchHs = async () => {
    if (!hsQuery.trim()) return;
    setHsLoading(true);
    try {
      const res = await fetch(`/api/hs/search?q=${encodeURIComponent(hsQuery)}`);
      const data = await res.json();
      setHsResults(data.items || []);
    } finally {
      setHsLoading(false);
    }
  };

  const selectHs = async (hsCode: string, desc: string) => {
    setShowHsPanel(false);
    setHsQuery(desc);
    setHsDescription(desc);
    const res = await fetch(`/api/hs/rate?hs=${hsCode}`);
    const data = await res.json();
    setF("customsRate", data.rate);
    setF("hsCode", hsCode);
    setImportNotes(data.importNotes || "");
  };

  const handleKrwInput = (v: number) => {
    setKrwInput(v);
    setF("costCny", Math.round((v / ((form.exchangeRate as number) || 193.5)) * 100) / 100);
  };

  const handleUsdInput = (v: number) => {
    setUsdInput(v);
    const krw = Math.round(v * usdKrwRate);
    setF("costCny", Math.round((krw / ((form.exchangeRate as number) || 193.5)) * 100) / 100);
  };

  const handleModeChange = (mode: "cny" | "krw" | "usd") => {
    const cny = (form.costCny as number) || 0;
    const rate = (form.exchangeRate as number) || 193.5;
    if (mode === "krw" && cny > 0) {
      setKrwInput(Math.round(cny * rate));
    } else if (mode === "usd" && cny > 0) {
      setUsdInput(Math.round((cny * rate / usdKrwRate) * 100) / 100);
    }
    setPriceMode(mode);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    imageFileRef.current = file;
    setImagePreview(URL.createObjectURL(file));
    setMarketResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setF("imageUrl", base64);
    };
    reader.readAsDataURL(file);
  };

  const runMarketAnalysis = async () => {
    setShowMarket(true);
    setMarketLoading(true);
    setMarketResult(null);
    setMarketError(null);
    try {
      const fd = new FormData();
      if (imageFileRef.current) {
        fd.append("image", imageFileRef.current);
      } else if (form.imageUrl) {
        const imgRes = await fetch(form.imageUrl as string);
        const blob = await imgRes.blob();
        fd.append("image", blob, "product.jpg");
      } else if (form.nameKr) {
        fd.append("productName", form.nameKr as string);
      } else {
        setMarketError("사진을 찍거나 상품명을 입력해주세요.");
        return;
      }
      const res = await fetch("/api/market/analyze", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMarketError(err.error || `분석 오류 (${res.status})`);
        return;
      }
      const data = await res.json();
      if (data.error) {
        setMarketError(data.error);
      } else {
        setMarketResult(data);
      }
    } catch (e) {
      setMarketError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      console.error(e);
    } finally {
      setMarketLoading(false);
    }
  };

  if (selected) {
    const calc = calcLandedCost(selected);
    const calcWithCurrentRate = currentRate > 0 && Math.abs(selected.exchangeRate - currentRate) > 2
      ? calcLandedCost({ ...selected, exchangeRate: currentRate })
      : null;
    return (
      <div className="min-h-screen pb-28 bg-[#F4F6FA]">
        <header className="text-white px-5 pt-14 pb-5 flex items-center gap-3 bg-[var(--primary)]">
          <button onClick={() => setSelected(null)} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-bold flex-1">{selected.nameKr}</h1>
          <span className={`text-xs px-2 py-1 rounded-full ${STATUS_LABELS[selected.status]?.color || ""}`}>
            {STATUS_LABELS[selected.status]?.label}
          </span>
          <button onClick={() => del(selected.id)} className="p-1.5"><Trash2 className="w-4 h-4" /></button>
        </header>

        <div className="px-4 py-4 space-y-3">
          {selected.imageUrl && (
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <img src={selected.imageUrl} alt={selected.nameKr} className="w-full h-48 object-cover" />
            </div>
          )}

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="text-xs text-gray-400 mb-3">{new Date(selected.createdAt).toLocaleDateString("ko-KR")} 등록</div>
            {selected.nameCn && <div className="text-gray-500 text-sm mb-2">{selected.nameCn}</div>}
            {selected.supplier && (
              <div className="text-sm text-gray-600">
                🏪 {selected.supplier.name} {selected.supplier.marketArea && `· ${selected.supplier.marketArea}`}
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-2xl font-bold text-gray-900">¥{selected.costCny}</div>
              <div className="text-sm text-gray-500">≈ {formatKrw(calc.costKrw)}</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold">한국 매입단가</span>
              <span className="text-xs bg-orange-400/40 rounded-full px-2 py-0.5">참고용 견적</span>
            </div>
            <div className="text-3xl font-bold">{formatKrw(calc.landedCost)}</div>
            <div className="mt-3 pt-3 border-t border-orange-400/50 space-y-1 text-sm text-orange-100">
              <div className="flex justify-between"><span>원화원가</span><span>{calc.costKrw.toLocaleString()}원</span></div>
              <div className="flex justify-between"><span>에이전트수수료({(selected.agentFeeRate * 100).toFixed(0)}%)</span><span>{calc.agentFee.toLocaleString()}원</span></div>
              {calc.cbmShipping > 0 && <div className="flex justify-between"><span>CBM운송비</span><span>{calc.cbmShipping.toLocaleString()}원</span></div>}
              <div className="flex justify-between"><span>관세({(selected.customsRate * 100).toFixed(0)}%)</span><span>{calc.customsDuty.toLocaleString()}원</span></div>
              <div className="flex justify-between"><span>부가세(10%)</span><span>{calc.vat.toLocaleString()}원</span></div>
              {selected.inlandShipping > 0 && <div className="flex justify-between"><span>내륙운송</span><span>{selected.inlandShipping.toLocaleString()}원</span></div>}
            </div>
            {selected.moq && selected.moq > 0 && (
              <div className="mt-1 text-sm text-blue-600 font-medium">MOQ: {selected.moq.toLocaleString()}개</div>
            )}
            <p className="text-xs text-orange-200 mt-2">* 과세가격 = 원화원가 기준</p>
          </div>

          {calcWithCurrentRate && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-blue-500 text-base">💡</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-700">환율이 변동되었습니다</p>
                  <p className="text-xs text-blue-500 mt-0.5">
                    저장 시 {selected.exchangeRate.toFixed(1)}원 → 현재 {currentRate.toFixed(1)}원/CNY
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5">
                <span className="text-sm text-gray-600">현재 환율 기준 매입단가</span>
                <span className="text-base font-bold text-blue-700">{formatKrw(calcWithCurrentRate.landedCost)}</span>
              </div>
              <button
                onClick={() => openInCalc({ ...selected, exchangeRate: currentRate })}
                className="mt-2 w-full text-blue-700 bg-blue-100 rounded-xl py-2 text-sm font-semibold"
              >
                현재 환율로 계산기 열기 →
              </button>
            </div>
          )}

          <button
            onClick={() => openInCalc(selected)}
            className="w-full bg-white border border-gray-200 text-gray-700 rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 shadow-sm"
          >
            <Calculator className="w-5 h-5 text-orange-500" />
            계산기에서 수정하기
          </button>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-2">상태 변경</p>
            <div className="flex gap-2">
              {[
                { key: "sourcing", label: "검토중", color: "bg-gray-100 text-gray-700 border-gray-200" },
                { key: "proposed", label: "제안완료", color: "bg-blue-100 text-blue-700 border-blue-200" },
                { key: "ordered", label: "발주완료", color: "bg-green-100 text-green-700 border-green-200" },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={async () => {
                    await fetch(`/api/products/${selected.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ...selected, status: s.key }),
                    });
                    setSelected({ ...selected, status: s.key });
                    setItems((prev) => prev.map((i) => i.id === selected.id ? { ...i, status: s.key } : i));
                  }}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all ${selected.status === s.key ? s.color + " border-2" : "bg-white text-gray-400 border-gray-100"}`}
                >
                  {selected.status === s.key && "✓ "}{s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showForm) {
    const cr = calcLandedCost({
      costCny: form.costCny ?? 0,
      exchangeRate: form.exchangeRate ?? 193.5,
      packagingCost: form.packagingCost ?? 0,
      chinaShipping: form.chinaShipping ?? 0,
      agentFeeRate: form.agentFeeRate ?? 0,
      cbm: form.cbm ?? 0,
      cbmRate: form.cbmRate ?? 90000,
      hasCoOrigin: form.hasCoOrigin ?? false,
      coOriginCost: ((form.coOriginCost as number) || 0) / Math.max(boxQty, 1),
      customsRate: form.customsRate ?? 0.08,
      inlandShipping: form.inlandShipping ?? 0,
    });
    const sellPrice = Math.ceil(cr.landedCost / (1 - targetMarginForm / 100) / 100) * 100;

    return (
      <>
      <div className="min-h-screen pb-28 bg-[#F4F6FA]">
        <header className="text-white px-5 pt-14 pb-5 flex items-center gap-3 bg-[var(--primary)]">
          <button onClick={() => { setShowForm(false); setImagePreview(null); }} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-bold">상품 추가</h1>
        </header>
        <div className="px-4 py-4 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
          {imagePreview ? (
            <div className="space-y-2">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="" className="w-full rounded-2xl object-contain max-h-72 bg-gray-100" />
                <button
                  onClick={() => { setImagePreview(null); setF("imageUrl", null); imageFileRef.current = null; setMarketResult(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={runMarketAnalysis}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-bold shadow-md active:opacity-80"
              >
                <Sparkles className="w-4 h-4" />
                AI 시장조사 — 한국 판매가·마진 분석
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex flex-col items-center justify-center py-10 gap-3 text-white active:opacity-80 shadow-lg"
            >
              <div className="bg-white/20 rounded-full p-4">
                <Camera className="w-9 h-9" />
              </div>
              <div className="text-center">
                <div className="text-base font-bold">사진 촬영 / 선택</div>
                <div className="text-xs text-blue-200 mt-0.5">탭하여 카메라 열기</div>
              </div>
            </button>
          )}

          {/* ── 1. 기본 정보 ── */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
            <ChinesePhrase phrases={[
              { cn: "这个叫什么名字？", pinyin: "쩌거 쟈오 선머 밍쯔?", kr: "이거 이름이 뭐예요?" },
              { cn: "有没有样品？", pinyin: "요우 메이요우 양핀?", kr: "샘플 있어요?" },
              { cn: "你的微信是多少？", pinyin: "니더 웨이신 스 뚜어샤오?", kr: "위챗 ID가 어떻게 돼요?" },
            ]} />

            {/* 상품명 */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">상품명 *</label>
              <input
                type="text"
                value={(form.nameKr as string) || ""}
                onChange={(e) => setF("nameKr", e.target.value)}
                placeholder="예: 면 니트 스웨터"
                autoFocus
                className="w-full border-2 border-blue-200 rounded-xl px-3 py-3 text-base focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 원가 - CNY/KRW/USD 모드 토글 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-500">원가 *</label>
                <div className="flex bg-gray-100 rounded-xl overflow-hidden text-xs font-semibold">
                  <button onClick={() => handleModeChange("cny")} className={`px-3 py-1 transition-colors ${priceMode === "cny" ? "bg-orange-500 text-white" : "text-gray-500"}`}>¥ 위안</button>
                  <button onClick={() => handleModeChange("usd")} className={`px-3 py-1 transition-colors ${priceMode === "usd" ? "bg-green-600 text-white" : "text-gray-500"}`}>$ 달러</button>
                  <button onClick={() => handleModeChange("krw")} className={`px-3 py-1 transition-colors ${priceMode === "krw" ? "bg-orange-500 text-white" : "text-gray-500"}`}>₩ 원</button>
                </div>
              </div>
              {priceMode === "cny" && (
                <>
                  <input type="number" inputMode="decimal" value={form.costCny || ""} onChange={(e) => setF("costCny", parseFloat(e.target.value) || 0)}
                    placeholder="0" className="w-full border-2 border-orange-200 rounded-xl px-3 py-3 text-xl font-bold focus:outline-none focus:border-orange-400" />
                  {(form.costCny ?? 0) > 0 && (form.exchangeRate ?? 0) > 0 && (
                    <p className="text-xs text-gray-400 mt-1">≈ {Math.round((form.costCny as number) * (form.exchangeRate as number)).toLocaleString()}원</p>
                  )}
                </>
              )}
              {priceMode === "usd" && (
                <>
                  <input type="number" inputMode="decimal" value={usdInput || ""} onChange={(e) => handleUsdInput(parseFloat(e.target.value) || 0)}
                    placeholder="0" className="w-full border-2 border-green-200 rounded-xl px-3 py-3 text-xl font-bold focus:outline-none focus:border-green-400" />
                  {usdInput > 0 && (
                    <div className="mt-1 space-y-0.5">
                      <p className="text-xs text-green-600">≈ {Math.round(usdInput * usdKrwRate).toLocaleString()}원 ({usdKrwRate.toLocaleString()}원/$)</p>
                      <p className="text-xs text-orange-500">≈ ¥{form.costCny} ({(form.exchangeRate as number || 193.5).toFixed(1)}원/CNY)</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">💡 캔톤페어·광저우 달러 가격 입력용</p>
                </>
              )}
              {priceMode === "krw" && (
                <>
                  <input type="number" inputMode="decimal" value={krwInput || ""} onChange={(e) => handleKrwInput(parseFloat(e.target.value) || 0)}
                    placeholder="0" className="w-full border-2 border-orange-200 rounded-xl px-3 py-3 text-xl font-bold focus:outline-none focus:border-orange-400" />
                  {krwInput > 0 && (
                    <p className="text-xs text-orange-500 mt-1">= ¥{form.costCny} ({(form.exchangeRate as number || 193.5).toFixed(1)}원/CNY)</p>
                  )}
                </>
              )}
            </div>

            {/* 거래처 */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">거래처 (선택)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={(form as Record<string, unknown>)._supplierName as string || ""}
                  onChange={(e) => setF("_supplierName", e.target.value)}
                  placeholder="예: 义乌好品质百货"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                />
                <button
                  type="button"
                  onClick={() => setShowQR(true)}
                  className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-3 flex items-center gap-1 text-xs font-medium"
                  title="QR 스캔으로 위챗 ID 입력"
                >
                  <QrCode className="w-4 h-4" />
                  위챗QR
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">💡 위챗 QR스캔하면 거래처 정보 자동 입력</p>
            </div>

            {/* 가게 위치 */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">가게 위치 (선택)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={(form as Record<string, unknown>).marketArea as string || ""}
                  onChange={(e) => setF("marketArea", e.target.value)}
                  placeholder="예: 이우 국제상무성 2구 A区 3층"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                />
                <button
                  type="button"
                  onClick={handleLocate}
                  disabled={locating}
                  className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-3 flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap disabled:opacity-60"
                >
                  {locating
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Navigation className="w-4 h-4" />
                  }
                  {locating ? "감지중..." : "현위치"}
                </button>
              </div>
              {Boolean((form as Record<string, unknown>).marketArea) && (
                <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  {(form as Record<string, unknown>).marketArea as string}
                </p>
              )}
            </div>

            {/* QR 스캐너 */}
            {showQR && (
              <QRScanner
                hint="거래처 위챗 QR코드 스캔"
                onResult={(text) => {
                  const wechatMatch = text.match(/weixin:\/\/([^\/?]+)/i) ||
                                       text.match(/wxid_[\w]+/i);
                  if (wechatMatch) {
                    setF("_supplierName", wechatMatch[0]);
                  } else {
                    setF("_supplierName", text.slice(0, 50));
                  }
                  setShowQR(false);
                }}
                onClose={() => setShowQR(false)}
              />
            )}

            {/* MOQ */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">최소주문수량 MOQ (선택)</label>
              <input
                type="number"
                inputMode="numeric"
                value={(form.moq as number) || ""}
                onChange={(e) => setF("moq", parseInt(e.target.value) || null)}
                placeholder="예: 100"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          {/* ── 2. 실시간 환율 ── */}
          {rateInfo && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700">💱 실시간 환율</h3>
                <button
                  onClick={fetchRate}
                  className="text-xs text-blue-500"
                >
                  갱신
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="bg-gray-50 rounded-xl p-2 text-center">
                  <p className="text-xs text-gray-400">기준율</p>
                  <p className="text-sm font-semibold">{rateInfo.baseRate.toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-2 text-center border border-blue-200">
                  <p className="text-xs text-blue-500 font-medium">송금율 ✓</p>
                  <p className="text-sm font-bold text-blue-700">{rateInfo.ttSell.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2 text-center">
                  <p className="text-xs text-gray-400">매입율</p>
                  <p className="text-sm font-semibold">{rateInfo.ttBuy.toFixed(2)}</p>
                </div>
              </div>
              {/* USD/KRW */}
              <div className="bg-green-50 rounded-xl px-3 py-2 flex items-center justify-between mb-2">
                <span className="text-xs text-green-700 font-medium">$ USD/KRW</span>
                <div className="flex items-center gap-1">
                  <input type="number" value={usdKrwRate || ""} onChange={(e) => setUsdKrwRate(parseFloat(e.target.value) || 1350)}
                    className="w-20 text-right border border-green-200 rounded-lg px-2 py-1 text-sm font-bold text-green-800 bg-white focus:outline-none" />
                  <span className="text-xs text-green-600">원/$</span>
                </div>
              </div>
              {/* 계산에 사용하는 환율 */}
              <div>
                <p className="text-xs text-gray-400 mb-1">계산에 사용하는 환율</p>
                <div className="flex items-center gap-2">
                  <input type="number" inputMode="decimal" value={form.exchangeRate || ""}
                    onChange={(e) => setF("exchangeRate", parseFloat(e.target.value) || 0)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-base font-bold focus:outline-none focus:border-blue-400" />
                  <span className="text-sm text-gray-500">원/CNY</span>
                  {currentRate > 0 && Math.abs((form.exchangeRate as number ?? 0) - currentRate) > 1 && (
                    <button onClick={() => setF("exchangeRate", currentRate)} className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">↺ 실시간</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── 3. 세율 / HS코드 ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button onClick={() => setShowTaxSection(v => !v)}
              className="w-full px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">🔍 세율 / HS코드</span>
                {(form.customsRate ?? 0.08) !== 0.08 && (
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                    관세 {((form.customsRate as number) * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              {showTaxSection ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {showTaxSection && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-50">
                {/* HS코드 검색 */}
                <div>
                  <div className="flex items-center justify-between mb-2 pt-3">
                    <label className="text-xs text-gray-500 font-semibold">HS코드 검색</label>
                    <button onClick={() => setShowHsPanel(!showHsPanel)} className="text-xs text-blue-500">{showHsPanel ? "닫기" : "검색"}</button>
                  </div>
                  {showHsPanel && (
                    <div className="space-y-2 mb-2">
                      <div className="flex gap-2">
                        <input type="text" value={hsQuery} onChange={(e) => setHsQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && searchHs()}
                          placeholder="예: 의류, 완구, 화장품..."
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                        <button onClick={searchHs} disabled={hsLoading} className="bg-blue-600 text-white px-4 rounded-lg text-sm">
                          {hsLoading ? "..." : "검색"}
                        </button>
                      </div>
                      {hsResults.length > 0 && (
                        <div className="border border-gray-100 rounded-lg overflow-hidden">
                          {hsResults.map((r) => (
                            <button key={r.hsCode} onClick={() => selectHs(r.hsCode, r.description)}
                              className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0">
                              <span className="font-mono text-blue-600">{r.hsCode}</span>
                              <span className="ml-2 text-gray-700">{r.description}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {form.hsCode && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-bold text-blue-700">HS {form.hsCode as string}</span>
                          <span className="text-xs text-blue-400">AI추정</span>
                        </div>
                        {hsDescription && <p className="text-xs text-blue-600 mt-0.5">{hsDescription}</p>}
                      </div>
                    </div>
                  )}
                  {importNotes && (
                    <div className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-1">{importNotes}</div>
                  )}
                </div>

                {/* 관세율 */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">관세율 (%)</label>
                  <input type="number" inputMode="decimal"
                    value={form.customsRate !== undefined ? ((form.customsRate as number) * 100).toFixed(0) : ""}
                    onChange={(e) => setF("customsRate", (parseFloat(e.target.value) || 0) / 100)}
                    placeholder="8"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                </div>

                {/* 원산지 증명 */}
                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                  <label className="text-sm text-gray-600">원산지 증명 (C/O) (선택)</label>
                  <button onClick={() => setF("hasCoOrigin", !form.hasCoOrigin)}
                    className={`w-12 h-6 rounded-full transition-colors ${form.hasCoOrigin ? "bg-blue-500" : "bg-gray-200"}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.hasCoOrigin ? "translate-x-6" : "translate-x-0"}`} />
                  </button>
                </div>
                {form.hasCoOrigin && (
                  <div className="flex items-center gap-2 pl-2">
                    <label className="text-xs text-gray-500 whitespace-nowrap">C/O 비용</label>
                    <input type="number" inputMode="decimal" value={form.coOriginCost || ""}
                      onChange={(e) => setF("coOriginCost", parseFloat(e.target.value) || 0)}
                      placeholder="0" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                    <span className="text-xs text-gray-400">원</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── 부대비용 ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button onClick={() => setShowSurchargeSection(v => !v)}
              className="w-full px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">💼 부대비용</span>
                {((form.packagingCost as number || 0) > 0 || (form.agentFeeRate as number || 0) > 0) && (
                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">설정됨</span>
                )}
              </div>
              {showSurchargeSection ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {showSurchargeSection && (
              <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">포장비 (원/개)</label>
                    <input type="number" inputMode="decimal" value={form.packagingCost || ""}
                      onChange={(e) => setF("packagingCost", parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">에이전트 수수료 (%)</label>
                    <input type="number" inputMode="decimal"
                      value={form.agentFeeRate !== undefined ? ((form.agentFeeRate as number) * 100).toFixed(0) : ""}
                      onChange={(e) => setF("agentFeeRate", (parseFloat(e.target.value) || 0) / 100)}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-400">💡 에이전트 수수료는 원화원가 기준으로 계산됩니다</p>
              </div>
            )}
          </div>

          {/* ── 4. 운송비 ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button onClick={() => setShowShippingSection(v => !v)}
              className="w-full px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">🚢 운송비 설정</span>
                {(form.cbm as number ?? 0) > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">CBM {form.cbm}</span>
                )}
              </div>
              {showShippingSection ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {showShippingSection && (
              <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
                {/* 중국내 운송비 */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">중국내 운송비 (원)</label>
                  <input type="number" inputMode="decimal" value={form.chinaShipping || ""}
                    onChange={(e) => setF("chinaShipping", parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>

                {/* CBM 운송비 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-gray-500 font-semibold">해상운송비 (CBM)</label>
                    <div className="flex bg-gray-100 rounded-lg overflow-hidden text-xs font-medium">
                      <button onClick={() => setCbmMode("direct")} className={`px-2.5 py-1 ${cbmMode === "direct" ? "bg-blue-500 text-white" : "text-gray-500"}`}>CBM</button>
                      <button onClick={() => setCbmMode("box")} className={`px-2.5 py-1 ${cbmMode === "box" ? "bg-blue-500 text-white" : "text-gray-500"}`}>박스</button>
                      <button onClick={() => setCbmMode("total")} className={`px-2.5 py-1 ${cbmMode === "total" ? "bg-blue-500 text-white" : "text-gray-500"}`}>합계</button>
                    </div>
                  </div>

                  {cbmMode === "direct" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">CBM (m³)</label>
                        <input type="number" inputMode="decimal" step="0.0001" value={(form.cbm as number) > 0 ? form.cbm : ""} onChange={(e) => setF("cbm", parseFloat(e.target.value) || 0)}
                          placeholder="0.0000" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">CBM 단가 (원/m³)</label>
                        <input type="number" inputMode="decimal" value={form.cbmRate || ""} onChange={(e) => setF("cbmRate", parseFloat(e.target.value) || 90000)}
                          placeholder="90000" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                      </div>
                    </div>
                  )}

                  {cbmMode === "box" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        {([["가로", boxL, setBoxL], ["세로", boxW, setBoxW], ["높이", boxH, setBoxH]] as [string, number, (v:number)=>void][]).map(([label, val, setter]) => (
                          <div key={label}>
                            <label className="text-xs text-gray-400 mb-1 block">{label} (cm)</label>
                            <input type="number" inputMode="decimal" value={val || ""} onChange={(e) => setter(parseFloat(e.target.value) || 0)}
                              placeholder="40" className="w-full border border-gray-200 rounded-xl px-2 py-2 text-sm text-center focus:outline-none focus:border-blue-400" />
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">박스당 수량</label>
                          <input type="number" inputMode="numeric" value={boxQty || ""} onChange={(e) => setBoxQty(parseInt(e.target.value) || 1)}
                            placeholder="1" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">CBM 단가 (원/m³)</label>
                          <input type="number" inputMode="decimal" value={form.cbmRate || ""} onChange={(e) => setF("cbmRate", parseFloat(e.target.value) || 90000)}
                            placeholder="90000" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                        </div>
                      </div>
                      {boxL > 0 && boxW > 0 && boxH > 0 && boxQty > 0 && (
                        <div className="bg-blue-50 rounded-xl p-3 text-xs space-y-1">
                          <div className="flex justify-between text-gray-600">
                            <span>1개당 CBM</span>
                            <span className="font-mono">{((boxL * boxW * boxH) / 1_000_000 / boxQty).toFixed(6)} m³</span>
                          </div>
                          <div className="flex justify-between font-bold text-blue-700">
                            <span>개당 운송비</span>
                            <span>{Math.round(((boxL * boxW * boxH) / 1_000_000 / boxQty) * (form.cbmRate as number || 90000)).toLocaleString()}원</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {cbmMode === "total" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="number" inputMode="decimal" value={shippingTotal || ""} onChange={(e) => setShippingTotal(parseFloat(e.target.value) || 0)}
                          placeholder="0" className="flex-1 border-2 border-blue-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                        <span className="text-sm text-gray-500">원</span>
                      </div>
                      <p className="text-xs text-gray-400">이 상품 1개의 운송비 합계를 직접 입력</p>
                    </div>
                  )}
                </div>

                {/* 한국 내륙운송비 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-gray-500 font-semibold">한국 내륙운송비</label>
                    <button onClick={() => setInlandManual(v => !v)}
                      className={`text-xs px-2 py-0.5 rounded-full border ${inlandManual ? "bg-gray-200 text-gray-600" : "bg-green-100 text-green-700 border-green-200"}`}>
                      {inlandManual ? "수동입력" : "자동계산 ✓"}
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2.5 flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">1톤 기준운임</span>
                    <div className="flex items-center gap-1">
                      <input type="number" inputMode="numeric" value={inlandRate || ""} onChange={(e) => { setInlandRate(parseFloat(e.target.value) || 0); setInlandManual(false); }}
                        className="w-24 text-right border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none" />
                      <span className="text-xs text-gray-400">원/4m³</span>
                    </div>
                  </div>
                  {!inlandManual && (form.cbm as number ?? 0) > 0 && (
                    <p className="text-xs text-green-700 bg-green-50 rounded-lg px-2 py-1.5">
                      {(form.cbm as number).toFixed(4)}m³ ÷ 4 × {inlandRate.toLocaleString()}원 = <strong>{Math.round(((form.cbm as number) / 4) * inlandRate).toLocaleString()}원</strong>
                    </p>
                  )}
                  {inlandManual && (
                    <div className="flex items-center gap-2">
                      <input type="number" inputMode="numeric" value={form.inlandShipping || ""} onChange={(e) => setF("inlandShipping", parseFloat(e.target.value) || 0)}
                        placeholder="0" className="flex-1 border-2 border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                      <span className="text-xs text-gray-400">원</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── 5. 계산 결과 ── */}
          {(form.costCny ?? 0) > 0 && (
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base">📊 원가 계산 결과</h3>
              </div>

              {/* 매입단가 */}
              <div className="mb-3">
                <p className="text-orange-200 text-xs mb-0.5">예상 매입단가</p>
                <p className="text-4xl font-bold">{formatKrw(cr.landedCost)}</p>
                <p className="text-orange-200 text-xs mt-0.5">
                  원가 {(form.costCny ?? 0)}CNY × {(form.exchangeRate ?? 193.5).toFixed(1)} + 관세 {((form.customsRate ?? 0.08) * 100).toFixed(0)}% + 부가세
                </p>
              </div>

              {/* 목표 마진율 + 판매가 */}
              <div className="bg-white/15 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-orange-100 font-medium">목표 마진율</span>
                  <div className="flex gap-1.5">
                    {[30, 40, 50].map((v) => (
                      <button
                        key={v}
                        onClick={() => setTargetMarginForm(v)}
                        className={`text-xs px-3 py-1 rounded-lg font-semibold transition-colors ${targetMarginForm === v ? "bg-white text-orange-600" : "bg-white/20 text-white"}`}
                      >
                        {v}%
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-orange-100">권장 판매가</span>
                  <span className="text-2xl font-bold">{sellPrice.toLocaleString()}원</span>
                </div>
                <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-white/20">
                  <span className="text-xs text-orange-200">예상 마진</span>
                  <span className="text-sm font-semibold text-orange-100">+{(sellPrice - cr.landedCost).toLocaleString()}원 ({targetMarginForm}%)</span>
                </div>
              </div>

              {/* 공유 버튼 */}
              <button onClick={() => {
                const text = [
                  `📦 ${(form.nameKr as string) || "상품"} 원가계산`,
                  `─────────────`,
                  `원가: ¥${form.costCny} (${(form.exchangeRate as number || 193.5).toFixed(1)}원/CNY)`,
                  `매입단가: ${cr.landedCost.toLocaleString()}원`,
                  `권장판매가: ${sellPrice.toLocaleString()}원 (마진 ${targetMarginForm}%)`,
                  ...(form.moq ? [`MOQ: ${form.moq}개`] : []),
                  `─────────────`,
                  `📱 소싱킷 앱`,
                ].join("\n");
                if (navigator.share) navigator.share({ text });
                else { navigator.clipboard?.writeText(text); alert("클립보드에 복사됐습니다!"); }
              }} className="mt-3 w-full bg-white/20 text-white text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-2">
                📤 계산결과 공유
              </button>
            </div>
          )}

          <button
            onClick={save}
            disabled={saving}
            className="w-full text-white rounded-2xl py-4 font-bold text-base disabled:opacity-50 bg-[var(--primary)]"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      {/* CBM 계산기 모달 */}
      {showCbmCalc && (
        <CbmCalculator
          initialCbm={form.cbm}
          onApply={(cbm) => setF("cbm", cbm)}
          onClose={() => setShowCbmCalc(false)}
        />
      )}

      {/* AI 시장조사 모달 */}
      {showMarket && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-end">
          <div className="bg-[#F4F6FA] w-full max-h-[90vh] rounded-t-3xl overflow-y-auto overflow-x-hidden">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 px-4 pt-5 pb-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-white" />
                  <h2 className="text-white font-bold text-base">AI 한국 시장조사</h2>
                </div>
                <button onClick={() => setShowMarket(false)} className="bg-white/20 rounded-full p-1.5">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-purple-200 text-xs mt-1">네이버쇼핑 실시간 가격 · AI 마진 분석</p>
            </div>

            <div className="p-4 space-y-3">
              {marketLoading && (
                <div className="bg-white rounded-2xl p-10 flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">사진 분석 중... 잠시만요</p>
                  <p className="text-xs text-gray-400">네이버쇼핑 실시간 가격 조회 중</p>
                </div>
              )}

              {marketError && !marketLoading && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
                  <span className="text-3xl">⚠️</span>
                  <p className="text-sm font-semibold text-red-700">{marketError}</p>
                  <button
                    onClick={runMarketAnalysis}
                    className="mt-1 text-xs bg-red-100 text-red-700 px-4 py-2 rounded-full font-medium active:scale-95 transition-transform"
                  >
                    다시 시도
                  </button>
                </div>
              )}

              {marketResult && !marketLoading && (
                <>
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-1">AI 인식 상품명</p>
                        <p className="text-lg font-bold text-gray-800">{marketResult.productNameKr}</p>
                        <p className="text-sm text-gray-400">{marketResult.productNameCn}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {marketResult.features.map((f, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f}</span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setF("nameKr", marketResult.productNameKr);
                          setF("nameCn", marketResult.productNameCn);
                          setShowMarket(false);
                        }}
                        className="flex-shrink-0 bg-[var(--primary)] text-white text-xs font-bold px-3 py-2 rounded-xl"
                      >
                        이 이름<br/>사용하기
                      </button>
                    </div>
                  </div>

                  {marketResult.hsCode && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-base">🔖</span>
                        <p className="text-sm font-bold text-blue-800">AI 추정 HS코드 · 관세율</p>
                        <span className="text-xs text-blue-400 ml-auto">참고용</span>
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 bg-white rounded-xl px-3 py-2 border border-blue-100">
                          <p className="text-xs text-gray-400">HS코드</p>
                          <p className="text-sm font-bold text-gray-800 font-mono">{marketResult.hsCode}</p>
                        </div>
                        <div className="bg-white rounded-xl px-3 py-2 border border-blue-100 text-center">
                          <p className="text-xs text-gray-400">관세율</p>
                          <p className="text-xl font-black text-orange-600">{marketResult.customsRateKr}%</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setF("nameKr", marketResult.productNameKr);
                          setF("nameCn", marketResult.productNameCn);
                          if (marketResult.customsRateKr !== undefined) {
                            setF("customsRate", marketResult.customsRateKr / 100);
                          }
                          if (marketResult.hsCode) {
                            setF("hsCode", marketResult.hsCode);
                            setHsDescription(marketResult.category || "");
                          }
                          setShowMarket(false);
                        }}
                        className="w-full bg-blue-600 text-white text-sm font-bold py-2.5 rounded-xl active:opacity-80"
                      >
                        ✓ 상품명 + 관세율 한번에 적용
                      </button>
                      <p className="text-[10px] text-blue-400 mt-2 text-center">* AI 추정값입니다. 실제 세율은 관세청에서 확인하세요</p>
                    </div>
                  )}

                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <p className="text-sm font-bold text-gray-700">한국 네이버쇼핑 실시간 가격</p>
                    </div>
                    {marketResult.lowestPrice > 0 ? (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-green-50 rounded-xl p-3 text-center">
                          <p className="text-xs text-green-600 mb-1">최저가</p>
                          <p className="text-base font-bold text-green-700">{marketResult.lowestPrice.toLocaleString()}원</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-3 text-center">
                          <p className="text-xs text-blue-600 mb-1">평균가</p>
                          <p className="text-base font-bold text-blue-700">{marketResult.avgPrice.toLocaleString()}원</p>
                        </div>
                        <div className="bg-orange-50 rounded-xl p-3 text-center">
                          <p className="text-xs text-orange-600 mb-1">최고가</p>
                          <p className="text-base font-bold text-orange-700">{marketResult.highestPrice.toLocaleString()}원</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 mb-3">네이버쇼핑 데이터 없음</p>
                    )}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-gray-400">예상 소싱가</p>
                        <p className="text-xs font-semibold text-gray-700">{marketResult.sourcingPriceEstimate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">예상 마진율</p>
                        <p className="text-xs font-bold text-purple-600">{marketResult.marginEstimate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">경쟁강도</p>
                        <p className={`text-xs font-bold ${marketResult.competitionLevel === "낮음" ? "text-green-600" : marketResult.competitionLevel === "높음" ? "text-red-500" : "text-amber-600"}`}>
                          {marketResult.competitionLevel}
                        </p>
                      </div>
                    </div>
                  </div>

                  {marketResult.naverItems.length > 0 && (
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-700">네이버쇼핑 실제 판매 상품</p>
                      </div>
                      {marketResult.naverItems.slice(0, 4).map((item, i) => (
                        <button key={i} onClick={() => openNewTab(item.link)}
                          className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 active:bg-gray-50 text-left">
                          {item.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-700 truncate">{item.title}</p>
                            <p className="text-xs text-gray-400">{item.mallName}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-gray-800">{parseInt(item.lprice).toLocaleString()}원</p>
                            <ExternalLink className="w-3 h-3 text-gray-300 ml-auto mt-0.5" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className={`rounded-2xl p-4 shadow-sm ${
                    marketResult.recommendation === "추천" ? "bg-green-50 border border-green-100" :
                    marketResult.recommendation === "비추천" ? "bg-red-50 border border-red-100" :
                    "bg-amber-50 border border-amber-100"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                        marketResult.recommendation === "추천" ? "bg-green-500 text-white" :
                        marketResult.recommendation === "비추천" ? "bg-red-500 text-white" :
                        "bg-amber-500 text-white"
                      }`}>
                        {marketResult.recommendation === "추천" ? "✅ 소싱 추천" :
                         marketResult.recommendation === "비추천" ? "❌ 소싱 비추천" : "⚠️ 검토 필요"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{marketResult.recommendReason}</p>
                    <p className="text-xs text-gray-500">{marketResult.aiComment}</p>
                  </div>

                  <div className="bg-white rounded-2xl p-3 shadow-sm flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-gray-700">수입 규제</p>
                      <p className="text-xs text-gray-500 mt-0.5">{marketResult.kcRequired}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-3 shadow-sm">
                    <p className="text-xs font-bold text-gray-700 mb-2">추천 판매 키워드</p>
                    <div className="flex flex-wrap gap-1.5">
                      {marketResult.recommendKeywords.map((kw, i) => (
                        <span key={i} className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-1 rounded-full">{kw}</span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => openNewTab(marketResult.searchLinks.naver)}
                      className="bg-green-500 text-white text-xs font-bold py-2.5 rounded-xl text-center w-full">
                      네이버쇼핑
                    </button>
                    <button onClick={() => openNewTab(marketResult.searchLinks.coupang)}
                      className="bg-red-500 text-white text-xs font-bold py-2.5 rounded-xl text-center w-full">
                      쿠팡
                    </button>
                    <button
                      onClick={() => openNewTab(`https://m.1688.com/offer_search.htm?keywords=${encodeURIComponent(marketResult.productNameCn || marketResult.productNameKr)}`)}
                      className="bg-orange-500 text-white text-xs font-bold py-2.5 rounded-xl text-center w-full"
                    >
                      1688 소싱
                    </button>
                  </div>

                  <p className="text-[10px] text-gray-400 text-center pb-2">
                    ※ 가격은 네이버쇼핑 실시간 데이터 기준 · AI 분석은 참고용입니다
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
    );
  }

  return (
    <div className="min-h-screen pb-28 bg-[#F4F6FA]">
      <header className="text-white px-5 pt-14 pb-5 flex items-center gap-3 bg-[var(--primary)]">
        <Link href="/" className="p-1"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-lg font-bold flex-1">소싱 수첩</h1>
        <span className="text-sm text-blue-200">{items.length}개</span>
      </header>

      <div className="px-4 py-4 space-y-3">
        <div className="bg-white border border-gray-200 rounded-xl flex items-center gap-2 px-3">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="상품명, 거래처 검색..."
            className="flex-1 py-3 text-sm focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none flex-1">
          {[
            { key: "all", label: `전체 ${items.length}` },
            { key: "sourcing", label: `검토중 ${items.filter(i => i.status === "sourcing").length}` },
            { key: "proposed", label: `제안완료 ${items.filter(i => i.status === "proposed").length}` },
            { key: "ordered", label: `발주완료 ${items.filter(i => i.status === "ordered").length}` },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === f.key
                  ? "bg-[var(--primary)] text-white"
                  : "bg-white text-gray-500 border border-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-white focus:outline-none shrink-0"
        >
          <option value="date_desc">최신순</option>
          <option value="date_asc">오래된순</option>
          <option value="price_desc">원가 높은순</option>
          <option value="price_asc">원가 낮은순</option>
          <option value="landed_desc">매입단가 높은순</option>
        </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📦</div>
            <div className="font-medium">소싱 품목이 없습니다</div>
            <div className="text-sm mt-1">+ 버튼으로 추가하세요</div>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => {
              const displayCalc = currentRate > 0
                ? calcLandedCost({ ...item, exchangeRate: currentRate })
                : calcLandedCost(item);
              const isIncomplete = item.cbm === 0 && item.inlandShipping === 0;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left active:scale-95 transition-transform"
                >
                  <div className="flex items-start gap-3">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-gray-900 truncate text-sm leading-snug">{item.nameKr}</div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABELS[item.status]?.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_LABELS[item.status]?.dot}`} />
                            {STATUS_LABELS[item.status]?.label}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {item.supplier && <span className="text-xs text-gray-500 truncate">{item.supplier.name}</span>}
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString("ko-KR")}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-bold text-gray-900">¥{item.costCny.toLocaleString()}</span>
                          <span className={`text-xs font-semibold ${isIncomplete ? "text-gray-400" : "text-orange-500"}`}>
                            {isIncomplete ? "운송비 미입력" : formatKrw(displayCalc.landedCost)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.moq && item.moq > 0 && (
                            <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">MOQ {item.moq.toLocaleString()}</span>
                          )}
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="fixed bottom-24 right-4 z-10">
        <button onClick={() => setShowForm(true)} className="w-14 h-14 text-white rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform bg-[var(--primary)]">
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* 시장조사 모달 (list view) */}
      {showMarket && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-end">
          <div className="bg-[#F4F6FA] w-full max-h-[90vh] rounded-t-3xl overflow-y-auto overflow-x-hidden">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 px-4 pt-5 pb-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-white" />
                  <h2 className="text-white font-bold text-base">AI 한국 시장조사</h2>
                </div>
                <button onClick={() => setShowMarket(false)} className="bg-white/20 rounded-full p-1.5">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-purple-200 text-xs mt-1">네이버쇼핑 실시간 가격 · AI 마진 분석</p>
            </div>

            <div className="p-4 space-y-3">
              {marketLoading && (
                <div className="bg-white rounded-2xl p-10 flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">사진 분석 중... 잠시만요</p>
                  <p className="text-xs text-gray-400">네이버쇼핑 실시간 가격 조회 중</p>
                </div>
              )}

              {marketError && !marketLoading && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
                  <span className="text-3xl">⚠️</span>
                  <p className="text-sm font-semibold text-red-700">{marketError}</p>
                  <button
                    onClick={runMarketAnalysis}
                    className="mt-1 text-xs bg-red-100 text-red-700 px-4 py-2 rounded-full font-medium active:scale-95 transition-transform"
                  >
                    다시 시도
                  </button>
                </div>
              )}

              {marketResult && !marketLoading && (
                <>
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-1">AI 인식 상품명</p>
                        <p className="text-lg font-bold text-gray-800">{marketResult.productNameKr}</p>
                        <p className="text-sm text-gray-400">{marketResult.productNameCn}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {marketResult.features.map((f, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f}</span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setF("nameKr", marketResult.productNameKr);
                          setF("nameCn", marketResult.productNameCn);
                          setShowMarket(false);
                        }}
                        className="flex-shrink-0 bg-[var(--primary)] text-white text-xs font-bold px-3 py-2 rounded-xl"
                      >
                        이 이름<br/>사용하기
                      </button>
                    </div>
                  </div>

                  {marketResult.hsCode && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-base">🔖</span>
                        <p className="text-sm font-bold text-blue-800">AI 추정 HS코드 · 관세율</p>
                        <span className="text-xs text-blue-400 ml-auto">참고용</span>
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 bg-white rounded-xl px-3 py-2 border border-blue-100">
                          <p className="text-xs text-gray-400">HS코드</p>
                          <p className="text-sm font-bold text-gray-800 font-mono">{marketResult.hsCode}</p>
                        </div>
                        <div className="bg-white rounded-xl px-3 py-2 border border-blue-100 text-center">
                          <p className="text-xs text-gray-400">관세율</p>
                          <p className="text-xl font-black text-orange-600">{marketResult.customsRateKr}%</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setF("nameKr", marketResult.productNameKr);
                          setF("nameCn", marketResult.productNameCn);
                          if (marketResult.customsRateKr !== undefined) {
                            setF("customsRate", marketResult.customsRateKr / 100);
                          }
                          if (marketResult.hsCode) {
                            setF("hsCode", marketResult.hsCode);
                            setHsDescription(marketResult.category || "");
                          }
                          setShowMarket(false);
                        }}
                        className="w-full bg-blue-600 text-white text-sm font-bold py-2.5 rounded-xl active:opacity-80"
                      >
                        ✓ 상품명 + 관세율 한번에 적용
                      </button>
                      <p className="text-[10px] text-blue-400 mt-2 text-center">* AI 추정값입니다. 실제 세율은 관세청에서 확인하세요</p>
                    </div>
                  )}

                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <p className="text-sm font-bold text-gray-700">한국 네이버쇼핑 실시간 가격</p>
                    </div>
                    {marketResult.lowestPrice > 0 ? (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-green-50 rounded-xl p-3 text-center">
                          <p className="text-xs text-green-600 mb-1">최저가</p>
                          <p className="text-base font-bold text-green-700">{marketResult.lowestPrice.toLocaleString()}원</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-3 text-center">
                          <p className="text-xs text-blue-600 mb-1">평균가</p>
                          <p className="text-base font-bold text-blue-700">{marketResult.avgPrice.toLocaleString()}원</p>
                        </div>
                        <div className="bg-orange-50 rounded-xl p-3 text-center">
                          <p className="text-xs text-orange-600 mb-1">최고가</p>
                          <p className="text-base font-bold text-orange-700">{marketResult.highestPrice.toLocaleString()}원</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 mb-3">네이버쇼핑 데이터 없음</p>
                    )}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-gray-400">예상 소싱가</p>
                        <p className="text-xs font-semibold text-gray-700">{marketResult.sourcingPriceEstimate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">예상 마진율</p>
                        <p className="text-xs font-bold text-purple-600">{marketResult.marginEstimate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">경쟁강도</p>
                        <p className={`text-xs font-bold ${marketResult.competitionLevel === "낮음" ? "text-green-600" : marketResult.competitionLevel === "높음" ? "text-red-500" : "text-amber-600"}`}>
                          {marketResult.competitionLevel}
                        </p>
                      </div>
                    </div>
                  </div>

                  {marketResult.naverItems.length > 0 && (
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-700">네이버쇼핑 실제 판매 상품</p>
                      </div>
                      {marketResult.naverItems.slice(0, 4).map((item, i) => (
                        <button key={i} onClick={() => openNewTab(item.link)}
                          className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 active:bg-gray-50 text-left">
                          {item.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-700 truncate">{item.title}</p>
                            <p className="text-xs text-gray-400">{item.mallName}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-gray-800">{parseInt(item.lprice).toLocaleString()}원</p>
                            <ExternalLink className="w-3 h-3 text-gray-300 ml-auto mt-0.5" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className={`rounded-2xl p-4 shadow-sm ${
                    marketResult.recommendation === "추천" ? "bg-green-50 border border-green-100" :
                    marketResult.recommendation === "비추천" ? "bg-red-50 border border-red-100" :
                    "bg-amber-50 border border-amber-100"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                        marketResult.recommendation === "추천" ? "bg-green-500 text-white" :
                        marketResult.recommendation === "비추천" ? "bg-red-500 text-white" :
                        "bg-amber-500 text-white"
                      }`}>
                        {marketResult.recommendation === "추천" ? "✅ 소싱 추천" :
                         marketResult.recommendation === "비추천" ? "❌ 소싱 비추천" : "⚠️ 검토 필요"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{marketResult.recommendReason}</p>
                    <p className="text-xs text-gray-500">{marketResult.aiComment}</p>
                  </div>

                  <div className="bg-white rounded-2xl p-3 shadow-sm flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-gray-700">수입 규제</p>
                      <p className="text-xs text-gray-500 mt-0.5">{marketResult.kcRequired}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-3 shadow-sm">
                    <p className="text-xs font-bold text-gray-700 mb-2">추천 판매 키워드</p>
                    <div className="flex flex-wrap gap-1.5">
                      {marketResult.recommendKeywords.map((kw, i) => (
                        <span key={i} className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-1 rounded-full">{kw}</span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => openNewTab(marketResult.searchLinks.naver)}
                      className="bg-green-500 text-white text-xs font-bold py-2.5 rounded-xl text-center w-full">
                      네이버쇼핑
                    </button>
                    <button onClick={() => openNewTab(marketResult.searchLinks.coupang)}
                      className="bg-red-500 text-white text-xs font-bold py-2.5 rounded-xl text-center w-full">
                      쿠팡
                    </button>
                    <button
                      onClick={() => openNewTab(`https://m.1688.com/offer_search.htm?keywords=${encodeURIComponent(marketResult.productNameCn || marketResult.productNameKr)}`)}
                      className="bg-orange-500 text-white text-xs font-bold py-2.5 rounded-xl text-center w-full"
                    >
                      1688 소싱
                    </button>
                  </div>

                  <p className="text-[10px] text-gray-400 text-center pb-2">
                    ※ 가격은 네이버쇼핑 실시간 데이터 기준 · AI 분석은 참고용입니다
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
