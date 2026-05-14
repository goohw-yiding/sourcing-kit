"use client";

import { useState, useRef, useCallback } from "react";
import { X, Volume2, MapPin, Loader2, ChevronRight, Navigation, BookOpen, Calculator } from "lucide-react";
import Link from "next/link";
import { PHRASE_CATEGORIES, NEARBY_QUICK, type Phrase } from "@/lib/phrases";
import type { NearbyPoi } from "@/app/api/nearby/route";

/* ── 카테고리별 탭 스크롤 ─────────────────────────────────── */
function CategoryTabs({
  active,
  onChange,
}: {
  active: number;
  onChange: (i: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className="flex gap-2 overflow-x-auto pb-1 px-4 scrollbar-hide">
      {PHRASE_CATEGORIES.map((cat, i) => (
        <button
          key={cat.id}
          onClick={() => {
            onChange(i);
            // 탭이 보이도록 스크롤
            const el = ref.current?.children[i] as HTMLElement;
            el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
          }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0 border ${
            active === i
              ? `${cat.color} ${cat.textColor} border-transparent shadow-sm`
              : "bg-white text-gray-500 border-gray-200"
          }`}
        >
          <span className="text-base leading-none">{cat.icon}</span>
          {cat.label}
        </button>
      ))}
    </div>
  );
}

/* ── TTS ─────────────────────────────────────────────────── */
function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

/* ── 전체화면 "상대방 보여주기" 모달 ────────────────────── */
function ShowModal({ phrase, onClose }: { phrase: Phrase; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[300] bg-gray-950 flex flex-col items-center justify-center px-8 gap-6"
      onClick={onClose}
    >
      {/* 안내 */}
      <p className="text-gray-400 text-sm">화면을 중국인에게 보여주세요</p>

      {/* 중국어 — 크게 */}
      <p className="text-white font-bold text-center leading-tight"
         style={{ fontSize: "clamp(2.2rem, 10vw, 3.5rem)" }}>
        {phrase.cn}
      </p>

      {/* 핀인 */}
      <p className="text-gray-400 text-lg text-center">{phrase.pinyin}</p>

      {/* 한국어 */}
      <p className="text-gray-500 text-base text-center">{phrase.kr}</p>

      {/* TTS 버튼 */}
      <button
        onClick={(e) => { e.stopPropagation(); speak(phrase.cn); }}
        className="flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-2xl font-medium mt-2"
      >
        <Volume2 className="w-5 h-5" /> 소리 듣기
      </button>

      <p className="text-gray-600 text-xs mt-4">탭하면 닫힙니다</p>
    </div>
  );
}

/* ── 이우 시장 구역 데이터 ───────────────────────────────── */
const YIWU_DISTRICTS = [
  { label: "1구", name: "义乌国际商贸城一区", lon: 120.0715, lat: 29.3263 },
  { label: "2구", name: "义乌国际商贸城二区", lon: 120.0768, lat: 29.3296 },
  { label: "3구", name: "义乌国际商贸城三区", lon: 120.0845, lat: 29.3182 },
  { label: "4구", name: "义乌国际商贸城四区", lon: 120.0890, lat: 29.3143 },
  { label: "5구", name: "义乌国际商贸城五区", lon: 120.0951, lat: 29.3085 },
];

// 구역 간 이동 팁 [from][to]
const ROUTE_TIPS: Record<string, string> = {
  "0-1": "1구 정문 나와 빈왕로(宾王路) 따라 북쪽으로 약 12분 도보",
  "0-2": "1구 정문 → 빈왕로 남쪽 방향 → 3구 북문, 약 20분",
  "0-3": "1구 → 빈왕로 → 청소년광장 경유 → 4구, 약 28분. 거리 멀면 택시 추천",
  "0-4": "1구에서 5구까지 직접 걷기는 40분+. 전기차 셔틀 또는 택시 이용 강력 추천",
  "1-0": "2구 남문 나와 빈왕로 따라 남쪽으로 약 12분 도보",
  "1-2": "2구 남문 → 빈왕로 → 3구 북문, 약 18분 도보",
  "1-3": "2구 → 빈왕로 → 청소년광장 경유 → 4구, 약 25분",
  "1-4": "2구에서 5구는 약 35분+. 전기차 셔틀 또는 택시 이용 추천",
  "2-0": "3구 북문 나와 빈왕로 따라 북쪽으로 약 20분 도보",
  "2-1": "3구 북문 → 빈왕로 북쪽 → 2구 남문, 약 18분 도보",
  "2-3": "3구 동문 → 동방로(东方路) 따라 동쪽 → 4구, 약 10분 도보",
  "2-4": "3구 → 동방로 → 4구 → 5구 방향, 약 20분",
  "3-0": "4구 → 청소년광장 → 빈왕로 → 1구, 약 28분. 택시 추천",
  "3-1": "4구 → 청소년광장 → 빈왕로 → 2구, 약 25분",
  "3-2": "4구 서문 → 동방로 → 3구 동문, 약 10분 도보",
  "3-4": "4구 동문 나와 동방로 따라 동쪽으로 약 12분 도보 → 5구",
  "4-0": "5구에서 1구는 약 40분+. 전기차 셔틀 또는 택시 강력 추천",
  "4-1": "5구 → 동방로 → 4구 → 2구 방향, 약 35분. 택시 추천",
  "4-2": "5구 → 동방로 → 3구, 약 20분 도보",
  "4-3": "5구 서문 → 동방로 따라 서쪽으로 약 12분 도보 → 4구",
};

const WALK_MINUTES: number[][] = [
  [0, 12, 20, 28, 40],
  [12, 0, 18, 25, 35],
  [20, 18, 0, 10, 20],
  [28, 25, 10, 0, 12],
  [40, 35, 20, 12, 0],
];

/* ── 시장 이동 길찾기 컴포넌트 ───────────────────────────── */
function MarketNav() {
  const [from, setFrom] = useState<number | null>(null);
  const [to, setTo]     = useState<number | null>(null);
  const [fromFloor, setFromFloor] = useState("");
  const [toFloor, setToFloor]     = useState("");
  const [fromArea, setFromArea]   = useState("");
  const [toArea, setToArea]       = useState("");

  const canNav = from !== null && to !== null && from !== to;
  const minutes = canNav ? WALK_MINUTES[from][to] : null;
  const tip = canNav ? ROUTE_TIPS[`${from}-${to}`] : null;

  const openAmap = () => {
    if (!canNav) return;
    const f = YIWU_DISTRICTS[from];
    const t = YIWU_DISTRICTS[to];
    const fromName = encodeURIComponent(`${f.name}${fromFloor ? ` ${fromFloor}층` : ""}`);
    const toName   = encodeURIComponent(`${t.name}${toFloor ? ` ${toFloor}층` : ""}`);
    const url = `https://www.amap.com/dir?from[lnglat]=${f.lon},${f.lat}&from[name]=${fromName}&to[lnglat]=${t.lon},${t.lat}&to[name]=${toName}&type=walk`;
    window.open(url, "_blank");
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3">
        <p className="font-bold text-white text-sm">🏙️ 이우 시장 내 이동 길찾기</p>
        <p className="text-blue-100 text-xs mt-0.5">구역·층 선택 → 고덕지도 도보 경로</p>
      </div>

      <div className="p-4 space-y-4">
        {/* FROM / TO */}
        {[
          { label: "출발", val: from, setVal: setFrom, floor: fromFloor, setFloor: setFromFloor, area: fromArea, setArea: setFromArea, color: "border-blue-400 bg-blue-50" },
          { label: "도착", val: to,   setVal: setTo,   floor: toFloor,   setFloor: setToFloor,   area: toArea,   setArea: setToArea,   color: "border-orange-400 bg-orange-50" },
        ].map(({ label, val, setVal, floor, setFloor, area, setArea, color }) => (
          <div key={label} className={`rounded-xl border-2 p-3 space-y-2 ${color}`}>
            <p className="text-xs font-bold text-gray-600">{label} 위치</p>
            {/* 구역 선택 */}
            <div className="grid grid-cols-5 gap-1.5">
              {YIWU_DISTRICTS.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setVal(i)}
                  className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                    val === i
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            {/* 층 + 구역 */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">층 (선택)</label>
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="예: 2층"
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">구역·상품 (선택)</label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="예: 주방용품 C区"
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
                />
              </div>
            </div>
          </div>
        ))}

        {/* 경로 미리보기 */}
        {canNav && (
          <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700">
                {YIWU_DISTRICTS[from!].label} → {YIWU_DISTRICTS[to!].label}
              </span>
              <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                minutes! <= 15 ? "bg-green-100 text-green-700" :
                minutes! <= 25 ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-700"
              }`}>
                도보 약 {minutes}분
              </span>
            </div>
            {minutes! >= 30 && (
              <p className="text-xs text-red-500 font-medium">⚠️ 거리가 멀어요. 전기차 셔틀 또는 택시 이용을 추천해요.</p>
            )}
            {tip && <p className="text-xs text-gray-500 leading-relaxed">{tip}</p>}
          </div>
        )}

        {from === to && from !== null && (
          <p className="text-xs text-center text-gray-400">출발과 도착이 같은 구역이에요</p>
        )}

        {/* 길찾기 버튼 */}
        <button
          onClick={openAmap}
          disabled={!canNav}
          className="w-full bg-blue-600 text-white rounded-2xl py-3.5 font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <span className="text-lg">🗺️</span>
          고덕지도에서 도보 경로 열기
        </button>
        <p className="text-center text-xs text-gray-400">
          앱 없이 브라우저에서 바로 확인 · 로그인 불필요
        </p>

        {/* 실내지도 바로가기 */}
        <Link href="/indoor">
          <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl py-3 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🗂️</span>
              <div>
                <p className="text-sm font-bold text-emerald-700">이우 시장 상품지도</p>
                <p className="text-xs text-emerald-500">구별 상품 위치 검색 (예: 주방용품 → 3구)</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          </div>
        </Link>
      </div>
    </div>
  );
}

/* ── 시장 위치 프리셋 ─────────────────────────────────────── */
const MARKET_PRESETS = [
  { label: "이우 1구", lat: 29.3274, lon: 120.0717 },
  { label: "이우 2구", lat: 29.3312, lon: 120.0782 },
  { label: "이우 3구", lat: 29.3188, lon: 120.0845 },
  { label: "이우 4구", lat: 29.3150, lon: 120.0892 },
  { label: "이우 5구", lat: 29.3090, lon: 120.0956 },
  { label: "광저우",   lat: 23.1291, lon: 113.2644 },
  { label: "선전",     lat: 22.5431, lon: 114.0579 },
  { label: "상하이",   lat: 31.2304, lon: 121.4737 },
];

/* ── 주변 검색 탭 ────────────────────────────────────────── */
function NearbyTab({ onShowPhrases }: { onShowPhrases: (catId: string) => void }) {
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [activeBtn, setActiveBtn] = useState<string | null>(null);
  const [results, setResults] = useState<NearbyPoi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [noKey, setNoKey] = useState(false);

  // POI 상세 모달
  const [selectedPoi, setSelectedPoi] = useState<NearbyPoi | null>(null);
  const [poiDetail, setPoiDetail] = useState<{
    photos: { title: string; url: string }[];
    rating: string | null;
    openTime: string | null;
    tel: string;
    address: string;
    location: string;
    name: string;
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const openDetail = async (poi: NearbyPoi) => {
    setSelectedPoi(poi);
    setPoiDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/nearby/detail?id=${poi.id}`);
      if (res.ok) setPoiDetail(await res.json());
    } finally {
      setDetailLoading(false);
    }
  };

  const getLocation = useCallback((): Promise<{ lat: number; lon: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error("no_geo")); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  const search = useCallback(async (kw: string, phraseId?: string) => {
    setError(null);
    setResults([]);
    setSearching(true);
    try {
      let curLat = lat;
      let curLon = lon;
      if (!curLat || !curLon) {
        setLocating(true);
        const pos = await getLocation();
        curLat = pos.lat; curLon = pos.lon;
        setLat(curLat); setLon(curLon);
        setLocationLabel("현재 위치");
        setLocating(false);
      }
      const res = await fetch(
        `/api/nearby?lat=${curLat}&lon=${curLon}&keyword=${encodeURIComponent(kw)}&radius=1000`
      );
      const data = await res.json();
      if (data.error === "no_key") { setNoKey(true); return; }
      if (data.error) { setError("검색 중 오류가 발생했어요"); return; }
      setResults(data.pois || []);
      if (phraseId) setActiveBtn(phraseId);
    } catch {
      setLocating(false);
      setError("위치를 가져올 수 없어요. 위치 권한을 확인해주세요.");
    } finally {
      setSearching(false);
      setLocating(false);
    }
  }, [lat, lon, getLocation]);

  const handleQuick = (kw: string, phraseId: string) => {
    setActiveBtn(phraseId);
    search(kw, phraseId);
  };

  if (noKey) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
        <span className="text-4xl">🗺️</span>
        <p className="font-bold text-gray-800">주변 검색 설정 필요</p>
        <p className="text-sm text-gray-500 leading-relaxed">
          주변 검색은 <strong>高德地图(Amap)</strong> API 키가 필요해요.{"\n"}
          <code className="bg-gray-100 px-1 rounded text-xs">.env.local</code>에
          <code className="bg-gray-100 px-1 rounded text-xs ml-1">AMAP_API_KEY=</code>를 추가하세요.
        </p>
        <a
          href="https://lbs.amap.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 text-sm underline"
        >
          Amap 개발자 키 발급받기 →
        </a>
      </div>
    );
  }

  return (
    <div className="px-4 pb-6 space-y-4">

      {/* 이우 시장 이동 길찾기 */}
      <MarketNav />

      {/* 현재 위치 표시 + 변경 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-sm font-semibold text-gray-700">
              {locationLabel ?? "위치 미설정"}
            </span>
            {lat && lon && (
              <span className="text-xs text-gray-400">
                ({lat.toFixed(4)}, {lon.toFixed(4)})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                setLocating(true);
                setError(null);
                try {
                  const pos = await getLocation();
                  setLat(pos.lat); setLon(pos.lon);
                  setLocationLabel("현재 위치");
                  setResults([]);
                } catch {
                  setError("GPS 위치를 가져올 수 없어요.");
                } finally { setLocating(false); }
              }}
              disabled={locating}
              className="text-xs text-blue-600 font-semibold border border-blue-200 bg-blue-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1"
            >
              <Navigation className="w-3.5 h-3.5" />
              GPS
            </button>
            <button
              onClick={() => setShowPresets((v) => !v)}
              className="text-xs text-[var(--primary)] font-semibold border border-[var(--primary-light)] bg-[var(--primary-lighter)] px-2.5 py-1.5 rounded-lg"
            >
              시장 선택
            </button>
          </div>
        </div>

        {/* 시장 프리셋 */}
        {showPresets && (
          <div className="border-t border-gray-100 px-3 py-3">
            <div className="grid grid-cols-4 gap-1.5">
              {MARKET_PRESETS.map((m) => (
                <button
                  key={m.label}
                  onClick={() => {
                    setLat(m.lat); setLon(m.lon);
                    setLocationLabel(m.label);
                    setShowPresets(false);
                    setResults([]);
                    setActiveBtn(null);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                    locationLabel === m.label
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "bg-gray-50 text-gray-700 border-gray-200"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 빠른 버튼 */}
      <div className="grid grid-cols-4 gap-2">
        {NEARBY_QUICK.map((btn) => (
          <button
            key={btn.keyword}
            onClick={() => handleQuick(btn.keyword, btn.phraseId)}
            disabled={searching || locating}
            className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 text-xs font-semibold transition-all disabled:opacity-50 ${btn.color} ${
              activeBtn === btn.phraseId && !searching ? "shadow-md scale-95" : ""
            }`}
          >
            <span className="text-2xl">{btn.icon}</span>
            {btn.label}
          </button>
        ))}
      </div>

      {/* 자유 검색 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && keyword.trim() && search(keyword.trim())}
          placeholder="직접 검색... (예: 슈퍼마켓, 은행)"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
        />
        <button
          onClick={() => keyword.trim() && search(keyword.trim())}
          disabled={searching || locating || !keyword.trim()}
          className="px-4 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-bold disabled:opacity-40"
        >
          {searching || locating ? <Loader2 className="w-4 h-4 animate-spin" /> : "검색"}
        </button>
      </div>

      {/* 상태 */}
      {locating && (
        <div className="flex items-center gap-2 text-blue-600 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>위치 감지 중...</span>
        </div>
      )}
      {searching && !locating && (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>검색 중...</span>
        </div>
      )}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* 결과 */}
      {results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium">
              <MapPin className="w-3 h-3 inline mr-1" />
              반경 1km 내 {results.length}개
            </p>
            <button
              onClick={() => { setResults([]); setActiveBtn(null); setError(null); }}
              className="text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-3 py-1 font-semibold"
            >
              ← 처음으로
            </button>
          </div>
          {results.map((poi) => {
            const linkedCat = NEARBY_QUICK.find((b) => activeBtn === b.phraseId);
            return (
              <button
                key={poi.id}
                onClick={() => openDetail(poi)}
                className="w-full bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm text-left active:scale-[0.98] transition-transform"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">{poi.name}</p>
                    {poi.address && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{poi.address}</p>
                    )}
                    {poi.tel && (
                      <p className="text-xs text-blue-500 mt-0.5">{poi.tel}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {poi.distance && (
                      <span className="text-xs font-bold text-[var(--primary)]">
                        {Number(poi.distance) >= 1000
                          ? `${(Number(poi.distance) / 1000).toFixed(1)}km`
                          : `${poi.distance}m`}
                      </span>
                    )}
                    <span className="text-xs text-gray-300">사진·지도 →</span>
                  </div>
                </div>
                {linkedCat && (
                  <div
                    onClick={(e) => { e.stopPropagation(); onShowPhrases(linkedCat.phraseId); }}
                    className="mt-2 w-full text-xs font-semibold text-[var(--primary)] bg-[var(--primary-lighter)] rounded-xl py-1.5 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    여기서 쓸 중국어 보기 →
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {results.length === 0 && !searching && !locating && !error && (
        <div className="flex flex-col items-center py-12 text-center gap-2">
          <span className="text-5xl">📍</span>
          <p className="text-gray-400 text-sm mt-2">위 버튼을 탭하면<br/>현재 위치 주변을 검색해요</p>
        </div>
      )}

      {/* POI 상세 모달 */}
      {selectedPoi && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedPoi(null)} />
          <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
            {/* 핸들 */}
            <div className="sticky top-0 bg-white pt-3 pb-2 px-4 flex items-center justify-between border-b border-gray-100 z-10">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
              <h3 className="font-bold text-gray-900 text-base pt-2 flex-1 truncate pr-8">{selectedPoi.name}</h3>
              <button onClick={() => setSelectedPoi(null)} className="p-1.5 rounded-full bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-4 pb-10 pt-3 space-y-4">
              {/* 로딩 */}
              {detailLoading && (
                <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">정보 불러오는 중...</span>
                </div>
              )}

              {/* 사진 */}
              {!detailLoading && poiDetail && poiDetail.photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
                  {poiDetail.photos.map((ph, i) => (
                    <img
                      key={i}
                      src={ph.url}
                      alt={ph.title || selectedPoi.name}
                      className="w-48 h-36 object-cover rounded-2xl shrink-0 border border-gray-100"
                    />
                  ))}
                </div>
              )}
              {!detailLoading && poiDetail && poiDetail.photos.length === 0 && (
                <div className="bg-gray-50 rounded-2xl h-28 flex items-center justify-center text-gray-300 text-sm">
                  사진 없음
                </div>
              )}

              {/* 기본 정보 */}
              {!detailLoading && (poiDetail || selectedPoi) && (() => {
                const d = poiDetail;
                const addr = d?.address || selectedPoi.address;
                const tel  = d?.tel  || selectedPoi.tel;
                return (
                  <div className="bg-gray-50 rounded-2xl px-4 py-3 space-y-2 text-sm">
                    {d?.rating && (
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-400 text-base">★</span>
                        <span className="font-bold text-gray-800">{d.rating}</span>
                      </div>
                    )}
                    {addr && (
                      <div className="flex gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
                        <span>{addr}</span>
                      </div>
                    )}
                    {tel && (
                      <div className="flex gap-2 text-gray-600">
                        <span className="text-gray-400 text-base leading-none">📞</span>
                        <a href={`tel:${tel.split(";")[0]}`} className="text-blue-600 font-medium">{tel}</a>
                      </div>
                    )}
                    {d?.openTime && (
                      <div className="flex gap-2 text-gray-600">
                        <span className="text-gray-400 text-base leading-none">🕐</span>
                        <span>{d.openTime}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 네비게이션 버튼 */}
              {(() => {
                const loc = poiDetail?.location || selectedPoi.location;
                if (!loc) return null;
                const [pLon, pLat] = loc.split(",");
                // 로그인 불필요 — POI 웹페이지 직접 열기 (앱 있으면 자동 연동)
                const amapWebUrl = `https://www.amap.com/place/${selectedPoi.id}`;
                // 구글맵 좌표 직접 링크 — 로그인 불필요
                const googleUrl = `https://maps.google.com/?q=${pLat},${pLon}`;
                return (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <a
                        href={amapWebUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-1.5 bg-blue-600 text-white rounded-2xl py-4 font-bold text-sm shadow-sm active:opacity-80"
                      >
                        <span className="text-2xl">🗺️</span>
                        고덕지도
                        <span className="text-xs font-normal opacity-80">로그인 불필요</span>
                      </a>
                      <a
                        href={googleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-1.5 bg-green-600 text-white rounded-2xl py-4 font-bold text-sm shadow-sm active:opacity-80"
                      >
                        <span className="text-2xl">📍</span>
                        구글 지도
                        <span className="text-xs font-normal opacity-80">로그인 불필요</span>
                      </a>
                    </div>
                    <p className="text-center text-xs text-gray-400">
                      고덕지도 앱 설치 시 앱으로 자동 연결 · PC·모바일 모두 사용 가능
                    </p>
                  </div>
                );
              })()}

              {/* 거리 배지 */}
              {selectedPoi.distance && (
                <p className="text-center text-xs text-gray-400">
                  현재 위치에서 약 {Number(selectedPoi.distance) >= 1000
                    ? `${(Number(selectedPoi.distance)/1000).toFixed(1)}km`
                    : `${selectedPoi.distance}m`} 거리
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 메인 페이지 ─────────────────────────────────────────── */
export default function PhrasesPage() {
  const [tab, setTab] = useState<"phrases" | "nearby">("nearby");
  const [catIdx, setCatIdx] = useState(0);
  const [showPhrase, setShowPhrase] = useState<Phrase | null>(null);

  const cat = PHRASE_CATEGORIES[catIdx];

  const handleShowPhrases = (catId: string) => {
    const idx = PHRASE_CATEGORIES.findIndex((c) => c.id === catId);
    if (idx >= 0) { setCatIdx(idx); setTab("phrases"); }
  };

  return (
    <div className="min-h-screen pb-28 bg-[#F4F6FA]">
      {/* 헤더 */}
      <header className="bg-[var(--primary)] text-white px-5 pt-14 pb-4">
        <h1 className="text-xl font-bold">현장 가이드</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
          중국어 회화 · 주변 검색
        </p>

        {/* 탭 */}
        <div className="flex gap-1 mt-4 bg-white/10 rounded-2xl p-1">
          <button
            onClick={() => setTab("phrases")}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === "phrases" ? "bg-white text-[var(--primary)]" : "text-white/70"
            }`}
          >
            💬 회화
          </button>
          <button
            onClick={() => setTab("nearby")}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === "nearby" ? "bg-white text-[var(--primary)]" : "text-white/70"
            }`}
          >
            📍 주변 검색
          </button>
        </div>
      </header>

      {/* ── 회화 탭 ── */}
      {tab === "phrases" && (
        <>
          {/* 카테고리 스크롤 */}
          <div className="py-3 bg-white border-b border-gray-100 shadow-sm">
            <CategoryTabs active={catIdx} onChange={setCatIdx} />
          </div>

          {/* 카테고리 헤더 */}
          <div className={`mx-4 mt-4 mb-2 px-4 py-3 rounded-2xl ${cat.color} flex items-center gap-3`}>
            <span className="text-3xl">{cat.icon}</span>
            <div>
              <p className={`font-bold ${cat.textColor}`}>{cat.label}</p>
              <p className="text-xs text-gray-500">{cat.labelCn}</p>
            </div>
            {/* 현장 빠른 액션 */}
            {cat.id === "product" && (
              <Link
                href="/sourcing?new=1"
                className="ml-auto flex items-center gap-1 text-xs font-bold bg-white/80 text-orange-600 px-3 py-1.5 rounded-xl"
              >
                <BookOpen className="w-3.5 h-3.5" /> 상품등록
              </Link>
            )}
            {cat.id === "negotiate" && (
              <Link
                href="/calculator"
                className="ml-auto flex items-center gap-1 text-xs font-bold bg-white/80 text-[var(--primary)] px-3 py-1.5 rounded-xl"
              >
                <Calculator className="w-3.5 h-3.5" /> 원가계산
              </Link>
            )}
            {cat.nearbyKeyword && (
              <button
                onClick={() => { setTab("nearby"); }}
                className="ml-auto flex items-center gap-1 text-xs font-bold bg-white/80 text-gray-600 px-3 py-1.5 rounded-xl"
              >
                <Navigation className="w-3.5 h-3.5" /> 주변검색
              </button>
            )}
          </div>

          {/* 문장 목록 */}
          <div className="px-4 space-y-2 pb-4">
            {cat.phrases.map((phrase, i) => (
              <div
                key={i}
                onClick={() => setShowPhrase(phrase)}
                className="bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100 flex items-center gap-3 active:bg-gray-50 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-base">{phrase.cn}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{phrase.pinyin}</p>
                  <p className="text-sm text-gray-600 mt-1">{phrase.kr}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); speak(phrase.cn); }}
                    className={`p-2 rounded-xl ${cat.color}`}
                  >
                    <Volume2 className={`w-4 h-4 ${cat.textColor}`} />
                  </button>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── 주변 검색 탭 ── */}
      {tab === "nearby" && (
        <div className="pt-4">
          <NearbyTab onShowPhrases={handleShowPhrases} />
        </div>
      )}

      {/* 전체화면 모달 */}
      {showPhrase && (
        <ShowModal phrase={showPhrase} onClose={() => setShowPhrase(null)} />
      )}
    </div>
  );
}
