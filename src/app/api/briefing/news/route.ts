import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

interface RegionConfig {
  queries: string[];
  lang: "zh" | "ko";
  hl: string; gl: string; ceid: string;
}

const REGION_CONFIG: Record<string, RegionConfig> = {
  yiwu:      { queries: ["义乌 贸易", "义乌 新品 市场"],    lang: "zh", hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans" },
  guangzhou: { queries: ["广州 贸易", "广交会"],             lang: "zh", hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans" },
  shenzhen:  { queries: ["深圳 外贸", "深圳 制造业"],        lang: "zh", hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans" },
  shanghai:  { queries: ["上海 贸易", "上海 进出口"],        lang: "zh", hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans" },
  korea:     { queries: ["한중 무역", "수출입 동향"],        lang: "ko", hl: "ko",    gl: "KR", ceid: "KR:ko"      },
};

export interface NewsItem {
  title: string;
  titleOrig?: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
}

// ── 텍스트 정리 ──────────────────────────────────────────────
function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"').replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&lt;/g,  "<").replace(/&gt;/g,  ">")
    .replace(/&nbsp;/g, " ");
}

/** HTML 태그를 모두 제거하고 순수 텍스트만 반환 */
function stripHtml(raw: string): string {
  // CDATA 래퍼 제거
  let s = raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1");
  // 엔티티 디코딩 먼저 (entity-encoded HTML을 실제 태그로 변환 후 제거)
  s = decodeEntities(s);
  // <br>, <p>, <li> 등을 공백으로 변환
  s = s.replace(/<br\s*\/?>/gi, " ").replace(/<\/?(p|li|div|ol|ul)[^>]*>/gi, " ");
  // 나머지 모든 HTML 태그 제거 — 따옴표 안의 > 문자도 올바르게 처리
  s = s.replace(/<(?:[^"'>]|"[^"]*"|'[^']*')*>/g, "");
  // 한 번 더 엔티티 디코딩 (이중 인코딩 처리)
  s = decodeEntities(s);
  // 연속 공백 제거
  return s.replace(/\s+/g, " ").trim();
}

// ── RSS XML 파싱 ─────────────────────────────────────────────
function parseRSS(xml: string): Omit<NewsItem, "titleOrig">[] {
  const items: Omit<NewsItem, "titleOrig">[] = [];

  // <item> 블록 추출
  const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => m[1]);

  for (const block of itemBlocks) {
    // 각 필드 추출 — CDATA와 일반 텍스트 모두 처리
    const title   = getField(block, "title");
    const pubDate = getField(block, "pubDate");
    const desc    = getField(block, "description");
    const source  = getField(block, "source");

    // link는 self-closing이 없고, atom:link와 혼동될 수 있어 별도 처리
    const linkMatch =
      block.match(/<link>(https?[^<]+)<\/link>/) ||
      block.match(/<link[^>]*href="([^"]+)"/);
    const link = linkMatch?.[1]?.trim() ?? "";

    if (!title || !link) continue;

    // description: 링크 제목 텍스트만 추출 (첫 <a> 안의 굵은 텍스트)
    const descText = extractDescText(desc);

    items.push({
      title:       stripHtml(title),
      description: descText,
      link,
      pubDate:     stripHtml(pubDate),
      source:      stripHtml(source),
    });
  }

  return items;
}

/** 필드 값 추출 — CDATA/일반 텍스트 모두 지원, 공백 허용 */
function getField(block: string, tag: string): string {
  // <tag ...>  <![CDATA[ ... ]]>  </tag>  형태 (공백 있을 수 있음)
  const cdataRe = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, "i");
  const plainRe = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = cdataRe.exec(block) ?? plainRe.exec(block);
  return (m?.[1] ?? "").trim();
}

/** Google News description에서 의미있는 텍스트만 추출 */
function extractDescText(raw: string): string {
  if (!raw) return "";

  // CDATA 언래핑
  let s = raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1").trim();
  // 엔티티 먼저 디코딩 (entity-encoded markup → 실제 HTML)
  s = decodeEntities(s);

  // Google News description 형태:
  // <a href="..."><img .../></a><ol><li><a href="..."><b>제목</b><br/>출처 - N시간 전</a></li>...</ol>
  // → <b> 안의 텍스트들을 줄여서 반환

  // <b>텍스트</b> 추출
  const bolds = [...s.matchAll(/<b[^>]*>([\s\S]*?)<\/b>/gi)].map(m => stripHtml(m[1]));
  if (bolds.length > 0) {
    return bolds.slice(0, 2).join(" · ").slice(0, 120);
  }

  // 없으면 전체 HTML 제거
  return stripHtml(s).slice(0, 120);
}

// ── Claude 번역 (배치) ───────────────────────────────────────
async function translateToKorean(items: Omit<NewsItem, "titleOrig">[]): Promise<NewsItem[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || items.length === 0) return items.map(i => ({ ...i }));

  const client = new Anthropic({ apiKey });

  const input = items.map((item, idx) => ({
    idx,
    title: item.title,
    desc:  item.description,
  }));

  const prompt = `아래 중국어 뉴스 목록을 한국어로 번역하세요. 무역·소싱 용어 정확히, 지명은 한국어 발음으로.

${JSON.stringify(input)}

JSON 배열로만 응답 (다른 텍스트 없이):
[{"idx":0,"title":"번역 제목","desc":"번역 설명"},...]`;

  try {
    const msg = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });
    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    const arr  = JSON.parse(text.match(/\[[\s\S]*\]/)![0]) as Array<{ idx: number; title: string; desc: string }>;

    return items.map((item, i) => {
      const t = arr.find(x => x.idx === i);
      return { ...item, titleOrig: item.title, title: t?.title ?? item.title, description: t?.desc ?? item.description };
    });
  } catch (err) {
    console.warn("[briefing/news] 번역 실패:", err);
    return items.map(i => ({ ...i }));
  }
}

// ── Google News RSS 호출 ─────────────────────────────────────
async function fetchGoogleNews(query: string, config: RegionConfig): Promise<Omit<NewsItem, "titleOrig">[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${config.hl}&gl=${config.gl}&ceid=${config.ceid}`;
  const res = await fetch(url, {
    // cache: 'no-store' → Next.js 데이터 캐시 우회, 항상 최신 RSS 수신
    cache: "no-store",
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
  });
  if (!res.ok) throw new Error(`Google News ${res.status}`);
  return parseRSS(await res.text());
}

// ── 네이버 뉴스 ──────────────────────────────────────────────
async function fetchNaverNews(query: string): Promise<Omit<NewsItem, "titleOrig">[]> {
  const id  = process.env.NAVER_CLIENT_ID;
  const sec = process.env.NAVER_CLIENT_SECRET;
  if (!id || !sec) return [];

  const res = await fetch(
    `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=5&sort=date`,
    { cache: "no-store", headers: { "X-Naver-Client-Id": id, "X-Naver-Client-Secret": sec } }
  );
  if (!res.ok) return [];

  const data = await res.json() as {
    items: Array<{ title: string; description: string; link: string; pubDate: string; originallink: string }>;
  };
  return (data.items ?? []).map(item => ({
    title:       stripHtml(item.title),
    description: stripHtml(item.description).slice(0, 120),
    link:        item.originallink || item.link,
    pubDate:     item.pubDate,
    source:      (() => { try { return new URL(item.originallink || item.link).hostname.replace("www.", ""); } catch { return ""; } })(),
  }));
}

// ── GET ──────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const regionId = req.nextUrl.searchParams.get("region") ?? "yiwu";
  const config   = REGION_CONFIG[regionId] ?? REGION_CONFIG.yiwu;

  const raw: Omit<NewsItem, "titleOrig">[] = [];

  const fetcher = config.lang === "zh"
    ? (q: string) => fetchGoogleNews(q, config)
    : fetchNaverNews;

  for (const query of config.queries) {
    try {
      const got = await fetcher(query);
      for (const item of got) {
        if (!raw.some(r => r.title === item.title)) raw.push(item);
      }
    } catch (e) {
      console.warn(`[briefing/news] fetch 실패 (${query}):`, e);
    }
  }

  const sorted = raw
    .filter(i => i.title.length > 4)
    .sort((a, b) => (new Date(b.pubDate).getTime() || 0) - (new Date(a.pubDate).getTime() || 0))
    .slice(0, 8);

  const items: NewsItem[] = config.lang === "zh"
    ? await translateToKorean(sorted)
    : sorted.map(i => ({ ...i }));

  return NextResponse.json(
    { items, region: regionId, lang: config.lang, updatedAt: new Date().toISOString() },
    {
      headers: {
        // 5분 캐시 (번역 비용 절약) + 클라이언트도 5분 후 재요청
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    }
  );
}
