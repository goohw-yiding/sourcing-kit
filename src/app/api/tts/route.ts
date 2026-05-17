import { NextRequest, NextResponse } from "next/server";

// GET /api/tts?text=你好&lang=zh-CN
// Google Translate TTS 서버 프록시 — 클라이언트 CORS 우회
export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text") ?? "";
  const lang = req.nextUrl.searchParams.get("lang") ?? "zh-CN";

  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

  // Google Translate 비공개 TTS 엔드포인트
  const ttsUrl =
    `https://translate.googleapis.com/translate_tts` +
    `?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=gtx&ttsspeed=0.8`;

  try {
    const res = await fetch(ttsUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36",
        Referer: "https://translate.google.com/",
        "Accept-Language": "zh-CN,zh;q=0.9",
      },
    });

    if (!res.ok) throw new Error(`Google TTS returned ${res.status}`);

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("[TTS] Google TTS error:", err);
    return NextResponse.json({ error: "TTS failed" }, { status: 502 });
  }
}
