'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Bot, Send, ArrowLeft } from 'lucide-react';
import { createDocument } from '@/lib/firestore';
import { getAuth } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

const DOCUMENT_TYPE_KEYS = [
  'license_application',
  'sanitary_certificate',
  'labor_contract',
  'service_contract',
  'internal_rules',
  'medical_protocol',
  'qualification_cert',
  'patient_consent',
  'medical_conclusion',
  'other',
] as const;

async function getToken(): Promise<string> {
  const auth = getFirebaseAuth();
  const user = getAuth(auth.app).currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

export default function NewDocumentPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [content, setContent] = useState('');
  const [context, setContext] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAIDraft() {
    if (!type) { toast.error(t.documents.typeLabel); return; }
    setDraftLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode: 'document', documentType: type, context }),
      });
      if (!res.ok) throw new Error('AI xatosi');
      const data = await res.json() as { content: string };
      setContent(data.content);
      toast.success(t.documents.aiDraft);
    } catch {
      toast.error(t.common.error);
    } finally {
      setDraftLoading(false);
    }
  }

  async function handleSave(status: 'draft' | 'pending_review') {
    if (!title.trim()) { toast.error(t.documents.titleLabel); return; }
    if (!type) { toast.error(t.documents.typeLabel); return; }
    if (!content.trim()) { toast.error(t.documents.contentLabel); return; }
    if (!user) return;

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const id = await createDocument({
        ownerId: user.uid,
        ownerType: 'user',
        title: title.trim(),
        type,
        content: content.trim(),
        status,
        createdAt: now,
        updatedAt: now,
      });
      toast.success(status === 'draft' ? t.documents.draft : t.documents.submitReview);
      router.push(`/dashboard/documents/${id}`);
    } catch {
      toast.error(t.common.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/documents">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t.common.back}
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t.documents.createTitle}</h1>
          <p className="text-sm text-muted-foreground">{t.documents.title}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.documents.createTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t.documents.titleLabel}</Label>
            <Input
              placeholder={t.documents.titlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t.documents.typeLabel}</Label>
            <Select onValueChange={(v: string | null) => { if (v) setType(v); }}>
              <SelectTrigger>
                <SelectValue placeholder={t.documents.typeLabel} />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPE_KEYS.map((key) => (
                  <SelectItem key={key} value={key}>{t.documents.types[key]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {t.documents.aiDraft}
          </CardTitle>
          <CardDescription>
            {t.documents.aiDrafting}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>{t.documents.contextLabel}</Label>
            <Textarea
              placeholder={t.documents.contextPlaceholder}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <Button
            variant="outline"
            onClick={handleAIDraft}
            disabled={draftLoading || !type}
            className="w-full"
          >
            {draftLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                {t.documents.aiDrafting}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                {t.documents.aiDraft}
              </span>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.documents.contentLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={t.documents.contentPlaceholder}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => handleSave('draft')} disabled={saving}>
          {t.common.save}
        </Button>
        <Button className="flex-1" onClick={() => handleSave('pending_review')} disabled={saving}>
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {t.documents.saving}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              {t.documents.submitReview}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
