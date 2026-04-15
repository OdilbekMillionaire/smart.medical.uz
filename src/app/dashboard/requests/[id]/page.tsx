'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getRequestById, updateRequest } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Bot, Send } from 'lucide-react';
import Link from 'next/link';
import { getAuth } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import type { Request } from '@/types';

const STATUS_COLORS: Record<Request['status'], string> = {
  received: 'bg-blue-100 text-blue-700',
  in_review: 'bg-orange-100 text-orange-700',
  replied: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-600',
};

async function getToken(): Promise<string> {
  const auth = getFirebaseAuth();
  const user = getAuth(auth.app).currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, userRole } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [, setDraftReply] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const STATUS_LABELS: Record<Request['status'], string> = {
    received: t.requests.received,
    in_review: t.requests.inReview,
    replied: t.requests.replied,
    closed: t.requests.closed,
  };

  useEffect(() => {
    if (!id) return;
    getRequestById(id)
      .then((req) => {
        if (!req) { toast.error(t.common.noData); router.push('/dashboard/requests'); return; }
        setRequest(req);
        if (req.draftReplyId && !reply) {
          setReply(req.draftReplyId);
          setDraftReply(req.draftReplyId);
        }
      })
      .catch(() => toast.error(t.common.error))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  async function handleAIDraft() {
    if (!request) return;
    setDraftLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          mode: 'reply',
          requestBody: `${t.requests.subject}: ${request.subject}\n\n${request.body}`,
        }),
      });
      if (!res.ok) throw new Error(t.aiFeatures.error);
      const data = await res.json() as { content: string };
      setDraftReply(data.content);
      setReply(data.content);
      toast.success(t.aiFeatures.ready);
    } catch {
      toast.error(t.aiFeatures.error);
    } finally {
      setDraftLoading(false);
    }
  }

  async function handleStatusChange(status: Request['status']) {
    if (!request) return;
    setSaving(true);
    try {
      await updateRequest(request.id, { status });
      setRequest({ ...request, status });
      toast.success(t.common.success);
    } catch {
      toast.error(t.common.error);
    } finally {
      setSaving(false);
    }
  }

  async function handleSendReply() {
    if (!request || !reply.trim()) { toast.error(t.requests.replyPlaceholder); return; }
    setSaving(true);
    try {
      await updateRequest(request.id, {
        status: 'replied',
        assignedTo: user?.uid,
      });
      setRequest({ ...request, status: 'replied', assignedTo: user?.uid });
      toast.success(t.common.success);
      setReply('');
    } catch {
      toast.error(t.common.error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!request) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/requests">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t.common.back}
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold truncate">{request.subject}</h1>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[request.status]}`}>
              {STATUS_LABELS[request.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(request.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{t.requests.requestText}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{request.body}</p>
          {request.aiClassification && (
            <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-xs font-medium text-blue-700">{t.requests.aiClassification}</p>
              <p className="text-sm text-blue-600 mt-1">{request.aiClassification}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin actions */}
      {userRole === 'admin' && (
        <>
          <div className="flex gap-2 flex-wrap">
            {(['received', 'in_review', 'replied', 'closed'] as const).map((s) => (
              <Button
                key={s}
                variant={request.status === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange(s)}
                disabled={saving || request.status === s}
              >
                {STATUS_LABELS[s]}
              </Button>
            ))}
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">{t.requests.replyTitle}</CardTitle>
              <Button variant="outline" size="sm" onClick={handleAIDraft} disabled={draftLoading}>
                {draftLoading ? (
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                    AI...
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Bot className="h-3 w-3" />
                    {t.aiFeatures.draftReply}
                  </span>
                )}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {request.draftReplyId && (
                <div className="flex items-center gap-2 rounded-lg bg-cyan-50 border border-cyan-200 px-3 py-2">
                  <Bot className="h-3.5 w-3.5 text-cyan-600" />
                  <p className="text-xs text-cyan-700">
                    {t.aiFeatures.draftReplyHint}
                  </p>
                </div>
              )}
              <Textarea
                placeholder={t.requests.replyPlaceholder}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="min-h-[160px]"
              />
              <Button className="w-full" onClick={handleSendReply} disabled={saving || !reply.trim()}>
                <Send className="h-4 w-4 mr-2" />
                {t.requests.saveReply}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
