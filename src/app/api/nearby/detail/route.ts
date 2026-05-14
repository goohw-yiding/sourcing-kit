import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "no_id" }, { status: 400 });

  const key = process.env.AMAP_API_KEY;
  if (!key) return NextResponse.json({ error: "no_key" }, { status: 503 });

  const url =
    `https://restapi.amap.com/v3/place/detail` +
    `?id=${id}&key=${key}&output=JSON`;

  const res = await fetch(url, { next: { revalidate: 0 } });
  const data = await res.json();

  if (data.status !== "1" || !data.pois?.[0]) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const p = data.pois[0];
  return NextResponse.json({
    id: p.id,
    name: p.name,
    address: typeof p.address === "string" ? p.address : "",
    tel: typeof p.tel === "string" ? p.tel : "",
    rating: p.biz_ext?.rating || null,
    openTime: p.biz_ext?.open_time || null,
    photos: (p.photos || []).slice(0, 6).map((ph: { title?: string; url: string }) => ({
      title: ph.title || "",
      url: ph.url,
    })),
    location: p.location, // "lon,lat"
    type: p.type || "",
  });
}
