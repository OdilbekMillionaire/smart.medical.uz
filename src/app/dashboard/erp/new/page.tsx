'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { createERPRecord } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Plus, X, Bot, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getAuth } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';

async function getToken(): Promise<string> {
  const auth = getFirebaseAuth();
  const user = getAuth(auth.app).currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

export default function NewERPPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [patientId, setPatientId] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [diagnosis, setDiagnosis] = useState('');
  const [prescriptions, setPrescriptions] = useState<string[]>(['']);
  const [procedures, setProcedures] = useState<string[]>(['']);
  const [nextVisit, setNextVisit] = useState('');
  const [assignedDoctorId, setAssignedDoctorId] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  async function handleGenerateAISummary() {
    if (!diagnosis.trim()) {
      toast.error(t.erp.diagnosisRequired);
      return;
    }
    setAiLoading(true);
    setAiSummary('');
    try {
      const token = await getToken();
      const res = await fetch('/api/erp/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          patientName: patientId || t.erp.patient,
          visitDate,
          diagnosis: diagnosis.trim(),
          prescriptions: prescriptions.filter((p) => p.trim()),
          procedures: procedures.filter((p) => p.trim()),
          nextVisit: nextVisit || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? t.aiFeatures.error);
      }
      const data = await res.json() as { summary: string };
      setAiSummary(data.summary);
      toast.success(t.aiFeatures.ready);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.aiFeatures.error);
    } finally {
      setAiLoading(false);
    }
  }

  function addItem(setter: React.Dispatch<React.SetStateAction<string[]>>) {
    setter((prev) => [...prev, '']);
  }

  function updateItem(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    arr: string[],
    idx: number,
    val: string
  ) {
    const updated = [...arr];
    updated[idx] = val;
    setter(updated);
  }

  function removeItem(setter: React.Dispatch<React.SetStateAction<string[]>>, idx: number) {
    setter((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!patientId.trim()) { toast.error(t.erp.patientIdRequired); return; }
    if (!diagnosis.trim()) { toast.error(t.erp.diagnosisRequired); return; }
    if (!user) return;

    setSaving(true);
    try {
      await createERPRecord({
        clinicId: user.uid,
        patientId: patientId.trim(),
        visitDate,
        diagnosis: diagnosis.trim(),
        prescriptions: prescriptions.filter((p) => p.trim()),
        procedures: procedures.filter((p) => p.trim()),
        nextVisit: nextVisit || undefined,
        assignedDoctorId: assignedDoctorId.trim() || user.uid,
        cleaningLogs: [],
      });
      toast.success(t.erp.saved);
      router.push('/dashboard/erp');
    } catch {
      toast.error(t.erp.saveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/erp">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t.common.back}
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t.erp.newVisitTitle}</h1>
          <p className="text-sm text-muted-foreground">{t.erp.newVisitDesc}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>{t.erp.basicInfo}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.erp.patientId}</Label>
              <Input placeholder={t.erp.patientIdPlaceholder} value={patientId} onChange={(e) => setPatientId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t.erp.visitDate}</Label>
              <Input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t.erp.diagnosis}</Label>
            <Textarea
              placeholder={t.erp.diagnosisHint}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.erp.nextVisitOptional}</Label>
              <Input type="date" value={nextVisit} onChange={(e) => setNextVisit(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t.erp.doctorIdOptional}</Label>
              <Input placeholder={t.erp.doctorIdPlaceholder} value={assignedDoctorId} onChange={(e) => setAssignedDoctorId(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t.erp.prescriptions}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {prescriptions.map((p, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder={`${t.erp.drugNumber} ${i + 1}`}
                value={p}
                onChange={(e) => updateItem(setPrescriptions, prescriptions, i, e.target.value)}
              />
              {prescriptions.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeItem(setPrescriptions, i)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => addItem(setPrescriptions)}>
            <Plus className="h-4 w-4 mr-1" />
            {t.erp.addDrug}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t.erp.procedures}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {procedures.map((p, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder={`${t.erp.procedureNumber} ${i + 1}`}
                value={p}
                onChange={(e) => updateItem(setProcedures, procedures, i, e.target.value)}
              />
              {procedures.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeItem(setProcedures, i)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => addItem(setProcedures)}>
            <Plus className="h-4 w-4 mr-1" />
            {t.erp.addProcedure}
          </Button>
        </CardContent>
      </Card>

      {/* AI Visit Summary (Gemini 2.5 Pro) */}
      <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-cyan-600" />
            {t.aiFeatures.visitSummaryTitle}
          </CardTitle>
          <CardDescription>
            {t.aiFeatures.visitSummaryDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            onClick={handleGenerateAISummary}
            disabled={aiLoading || !diagnosis.trim()}
            className="w-full border-cyan-300 hover:bg-cyan-50"
          >
            {aiLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                {t.aiFeatures.analyzing}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                {t.aiFeatures.generateSummary}
              </span>
            )}
          </Button>
          {aiSummary && (
            <div className="rounded-lg bg-white border border-cyan-200 p-4 text-sm whitespace-pre-wrap leading-relaxed">
              {aiSummary}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link href="/dashboard/erp" className="flex-1">
          <Button variant="outline" className="w-full">{t.common.cancel}</Button>
        </Link>
        <Button className="flex-1" onClick={handleSave} disabled={saving}>
          {saving ? t.erp.saving : t.common.save}
        </Button>
      </div>
    </div>
  );
}
