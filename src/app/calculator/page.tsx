"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, RefreshCw, ChevronDown, ChevronUp, Info, BookmarkPlus, Check, Share2 } from "lucide-react";
import Link from "next/link";
import { ChinesePhrase } from "@/components/ChinesePhrase";
import { useSearchParams, useRouter } from "next/navigation";
import { calcLandedCost, formatKrw, type CalcInput } from "@/lib/calc";

const DEFAULT_INPUT: CalcInput = {
  costCny: 0,
  exchangeRate: 193.5,
  packagingCost: 0,
  chinaShipping: 0,
  agentFeeRate: 0,
  cbm: 0,
  cbmRate: 90000,
  hasCoOrigin: false,
  coOriginCost: 0,
  customsRate: 0.08,
  inlandShipping: 0,
};

interface RateInfo {
  baseRate: number;
  ttSell: number;
  ttBuy: number;
  usdKrw: number;
  date: string;
  source: string;
}

export default function CalculatorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const returnTo = searchParams?.get("returnTo");
  const [input, setInput] = useState<CalcInput>(() => {
    const p = (key: string, fallback: number) => {
      const v = searchParams?.get(key);
      return v !== null && v !== "" ? parseFloat(v) : fallback;
    };
    return {
      ...DEFAULT_INPUT,
      costCny: p("costCny", 0),
      exchangeRate: p("exchangeRate", 193.5),
      customsRate: p("customsRate", 0.08),
      agentFeeRate: p("agentFeeRate", 0),
      cbm: p("cbm", 0),
      cbmRate: p("cbmRate", 90000),
      packagingCost: p("packagingCost", 0),
      chinaShipping: p("chinaShipping", 0),
      inlandShipping: p("inlandShipping", 0),
    };
  });
  const [showDetail, setShowDetail] = useState(true);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateInfo, setRateInfo] = useState<RateInfo | null>(null);
  const [hsQuery, setHsQuery] = useState("");
  const [hsResults, setHsResults] = useState<{ hsCode: string; description: string }[]>([]);
  const [hsLoading, setHsLoading] = useState(false);
  const [showHsPanel, setShowHsPanel] = useState(false);
  const [selectedHs, setSelectedHs] = useState("");
  const [importNotes, setImportNotes] = useState("");
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [saveName, setSaveName] = useState(searchParams?.get("name") || "");
  const [saveSupplier, setSaveSupplier] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [moq, setMoq] = useState(0);
  const [targetMargin, setTargetMargin] = useState(40); // 목표 마진율 %

  // 한국 내륙운송비: 1톤=4CBM 기준 자동계산
  const [inlandRate, setInlandRate] = useState(100000); // 1톤 기준 운임 (원) — 실제 시세 반영
  const [inlandManual, setInlandManual] = useState(false); // 수동입력 모드

  // 원가 입력 모드: CNY / KRW / USD
  const [priceMode, setPriceMode] = useState<"cny" | "krw" | "usd">("cny");
  const [krwInput, setKrwInput] = useState(0);
  const [usdInput, setUsdInput] = useState(0);
  const [usdKrwRate, setUsdKrwRate] = useState(1350); // USD/KRW

  // CBM 계산 모드: 직접입력 / 박스크기 계산 / 합계직접입력 / 컨테이너
  const [cbmMode, setCbmMode] = useState<"direct" | "box" | "total" | "container">("direct");
  const [boxL, setBoxL] = useState(0);
  const [boxW, setBoxW] = useState(0);
  const [boxH, setBoxH] = useState(0);
  const [boxQty, setBoxQty] = useState(1);
  const [shippingTotal, setShippingTotal] = useState(0);
  // 컨테이너 모드
  const [containerCostKrw, setContainerCostKrw] = useState(0);   // 컨테이너 총 운임 (원)
  const [containerCostUsd, setContainerCostUsd] = useState(0);   // 컨테이너 총 운임 (달러)
  const [containerCostMode, setContainerCostMode] = useState<"krw" | "usd">("usd"); // 입력 통화
  const [containerTotalQty, setContainerTotalQty] = useState(0); // 컨테이너 내 총 수량

  const result = calcLandedCost(input);

  // 박스 모드: CBM 자동 동기화
  useEffect(() => {
    if (cbmMode === "box" && boxQty > 0) {
      const itemCbm = (boxL * boxW * boxH) / 1_000_000 / boxQty;
      setInput((prev) => ({ ...prev, cbm: Math.round(itemCbm * 1_000_000) / 1_000_000 }));
    }
  }, [cbmMode, boxL, boxW, boxH, boxQty]);

  // 합계 모드: cbm=1, cbmRate=입력한 합계금액
  useEffect(() => {
    if (cbmMode === "total") {
      setInput((prev) => ({ ...prev, cbm: 1, cbmRate: shippingTotal }));
    }
  }, [cbmMode, shippingTotal]);

  // 컨테이너 모드: 개당 운송비 계산
  useEffect(() => {
    if (cbmMode === "container" && containerTotalQty > 0) {
      const totalKrw = containerCostMode === "usd"
        ? Math.round(containerCostUsd * usdKrwRate)
        : containerCostKrw;
      const perItem = totalKrw > 0 ? Math.round(totalKrw / containerTotalQty) : 0;
      setInput((prev) => ({ ...prev, cbm: 1, cbmRate: perItem }));
    }
  }, [cbmMode, containerCostKrw, containerCostUsd, containerCostMode, containerTotalQty, usdKrwRate]);

  // 한국 내륙운송비 자동계산: (CBM ÷ 4) × 1톤 기준운임
  useEffect(() => {
    if (!inlandManual && input.cbm > 0 && inlandRate > 0) {
      const auto = Math.round((input.cbm / 4) * inlandRate);
      setInput((prev) => ({ ...prev, inlandShipping: auto }));
    }
  }, [input.cbm, inlandRate, inlandManual]);

  const handleKrwInput = (v: number) => {
    setKrwInput(v);
    setInput((prev) => ({ ...prev, costCny: Math.round((v / (prev.exchangeRate || 193.5)) * 100) / 100 }));
  };

  const handleUsdInput = (v: number) => {
    setUsdInput(v);
    // USD → KRW → CNY 변환
    const krw = Math.round(v * usdKrwRate);
    setInput((prev) => ({ ...prev, costCny: Math.round((krw / (prev.exchangeRate || 193.5)) * 100) / 100 }));
  };

  const fetchRate = useCallback(async () => {
    setRateLoading(true);
    try {
      const res = await fetch("/api/exchange-rate");
      const data: RateInfo = await res.json();
      setRateInfo(data);
      setInput((prev) => ({ ...prev, exchangeRate: data.ttSell }));
      if (data.usdKrw) setUsdKrwRate(data.usdKrw);
    } finally {
      setRateLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

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
    setSelectedHs(hsCode);
    setShowHsPanel(false);
    const res = await fetch(`/api/hs/rate?hs=${hsCode}`);
    const data = await res.json();
    setInput((prev) => ({ ...prev, customsRate: data.rate, hsCode }));
    setImportNotes(data.importNotes || "");
    setHsQuery(desc);
  };

  const set = (key: keyof CalcInput, value: number | boolean) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  const saveToNotebook = async () => {
    if (!saveName.trim() || !input.costCny) return;
    setSaving(true);
    try {
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameKr: saveName.trim(),
          supplierName: saveSupplier.trim() || undefined,
          costCny: input.costCny,
          exchangeRate: input.exchangeRate,
          customsRate: input.customsRate,
          agentFeeRate: input.agentFeeRate,
          cbm: input.cbm,
          cbmRate: input.cbmRate,
          packagingCost: input.packagingCost,
          chinaShipping: input.chinaShipping,
          inlandShipping: input.inlandShipping,
          hasCoOrigin: input.hasCoOrigin,
          coOriginCost: input.coOriginCost,
          moq: moq || null,
        }),
      });
      setSaved(true);
      setShowSaveSheet(false);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const numInput = (
    label: string,
    key: keyof CalcInput,
    _unit = "원",
    _placeholder = "0",
    phrases?: Array<{ cn: string; pinyin: string; kr: string }>
  ) => {
    const krwVal = (input[key] as number) || 0;
    const cnyVal = input.exchangeRate > 0 ? Math.round((krwVal / input.exchangeRate) * 100) / 100 : 0;
    return (
      <div className="py-3 border-b border-gray-100 last:border-0">
        <div className="flex items-center justify-between gap-2">
          <div className="shrink-0">
            <label className="text-sm text-gray-600">{label}</label>
            {phrases && <ChinesePhrase phrases={phrases} />}
          </div>
          <div className="flex items-center gap-1.5">
            {/* 위안 입력 */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-orange-400 font-bold">¥</span>
              <input
                type="number"
                inputMode="decimal"
                value={cnyVal || ""}
                onChange={(e) => {
                  const cny = parseFloat(e.target.value) || 0;
                  set(key, Math.round(cny * input.exchangeRate));
                }}
                placeholder="0"
                className="w-20 text-right border border-orange-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-orange-400 bg-orange-50"
              />
            </div>
            <span className="text-gray-300 text-xs">=</span>
            {/* 원화 입력 */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                inputMode="decimal"
                value={krwVal || ""}
                onChange={(e) => set(key, parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-24 text-right border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
              />
              <span className="text-xs text-gray-400">원</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const sourceLabel = rateInfo?.source === "koreaexim"
    ? "한국수출입은행"
    : rateInfo?.source === "frankfurter"
    ? "유럽중앙은행(ECB) 기준"
    : rateInfo?.source === "exchangerate-api"
    ? "ExchangeRate-API"
    : "기본값";

  return (
    <div className="min-h-screen pb-28 bg-[#F4F6FA]">
      {/* 헤더 */}
      <header className="text-white px-5 pt-14 pb-5 flex items-center gap-3 bg-[var(--primary)]">
        {returnTo === "sourcing" ? (
          <button
            onClick={() => router.back()}
            className="p-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <Link href="/" className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}
        <h1 className="text-lg font-bold flex-1">원가 계산기</h1>
        <span className="text-xs bg-orange-400 rounded-full px-2 py-0.5">참고용 견적</span>
      </header>

      {/* 소싱수첩에서 열린 경우 — 상단 배너 */}
      {returnTo === "sourcing" && (
        <div className="bg-orange-50 border-b border-orange-200 px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-orange-700 font-medium">소싱수첩 상품 계산 중</p>
          <button
            onClick={() => {
              sessionStorage.setItem("calc_return_data", JSON.stringify({
                costCny: input.costCny,
                exchangeRate: input.exchangeRate,
                customsRate: input.customsRate,
                agentFeeRate: input.agentFeeRate,
                cbm: input.cbm,
                cbmRate: input.cbmRate,
                packagingCost: input.packagingCost,
                chinaShipping: input.chinaShipping,
                inlandShipping: input.inlandShipping,
                hasCoOrigin: input.hasCoOrigin,
                coOriginCost: input.coOriginCost,
              }));
              router.push("/sourcing?fromCalc=1");
            }}
            className="bg-orange-500 text-white text-sm font-bold px-4 py-1.5 rounded-full"
          >
            ← 소싱수첩에 적용
          </button>
        </div>
      )}

      <div className="px-4 py-5 space-y-4">

        {/* 환율 카드 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">📅 당일 환율 (CNY/KRW)</h2>
            <button
              onClick={fetchRate}
              className="text-blue-500 text-sm flex items-center gap-1"
              disabled={rateLoading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${rateLoading ? "animate-spin" : ""}`} />
              갱신
            </button>
          </div>

          {/* 환율 표시 */}
          {rateInfo && (
            <div className="space-y-2 mb-3">
              {/* CNY */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                  <p className="text-xs text-gray-400 mb-1">CNY 기준율</p>
                  <p className="text-sm font-semibold text-gray-700">{rateInfo.baseRate.toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-2.5 text-center border-2 border-blue-300">
                  <p className="text-xs text-blue-500 mb-1 font-medium">CNY 송금율 ✓</p>
                  <p className="text-sm font-bold text-blue-700">{rateInfo.ttSell.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                  <p className="text-xs text-gray-400 mb-1">CNY 매입율</p>
                  <p className="text-sm font-semibold text-gray-700">{rateInfo.ttBuy.toFixed(2)}</p>
                </div>
              </div>
              {/* USD */}
              <div className="bg-green-50 rounded-xl p-2.5 flex items-center justify-between border border-green-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">$</span>
                  <span className="text-xs text-green-700 font-medium">USD/KRW (박람회 달러 환율)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={usdKrwRate || ""}
                    onChange={(e) => setUsdKrwRate(parseFloat(e.target.value) || 1350)}
                    className="w-20 text-right border border-green-200 rounded-lg px-2 py-1 text-sm font-bold text-green-800 bg-white focus:outline-none focus:border-green-400"
                  />
                  <span className="text-xs text-green-600">원/$</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">계산에 사용하는 환율 (직접 수정 가능)</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  value={input.exchangeRate || ""}
                  onChange={(e) => set("exchangeRate", parseFloat(e.target.value) || 0)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-lg font-bold focus:outline-none focus:border-blue-400"
                />
                <span className="text-gray-500 text-sm whitespace-nowrap">원/CNY</span>
              </div>
            </div>
          </div>

          {rateInfo && (
            <p className="text-xs text-gray-400 mt-2">
              출처: {sourceLabel} ({rateInfo.date}) · 전신환매도율 자동 적용
            </p>
          )}
        </div>

        {/* 원가 입력 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">💴 상품 원가</h2>
            <div className="flex bg-gray-100 rounded-xl overflow-hidden text-xs font-semibold">
              <button
                onClick={() => setPriceMode("cny")}
                className={`px-3 py-1.5 transition-colors ${priceMode === "cny" ? "bg-orange-500 text-white" : "text-gray-500"}`}
              >¥ 위안</button>
              <button
                onClick={() => setPriceMode("usd")}
                className={`px-3 py-1.5 transition-colors ${priceMode === "usd" ? "bg-green-600 text-white" : "text-gray-500"}`}
              >$ 달러</button>
              <button
                onClick={() => setPriceMode("krw")}
                className={`px-3 py-1.5 transition-colors ${priceMode === "krw" ? "bg-orange-500 text-white" : "text-gray-500"}`}
              >₩ 원</button>
            </div>
          </div>

          <ChinesePhrase phrases={[
            { cn: "这个多少钱？", pinyin: "쩌거 뚜어샤오치엔?", kr: "이거 얼마예요?" },
            { cn: "能便宜一点吗？", pinyin: "넝 피엔이 이디엔 마?", kr: "좀 깎아줄 수 있어요?" },
            { cn: "最低价格是多少？", pinyin: "쭈이디 쟈거 스 뚜어샤오?", kr: "최저 가격이 얼마예요?" },
          ]} />

          {priceMode === "usd" ? (
            <>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  inputMode="decimal"
                  value={usdInput || ""}
                  onChange={(e) => handleUsdInput(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="flex-1 border-2 border-green-200 rounded-xl px-3 py-3 text-2xl font-bold focus:outline-none focus:border-green-400"
                />
                <span className="text-gray-500 font-semibold text-lg">$</span>
              </div>
              {usdInput > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="bg-green-50 rounded-xl px-3 py-2 flex justify-between items-center">
                    <span className="text-xs text-gray-400">≈ 원화 ({usdKrwRate.toLocaleString()}원/$)</span>
                    <span className="font-bold text-green-700">{(Math.round(usdInput * usdKrwRate)).toLocaleString()}원</span>
                  </div>
                  <div className="bg-orange-50 rounded-xl px-3 py-2 flex justify-between items-center">
                    <span className="text-xs text-gray-400">≈ 위안화 ({input.exchangeRate}원/CNY)</span>
                    <span className="font-bold text-orange-600">¥ {input.costCny}</span>
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">💡 캔톤페어·광저우 박람회 달러 가격 입력용</p>
            </>
          ) : priceMode === "cny" ? (
            <>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  inputMode="decimal"
                  value={input.costCny || ""}
                  onChange={(e) => set("costCny", parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="flex-1 border-2 border-orange-200 rounded-xl px-3 py-3 text-2xl font-bold focus:outline-none focus:border-orange-400"
                />
                <span className="text-gray-500 font-semibold text-lg">¥</span>
              </div>
              {input.costCny > 0 && (
                <div className="mt-2 bg-orange-50 rounded-xl px-3 py-2 flex justify-between items-center">
                  <span className="text-xs text-gray-400">≈ 한국 원화 ({input.exchangeRate}원/CNY)</span>
                  <span className="font-bold text-orange-600">{formatKrw(result.costKrw)}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  inputMode="decimal"
                  value={krwInput || ""}
                  onChange={(e) => handleKrwInput(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="flex-1 border-2 border-orange-200 rounded-xl px-3 py-3 text-2xl font-bold focus:outline-none focus:border-orange-400"
                />
                <span className="text-gray-500 font-semibold text-lg">₩</span>
              </div>
              {krwInput > 0 && (
                <div className="mt-2 bg-orange-50 rounded-xl px-3 py-2 flex justify-between items-center">
                  <span className="text-xs text-gray-400">= 위안화 ({input.exchangeRate}원/CNY)</span>
                  <span className="font-bold text-orange-600">¥ {input.costCny}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* HS코드 / 관세율 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">🔍 HS코드 / 관세율</h2>
            <button
              onClick={() => setShowHsPanel(!showHsPanel)}
              className="text-blue-500 text-sm"
            >
              {showHsPanel ? "닫기" : "검색"}
            </button>
          </div>

          {showHsPanel && (
            <div className="mb-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={hsQuery}
                  onChange={(e) => setHsQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchHs()}
                  placeholder="예: 의류, 완구, 화장품..."
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                />
                <button
                  onClick={searchHs}
                  disabled={hsLoading}
                  className="bg-blue-600 text-white px-4 rounded-lg text-sm"
                >
                  {hsLoading ? "..." : "검색"}
                </button>
              </div>
              {hsResults.length > 0 && (
                <div className="mt-2 border border-gray-100 rounded-lg overflow-hidden">
                  {hsResults.map((r) => (
                    <button
                      key={r.hsCode}
                      onClick={() => selectHs(r.hsCode, r.description)}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0"
                    >
                      <span className="font-mono text-blue-600">{r.hsCode}</span>
                      <span className="ml-2 text-gray-700">{r.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!selectedHs && (
            <div className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5 mb-2">
              💡 HS코드 검색 후 선택하면 관세율이 자동 입력됩니다
            </div>
          )}
          <div className="space-y-0">
            {selectedHs && (
              <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2 mb-3">
                <span className="text-xs text-blue-600 font-mono font-bold">HS {selectedHs}</span>
                <a
                  href={`https://unipass.customs.go.kr/clip/index.do`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 underline"
                >
                  관세청 수출요령 →
                </a>
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <label className="text-sm text-gray-600">관세율 (%)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  inputMode="decimal"
                  value={Math.round(input.customsRate * 100) || ""}
                  onChange={(e) => set("customsRate", (parseFloat(e.target.value) || 0) / 100)}
                  placeholder="8"
                  className="w-20 text-right border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                />
                <span className="text-xs text-gray-400">%</span>
              </div>
            </div>

            {/* 원산지 증명 */}
            <div className="flex items-center justify-between py-2 border-t border-gray-100">
              <label className="text-sm text-gray-600">원산지 증명 (C/O)</label>
              <button
                onClick={() => set("hasCoOrigin", !input.hasCoOrigin)}
                className={`w-12 h-6 rounded-full transition-colors ${input.hasCoOrigin ? "bg-blue-500" : "bg-gray-200"}`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${input.hasCoOrigin ? "translate-x-6" : "translate-x-0"}`}
                />
              </button>
            </div>
            {input.hasCoOrigin && (
              <div className="flex items-center justify-between py-2 pl-4">
                <label className="text-sm text-gray-500">C/O 발급 비용</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={input.coOriginCost || ""}
                    onChange={(e) => set("coOriginCost", parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-28 text-right border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                  />
                  <span className="text-xs text-gray-400 w-6">원</span>
                </div>
              </div>
            )}
          </div>

          {importNotes && (
            <div className="mt-2 flex gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{importNotes}</span>
            </div>
          )}
        </div>

        {/* 추가 비용 (접기/펼치기) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setShowDetail(!showDetail)}
            className="w-full px-4 py-3.5 flex items-center justify-between"
          >
            <h2 className="font-semibold text-gray-800">📦 추가 비용 항목</h2>
            {showDetail ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {showDetail && (
            <div className="px-4 pb-4">
              {numInput("포장비", "packagingCost", "원", "0", [
                { cn: "包装费另算吗？", pinyin: "빠오쫑페이 링쏸 마?", kr: "포장비 따로 받아요?" },
                { cn: "可以加固包装吗？", pinyin: "커이 쟈구 빠오쫑 마?", kr: "박스 보강 포장 해줄 수 있어요?" },
              ])}
              {numInput("중국내 운송비", "chinaShipping", "원", "0", [
                { cn: "发货到义乌仓库多少钱？", pinyin: "파훠 따오 이우 창쿠 뚜어샤오치엔?", kr: "이우 창고까지 배송비 얼마예요?" },
                { cn: "包邮吗？", pinyin: "빠오요우 마?", kr: "배송비 포함이에요?" },
              ])}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <label className="text-sm text-gray-600">에이전트 수수료율</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={Math.round(input.agentFeeRate * 100) || ""}
                    onChange={(e) => set("agentFeeRate", (parseFloat(e.target.value) || 0) / 100)}
                    className="w-20 text-right border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                  />
                  <span className="text-xs text-gray-400 w-6">%</span>
                </div>
              </div>
              {/* MOQ */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <label className="text-sm text-gray-600">최소주문수량 (MOQ)</label>
                  <ChinesePhrase phrases={[
                    { cn: "最少订多少个？", pinyin: "쭈이샤오 딩 뚜어샤오거?", kr: "최소 몇 개 주문해야 해요?" },
                    { cn: "可以零散购买吗？", pinyin: "커이 링산 꼬우마이 마?", kr: "낱개로 살 수 있어요?" },
                  ]} />
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={moq || ""}
                    onChange={(e) => setMoq(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-24 text-right border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                  />
                  <span className="text-xs text-gray-400 w-6">개</span>
                </div>
              </div>
              {/* CBM 운송비 */}
              <div className="py-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-600">운송비 (CBM)</label>
                  <div className="flex bg-gray-100 rounded-lg overflow-hidden text-xs font-medium">
                    <button onClick={() => setCbmMode("direct")} className={`px-2 py-1 transition-colors ${cbmMode === "direct" ? "bg-blue-500 text-white" : "text-gray-500"}`}>CBM</button>
                    <button onClick={() => setCbmMode("box")} className={`px-2 py-1 transition-colors ${cbmMode === "box" ? "bg-blue-500 text-white" : "text-gray-500"}`}>박스</button>
                    <button onClick={() => setCbmMode("total")} className={`px-2 py-1 transition-colors ${cbmMode === "total" ? "bg-blue-500 text-white" : "text-gray-500"}`}>합계</button>
                    <button onClick={() => setCbmMode("container")} className={`px-2 py-1 transition-colors ${cbmMode === "container" ? "bg-green-600 text-white" : "text-gray-500"}`}>컨테이너</button>
                  </div>
                </div>

                {cbmMode === "direct" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input type="number" inputMode="decimal" step="0.0001"
                        value={input.cbm > 0 ? input.cbm : ""}
                        onChange={(e) => set("cbm", parseFloat(e.target.value) || 0)}
                        placeholder="0.0000"
                        className="w-28 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:border-blue-400" />
                      <span className="text-xs text-gray-400">㎥ ×</span>
                      <input type="number" inputMode="decimal" value={input.cbmRate || ""} onChange={(e) => set("cbmRate", parseFloat(e.target.value) || 0)}
                        className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:border-blue-400" />
                      <span className="text-xs text-gray-400">원/㎥</span>
                    </div>
                    {input.cbm > 0 && input.cbmRate > 0 && (
                      <div className="bg-blue-50 rounded-lg px-3 py-1.5 flex justify-between text-xs">
                        <span className="text-gray-500">{input.cbm.toFixed(4)} ㎥ × {input.cbmRate.toLocaleString()}원</span>
                        <span className="font-bold text-blue-700">{Math.round(input.cbm * input.cbmRate).toLocaleString()}원</span>
                      </div>
                    )}
                  </div>
                )}

                {cbmMode === "box" && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      {([["가로", boxL, setBoxL], ["세로", boxW, setBoxW], ["높이", boxH, setBoxH]] as [string, number, (v: number) => void][]).map(([label, val, setVal]) => (
                        <div key={label}>
                          <label className="text-xs text-gray-400 mb-1 block">{label} (cm)</label>
                          <input type="number" inputMode="decimal" value={val || ""} onChange={(e) => setVal(parseFloat(e.target.value) || 0)} placeholder="40"
                            className={`w-full border rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-blue-400 ${val > 0 && val < 1 ? "border-red-400 bg-red-50" : "border-gray-200"}`} />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500 whitespace-nowrap">박스당</label>
                      <input type="number" inputMode="numeric" value={boxQty || ""} onChange={(e) => setBoxQty(parseInt(e.target.value) || 1)} placeholder="1"
                        className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:border-blue-400" />
                      <span className="text-xs text-gray-400">개</span>
                      <span className="text-gray-200 mx-1">|</span>
                      <label className="text-xs text-gray-500 whitespace-nowrap">CBM당</label>
                      <input type="number" inputMode="decimal" value={input.cbmRate || ""} onChange={(e) => set("cbmRate", parseFloat(e.target.value) || 0)} placeholder="90000"
                        className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:border-blue-400" />
                      <span className="text-xs text-gray-400">원</span>
                    </div>
                    <ChinesePhrase phrases={[
                      { cn: "一箱多少钱运费？", pinyin: "이샹 뚜어샤오치엔 윈페이?", kr: "한 박스 운송비 얼마예요?" },
                      { cn: "一箱装多少个？", pinyin: "이샹 쫑 뚜어샤오거?", kr: "한 박스에 몇 개 들어가요?" },
                    ]} />
                    {((boxL > 0 && boxL < 1) || (boxW > 0 && boxW < 1) || (boxH > 0 && boxH < 1)) && (
                      <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600">
                        ⚠️ 너무 작은 값이 있습니다. cm 단위로 입력하세요 (예: 40, 50, 60)
                      </div>
                    )}
                    {boxL > 0 && boxW > 0 && boxH > 0 && boxQty > 0 && !(boxL < 1 || boxW < 1 || boxH < 1) && (
                      <div className="bg-blue-50 rounded-xl p-3 space-y-1.5 text-xs">
                        <div className="flex justify-between text-gray-600">
                          <span>박스 부피</span>
                          <span className="font-mono">{((boxL * boxW * boxH) / 1_000_000).toFixed(4)} ㎥</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>1개당 CBM ({boxL}×{boxW}×{boxH}cm ÷ {boxQty}개)</span>
                          <span className="font-mono">{((boxL * boxW * boxH) / 1_000_000 / boxQty).toFixed(6)} ㎥</span>
                        </div>
                        <div className="flex justify-between text-blue-700 font-bold pt-1 border-t border-blue-200">
                          <span>1개당 운송비</span>
                          <span>{Math.round(((boxL * boxW * boxH) / 1_000_000 / boxQty) * input.cbmRate).toLocaleString()}원</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {cbmMode === "total" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="number" inputMode="decimal" value={shippingTotal || ""} onChange={(e) => setShippingTotal(parseFloat(e.target.value) || 0)}
                        placeholder="0" className="flex-1 border-2 border-blue-200 rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:border-blue-400" />
                      <span className="text-sm text-gray-500">원</span>
                    </div>
                    <p className="text-xs text-gray-400">이 상품 1개의 운송비 합계를 직접 입력</p>
                    {shippingTotal > 0 && (
                      <div className="bg-blue-50 rounded-xl px-3 py-2 flex justify-between text-xs">
                        <span className="text-gray-500">적용 운송비</span>
                        <span className="font-bold text-blue-700">{shippingTotal.toLocaleString()}원</span>
                      </div>
                    )}
                  </div>
                )}

                {cbmMode === "container" && (
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-3">
                      <p className="text-xs font-semibold text-green-800">🚢 컨테이너 운임 → 개당 운송비 계산</p>

                      {/* 운임 통화 선택 */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 shrink-0">운임 입력</span>
                        <div className="flex bg-gray-100 rounded-lg overflow-hidden text-xs font-medium">
                          <button onClick={() => setContainerCostMode("usd")} className={`px-3 py-1.5 transition-colors ${containerCostMode === "usd" ? "bg-green-600 text-white" : "text-gray-500"}`}>$ 달러</button>
                          <button onClick={() => setContainerCostMode("krw")} className={`px-3 py-1.5 transition-colors ${containerCostMode === "krw" ? "bg-blue-500 text-white" : "text-gray-500"}`}>₩ 원화</button>
                        </div>
                      </div>

                      {/* 총 운임 입력 */}
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">컨테이너 총 운임</label>
                        {containerCostMode === "usd" ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <input type="number" inputMode="decimal"
                                value={containerCostUsd || ""}
                                onChange={(e) => setContainerCostUsd(parseFloat(e.target.value) || 0)}
                                placeholder="3000"
                                className="flex-1 border-2 border-green-300 rounded-xl px-3 py-2.5 text-lg font-bold focus:outline-none focus:border-green-500" />
                              <span className="text-gray-600 font-semibold">$</span>
                            </div>
                            {containerCostUsd > 0 && (
                              <p className="text-xs text-green-700 bg-green-50 rounded-lg px-2 py-1">
                                ≈ {Math.round(containerCostUsd * usdKrwRate).toLocaleString()}원 ({usdKrwRate.toLocaleString()}원/$)
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input type="number" inputMode="decimal"
                              value={containerCostKrw || ""}
                              onChange={(e) => setContainerCostKrw(parseFloat(e.target.value) || 0)}
                              placeholder="4000000"
                              className="flex-1 border-2 border-blue-300 rounded-xl px-3 py-2.5 text-lg font-bold focus:outline-none focus:border-blue-500" />
                            <span className="text-gray-600 font-semibold">원</span>
                          </div>
                        )}
                      </div>

                      {/* 컨테이너 내 총 수량 */}
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">이 상품 총 수량 (컨테이너 안)</label>
                        <div className="flex items-center gap-2">
                          <input type="number" inputMode="numeric"
                            value={containerTotalQty || ""}
                            onChange={(e) => setContainerTotalQty(parseInt(e.target.value) || 0)}
                            placeholder="1000"
                            className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-lg font-bold focus:outline-none focus:border-gray-400" />
                          <span className="text-gray-600 font-semibold">개</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">컨테이너를 여러 종류로 나눌 경우, 이 상품 해당 수량만 입력</p>
                      </div>

                      {/* 계산 결과 */}
                      {containerTotalQty > 0 && (containerCostUsd > 0 || containerCostKrw > 0) && (
                        <div className="bg-white rounded-xl px-3 py-2.5 space-y-1 border border-green-200">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>총 운임</span>
                            <span>{containerCostMode === "usd"
                              ? `$${containerCostUsd.toLocaleString()} (${Math.round(containerCostUsd * usdKrwRate).toLocaleString()}원)`
                              : `${containerCostKrw.toLocaleString()}원`}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>÷ 수량</span>
                            <span>{containerTotalQty.toLocaleString()}개</span>
                          </div>
                          <div className="flex justify-between font-bold text-green-700 pt-1 border-t border-green-100">
                            <span>개당 운송비</span>
                            <span>{(containerTotalQty > 0
                              ? Math.round((containerCostMode === "usd"
                                  ? containerCostUsd * usdKrwRate
                                  : containerCostKrw) / containerTotalQty)
                              : 0).toLocaleString()}원</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">💡 20ft 컨테이너 기준 $2,500~3,500 / 40ft $3,500~5,000 (중국→한국, 2024)</p>
                  </div>
                )}
              </div>
              {/* 한국 내륙운송비 — 1톤=4CBM 자동계산 */}
              <div className="py-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-600">한국 내륙운송비</label>
                  <button
                    onClick={() => setInlandManual((v) => !v)}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${inlandManual ? "bg-gray-200 text-gray-600 border-gray-300" : "bg-green-100 text-green-700 border-green-200"}`}
                  >
                    {inlandManual ? "수동입력" : "자동계산 ✓"}
                  </button>
                </div>

                {/* 1톤 기준 운임 설정 */}
                <div className="bg-gray-50 rounded-xl p-3 space-y-2 mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">1톤 트럭 기준운임</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={inlandRate || ""}
                        onChange={(e) => { setInlandRate(parseFloat(e.target.value) || 0); setInlandManual(false); }}
                        className="w-24 text-right border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
                      />
                      <span className="text-xs text-gray-400">원 / 1톤(4㎥)</span>
                    </div>
                  </div>
                  {input.cbm > 0 && (
                    <div className="text-xs text-green-700 bg-green-50 rounded-lg px-2 py-1.5">
                      <span className="font-mono">{input.cbm.toFixed(4)}㎥ ÷ 4㎥ × {inlandRate.toLocaleString()}원</span>
                      <span className="font-bold ml-2">= {Math.round((input.cbm / 4) * inlandRate).toLocaleString()}원</span>
                    </div>
                  )}
                  {input.cbm === 0 && (
                    <p className="text-xs text-gray-400">CBM을 먼저 입력하면 자동 계산됩니다</p>
                  )}
                </div>

                {/* 수동입력 모드 */}
                {inlandManual && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={input.inlandShipping || ""}
                      onChange={(e) => set("inlandShipping", parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="flex-1 text-right border-2 border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                    />
                    <span className="text-xs text-gray-400">원 (직접입력)</span>
                  </div>
                )}

                {/* 적용값 표시 */}
                {input.inlandShipping > 0 && (
                  <div className="flex justify-between items-center text-xs mt-1">
                    <span className="text-gray-400">적용 내륙운송비</span>
                    <span className="font-bold text-gray-700">{input.inlandShipping.toLocaleString()}원</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 저장 완료 토스트 */}
        {saved && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-full flex items-center gap-2 shadow-xl">
            <Check className="w-4 h-4 text-green-400" />
            소싱수첩에 저장됐습니다
          </div>
        )}

        {/* 계산 결과 */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">한국 매입단가</h2>
            <span className="text-xs bg-orange-400/50 rounded-full px-2 py-0.5">참고용 견적</span>
          </div>

          <div className="text-4xl font-bold mb-1">
            {input.costCny > 0 ? formatKrw(result.landedCost) : "—"}
          </div>
          {input.costCny > 0 && (
            <p className="text-orange-100 text-sm">
              원화원가 대비 {((result.landedCost / result.costKrw - 1) * 100).toFixed(1)}% 추가
            </p>
          )}

          {/* 계산식 상세 */}
          {input.costCny > 0 && (
            <div className="mt-4 pt-4 border-t border-orange-400/50 space-y-1.5 text-sm">
              <CalcRow label={`원화원가 (${input.costCny} CNY × ${input.exchangeRate}원)`} value={result.costKrw} />
              {input.packagingCost > 0 && <CalcRow label="포장비" value={input.packagingCost} />}
              {input.chinaShipping > 0 && <CalcRow label="중국내 운송비" value={input.chinaShipping} />}
              <CalcRow label={`에이전트 수수료 (${(input.agentFeeRate * 100).toFixed(0)}%)`} value={result.agentFee} />
              {result.cbmShipping > 0 && <CalcRow label={
                cbmMode === "box" ? `해상운송비 (${boxL}×${boxW}×${boxH}cm ÷ ${boxQty}개)` :
                cbmMode === "total" ? "운송비 (합계)" :
                cbmMode === "container" ? `컨테이너 운송비 (${containerTotalQty.toLocaleString()}개 분배)` :
                `CBM 운송비 (${input.cbm}㎥)`
              } value={result.cbmShipping} />}
              {input.hasCoOrigin && result.coOriginCost > 0 && <CalcRow label="원산지증명 비용" value={result.coOriginCost} />}
              <CalcRow label={`관세 (${(input.customsRate * 100).toFixed(0)}%)`} value={result.customsDuty} />
              <CalcRow label="부가세 (10%)" value={result.vat} />
              {input.inlandShipping > 0 && <CalcRow label="한국 내륙운송비" value={input.inlandShipping} />}
              <div className="pt-2 mt-2 border-t border-orange-400/50 flex justify-between font-bold">
                <span>합계</span>
                <span>{formatKrw(result.landedCost)}</span>
              </div>
              <p className="text-orange-200 text-xs pt-1">
                * 과세가격 = 원화원가 기준 (참고용 견적) · 송금(전신환매도)율 적용
              </p>
            </div>
          )}
        </div>

        {/* 판매가 / 마진 계산기 */}
        {input.costCny > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-3">💰 판매가 & 마진 계산</h2>
            <div className="flex items-center gap-3 mb-3">
              <label className="text-sm text-gray-600 shrink-0">목표 마진율</label>
              <div className="flex items-center gap-1 flex-1">
                <input
                  type="number"
                  inputMode="decimal"
                  value={targetMargin || ""}
                  onChange={(e) => setTargetMargin(parseFloat(e.target.value) || 0)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-right focus:outline-none focus:border-orange-400"
                />
                <span className="text-sm text-gray-400">%</span>
              </div>
              <div className="flex gap-1">
                {[30, 40, 50].map((v) => (
                  <button key={v} onClick={() => setTargetMargin(v)}
                    className={`text-xs px-2 py-1 rounded-lg transition-colors ${targetMargin === v ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {v}%
                  </button>
                ))}
              </div>
            </div>
            {targetMargin > 0 && result.landedCost > 0 && (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">매입단가</span>
                  <span className="font-semibold text-gray-800">{result.landedCost.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">권장 판매가</span>
                  <span className="text-xl font-bold text-orange-600">
                    {Math.ceil(result.landedCost / (1 - targetMargin / 100) / 100) * 100 > 0
                      ? (Math.ceil(result.landedCost / (1 - targetMargin / 100) / 100) * 100).toLocaleString()
                      : "—"}원
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-orange-200">
                  <span className="text-xs text-gray-500">예상 마진 금액</span>
                  <span className="text-sm font-semibold text-green-600">
                    +{Math.round(Math.ceil(result.landedCost / (1 - targetMargin / 100) / 100) * 100 * (targetMargin / 100)).toLocaleString()}원
                  </span>
                </div>
                <p className="text-xs text-gray-400">* 판매가는 100원 단위 올림 · 부가세 별도</p>
              </div>
            )}
          </div>
        )}

        {/* 저장 + 공유 버튼 */}
        {input.costCny > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowSaveSheet(true)}
              className="flex-1 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 shadow-sm bg-[var(--primary)]"
            >
              <BookmarkPlus className="w-5 h-5" />
              소싱수첩 저장
            </button>
            <button
              onClick={() => {
                const sellPrice = targetMargin > 0
                  ? Math.ceil(result.landedCost / (1 - targetMargin / 100) / 100) * 100
                  : 0;
                const text = [
                  `📦 ${saveName || "상품"} 원가계산`,
                  `─────────────`,
                  priceMode === "usd"
                    ? `원가: $${usdInput} → ¥${input.costCny} (${usdKrwRate}원/$)`
                    : `원가: ¥${input.costCny} (${input.exchangeRate}원/CNY)`,
                  `매입단가: ${result.landedCost.toLocaleString()}원`,
                  ...(sellPrice > 0 ? [`권장판매가: ${sellPrice.toLocaleString()}원 (마진 ${targetMargin}%)`] : []),
                  ...(moq > 0 ? [`MOQ: ${moq.toLocaleString()}개`] : []),
                  `관세 ${(input.customsRate*100).toFixed(0)}% | 운송비 포함`,
                  `─────────────`,
                  `📱 소싱킷 앱으로 계산함`,
                ].join("\n");
                if (navigator.share) {
                  navigator.share({ text });
                } else {
                  navigator.clipboard?.writeText(text);
                  alert("클립보드에 복사됐습니다! 카카오톡에 붙여넣기 하세요.");
                }
              }}
              className="w-14 bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center shadow-sm active:scale-95 transition-transform"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}

      </div>

      {/* 저장 바텀시트 */}
      {showSaveSheet && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSaveSheet(false)} />
          <div className="relative bg-white rounded-t-3xl px-4 pt-5 pb-10 space-y-4 shadow-2xl">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-2" />
            <h3 className="font-bold text-gray-900 text-base">소싱수첩에 저장</h3>
            <div className="bg-orange-50 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-gray-600">계산된 매입단가</span>
              <span className="font-bold text-orange-600 text-lg">{formatKrw(result.landedCost)}</span>
            </div>
            {moq > 0 && (
              <div className="bg-blue-50 rounded-xl px-4 py-2 flex justify-between items-center">
                <span className="text-sm text-gray-600">최소주문수량 (MOQ)</span>
                <span className="font-bold text-blue-700">{moq.toLocaleString()}개</span>
              </div>
            )}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">상품명 *</label>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="예: 면 니트 스웨터"
                autoFocus
                className="w-full border-2 border-blue-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">거래처명 (선택)</label>
              <input
                type="text"
                value={saveSupplier}
                onChange={(e) => setSaveSupplier(e.target.value)}
                placeholder="예: 义乌好品质百货"
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <button
              onClick={saveToNotebook}
              disabled={!saveName.trim() || saving}
              className="w-full text-white rounded-2xl py-4 font-bold disabled:opacity-40 bg-[var(--primary)]"
            >
              {saving ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CalcRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-orange-100">
      <span>{label}</span>
      <span>{value.toLocaleString("ko-KR")}원</span>
    </div>
  );
}

