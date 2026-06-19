"use client";

import { useEffect, useState } from "react";

/**
 * 안드로이드 TWA(구글 플레이 앱) 안에서 열렸는지 감지하는 훅.
 *
 * 구글 플레이 정책상 앱 안에서 디지털 구독을 외부결제(토스)로 받는 것이 금지되므로,
 * 앱으로 열렸을 때는 결제/업그레이드 버튼을 숨기는 용도로 사용한다.
 * (웹 브라우저로 접속한 고객은 영향 없음 — 토스 결제 그대로 사용)
 *
 * 감지 방식: TWA로 실행되면 최초 로딩 시 document.referrer 가
 * "android-app://kr.sourcingkit.app" 형태로 들어온다. 이를 sessionStorage 에
 * 저장해 같은 세션 동안 유지한다.
 */
export function useIsTwa(): boolean {
  const [isTwa, setIsTwa] = useState(false);

  useEffect(() => {
    try {
      const ref = document.referrer || "";
      if (
        sessionStorage.getItem("isTwa") === "true" ||
        ref.startsWith("android-app://")
      ) {
        sessionStorage.setItem("isTwa", "true");
        setIsTwa(true);
      }
    } catch {
      // sessionStorage 접근 불가 시 무시 (웹으로 간주)
    }
  }, []);

  return isTwa;
}
