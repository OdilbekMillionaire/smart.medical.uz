'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getDocumentById, updateDocument } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, XCircle, Send, Pencil, Save, Printer } from 'lucide-react';
import { printDocument, getQRCodeUrl } from '@/lib/export';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Document } from '@/types';

const STATUS_COLORS: Record<Document['status'], string> = {
  draft: 'bg-slate-100 text-slate-700',
  pending_review: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, userRole } = useAuth();
  const { t, lang } = useLanguage();
  const DATE_LOCALE: Record<string, string> = { uz: 'uz-UZ', uz_cyrillic: 'uz-UZ', ru: 'ru-RU', en: 'en-US', kk: 'kk-KZ' };
  const STATUS_LABELS: Record<Document['status'], string> = {
    draft: t.documents.draft,
    pending_review: t.documents.pending,
    approved: t.documents.approved,
    rejected: t.documents.rejected,
  };
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getDocumentById(id)
      .then((doc) => {
        if (!doc) { toast.error(t.documents.empty); router.push('/dashboard/documents'); return; }
        setDocument(doc);
        setEditContent(doc.content);
        setEditTitle(doc.title);
        setReviewNote(doc.reviewNote ?? '');
      })
      .catch(() => toast.error(t.common.error))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleSaveEdit() {
    if (!document) return;
    setSaving(true);
    try {
      await updateDocument(document.id, {
        title: editTitle,
        content: editContent,
        updatedAt: new Date().toISOString(),
      });
      setDocument({ ...document, title: editTitle, content: editContent });
      setEditing(false);
      toast.success(t.common.success);
    } catch {
      toast.error(t.common.error);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitForReview() {
    if (!document) return;
    setSaving(true);
    try {
      await updateDocument(document.id, { status: 'pending_review', updatedAt: new Date().toISOString() });
      setDocument({ ...document, status: 'pending_review' });
      toast.success(t.documents.submitReview);
    } catch {
      toast.error(t.common.error);
    } finally {
      setSaving(false);
    }
  }

  async function handleAdminAction(action: 'approved' | 'rejected') {
    if (!document) return;
    setSaving(true);
    try {
      await updateDocument(document.id, {
        status: action,
        reviewedBy: user?.uid,
        reviewNote: reviewNote.trim() || undefined,
        updatedAt: new Date().toISOString(),
      });
      setDocument({ ...document, status: action, reviewNote: reviewNote.trim() || undefined });
      toast.success(action === 'approved' ? t.documents.approved : t.documents.rejected);
    } catch {
      toast.error(t.common.error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!document) return null;

  const isOwner = document.ownerId === user?.uid;
  const canEdit = isOwner && (document.status === 'draft' || document.status === 'rejected');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/documents">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t.common.back}
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold truncate">{document.title}</h1>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[document.status]}`}>
              {STATUS_LABELS[document.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {document.type} • {new Date(document.updatedAt).toLocaleDateString(DATE_LOCALE[lang] || 'uz-UZ')}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>{t.documents.contentLabel}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => printDocument({
                title: document.title,
                body: document.content,
                status: document.status,
                date: new Date(document.updatedAt).toLocaleDateString(DATE_LOCALE[lang] || 'uz-UZ'),
              })}
            >
              <Printer className="h-4 w-4 mr-1" />
              {t.common.print}
            </Button>
            {canEdit && !editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4 mr-1" />
                {t.common.edit}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>{t.documents.titleLabel}</Label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t.documents.contentLabel}</Label>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>{t.common.cancel}</Button>
                <Button onClick={handleSaveEdit} disabled={saving}>
                  <Save className="h-4 w-4 mr-1" />
                  {t.common.save}
                </Button>
              </div>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap text-sm font-mono bg-slate-50 rounded-lg p-4 leading-relaxed">
              {document.content}
            </pre>
          )}
        </CardContent>
      </Card>

      {document.reviewNote && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-red-700">{t.documents.reviewNote}:</p>
            <p className="text-sm text-red-600 mt-1">{document.reviewNote}</p>
          </CardContent>
        </Card>
      )}

      {/* QR code for approved documents — proves authenticity */}
      {document.status === 'approved' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-4">
            <img
              src={getQRCodeUrl(
                typeof window !== 'undefined'
                  ? `${window.location.origin}/dashboard/documents/${document.id}`
                  : `/dashboard/documents/${document.id}`,
                120
              )}
              alt="QR kod"
              className="w-24 h-24 rounded border border-green-200 bg-white p-1 shrink-0"
            />
            <div>
              <p className="text-sm font-semibold text-green-800">{t.documents.approved}</p>
              <p className="text-xs text-green-700 mt-1">
                {t.documents.qrVerifyHint ?? 'QR kodni skanerlash orqali hujjatning haqiqiyligini tekshirish mumkin.'}
              </p>
              <p className="text-xs text-green-600 mt-2 font-mono opacity-70">ID: {document.id}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Owner actions */}
      {isOwner && document.status === 'draft' && !editing && (
        <Button className="w-full" onClick={handleSubmitForReview} disabled={saving}>
          <Send className="h-4 w-4 mr-2" />
          {t.documents.submitReview}
        </Button>
      )}

      {/* Admin actions */}
      {userRole === 'admin' && document.status === 'pending_review' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.documents.reviewNote}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>{t.documents.reviewNote}</Label>
              <Textarea
                placeholder={t.documents.reviewNotePlaceholder}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleAdminAction('approved')}
                disabled={saving}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {t.documents.approve}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => handleAdminAction('rejected')}
                disabled={saving}
              >
                <XCircle className="h-4 w-4 mr-1" />
                {t.documents.reject}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
