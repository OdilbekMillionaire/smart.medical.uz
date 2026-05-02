'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Pencil, Printer, Save, Send, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { getQRCodeUrl, printDocument } from '@/lib/export';
import type { Document } from '@/types';

const STATUS_COLORS: Record<Document['status'], string> = {
  draft: 'bg-slate-100 text-slate-700',
  pending_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
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

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, userRole } = useAuth();
  const { t, lang } = useLanguage();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [saving, setSaving] = useState(false);

  const dateLocale: Record<string, string> = useMemo(() => ({
    uz: 'uz-UZ',
    uz_cyrillic: 'uz-UZ',
    ru: 'ru-RU',
    en: 'en-US',
    kk: 'kk-KZ',
  }), []);

  const statusLabels: Record<Document['status'], string> = {
    draft: t.documents.draft,
    pending_review: t.documents.pending,
    approved: t.documents.approved,
    rejected: t.documents.rejected,
  };

  const loadDocument = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const data = await requestJson<Document>(`/api/documents/${id}`, token);
      setDocument(data);
      setEditTitle(data.title);
      setEditContent(data.content);
      setReviewNote(data.reviewNote ?? '');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
      router.push('/dashboard/documents');
    } finally {
      setLoading(false);
    }
  }, [id, router, t.common.error, user]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  async function patchDocument(updates: Partial<Document>) {
    if (!user || !document) return null;
    const token = await user.getIdToken();
    const updated = await requestJson<Document>(`/api/documents/${document.id}`, token, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    setDocument(updated);
    return updated;
  }

  async function handleSaveEdit() {
    if (!document) return;
    if (!editTitle.trim() || !editContent.trim()) {
      toast.error(t.common.required);
      return;
    }

    setSaving(true);
    try {
      await patchDocument({ title: editTitle.trim(), content: editContent.trim() });
      setEditing(false);
      toast.success(t.common.success);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitForReview() {
    if (!document) return;
    setSaving(true);
    try {
      await patchDocument({ status: 'pending_review' });
      toast.success(t.documents.submitReview);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    } finally {
      setSaving(false);
    }
  }

  async function handleAdminAction(status: 'approved' | 'rejected') {
    if (!document) return;
    setSaving(true);
    try {
      await patchDocument({ status, reviewNote: reviewNote.trim() || undefined });
      toast.success(status === 'approved' ? t.documents.approved : t.documents.rejected);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (!document) return null;

  const isOwner = document.ownerId === user?.uid;
  const canEdit = isOwner && document.status === 'draft';
  const formattedDate = new Date(document.updatedAt).toLocaleDateString(dateLocale[lang] ?? 'uz-UZ');

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/documents">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            {t.common.back}
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold">{document.title}</h1>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[document.status]}`}>
              {statusLabels[document.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {document.type} - {formattedDate}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
          <CardTitle className="text-base">{t.documents.contentLabel}</CardTitle>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => printDocument({
                title: document.title,
                body: document.content,
                status: document.status,
                date: formattedDate,
              })}
            >
              <Printer className="h-4 w-4" />
              {t.common.print}
            </Button>
            {canEdit && !editing && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4" />
                {t.common.edit}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>{t.documents.titleLabel}</Label>
                <Input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t.documents.contentLabel}</Label>
                <Textarea
                  value={editContent}
                  onChange={(event) => setEditContent(event.target.value)}
                  className="min-h-[360px] font-mono text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                  {t.common.cancel}
                </Button>
                <Button onClick={handleSaveEdit} disabled={saving} className="gap-1.5">
                  <Save className="h-4 w-4" />
                  {t.common.save}
                </Button>
              </div>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 font-mono text-sm leading-relaxed">
              {document.content}
            </pre>
          )}
        </CardContent>
      </Card>

      {document.aiOpinion && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-blue-800">{t.documents.aiOpinion}</p>
            <p className="mt-1 text-sm text-blue-700">{document.aiOpinion}</p>
          </CardContent>
        </Card>
      )}

      {document.reviewNote && (
        <Card className={document.status === 'rejected' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <CardContent className="p-4">
            <p className={document.status === 'rejected' ? 'text-sm font-medium text-red-700' : 'text-sm font-medium text-green-800'}>
              {t.documents.reviewNote}
            </p>
            <p className={document.status === 'rejected' ? 'mt-1 text-sm text-red-600' : 'mt-1 text-sm text-green-700'}>
              {document.reviewNote}
            </p>
          </CardContent>
        </Card>
      )}

      {document.status === 'approved' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-4 p-4">
            <Image
              src={getQRCodeUrl(
                typeof window !== 'undefined'
                  ? `${window.location.origin}/dashboard/documents/${document.id}`
                  : `/dashboard/documents/${document.id}`,
                120
              )}
              alt="QR kod"
              width={96}
              height={96}
              unoptimized
              className="h-24 w-24 shrink-0 rounded border border-green-200 bg-white p-1"
            />
            <div>
              <p className="text-sm font-semibold text-green-800">{t.documents.approved}</p>
              <p className="mt-1 text-xs text-green-700">{t.documents.qrVerifyHint}</p>
              <p className="mt-2 font-mono text-xs text-green-600 opacity-70">ID: {document.id}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isOwner && document.status === 'draft' && !editing && (
        <Button className="w-full gap-2" onClick={handleSubmitForReview} disabled={saving}>
          <Send className="h-4 w-4" />
          {t.documents.submitReview}
        </Button>
      )}

      {userRole === 'admin' && document.status === 'pending_review' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.documents.reviewNote}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>{t.documents.reviewNote}</Label>
              <Textarea
                placeholder={t.documents.reviewNotePlaceholder}
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                className="min-h-[90px]"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                className="gap-1.5 bg-green-600 hover:bg-green-700"
                onClick={() => handleAdminAction('approved')}
                disabled={saving}
              >
                <CheckCircle className="h-4 w-4" />
                {t.documents.approve}
              </Button>
              <Button
                variant="destructive"
                className="gap-1.5"
                onClick={() => handleAdminAction('rejected')}
                disabled={saving}
              >
                <XCircle className="h-4 w-4" />
                {t.documents.reject}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
