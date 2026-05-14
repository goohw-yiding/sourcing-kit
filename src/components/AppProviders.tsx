"use client";

import { useEffect, useState } from "react";
import { Onboarding } from "./Onboarding";
import { getStoredTheme, getStoredUserName, applyTheme } from "@/lib/themes";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 테마 적용 (FOUC 방지용 inline script로도 처리되지만 React 상태 동기화)
    applyTheme(getStoredTheme());
    // 온보딩 여부 확인
    const name = getStoredUserName();
    if (!name) setShowOnboarding(true);
    setReady(true);
  }, []);

  if (!ready) return null; // 깜빡임 방지 — inline script가 테마 적용 처리

  if (showOnboarding) {
    return <Onboarding onDone={() => setShowOnboarding(false)} />;
  }

  return <>{children}</>;
}
