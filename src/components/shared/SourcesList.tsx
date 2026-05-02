'use client';

import { FileText, Globe } from 'lucide-react';

export interface AiSource {
  type: 'rag' | 'web';
  title: string;
  uri?: string;
}

export function SourcesList({ sources, label = 'Manbalar' }: { sources: AiSource[]; label?: string }) {
  if (!sources.length) return null;
  const rag = sources.filter((s) => s.type === 'rag');
  const web = sources.filter((s) => s.type === 'web');

  return (
    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/50">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {rag.map((s, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50"
            title={s.uri}
          >
            <FileText className="h-2.5 w-2.5 shrink-0" />
            {s.title}
          </span>
        ))}
        {web.map((s, i) =>
          s.uri ? (
            <a
              key={i}
              href={s.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
            >
              <Globe className="h-2.5 w-2.5 shrink-0" />
              {s.title}
            </a>
          ) : (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/50">
              <Globe className="h-2.5 w-2.5 shrink-0" />
              {s.title}
            </span>
          )
        )}
      </div>
    </div>
  );
}
