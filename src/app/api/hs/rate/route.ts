import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const HS_RATES: Record<string, { rate: number; desc: string; notes: string; fta?: number }> = {
  "6110200000": { rate: 0.13, fta: 0.045, desc: "면 스웨터·풀오버", notes: "한-중 FTA 원산지증명(C/O) 시 4.5%" },
  "6110300000": { rate: 0.13, fta: 0.045, desc: "합성섬유 스웨터", notes: "한-중 FTA 적용 가능. C/O 필요" },
  "6109100000": { rate: 0.13, fta: 0.045, desc: "면 티셔츠", notes: "한-중 FTA 원산지증명 시 세율 인하" },
  "6104430000": { rate: 0.13, fta: 0.045, desc: "합성섬유 원피스", notes: "한-중 FTA 적용 가능" },
  "6203420000": { rate: 0.13, fta: 0.045, desc: "면 바지·슬랙스", notes: "한-중 FTA 적용 가능. C/O 필요" },
  "6211430000": { rate: 0.13, fta: 0.045, desc: "합성섬유 운동복", notes: "KC 인증 불필요. 한-중 FTA 적용 가능" },
  "6217100000": { rate: 0.13, fta: 0.06, desc: "의류 부속품", notes: "한-중 FTA 적용 가능" },
  "6116100000": { rate: 0.13, fta: 0.0, desc: "합성섬유 장갑", notes: "한-중 FTA 원산지증명 시 무관세" },
  "6505000000": { rate: 0.08, fta: 0.0, desc: "모자류", notes: "한-중 FTA 적용 시 무관세" },
  "6401100000": { rate: 0.13, desc: "방수 신발", notes: "안전확인 대상 아님" },
  "6402990000": { rate: 0.13, fta: 0.06, desc: "운동화·캐주얼화", notes: "한-중 FTA 적용 가능" },
  "6403990000": { rate: 0.13, fta: 0.06, desc: "가죽 신발·구두", notes: "한-중 FTA 적용 가능" },
  "9503000000": { rate: 0.0, desc: "완구·퍼즐류", notes: "⚠️ KC 안전인증 필수 (어린이제품 안전관리법)" },
  "9504500000": { rate: 0.0, desc: "비디오게임기", notes: "전파인증 필요" },
  "9506990000": { rate: 0.08, desc: "스포츠용품", notes: "일부 품목 KC 안전인증 필요" },
  "3304100000": { rate: 0.065, desc: "립스틱류", notes: "⚠️ 화장품 수입신고 필수 (식약처 보고)" },
  "3304200000": { rate: 0.065, desc: "눈 화장품", notes: "⚠️ 화장품 수입신고 필수 (식약처 보고)" },
  "3304910000": { rate: 0.065, desc: "파우더·파운데이션", notes: "⚠️ 화장품법 수입신고 필수" },
  "3304990000": { rate: 0.065, desc: "기타 미용·세안용품", notes: "⚠️ 화장품 수입신고 필수. 기능성 화장품은 허가 별도" },
  "3305100000": { rate: 0.065, desc: "샴푸", notes: "⚠️ 화장품 수입신고 필수" },
  "3401110000": { rate: 0.0, desc: "세안·목욕 비누", notes: "KC 인증 불필요" },
  "3924100000": { rate: 0.08, desc: "플라스틱 식기류", notes: "식품용 기구·용기는 식약처 기준 적합 확인 필요" },
  "3926300000": { rate: 0.08, desc: "플라스틱 생활용품", notes: "KC 인증 불필요 (일부 예외)" },
  "4202110000": { rate: 0.08, desc: "가죽 서류가방", notes: "KC 인증 불필요" },
  "4202120000": { rate: 0.08, desc: "핸드백·숄더백", notes: "KC 인증 불필요. 가죽 제품 원산지 확인" },
  "4202220000": { rate: 0.08, desc: "지갑·카드지갑", notes: "KC 인증 불필요" },
  "4202920000": { rate: 0.08, desc: "여행가방·배낭", notes: "KC 인증 불필요" },
  "6302100000": { rate: 0.13, fta: 0.06, desc: "침구·이불·베개커버", notes: "한-중 FTA 적용 가능" },
  "6304920000": { rate: 0.13, desc: "커튼·인테리어 패브릭", notes: "KC 인증 불필요" },
  "6911100000": { rate: 0.08, desc: "도자기 그릇", notes: "식품용 도자기는 식약처 기준 확인" },
  "7013490000": { rate: 0.08, desc: "유리그릇·유리컵", notes: "식품용 유리는 식약처 기준 확인" },
  "7323930000": { rate: 0.0, desc: "스테인리스 주방용품", notes: "식품용은 식약처 기준 확인" },
  "8414510000": { rate: 0.0, desc: "가정용 선풍기", notes: "⚠️ KC 전기용품 안전인증 필수" },
  "8509400000": { rate: 0.0, desc: "믹서기·블렌더", notes: "⚠️ KC 전기용품 안전인증 필수" },
  "8516500000": { rate: 0.0, desc: "전자레인지·오븐", notes: "⚠️ KC 전기용품 안전인증 필수" },
  "8516600000": { rate: 0.0, desc: "전기밥솥", notes: "⚠️ KC 전기용품 안전인증 필수" },
  "8516790000": { rate: 0.0, desc: "헤어드라이어·고데기", notes: "⚠️ KC 전기용품 안전인증 필수" },
  "8517120000": { rate: 0.0, desc: "스마트폰·휴대폰", notes: "⚠️ 전파인증 + KC 안전인증 필수" },
  "8518300000": { rate: 0.0, desc: "헤드폰·이어폰", notes: "⚠️ KC 전기용품 안전인증 필수" },
  "8523510000": { rate: 0.0, desc: "USB메모리", notes: "전파인증 필요할 수 있음" },
  "8544420000": { rate: 0.0, desc: "충전케이블·USB케이블", notes: "⚠️ KC 전기용품 안전인증 필수" },
  "8504400000": { rate: 0.0, desc: "충전기·보조배터리", notes: "⚠️ KC 전기용품 안전인증 필수" },
  "9401800000": { rate: 0.0, desc: "의자류", notes: "KC 인증 불필요 (일부 아동용 제외)" },
  "9403600000": { rate: 0.0, desc: "목제 가구", notes: "KC 인증 불필요" },
  "9405400000": { rate: 0.0, desc: "LED 조명기구", notes: "⚠️ KC 전기용품 안전인증 필수" },
  "7117190000": { rate: 0.08, desc: "패션주얼리·액세서리", notes: "KC 인증 불필요 (어린이용은 예외)" },
  "9601910000": { rate: 0.0, desc: "공예품·인테리어 소품", notes: "KC 인증 불필요" },
  "3926909000": { rate: 0.08, desc: "기타 플라스틱 제품", notes: "용도에 따라 KC 인증 필요할 수 있음" },
  "6307900000": { rate: 0.13, desc: "마스크·부직포 제품", notes: "의료용 마스크는 별도 허가 필요" },
};

interface RegulationInfo {
  kcRequired: "필수" | "불필요" | "조건부" | "확인필요";
  laws: string[];
  certType?: string;
  testAgencies?: string[];
  estimatedCost?: string;
  estimatedDays?: string;
  fdaRequired?: boolean;
  etcNotes?: string[];
}

async function getAIRegulations(hsCode: string, description: string): Promise<RegulationInfo | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{
        role: "user",
        content: `한국으로 수입하는 상품입니다.
HS코드: ${hsCode}
품목: ${description}

이 상품을 중국에서 한국으로 수입할 때 필요한 인증/검사/신고 요건을 알려주세요.

반드시 아래 JSON 형식으로만 답하세요:
{
  "kcRequired": "필수" | "불필요" | "조건부" | "확인필요",
  "laws": ["관련 법령명 1", "관련 법령명 2"],
  "certType": "안전확인|자체확인|공급자적합성확인|해당없음",
  "testAgencies": ["KTL", "KTC", "KOTITI", "FITI" 등 해당되는 것만],
  "estimatedCost": "예: 50~150만원",
  "estimatedDays": "예: 2~4주",
  "fdaRequired": false,
  "etcNotes": ["추가 주의사항 1", "추가 주의사항 2"]
}`,
      }],
    });
    const text = (msg.content[0] as { type: string; text: string }).text.trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as RegulationInfo;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const hsCode = req.nextUrl.searchParams.get("hs") || "";
  const productName = req.nextUrl.searchParams.get("name") || "";

  // 로컬 DB 먼저
  const item = HS_RATES[hsCode];

  // AI로 상세 규제 정보 가져오기
  const desc = item?.desc || productName || hsCode;
  const aiRegs = await getAIRegulations(hsCode, desc);

  if (item) {
    return NextResponse.json({
      hsCode,
      rate: item.rate,
      ftaRate: item.fta,
      description: item.desc,
      importNotes: item.notes,
      regulations: aiRegs,
      source: "local-db",
    });
  }

  return NextResponse.json({
    hsCode,
    rate: 0.08,
    description: productName || "기본 관세율 적용 (정확한 세율은 관세청 확인 필요)",
    importNotes: "품목 특성에 따라 KC인증, 식약처 신고 등이 필요할 수 있습니다.",
    regulations: aiRegs,
    source: "default",
  });
}
