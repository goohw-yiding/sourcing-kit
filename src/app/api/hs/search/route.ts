import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

// ── FTA 협정세율 테이블 (국가별) ─────────────────────────────
// HS코드 앞 4자리 → 협정별 세율
// 출처: 관세청 FTA 포털, 한-중/한-미/RCEP 협정세율표
const FTA_RATES: Record<string, {
  CN?: number;   // 한-중 FTA
  US?: number;   // 한-미 FTA
  JP?: number;   // RCEP
  VN?: number;   // 한-ASEAN FTA
  SG?: number;   // 한-ASEAN FTA
}> = {
  // 의류·섬유 (6101~6217)
  "6101": { CN: 0.045, US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  "6102": { CN: 0.045, US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  "6103": { CN: 0.045, US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  "6104": { CN: 0.045, US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  "6105": { CN: 0.045, US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  "6106": { CN: 0.045, US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  "6107": { CN: 0.045, US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  "6108": { CN: 0.045, US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  "6109": { CN: 0.045, US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  "6110": { CN: 0.045, US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  "6111": { CN: 0.045, US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  "6112": { CN: 0.045, US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  "6116": { CN: 0.0,   US: 0.0,   JP: 0.0,  VN: 0.0, SG: 0.0 },
  "6201": { CN: 0.06,  US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  "6202": { CN: 0.06,  US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  "6203": { CN: 0.045, US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  "6204": { CN: 0.045, US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  "6205": { CN: 0.045, US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  "6211": { CN: 0.045, US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  "6217": { CN: 0.06,  US: 0.0,   JP: 0.06, VN: 0.0, SG: 0.0 },
  // 신발 (6401~6405)
  "6401": { CN: 0.08,  US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  "6402": { CN: 0.06,  US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  "6403": { CN: 0.06,  US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  "6404": { CN: 0.06,  US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  "6405": { CN: 0.06,  US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  // 모자 (6501~6506)
  "6505": { CN: 0.0,   US: 0.0,   JP: 0.0,  VN: 0.0, SG: 0.0 },
  // 가방 (4202)
  "4202": { CN: 0.06,  US: 0.0,   JP: 0.06, VN: 0.0, SG: 0.0 },
  // 화장품 (3303~3307)
  "3303": { CN: 0.045, US: 0.0,   JP: 0.045,VN: 0.0, SG: 0.0 },
  "3304": { CN: 0.045, US: 0.0,   JP: 0.045,VN: 0.0, SG: 0.0 },
  "3305": { CN: 0.045, US: 0.0,   JP: 0.045,VN: 0.0, SG: 0.0 },
  "3307": { CN: 0.045, US: 0.0,   JP: 0.045,VN: 0.0, SG: 0.0 },
  // 침구·섬유제품 (6301~6307)
  "6302": { CN: 0.06,  US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  "6304": { CN: 0.08,  US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  "6303": { CN: 0.08,  US: 0.0,   JP: 0.08, VN: 0.0, SG: 0.0 },
  // 완구 (9503~9506)
  "9503": { CN: 0.0,   US: 0.0,   JP: 0.0,  VN: 0.0, SG: 0.0 },
  "9504": { CN: 0.0,   US: 0.0,   JP: 0.0,  VN: 0.0, SG: 0.0 },
  "9506": { CN: 0.04,  US: 0.0,   JP: 0.04, VN: 0.0, SG: 0.0 },
  // 전자제품 (8414~8544)
  "8414": { CN: 0.0,   US: 0.0,   JP: 0.0,  VN: 0.0, SG: 0.0 },
  "8509": { CN: 0.0,   US: 0.0,   JP: 0.0,  VN: 0.0, SG: 0.0 },
  "8516": { CN: 0.0,   US: 0.0,   JP: 0.0,  VN: 0.0, SG: 0.0 },
  "8517": { CN: 0.0,   US: 0.0,   JP: 0.0,  VN: 0.0, SG: 0.0 },
  "8518": { CN: 0.0,   US: 0.0,   JP: 0.0,  VN: 0.0, SG: 0.0 },
  "8523": { CN: 0.0,   US: 0.0,   JP: 0.0,  VN: 0.0, SG: 0.0 },
  "8544": { CN: 0.0,   US: 0.0,   JP: 0.0,  VN: 0.0, SG: 0.0 },
  "8504": { CN: 0.0,   US: 0.0,   JP: 0.0,  VN: 0.0, SG: 0.0 },
  // 주방·식기 (3924, 6911, 7013, 7323)
  "3924": { CN: 0.04,  US: 0.0,   JP: 0.04, VN: 0.0, SG: 0.0 },
  "6911": { CN: 0.04,  US: 0.0,   JP: 0.04, VN: 0.0, SG: 0.0 },
  "7013": { CN: 0.04,  US: 0.0,   JP: 0.04, VN: 0.0, SG: 0.0 },
  "7323": { CN: 0.0,   US: 0.0,   JP: 0.0,  VN: 0.0, SG: 0.0 },
  // 가구 (9401~9403, 9405)
  "9401": { CN: 0.0,   US: 0.0,   JP: 0.0,  VN: 0.0, SG: 0.0 },
  "9403": { CN: 0.0,   US: 0.0,   JP: 0.0,  VN: 0.0, SG: 0.0 },
  "9405": { CN: 0.0,   US: 0.0,   JP: 0.0,  VN: 0.0, SG: 0.0 },
  // 주얼리·액세서리 (7117)
  "7117": { CN: 0.04,  US: 0.0,   JP: 0.04, VN: 0.0, SG: 0.0 },
  // 플라스틱 잡화 (3926)
  "3926": { CN: 0.04,  US: 0.0,   JP: 0.04, VN: 0.0, SG: 0.0 },
  // 공예품 (9601)
  "9601": { CN: 0.0,   US: 0.0,   JP: 0.0,  VN: 0.0, SG: 0.0 },
};

export function getFtaRates(hsCode: string) {
  const prefix4 = hsCode.slice(0, 4);
  return FTA_RATES[prefix4] ?? null;
}

// ── 로컬 DB ───────────────────────────────────────────────────
const HS_DB = [
  { hsCode: "6110200000", keywords: ["면 스웨터", "니트", "스웨터", "풀오버", "면니트", "棉毛衣", "니트웨어"] },
  { hsCode: "6110300000", keywords: ["합성섬유 스웨터", "폴리 니트", "화섬니트", "폴리에스터 니트"] },
  { hsCode: "6109100000", keywords: ["면 티셔츠", "티셔츠", "T셔츠", "반팔", "棉T恤", "반팔티"] },
  { hsCode: "6109900000", keywords: ["합성섬유 티셔츠", "폴리 티셔츠", "기능성 티셔츠"] },
  { hsCode: "6104430000", keywords: ["합성섬유 원피스", "원피스", "드레스", "连衣裙"] },
  { hsCode: "6203420000", keywords: ["면 바지", "청바지", "데님", "팬츠", "棉裤子"] },
  { hsCode: "6203430000", keywords: ["합성섬유 바지", "폴리 바지", "트레이닝 바지", "조거팬츠"] },
  { hsCode: "6211430000", keywords: ["합성섬유 운동복", "트레이닝", "운동복", "스포츠웨어", "레깅스"] },
  { hsCode: "6108210000", keywords: ["면 잠옷", "파자마", "잠옷", "홈웨어"] },
  { hsCode: "6106100000", keywords: ["면 블라우스", "블라우스", "셔츠", "여성 셔츠"] },
  { hsCode: "6205200000", keywords: ["면 남성 셔츠", "남방", "와이셔츠"] },
  { hsCode: "6201130000", keywords: ["합성섬유 코트", "패딩", "겨울 자켓", "점퍼", "패딩자켓"] },
  { hsCode: "6212100000", keywords: ["브래지어", "속옷 상의", "여성 내의"] },
  { hsCode: "6115960000", keywords: ["면 양말", "양말", "短袜", "발목양말"] },
  { hsCode: "6217100000", keywords: ["의류부속품", "넥타이", "스카프", "머플러", "손수건"] },
  { hsCode: "6116100000", keywords: ["장갑", "합성섬유 장갑", "手套", "니트 장갑"] },
  { hsCode: "6505000000", keywords: ["모자", "캡", "비니", "帽子", "버킷햇", "야구모자", "볼캡"] },
  { hsCode: "6401100000", keywords: ["방수 신발", "레인부츠", "장화"] },
  { hsCode: "6402990000", keywords: ["운동화", "스니커즈", "캐주얼화", "运动鞋", "런닝화"] },
  { hsCode: "6403990000", keywords: ["가죽 신발", "구두", "皮鞋", "로퍼"] },
  { hsCode: "6404190000", keywords: ["슬리퍼", "샌들", "拖鞋", "凉鞋"] },
  { hsCode: "4202120000", keywords: ["핸드백", "가방", "숄더백", "手提包", "包包", "토트백", "크로스백"] },
  { hsCode: "4202220000", keywords: ["지갑", "카드지갑", "钱包", "장지갑"] },
  { hsCode: "4202920000", keywords: ["여행가방", "캐리어", "백팩", "배낭", "旅行包", "背包"] },
  { hsCode: "3304100000", keywords: ["립스틱", "립밤", "립글로스", "口红"] },
  { hsCode: "3304200000", keywords: ["눈화장품", "아이섀도", "마스카라", "아이라이너"] },
  { hsCode: "3304910000", keywords: ["파우더", "파운데이션", "BB크림", "粉底"] },
  { hsCode: "3304990000", keywords: ["화장품", "스킨케어", "로션", "크림", "세안", "미용", "化妆品", "에센스", "토너"] },
  { hsCode: "3305100000", keywords: ["샴푸", "洗发水", "린스", "트리트먼트"] },
  { hsCode: "3401110000", keywords: ["비누", "세안비누", "香皂", "클렌징바"] },
  { hsCode: "3924100000", keywords: ["플라스틱 식기", "컵", "그릇", "식판", "도시락통", "밀폐용기"] },
  { hsCode: "6911100000", keywords: ["도자기 그릇", "세라믹", "陶瓷", "머그컵", "도자기컵"] },
  { hsCode: "7013490000", keywords: ["유리그릇", "유리컵", "玻璃杯", "유리 텀블러"] },
  { hsCode: "7323930000", keywords: ["스테인리스 주방용품", "냄비", "프라이팬", "不锈钢"] },
  { hsCode: "6302100000", keywords: ["침구", "이불", "베개커버", "침대커버", "床单", "被套"] },
  { hsCode: "6303920000", keywords: ["샤워커튼", "욕실커튼", "浴帘", "욕실"] },
  { hsCode: "6304920000", keywords: ["커튼", "블라인드", "인테리어패브릭", "창문커튼", "窗帘"] },
  { hsCode: "9405400000", keywords: ["LED등", "조명", "전구", "LED灯", "스탠드", "무드등"] },
  { hsCode: "9503000000", keywords: ["완구", "장난감", "퍼즐", "인형", "블록", "玩具", "피규어", "봉제인형"] },
  { hsCode: "9506990000", keywords: ["스포츠용품", "운동기구", "헬스", "피트니스용품"] },
  { hsCode: "8414510000", keywords: ["선풍기", "서큘레이터", "电风扇"] },
  { hsCode: "8509400000", keywords: ["믹서기", "블렌더", "榨汁机", "주서기"] },
  { hsCode: "8516500000", keywords: ["전자레인지", "오븐", "微波炉", "에어프라이어"] },
  { hsCode: "8516600000", keywords: ["전기밥솥", "电饭锅"] },
  { hsCode: "8516790000", keywords: ["헤어드라이어", "고데기", "电吹风", "드라이기"] },
  { hsCode: "8517120000", keywords: ["스마트폰", "휴대폰", "핸드폰", "手机"] },
  { hsCode: "8518300000", keywords: ["헤드폰", "이어폰", "무선 이어폰", "耳机"] },
  { hsCode: "8504400000", keywords: ["충전기", "어댑터", "보조배터리", "充电器", "무선충전기"] },
  { hsCode: "8544420000", keywords: ["충전케이블", "USB케이블", "C타입케이블", "数据线"] },
  { hsCode: "9401800000", keywords: ["의자", "折叠椅", "폴딩 의자", "캠핑의자"] },
  { hsCode: "9403600000", keywords: ["목재 가구", "나무 선반", "책장", "서랍장", "木制家具", "수납장"] },
  { hsCode: "3926300000", keywords: ["플라스틱 생활용품", "수납박스", "바구니", "收纳盒", "정리함"] },
  { hsCode: "7117190000", keywords: ["패션주얼리", "귀걸이", "목걸이", "팔찌", "时尚饰品", "반지"] },
  { hsCode: "9615190000", keywords: ["헤어핀", "헤어밴드", "머리핀", "머리띠", "头饰"] },
  { hsCode: "9004100000", keywords: ["선글라스", "太阳镜", "자외선 차단 안경"] },
  { hsCode: "9601910000", keywords: ["공예품", "인테리어소품", "장식품", "工艺品", "오브제"] },
  { hsCode: "6601910000", keywords: ["우산", "雨伞", "장우산", "접이식우산", "양산"] },
  { hsCode: "4820100000", keywords: ["노트", "다이어리", "笔记本", "스케치북"] },
  { hsCode: "9608100000", keywords: ["볼펜", "펜", "圆珠笔", "사인펜"] },
  { hsCode: "6302600000", keywords: ["수건", "타월", "毛巾", "목욕 타월"] },
  { hsCode: "9102110000", keywords: ["손목시계", "腕表", "시계"] },
  { hsCode: "9105110000", keywords: ["벽시계", "挂钟", "인테리어 시계"] },
  { hsCode: "8543700000", keywords: ["마사지기", "안마기", "按摩仪", "진동마사지기"] },
  { hsCode: "3926909000", keywords: ["욕실 소품", "비누 받침대", "칫솔 홀더", "浴室用品", "플라스틱 잡화"] },
  { hsCode: "6307900000", keywords: ["마스크", "부직포 마스크", "생활마스크"] },
];

function searchLocal(query: string): { hsCode: string; description: string }[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const exact: typeof HS_DB = [];
  const partial: typeof HS_DB = [];
  for (const item of HS_DB) {
    const exactMatch = item.keywords.some((kw) => kw.toLowerCase() === q) || item.hsCode === q;
    const partialMatch = item.keywords.some((kw) => kw.toLowerCase().includes(q) || q.includes(kw.toLowerCase())) || item.hsCode.includes(q);
    if (exactMatch) exact.push(item);
    else if (partialMatch) partial.push(item);
  }
  return [...exact, ...partial].slice(0, 5).map((item) => ({ hsCode: item.hsCode, description: item.keywords[0] }));
}

// ── 유니패스 API018: HS부호검색 ─────────────────────────────
async function searchUnipassHS(query: string): Promise<{ hsCode: string; description: string }[]> {
  const key = process.env.UNIPASS_HS_KEY;
  if (!key) return [];
  try {
    // 텍스트 검색
    const url = `https://unipass.customs.go.kr:38010/ext/rest/hsSgnQry/retrieveHsSgnList?crkyCn=${key}&hsSgQryTxt=${encodeURIComponent(query)}&numOfRows=5&pageNo=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const xml = await res.text();
    const items: { hsCode: string; description: string }[] = [];
    const blocks = xml.matchAll(/<ntceInfo>([\s\S]*?)<\/ntceInfo>/g);
    for (const block of blocks) {
      const content = block[1];
      const hsCode = content.match(/<hsCd>(.*?)<\/hsCd>/)?.[1]?.trim() ?? "";
      const desc   = content.match(/<hsSgNm>(.*?)<\/hsSgNm>/)?.[1]?.trim() ?? "";
      if (hsCode) items.push({ hsCode: hsCode.padEnd(10, "0").slice(0, 10), description: desc });
    }
    return items;
  } catch {
    return [];
  }
}

// ── AI 검색 (fallback) ───────────────────────────────────────
async function searchWithAI(query: string): Promise<{ hsCode: string; description: string; reason: string }[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `한국 수입 무역상이 주로 중국·일본에서 수입하는 상품입니다. 상품명: "${query}"

이 상품에 해당할 수 있는 한국 HS코드(10자리)를 2~4개 제안해주세요.
재질이나 용도에 따라 코드가 다를 수 있으면 모두 포함해주세요.

반드시 아래 JSON 배열 형식으로만 답하세요. 다른 텍스트는 절대 포함하지 마세요:
[{"hsCode":"1234567890","description":"품목 설명 20자 이내","reason":"선택 이유 30자 이내"}]`,
    }],
  });
  const text = (message.content[0] as { type: string; text: string }).text.trim();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.map((item: { hsCode: string; description: string; reason: string }) => ({
    hsCode: String(item.hsCode).replace(/[^0-9]/g, "").padEnd(10, "0").slice(0, 10),
    description: item.description,
    reason: item.reason,
  }));
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";
  if (!query.trim()) return NextResponse.json({ items: [], source: "empty" });

  // 1순위: 유니패스 공식 API (API018) — AI 아님, 횟수 차감 없음
  const unipassItems = await searchUnipassHS(query);
  if (unipassItems.length > 0) {
    return NextResponse.json({
      items: unipassItems.map(i => ({ ...i, fta: getFtaRates(i.hsCode) })),
      source: "unipass",
      sourceLabel: "관세청 공식",
    });
  }

  // 2순위: 로컬 DB — AI 아님, 횟수 차감 없음
  const localItems = searchLocal(query);
  if (localItems.length > 0) {
    return NextResponse.json({
      items: localItems.map(i => ({ ...i, fta: getFtaRates(i.hsCode) })),
      source: "local-db",
      sourceLabel: "내부 DB",
    });
  }

  // 3순위: AI — 일일 횟수 차감
  if (process.env.ANTHROPIC_API_KEY && query.trim()) {
    // 인증 확인
    const { getAuthTenantId } = await import("@/lib/getAuth");
    const { checkAndIncrementAiUsage, PLANS, getTenantPlan } = await import("@/lib/subscription");

    const auth = await getAuthTenantId();
    if (!(auth instanceof NextResponse)) {
      const { tenantId } = auth;
      const { allowed, used, limit } = await checkAndIncrementAiUsage(tenantId);
      if (!allowed) {
        const plan = await getTenantPlan(tenantId);
        const nextPlan = plan === "free" ? "맛보기(일 100회)" : "Pro(무제한)";
        return NextResponse.json(
          {
            error: `오늘 AI 분석 횟수(${limit}회)를 모두 사용했습니다. ${nextPlan} 플랜으로 업그레이드하세요.`,
            code: "AI_LIMIT",
            used,
            limit,
            planName: PLANS[plan].name,
          },
          { status: 429 }
        );
      }
    }

    try {
      const aiItems = await searchWithAI(query);
      if (aiItems.length > 0) {
        return NextResponse.json({
          items: aiItems.map(i => ({ ...i, fta: getFtaRates(i.hsCode) })),
          source: "ai",
          sourceLabel: "AI 추정",
          aiNote: "AI 추정 결과입니다. 관세청에서 최종 확인을 권장합니다",
        });
      }
    } catch { /* ignore */ }
  }

  return NextResponse.json({ items: [], source: "not-found" });
}
