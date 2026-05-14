/**
 * GPS 기반 시장 위치 감지 유틸리티
 * - 반경 내 알려진 시장 구역이면 해당 이름 반환
 * - 없으면 Nominatim 역지오코딩으로 도시/구역 반환
 */

interface Zone {
  name: string;    // 한국어 표시명
  nameCn: string;  // 중국어 (선택적 표시용)
  lat: number;
  lon: number;
  r: number;       // 반경 (m)
}

// ── 주요 시장 구역 좌표 ─────────────────────────────────────────
const ZONES: Zone[] = [
  // 이우(义乌) 국제상무성 1~5구
  { name: "이우 국제상무성 1구", nameCn: "义乌国际商贸城一区", lat: 29.3020, lon: 120.0760, r: 450 },
  { name: "이우 국제상무성 2구", nameCn: "义乌国际商贸城二区", lat: 29.3072, lon: 120.0700, r: 450 },
  { name: "이우 국제상무성 3구", nameCn: "义乌国际商贸城三区", lat: 29.3105, lon: 120.0640, r: 450 },
  { name: "이우 국제상무성 4구", nameCn: "义乌国际商贸城四区", lat: 29.3135, lon: 120.0585, r: 450 },
  { name: "이우 국제상무성 5구", nameCn: "义乌国际商贸城五区", lat: 29.3170, lon: 120.0548, r: 450 },
  // 이우 기타 시장
  { name: "이우 빈왕시장",       nameCn: "义乌宾王市场",       lat: 29.2915, lon: 120.0556, r: 500 },
  { name: "이우 청림시장",       nameCn: "义乌青林市场",       lat: 29.2843, lon: 120.0645, r: 400 },
  { name: "이우 화청시장",       nameCn: "义乌华清市场",       lat: 29.2958, lon: 120.0627, r: 350 },

  // 광저우(广州) 주요 시장
  { name: "광저우 바이마시장",   nameCn: "广州白马服装市场",   lat: 23.1302, lon: 113.2506, r: 200 },
  { name: "광저우 스탠호",       nameCn: "广州十三行",         lat: 23.1182, lon: 113.2534, r: 300 },
  { name: "광저우 사허시장",     nameCn: "广州沙河服装市场",   lat: 23.1530, lon: 113.3100, r: 400 },
  { name: "광저우 국제경방성",   nameCn: "广州国际轻纺城",     lat: 23.1080, lon: 113.2790, r: 350 },
  { name: "광저우 파저우전시관", nameCn: "广州琶洲国际会展中心",lat: 23.1019, lon: 113.3461, r: 600 },
  { name: "광저우 상품교역회",   nameCn: "广交会展馆",         lat: 23.1033, lon: 113.3497, r: 600 },

  // 상하이(上海)
  { name: "상하이 야시우시장",   nameCn: "上海雅秀服装市场",   lat: 31.2207, lon: 121.4504, r: 200 },
  { name: "상하이 칠포시장",     nameCn: "上海七浦路服装市场", lat: 31.2453, lon: 121.4801, r: 350 },

  // 선전(深圳)
  { name: "선전 화창베이",       nameCn: "深圳华强北",         lat: 22.5455, lon: 114.0892, r: 500 },
  { name: "선전 뤄후상업성",     nameCn: "深圳罗湖商业城",     lat: 22.5476, lon: 114.1119, r: 300 },

  // 칭다오(青岛)
  { name: "칭다오 즉묵시장",     nameCn: "青岛即墨服装市场",   lat: 36.3882, lon: 120.4473, r: 500 },
];

// ── 중국 도시명 → 한국어 매핑 ─────────────────────────────────
const CITY_KO: Record<string, string> = {
  "义乌市": "이우", "义乌": "이우",
  "广州市": "광저우", "广州": "광저우",
  "上海市": "상하이", "上海": "상하이",
  "深圳市": "선전", "深圳": "선전",
  "杭州市": "항저우", "杭州": "항저우",
  "宁波市": "닝보", "宁波": "닝보",
  "北京市": "베이징", "北京": "베이징",
  "成都市": "청두", "成都": "청두",
  "苏州市": "쑤저우", "苏州": "쑤저우",
  "青岛市": "칭다오", "青岛": "칭다오",
  "天津市": "톈진", "天津": "톈진",
  "武汉市": "우한", "武汉": "우한",
  "重庆市": "충칭", "重庆": "충칭",
  "西安市": "시안", "西安": "시안",
  "东莞市": "둥관", "东莞": "둥관",
  "福州市": "푸저우", "福州": "푸저우",
  "厦门市": "샤먼", "厦门": "샤먼",
  "泉州市": "취안저우", "泉州": "취안저우",
};

// ── 문자열에 한자(CJK) 포함 여부 ────────────────────────────
function hasChinese(str: string): boolean {
  return /[一-鿿㐀-䶿]/.test(str);
}

// ── 두 좌표 간 거리(미터) 계산 ───────────────────────────────
function distanceM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── GPS 위치 가져오기 ─────────────────────────────────────────
function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 10000,
      enableHighAccuracy: true,
      maximumAge: 30000,
    })
  );
}

// ── 메인 함수: 현재 위치 → 시장 구역 이름 반환 ──────────────
export async function detectMarketLocation(): Promise<string> {
  if (!navigator.geolocation) {
    throw new Error("이 브라우저는 위치 기능을 지원하지 않습니다.");
  }

  const pos = await getCurrentPosition();
  const { latitude: lat, longitude: lon } = pos.coords;

  // 1) 알려진 시장 구역 확인 (가장 가까운 반경 내 구역)
  let closest: { zone: Zone; dist: number } | null = null;
  for (const zone of ZONES) {
    const dist = distanceM(lat, lon, zone.lat, zone.lon);
    if (dist <= zone.r) {
      if (!closest || dist < closest.dist) {
        closest = { zone, dist };
      }
    }
  }
  if (closest) return `${closest.zone.name}(${closest.zone.nameCn})`;

  // 2) Nominatim 역지오코딩 fallback — 한국어 + 중국어 병렬 호출
  try {
    const headers = { "User-Agent": "SourcingKit/1.0 (trade app)" };
    const base = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

    const [resKo, resCn] = await Promise.all([
      fetch(`${base}&accept-language=ko`, { headers }),
      fetch(`${base}&accept-language=zh-CN`, { headers }),
    ]);
    const [dataKo, dataCn] = await Promise.all([resKo.json(), resCn.json()]);

    const addrKo = dataKo.address || {};
    const addrCn = dataCn.address || {};

    // 한국어 시/구 추출
    const cityKoRaw =
      addrKo.city || addrKo.town || addrKo.county || addrKo.state_district || "";
    const distKo =
      addrKo.city_district || addrKo.suburb || addrKo.neighbourhood || addrKo.quarter || "";

    // 중국어 시/구 추출
    const cityCnRaw =
      addrCn.city || addrCn.town || addrCn.county || addrCn.state_district || "";
    const distCn =
      addrCn.city_district || addrCn.suburb || addrCn.neighbourhood || addrCn.quarter || "";

    // CITY_KO 매핑 우선 적용 (중국 도시인 경우)
    const cityKo = CITY_KO[cityCnRaw] || cityKoRaw || cityCnRaw;
    const cityCn = cityCnRaw;

    // 중국 한자가 없는 district는 중국어 파트에서 제외 (한국 동/읍 등)
    const cnDistFinal = hasChinese(distCn) ? distCn : "";
    const cnCityFinal = hasChinese(cityCn) ? cityCn : "";

    // 조합: 한국어(중국어)
    const koFull = [cityKo, distKo].filter(Boolean).join(" ");
    const cnFull = [cnCityFinal, cnDistFinal].filter(Boolean).join(" ");

    if (koFull && cnFull && koFull !== cnFull) return `${koFull}(${cnFull})`;
    if (koFull && cnCityFinal) return `${koFull}(${cnCityFinal})`;
    if (koFull) return koFull;
    if (cnFull) return cnFull;

    return (dataKo.display_name || "").split(",")[0] || "위치 확인 불가";
  } catch {
    // Nominatim 실패 시 좌표 그대로
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
}
