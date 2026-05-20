import { NextRequest, NextResponse } from "next/server";

// GET /api/tts?text=你好&lang=zh-CN
export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text") ?? "";
  const lang = req.nextUrl.searchParams.get("lang") ?? "zh-CN";

  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

  // 1차: Microsoft Edge TTS (무료, 고품질) — 8초 타임아웃
  try {
    const { MsEdgeTTS, OUTPUT_FORMAT } = await import("msedge-tts");

    const voiceMap: Record<string, string> = {
      "zh-CN": "zh-CN-XiaoxiaoNeural",
      "zh-TW": "zh-TW-HsiaoChenNeural",
      "ko-KR": "ko-KR-SunHiNeural",
      "en-US": "en-US-JennyNeural",
    };
    const voice = voiceMap[lang] ?? "zh-CN-XiaoxiaoNeural";

    const buffer = await Promise.race<Buffer>([
      (async () => {
        const tts = new MsEdgeTTS();
        await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
        const chunks: Buffer[] = [];
        await new Promise<void>((resolve, reject) => {
          const { audioStream } = tts.toStream(text);
          audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
          audioStream.on("end", resolve);
          audioStream.on("error", reject);
        });
        return Buffer.concat(chunks);
      })(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("edge-tts timeout")), 8000)
      ),
    ]);

    if (buffer.length > 0) {
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=86400",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  } catch (edgeErr) {
    console.warn("[TTS] Edge TTS 실패:", edgeErr);
  }

  // 2차 폴백: Google Translate TTS — 5초 타임아웃
  try {
    const ttsUrl =
      `https://translate.googleapis.com/translate_tts` +
      `?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=gtx&ttsspeed=0.9`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(ttsUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Referer: "https://translate.google.com/",
        Accept: "audio/mpeg, audio/*, */*",
      },
    });
    clearTimeout(timer);

    if (res.ok) {
      const buffer = await res.arrayBuffer();
      if (buffer.byteLength > 0) {
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    }
    throw new Error(`Google TTS ${res.status}`);
  } catch (googleErr) {
    console.error("[TTS] Google TTS 실패:", googleErr);
  }

  // 모두 실패
  return NextResponse.json({ error: "TTS failed" }, { status: 502 });
}
