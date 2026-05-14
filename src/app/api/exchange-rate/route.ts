import { NextResponse } from "next/server";

export interface ExchangeRates {
  baseRate: number;   // CNY 매매기준율
  ttSell: number;     // CNY 전신환매도율
  ttBuy: number;      // CNY 전신환매입율
  usdKrw: number;     // USD/KRW 기준율
  date: string;
  source: string;
}

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);

  // USD/KRW 별도 조회 (Frankfurter)
  let usdKrw = 1350;
  try {
    const usdRes = await fetch("https://api.frankfurter.app/latest?from=USD&to=KRW", { next: { revalidate: 3600 } });
    if (usdRes.ok) {
      const usdData = await usdRes.json();
      usdKrw = Math.round(usdData.rates.KRW);
    }
  } catch { /* fallback 유지 */ }

  // 1순위: 한국수출입은행 공식 API
  if (process.env.EXIM_API_KEY) {
    try {
      const dateStr = today.replace(/-/g, "");
      const url = `https://www.koreaexim.go.kr/site/program/financial/exchangeJSON?authkey=${process.env.EXIM_API_KEY}&searchdate=${dateStr}&data=AP01`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      const data = await res.json();
      const cny = data.find((d: { cur_unit: string }) => d.cur_unit === "CNY");
      const usd = data.find((d: { cur_unit: string }) => d.cur_unit === "USD");
      if (cny) {
        const baseRate = parseFloat(cny.deal_bas_r.replace(/,/g, ""));
        const ttSell = parseFloat(cny.tts.replace(/,/g, ""));
        const ttBuy = parseFloat(cny.ttb.replace(/,/g, ""));
        if (usd) usdKrw = Math.round(parseFloat(usd.deal_bas_r.replace(/,/g, "")));
        return NextResponse.json({ baseRate, ttSell, ttBuy, usdKrw, date: today, source: "koreaexim" } as ExchangeRates);
      }
    } catch { /* 다음 방법으로 */ }
  }

  // 2순위: Frankfurter (ECB 기준, 무료)
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=CNY&to=KRW",
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const data = await res.json();
      const baseRate = Math.round(data.rates.KRW * 100) / 100;
      const ttSell = Math.round(baseRate * 1.0175 * 100) / 100;
      const ttBuy = Math.round(baseRate * 0.9825 * 100) / 100;
      return NextResponse.json({ baseRate, ttSell, ttBuy, usdKrw, date: today, source: "frankfurter" } as ExchangeRates);
    }
  } catch { /* 다음 방법으로 */ }

  // 3순위: ExchangeRate-API
  try {
    const res = await fetch(
      "https://open.er-api.com/v6/latest/CNY",
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const data = await res.json();
      const baseRate = Math.round(data.rates.KRW * 100) / 100;
      const ttSell = Math.round(baseRate * 1.0175 * 100) / 100;
      const ttBuy = Math.round(baseRate * 0.9825 * 100) / 100;
      if (data.rates.USD) usdKrw = Math.round(1 / data.rates.USD * (data.rates.KRW || usdKrw));
      return NextResponse.json({ baseRate, ttSell, ttBuy, usdKrw, date: today, source: "exchangerate-api" } as ExchangeRates);
    }
  } catch { /* fallback */ }

  // 최후 fallback
  return NextResponse.json({
    baseRate: 193.5,
    ttSell: 196.9,
    ttBuy: 190.1,
    usdKrw: 1350,
    date: today,
    source: "fallback",
  } as ExchangeRates);
}
