import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 30;

// POST: base64 이미지를 DB에 저장하고 공개 URL 반환
export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "imageBase64 required" }, { status: 400 });
    }

    const img = await prisma.tempImage.create({
      data: {
        data: imageBase64,
        mimeType: mimeType || "image/jpeg",
      },
    });

    const origin = req.nextUrl.origin;
    return NextResponse.json({ url: `${origin}/api/temp-image/${img.id}` });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}
