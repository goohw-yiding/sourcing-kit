import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text) return NextResponse.json({ cn: "" });

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 60,
      messages: [{
        role: "user",
        content: `아래 한국어를 1688.com 검색에 최적화된 중국어 간체로 번역해줘. 번역 결과만 출력해. 설명 없이.\n"${text}"`,
      }],
    });
    const cn = ((msg.content[0] as { text: string }).text || "").trim();
    return NextResponse.json({ cn });
  } catch {
    return NextResponse.json({ cn: "" }, { status: 500 });
  }
}
