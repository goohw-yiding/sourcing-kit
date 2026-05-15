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
  const [showAdvanced, setShowAdvanced] = useState(false);
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

  const handleLocate = async () => {
    setLocating(true);
    try {
      const loc = await detectMarketLocation();
      setF("marketArea", loc);
      if (!showAdvanced) setShowAdvanced(true);
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

  // 환율 자동 로드 (폼 + 현재 환율 상태 동시 저장)
  useEffect(() => {
    fetch("/api/exchange-rate")
      .then((r) => r.json())
      .then((d) => {
        const rate = d.ttSell || d.rate || 193.5;
        setCurrentRate(rate);
        setForm((p) => ({ ...p, exchangeRate: rate }));
      });
  }, []);

  useEffect(() => { load(); }, [load]);

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

  // 소싱 폼 → 계산기: 현재 폼 데이터를 URL 파라미터로 넘겨 계산기 열기
  const openFormInCalc = () => {
    // 폼에서 입력한 텍스트 데이터를 sessionStorage에 보존
    sessionStorage.setItem("sourcing_form_meta", JSON.stringify({
      nameKr: (form.nameKr as string) || "",
      supplierName: (form as Record<string, unknown>)._supplierName as string || "",
      marketArea: (form as Record<string, unknown>).marketArea as string || "",
      moq: form.moq || null,
      nameCn: (form.nameCn as string) || "",
      imageUrl: (form.imageUrl as string) || "",
    }));
    const params = new URLSearchParams({
      costCny: String(form.costCny || 0),
      exchangeRate: String(form.exchangeRate || 193.5),
      customsRate: String(form.customsRate || 0.08),
      agentFeeRate: String(form.agentFeeRate || 0),
      cbm: String(form.cbm || 0),
      cbmRate: String(form.cbmRate || 90000),
      packagingCost: String(form.packagingCost || 0),
      chinaShipping: String(form.chinaShipping || 0),
      inlandShipping: String(form.inlandShipping || 0),
      name: (form.nameKr as string) || "",
      returnTo: "sourcing",
    });
    router.push(`/calculator?${params.toString()}`);
  };

  // 계산기에서 돌아왔을 때 값 복원
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
      setShowAdvanced(true);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    imageFileRef.current = file;
    setImagePreview(URL.createObjectURL(file));
    setMarketResult(null);
    // base64로 변환해서 DB 저장용으로 사용 (Vercel 서버리스는 파일시스템 쓰기 불가)
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
        // 방금 촬영/선택한 파일이 메모리에 있는 경우
        fd.append("image", imageFileRef.current);
      } else if (form.imageUrl) {
        // 이미 서버에 업로드된 이미지 URL → 다시 fetch해서 blob으로 전송
        const imgRes = await fetch(form.imageUrl as string);
        const blob = await imgRes.blob();
        fd.append("image", blob, "product.jpg");
      } else if (form.nameKr) {
        // 이미지 없으면 상품명으로 분석
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

          {/* 환율 차이 알림 */}
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

          {/* 상태 변경 */}
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

          {/* 필수: 상품명 + 가격 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
            <ChinesePhrase phrases={[
              { cn: "这个叫什么名字？", pinyin: "쩌거 쟈오 선머 밍쯔?", kr: "이거 이름이 뭐예요?" },
              { cn: "有没有样品？", pinyin: "요우 메이요우 양핀?", kr: "샘플 있어요?" },
              { cn: "你的微信是多少？", pinyin: "니더 웨이신 스 뚜어샤오?", kr: "위챗 ID가 어떻게 돼요?" },
            ]} />
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
            <div>
              <label className="text-xs text-gray-500 mb-1 block">원가 (CNY) *</label>
              <input
                type="number"
                inputMode="decimal"
                value={form.costCny || ""}
                onChange={(e) => setF("costCny", parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full border-2 border-orange-200 rounded-xl px-3 py-3 text-xl font-bold focus:outline-none focus:border-orange-400"
              />
            </div>
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
                  // WeChat QR 결과에서 ID 추출 시도
                  const wechatMatch = text.match(/weixin:\/\/([^\/?]+)/i) ||
                                       text.match(/wxid_[\w]+/i);
                  if (wechatMatch) {
                    setF("_supplierName", wechatMatch[0]);
                  } else {
                    // QR 내용 그대로 메모
                    setF("_supplierName", text.slice(0, 50));
                  }
                  setShowQR(false);
                }}
                onClose={() => setShowQR(false)}
              />
            )}
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

          {/* 💰 원가 계산 섹션 */}
          <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className={`flex-1 rounded-2xl px-4 py-3 border flex items-center justify-between text-sm font-medium transition-colors ${showAdvanced ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-white border-gray-200 text-gray-500"}`}
          >
            <span className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              원가 계산 설정
              {form.costCny && form.costCny > 0 && !showAdvanced && (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-normal">
                  {formatKrw(calcLandedCost({
                    costCny: form.costCny ?? 0,
                    exchangeRate: form.exchangeRate ?? 193.5,
                    packagingCost: form.packagingCost ?? 0,
                    chinaShipping: form.chinaShipping ?? 0,
                    agentFeeRate: form.agentFeeRate ?? 0,
                    cbm: form.cbm ?? 0,
                    cbmRate: form.cbmRate ?? 90000,
                    hasCoOrigin: form.hasCoOrigin ?? false,
                    coOriginCost: form.coOriginCost ?? 0,
                    customsRate: form.customsRate ?? 0.08,
                    inlandShipping: form.inlandShipping ?? 0,
                  }).landedCost)}
                </span>
              )}
            </span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={openFormInCalc}
            className="shrink-0 bg-orange-500 text-white rounded-2xl px-4 py-3 text-sm font-semibold flex items-center gap-1.5"
          >
            <Calculator className="w-4 h-4" />
            계산기
          </button>
          </div>

          {showAdvanced && (() => {
            const calcResult = calcLandedCost({
              costCny: form.costCny ?? 0,
              exchangeRate: form.exchangeRate ?? 193.5,
              packagingCost: form.packagingCost ?? 0,
              chinaShipping: form.chinaShipping ?? 0,
              agentFeeRate: form.agentFeeRate ?? 0,
              cbm: form.cbm ?? 0,
              cbmRate: form.cbmRate ?? 90000,
              hasCoOrigin: form.hasCoOrigin ?? false,
              coOriginCost: form.coOriginCost ?? 0,
              customsRate: form.customsRate ?? 0.08,
              inlandShipping: form.inlandShipping ?? 0,
            });
            return (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* 중국어 상품명 */}
                <div className="px-4 pt-4 pb-2 space-y-3 border-b border-gray-50">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">중국어 상품명</label>
                    <input type="text" value={(form.nameCn as string) || ""} onChange={(e) => setF("nameCn", e.target.value)} placeholder="棉针织毛衣"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                </div>

                {/* 환율 / 관세율 / 에이전트 */}
                <div className="px-4 py-3 space-y-2 border-b border-gray-50">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">세율 설정</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">환율(원/CNY)</label>
                      <div className="relative">
                        <input type="number" inputMode="decimal" value={form.exchangeRate || ""}
                          onChange={(e) => setF("exchangeRate", parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 pr-8" />
                        {currentRate > 0 && Math.abs((form.exchangeRate ?? 0) - currentRate) > 1 && (
                          <button type="button" onClick={() => setF("exchangeRate", currentRate)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-500 font-bold">↺</button>
                        )}
                      </div>
                      {currentRate > 0 && <p className="text-xs text-gray-400 mt-0.5">실시간 {currentRate.toFixed(1)}</p>}
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">관세율(%)</label>
                      <input type="number" inputMode="decimal"
                        value={form.customsRate !== undefined ? (form.customsRate * 100).toFixed(0) : ""}
                        onChange={(e) => setF("customsRate", (parseFloat(e.target.value) || 0) / 100)}
                        placeholder="8"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">에이전트(%)</label>
                      <input type="number" inputMode="decimal"
                        value={form.agentFeeRate !== undefined ? (form.agentFeeRate * 100).toFixed(0) : ""}
                        onChange={(e) => setF("agentFeeRate", (parseFloat(e.target.value) || 0) / 100)}
                        placeholder="0"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                    </div>
                  </div>
                </div>

                {/* 운송비 */}
                <div className="px-4 py-3 space-y-2 border-b border-gray-50">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">운송비</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">CBM (m³)</label>
                      <div className="flex gap-1.5">
                        <input type="number" inputMode="decimal" value={form.cbm || ""}
                          onChange={(e) => setF("cbm", parseFloat(e.target.value) || 0)}
                          placeholder="0.000"
                          className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                        <button
                          type="button"
                          onClick={() => setShowCbmCalc(true)}
                          className="shrink-0 bg-orange-50 border border-orange-200 text-orange-600 rounded-xl px-2.5 text-xs font-bold"
                          title="가로×세로×높이 계산"
                        >
                          📐
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">운임단가(원/m³)</label>
                      <input type="number" inputMode="numeric" value={form.cbmRate || ""}
                        onChange={(e) => setF("cbmRate", parseFloat(e.target.value) || 90000)}
                        placeholder="90000"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">한국 내륙운송비 (원, 개당)</label>
                    <input type="number" inputMode="numeric" value={form.inlandShipping || ""}
                      onChange={(e) => setF("inlandShipping", parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                  </div>
                </div>

                {/* 계산 결과 요약 */}
                {(form.costCny ?? 0) > 0 && (
                  <div className="bg-orange-50 px-4 py-3">
                    <p className="text-xs font-semibold text-orange-400 mb-2 uppercase tracking-wide">계산 결과</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>원화원가 ({(form.costCny ?? 0)}CNY × {(form.exchangeRate ?? 0).toFixed(1)})</span>
                        <span>{calcResult.costKrw.toLocaleString()}원</span>
                      </div>
                      {calcResult.agentFee > 0 && (
                        <div className="flex justify-between text-gray-600">
                          <span>에이전트 ({((form.agentFeeRate ?? 0) * 100).toFixed(0)}%)</span>
                          <span>{calcResult.agentFee.toLocaleString()}원</span>
                        </div>
                      )}
                      {calcResult.cbmShipping > 0 && (
                        <div className="flex justify-between text-gray-600">
                          <span>운송비 ({(form.cbm ?? 0).toFixed(3)}m³)</span>
                          <span>{calcResult.cbmShipping.toLocaleString()}원</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-600">
                        <span>관세 ({((form.customsRate ?? 0) * 100).toFixed(0)}%)</span>
                        <span>{calcResult.customsDuty.toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>부가세 (10%)</span>
                        <span>{calcResult.vat.toLocaleString()}원</span>
                      </div>
                      {calcResult.inlandShipping > 0 && (
                        <div className="flex justify-between text-gray-600">
                          <span>내륙운송비</span>
                          <span>{calcResult.inlandShipping.toLocaleString()}원</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-orange-700 text-base pt-1 border-t border-orange-200 mt-1">
                        <span>예상 매입단가</span>
                        <span>{formatKrw(calcResult.landedCost)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

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

      {/* AI 시장조사 모달 (폼에서도 표시) */}
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
                      <div>
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
                    {[
                      { name: "네이버쇼핑", url: marketResult.searchLinks.naver, color: "bg-green-500" },
                      { name: "쿠팡", url: marketResult.searchLinks.coupang, color: "bg-red-500" },
                      { name: "1688소싱", url: `https://m.1688.com/offer_search.htm?keywords=${encodeURIComponent(marketResult.productNameCn || marketResult.productNameKr)}&language=zh_CN`, color: "bg-orange-500" },
                    ].map((site) => (
                      <button key={site.name}
                        onClick={() => openNewTab(site.url)}
                        className={`${site.color} text-white text-xs font-bold py-2.5 rounded-xl text-center w-full`}>
                        {site.name}
                      </button>
                    ))}
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

        {/* 상태 필터 탭 + 정렬 */}
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
        {/* 정렬 드롭다운 */}
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
              // 현재 환율이 있으면 재계산, 없으면 저장값 사용
              const displayCalc = currentRate > 0
                ? calcLandedCost({ ...item, exchangeRate: currentRate })
                : calcLandedCost(item);
              // 운송비/관세 정보가 없어 가격이 불완전한지 판단
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
                      {/* 상단: 상품명 + 상태 배지 */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-gray-900 truncate text-sm leading-snug">{item.nameKr}</div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABELS[item.status]?.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_LABELS[item.status]?.dot}`} />
                            {STATUS_LABELS[item.status]?.label}
                          </span>
                        </div>
                      </div>
                      {/* 중단: 거래처 + 날짜 */}
                      <div className="flex items-center gap-2 mt-1">
                        {item.supplier && <span className="text-xs text-gray-500 truncate">{item.supplier.name}</span>}
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString("ko-KR")}</span>
                      </div>
                      {/* 하단: 가격 정보 */}
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

      {/* 시장조사 모달 */}
      {showMarket && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-end">
          <div className="bg-[#F4F6FA] w-full max-h-[90vh] rounded-t-3xl overflow-y-auto overflow-x-hidden">
            {/* 헤더 */}
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
                  {/* 상품명 카드 */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
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

                  {/* 한국 가격 현황 */}
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

                  {/* 실제 판매 상품 목록 */}
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

                  {/* AI 추천 의견 */}
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

                  {/* KC 인증 */}
                  <div className="bg-white rounded-2xl p-3 shadow-sm flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-gray-700">수입 규제</p>
                      <p className="text-xs text-gray-500 mt-0.5">{marketResult.kcRequired}</p>
                    </div>
                  </div>

                  {/* 판매 키워드 */}
                  <div className="bg-white rounded-2xl p-3 shadow-sm">
                    <p className="text-xs font-bold text-gray-700 mb-2">추천 판매 키워드</p>
                    <div className="flex flex-wrap gap-1.5">
                      {marketResult.recommendKeywords.map((kw, i) => (
                        <span key={i} className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-1 rounded-full">{kw}</span>
                      ))}
                    </div>
                  </div>

                  {/* 쇼핑몰 바로가기 */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: "네이버쇼핑", url: marketResult.searchLinks.naver, color: "bg-green-500" },
                      { name: "쿠팡", url: marketResult.searchLinks.coupang, color: "bg-red-500" },
                      { name: "1688소싱", url: `https://m.1688.com/offer_search.htm?keywords=${encodeURIComponent(marketResult.productNameCn || marketResult.productNameKr)}&language=zh_CN`, color: "bg-orange-500" },
                    ].map((site) => (
                      <button key={site.name}
                        onClick={() => openNewTab(site.url)}
                        className={`${site.color} text-white text-xs font-bold py-2.5 rounded-xl text-center w-full`}>
                        {site.name}
                      </button>
                    ))}
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

