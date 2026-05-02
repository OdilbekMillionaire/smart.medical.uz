'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus, User, Calendar, Stethoscope, Users, ClipboardList,
  Sparkles, BarChart2, Search, CheckCircle2, Circle, X,
} from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import type { ERPRecord } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Patient {
  id: string;
  name: string;
  phone: string;
  dob?: string;
  gender?: 'male' | 'female' | 'other';
  notes?: string;
  visitCount: number;
  lastVisit: string | null;
}

interface CleaningLog {
  id: string;
  task: string;
  completedBy: string;
  notes?: string;
  date: string;
  completedAt: string;
}

interface AnalyticsData {
  totalVisits: number;
  uniquePatients: number;
  dailyVisits: { date: string; visits: number }[];
  topDiagnoses: { name: string; count: number }[];
  doctorStats: { doctorId: string; visits: number }[];
  busiestDay: string;
  busiestDayCount: number;
}

// ─── Auth helper ──────────────────────────────────────────────────────────────
async function getToken(): Promise<string> {
  const auth = getFirebaseAuth();
  const user = getAuth(auth.app).currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
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

// ─── Cleaning tasks definition ────────────────────────────────────────────────
const CLEANING_TASK_KEYS = [
  'operatingRoom',
  'waitingRoom',
  'sterilization',
  'waste',
  'equipment',
] as const;

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ERPPage() {
  const { userRole, loading } = useAuth();
  const { t, lang } = useLanguage();
  const router = useRouter();

  const DATE_LOCALE: Record<string, string> = {
    uz: 'uz-UZ', uz_cyrillic: 'uz-UZ', ru: 'ru-RU', en: 'en-US', kk: 'kk-KZ',
  };
  const locale = DATE_LOCALE[lang] ?? 'uz-UZ';

  // ── Patients state ──
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatient, setNewPatient] = useState<{ name: string; phone: string; dob: string; gender: 'male' | 'female' | 'other' }>({ name: '', phone: '', dob: '', gender: 'other' });
  const [addingPatient, setAddingPatient] = useState(false);

  // ── Visits state ──
  const [visits, setVisits] = useState<ERPRecord[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(true);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));

  // ── Cleaning state ──
  const [cleaningLogs, setCleaningLogs] = useState<CleaningLog[]>([]);
  const [cleaningLoading, setCleaningLoading] = useState(true);
  const [cleaningDate, setCleaningDate] = useState(new Date().toISOString().slice(0, 10));
  const [showLogCleaning, setShowLogCleaning] = useState(false);
  const [cleaningTask, setCleaningTask] = useState('');
  const [cleaningBy, setCleaningBy] = useState('');
  const [cleaningNote, setCleaningNote] = useState('');
  const [loggingCleaning, setLoggingCleaning] = useState(false);

  // ── Analytics state ──
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // ─── Role guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && userRole !== 'clinic' && userRole !== 'admin') {
      router.replace('/dashboard');
    }
  }, [userRole, loading, router]);

  // ─── Data loaders ─────────────────────────────────────────────────────────
  const loadPatients = useCallback(async () => {
    setPatientsLoading(true);
    try {
      const q = patientSearch ? `?search=${encodeURIComponent(patientSearch)}` : '';
      const data = await apiFetch<{ patients: Patient[] }>(`/api/erp/patients${q}`);
      setPatients(data.patients);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    } finally {
      setPatientsLoading(false);
    }
  }, [patientSearch, t.common.error]);

  const loadVisits = useCallback(async () => {
    setVisitsLoading(true);
    try {
      const data = await apiFetch<{ records: ERPRecord[] }>('/api/clinic-erp');
      setVisits(data.records.filter((r) => r.visitDate.slice(0, 10) === visitDate));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    } finally {
      setVisitsLoading(false);
    }
  }, [visitDate, t.common.error]);

  const loadCleaning = useCallback(async () => {
    setCleaningLoading(true);
    try {
      const data = await apiFetch<{ logs: CleaningLog[] }>(`/api/erp/cleaning?date=${cleaningDate}`);
      setCleaningLogs(data.logs);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    } finally {
      setCleaningLoading(false);
    }
  }, [cleaningDate, t.common.error]);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const data = await apiFetch<AnalyticsData>('/api/erp/analytics');
      setAnalytics(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [t.common.error]);

  useEffect(() => { if (userRole === 'clinic' || userRole === 'admin') loadPatients(); }, [loadPatients, userRole]);
  useEffect(() => { if (userRole === 'clinic' || userRole === 'admin') loadVisits(); }, [loadVisits, userRole]);
  useEffect(() => { if (userRole === 'clinic' || userRole === 'admin') loadCleaning(); }, [loadCleaning, userRole]);
  useEffect(() => { if (userRole === 'clinic' || userRole === 'admin') loadAnalytics(); }, [loadAnalytics, userRole]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  async function handleAddPatient() {
    if (!newPatient.name.trim() || !newPatient.phone.trim()) {
      toast.error(t.common.required);
      return;
    }
    setAddingPatient(true);
    try {
      await apiFetch('/api/erp/patients', {
        method: 'POST',
        body: JSON.stringify({
          name: newPatient.name.trim(),
          phone: newPatient.phone.trim(),
          dob: newPatient.dob || undefined,
          gender: newPatient.gender,
        }),
      });
      toast.success(t.erp.patientAdded);
      setShowAddPatient(false);
      setNewPatient({ name: '', phone: '', dob: '', gender: 'other' });
      loadPatients();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.erp.patientAddError);
    } finally {
      setAddingPatient(false);
    }
  }

  async function handleLogCleaning(task: string) {
    if (!cleaningBy.trim()) { toast.error(t.common.required); return; }
    setLoggingCleaning(true);
    try {
      await apiFetch('/api/erp/cleaning', {
        method: 'POST',
        body: JSON.stringify({ task, completedBy: cleaningBy.trim(), notes: cleaningNote, date: cleaningDate }),
      });
      toast.success(t.erp.cleaningLogged);
      setShowLogCleaning(false);
      setCleaningBy('');
      setCleaningNote('');
      loadCleaning();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.erp.cleaningLogError);
    } finally {
      setLoggingCleaning(false);
    }
  }

  if (loading || (userRole !== 'clinic' && userRole !== 'admin')) return null;

  // ─── Schedule: today's procedures from visits ─────────────────────────────
  const todayProcedures = visits.flatMap((v) =>
    v.procedures.map((proc, i) => ({
      key: `${v.id}-${i}`,
      procedure: proc,
      patientId: v.patientId,
      doctorId: v.assignedDoctorId,
      visitId: v.id,
    }))
  );

  // ─── Completed tasks set ───────────────────────────────────────────────────
  const completedTaskNames = new Set(cleaningLogs.map((l) => l.task));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t.erp.title}</h1>
          <p className="text-sm text-muted-foreground">{t.erp.subtitle}</p>
        </div>
        <Link href="/dashboard/erp/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t.erp.newVisit}
          </Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: t.erp.totalPatients, value: patients.length, icon: <Users className="h-4 w-4 text-blue-500" /> },
          { label: t.erp.totalVisits, value: analytics?.totalVisits ?? '—', icon: <Stethoscope className="h-4 w-4 text-emerald-500" /> },
          { label: t.erp.todayVisits, value: visits.length, icon: <Calendar className="h-4 w-4 text-orange-500" /> },
          { label: t.erp.uniquePatients, value: analytics?.uniquePatients ?? '—', icon: <User className="h-4 w-4 text-violet-500" /> },
        ].map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                {card.icon}{card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="patients">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="patients" className="gap-1.5"><Users className="h-3.5 w-3.5" />{t.erp.patients}</TabsTrigger>
          <TabsTrigger value="visits" className="gap-1.5"><Stethoscope className="h-3.5 w-3.5" />{t.erp.visits}</TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5"><ClipboardList className="h-3.5 w-3.5" />{t.erp.schedule}</TabsTrigger>
          <TabsTrigger value="cleaning" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" />{t.erp.cleaning}</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5"><BarChart2 className="h-3.5 w-3.5" />{t.erp.analytics}</TabsTrigger>
        </TabsList>

        {/* ── TAB 1: PATIENTS ── */}
        <TabsContent value="patients" className="space-y-4 mt-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={t.erp.searchPatient}
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadPatients()}
              />
            </div>
            <Button variant="outline" onClick={loadPatients}>{t.common.search}</Button>
            <Button onClick={() => setShowAddPatient(true)}>
              <Plus className="h-4 w-4 mr-1" />{t.erp.addPatient}
            </Button>
          </div>

          {patientsLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : patients.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{t.erp.noPatients}</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">{t.erp.patientName}</th>
                    <th className="px-4 py-3 text-left font-medium">{t.common.phone}</th>
                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">{t.erp.patientDob}</th>
                    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">{t.erp.lastVisit}</th>
                    <th className="px-4 py-3 text-right font-medium">{t.erp.visitCount}</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p, i) => (
                    <tr key={p.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.phone}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {p.dob ? new Date(p.dob).toLocaleDateString(locale) : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {p.lastVisit ? new Date(p.lastVisit).toLocaleDateString(locale) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="secondary">{p.visitCount}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── TAB 2: VISITS ── */}
        <TabsContent value="visits" className="space-y-4 mt-4">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="space-y-1">
              <Label className="text-xs">{t.erp.visitDate}</Label>
              <Input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="pt-5">
              <Button variant="outline" size="sm" onClick={loadVisits}>{t.common.refresh}</Button>
            </div>
            <div className="ml-auto pt-5">
              <Link href="/dashboard/erp/new">
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5 mr-1" />{t.erp.newVisit}
                </Button>
              </Link>
            </div>
          </div>

          {visitsLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : visits.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Stethoscope className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{t.erp.noVisitsForDate}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visits.map((v) => (
                <Card key={v.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold">{v.diagnosis}</span>
                          {v.nextVisit && (
                            <Badge variant="outline" className="text-xs">
                              {t.erp.nextVisit}: {new Date(v.nextVisit).toLocaleDateString(locale)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />{t.erp.patient}: {v.patientId.slice(0, 12)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />{new Date(v.visitDate).toLocaleDateString(locale)}
                          </span>
                        </div>
                        {v.prescriptions.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {v.prescriptions.slice(0, 4).map((p, i) => (
                              <span key={i} className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                {p}
                              </span>
                            ))}
                            {v.prescriptions.length > 4 && (
                              <span className="text-xs text-muted-foreground">+{v.prescriptions.length - 4}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {v.procedures.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {v.procedures.length} {t.erp.procedures}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── TAB 3: SCHEDULE ── */}
        <TabsContent value="schedule" className="space-y-4 mt-4">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">
              {new Date(visitDate).toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <Badge variant="outline">{todayProcedures.length} {t.erp.procedures}</Badge>
          </div>

          {visitsLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : todayProcedures.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{t.erp.noSchedule}</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">{t.erp.procedures}</th>
                    <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">{t.erp.patient}</th>
                    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">{t.erp.doctor}</th>
                  </tr>
                </thead>
                <tbody>
                  {todayProcedures.map((p, i) => (
                    <tr key={p.key} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <td className="px-4 py-3 font-medium">{p.procedure}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{p.patientId.slice(0, 12)}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.doctorId.slice(0, 12)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── TAB 4: CLEANING ── */}
        <TabsContent value="cleaning" className="space-y-4 mt-4">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="space-y-1">
              <Label className="text-xs">{t.common.date}</Label>
              <Input
                type="date"
                value={cleaningDate}
                onChange={(e) => setCleaningDate(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="pt-5">
              <Button variant="outline" size="sm" onClick={loadCleaning}>{t.common.refresh}</Button>
            </div>
          </div>

          <div className="space-y-3">
            {CLEANING_TASK_KEYS.map((key) => {
              const taskLabel = t.erp.cleaningTasks[key];
              const isDone = completedTaskNames.has(taskLabel);
              const logEntry = cleaningLogs.find((l) => l.task === taskLabel);

              return (
                <Card key={key} className={isDone ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        {isDone
                          ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                          : <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                        }
                        <div>
                          <p className="font-medium">{taskLabel}</p>
                          {logEntry && (
                            <p className="text-xs text-muted-foreground">
                              {logEntry.completedBy} · {new Date(logEntry.completedAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                              {logEntry.notes ? ` · ${logEntry.notes}` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      {!isDone && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => {
                            setCleaningTask(taskLabel);
                            setShowLogCleaning(true);
                          }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          {t.erp.markDone}
                        </Button>
                      )}
                      {isDone && (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                          {t.erp.cleaningDone}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="pt-2">
            <Button variant="outline" onClick={() => { setCleaningTask(''); setShowLogCleaning(true); }}>
              <Plus className="h-4 w-4 mr-1" />{t.erp.addCleaningLog}
            </Button>
          </div>

          {cleaningLoading && (
            <div className="space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          )}
        </TabsContent>

        {/* ── TAB 5: ANALYTICS ── */}
        <TabsContent value="analytics" className="space-y-6 mt-4">
          {analyticsLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
          ) : analytics ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: t.erp.totalVisits, value: analytics.totalVisits },
                  { label: t.erp.uniquePatients, value: analytics.uniquePatients },
                  {
                    label: t.erp.busiestDay,
                    value: analytics.busiestDay
                      ? `${new Date(analytics.busiestDay).toLocaleDateString(locale, { month: 'short', day: 'numeric' })} (${analytics.busiestDayCount})`
                      : '—',
                  },
                  {
                    label: t.erp.analyticsLast30,
                    value: `${analytics.dailyVisits.length} ${t.common.date.toLowerCase()}`,
                  },
                ].map((s) => (
                  <Card key={s.label}>
                    <CardHeader className="pb-1">
                      <CardTitle className="text-xs text-muted-foreground font-medium">{s.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{s.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t.erp.analyticsVisitTrend}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={analytics.dailyVisits} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: string) => v.slice(5)}
                        interval="preserveStartEnd"
                      />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        formatter={(value: unknown) => [value as number, t.erp.visits]}
                        labelFormatter={(label: unknown) => new Date(label as string).toLocaleDateString(locale)}
                      />
                      <Line type="monotone" dataKey="visits" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{t.erp.analyticsTopDiagnoses}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.topDiagnoses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t.common.noData}</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={analytics.topDiagnoses} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                          <Tooltip formatter={(v: unknown) => [v as number, t.erp.visits]} />
                          <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{t.erp.visitsByDoctor}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.doctorStats.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t.common.noData}</p>
                    ) : (
                      <div className="space-y-2">
                        {analytics.doctorStats.map((d, i) => (
                          <div key={d.doctorId} className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                              <div
                                className="h-2 bg-violet-500 rounded-full"
                                style={{ width: `${(d.visits / (analytics.doctorStats[0]?.visits ?? 1)) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold w-6 text-right">{d.visits}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <BarChart2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{t.common.noData}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Add Patient Modal ── */}
      <Dialog open={showAddPatient} onOpenChange={setShowAddPatient}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.erp.addPatient}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t.erp.patientName} *</Label>
              <Input
                placeholder={t.erp.patientName}
                value={newPatient.name}
                onChange={(e) => setNewPatient((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.common.phone} *</Label>
              <Input
                placeholder="+998 90 000 00 00"
                value={newPatient.phone}
                onChange={(e) => setNewPatient((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t.erp.patientDob}</Label>
                <Input
                  type="date"
                  value={newPatient.dob}
                  onChange={(e) => setNewPatient((p) => ({ ...p, dob: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.erp.patientGender}</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={newPatient.gender}
                  onChange={(e) => {
                    const g = e.target.value as 'male' | 'female' | 'other';
                    setNewPatient((p) => ({ ...p, gender: g }));
                  }}
                >
                  <option value="male">{t.erp.male}</option>
                  <option value="female">{t.erp.female}</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddPatient(false)}>
                {t.common.cancel}
              </Button>
              <Button className="flex-1" onClick={handleAddPatient} disabled={addingPatient}>
                {addingPatient ? t.common.loading : t.common.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Log Cleaning Modal ── */}
      <Dialog open={showLogCleaning} onOpenChange={setShowLogCleaning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.erp.addCleaningLog}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!cleaningTask && (
              <div className="space-y-2">
                <Label>{t.common.type} *</Label>
                <Input
                  placeholder={t.erp.cleaning}
                  value={cleaningTask}
                  onChange={(e) => setCleaningTask(e.target.value)}
                />
              </div>
            )}
            {cleaningTask && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">{cleaningTask}</span>
                <button className="ml-auto" onClick={() => setCleaningTask('')}>
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            )}
            <div className="space-y-2">
              <Label>{t.erp.assignedTo} *</Label>
              <Input
                placeholder={t.erp.assignedTo}
                value={cleaningBy}
                onChange={(e) => setCleaningBy(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.common.note}</Label>
              <Input
                placeholder={t.common.note}
                value={cleaningNote}
                onChange={(e) => setCleaningNote(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowLogCleaning(false)}>
                {t.common.cancel}
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleLogCleaning(cleaningTask)}
                disabled={loggingCleaning || !cleaningTask.trim()}
              >
                {loggingCleaning ? t.common.loading : t.erp.cleaningLogged}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
