import { NextRequest, NextResponse } from "next/server";

// 지역별 검색 키워드 매핑
const REGION_KEYWORDS: Record<string, string[]> = {
  yiwu:      ["이우 무역", "义乌 新品", "义乌 市场"],
  guangzhou:  ["광저우 무역", "广州 市场", "广交会"],
  shenzhen:   ["선전 무역", "深圳 工厂", "深圳 수출"],
  shanghai:   ["상하이 무역", "上海 贸易", "上海 시장"],
  korea:      ["한중 무역", "수출입 동향", "도매 신상품"],
};

export interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
}

export async function GET(req: NextRequest) {
  const regionId = req.nextUrl.searchParams.get("region") ?? "yiwu";
  const keywords = REGION_KEYWORDS[regionId] ?? REGION_KEYWORDS.yiwu;

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Naver API not configured" }, { status: 500 });
  }

  // 여러 키워드로 병렬 검색
  const results: NewsItem[] = [];

  for (const query of keywords.slice(0, 2)) {
    try {
      const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=5&start=1&sort=date`;
      const res = await fetch(url, {
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
        },
        next: { revalidate: 1800 }, // 30분 캐시
      });

      if (!res.ok) continue;

      const data = await res.json();
      const items = (data.items ?? []) as Array<{
        title: string;
        description: string;
        link: string;
        pubDate: string;
        originallink: string;
      }>;

      for (const item of items) {
        // HTML 태그 제거
        const cleanTitle = item.title.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'");
        const cleanDesc  = item.description.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'");

        // 중복 제거
        if (results.some(r => r.title === cleanTitle)) continue;

        results.push({
          title: cleanTitle,
          description: cleanDesc,
          link: item.originallink || item.link,
          pubDate: item.pubDate,
          source: new URL(item.originallink || item.link).hostname.replace("www.", ""),
        });
      }
    } catch {
      continue;
    }
  }

  // 최신순 정렬 및 최대 8개
  const sorted = results
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, 8);

  return NextResponse.json(
    { items: sorted, region: regionId, updatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } }
  );
}
