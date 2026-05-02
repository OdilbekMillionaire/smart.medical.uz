'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ClinicEvent } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { CalendarDays, Plus, MapPin, User, Trash2, GraduationCap, ClipboardCheck, Users, Coffee } from 'lucide-react';

const DATE_LOCALE: Record<string, string> = {
  uz: 'uz-UZ',
  en: 'en-US',
  ru: 'ru-RU',
  uz_cyrillic: 'uz-UZ',
  kk: 'kk-KZ',
};

const TYPE_ICONS: Record<ClinicEvent['type'], React.ReactNode> = {
  training:   <GraduationCap className="w-3.5 h-3.5" />,
  conference: <Users className="w-3.5 h-3.5" />,
  inspection: <ClipboardCheck className="w-3.5 h-3.5" />,
  meeting:    <Coffee className="w-3.5 h-3.5" />,
  other:      <CalendarDays className="w-3.5 h-3.5" />,
};

const TYPE_COLORS: Record<ClinicEvent['type'], string> = {
  training:   'bg-blue-100 text-blue-700',
  conference: 'bg-purple-100 text-purple-700',
  inspection: 'bg-red-100 text-red-700',
  meeting:    'bg-orange-100 text-orange-700',
  other:      'bg-slate-100 text-slate-600',
};

const EMPTY = { title: '', description: '', type: 'meeting' as ClinicEvent['type'], date: '', endDate: '', location: '', organizer: '' };

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

export default function CalendarPage() {
  const { user, userRole } = useAuth();
  const { t, lang } = useLanguage();
  const [events, setEvents] = useState<ClinicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const locale = DATE_LOCALE[lang] || 'uz-UZ';

  const canCreate = userRole === 'clinic' || userRole === 'admin';

  const typeLabels: Record<ClinicEvent['type'], string> = {
    training: t.calendar.types.training,
    conference: t.calendar.types.conference,
    inspection: t.calendar.types.inspection,
    meeting: t.calendar.types.meeting,
    other: t.calendar.types.other,
  };

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const data = await requestJson<{ events: ClinicEvent[] }>('/api/events', token);
      setEvents(data.events);
    } catch { toast.error(t.calendar.loadError); }
    finally { setLoading(false); }
  }, [t.calendar.loadError, user]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!user || !form.title || !form.date) { toast.error(t.calendar.titleRequired); return; }
    setSaving(true);
    try {
      const token = await user.getIdToken();
      await requestJson<ClinicEvent>('/api/events', token, {
        method: 'POST',
        body: JSON.stringify({ ...form, description: form.description || undefined, endDate: form.endDate || undefined, location: form.location || undefined, organizer: form.organizer || undefined }),
      });
      toast.success(t.calendar.added);
      setShowForm(false); setForm(EMPTY); await load();
    } catch { toast.error(t.calendar.saveError); }
    finally { setSaving(false); }
  }

  const today = new Date().toISOString().split('T')[0];
  const upcoming = events.filter((e) => e.date >= today);
  const past = events.filter((e) => e.date < today);
  const filtered = (filterType === 'all' ? events : events.filter((e) => e.type === filterType)).sort((a, b) => a.date.localeCompare(b.date));

  // Group by month
  const grouped: Record<string, ClinicEvent[]> = {};
  filtered.forEach((e) => {
    const key = e.date.slice(0, 7);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  async function handleDelete(id: string) {
    try {
      if (!user) return;
      const token = await user.getIdToken();
      await requestJson<{ success: boolean }>('/api/events', token, {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      await load();
    } catch {
      toast.error(t.common.error);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><CalendarDays className="w-6 h-6 text-blue-600" />{t.calendar.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.calendar.subtitle}</p>
        </div>
        {canCreate && <Button onClick={() => setShowForm(!showForm)} className="gap-2 shrink-0"><Plus className="w-4 h-4" />{t.calendar.addEvent}</Button>}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-l-4 border-l-blue-400"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-blue-600">{upcoming.length}</p><p className="text-xs text-slate-500">{t.calendar.upcoming}</p></CardContent></Card>
        <Card className="border-l-4 border-l-red-400"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-red-600">{events.filter((e) => e.type === 'inspection' && e.date >= today).length}</p><p className="text-xs text-slate-500">{t.calendar.inspections}</p></CardContent></Card>
        <Card className="border-l-4 border-l-slate-300"><CardContent className="p-3 text-center"><p className="text-xl font-bold">{past.length}</p><p className="text-xs text-slate-500">{t.calendar.past}</p></CardContent></Card>
      </div>

      {/* Form */}
      {showForm && canCreate && (
        <Card className="border-blue-200 bg-blue-50/10">
          <CardHeader className="pb-3"><CardTitle className="text-sm">{t.calendar.addEventTitle}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2"><label className="text-xs font-medium text-slate-500 mb-1 block">{t.calendar.eventTitle} *</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t.calendar.eventTitlePlaceholder} /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">{t.calendar.type}</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ClinicEvent['type'] })} className="w-full h-10 rounded-md border border-input px-3 text-sm bg-background">
                  {(Object.keys(typeLabels) as ClinicEvent['type'][]).map((key) => <option key={key} value={key}>{typeLabels[key]}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">{t.calendar.startDate} *</label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">{t.calendar.endDate}</label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">{t.calendar.location}</label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder={t.calendar.locationPlaceholder} /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">{t.calendar.organizer}</label><Input value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} placeholder={t.calendar.organizerPlaceholder} /></div>
              <div className="sm:col-span-2"><label className="text-xs font-medium text-slate-500 mb-1 block">{t.calendar.description}</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder={t.calendar.descriptionPlaceholder} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="flex gap-2 justify-end"><Button variant="outline" size="sm" onClick={() => setShowForm(false)}>{t.calendar.cancel}</Button><Button size="sm" onClick={handleCreate} disabled={saving}>{saving ? t.calendar.saving : t.calendar.save}</Button></div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap overflow-x-auto pb-1">
        {[{ key: 'all', label: t.calendar.allFilter }, ...Object.entries(typeLabels).map(([k, v]) => ({ key: k, label: v }))].map(({ key, label }) => (
          <button key={key} onClick={() => setFilterType(key)} className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all shrink-0 ${filterType === key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>{label}</button>
        ))}
      </div>

      {loading && <div className="space-y-3">{[1,2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>}
      {!loading && filtered.length === 0 && <div className="text-center py-16 bg-white rounded-xl border border-dashed"><CalendarDays className="w-12 h-12 mx-auto mb-3 text-slate-200" /><p className="text-slate-500">{t.calendar.notFound}</p></div>}

      {!loading && Object.entries(grouped).map(([month, monthEvents]) => (
        <div key={month}>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
            {new Date(month + '-01').toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
          </h3>
          <div className="space-y-2">
            {monthEvents.map((ev) => {
              const color = TYPE_COLORS[ev.type];
              const icon = TYPE_ICONS[ev.type];
              const label = typeLabels[ev.type];
              const isToday = ev.date === today;
              const isPast = ev.date < today;
              return (
                <Card key={ev.id} className={`hover:shadow-md transition-shadow ${isToday ? 'border-blue-300 bg-blue-50/20' : ''} ${isPast ? 'opacity-70' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-center shrink-0 border ${isToday ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200'}`}>
                          <span className="text-xs font-medium">{new Date(ev.date + 'T00:00:00').toLocaleDateString(locale, { month: 'short' })}</span>
                          <span className={`text-lg font-bold leading-none ${isToday ? '' : 'text-slate-800'}`}>{new Date(ev.date + 'T00:00:00').getDate()}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 font-medium ${color}`}>{icon}{label}</span>
                            {isToday && <span className="text-xs font-bold text-blue-600">{t.calendar.todayLabel}</span>}
                          </div>
                          <p className="font-semibold text-slate-800">{ev.title}</p>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 flex-wrap">
                            {ev.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location}</span>}
                            {ev.organizer && <span className="flex items-center gap-1"><User className="w-3 h-3" />{ev.organizer}</span>}
                            {ev.endDate && ev.endDate !== ev.date && <span>— {new Date(ev.endDate + 'T00:00:00').toLocaleDateString(locale)}</span>}
                          </div>
                          {ev.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ev.description}</p>}
                        </div>
                      </div>
                      {canCreate && (
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-300 hover:text-red-500 shrink-0" onClick={() => handleDelete(ev.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
