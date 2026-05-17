"use client";

import { Camera } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUserName } from "@/lib/themes";
import { useTranslation } from "@/lib/i18n";
import type { ExchangeRates } from "@/app/api/exchange-rate/route";

interface Stats { researching: number; inProgress: number; arrived: number; }

interface CurrencyItem {
  flag: string;
  code: string;
  label: string;
  value: number;
  unit?: string;       // 표시 단위 (예: "100엔" → unitAmount=100)
  unitAmount?: number;
  decimals: number;
  rateType?: string;   // "전신환매도" | "매매기준"
}

export default function HomePage() {
  const { t } = useTranslation();
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    setUserName(getStoredUserName());
    fetch("/api/exchange-rate")
      .then(r => r.json())
      .then((d: ExchangeRates) => setRates(d))
      .catch(() => {});
    fetch("/api/products")
      .then(r => r.json())
      .then((products: Array<{ status: string }>) => {
        const s: Stats = { researching: 0, inProgress: 0, arrived: 0 };
        for (const p of products) {
          if (p.status === "sourcing" || p.status === "proposed") s.researching++;
          else if (p.status === "ordered" || p.status === "shipping" || p.status === "shipped") s.inProgress++;
          else if (p.status === "arrived") s.arrived++;
        }
        setStats(s);
      })
      .catch(() => {});
  }, []);

  // 통화 목록 (CNY·USD·JPY·VND)
  // CNY는 전신환매도율(ttSell) — 실제 송금 시 적용 환율
  // 나머지는 매매기준율 — 기준 참고용
  const currencies: CurrencyItem[] = rates ? [
    { flag: "🇨🇳", code: "CNY", label: "위안", value: rates.ttSell,          decimals: 1, rateType: "전신환매도" },
    { flag: "🇺🇸", code: "USD", label: "달러", value: rates.usdKrw,          decimals: 0, rateType: "매매기준" },
    { flag: "🇯🇵", code: "JPY", label: "엔",   value: rates.jpyKrw * 100,    unit: "100엔", unitAmount: 100, decimals: 1, rateType: "매매기준" },
    { flag: "🇻🇳", code: "VND", label: "동",   value: rates.vndKrw * 10000,  unit: "1만동", unitAmount: 10000, decimals: 1, rateType: "매매기준" },
  ] : [];

  const menuItems = [
    { href: "/sourcing", emoji: "📒", label: t("nav.sourcing"),  desc: t("sourcing.title") },
    { href: "/hs",       emoji: "🔍", label: t("nav.hs"),        desc: t("common.qr_scan") },
    { href: "/more",     emoji: "⋯",  label: t("nav.more"),      desc: t("more.subtitle") },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6FA]">
      {/* 헤더 */}
      <header className="px-5 pt-14 pb-6 bg-[var(--primary)]">
        <p className="text-xs font-medium mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{t("ob.app_name")} 📦</p>
        <h1 className="text-2xl font-bold text-white">
          {userName
            ? t("home.greeting", { name: userName })
            : t("home.greet_no_name")}
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>{t("home.subtitle")}</p>

        {/* 환율 + 현황 */}
        <div className="mt-5 space-y-3">
          {/* 멀티 환율 */}
          <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <p className="text-xs font-medium leading-tight" style={{ color: "rgba(255,255,255,0.7)" }}>
                  실시간 환율
                </p>
                <p className="text-[10px] mt-0.5 leading-tight" style={{ color: "rgba(255,255,255,0.4)" }}>
                  위안: 전신환매도율 · 기타: 매매기준율
                </p>
              </div>
              {rates?.date && (
                <p className="text-[10px] shrink-0" style={{ color: "rgba(255,255,255,0.35)" }}>{rates.date}</p>
              )}
            </div>
            {rates ? (
              <div className="grid grid-cols-4 gap-2">
                {currencies.map((c) => (
                  <div key={c.code} className="text-center">
                    <div className="text-base leading-none mb-1">{c.flag}</div>
                    <div className="text-sm font-bold text-white leading-tight">
                      {c.value >= 1000
                        ? c.value.toLocaleString("ko-KR", { maximumFractionDigits: 0 })
                        : c.value.toFixed(c.decimals)}
                    </div>
                    <div className="text-[10px] leading-tight mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {c.unit ?? `1${c.label}`}
                    </div>
                    {c.rateType && (
                      <div className="text-[9px] leading-tight mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {c.rateType}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {["🇨🇳","🇺🇸","🇯🇵","🇻🇳"].map((flag) => (
                  <div key={flag} className="text-center">
                    <div className="text-base leading-none mb-1">{flag}</div>
                    <div className="text-sm font-bold text-white/40">—</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 소싱 현황 */}
          {stats && (
            <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.1)" }}>
              <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>{t("home.stats")}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-extrabold text-white">{stats.researching}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>🔍 {t("home.researching")}</div>
                </div>
                <div>
                  <div className="text-lg font-extrabold text-white">{stats.inProgress}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>📦 {t("home.in_progress")}</div>
                </div>
                <div>
                  <div className="text-lg font-extrabold text-white">{stats.arrived}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>✅ {t("home.arrived")}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 현장 빠른 액션 */}
      <div className="px-4 py-5">
        <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">{t("home.quick")}</p>
        <Link href="/sourcing?new=1">
          <div className="rounded-2xl px-6 py-6 flex items-center gap-5 active:scale-[0.98] transition-transform shadow-sm bg-[var(--primary)]">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Camera className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-extrabold text-lg text-white leading-tight">소싱 시작</div>
              <div className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>사진 찍으면 AI가 원가까지 분석</div>
            </div>
            <span className="text-white/40 text-2xl leading-none">›</span>
          </div>
        </Link>
      </div>

      {/* 메뉴 바로가기 */}
      <div className="px-4 pb-4">
        <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">{t("home.menu")}</p>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {menuItems.map((item, i, arr) => (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-4 px-4 py-4 active:bg-gray-50 transition-colors ${i < arr.length - 1 ? "border-b border-gray-50" : ""}`}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-[var(--primary-lighter)]">
                  {item.emoji}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800">{item.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
                </div>
                <span className="text-gray-300 text-lg">›</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
