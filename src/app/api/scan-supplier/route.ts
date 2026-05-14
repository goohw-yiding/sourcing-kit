import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 503 });
  }

  const { imageBase64, mimeType = "image/jpeg" } = await req.json();
  if (!imageBase64) {
    return NextResponse.json({ error: "imageBase64 required" }, { status: 400 });
  }

  const prompt = `이 이미지는 중국 이우시장의 가게 간판 또는 명함입니다.
이미지에서 다음 정보를 추출해서 반드시 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "name": "가게/회사 이름 (한자 또는 한글)",
  "phone": "전화번호 (없으면 null)",
  "wechatId": "위챗 ID (없으면 null)",
  "address": "주소 또는 위치 (없으면 null)",
  "marketArea": "시장 구역 (예: A区 3栋 201号, 없으면 null)",
  "category": "주요 취급 품목 (간단히, 없으면 null)",
  "url1688": "1688.com URL (없으면 null)"
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mimeType, data: imageBase64 } },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || "{}";

  try {
    const extracted = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    return NextResponse.json(extracted);
  } catch {
    return NextResponse.json({ raw: text }, { status: 200 });
  }
}
