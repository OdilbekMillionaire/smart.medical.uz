'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createRequest } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NewRequestPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!subject.trim()) { toast.error(t.requests.subject); return; }
    if (!body.trim()) { toast.error(t.requests.body); return; }
    if (!user) return;

    setSaving(true);
    try {
      const id = await createRequest({
        fromUserId: user.uid,
        toAdminId: 'admin',
        subject: subject.trim(),
        body: body.trim(),
        status: 'received',
        createdAt: new Date().toISOString(),
      });
      toast.success(t.common.success);
      router.push(`/dashboard/requests/${id}`);
    } catch {
      toast.error(t.common.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/requests">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t.common.back}
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t.requests.createTitle}</h1>
          <p className="text-sm text-muted-foreground">{t.requests.title}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.requests.createTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t.requests.subject}</Label>
            <Input
              placeholder={t.requests.subjectPlaceholder}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t.requests.body}</Label>
            <Textarea
              placeholder={t.requests.bodyPlaceholder}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[200px]"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t.requests.aiClassificationNote}
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link href="/dashboard/requests" className="flex-1">
          <Button variant="outline" className="w-full">{t.common.cancel}</Button>
        </Link>
        <Button className="flex-1" onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {t.requests.sending}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              {t.requests.send}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
