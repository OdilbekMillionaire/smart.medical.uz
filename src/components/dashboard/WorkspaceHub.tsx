'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, ChevronRight, ExternalLink, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type WorkspaceHubItem = {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  badge?: string;
  accent?: string; // tailwind bg class e.g. 'bg-blue-500'
};

export type WorkspaceHubMetric = {
  label: string;
  value: string;
  detail: string;
};

export type WorkspaceHubLink = {
  title: string;
  href: string;
  icon?: ReactNode;
  description?: string;
};

type WorkspaceHubProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: WorkspaceHubItem[];
  highlights?: string[];
  metrics?: WorkspaceHubMetric[];
  workflow?: string[];
  workflowTitle?: string;
  quickActions?: WorkspaceHubLink[];
  quickActionsTitle?: string;
  related?: WorkspaceHubLink[];
  relatedTitle?: string;
  overviewLabel?: string;
  workflowLabel?: string;
  connectedLabel?: string;
  startHereLabel?: string;
  actionLabel?: string;
  // Optional gradient override: two tailwind color stops e.g. ['from-blue-600','to-cyan-500']
  gradientFrom?: string;
  gradientTo?: string;
};

const ITEM_ACCENTS = [
  'bg-cyan-500', 'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-teal-500',
];

export function WorkspaceHub({
  eyebrow,
  title,
  description,
  items,
  highlights = [],
  metrics = [],
  workflow = [],
  workflowTitle = 'Workflow',
  quickActions = [],
  quickActionsTitle = 'Quick actions',
  related = [],
  relatedTitle = 'Related workspaces',
  startHereLabel = 'Start here',
  actionLabel = 'Open',
  gradientFrom = 'from-slate-900',
  gradientTo = 'to-slate-700',
}: WorkspaceHubProps) {
  const primaryAction = quickActions[0] ?? (items[0] ? { title: items[0].title, href: items[0].href, icon: items[0].icon } : null);

  return (
    <div className="space-y-8">
      {/* ── Hero banner ───────────────────────────────────────────────────── */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} px-8 py-10 text-white shadow-lg`}>
        {/* subtle grid pattern overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-white/60">{eyebrow}</p>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
            <p className="text-sm leading-relaxed text-white/75 sm:text-base">{description}</p>
          </div>
          {primaryAction && (
            <Link
              href={primaryAction.href}
              className="inline-flex h-11 w-fit shrink-0 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-slate-900 shadow-md transition hover:bg-white/90 hover:shadow-lg"
            >
              {primaryAction.icon}
              {startHereLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Highlights row */}
        {highlights.length > 0 && (
          <div className="relative mt-8 flex flex-wrap gap-2">
            {highlights.map((h) => (
              <span key={h} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                <Zap className="h-3 w-3 text-yellow-300" />
                {h}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Metric cards ──────────────────────────────────────────────────── */}
      {metrics.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {metrics.map((m, i) => (
            <div key={m.label} className={`relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm`}>
              <div className={`absolute right-0 top-0 h-full w-1 rounded-r-xl ${ITEM_ACCENTS[i % ITEM_ACCENTS.length]}`} />
              <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
              <p className="mt-1.5 text-3xl font-extrabold tracking-tight text-slate-900">{m.value}</p>
              <p className="mt-1 text-xs text-slate-500">{m.detail}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Quick actions (if any) ────────────────────────────────────────── */}
      {quickActions.length > 1 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{quickActionsTitle}</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800"
              >
                {a.icon}
                {a.title}
                <ChevronRight className="h-3 w-3 opacity-50" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Feature cards grid ────────────────────────────────────────────── */}
      <div>
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{actionLabel}</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {items.map((item, i) => {
            const accent = item.accent ?? ITEM_ACCENTS[i % ITEM_ACCENTS.length];
            return (
              <Link key={item.href} href={item.href} className="group block">
                <div className="relative h-full overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:border-transparent group-hover:shadow-md group-hover:shadow-slate-200">
                  {/* top accent bar */}
                  <div className={`absolute inset-x-0 top-0 h-0.5 ${accent} opacity-0 transition-opacity group-hover:opacity-100`} />

                  <div className="mb-4 flex items-start justify-between">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent} text-white shadow-sm`}>
                      {item.icon}
                    </span>
                    {item.badge && (
                      <Badge variant="outline" className="text-xs">{item.badge}</Badge>
                    )}
                  </div>

                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{item.description}</p>

                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-slate-400 transition-colors group-hover:text-cyan-600">
                    {actionLabel}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Workflow steps ────────────────────────────────────────────────── */}
      {workflow.length > 0 && (
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{workflowTitle}</p>
          <div className="relative">
            {/* connecting line */}
            <div className="absolute left-4 top-5 bottom-5 w-px bg-slate-200 hidden sm:block" />
            <div className="space-y-3">
              {workflow.map((step, i) => (
                <div key={step} className="relative flex gap-4 items-start">
                  <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow-sm z-10">
                    {i + 1}
                  </span>
                  <div className="flex-1 rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm">
                    {step}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Related workspaces ────────────────────────────────────────────── */}
      {related.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{relatedTitle}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50"
              >
                <span className="mt-0.5 text-slate-400 group-hover:text-cyan-600 transition-colors">
                  {link.icon ?? <ExternalLink className="h-4 w-4" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">{link.title}</span>
                  {link.description && (
                    <span className="mt-0.5 block text-xs leading-5 text-slate-500">{link.description}</span>
                  )}
                </span>
                <ChevronRight className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-slate-300 group-hover:text-cyan-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
