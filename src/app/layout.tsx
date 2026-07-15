import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { AppProviders } from "@/components/AppProviders";
import { SessionProvider } from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "소싱킷 | 무역 소싱 관리",
  description: "이우 무역상을 위한 소싱 원가계산 앱",
  manifest: "/manifest.json",
  icons: {
    apple: "/icons/icon-192.png",
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192" },
      { url: "/icons/icon-512.png", sizes: "512x512" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0F2D59",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full" suppressHydrationWarning>
      <head>
        {/* 테마 FOUC 방지 — CSS 변수를 style로 직접 주입 (Tailwind v4 호환) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  var T={navy:['#0F2D59','#1E4080','#EEF2F8'],forest:['#1A4731','#2D7A50','#ECFDF5'],charcoal:['#1C1C2E','#2D2D44','#F5F3FF'],sky:['#1565C0','#1E88E5','#E3F2FD']};
  try{var id=localStorage.getItem('theme')||'navy';var v=T[id]||T.navy;var r=document.documentElement;r.style.setProperty('--primary',v[0]);r.style.setProperty('--primary-light',v[1]);r.style.setProperty('--primary-lighter',v[2]);r.setAttribute('data-theme',id);}catch(e){}
})();`,
          }}
        />
      </head>
      <body className="h-full antialiased">
        <div className="max-w-md mx-auto min-h-full relative">
          <SessionProvider>
            <AppProviders>
              {children}
              <BottomNav />
              {/* 사업자 정보 푸터 — 토스페이먼츠 심사 요건 */}
              <footer className="px-5 pt-4 pb-28 border-t border-gray-100 text-[10px] text-gray-400 leading-relaxed space-y-1">
                <p className="font-semibold text-gray-500 text-[11px]">이딩컴퍼니</p>
                <p>대표자 · 구희완 &nbsp;|&nbsp; 사업자등록번호 · 210-29-50637</p>
                <p>경기도 고양시 덕양구 청초로 10, A동 AA17-1723호 (덕은동, 지엘메트로시티한강)</p>
                <p>대표번호 · 010-2623-6907</p>
                <p className="pt-0.5">© 2025 이딩컴퍼니. All rights reserved.</p>
              </footer>
            </AppProviders>
          </SessionProvider>
        </div>
      </body>
    </html>
  );
}
