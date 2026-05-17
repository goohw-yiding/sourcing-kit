"use client";

import Link from "next/link";
import { Store, ClipboardList, Search, Calculator, ChevronRight, Palette, User, Check, Pencil, Globe, Plus, Share2, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { THEMES, ThemeId, applyTheme, getStoredTheme, getStoredUserName, setStoredUserName } from "@/lib/themes";
import { LANGS, LangId, useTranslation } from "@/lib/i18n";

interface ProposalSummary { id: string; title: string; shareToken: string; viewedAt?: string | null; createdAt: string; buyer: { name: string }; items: { productId: string }[]; }

export default function MorePage() {
  const { lang, t, changeLang } = useTranslation();
  const [theme, setTheme] = useState<ThemeId>("navy");
  const [userName, setUserName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [greetIdx, setGreetIdx] = useState(0);
  const [buyerCount, setBuyerCount] = useState<number | null>(null);
  const [recentProposals, setRecentProposals] = useState<ProposalSummary[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setTheme(getStoredTheme());
    setUserName(getStoredUserName());
    setGreetIdx(Math.floor(Math.random() * 10));

    // 바이어 수 + 최근 제안서 불러오기
    fetch("/api/buyers").then(r => r.json()).then((d: { id: string }[]) => setBuyerCount(d.length)).catch(() => {});
    fetch("/api/proposals").then(r => r.json()).then((d: ProposalSummary[]) => setRecentProposals(d.slice(0, 3))).catch(() => {});
  }, []);

  const toolMenus = [
    { href: "/suppliers", icon: Store,        label: t("more.suppliers"),   desc: t("more.suppliers_sub"), color: "bg-purple-100 text-purple-600" },
    { href: "/orders",    icon: ClipboardList, label: t("more.orders"),      desc: t("more.orders_sub"),    color: "bg-gray-100 text-gray-600" },
    { href: "/hs",        icon: Search,        label: t("nav.hs"),           desc: t("more.hs_sub"),        color: "bg-blue-100 text-blue-600" },
    { href: "/calculator",icon: Calculator,    label: "원가 계산기",          desc: "CNY → KRW 빠른 계산",   color: "bg-orange-100 text-orange-600" },
  ];

  const handleThemeChange = (id: ThemeId) => { setTheme(id); applyTheme(id); };
  const handleNameSave = () => {
    if (!nameInput.trim()) return;
    setStoredUserName(nameInput.trim());
    setUserName(nameInput.trim());
    setEditingName(false);
  };

  const copyLink = async (token: string) => {
    const url = `${window.location.origin}/proposal/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen pb-28 bg-[#F4F6FA]">
      <header className="bg-[var(--primary)] text-white px-5 pt-14 pb-5">
        <h1 className="text-xl font-bold">{t("more.title")}</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{t("more.subtitle")}</p>
      </header>

      <div className="px-4 py-5 space-y-5">

        {/* ── 내 정보 ── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> {t("more.my_info")}
          </p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {editingName ? (
              <div className="flex gap-2 px-4 py-4">
                <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
                  placeholder={t("more.name_ph")} maxLength={20} autoFocus
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400" />
                <button onClick={handleNameSave} disabled={!nameInput.trim()}
                  className="px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40 bg-[var(--primary)]">
                  {t("more.save")}
                </button>
                <button onClick={() => setEditingName(false)} className="px-3 py-2.5 rounded-xl text-gray-500 text-sm bg-gray-100">
                  {t("more.cancel")}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 px-4 py-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-white text-xl font-bold shadow-sm"
                  style={{ background: "var(--primary)" }}>
                  {userName ? userName.slice(0, 1).toUpperCase() : "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 leading-snug">{t(`greet.${greetIdx}`)}</p>
                  <p className="text-xs text-gray-400 mt-1 truncate">{userName || "—"}</p>
                </div>
                <button onClick={() => { setNameInput(userName); setEditingName(true); }}
                  className="flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl shrink-0">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── 바이어에게 제안 ── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide flex items-center gap-1.5">
            📋 바이어에게 제안
          </p>

          {/* 상단 액션 카드 */}
          <div className="bg-[var(--primary)] rounded-2xl p-4 shadow-sm mb-2">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white font-bold text-base">제안서 관리</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                  바이어 {buyerCount !== null ? `${buyerCount}명` : "—"} · 제안서 {recentProposals.length > 0 ? `${recentProposals.length}건+` : "없음"}
                </p>
              </div>
              {/* 새 제안서 버튼 */}
              <Link href="/proposals?new=1">
                <button className="flex items-center gap-1.5 bg-white text-[var(--primary)] px-4 py-2.5 rounded-xl font-bold text-sm shadow active:scale-95 transition-transform">
                  <Plus className="w-4 h-4" />
                  새 제안서
                </button>
              </Link>
            </div>

            {/* 빠른 링크 */}
            <div className="grid grid-cols-2 gap-2">
              <Link href="/proposals">
                <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white border border-white/30 active:opacity-70">
                  <ClipboardList className="w-4 h-4" />
                  제안서 목록
                </div>
              </Link>
              <Link href="/buyers">
                <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white border border-white/30 active:opacity-70">
                  👥 바이어 관리
                </div>
              </Link>
            </div>
          </div>

          {/* 최근 제안서 미리보기 */}
          {recentProposals.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-50 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">최근 제안서</span>
                <Link href="/proposals" className="text-xs text-[var(--primary)] font-medium">전체보기 →</Link>
              </div>
              {recentProposals.map((pr, i) => (
                <div key={pr.id} className={`flex items-center gap-3 px-4 py-3 ${i < recentProposals.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">{pr.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {pr.buyer.name} · {pr.items.length}개 품목
                      {pr.viewedAt && <span className="ml-1.5 text-green-500 font-medium">열람됨 ✓</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link href={`/proposal/${pr.shareToken}`} target="_blank"
                      className="p-2 rounded-xl bg-gray-100 text-gray-500 active:opacity-70">
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <button onClick={() => copyLink(pr.shareToken)}
                      className={`p-2 rounded-xl active:opacity-70 transition-colors ${copied === pr.shareToken ? "bg-green-100 text-green-600" : "bg-green-600 text-white"}`}>
                      {copied === pr.shareToken ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {recentProposals.length === 0 && (
            <div className="bg-white rounded-2xl p-5 text-center border border-dashed border-gray-200">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm text-gray-500">아직 제안서가 없어요</p>
              <p className="text-xs text-gray-400 mt-0.5">소싱 상품을 바이어에게 제안해보세요</p>
            </div>
          )}
        </div>

        {/* ── 도구 ── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">{t("more.menu")}</p>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            {toolMenus.map((m, i) => (
              <Link key={m.href} href={m.href}>
                <div className={`flex items-center gap-4 px-4 py-4 active:bg-gray-50 transition-colors ${i < toolMenus.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <div className={`w-11 h-11 rounded-2xl ${m.color} flex items-center justify-center shrink-0`}>
                    <m.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm">{m.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{m.desc}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── 언어 선택 ── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" /> {t("more.lang")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {LANGS.map((l) => {
              const active = lang === l.id;
              return (
                <button key={l.id} onClick={() => changeLang(l.id as LangId)}
                  className={`flex items-center gap-2.5 px-3 py-3 rounded-2xl border-2 transition-all ${active ? "border-gray-900 bg-white shadow-md" : "border-gray-200 bg-white"}`}>
                  <span className="text-xl leading-none">{l.flag}</span>
                  <div className="flex-1 text-left min-w-0">
                    <div className={`text-sm font-semibold truncate ${active ? "text-gray-900" : "text-gray-700"}`}>{l.label}</div>
                  </div>
                  {active && (
                    <div className="w-4 h-4 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 테마 선택 ── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" /> {t("more.theme")}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map((th) => {
              const active = theme === th.id;
              return (
                <button key={th.id} onClick={() => handleThemeChange(th.id as ThemeId)}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${active ? "border-gray-900 bg-white shadow-md" : "border-gray-200 bg-white"}`}>
                  <div className="w-full h-14 rounded-xl overflow-hidden flex flex-col" style={{ background: th.previewBg }}>
                    <div className="h-3" style={{ background: th.previewAccent }} />
                    <div className="flex-1 flex items-center justify-center px-2">
                      <div className="flex-1 h-1.5 rounded bg-white/30" />
                    </div>
                    <div className="h-2 mx-2 mb-1.5 rounded" style={{ background: th.previewAccent }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-800">{th.label}</span>
                  <span className="text-[10px] text-gray-400 leading-tight text-center">{th.desc}</span>
                  {active && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
