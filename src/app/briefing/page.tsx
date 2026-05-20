"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, RefreshCw, TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { NewsItem } from "@/app/api/briefing/news/route";
import type { ExchangeHistoryResponse, ExchangeDataPoint } from "@/app/api/briefing/exchange/route";
import type { YiwuProductsResponse, YiwuProductItem } from "@/app/api/briefing/products/route";

// ── 지역 목록 ────────────────────────────────────────────
const REGIONS = [
  { id: "yiwu",      flag: "🇨🇳", label: "이우",   langBadge: "中文" },
  { id: "guangzhou", flag: "🇨🇳", label: "광저우", langBadge: "中文" },
  { id: "shenzhen",  flag: "🇨🇳", label: "선전",   langBadge: "中文" },
  { id: "shanghai",  flag: "🇨🇳", label: "상하이", langBadge: "中文" },
  { id: "korea",     flag: "🇰🇷", label: "국내",   langBadge: "한국어" },
];

const PERIODS = [
  { id: "1w", label: "1주" },
  { id: "1m", label: "1달" },
  { id: "6m", label: "6개월" },
  { id: "1y", label: "1년" },
];

// ── 미니 라인차트 (SVG) ─────────────────────────────────
function MiniLineChart({ data, color = "#3B82F6", height = 80 }: {
  data: ExchangeDataPoint[];
  color?: string;
  height?: number;
}) {
  if (data.length < 2) return null;

  const values = data.map(d => d.cny);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 300;
  const H = height;
  const pad = 4;

  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((d.cny - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  });

  const polyline = points.join(" ");
  // 그라디언트 영역
  const area = `M${points[0]} L${points.join(" L")} L${pad + (W - pad * 2)},${H} L${pad},${H} Z`;

  const isUp = values[values.length - 1] >= values[0];
  const lineColor = isUp ? "#EF4444" : "#10B981";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.15} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#chartGrad)" />
      <polyline
        points={polyline}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 첫 점 */}
      <circle cx={points[0].split(",")[0]} cy={points[0].split(",")[1]} r="3" fill={lineColor} opacity={0.5} />
      {/* 마지막 점 */}
      <circle
        cx={points[points.length - 1].split(",")[0]}
        cy={points[points.length - 1].split(",")[1]}
        r="3.5"
        fill={lineColor}
      />
    </svg>
  );
}

// ── 날짜 포맷 ────────────────────────────────────────────
function formatPubDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / 1000 / 60 / 60);
    const minutes = Math.floor(diff / 1000 / 60);

    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24)   return `${hours}시간 전`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return dateStr;
  }
}

// ── 트렌드 배지 ──────────────────────────────────────────
function TrendBadge({ trend }: { trend: YiwuProductItem["trend"] }) {
  const map = {
    up:     { label: "↑ 상승", cls: "bg-red-100 text-red-600" },
    stable: { label: "→ 유지", cls: "bg-gray-100 text-gray-600" },
    new:    { label: "✦ 신규", cls: "bg-blue-100 text-blue-600" },
  };
  const { label, cls } = map[trend];
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
  );
}

// ── 메인 페이지 ─────────────────────────────────────────
export default function BriefingPage() {
  const [activeTab, setActiveTab] = useState<"news" | "exchange" | "products">("news");
  const [regionId, setRegionId] = useState("yiwu");
  const [period, setPeriod] = useState("1m");

  // 뉴스
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState(false);
  const [newsUpdatedAt, setNewsUpdatedAt] = useState("");
  const [showOrig, setShowOrig] = useState(false); // 원문 토글

  // 환율 트렌드
  const [exchangeData, setExchangeData] = useState<ExchangeHistoryResponse | null>(null);
  const [exchangeLoading, setExchangeLoading] = useState(false);

  // 신상품
  const [products, setProducts] = useState<YiwuProductsResponse | null>(null);
  const [productsLoading, setProductsLoading] = useState(false);

  // ── 뉴스 로드 ──
  const loadNews = useCallback(async (region: string) => {
    setNewsLoading(true);
    setNewsError(false);
    try {
      const res = await fetch(`/api/briefing/news?region=${region}`);
      if (!res.ok) throw new Error();
      const data = await res.json() as { items: NewsItem[]; updatedAt: string };
      setNews(data.items);
      setNewsUpdatedAt(data.updatedAt);
    } catch {
      setNewsError(true);
    } finally {
      setNewsLoading(false);
    }
  }, []);

  // ── 환율 트렌드 로드 ──
  const loadExchange = useCallback(async (p: string) => {
    setExchangeLoading(true);
    try {
      const res = await fetch(`/api/briefing/exchange?period=${p}`);
      if (!res.ok) throw new Error();
      const data = await res.json() as ExchangeHistoryResponse;
      setExchangeData(data);
    } catch {
      // silently fail
    } finally {
      setExchangeLoading(false);
    }
  }, []);

  // ── 신상품 로드 ──
  const loadProducts = useCallback(async () => {
    if (products) return; // 이미 있으면 재사용
    setProductsLoading(true);
    try {
      const res = await fetch("/api/briefing/products");
      if (!res.ok) throw new Error();
      const data = await res.json() as YiwuProductsResponse;
      setProducts(data);
    } catch {
      // silently fail
    } finally {
      setProductsLoading(false);
    }
  }, [products]);

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (activeTab === "news")     loadNews(regionId);
    if (activeTab === "exchange") loadExchange(period);
    if (activeTab === "products") loadProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // 지역 변경 시 뉴스 재로드
  useEffect(() => {
    if (activeTab === "news") loadNews(regionId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionId]);

  // 기간 변경 시 환율 재로드
  useEffect(() => {
    if (activeTab === "exchange") loadExchange(period);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const selectedRegion = REGIONS.find(r => r.id === regionId)!;

  return (
    <div className="min-h-screen bg-[#F4F6FA] pb-28">
      {/* 헤더 */}
      <div className="bg-[var(--primary)] text-white px-4 pt-14 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" className="p-1.5 rounded-xl bg-white/10 active:bg-white/20">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">소싱 브리핑</h1>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
              {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })} 기준
            </p>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-1.5">
          {[
            { id: "news" as const,     emoji: "📰", label: "뉴스" },
            { id: "exchange" as const, emoji: "📈", label: "환율 트렌드" },
            { id: "products" as const, emoji: "✨", label: "이우 신상품" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-white text-[var(--primary)] shadow-md"
                  : "bg-white/15 text-white/80"
              }`}
            >
              <span className="block text-base leading-none mb-0.5">{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">

        {/* ── 뉴스 탭 ── */}
        {activeTab === "news" && (
          <div>
            {/* 지역 선택 */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {REGIONS.map(r => (
                <button
                  key={r.id}
                  onClick={() => setRegionId(r.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap border-2 shrink-0 transition-all ${
                    regionId === r.id
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  <span>{r.flag}</span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>

            {/* 헤더 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-gray-500">
                  {selectedRegion.flag} {selectedRegion.label} 최신 뉴스
                </p>
                {selectedRegion.langBadge === "中文" && (
                  <span className="text-[9px] font-bold bg-blue-100 text-blue-500 px-1.5 py-0.5 rounded-full">
                    AI 번역
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* 원문 토글 */}
                {selectedRegion.langBadge === "中文" && news.length > 0 && (
                  <button
                    onClick={() => setShowOrig(v => !v)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-all ${
                      showOrig
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-400 border-gray-200"
                    }`}
                  >
                    {showOrig ? "한국어 보기" : "中文 원문"}
                  </button>
                )}
                <button onClick={() => loadNews(regionId)} disabled={newsLoading}
                  className="flex items-center gap-1 text-xs text-gray-400 active:opacity-60">
                  <RefreshCw className={`w-3 h-3 ${newsLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {newsLoading && (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            )}

            {!newsLoading && newsError && (
              <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
                <div className="text-3xl mb-2">😢</div>
                <p className="text-sm text-gray-500">뉴스를 불러오지 못했습니다</p>
                <button onClick={() => loadNews(regionId)}
                  className="mt-3 px-4 py-2 bg-[var(--primary)] text-white text-xs rounded-xl font-bold">
                  다시 시도
                </button>
              </div>
            )}

            {!newsLoading && !newsError && news.length === 0 && (
              <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-sm text-gray-500">뉴스가 없습니다</p>
              </div>
            )}

            {!newsLoading && news.length > 0 && (
              <div className="space-y-2.5">
                {news.map((item, i) => (
                  <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
                    className="block bg-white rounded-2xl p-4 border border-gray-100 shadow-sm active:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">
                          {showOrig && item.titleOrig ? item.titleOrig : item.title}
                        </p>
                        {/* 번역 모드일 때 원문 작게 표시 */}
                        {!showOrig && item.titleOrig && (
                          <p className="text-[10px] text-gray-300 mt-0.5 line-clamp-1">{item.titleOrig}</p>
                        )}
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-gray-400 font-medium">{item.source}</span>
                          <span className="text-[10px] text-gray-300">·</span>
                          <span className="text-[10px] text-gray-400">{formatPubDate(item.pubDate)}</span>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" />
                    </div>
                  </a>
                ))}

                {newsUpdatedAt && (
                  <p className="text-center text-[10px] text-gray-300 pt-2">
                    {new Date(newsUpdatedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 업데이트
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── 환율 트렌드 탭 ── */}
        {activeTab === "exchange" && (
          <div>
            {/* 기간 선택 */}
            <div className="flex gap-2 mb-4">
              {PERIODS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                    period === p.id
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "bg-white text-gray-500 border-gray-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {exchangeLoading && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
                <div className="h-5 bg-gray-100 rounded w-1/3 mb-4" />
                <div className="h-20 bg-gray-100 rounded" />
              </div>
            )}

            {!exchangeLoading && exchangeData && (
              <div className="space-y-3">
                {/* CNY 차트 카드 */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🇨🇳</span>
                      <span className="text-sm font-bold text-gray-900">위안화 (CNY)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-extrabold text-gray-900">
                        ₩{exchangeData.latestCny.toFixed(1)}
                      </span>
                      {exchangeData.changePercent.cny > 0 ? (
                        <span className="flex items-center gap-0.5 text-xs font-bold text-red-500">
                          <TrendingUp className="w-3 h-3" />
                          +{Math.abs(exchangeData.changePercent.cny).toFixed(2)}%
                        </span>
                      ) : exchangeData.changePercent.cny < 0 ? (
                        <span className="flex items-center gap-0.5 text-xs font-bold text-green-500">
                          <TrendingDown className="w-3 h-3" />
                          -{Math.abs(exchangeData.changePercent.cny).toFixed(2)}%
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-xs font-bold text-gray-400">
                          <Minus className="w-3 h-3" /> 0%
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-3">1위안 = ? 원 · 매매기준율</p>
                  <MiniLineChart data={exchangeData.data} height={80} />
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-gray-300">{exchangeData.data[0]?.date}</span>
                    <span className="text-[9px] text-gray-300">{exchangeData.data[exchangeData.data.length - 1]?.date}</span>
                  </div>
                </div>

                {/* USD 카드 */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🇺🇸</span>
                      <span className="text-sm font-bold text-gray-900">달러 (USD)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-extrabold text-gray-900">
                        ₩{exchangeData.latestUsd.toLocaleString()}
                      </span>
                      {exchangeData.changePercent.usd > 0 ? (
                        <span className="flex items-center gap-0.5 text-xs font-bold text-red-500">
                          <TrendingUp className="w-3 h-3" />
                          +{Math.abs(exchangeData.changePercent.usd).toFixed(2)}%
                        </span>
                      ) : exchangeData.changePercent.usd < 0 ? (
                        <span className="flex items-center gap-0.5 text-xs font-bold text-green-500">
                          <TrendingDown className="w-3 h-3" />
                          -{Math.abs(exchangeData.changePercent.usd).toFixed(2)}%
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-xs font-bold text-gray-400">
                          <Minus className="w-3 h-3" /> 0%
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-2">1달러 = ? 원 · 매매기준율</p>
                  {/* USD 간단 막대 표시 */}
                  <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                    {[
                      { label: "시작", value: `₩${exchangeData.data[0]?.usd.toLocaleString()}` },
                      { label: "현재", value: `₩${exchangeData.latestUsd.toLocaleString()}` },
                      { label: "변동", value: `${exchangeData.changePercent.usd >= 0 ? "+" : ""}${exchangeData.changePercent.usd.toFixed(2)}%` },
                    ].map(item => (
                      <div key={item.label} className="bg-gray-50 rounded-xl px-2 py-2">
                        <div className="text-[10px] text-gray-400 mb-0.5">{item.label}</div>
                        <div className="text-xs font-bold text-gray-800">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 소싱 인사이트 */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  <p className="text-xs font-bold text-blue-700 mb-1.5">💡 소싱 인사이트</p>
                  {exchangeData.changePercent.cny > 1 ? (
                    <p className="text-xs text-blue-600 leading-relaxed">
                      위안화가 {exchangeData.changePercent.cny.toFixed(1)}% 상승했습니다.
                      원가가 올랐으니 바이어 제안 단가 재검토가 필요할 수 있습니다.
                    </p>
                  ) : exchangeData.changePercent.cny < -1 ? (
                    <p className="text-xs text-blue-600 leading-relaxed">
                      위안화가 {Math.abs(exchangeData.changePercent.cny).toFixed(1)}% 하락했습니다.
                      발주 적기입니다. 지금 재고 확보가 유리할 수 있습니다.
                    </p>
                  ) : (
                    <p className="text-xs text-blue-600 leading-relaxed">
                      위안화 환율이 비교적 안정적입니다.
                      정기 발주 계획대로 진행하기 좋은 시점입니다.
                    </p>
                  )}
                </div>

                <p className="text-center text-[10px] text-gray-300">
                  출처: Frankfurter (ECB 기준) · 참고용, 실제 거래 환율과 다를 수 있음
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── 이우 신상품 탭 ── */}
        {activeTab === "products" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-gray-800">🛒 이우 시장 신상품 트렌드</p>
                <p className="text-xs text-gray-400 mt-0.5">AI가 분석한 현재 주목 카테고리</p>
              </div>
              <button
                onClick={() => { setProducts(null); loadProducts(); }}
                disabled={productsLoading}
                className="flex items-center gap-1 text-xs text-gray-400 active:opacity-60">
                <RefreshCw className={`w-3 h-3 ${productsLoading ? "animate-spin" : ""}`} />
                갱신
              </button>
            </div>

            {productsLoading && (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
                    <div className="h-5 bg-gray-100 rounded w-1/3 mb-3" />
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-100 rounded-full w-20" />
                      <div className="h-6 bg-gray-100 rounded-full w-24" />
                      <div className="h-6 bg-gray-100 rounded-full w-16" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!productsLoading && products && (
              <div className="space-y-3">
                {products.products.map((prod, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{prod.emoji}</span>
                        <span className="text-sm font-bold text-gray-900">{prod.category}</span>
                      </div>
                      <TrendBadge trend={prod.trend} />
                    </div>

                    {/* 상품 아이템 */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {prod.items.map((item, j) => (
                        <span key={j}
                          className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium">
                          {item}
                        </span>
                      ))}
                    </div>

                    {/* 팁 */}
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                      <p className="text-[11px] text-amber-700 leading-relaxed">
                        💡 {prod.tip}
                      </p>
                    </div>
                  </div>
                ))}

                {products.season && (
                  <p className="text-center text-[10px] text-gray-300 pt-1">
                    {products.season} 기준 · AI 분석 · 참고용
                  </p>
                )}

                {/* 이우구 바로가기 */}
                <a href="https://www.yiwugo.com" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 active:opacity-70">
                  <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                    <span className="text-lg">🛍</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-700">义乌购 (이우구) 바로가기</p>
                    <p className="text-[11px] text-red-400 mt-0.5">이우 공식 도매 플랫폼</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-red-300" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
