'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Appointment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Calendar,
  Plus,
  CheckCircle2,
  XCircle,
  Trash2,
  User,
  Phone,
  Stethoscope,
  Search,
  ClipboardList,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { FilterBar } from '@/components/shared/FilterBar';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonList } from '@/components/shared/SkeletonList';

const DATE_LOCALE: Record<string, string> = {
  uz: 'uz-UZ',
  en: 'en-US',
  ru: 'ru-RU',
  uz_cyrillic: 'uz-UZ',
  kk: 'kk-KZ',
};

const TIME_SLOTS = [
  '08:00','08:30','09:00','09:30','10:00','10:30',
  '11:00','11:30','12:00','14:00','14:30','15:00',
  '15:30','16:00','16:30','17:00','17:30',
];

const EMPTY_FORM = {
  patientName: '',
  patientPhone: '',
  doctorName: '',
  date: '',
  time: '09:00',
  reason: '',
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

export default function AppointmentsPage() {
  const { user, userRole, userProfile } = useAuth();
  const { t, lang } = useLanguage();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const locale = DATE_LOCALE[lang] || 'uz-UZ';

  const isClinic = userRole === 'clinic' || userRole === 'admin';

  const STATUS_META: Record<Appointment['status'], { label: string; color: string }> = {
    pending:   { label: t.appointments.pending,   color: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: t.appointments.confirmed, color: 'bg-blue-100 text-blue-700' },
    done:      { label: t.appointments.done,      color: 'bg-green-100 text-green-700' },
    cancelled: { label: t.appointments.cancelled, color: 'bg-red-100 text-red-700' },
  };

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const data = await requestJson<{ appointments: Appointment[] }>('/api/appointments', token);
      setAppointments(data.appointments);
    } catch {
      toast.error(t.appointments.loadError);
    } finally {
      setLoading(false);
    }
  }, [t.appointments.loadError, user]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!user || !form.patientName || !form.date || !form.time || !form.reason) {
      toast.error(t.appointments.fillRequired);
      return;
    }
    setSaving(true);
    try {
      const clinicId = userRole === 'clinic' ? user.uid : (userProfile as { linkedClinicId?: string })?.linkedClinicId ?? user.uid;
      const clinicName = (userProfile as { clinicName?: string })?.clinicName ?? 'Klinika';
      const token = await user.getIdToken();
      await requestJson<Appointment>('/api/appointments', token, {
        method: 'POST',
        body: JSON.stringify({
        clinicId,
        clinicName,
        patientId: `manual_${Date.now()}`,
        patientName: form.patientName,
        patientPhone: form.patientPhone,
        doctorName: form.doctorName || undefined,
        date: form.date,
        time: form.time,
        reason: form.reason,
        }),
      });
      toast.success(t.appointments.added);
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } catch {
      toast.error(t.appointments.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(id: string, status: Appointment['status']) {
    setActiveId(id);
    try {
      if (!user) return;
      const token = await user.getIdToken();
      await requestJson<Appointment>('/api/appointments', token, {
        method: 'PATCH',
        body: JSON.stringify({ id, status }),
      });
      toast.success(status === 'confirmed' ? t.appointments.confirmedToast : status === 'done' ? t.appointments.doneToast : t.appointments.cancelledToast);
      await load();
    } catch {
      toast.error(t.appointments.statusError);
    } finally {
      setActiveId(null);
    }
  }

  async function handleDelete(id: string) {
    setActiveId(id);
    try {
      if (!user) return;
      const token = await user.getIdToken();
      await requestJson<{ success: boolean }>('/api/appointments', token, {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      toast.success(t.appointments.deleted);
      await load();
    } catch {
      toast.error(t.appointments.deleteError);
    } finally {
      setActiveId(null);
    }
  }

  const filtered = appointments.filter((a) => {
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchSearch =
      !search ||
      a.patientName.toLowerCase().includes(search.toLowerCase()) ||
      (a.reason ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (a.doctorName ?? '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const today = new Date().toISOString().split('T')[0];
  const todayCount = appointments.filter((a) => a.date === today).length;
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const doneCount = appointments.filter((a) => a.status === 'done').length;

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<Calendar className="w-6 h-6 text-blue-600" />}
        title={t.appointments.title}
        subtitle={t.appointments.subtitle}
        actions={isClinic ? (
          <Button onClick={() => setShowForm(!showForm)} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />{t.appointments.newAppointment}
          </Button>
        ) : undefined}
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label={t.appointments.today} value={loading ? null : todayCount} icon={<Calendar className="h-6 w-6" />} colorClass="border-l-blue-500 bg-blue-50/30" iconClass="text-blue-600" />
        <StatCard label={t.appointments.pending} value={loading ? null : pendingCount} icon={<ClipboardList className="h-6 w-6" />} colorClass="border-l-yellow-500 bg-yellow-50/30" iconClass="text-yellow-600" />
        <StatCard label={t.appointments.done} value={loading ? null : doneCount} icon={<CheckCircle2 className="h-6 w-6" />} colorClass="border-l-green-500 bg-green-50/30" iconClass="text-green-600" />
      </div>

      {/* Create form */}
      {showForm && isClinic && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="text-base">{t.appointments.addTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">{t.appointments.patientName} *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={form.patientName}
                    onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                    placeholder={t.appointments.patientNamePlaceholder}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">{t.appointments.phone}</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={form.patientPhone}
                    onChange={(e) => setForm({ ...form, patientPhone: e.target.value })}
                    placeholder={t.appointments.phonePlaceholder}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">{t.appointments.doctor}</label>
                <div className="relative">
                  <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={form.doctorName}
                    onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
                    placeholder={t.appointments.doctorPlaceholder}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">{t.appointments.date} *</label>
                <Input
                  type="date"
                  value={form.date}
                  min={today}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">{t.appointments.time} *</label>
                <select
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-slate-600">{t.appointments.reason} *</label>
                <Input
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder={t.appointments.reasonPlaceholder}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
                {t.appointments.cancel}
              </Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? t.appointments.saving : t.appointments.save}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.appointments.searchPlaceholder} className="pl-9" />
        </div>
        <FilterBar
          options={(['all', 'pending', 'confirmed', 'done', 'cancelled'] as const).map((s) => ({
            key: s,
            label: s === 'all' ? t.appointments.allFilter : STATUS_META[s]?.label ?? s,
          }))}
          value={filterStatus}
          onChange={setFilterStatus}
        />
      </div>

      {loading && <SkeletonList count={4} />}

      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={<ClipboardList className="w-12 h-12" />}
          title={t.appointments.notFound}
          action={isClinic ? (
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" /> {t.appointments.addNew}
            </Button>
          ) : undefined}
        />
      )}

      {/* Appointment cards */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((appt) => {
            const meta = STATUS_META[appt.status];
            const isToday = appt.date === today;
            return (
              <Card
                key={appt.id}
                className={`hover:shadow-md transition-shadow ${isToday ? 'border-blue-300 bg-blue-50/20' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div className="flex items-start gap-3">
                      {/* Date/time badge */}
                      <div className="flex flex-col items-center justify-center min-w-[52px] h-14 bg-slate-100 rounded-lg border text-center">
                        <span className="text-xs text-slate-500 font-medium">
                          {appt.date ? new Date(appt.date + 'T00:00:00').toLocaleDateString(locale, { month: 'short', day: 'numeric' }) : '--'}
                        </span>
                        <span className="text-sm font-bold text-slate-800">{appt.time}</span>
                        {isToday && <span className="text-[9px] font-bold text-blue-600 uppercase">{t.appointments.today}</span>}
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-800">{appt.patientName}</p>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">{appt.reason}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          {appt.patientPhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />{appt.patientPhone}
                            </span>
                          )}
                          {appt.doctorName && (
                            <span className="flex items-center gap-1">
                              <Stethoscope className="w-3 h-3" />{appt.doctorName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {isClinic && (
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {appt.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8 text-xs"
                            disabled={activeId === appt.id}
                            onClick={() => handleStatus(appt.id, 'confirmed')}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {t.appointments.confirm}
                          </Button>
                        )}
                        {appt.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-200 hover:bg-green-50 h-8 text-xs"
                            disabled={activeId === appt.id}
                            onClick={() => handleStatus(appt.id, 'done')}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {t.appointments.markDone}
                          </Button>
                        )}
                        {(appt.status === 'pending' || appt.status === 'confirmed') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 border-red-200 hover:bg-red-50 h-8 text-xs"
                            disabled={activeId === appt.id}
                            onClick={() => handleStatus(appt.id, 'cancelled')}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" /> {t.appointments.cancelAppointment}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-400 hover:text-red-500 h-8 w-8 p-0"
                          disabled={activeId === appt.id}
                          onClick={() => handleDelete(appt.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Patient view: book appointment */}
      {!isClinic && !loading && (
        <Card className="border-dashed border-slate-300 bg-slate-50">
          <CardContent className="p-6 text-center">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-500 mb-3">
              {t.appointments.patientBookHint}
            </p>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/requests'}>
              {t.appointments.sendRequest}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
