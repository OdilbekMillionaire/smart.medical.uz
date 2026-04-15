'use client';

import { useLanguage, LANGUAGE_LABELS, type Language } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function LanguageSwitcher({
  variant = 'default',
  direction = 'down',
}: {
  variant?: 'default' | 'compact';
  direction?: 'up' | 'down';
}) {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const dropClass = direction === 'up'
    ? 'absolute right-0 bottom-full mb-1 z-50'
    : 'absolute right-0 top-full mt-1 z-50';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors ${variant === 'compact' ? 'px-2 py-1 text-xs' : ''}`}
      >
        <Globe className={variant === 'compact' ? 'h-3 w-3' : 'h-4 w-4'} />
        <span>{variant === 'compact' ? lang.toUpperCase().replace('_CYRILLIC', 'CYR') : LANGUAGE_LABELS[lang]}</span>
      </button>

      {open && (
        <div className={`${dropClass} min-w-[160px] rounded-lg border border-slate-200 bg-white shadow-xl py-1`}>
          {(Object.keys(LANGUAGE_LABELS) as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => { setLang(l); setOpen(false); }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 ${l === lang ? 'font-semibold text-blue-600 bg-blue-50' : 'text-slate-700'}`}
            >
              {l === lang && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
              {l !== lang && <span className="w-1.5 h-1.5 shrink-0" />}
              {LANGUAGE_LABELS[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
