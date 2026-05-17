"use client";

import { Calculator, Camera } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUserName } from "@/lib/themes";
import { useTranslation } from "@/lib/i18n";

interface Stats { sourcing: number; proposed: number; ordered: number; }

export default function HomePage() {
  const { t } = useTranslation();
  const [rate, setRate] = useState<{ ttSell: number; date: string } | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    setUserName(getStoredUserName());
    fetch("/api/exchange-rate")
      .then(r => r.json())
      .then(d => setRate({ ttSell: d.ttSell || d.rate || 0, date: d.date || "" }))
      .catch(() => {});
    fetch("/api/products")
      .then(r => r.json())
      .then((products: Array<{ status: string }>) => {
        const s: Stats = { sourcing: 0, proposed: 0, ordered: 0 };
        for (const p of products) {
          if (p.status === "sourcing") s.sourcing++;
          else if (p.status === "proposed") s.proposed++;
          else if (p.status === "ordered") s.ordered++;
        }
        setStats(s);
      })
      .catch(() => {});
  }, []);

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
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.1)" }}>
            <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>{t("home.rate")}</p>
            <p className="text-2xl font-bold text-white">
              {rate ? `${rate.ttSell.toFixed(1)}` : "—"}
              <span className="text-sm font-normal ml-1" style={{ color: "rgba(255,255,255,0.7)" }}>원</span>
            </p>
            {rate?.date && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{rate.date}</p>}
          </div>
          {stats && (
            <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.1)" }}>
              <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>{t("home.stats")}</p>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{t("home.reviewing")}</span>
                  <span className="text-sm font-bold text-white">{stats.sourcing}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{t("home.proposed")}</span>
                  <span className="text-sm font-bold text-white">{stats.proposed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{t("home.ordered")}</span>
                  <span className="text-sm font-bold text-white">{stats.ordered}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 현장 빠른 액션 */}
      <div className="px-4 py-5">
        <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">{t("home.quick")}</p>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/sourcing?new=1">
            <div className="rounded-2xl p-5 flex flex-col gap-3 active:scale-95 transition-transform shadow-sm bg-[var(--primary)]">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">{t("home.photo")}</div>
                <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{t("home.photo_sub")}</div>
              </div>
            </div>
          </Link>
          <Link href="/calculator">
            <div className="rounded-2xl p-5 flex flex-col gap-3 active:scale-95 transition-transform shadow-sm bg-[#F97316]">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">{t("home.calc")}</div>
                <div className="text-xs mt-0.5 text-orange-100">CNY → KRW</div>
              </div>
            </div>
          </Link>
          <Link href="/1688" className="col-span-2">
            <div className="rounded-2xl px-5 py-4 flex items-center gap-4 active:scale-95 transition-transform shadow-sm bg-[#E8251F]">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <span className="text-white font-extrabold text-base leading-none">1688</span>
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm text-white">1688 소싱 검색</div>
                <div className="text-xs mt-0.5 text-red-100">중국어로 도매 상품 바로 조회</div>
              </div>
              <span className="text-white/40 text-lg">›</span>
            </div>
          </Link>
        </div>
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
