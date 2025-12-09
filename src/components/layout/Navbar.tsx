"use client"

import { useLanguage } from "@/lib/i18n/language-context";
import Link from "next/link";
import { LanguageToggle } from "./LanguageToggle";

export function Navbar() {
  const { t } = useLanguage();

  return (
    <header className="border-b sticky top-0 bg-white/80 backdrop-blur-md z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <span className="text-primary">RUN</span>HOUSE
          <span className="px-1.5 py-0.5 rounded text-xs bg-black text-white font-medium">CUSTOM</span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
          <Link href="/" className="text-black">{t('common.studio')}</Link>
          <Link href="/dashboard" className="hover:text-black">{t('common.myOrders')}</Link>
          <Link href="/gallery" className="hover:text-black">{t('common.showcase')}</Link>
        </nav>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <div className="w-8 h-8 bg-gray-100 rounded-full" />
        </div>
      </div>
    </header>
  );
}
