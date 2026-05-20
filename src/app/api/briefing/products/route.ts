import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export interface YiwuProductItem {
  category: string;
  emoji: string;
  items: string[];
  trend: "up" | "stable" | "new";
  tip: string;
}

export interface YiwuProductsResponse {
  products: YiwuProductItem[];
  season: string;
  generatedAt: string;
}

function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "봄 (spring)";
  if (month >= 6 && month <= 8) return "여름 (summer)";
  if (month >= 9 && month <= 11) return "가을 (autumn)";
  return "겨울 (winter)";
}

function getUpcomingHolidays(): string {
  const month = new Date().getMonth() + 1;
  const holidays: Record<number, string> = {
    1: "춘절 (Spring Festival) 준비",
    2: "발렌타인데이 시즌",
    3: "화이트데이, 봄 신상품",
    4: "아동의날 준비, 봄 완구",
    5: "어버이날, 졸업 시즌",
    6: "아동의날, 여름 상품",
    7: "여름 해변, 리조트 상품",
    8: "추석 준비 시작",
    9: "국경절(중국), 추석 상품",
    10: "국경절 이후 신상품, 연말 준비",
    11: "광군절, 크리스마스 준비",
    12: "크리스마스, 연말 선물 시즌",
  };
  return holidays[month] || "계절 신상품";
}

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured" }, { status: 500 });
  }

  const season = getCurrentSeason();
  const holidays = getUpcomingHolidays();
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();

  const client = new Anthropic({ apiKey });

  const prompt = `당신은 중국 이우(义乌) 도매 시장 전문가입니다.
현재 ${year}년 ${month}월 (${season})이며, 현재 이슈: ${holidays}

이우 시장에서 지금 주목받는 신상품 카테고리 4~5개를 JSON 형식으로 알려주세요.
각 카테고리별 구체적인 상품 예시 3개와 무역 바이어를 위한 실용적인 팁을 포함해주세요.

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "products": [
    {
      "category": "카테고리명 (한국어)",
      "emoji": "이모지 1개",
      "items": ["상품1", "상품2", "상품3"],
      "trend": "up" 또는 "stable" 또는 "new",
      "tip": "바이어를 위한 실용적인 소싱 팁 (한 문장, 한국어)"
    }
  ],
  "season": "${season}"
}`;

  try {
    const message = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // JSON 파싱
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid JSON response");

    const parsed = JSON.parse(jsonMatch[0]) as { products: YiwuProductItem[]; season: string };

    return NextResponse.json({
      products: parsed.products,
      season: parsed.season,
      generatedAt: new Date().toISOString(),
    } as YiwuProductsResponse, {
      headers: { "Cache-Control": "public, s-maxage=14400, stale-while-revalidate=28800" }, // 4시간 캐시
    });
  } catch (err) {
    console.error("[briefing/products]", err);

    // fallback 데이터
    const fallback: YiwuProductsResponse = {
      season,
      generatedAt: new Date().toISOString(),
      products: [
        {
          category: "생활잡화",
          emoji: "🏠",
          items: ["실리콘 주방용품", "수납 오거나이저", "멀티 충전 거치대"],
          trend: "up",
          tip: "최소 주문 수량(MOQ) 협상 시 500개 이상이면 가격 협상 여지 있음",
        },
        {
          category: "계절 상품",
          emoji: "🌸",
          items: ["UV 차단 양산", "냉감 쿨링 타월", "접이식 부채"],
          trend: "new",
          tip: "시즌 2~3개월 전 발주가 원칙, 지금이 적기",
        },
        {
          category: "완구·문구",
          emoji: "🧸",
          items: ["팝잇 피저 완구", "미니어처 하우스 DIY", "형광 마커 세트"],
          trend: "stable",
          tip: "KC 인증 여부 반드시 확인, 없는 경우 인증 비용 포함 원가 계산 필수",
        },
        {
          category: "패션 액세서리",
          emoji: "💍",
          items: ["스테인리스 귀걸이", "비즈 팔찌 세트", "레트로 머리띠"],
          trend: "up",
          tip: "트렌드 사이클이 빠르므로 소량 테스트 후 추가 발주 전략 권장",
        },
      ],
    };

    return NextResponse.json(fallback);
  }
}
