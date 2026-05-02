'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, MessageSquare, Clock, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Request } from '@/types';
import { PageHeader } from '@/components/shared/PageHeader';
import { FilterBar } from '@/components/shared/FilterBar';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonList } from '@/components/shared/SkeletonList';

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

export default function RequestsPage() {
  const { user, userRole } = useAuth();
  const { t, lang } = useLanguage();
  const DATE_LOCALE: Record<string, string> = { uz: 'uz-UZ', uz_cyrillic: 'uz-UZ', ru: 'ru-RU', en: 'en-US', kk: 'kk-KZ' };
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Request['status'] | 'all'>('all');

  const STATUS_MAP: Record<Request['status'], { label: string; color: string }> = {
    received: { label: t.requests.received, color: 'bg-blue-100 text-blue-700' },
    in_review: { label: t.requests.inReview, color: 'bg-orange-100 text-orange-700' },
    replied: { label: t.requests.replied, color: 'bg-green-100 text-green-700' },
    closed: { label: t.requests.closed, color: 'bg-slate-100 text-slate-600' },
  };

  const loadRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const data = await requestJson<{ requests: Request[] }>('/api/requests', token);
      setRequests(data.requests);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }, [t.common.error, user]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  const filterOptions = (['all', 'received', 'in_review', 'replied', 'closed'] as const).map((f) => ({
    key: f,
    label: f === 'all' ? t.common.all : STATUS_MAP[f].label,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<MessageSquare className="w-6 h-6 text-purple-600" />}
        title={t.requests.title}
        subtitle={userRole === 'admin' ? t.requests.adminTitle : t.requests.myTitle}
        actions={
          <Link href="/dashboard/requests/new">
            <Button className="gap-2"><Plus className="h-4 w-4" />{t.requests.new}</Button>
          </Link>
        }
      />

      <FilterBar options={filterOptions} value={filter} onChange={(v) => setFilter(v as Request['status'] | 'all')} />

      {loading ? (
        <SkeletonList count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-12 h-12" />}
          title={t.requests.empty}
          description={t.requests.emptyDesc}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const s = STATUS_MAP[req.status];
            return (
              <Card key={req.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{req.subject}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.color}`}>
                          {s.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{req.body}</p>
                      {req.aiClassification && (
                        <p className="text-xs text-blue-600 mt-1">AI: {req.aiClassification}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(req.createdAt).toLocaleDateString(DATE_LOCALE[lang] || 'uz-UZ')}
                      </div>
                    </div>
                    <Link href={`/dashboard/requests/${req.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        {t.common.view}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
