import { NextResponse } from "next/server";

export interface ExchangeRates {
  baseRate: number;   // CNY/KRW 매매기준율
  ttSell: number;     // CNY 전신환매도율
  ttBuy: number;      // CNY 전신환매입율
  usdKrw: number;     // USD/KRW
  jpyKrw: number;     // JPY/KRW (1엔당)
  vndKrw: number;     // VND/KRW (1동당)
  sgdKrw: number;     // SGD/KRW (1싱가포르달러당)
  date: string;
  source: string;
}

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);

  // 1순위: 한국수출입은행 공식 API
  if (process.env.EXIM_API_KEY) {
    try {
      const dateStr = today.replace(/-/g, "");
      const url = `https://www.koreaexim.go.kr/site/program/financial/exchangeJSON?authkey=${process.env.EXIM_API_KEY}&searchdate=${dateStr}&data=AP01`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      const data = await res.json();
      const cny = data.find((d: { cur_unit: string }) => d.cur_unit === "CNY");
      const usd = data.find((d: { cur_unit: string }) => d.cur_unit === "USD");
      const jpy = data.find((d: { cur_unit: string }) => d.cur_unit === "JPY(100)");
      if (cny) {
        const baseRate = parseFloat(cny.deal_bas_r.replace(/,/g, ""));
        const ttSell = parseFloat(cny.tts.replace(/,/g, ""));
        const ttBuy = parseFloat(cny.ttb.replace(/,/g, ""));
        const usdKrw = usd ? Math.round(parseFloat(usd.deal_bas_r.replace(/,/g, ""))) : 1350;
        // JPY(100) → 1엔당 = rate/100
        const jpyKrw = jpy ? Math.round(parseFloat(jpy.deal_bas_r.replace(/,/g, "")) / 100 * 100) / 100 : 9.2;
        // VND, SGD는 수출입은행에 없으므로 Frankfurter로 보충
        const { vndKrw, sgdKrw } = await fetchFxRates();
        return NextResponse.json({
          baseRate, ttSell, ttBuy, usdKrw, jpyKrw, vndKrw, sgdKrw,
          date: today, source: "koreaexim",
        } as ExchangeRates);
      }
    } catch { /* 다음 방법으로 */ }
  }

  // 2순위: Frankfurter (ECB 기준, 무료) — 한번에 모든 통화 조회
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=KRW&to=CNY,JPY,USD,VND,SGD",
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const data = await res.json();
      const r = data.rates as Record<string, number>;
      // from=KRW → r.CNY = 1원당 위안 → invert: 1위안 = 1/r.CNY 원
      const baseRate = r.CNY ? Math.round((1 / r.CNY) * 100) / 100 : 193.5;
      const ttSell   = Math.round(baseRate * 1.0175 * 100) / 100;
      const ttBuy    = Math.round(baseRate * 0.9825 * 100) / 100;
      const usdKrw   = r.USD ? Math.round(1 / r.USD) : 1350;
      const jpyKrw   = r.JPY ? Math.round((1 / r.JPY) * 100) / 100 : 9.2;
      const vndKrw   = r.VND ? Math.round((1 / r.VND) * 10000) / 10000 : 0.055;
      const sgdKrw   = r.SGD ? Math.round(1 / r.SGD) : 1020;
      return NextResponse.json({
        baseRate, ttSell, ttBuy, usdKrw, jpyKrw, vndKrw, sgdKrw,
        date: today, source: "frankfurter",
      } as ExchangeRates);
    }
  } catch { /* 다음 방법으로 */ }

  // 3순위: ExchangeRate-API
  try {
    const res = await fetch(
      "https://open.er-api.com/v6/latest/KRW",
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const data = await res.json();
      const r = data.rates as Record<string, number>;
      const baseRate = r.CNY ? Math.round((1 / r.CNY) * 100) / 100 : 193.5;
      const ttSell   = Math.round(baseRate * 1.0175 * 100) / 100;
      const ttBuy    = Math.round(baseRate * 0.9825 * 100) / 100;
      const usdKrw   = r.USD ? Math.round(1 / r.USD) : 1350;
      const jpyKrw   = r.JPY ? Math.round((1 / r.JPY) * 100) / 100 : 9.2;
      const vndKrw   = r.VND ? Math.round((1 / r.VND) * 10000) / 10000 : 0.055;
      const sgdKrw   = r.SGD ? Math.round(1 / r.SGD) : 1020;
      return NextResponse.json({
        baseRate, ttSell, ttBuy, usdKrw, jpyKrw, vndKrw, sgdKrw,
        date: today, source: "exchangerate-api",
      } as ExchangeRates);
    }
  } catch { /* fallback */ }

  // 최후 fallback
  return NextResponse.json({
    baseRate: 193.5,
    ttSell: 196.9,
    ttBuy: 190.1,
    usdKrw: 1350,
    jpyKrw: 9.2,
    vndKrw: 0.055,
    sgdKrw: 1020,
    date: today,
    source: "fallback",
  } as ExchangeRates);
}

/** VND, SGD only — used as supplement when EXIM API doesn't cover them */
async function fetchFxRates(): Promise<{ vndKrw: number; sgdKrw: number }> {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=KRW&to=VND,SGD");
    if (res.ok) {
      const d = await res.json();
      const r = d.rates as Record<string, number>;
      return {
        vndKrw: r.VND ? Math.round((1 / r.VND) * 10000) / 10000 : 0.055,
        sgdKrw: r.SGD ? Math.round(1 / r.SGD) : 1020,
      };
    }
  } catch { /* ignore */ }
  return { vndKrw: 0.055, sgdKrw: 1020 };
}
