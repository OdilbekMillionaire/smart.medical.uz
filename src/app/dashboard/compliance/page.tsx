'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Clock, CheckCircle, AlertTriangle, Trash2, Download, Sparkles, Bot } from 'lucide-react';
import { exportComplianceToCSV } from '@/lib/export';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ComplianceItem } from '@/types';
import { differenceInDays, parseISO } from 'date-fns';

async function requestJson<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

const TYPE_COLORS: Record<ComplianceItem['type'], string> = {
  license: 'bg-blue-100 text-blue-700',
  certification: 'bg-purple-100 text-purple-700',
  contract: 'bg-orange-100 text-orange-700',
  protocol: 'bg-teal-100 text-teal-700',
};

function StatusBadge({ item, doneLabel, overdueLabel, daysLabel }: {
  item: ComplianceItem;
  doneLabel: string;
  overdueLabel: string;
  daysLabel: string;
}) {
  const days = differenceInDays(parseISO(item.dueDate), new Date());

  if (item.status === 'done') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
        <CheckCircle className="h-3 w-3" />
        {doneLabel}
      </span>
    );
  }

  if (item.status === 'overdue' || days < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium">
        <AlertTriangle className="h-3 w-3" />
        {overdueLabel} ({Math.abs(days)} {daysLabel})
      </span>
    );
  }

  if (days <= 30) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 text-xs font-medium">
        <Clock className="h-3 w-3" />
        {days} {daysLabel}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-xs font-medium">
      <Clock className="h-3 w-3" />
      {days} {daysLabel}
    </span>
  );
}

export default function CompliancePage() {
  const { user, userRole } = useAuth();
  const { t, lang } = useLanguage();
  const DATE_LOCALE: Record<string, string> = {
    uz: 'uz-UZ',
    uz_cyrillic: 'uz-UZ',
    ru: 'ru-RU',
    en: 'en-US',
    kk: 'kk-KZ',
  };
  const TYPE_LABELS: Record<ComplianceItem['type'], string> = {
    license: t.compliance.types.license,
    certification: t.compliance.types.certification,
    contract: t.compliance.types.contract,
    protocol: t.compliance.types.protocol,
  };
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ComplianceItem['status'] | 'all'>('all');
  const [checking, setChecking] = useState(false);
  const [aiAdvice, setAiAdvice] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const loadItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const data = await requestJson<{ items: ComplianceItem[] }>('/api/compliance', token);
      const now = new Date();
      const updated = data.items.map((item) => ({
        ...item,
        status: item.status === 'done'
          ? 'done' as const
          : parseISO(item.dueDate) < now
          ? 'overdue' as const
          : 'upcoming' as const,
      }));
      setItems(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }, [t.common.error, user]);

  async function runAIAdvisor() {
    if (!user) return;
    setAiLoading(true);
    setAiAdvice('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/compliance/ai-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? t.aiFeatures.error);
      }
      const data = await res.json() as { advice: string };
      setAiAdvice(data.advice);
      toast.success(t.aiFeatures.ready);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.aiFeatures.error);
    } finally {
      setAiLoading(false);
    }
  }

  const runComplianceCheck = async () => {
    if (!user) return;
    setChecking(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/compliance/check', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { success?: boolean; reminded?: number; error?: string };
      if (data.success) {
        toast.success(t.common.success);
        await loadItems();
      } else {
        toast.error(data.error ?? t.common.error);
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  async function markDone(item: ComplianceItem) {
    try {
      if (!user) return;
      const token = await user.getIdToken();
      const updated = await requestJson<ComplianceItem>('/api/compliance', token, {
        method: 'PATCH',
        body: JSON.stringify({ id: item.id, status: 'done' }),
      });
      setItems((prev) => prev.map((i) => i.id === item.id ? updated : i));
      toast.success(t.compliance.markDone);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    }
  }

  async function handleDelete(item: ComplianceItem) {
    try {
      if (!user) return;
      const token = await user.getIdToken();
      await requestJson<{ success: boolean }>('/api/compliance', token, {
        method: 'DELETE',
        body: JSON.stringify({ id: item.id }),
      });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success(t.common.success);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    }
  }

  const filtered = filter === 'all' ? items : items.filter((i) => i.status === filter);

  const overdue = items.filter((i) => i.status === 'overdue').length;
  const upcoming = items.filter((i) => i.status === 'upcoming' && differenceInDays(parseISO(i.dueDate), new Date()) <= 30).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.compliance.title}</h1>
          <p className="text-sm text-muted-foreground">{t.compliance.subtitle}</p>
        </div>
        <div className="flex gap-2">
          {userRole === 'admin' && (
            <Button variant="outline" onClick={runComplianceCheck} disabled={checking} className="gap-2">
              {checking ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-transparent" /> : null}
              {checking ? t.compliance.checkRunning : t.compliance.runCheck}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={runAIAdvisor}
            disabled={aiLoading}
            className="gap-2 border-cyan-300 hover:bg-cyan-50"
          >
            {aiLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            ) : (
              <Sparkles className="h-4 w-4 text-cyan-600" />
            )}
            {t.aiFeatures.advisorBtn}
          </Button>
          <Button
            variant="outline"
            onClick={() => exportComplianceToCSV(
              filtered.map((i) => ({
                title: i.title,
                type: TYPE_LABELS[i.type],
                dueDate: i.dueDate,
                status: i.status,
              }))
            )}
            disabled={filtered.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Link href="/dashboard/compliance/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t.compliance.new}
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      {overdue > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="font-semibold text-red-700">
              {overdue} {t.common.count} {t.compliance.overdue}!
            </p>
          </div>
        </div>
      )}
      {upcoming > 0 && overdue === 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <p className="font-semibold text-orange-700">
              {upcoming} {t.common.count} {t.compliance.upcoming}
            </p>
          </div>
        </div>
      )}

      {/* Feature 4: AI Compliance Smart Advisor (Gemini 2.5 Pro) */}
      {aiAdvice && (
        <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-emerald-50">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-cyan-600" />
              <h3 className="font-semibold text-cyan-900">{t.aiFeatures.complianceAnalysisTitle}</h3>
              <span className="text-xs text-cyan-700 bg-white border border-cyan-200 rounded-full px-2 py-0.5">
                {t.aiFeatures.modelBadge}
              </span>
            </div>
            <div className="rounded-lg bg-white border border-cyan-200 p-4 text-sm whitespace-pre-wrap leading-relaxed">
              {aiAdvice}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 flex-wrap">
        {(['all', 'overdue', 'upcoming', 'done'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f === 'all' ? t.common.all : f === 'overdue' ? t.compliance.overdue : f === 'upcoming' ? t.compliance.upcoming : t.compliance.done}
            <span className="ml-1.5 text-xs opacity-70">
              {f === 'all' ? items.length : items.filter((i) => i.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-14 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{t.compliance.empty}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className={`transition-shadow hover:shadow-md ${
                item.status === 'overdue' ? 'border-red-200' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{item.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[item.type]}`}>
                        {TYPE_LABELS[item.type]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <StatusBadge item={item} doneLabel={t.compliance.done} overdueLabel={t.compliance.overdue} daysLabel={t.compliance.daysRemaining} />
                      <span className="text-xs text-muted-foreground">
                        {t.compliance.dueDateLabel}: {new Date(item.dueDate).toLocaleDateString(DATE_LOCALE[lang] || 'uz-UZ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.status !== 'done' && (
                      <Button variant="outline" size="sm" onClick={() => markDone(item)}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {userRole === 'admin' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
