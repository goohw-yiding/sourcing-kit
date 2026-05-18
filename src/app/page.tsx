"use client";

import { Camera, MapPin, Navigation, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUserName } from "@/lib/themes";
import { useTranslation } from "@/lib/i18n";
import { detectMarketLocation } from "@/lib/location";
import { MARKET_REGIONS, type MarketRegion } from "@/lib/markets";
import type { ExchangeRates } from "@/app/api/exchange-rate/route";

interface Stats { researching: number; inProgress: number; arrived: number; }

interface CurrencyItem {
  flag: string;
  code: string;
  label: string;
  value: number;
  unit?: string;       // 표시 단위 (예: "100엔" → unitAmount=100)
  unitAmount?: number;
  decimals: number;
  rateType?: string;   // "전신환매도" | "매매기준"
}

// ── 위치 → 시장 지역 매핑 ────────────────────────────────────
function matchRegionId(loc: string): string | null {
  if (loc.includes("이우") || loc.includes("义乌")) return "yiwu";
  if (loc.includes("광저우") || loc.includes("广州")) return "guangzhou";
  if (loc.includes("도쿄") || loc.includes("오사카") || loc.includes("Tokyo") || loc.includes("Osaka") || loc.includes("大阪") || loc.includes("東京")) return "japan";
  if (loc.includes("서울") || loc.includes("경기") || loc.includes("인천") || loc.includes("부산") || loc.includes("고양") || loc.includes("Seoul")) return "korea";
  if (loc.includes("라스베가스") || loc.includes("뉴욕") || loc.includes("Las Vegas") || loc.includes("New York") || loc.includes("Chicago")) return "usa";
  if (loc.includes("상하이") || loc.includes("上海")) return "guangzhou"; // 상하이는 광저우 탭으로 fallback
  if (loc.includes("선전") || loc.includes("深圳")) return "guangzhou";
  return null;
}

const CITY_CHIPS = [
  { id: "yiwu",      flag: "🇨🇳", label: "이우" },
  { id: "guangzhou", flag: "🇨🇳", label: "광저우" },
  { id: "japan",     flag: "🇯🇵", label: "도쿄·오사카" },
  { id: "korea",     flag: "🇰🇷", label: "국내" },
  { id: "usa",       flag: "🇺🇸", label: "미국" },
];

export default function HomePage() {
  const { t } = useTranslation();
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [userName, setUserName] = useState("");

  // 현장 위치
  const [fieldRegion, setFieldRegion] = useState<MarketRegion | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>("");
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    setUserName(getStoredUserName());
    fetch("/api/exchange-rate")
      .then(r => r.json())
      .then((d: ExchangeRates) => setRates(d))
      .catch(() => {});
    fetch("/api/products")
      .then(r => r.json())
      .then((products: Array<{ status: string }>) => {
        const s: Stats = { researching: 0, inProgress: 0, arrived: 0 };
        for (const p of products) {
          if (p.status === "sourcing" || p.status === "proposed") s.researching++;
          else if (p.status === "ordered" || p.status === "shipping" || p.status === "shipped") s.inProgress++;
          else if (p.status === "arrived") s.arrived++;
        }
        setStats(s);
      })
      .catch(() => {});

    // 저장된 현장 위치 복원
    const savedId = localStorage.getItem("field_region_id");
    const savedLabel = localStorage.getItem("field_location_label");
    if (savedId) {
      const region = MARKET_REGIONS.find(r => r.id === savedId) || null;
      setFieldRegion(region);
      setLocationLabel(savedLabel || "");
    }
  }, []);

  const selectRegion = (id: string, label?: string) => {
    const region = MARKET_REGIONS.find(r => r.id === id) || null;
    setFieldRegion(region);
    const lbl = label || CITY_CHIPS.find(c => c.id === id)?.label || id;
    setLocationLabel(lbl);
    localStorage.setItem("field_region_id", id);
    localStorage.setItem("field_location_label", lbl);
  };

  const detectGps = async () => {
    setGpsLoading(true);
    try {
      const loc = await detectMarketLocation();
      setLocationLabel(loc);
      const id = matchRegionId(loc);
      if (id) {
        const region = MARKET_REGIONS.find(r => r.id === id) || null;
        setFieldRegion(region);
        localStorage.setItem("field_region_id", id);
      } else {
        setFieldRegion(null);
        localStorage.removeItem("field_region_id");
      }
      localStorage.setItem("field_location_label", loc);
    } catch {
      alert("위치 감지에 실패했습니다. 아래에서 직접 선택해주세요.");
    } finally {
      setGpsLoading(false);
    }
  };

  // 통화 목록 (CNY·USD·JPY·VND)
  // CNY는 전신환매도율(ttSell) — 실제 송금 시 적용 환율
  // 나머지는 매매기준율 — 기준 참고용
  const currencies: CurrencyItem[] = rates ? [
    { flag: "🇨🇳", code: "CNY", label: "위안", value: rates.ttSell,          decimals: 1, rateType: "전신환매도" },
    { flag: "🇺🇸", code: "USD", label: "달러", value: rates.usdKrw,          decimals: 0, rateType: "매매기준" },
    { flag: "🇯🇵", code: "JPY", label: "엔",   value: rates.jpyKrw * 100,    unit: "100엔", unitAmount: 100, decimals: 1, rateType: "매매기준" },
    { flag: "🇻🇳", code: "VND", label: "동",   value: rates.vndKrw * 10000,  unit: "1만동", unitAmount: 10000, decimals: 1, rateType: "매매기준" },
  ] : [];

  const menuItems = [
    { href: "/sourcing", emoji: "📒", label: t("nav.sourcing"),  desc: t("sourcing.title") },
    { href: "/hs",       emoji: "🔍", label: t("nav.hs"),        desc: t("common.qr_scan") },
    { href: "/more",     emoji: "⋯",  label: t("nav.more"),      desc: t("more.subtitle") },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6FA]">
      {/* 헤더 */}
      <header className="px-5 pt-14 pb-6 bg-[var(--primary)]">
        <p className="text-xs font-medium mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{t("ob.app_name")} 📦</p>
        <h1 className="text-2xl font-bold text-white">
          {userName
            ? t("home.greeting", { name: userName })
            : t("home.greet_no_name")}
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>{t("home.subtitle")}</p>

        {/* 환율 + 현황 */}
        <div className="mt-5 space-y-3">
          {/* 멀티 환율 */}
          <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <p className="text-xs font-medium leading-tight" style={{ color: "rgba(255,255,255,0.7)" }}>
                  실시간 환율
                </p>
                <p className="text-[10px] mt-0.5 leading-tight" style={{ color: "rgba(255,255,255,0.4)" }}>
                  위안: 전신환매도율 · 기타: 매매기준율
                </p>
              </div>
              {rates?.date && (
                <p className="text-[10px] shrink-0" style={{ color: "rgba(255,255,255,0.35)" }}>{rates.date}</p>
              )}
            </div>
            {rates ? (
              <div className="grid grid-cols-4 gap-2">
                {currencies.map((c) => (
                  <div key={c.code} className="text-center">
                    <div className="text-base leading-none mb-1">{c.flag}</div>
                    <div className="text-sm font-bold text-white leading-tight">
                      {c.value >= 1000
                        ? c.value.toLocaleString("ko-KR", { maximumFractionDigits: 0 })
                        : c.value.toFixed(c.decimals)}
                    </div>
                    <div className="text-[10px] leading-tight mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {c.unit ?? `1${c.label}`}
                    </div>
                    {c.rateType && (
                      <div className="text-[9px] leading-tight mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {c.rateType}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {["🇨🇳","🇺🇸","🇯🇵","🇻🇳"].map((flag) => (
                  <div key={flag} className="text-center">
                    <div className="text-base leading-none mb-1">{flag}</div>
                    <div className="text-sm font-bold text-white/40">—</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 소싱 현황 */}
          {stats && (
            <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.1)" }}>
              <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>{t("home.stats")}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-extrabold text-white">{stats.researching}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>🔍 {t("home.researching")}</div>
                </div>
                <div>
                  <div className="text-lg font-extrabold text-white">{stats.inProgress}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>📦 {t("home.in_progress")}</div>
                </div>
                <div>
                  <div className="text-lg font-extrabold text-white">{stats.arrived}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>✅ {t("home.arrived")}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 빠른 소싱 시작 */}
      <div className="px-4 pt-5 pb-3">
        <Link href="/sourcing?new=1">
          <div className="rounded-2xl px-5 py-4 flex items-center gap-4 active:scale-[0.98] transition-transform shadow-sm bg-[var(--primary)]">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-extrabold text-base text-white leading-tight">소싱 시작</div>
              <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>사진 찍으면 AI가 원가까지 분석</div>
            </div>
            <span className="text-white/40 text-xl leading-none">›</span>
          </div>
        </Link>
      </div>

      {/* 현장 위치 섹션 */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">📍 현장</p>
          {fieldRegion && (
            <button onClick={() => { setFieldRegion(null); setLocationLabel(""); localStorage.removeItem("field_region_id"); localStorage.removeItem("field_location_label"); }}
              className="text-[10px] text-gray-400 flex items-center gap-0.5">
              <RefreshCw className="w-2.5 h-2.5" /> 변경
            </button>
          )}
        </div>

        {/* 위치 미선택 → 선택 UI */}
        {!fieldRegion ? (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin className="w-4 h-4 text-gray-400" />
              <p className="text-sm">지금 어디 계세요?</p>
            </div>
            {/* 도시 칩 */}
            <div className="flex flex-wrap gap-2">
              {CITY_CHIPS.map(c => (
                <button key={c.id} onClick={() => selectRegion(c.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-sm text-gray-700 active:bg-gray-100">
                  <span>{c.flag}</span><span>{c.label}</span>
                </button>
              ))}
            </div>
            {/* GPS 버튼 */}
            <button onClick={detectGps} disabled={gpsLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 disabled:opacity-50">
              {gpsLoading
                ? <><div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> GPS 감지 중...</>
                : <><Navigation className="w-3.5 h-3.5" /> GPS로 자동 감지</>}
            </button>
          </div>
        ) : (
          /* 위치 선택됨 → 시장 정보 카드 */
          <div className={`rounded-2xl overflow-hidden shadow-sm border border-gray-100`}>
            {/* 헤더 */}
            <div className={`${fieldRegion.color} px-4 py-3`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{fieldRegion.flag}</span>
                    <span className={`text-sm font-bold ${fieldRegion.textColor}`}>{fieldRegion.city}</span>
                  </div>
                  {locationLabel && locationLabel !== fieldRegion.city && (
                    <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" />{locationLabel}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-bold ${fieldRegion.textColor} bg-white/60 px-2 py-0.5 rounded-full`}>현장</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{fieldRegion.subtitle}</p>
            </div>
            {/* 주요 시장 spots (상위 3개) */}
            <div className="bg-white divide-y divide-gray-50">
              {fieldRegion.spots.slice(0, 3).map((spot, i) => (
                <div key={i} className="px-4 py-3">
                  <p className="text-xs font-bold text-gray-800">{spot.nameKr}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{spot.desc}</p>
                  {spot.tip && (
                    <p className="text-[10px] text-blue-500 mt-0.5">💡 {spot.tip}</p>
                  )}
                </div>
              ))}
            </div>
            {/* 더보기 링크 */}
            <Link href="/more" className={`flex items-center justify-center gap-1 py-3 ${fieldRegion.color} ${fieldRegion.textColor} text-xs font-bold border-t border-gray-100`}>
              시장 가이드 전체보기 →
            </Link>
          </div>
        )}
      </div>

      {/* 메뉴 바로가기 */}
      <div className="px-4 pb-28">
        <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">{t("home.menu")}</p>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {menuItems.map((item, i, arr) => (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-4 px-4 py-4 active:bg-gray-50 transition-colors ${i < arr.length - 1 ? "border-b border-gray-50" : ""}`}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-[var(--primary-lighter)]">
                  {item.emoji}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800">{item.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
                </div>
                <span className="text-gray-300 text-lg">›</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
