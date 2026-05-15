import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 저장된 임시 이미지를 파일로 반환 (1688 이미지검색용 공개 URL)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const img = await prisma.tempImage.findUnique({ where: { id } });
    if (!img) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    // data: URL에서 순수 base64만 추출
    const base64Data = img.data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": img.mimeType,
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}
