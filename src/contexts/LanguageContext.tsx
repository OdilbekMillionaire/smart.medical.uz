'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { uz } from '@/i18n/messages/uz';
import { ru } from '@/i18n/messages/ru';
import { en } from '@/i18n/messages/en';
import { uz_cyrillic } from '@/i18n/messages/uz_cyrillic';
import { kk } from '@/i18n/messages/kk';
import type { Translations } from '@/i18n/messages/uz';

export type Language = 'uz' | 'uz_cyrillic' | 'ru' | 'en' | 'kk';

const MESSAGES: Record<Language, Translations> = {
  uz,
  uz_cyrillic,
  ru,
  en,
  kk,
};

export const LANGUAGE_LABELS: Record<Language, string> = {
  uz: "O'zbek (Lotin)",
  uz_cyrillic: 'Ўзбек (Кирил)',
  ru: 'Русский',
  en: 'English',
  kk: 'Qaraqalpaq',
};

const STORAGE_KEY = 'sma_language';

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'uz',
  setLang: () => undefined,
  t: uz,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('uz');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored && stored in MESSAGES) setLangState(stored);
  }, []);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: MESSAGES[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
