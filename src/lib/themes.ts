interface ThemeVars {
  primary: string;
  primaryLight: string;
  primaryLighter: string;
}

interface Theme {
  id: string;
  label: string;
  desc: string;
  color: string;
  previewBg: string;
  previewAccent: string;
  vars: ThemeVars;
}

export const THEMES: Theme[] = [
  {
    id: "navy",
    label: "소싱블루",
    desc: "전문적인 네이비",
    color: "#0F2D59",
    previewBg: "#0F2D59",
    previewAccent: "#1E4080",
    vars: { primary: "#0F2D59", primaryLight: "#1E4080", primaryLighter: "#EEF2F8" },
  },
  {
    id: "forest",
    label: "포레스트",
    desc: "차분한 딥그린",
    color: "#1A4731",
    previewBg: "#1A4731",
    previewAccent: "#2D7A50",
    vars: { primary: "#1A4731", primaryLight: "#2D7A50", primaryLighter: "#ECFDF5" },
  },
  {
    id: "charcoal",
    label: "차콜다크",
    desc: "모던 다크",
    color: "#1C1C2E",
    previewBg: "#1C1C2E",
    previewAccent: "#2D2D44",
    vars: { primary: "#1C1C2E", primaryLight: "#2D2D44", primaryLighter: "#F5F3FF" },
  },
  {
    id: "sky",
    label: "스카이블루",
    desc: "밝고 경쾌한 블루",
    color: "#1565C0",
    previewBg: "#1565C0",
    previewAccent: "#1E88E5",
    vars: { primary: "#1565C0", primaryLight: "#1E88E5", primaryLighter: "#E3F2FD" },
  },
];

export type ThemeId = "navy" | "forest" | "charcoal" | "sky";

/** CSS 변수를 document.documentElement.style로 직접 주입 (Tailwind v4 호환) */
export function applyTheme(id: ThemeId) {
  const theme = THEMES.find((t) => t.id === id);
  if (!theme) return;
  const root = document.documentElement;
  root.style.setProperty("--primary", theme.vars.primary);
  root.style.setProperty("--primary-light", theme.vars.primaryLight);
  root.style.setProperty("--primary-lighter", theme.vars.primaryLighter);
  root.setAttribute("data-theme", id);
  localStorage.setItem("theme", id);
}

export function getStoredTheme(): ThemeId {
  try {
    const t = localStorage.getItem("theme") as ThemeId | null;
    if (t && THEMES.some((th) => th.id === t)) return t;
  } catch {}
  return "navy";
}

export function getStoredUserName(): string {
  try { return localStorage.getItem("userName") || ""; } catch { return ""; }
}

export function setStoredUserName(name: string) {
  try { localStorage.setItem("userName", name); } catch {}
}
