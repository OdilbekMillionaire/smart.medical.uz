'use client';

import React from 'react';

// ─── Inline parser: handles **bold**, `code` ──────────────────────────────────
function parseInline(text: string): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldAt = remaining.indexOf('**');
    const codeAt = remaining.indexOf('`');

    const first = Math.min(
      boldAt === -1 ? Infinity : boldAt,
      codeAt === -1 ? Infinity : codeAt,
    );

    if (first === Infinity) {
      nodes.push(remaining);
      break;
    }

    // push plain text before the marker
    if (first > 0) {
      nodes.push(remaining.slice(0, first));
      remaining = remaining.slice(first);
      continue;
    }

    // **bold**
    if (remaining.startsWith('**')) {
      const close = remaining.indexOf('**', 2);
      if (close !== -1) {
        nodes.push(
          <strong key={key++} className="font-semibold text-slate-900 dark:text-slate-100">
            {remaining.slice(2, close)}
          </strong>,
        );
        remaining = remaining.slice(close + 2);
        continue;
      }
    }

    // `code`
    if (remaining.startsWith('`')) {
      const close = remaining.indexOf('`', 1);
      if (close !== -1) {
        nodes.push(
          <code key={key++} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300">
            {remaining.slice(1, close)}
          </code>,
        );
        remaining = remaining.slice(close + 1);
        continue;
      }
    }

    // fallback: consume one char to avoid infinite loop
    nodes.push(remaining[0]);
    remaining = remaining.slice(1);
  }

  return <>{nodes}</>;
}

// ─── Strip leading # symbols from a heading line ──────────────────────────────
function headingText(line: string, prefix: string): string {
  return line.slice(prefix.length).trim();
}

// ─── Main component ──────────────────────────────────────────────────────────
export function AiMarkdown({ text, streaming = false }: { text: string; streaming?: boolean }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  const listItems: { type: 'bullet' | 'ordered'; content: string; num?: string }[] = [];

  function flushList(key: string) {
    if (listItems.length === 0) return;
    const type = listItems[0].type;
    elements.push(
      <div key={key} className="my-1.5 space-y-1">
        {listItems.map((item, idx) =>
          type === 'ordered' ? (
            <div key={idx} className="flex gap-2.5 items-baseline">
              <span className="text-slate-400 dark:text-slate-500 font-bold text-[11px] shrink-0 min-w-[16px] text-right">
                {item.num}.
              </span>
              <span className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-300">
                {parseInline(item.content)}
              </span>
            </div>
          ) : (
            <div key={idx} className="flex gap-2.5 items-start">
              <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
              <span className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-300">
                {parseInline(item.content)}
              </span>
            </div>
          ),
        )}
      </div>,
    );
    listItems.length = 0;
  }

  lines.forEach((line, i) => {
    // ── Headings ──────────────────────────────────────────────────────────────
    if (line.startsWith('#### ')) {
      flushList(`fl-${i}`);
      const txt = headingText(line, '#### ');
      elements.push(
        <h4 key={i} className="font-bold text-[13px] text-slate-800 dark:text-slate-100 mt-3.5 mb-0.5">
          {parseInline(txt)}
        </h4>,
      );
      return;
    }
    if (line.startsWith('### ')) {
      flushList(`fl-${i}`);
      const txt = headingText(line, '### ');
      elements.push(
        <h3 key={i} className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-4 mb-1 border-b border-slate-100 dark:border-slate-700/60 pb-1">
          {parseInline(txt)}
        </h3>,
      );
      return;
    }
    if (line.startsWith('## ')) {
      flushList(`fl-${i}`);
      const txt = headingText(line, '## ');
      elements.push(
        <h2 key={i} className="font-bold text-[15px] text-slate-900 dark:text-slate-50 mt-5 mb-1.5">
          {parseInline(txt)}
        </h2>,
      );
      return;
    }
    if (line.startsWith('# ')) {
      flushList(`fl-${i}`);
      const txt = headingText(line, '# ');
      elements.push(
        <h1 key={i} className="font-bold text-base text-slate-900 dark:text-slate-50 mt-5 mb-2">
          {parseInline(txt)}
        </h1>,
      );
      return;
    }

    // ── Horizontal rule ───────────────────────────────────────────────────────
    if (/^[-*_]{3,}$/.test(line.trim())) {
      flushList(`fl-${i}`);
      elements.push(<hr key={i} className="my-3 border-slate-200 dark:border-slate-700" />);
      return;
    }

    // ── Numbered list ─────────────────────────────────────────────────────────
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      listItems.push({ type: 'ordered', num: numMatch[1], content: numMatch[2] });
      return;
    }

    // ── Bullet list ───────────────────────────────────────────────────────────
    const bulletMatch = line.match(/^([*\-•])\s+(.*)/);
    if (bulletMatch) {
      listItems.push({ type: 'bullet', content: bulletMatch[2] });
      return;
    }

    // ── Empty line ────────────────────────────────────────────────────────────
    if (line.trim() === '') {
      flushList(`fl-${i}`);
      elements.push(<div key={i} className="h-1.5" />);
      return;
    }

    // ── Regular paragraph ─────────────────────────────────────────────────────
    flushList(`fl-${i}`);
    elements.push(
      <p key={i} className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-300">
        {parseInline(line)}
      </p>,
    );
  });

  // flush any trailing list
  flushList('fl-end');

  return (
    <div className="space-y-0.5">
      {elements}
      {streaming && (
        <span className="inline-block w-[2px] h-[13px] bg-slate-600 dark:bg-slate-300 opacity-70 animate-pulse translate-y-[1px] ml-0.5" />
      )}
    </div>
  );
}
