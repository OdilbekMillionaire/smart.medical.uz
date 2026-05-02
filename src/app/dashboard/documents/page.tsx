'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CheckCircle2, Clock, Eye, FileText, Plus, Search, Send, XCircle } from 'lucide-react';
import type { Document } from '@/types';
import { PageHeader } from '@/components/shared/PageHeader';
import { FilterBar } from '@/components/shared/FilterBar';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonList } from '@/components/shared/SkeletonList';

const STATUS_COLORS: Record<Document['status'], string> = {
  draft: 'bg-slate-100 text-slate-700',
  pending_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const STATUS_ICONS: Record<Document['status'], ReactNode> = {
  draft: <FileText className="h-3.5 w-3.5" />,
  pending_review: <Clock className="h-3.5 w-3.5" />,
  approved: <CheckCircle2 className="h-3.5 w-3.5" />,
  rejected: <XCircle className="h-3.5 w-3.5" />,
};

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

export default function DocumentsPage() {
  const { user, userRole } = useAuth();
  const { t, lang } = useLanguage();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Document['status'] | 'all'>('all');
  const [search, setSearch] = useState('');

  const statusLabels: Record<Document['status'], string> = {
    draft: t.documents.draft,
    pending_review: t.documents.pending,
    approved: t.documents.approved,
    rejected: t.documents.rejected,
  };

  const dateLocale: Record<string, string> = {
    uz: 'uz-UZ',
    uz_cyrillic: 'uz-UZ',
    ru: 'ru-RU',
    en: 'en-US',
    kk: 'kk-KZ',
  };

  const loadDocuments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const data = await requestJson<{ documents: Document[] }>('/api/documents', token);
      setDocuments(data.documents);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }, [t.common.error, user]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((doc) => {
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      const matchesSearch = !q || doc.title.toLowerCase().includes(q) || doc.type.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [documents, search, statusFilter]);

  async function updateStatus(doc: Document, status: 'pending_review') {
    if (!user) return;
    setBusyId(doc.id);
    try {
      const token = await user.getIdToken();
      const updated = await requestJson<Document>(`/api/documents/${doc.id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setDocuments((prev) => prev.map((item) => item.id === doc.id ? updated : item));
      toast.success(t.documents.submitReview);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    } finally {
      setBusyId(null);
    }
  }

  const filterOptions = (['all', 'draft', 'pending_review', 'approved', 'rejected'] as const).map((f) => ({
    key: f,
    label: f === 'all' ? t.common.all : statusLabels[f],
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<FileText className="w-6 h-6 text-blue-600" />}
        title={userRole === 'admin' ? t.documents.adminTitle : t.documents.myTitle}
        subtitle={t.documents.emptyDesc}
        actions={
          <Link href="/dashboard/documents/new">
            <Button className="gap-2"><Plus className="h-4 w-4" />{t.documents.new}</Button>
          </Link>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterBar options={filterOptions} value={statusFilter} onChange={(v) => setStatusFilter(v as Document['status'] | 'all')} />
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.common.search} className="pl-9" />
        </div>
      </div>

      {loading ? (
        <SkeletonList count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-12 h-12" />}
          title={t.documents.empty}
          description={t.documents.emptyDesc}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold">{doc.title}</h3>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[doc.status]}`}>
                        {STATUS_ICONS[doc.status]}
                        {statusLabels[doc.status]}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{doc.content}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>{t.common.type}: {t.documents.types[doc.type as keyof typeof t.documents.types] ?? doc.type}</span>
                      <span>{t.common.updated}: {new Date(doc.updatedAt).toLocaleDateString(dateLocale[lang] ?? 'uz-UZ')}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link href={`/dashboard/documents/${doc.id}`}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Eye className="h-4 w-4" />
                        {t.common.view}
                      </Button>
                    </Link>
                    {doc.status === 'draft' && userRole !== 'admin' && (
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => updateStatus(doc, 'pending_review')}
                        disabled={busyId === doc.id}
                      >
                        <Send className="h-4 w-4" />
                        {t.documents.submitReview}
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
