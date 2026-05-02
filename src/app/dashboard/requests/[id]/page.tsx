'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Bot, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import type { Request } from '@/types';

const STATUS_COLORS: Record<Request['status'], string> = {
  received: 'bg-blue-100 text-blue-700',
  in_review: 'bg-orange-100 text-orange-700',
  replied: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-600',
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

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, userRole } = useAuth();
  const { t, lang } = useLanguage();
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const statusLabels: Record<Request['status'], string> = {
    received: t.requests.received,
    in_review: t.requests.inReview,
    replied: t.requests.replied,
    closed: t.requests.closed,
  };

  const dateLocale: Record<string, string> = {
    uz: 'uz-UZ',
    uz_cyrillic: 'uz-UZ',
    ru: 'ru-RU',
    en: 'en-US',
    kk: 'kk-KZ',
  };

  const loadRequest = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const data = await requestJson<Request>(`/api/requests/${id}`, token);
      setRequest(data);
      setReply(data.draftReplyId ?? '');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
      router.push('/dashboard/requests');
    } finally {
      setLoading(false);
    }
  }, [id, router, t.common.error, user]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  async function patchRequest(updates: Partial<Request> & { generateDraftReply?: boolean }) {
    if (!user || !request) return null;
    const token = await user.getIdToken();
    const updated = await requestJson<Request>(`/api/requests/${request.id}`, token, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    setRequest(updated);
    return updated;
  }

  async function handleAIDraft() {
    if (!request) return;
    setDraftLoading(true);
    try {
      const updated = await patchRequest({ generateDraftReply: true });
      if (updated?.draftReplyId) {
        setReply(updated.draftReplyId);
      }
      toast.success(t.aiFeatures.ready);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.aiFeatures.error);
    } finally {
      setDraftLoading(false);
    }
  }

  async function handleStatusChange(status: Request['status']) {
    if (!request) return;
    setSaving(true);
    try {
      await patchRequest({ status });
      toast.success(t.common.success);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    } finally {
      setSaving(false);
    }
  }

  async function handleSendReply() {
    if (!request || !reply.trim()) {
      toast.error(t.requests.replyPlaceholder);
      return;
    }
    setSaving(true);
    try {
      await patchRequest({
        status: 'replied',
        assignedTo: user?.uid,
        draftReplyId: reply.trim(),
      });
      toast.success(t.common.success);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!request) return null;

  const canRespond = userRole === 'admin' || request.toClinicId === user?.uid;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/requests">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            {t.common.back}
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold">{request.subject}</h1>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[request.status]}`}>
              {statusLabels[request.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(request.createdAt).toLocaleDateString(dateLocale[lang] ?? 'uz-UZ')}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.requests.requestText}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{request.body}</p>
          {request.aiClassification && (
            <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
              <p className="text-xs font-medium text-blue-700">{t.requests.aiClassification}</p>
              <p className="mt-1 text-sm text-blue-600">{request.aiClassification}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {canRespond && (
        <>
          <div className="flex flex-wrap gap-2">
            {(['received', 'in_review', 'replied', 'closed'] as const).map((status) => (
              <Button
                key={status}
                variant={request.status === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange(status)}
                disabled={saving || request.status === status}
              >
                {statusLabels[status]}
              </Button>
            ))}
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">{t.requests.replyTitle}</CardTitle>
              <Button variant="outline" size="sm" onClick={handleAIDraft} disabled={draftLoading} className="gap-1.5">
                {draftLoading ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                ) : (
                  <Bot className="h-3.5 w-3.5" />
                )}
                {t.aiFeatures.draftReply}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {request.draftReplyId && (
                <div className="flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2">
                  <Bot className="h-3.5 w-3.5 text-cyan-600" />
                  <p className="text-xs text-cyan-700">{t.aiFeatures.draftReplyHint}</p>
                </div>
              )}
              <Textarea
                placeholder={t.requests.replyPlaceholder}
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                className="min-h-[160px]"
              />
              <Button className="w-full gap-2" onClick={handleSendReply} disabled={saving || !reply.trim()}>
                <Send className="h-4 w-4" />
                {t.requests.saveReply}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
