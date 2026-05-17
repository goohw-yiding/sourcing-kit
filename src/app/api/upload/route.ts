import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Cloudinary에 업로드 (base64 방식)
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(base64, {
      folder: "sourcing-shot",
      transformation: [
        { width: 1200, height: 1200, crop: "limit" }, // 최대 크기 제한
        { quality: "auto:good" },                     // 자동 품질 최적화
        { fetch_format: "auto" },                     // 최적 포맷 자동 선택
      ],
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (err) {
    console.error("[upload] Cloudinary 오류:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
