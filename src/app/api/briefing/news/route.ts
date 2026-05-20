import { NextRequest, NextResponse } from "next/server";

// ── 지역별 검색 설정 ─────────────────────────────────────────
interface RegionConfig {
  queries: string[];
  lang: "zh" | "ko";
  hl: string;   // Google News hl param
  gl: string;   // Google News gl param
  ceid: string; // Google News ceid
}

const REGION_CONFIG: Record<string, RegionConfig> = {
  yiwu: {
    queries: ["义乌 贸易", "义乌 新品 市场", "义乌 进出口"],
    lang: "zh",
    hl: "zh-CN",
    gl: "CN",
    ceid: "CN:zh-Hans",
  },
  guangzhou: {
    queries: ["广州 贸易", "广交会", "广州 进出口 市场"],
    lang: "zh",
    hl: "zh-CN",
    gl: "CN",
    ceid: "CN:zh-Hans",
  },
  shenzhen: {
    queries: ["深圳 外贸", "深圳 制造业 出口", "深圳 跨境电商"],
    lang: "zh",
    hl: "zh-CN",
    gl: "CN",
    ceid: "CN:zh-Hans",
  },
  shanghai: {
    queries: ["上海 贸易", "上海 进出口", "上海 国际市场"],
    lang: "zh",
    hl: "zh-CN",
    gl: "CN",
    ceid: "CN:zh-Hans",
  },
  korea: {
    queries: ["한중 무역", "수출입 동향", "도매 신상품"],
    lang: "ko",
    hl: "ko",
    gl: "KR",
    ceid: "KR:ko",
  },
};

export interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
}

// ── RSS XML 파싱 (라이브러리 없이) ───────────────────────────
function parseRSSItems(xml: string): NewsItem[] {
  const items: NewsItem[] = [];

  // <item> 블록 추출
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const title   = extractTag(block, "title");
    const link    = extractTag(block, "link");
    const pubDate = extractTag(block, "pubDate");
    const desc    = extractTag(block, "description");
    const source  = extractAttrTag(block, "source");

    if (!title || !link) continue;

    items.push({
      title:       cleanText(title),
      description: cleanText(desc),
      link:        cleanText(link),
      pubDate:     cleanText(pubDate),
      source:      cleanText(source),
    });
  }

  return items;
}

function extractTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = re.exec(xml);
  return (m?.[1] ?? m?.[2] ?? "").trim();
}

function extractAttrTag(xml: string, tag: string): string {
  // <source url="...">Source Name</source>
  const re = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = re.exec(xml);
  return (m?.[1] ?? m?.[2] ?? "").trim();
}

function cleanText(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")      // HTML 태그 제거
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Google News RSS 호출 ─────────────────────────────────────
async function fetchGoogleNews(query: string, config: RegionConfig): Promise<NewsItem[]> {
  const url =
    `https://news.google.com/rss/search` +
    `?q=${encodeURIComponent(query)}` +
    `&hl=${config.hl}` +
    `&gl=${config.gl}` +
    `&ceid=${config.ceid}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
    next: { revalidate: 1800 },
  });

  if (!res.ok) throw new Error(`Google News ${res.status}`);

  const xml = await res.text();
  return parseRSSItems(xml);
}

// ── 네이버 뉴스 (한국어 폴백) ────────────────────────────────
async function fetchNaverNews(query: string): Promise<NewsItem[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return [];

  const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=5&start=1&sort=date`;
  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
    next: { revalidate: 1800 },
  });

  if (!res.ok) return [];

  const data = await res.json() as {
    items: Array<{ title: string; description: string; link: string; pubDate: string; originallink: string }>;
  };

  return (data.items ?? []).map(item => ({
    title:       cleanText(item.title),
    description: cleanText(item.description),
    link:        item.originallink || item.link,
    pubDate:     item.pubDate,
    source:      (() => { try { return new URL(item.originallink || item.link).hostname.replace("www.", ""); } catch { return ""; } })(),
  }));
}

// ── GET 핸들러 ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const regionId = req.nextUrl.searchParams.get("region") ?? "yiwu";
  const config = REGION_CONFIG[regionId] ?? REGION_CONFIG.yiwu;

  const results: NewsItem[] = [];

  if (config.lang === "zh") {
    // 중국 지역: Google News RSS (중국어)
    for (const query of config.queries.slice(0, 2)) {
      try {
        const items = await fetchGoogleNews(query, config);
        for (const item of items) {
          if (!results.some(r => r.title === item.title)) {
            results.push(item);
          }
        }
      } catch (e) {
        console.warn(`[briefing/news] Google News 실패 (${query}):`, e);
      }
    }
  } else {
    // 한국: 네이버 뉴스
    for (const query of config.queries.slice(0, 2)) {
      try {
        const items = await fetchNaverNews(query);
        for (const item of items) {
          if (!results.some(r => r.title === item.title)) {
            results.push(item);
          }
        }
      } catch (e) {
        console.warn(`[briefing/news] Naver News 실패 (${query}):`, e);
      }
    }
  }

  // 최신순 정렬 후 최대 10개
  const sorted = results
    .filter(item => item.title.length > 5)
    .sort((a, b) => {
      const ta = new Date(a.pubDate).getTime() || 0;
      const tb = new Date(b.pubDate).getTime() || 0;
      return tb - ta;
    })
    .slice(0, 10);

  return NextResponse.json(
    {
      items: sorted,
      region: regionId,
      lang: config.lang,
      updatedAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } }
  );
}
