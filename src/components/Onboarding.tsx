"use client";

import { useState } from "react";
import { PackageOpen, ArrowRight, Check } from "lucide-react";
import { THEMES, ThemeId, applyTheme, setStoredUserName } from "@/lib/themes";
import { LANGS, LangId, setStoredLang, translate } from "@/lib/i18n";

interface Props { onDone: () => void; }

export function Onboarding({ onDone }: Props) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [lang, setLang] = useState<LangId>("ko");
  const [name, setName] = useState("");
  const [theme, setTheme] = useState<ThemeId>("navy");

  // CSS 변수 대신 hex 직접 사용 (온보딩은 저장된 테마가 없는 초기 상태)
  const themeColor = THEMES.find((t) => t.id === theme)?.color ?? "#0F2D59";

  // 현재 언어로 번역하는 짧은 함수
  const t = (key: string) => translate(lang, key);

  const handleLangNext = () => {
    setStoredLang(lang);
    setStep(1);
  };

  const handleNameNext = () => {
    if (!name.trim()) return;
    setStep(2);
  };

  const handleFinish = () => {
    setStoredUserName(name.trim());
    applyTheme(theme);
    onDone();
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#F4F6FA] px-6">

      {/* ── STEP 0: 언어 선택 ── */}
      {step === 0 && (
        <div className="w-full max-w-sm space-y-6 animate-fade-in">
          {/* 로고 */}
          <div className="text-center space-y-3">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-lg"
              style={{ background: themeColor }}
            >
              <PackageOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t("ob.app_name")}</h1>
              <p className="text-xs text-gray-500 mt-0.5">{t("ob.app_desc")}</p>
            </div>
          </div>

          {/* 안내 */}
          <div className="space-y-1 text-center">
            <p className="text-lg font-bold text-gray-900">{t("ob.lang_title")}</p>
            <p className="text-sm text-gray-500">{t("ob.lang_sub")}</p>
          </div>

          {/* 언어 그리드 */}
          <div className="grid grid-cols-2 gap-2.5">
            {LANGS.map((l) => {
              const active = lang === l.id;
              return (
                <button
                  key={l.id}
                  onClick={() => setLang(l.id)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all text-left ${
                    active
                      ? "border-gray-900 bg-white shadow-md"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <span className="text-2xl leading-none">{l.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm leading-tight">{l.country}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 truncate">{l.label}</div>
                  </div>
                  {active && (
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: themeColor }}
                    >
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleLangNext}
            className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2"
            style={{ background: themeColor }}
          >
            {t("ob.next")} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ── STEP 1: 이름 입력 ── */}
      {step === 1 && (
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          {/* 로고 */}
          <div className="text-center space-y-3">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-lg"
              style={{ background: themeColor }}
            >
              <PackageOpen className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t("ob.app_name")}</h1>
              <p className="text-sm text-gray-500 mt-1">{t("ob.app_desc")}</p>
            </div>
          </div>

          {/* 안내 */}
          <div className="space-y-2 text-center">
            <p className="text-lg font-bold text-gray-900">{t("ob.name_title")}</p>
            <p className="text-sm text-gray-500">{t("ob.name_sub")}</p>
          </div>

          {/* 입력 */}
          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNameNext()}
              placeholder={t("ob.name_ph")}
              maxLength={20}
              autoFocus
              className="w-full border-2 border-gray-200 focus:border-gray-400 rounded-2xl px-4 py-4 text-base font-medium text-center focus:outline-none bg-white"
            />
            <button
              onClick={handleNameNext}
              disabled={!name.trim()}
              className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
              style={{ background: themeColor }}
            >
              {t("ob.next")} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: 테마 선택 ── */}
      {step === 2 && (
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <p className="text-lg font-bold text-gray-900">{t("ob.theme_title")}</p>
            <p className="text-sm text-gray-500">{t("ob.theme_sub")}</p>
          </div>

          <div className="space-y-3">
            {THEMES.map((th) => (
              <button
                key={th.id}
                onClick={() => { setTheme(th.id as ThemeId); applyTheme(th.id as ThemeId); }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                  theme === th.id
                    ? "border-gray-900 bg-white shadow-md"
                    : "border-gray-200 bg-white"
                }`}
              >
                {/* 미리보기 */}
                <div
                  className="w-12 h-12 rounded-xl shrink-0 flex flex-col overflow-hidden"
                  style={{ background: th.previewBg }}
                >
                  <div className="h-3" style={{ background: th.previewAccent }} />
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-5 h-1 rounded bg-white/40" />
                  </div>
                  <div className="h-2 mx-1 mb-1 rounded" style={{ background: th.previewAccent }} />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-gray-900">{th.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{th.desc}</div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    theme === th.id ? "border-gray-900" : "border-gray-300"
                  }`}
                >
                  {theme === th.id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleFinish}
            className="w-full py-4 rounded-2xl font-bold text-white text-base"
            style={{ background: themeColor }}
          >
            {t("ob.start")}
          </button>
        </div>
      )}

    </div>
  );
}
