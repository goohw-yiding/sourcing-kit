import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// ── 지역별 검색 설정 ─────────────────────────────────────────
interface RegionConfig {
  queries: string[];
  lang: "zh" | "ko";
  hl: string;
  gl: string;
  ceid: string;
}

const REGION_CONFIG: Record<string, RegionConfig> = {
  yiwu: {
    queries: ["义乌 贸易", "义乌 新品 市场"],
    lang: "zh", hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans",
  },
  guangzhou: {
    queries: ["广州 贸易", "广交会 广州"],
    lang: "zh", hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans",
  },
  shenzhen: {
    queries: ["深圳 外贸", "深圳 制造业 출口"],
    lang: "zh", hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans",
  },
  shanghai: {
    queries: ["上海 贸易", "上海 进出口"],
    lang: "zh", hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans",
  },
  korea: {
    queries: ["한중 무역", "수출입 동향"],
    lang: "ko", hl: "ko", gl: "KR", ceid: "KR:ko",
  },
};

export interface NewsItem {
  title: string;
  titleOrig?: string;   // 원문 (중국어)
  description: string;
  link: string;
  pubDate: string;
  source: string;
}

// ── RSS XML 파싱 ────────────────────────────────────────────
function parseRSSItems(xml: string): Omit<NewsItem, "titleOrig">[] {
  const items: Omit<NewsItem, "titleOrig">[] = [];
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

    // 설명에서 HTML 링크 완전 제거 후 순수 텍스트만 추출
    const cleanDesc = stripAllHtml(desc);

    items.push({
      title:       cleanText(title),
      description: cleanDesc,
      link:        cleanText(link),
      pubDate:     cleanText(pubDate),
      source:      cleanText(source),
    });
  }
  return items;
}

function extractTag(xml: string, tag: string): string {
  const re = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
    "i"
  );
  const m = re.exec(xml);
  return (m?.[1] ?? m?.[2] ?? "").trim();
}

function extractAttrTag(xml: string, tag: string): string {
  const re = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
    "i"
  );
  const m = re.exec(xml);
  return (m?.[1] ?? m?.[2] ?? "").trim();
}

/** 모든 HTML 태그와 속성을 완전히 제거하고 순수 텍스트만 반환 */
function stripAllHtml(s: string): string {
  // <a href="...">텍스트</a> → 텍스트
  let result = s.replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, "$1");
  // 나머지 HTML 태그 전부 제거
  result = result.replace(/<[^>]+>/g, " ");
  return cleanText(result);
}

function cleanText(s: string): string {
  return s
    .replace(/&quot;/g, '"').replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
}

// ── Claude로 한국어 번역 (배치) ───────────────────────────────
async function translateToKorean(
  items: Omit<NewsItem, "titleOrig">[]
): Promise<NewsItem[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || items.length === 0) {
    return items.map(i => ({ ...i }));
  }

  const client = new Anthropic({ apiKey });

  // 번역할 텍스트를 JSON 배열로 묶어서 한 번에 요청
  const input = items.map((item, idx) => ({
    idx,
    title: item.title,
    desc:  item.description.slice(0, 120), // 설명은 앞 120자만
  }));

  const prompt = `다음은 중국어 뉴스 기사 목록입니다. 각 항목의 title과 desc를 자연스러운 한국어로 번역해주세요.
무역·소싱 분야 용어를 정확히 번역하고, 고유명사(지명, 회사명)는 한국어 발음으로 표기하세요.

입력 JSON:
${JSON.stringify(input, null, 2)}

반드시 아래 JSON 배열 형식으로만 응답하세요 (다른 텍스트 없이):
[{"idx":0,"title":"번역된 제목","desc":"번역된 설명"}, ...]`;

  try {
    const message = await client.messages.create({
      model:      "claude-3-5-haiku-20241022",
      max_tokens: 2048,
      messages:   [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Invalid JSON");

    const translated = JSON.parse(jsonMatch[0]) as Array<{
      idx: number; title: string; desc: string;
    }>;

    return items.map((item, i) => {
      const t = translated.find(x => x.idx === i);
      return {
        ...item,
        titleOrig:   item.title,                          // 원문 보존
        title:       t?.title ?? item.title,              // 번역된 제목
        description: t?.desc  ?? item.description,        // 번역된 설명
      };
    });
  } catch (err) {
    console.warn("[briefing/news] 번역 실패, 원문 사용:", err);
    return items.map(i => ({ ...i }));
  }
}

// ── Google News RSS ─────────────────────────────────────────
async function fetchGoogleNews(
  query: string,
  config: RegionConfig
): Promise<Omit<NewsItem, "titleOrig">[]> {
  const url =
    `https://news.google.com/rss/search` +
    `?q=${encodeURIComponent(query)}` +
    `&hl=${config.hl}&gl=${config.gl}&ceid=${config.ceid}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
    next: { revalidate: 1800 },
  });

  if (!res.ok) throw new Error(`Google News ${res.status}`);
  return parseRSSItems(await res.text());
}

// ── 네이버 뉴스 (한국어) ────────────────────────────────────
async function fetchNaverNews(query: string): Promise<Omit<NewsItem, "titleOrig">[]> {
  const clientId     = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return [];

  const res = await fetch(
    `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=5&start=1&sort=date`,
    {
      headers: {
        "X-Naver-Client-Id":     clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      next: { revalidate: 1800 },
    }
  );
  if (!res.ok) return [];

  const data = await res.json() as {
    items: Array<{ title: string; description: string; link: string; pubDate: string; originallink: string }>;
  };

  return (data.items ?? []).map(item => ({
    title:       stripAllHtml(item.title),
    description: stripAllHtml(item.description),
    link:        item.originallink || item.link,
    pubDate:     item.pubDate,
    source:      (() => { try { return new URL(item.originallink || item.link).hostname.replace("www.", ""); } catch { return ""; } })(),
  }));
}

// ── GET 핸들러 ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const regionId = req.nextUrl.searchParams.get("region") ?? "yiwu";
  const config   = REGION_CONFIG[regionId] ?? REGION_CONFIG.yiwu;

  const raw: Omit<NewsItem, "titleOrig">[] = [];

  if (config.lang === "zh") {
    for (const query of config.queries) {
      try {
        const items = await fetchGoogleNews(query, config);
        for (const item of items) {
          if (!raw.some(r => r.title === item.title)) raw.push(item);
        }
      } catch (e) {
        console.warn(`[briefing/news] Google News 실패 (${query}):`, e);
      }
    }
  } else {
    for (const query of config.queries) {
      try {
        const items = await fetchNaverNews(query);
        for (const item of items) {
          if (!raw.some(r => r.title === item.title)) raw.push(item);
        }
      } catch (e) {
        console.warn(`[briefing/news] Naver News 실패 (${query}):`, e);
      }
    }
  }

  // 최신순 정렬 + 최대 8개
  const sorted = raw
    .filter(item => item.title.length > 5)
    .sort((a, b) => (new Date(b.pubDate).getTime() || 0) - (new Date(a.pubDate).getTime() || 0))
    .slice(0, 8);

  // 중국어 뉴스는 한국어로 번역
  const items: NewsItem[] = config.lang === "zh"
    ? await translateToKorean(sorted)
    : sorted.map(i => ({ ...i }));

  return NextResponse.json(
    { items, region: regionId, lang: config.lang, updatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } }
  );
}
