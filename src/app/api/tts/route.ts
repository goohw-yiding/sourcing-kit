import { NextRequest, NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

// GET /api/tts?text=你好&lang=zh-CN
// Microsoft Edge TTS — 고품질 중국어 음성 (XiaoxiaoNeural)
export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text") ?? "";
  const lang = req.nextUrl.searchParams.get("lang") ?? "zh-CN";

  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

  // 언어별 최적 음성 선택
  const voiceMap: Record<string, string> = {
    "zh-CN": "zh-CN-XiaoxiaoNeural",  // 중국어 여성 (자연스럽고 명확)
    "zh-TW": "zh-TW-HsiaoChenNeural",
    "ko-KR": "ko-KR-SunHiNeural",
    "en-US": "en-US-JennyNeural",
  };
  const voice = voiceMap[lang] ?? "zh-CN-XiaoxiaoNeural";

  // 1차: Microsoft Edge TTS (고품질, 무료)
  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      const readable = tts.toStream(text);
      readable.on("data", (chunk: Buffer) => chunks.push(chunk));
      readable.on("end", resolve);
      readable.on("error", reject);
    });

    const buffer = Buffer.concat(chunks);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (edgeErr) {
    console.warn("[TTS] Edge TTS 실패, Google TTS 시도:", edgeErr);
  }

  // 2차 폴백: Google Translate TTS
  try {
    const ttsUrl =
      `https://translate.googleapis.com/translate_tts` +
      `?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=gtx&ttsspeed=0.8`;

    const res = await fetch(ttsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://translate.google.com/",
      },
    });

    if (!res.ok) throw new Error(`Google TTS ${res.status}`);
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (googleErr) {
    console.error("[TTS] 모든 TTS 실패:", googleErr);
    return NextResponse.json({ error: "TTS failed" }, { status: 502 });
  }
}
