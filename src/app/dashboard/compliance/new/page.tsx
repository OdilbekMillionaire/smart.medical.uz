'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ComplianceItem } from '@/types';

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

export default function NewCompliancePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ComplianceItem['type'] | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) { toast.error(t.compliance.titleLabel); return; }
    if (!type) { toast.error(t.compliance.typeLabel); return; }
    if (!dueDate) { toast.error(t.compliance.dueDateLabel); return; }
    if (!user) return;

    setSaving(true);
    try {
      const token = await user.getIdToken();
      await requestJson<ComplianceItem>('/api/compliance', token, {
        method: 'POST',
        body: JSON.stringify({
          type,
          title: title.trim(),
          dueDate,
        }),
      });
      toast.success(t.common.success);
      router.push('/dashboard/compliance');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/compliance">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t.common.back}
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t.compliance.createTitle}</h1>
          <p className="text-sm text-muted-foreground">{t.compliance.subtitle}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>{t.compliance.createTitle}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t.compliance.titleLabel}</Label>
            <Input
              placeholder={t.compliance.titlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t.compliance.typeLabel}</Label>
            <Select onValueChange={(v: string | null) => { if (v) setType(v as ComplianceItem['type']); }}>
              <SelectTrigger><SelectValue placeholder={t.compliance.typeLabel} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="license">{t.compliance.types.license}</SelectItem>
                <SelectItem value="certification">{t.compliance.types.certification}</SelectItem>
                <SelectItem value="contract">{t.compliance.types.contract}</SelectItem>
                <SelectItem value="protocol">{t.compliance.types.protocol}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t.compliance.dueDateLabel}</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link href="/dashboard/compliance" className="flex-1">
          <Button variant="outline" className="w-full">{t.common.cancel}</Button>
        </Link>
        <Button className="flex-1" onClick={handleSave} disabled={saving}>
          {saving ? t.documents.saving : t.common.save}
        </Button>
      </div>
    </div>
  );
}
