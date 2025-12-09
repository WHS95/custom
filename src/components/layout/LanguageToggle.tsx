"use client"

import { useLanguage } from "@/lib/i18n/language-context";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-md">
      <Button
        variant="ghost" 
        size="sm"
        className={`h-7 px-2 text-xs font-medium rounded-sm ${language === 'ko' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-900'}`}
        onClick={() => setLanguage('ko')}
      >
        KR
      </Button>
      <Button 
        variant="ghost"
        size="sm"
        className={`h-7 px-2 text-xs font-medium rounded-sm ${language === 'en' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-900'}`}
        onClick={() => setLanguage('en')}
      >
        EN
      </Button>
    </div>
  );
}
