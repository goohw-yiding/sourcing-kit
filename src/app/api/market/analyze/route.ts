import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAuthTenantId } from "@/lib/getAuth";
import { checkAndIncrementAiUsage, PLANS, getTenantPlan } from "@/lib/subscription";

export const maxDuration = 60;

export interface NaverShopItem {
  title: string;
  link: string;
  image: string;
  lprice: string;
  hprice: string;
  mallName: string;
  category1: string;
  category2: string;
}

export interface MarketAnalysis {
  productNameKr: string;
  productNameCn: string;
  category: string;
  features: string[];
  hsCodeHint: string;
  hsCode: string;
  customsRateKr: number;
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
  searchLinks: {
    naver: string;
    coupang: string;
    elevenst: string;
  };
}

async function analyzeImageWithAI(imageBase64: string, mimeType: string): Promise<{
  productNameKr: string;
  productNameCn: string;
  category: string;
  features: string[];
  hsCodeHint: string;
  hsCode: string;
  customsRateKr: number;
  searchKeyword: string;
  competitionLevel: "낮음" | "보통" | "높음";
  trend: "상승" | "보합" | "하락";
  recommendKeywords: string[];
  aiComment: string;
  recommendation: "추천" | "검토필요" | "비추천";
  recommendReason: string;
  kcRequired: string;
  marginEstimate: string;
}> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1200,
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: mimeType as "image/jpeg" | "image/png" | "image/webp", data: imageBase64 },
        },
        {
          type: "text",
          text: `이 사진은 중국 이우시장에서 찍은 상품 사진입니다. 한국 무역 소싱 담당자를 위한 시장조사 리포트를 작성해주세요.

반드시 아래 JSON 형식으로만 답하세요:
{
  "productNameKr": "한국어 상품명 (구체적으로)",
  "productNameCn": "중국어 상품명",
  "category": "카테고리 (예: 주방용품, 완구, 의류)",
  "features": ["특징1", "특징2", "특징3"],
  "hsCodeHint": "예상 HS코드 앞 6자리",
  "hsCode": "한국 수입 HS코드 10자리 (예: 6217109000). 확실하지 않으면 가장 근접한 코드 제시",
  "customsRateKr": 한국 기본관세율 숫자만 (예: 13 → 13%). 해당 HS코드 기준 정확한 세율,
  "searchKeyword": "네이버쇼핑 검색용 키워드 (짧고 명확하게)",
  "competitionLevel": "낮음 또는 보통 또는 높음",
  "trend": "상승 또는 보합 또는 하락",
  "recommendKeywords": ["판매시 사용할 키워드1", "키워드2", "키워드3"],
  "aiComment": "한국 시장에서 이 상품의 소싱 가능성, 경쟁 상황, 주의사항을 2~3문장으로",
  "recommendation": "추천 또는 검토필요 또는 비추천",
  "recommendReason": "추천/비추천 이유 1문장",
  "kcRequired": "KC인증 필요 여부와 종류 (예: KC 안전확인 필수, 불필요 등)",
  "marginEstimate": "예상 마진율 (예: 50~70%)"
}`,
        },
      ],
    }],
  });

  const text = (msg.content[0] as { type: string; text: string }).text.trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI 응답 파싱 실패");
  return JSON.parse(match[0]);
}

async function analyzeTextWithAI(productName: string): Promise<{
  productNameKr: string;
  productNameCn: string;
  category: string;
  features: string[];
  hsCodeHint: string;
  hsCode: string;
  customsRateKr: number;
  searchKeyword: string;
  competitionLevel: "낮음" | "보통" | "높음";
  trend: "상승" | "보합" | "하락";
  recommendKeywords: string[];
  aiComment: string;
  recommendation: "추천" | "검토필요" | "비추천";
  recommendReason: string;
  kcRequired: string;
  marginEstimate: string;
}> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    messages: [{
      role: "user",
      content: `중국 이우시장에서 소싱하려는 상품: "${productName}"
한국 무역 소싱 담당자를 위한 시장조사 리포트를 작성해주세요.

반드시 아래 JSON 형식으로만 답하세요:
{
  "productNameKr": "한국어 상품명",
  "productNameCn": "중국어 상품명",
  "category": "카테고리",
  "features": ["특징1", "특징2", "특징3"],
  "hsCodeHint": "예상 HS코드 앞 6자리",
  "hsCode": "한국 수입 HS코드 10자리 (예: 6217109000)",
  "customsRateKr": 한국 기본관세율 숫자만 (예: 13),
  "searchKeyword": "네이버쇼핑 검색용 키워드",
  "competitionLevel": "낮음 또는 보통 또는 높음",
  "trend": "상승 또는 보합 또는 하락",
  "recommendKeywords": ["키워드1", "키워드2", "키워드3"],
  "aiComment": "한국 시장 소싱 가능성, 경쟁 상황, 주의사항 2~3문장",
  "recommendation": "추천 또는 검토필요 또는 비추천",
  "recommendReason": "이유 1문장",
  "kcRequired": "KC인증 필요 여부",
  "marginEstimate": "예상 마진율"
}`,
    }],
  });

  const text = (msg.content[0] as { type: string; text: string }).text.trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI 응답 파싱 실패");
  return JSON.parse(match[0]);
}

async function searchNaverShopping(keyword: string): Promise<NaverShopItem[]> {
  const id = process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) return [];

  try {
    const res = await fetch(
      `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(keyword)}&display=10&sort=sim`,
      {
        headers: {
          "X-Naver-Client-Id": id,
          "X-Naver-Client-Secret": secret,
        },
        next: { revalidate: 0 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map((item: NaverShopItem) => ({
      ...item,
      title: item.title.replace(/<[^>]*>/g, ""), // HTML 태그 제거
    }));
  } catch {
    return [];
  }
}

function calcPriceStats(items: NaverShopItem[]) {
  const prices = items
    .map(i => parseInt(i.lprice))
    .filter(p => p > 0);
  if (prices.length === 0) return { lowest: 0, highest: 0, avg: 0 };
  return {
    lowest: Math.min(...prices),
    highest: Math.max(...prices),
    avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
  };
}

export async function POST(req: NextRequest) {
  try {
    // ── 인증 확인 ──────────────────────────────────────────────
    const auth = await getAuthTenantId();
    if (auth instanceof NextResponse) return auth;
    const { tenantId } = auth;

    // ── 일일 AI 분석 횟수 체크 ─────────────────────────────────
    const { allowed, used, limit } = await checkAndIncrementAiUsage(tenantId);
    if (!allowed) {
      const plan = await getTenantPlan(tenantId);
      const planName = PLANS[plan].name;
      const nextPlan = plan === "free" ? "맛보기(일 20회)" : "Pro(무제한)";
      return NextResponse.json(
        {
          error: `오늘 AI 분석 횟수(${limit}회)를 모두 사용했습니다. ${nextPlan} 플랜으로 업그레이드하면 더 많이 분석할 수 있어요.`,
          code: "AI_LIMIT",
          used,
          limit,
          plan: planName,
        },
        { status: 429 }
      );
    }
    // ──────────────────────────────────────────────────────────

    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const productName = formData.get("productName") as string | null;

    if (!image && !productName) {
      return NextResponse.json({ error: "이미지 또는 상품명 필요" }, { status: 400 });
    }

    // AI 분석
    let aiResult;
    if (image) {
      const bytes = await image.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      const mimeType = image.type || "image/jpeg";
      aiResult = await analyzeImageWithAI(base64, mimeType);
    } else {
      aiResult = await analyzeTextWithAI(productName!);
    }

    // 네이버 쇼핑 검색
    const naverItems = await searchNaverShopping(aiResult.searchKeyword);
    const { lowest, highest, avg } = calcPriceStats(naverItems);

    const result: MarketAnalysis = {
      ...aiResult,
      customsRateKr: Number(aiResult.customsRateKr) || 8,
      naverItems: naverItems.slice(0, 6),
      lowestPrice: lowest,
      highestPrice: highest,
      avgPrice: avg,
      sourcingPriceEstimate: lowest > 0
        ? `${Math.round(lowest * 0.2).toLocaleString()}~${Math.round(lowest * 0.35).toLocaleString()}원 추정`
        : "네이버 데이터 없음",
      searchLinks: {
        naver: `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(aiResult.searchKeyword)}`,
        coupang: `https://www.coupang.com/np/search?q=${encodeURIComponent(aiResult.searchKeyword)}`,
        elevenst: `https://www.11st.co.kr/search/Search.tmall?kwd=${encodeURIComponent(aiResult.searchKeyword)}`,
      },
    };

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "분석 실패" }, { status: 500 });
  }
}
