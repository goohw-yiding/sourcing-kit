import { NextRequest, NextResponse } from "next/server";

export interface ExchangeDataPoint {
  date: string;   // YYYY-MM-DD
  cny: number;    // 1위안 = ? 원
  usd: number;    // 1달러 = ? 원
}

export interface ExchangeHistoryResponse {
  data: ExchangeDataPoint[];
  period: string;
  latestCny: number;
  latestUsd: number;
  changePercent: { cny: number; usd: number };
}

function getPeriodDates(period: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case "1w":  start.setDate(end.getDate() - 7);    break;
    case "1m":  start.setMonth(end.getMonth() - 1);   break;
    case "6m":  start.setMonth(end.getMonth() - 6);   break;
    case "1y":  start.setFullYear(end.getFullYear() - 1); break;
    default:    start.setMonth(end.getMonth() - 1);
  }

  return { start, end };
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period") ?? "1m";
  const { start, end } = getPeriodDates(period);

  const startStr = formatDate(start);
  const endStr   = formatDate(end);

  // Frankfurter API: from=KRW → rates는 "1원당 외화"
  // 1위안 = 1/r.CNY 원, 1달러 = 1/r.USD 원
  try {
    const url = `https://api.frankfurter.app/${startStr}..${endStr}?from=KRW&to=CNY,USD`;
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) throw new Error(`Frankfurter error: ${res.status}`);

    const json = await res.json() as {
      rates: Record<string, { CNY?: number; USD?: number }>;
    };

    const data: ExchangeDataPoint[] = Object.entries(json.rates)
      .map(([date, r]) => ({
        date,
        cny: r.CNY ? Math.round((1 / r.CNY) * 100) / 100 : 0,
        usd: r.USD ? Math.round(1 / r.USD) : 0,
      }))
      .filter(d => d.cny > 0 && d.usd > 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (data.length === 0) throw new Error("No data");

    const latest = data[data.length - 1];
    const earliest = data[0];
    const changePercent = {
      cny: ((latest.cny - earliest.cny) / earliest.cny) * 100,
      usd: ((latest.usd - earliest.usd) / earliest.usd) * 100,
    };

    return NextResponse.json({
      data,
      period,
      latestCny: latest.cny,
      latestUsd: latest.usd,
      changePercent,
    } as ExchangeHistoryResponse, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
    });
  } catch (err) {
    console.error("[briefing/exchange]", err);

    // fallback: 오늘 날짜 단일 데이터
    const today = formatDate(end);
    return NextResponse.json({
      data: [{ date: today, cny: 193.5, usd: 1350 }],
      period,
      latestCny: 193.5,
      latestUsd: 1350,
      changePercent: { cny: 0, usd: 0 },
    } as ExchangeHistoryResponse, { status: 200 });
  }
}
