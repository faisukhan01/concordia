'use client';

import { useEffect } from 'react';
import { useApp } from '@/lib/store';
import { Languages } from 'lucide-react';

// Compact EN/UR language toggle for the portal header.
// Persists choice to sessionStorage via the Zustand store.
// PGC competitor only ships English UI — Urdu toggle is a key differentiator.
export function LanguageToggle() {
  const language = useApp((s) => s.language);
  const toggleLanguage = useApp((s) => s.toggleLanguage);
  const isUrdu = language === 'ur';

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label="Toggle language between English and Urdu"
      title={isUrdu ? 'Switch to English' : 'اردو میں بدلیں'}
      className="group relative h-9 px-2 grid items-center rounded-md hover:bg-accent text-muted-foreground transition overflow-hidden"
    >
      <Languages className="h-[18px] w-[18px] mr-1.5 inline-block align-middle" />
      <span className="text-xs font-bold align-middle">
        {isUrdu ? 'UR' : 'EN'}
      </span>
      {/* Subtle gold underline to indicate interactivity */}
      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 opacity-60 group-hover:opacity-100 transition" />
    </button>
  );
}

// Apply RTL document direction when Urdu is active.
// Drop this once in the role-portal root — it sets <html dir="rtl"> when Urdu.
export function LanguageDirectionSync() {
  const language = useApp((s) => s.language);
  useEffect(() => {
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);
  return null;
}

export default LanguageToggle;
