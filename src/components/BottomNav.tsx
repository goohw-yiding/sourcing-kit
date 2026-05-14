"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calculator, BookOpen, Compass, MoreHorizontal } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const tabs = [
    { href: "/",           icon: Home,          label: t("nav.home") },
    { href: "/calculator", icon: Calculator,    label: t("nav.calc") },
    { href: "/sourcing",   icon: BookOpen,      label: t("nav.sourcing") },
    { href: "/phrases",    icon: Compass,       label: t("nav.field") },
    { href: "/more",       icon: MoreHorizontal,label: t("nav.more") },
  ];

  // 제안서 공유 페이지에서는 하단탭 숨김
  if (pathname.startsWith("/proposal/")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-md mx-auto bg-white border-t border-gray-100 shadow-lg">
        <div className="flex items-stretch justify-around px-1 pt-1.5" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
          {tabs.map((tab) => {
            const isActive =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-xl transition-all active:scale-95 ${
                  isActive ? "text-[var(--primary)]" : "text-gray-400"
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-colors ${isActive ? "bg-[var(--primary-lighter)]" : ""}`}>
                  <tab.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"}`} />
                </div>
                <span className={`text-[10px] font-medium leading-tight ${isActive ? "font-bold text-[var(--primary)]" : ""}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
