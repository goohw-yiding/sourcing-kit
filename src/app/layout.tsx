import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { AppProviders } from "@/components/AppProviders";
import { SessionProvider } from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "소싱킷 | 무역 소싱 관리",
  description: "이우 무역상을 위한 소싱 원가계산 앱",
  manifest: "/manifest.json",
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
  var T={navy:['#0F2D59','#1E4080','#EEF2F8'],forest:['#1A4731','#2D7A50','#ECFDF5'],charcoal:['#1C1C2E','#2D2D44','#F5F3FF']};
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
            </AppProviders>
          </SessionProvider>
        </div>
      </body>
    </html>
  );
}
