import { NextRequest, NextResponse } from "next/server";

export interface NearbyPoi {
  id: string;
  name: string;
  type: string;
  address: string;
  distance: string;
  tel: string;
  location: string; // "lon,lat"
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const keyword = searchParams.get("keyword") || "餐厅";
  const radius = searchParams.get("radius") || "1000";

  if (!lat || !lon) {
    return NextResponse.json({ error: "no_location" }, { status: 400 });
  }

  const key = process.env.AMAP_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "no_key" }, { status: 503 });
  }

  try {
    const url =
      `https://restapi.amap.com/v3/place/around` +
      `?key=${key}` +
      `&location=${lon},${lat}` +
      `&keywords=${encodeURIComponent(keyword)}` +
      `&radius=${radius}` +
      `&sortrule=distance` +
      `&output=JSON` +
      `&offset=15`;

    const res = await fetch(url, { next: { revalidate: 0 } });
    const data = await res.json();

    if (data.status !== "1") {
      return NextResponse.json({ error: "amap_error", info: data.info }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pois: NearbyPoi[] = (data.pois || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      address: typeof p.address === "string" ? p.address : "",
      distance: p.distance,
      tel: typeof p.tel === "string" ? p.tel : "",
      location: p.location,
    }));

    return NextResponse.json({ pois, count: pois.length });
  } catch {
    return NextResponse.json({ error: "fetch_error" }, { status: 500 });
  }
}
