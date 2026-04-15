'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getInspectionByClinic, getAllInspections } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ShieldCheck, ShieldAlert, ShieldX, Plus, ChevronDown, ChevronUp, Printer, Sparkles, Bot } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { useLanguage } from '@/contexts/LanguageContext';
import { printInspectionReport } from '@/lib/export';
import type { InspectionRecord, InspectionItem } from '@/types';

// Risk levels for each checklist category (label comes from i18n at render time)
const RISK_LEVELS: Record<InspectionRecord['checklistType'], InspectionItem['riskLevel'][]> = {
  sanitation: ['high', 'high', 'high', 'medium', 'medium', 'medium', 'low'],
  licensing: ['high', 'high', 'high', 'medium', 'medium', 'low'],
  documentation: ['high', 'high', 'medium', 'high', 'medium', 'low'],
  staff: ['high', 'medium', 'high', 'low', 'medium', 'medium'],
};

function buildChecklist(
  type: InspectionRecord['checklistType'],
  labels: string[],
): InspectionItem[] {
  const risks = RISK_LEVELS[type];
  return labels.map((label, i) => ({
    label,
    status: 'pass' as const,
    riskLevel: risks[i] ?? 'medium',
  }));
}

const RISK_COLORS = { high: 'text-red-600', medium: 'text-orange-500', low: 'text-green-600' };

async function getToken(): Promise<string> {
  const auth = getFirebaseAuth();
  const user = getAuth(auth.app).currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

export default function InspectionPage() {
  const { user, userRole } = useAuth();
  const { t } = useLanguage();
  const CHECKLIST_LABELS: Record<InspectionRecord['checklistType'], string> = {
    sanitation: t.inspection.categories.sanitation,
    licensing: t.inspection.categories.licensing,
    documentation: t.inspection.categories.documentation,
    staff: t.inspection.categories.staff,
  };
  const RISK_LABELS = { high: t.inspection.riskHigh, medium: t.inspection.riskMedium, low: t.inspection.riskLow };
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<InspectionRecord['checklistType']>('sanitation');
  const [items, setItems] = useState<InspectionItem[]>(buildChecklist('sanitation', t.inspection.checklistItems.sanitation));
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [remediations, setRemediations] = useState<Record<string, string>>({});
  const [remediatingId, setRemediatingId] = useState<string | null>(null);

  async function handleRemediate(rec: InspectionRecord) {
    const failedItems = rec.items.filter((i) => i.status !== 'pass');
    if (failedItems.length === 0) {
      toast.error(t.inspection.noFailedItems);
      return;
    }
    setRemediatingId(rec.id);
    try {
      const token = await getToken();
      const res = await fetch('/api/inspection/remediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          checklistType: rec.checklistType,
          failedItems: failedItems.map((i) => ({
            label: i.label,
            status: i.status,
            riskLevel: i.riskLevel,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? t.aiFeatures.error);
      }
      const data = await res.json() as { plan: string };
      setRemediations((prev) => ({ ...prev, [rec.id]: data.plan }));
      toast.success(t.aiFeatures.ready);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.aiFeatures.error);
    } finally {
      setRemediatingId(null);
    }
  }

  useEffect(() => {
    if (!user) return;
    const load = userRole === 'admin' ? getAllInspections : () => getInspectionByClinic(user.uid);
    load()
      .then(setRecords)
      .catch(() => toast.error(t.common.error))
      .finally(() => setLoading(false));
  }, [user, userRole]);

  function selectType(type: InspectionRecord['checklistType']) {
    setSelectedType(type);
    setItems(buildChecklist(type, t.inspection.checklistItems[type]));
  }

  function toggleItemStatus(idx: number) {
    setItems((prev) => {
      const updated = [...prev];
      const s = updated[idx].status;
      updated[idx] = {
        ...updated[idx],
        status: s === 'pass' ? 'fail' : s === 'fail' ? 'warning' : 'pass',
      };
      return updated;
    });
  }

  async function handleSubmit() {
    if (!user) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ checklistType: selectedType, items }),
      });
      if (!res.ok) throw new Error('Server error');
      const newRecord = await res.json() as InspectionRecord;
      setRecords((prev) => [newRecord, ...prev]);
      setShowForm(false);
      setExpandedId(newRecord.id);
      toast.success(t.common.success);
    } catch {
      toast.error(t.common.error);
    } finally {
      setSubmitting(false);
    }
  }

  const RiskIcon = ({ risk }: { risk: InspectionRecord['overallRisk'] }) => {
    if (risk === 'high') return <ShieldX className="h-5 w-5 text-red-600" />;
    if (risk === 'medium') return <ShieldAlert className="h-5 w-5 text-orange-500" />;
    return <ShieldCheck className="h-5 w-5 text-green-600" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.inspection.title}</h1>
          <p className="text-sm text-muted-foreground">{t.inspection.subtitle}</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t.inspection.checklist}
          </Button>
        )}
      </div>

      {/* New inspection form */}
      {showForm && (
        <Card className="border-2 border-slate-900">
          <CardHeader>
            <CardTitle>{t.inspection.checklist}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Checklist type selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(CHECKLIST_LABELS) as InspectionRecord['checklistType'][]).map((t) => (
                <button
                  key={t}
                  onClick={() => selectType(t)}
                  className={`rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
                    selectedType === t
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {CHECKLIST_LABELS[t]}
                </button>
              ))}
            </div>

            {/* Checklist items */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {t.inspection.checklist}:
              </p>
              {items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleItemStatus(idx)}
                  className={`w-full flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                    item.status === 'pass'
                      ? 'border-green-200 bg-green-50'
                      : item.status === 'fail'
                      ? 'border-red-200 bg-red-50'
                      : 'border-orange-200 bg-orange-50'
                  }`}
                >
                  <span className="text-sm">{item.label}</span>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={`text-xs font-medium ${RISK_COLORS[item.riskLevel]}`}>
                      {RISK_LABELS[item.riskLevel]}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'pass'
                        ? 'bg-green-200 text-green-800'
                        : item.status === 'fail'
                        ? 'bg-red-200 text-red-800'
                        : 'bg-orange-200 text-orange-800'
                    }`}>
                      {item.status === 'pass' ? t.inspection.pass : item.status === 'fail' ? t.inspection.fail : t.inspection.warning}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)} disabled={submitting}>
                {t.common.cancel}
              </Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t.inspection.submitting}
                  </span>
                ) : t.inspection.submitAssessment}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Records list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : records.length === 0 && !showForm ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{t.inspection.noHistory}</p>
          <p className="text-sm mt-1">{t.inspection.checklist}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((rec) => (
            <Card key={rec.id} className="overflow-hidden">
              <button
                className="w-full text-left"
                onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <RiskIcon risk={rec.overallRisk} />
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {CHECKLIST_LABELS[rec.checklistType]} {t.inspection.inspectionOf}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(rec.createdAt).toLocaleDateString('uz-UZ')} •{' '}
                          <span className={RISK_COLORS[rec.overallRisk]}>
                            {RISK_LABELS[rec.overallRisk]} {t.inspection.riskSuffix}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {rec.items.filter((i) => i.status === 'fail').length} {t.inspection.fail}
                      </span>
                      {expandedId === rec.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </button>

              {expandedId === rec.id && (
                <div className="border-t bg-slate-50 p-4 space-y-4">
                  {/* Failed / warning items */}
                  {rec.items.filter((i) => i.status !== 'pass').length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">{t.inspection.fail}:</p>
                      <div className="space-y-1">
                        {rec.items
                          .filter((i) => i.status !== 'pass')
                          .map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm py-1 px-3 rounded bg-white border">
                              <span>{item.label}</span>
                              <span className={`text-xs font-medium ${RISK_COLORS[item.riskLevel]}`}>
                                {item.status === 'fail' ? t.inspection.fail : t.inspection.warning}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* AI recommendations */}
                  {rec.recommendations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">{t.inspection.recommendations}:</p>
                      <div className="space-y-1">
                        {rec.recommendations.map((r, idx) => (
                          <p key={idx} className="text-sm text-muted-foreground pl-3 border-l-2 border-slate-300">
                            {r}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feature 5: AI Remediation Plan (Gemini 2.5 Pro) */}
                  {rec.items.some((i) => i.status !== 'pass') && (
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-cyan-300 hover:bg-cyan-50"
                        onClick={() => handleRemediate(rec)}
                        disabled={remediatingId === rec.id}
                      >
                        {remediatingId === rec.id ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                            {t.aiFeatures.remediationLoading}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-cyan-600" />
                            {t.aiFeatures.generateRemediation}
                          </span>
                        )}
                      </Button>
                      {remediations[rec.id] && (
                        <div className="rounded-lg border border-cyan-200 bg-gradient-to-br from-cyan-50 to-emerald-50 p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-cyan-600" />
                            <p className="text-sm font-semibold text-cyan-900">{t.aiFeatures.remediationTitle}</p>
                            <span className="text-xs text-cyan-700 bg-white border border-cyan-200 rounded-full px-2 py-0.5">
                              {t.aiFeatures.modelBadge}
                            </span>
                          </div>
                          <div className="rounded-lg bg-white border border-cyan-200 p-3 text-sm whitespace-pre-wrap leading-relaxed">
                            {remediations[rec.id]}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Print report button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => printInspectionReport({
                      checklistType: CHECKLIST_LABELS[rec.checklistType],
                      date: new Date(rec.createdAt).toLocaleDateString('uz-UZ'),
                      overallRisk: rec.overallRisk,
                      items: rec.items,
                      recommendations: rec.recommendations,
                    })}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    {t.inspection.printReport}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
