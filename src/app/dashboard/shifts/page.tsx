'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getShiftsByClinic, createShift, deleteShift } from '@/lib/firestore';
import type { Shift } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Clock4, Plus, Trash2, Calendar, User } from 'lucide-react';

const ROLES = ['Shifokor', 'Hamshira', 'Registrator', 'Laborant', 'Xavfsizlik', 'Boshqa'];
const DAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sha', 'Ya'];

const EMPTY = { staffName: '', role: 'Shifokor', date: '', startTime: '08:00', endTime: '17:00', notes: '' };

export default function ShiftsPage() {
  const { user, userRole } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filterWeek, setFilterWeek] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    return d.toISOString().split('T')[0];
  });

  const canEdit = userRole === 'clinic' || userRole === 'admin';

  async function load() {
    if (!user) return;
    setLoading(true);
    try { setShifts(await getShiftsByClinic(user.uid)); }
    catch { toast.error('Yuklashda xato'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate() {
    if (!user || !form.staffName || !form.date) { toast.error('Xodim ismi va sana majburiy'); return; }
    setSaving(true);
    try {
      await createShift({ clinicId: user.uid, staffId: user.uid + '_' + Date.now(), staffName: form.staffName, date: form.date, startTime: form.startTime, endTime: form.endTime, role: form.role, notes: form.notes || undefined, createdAt: new Date().toISOString() });
      toast.success('Navbat qo\'shildi');
      setShowForm(false); setForm(EMPTY); await load();
    } catch { toast.error('Saqlashda xato'); }
    finally { setSaving(false); }
  }

  // Build week array
  const weekStart = new Date(filterWeek);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const weekShifts = shifts.filter((s) => weekDays.includes(s.date));

  function navWeek(dir: number) {
    const d = new Date(filterWeek);
    d.setDate(d.getDate() + dir * 7);
    setFilterWeek(d.toISOString().split('T')[0]);
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Clock4 className="w-6 h-6 text-blue-600" />Navbat Jadvali</h1>
          <p className="text-sm text-muted-foreground mt-1">Xodimlar ish navbatlari</p>
        </div>
        {canEdit && <Button onClick={() => setShowForm(!showForm)} className="gap-2 shrink-0"><Plus className="w-4 h-4" />Navbat qo&apos;shish</Button>}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-l-4 border-l-blue-400"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-blue-600">{shifts.filter((s) => s.date === today).length}</p><p className="text-xs text-slate-500">Bugungi navbatlar</p></CardContent></Card>
        <Card className="border-l-4 border-l-slate-300"><CardContent className="p-3 text-center"><p className="text-xl font-bold">{weekShifts.length}</p><p className="text-xs text-slate-500">Bu hafta</p></CardContent></Card>
        <Card className="border-l-4 border-l-green-400"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-green-600">{new Set(weekShifts.map((s) => s.staffName)).size}</p><p className="text-xs text-slate-500">Faol xodimlar</p></CardContent></Card>
      </div>

      {/* Form */}
      {showForm && canEdit && (
        <Card className="border-blue-200 bg-blue-50/10">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Yangi navbat qo&apos;shish</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Xodim ismi *</label><Input value={form.staffName} onChange={(e) => setForm({ ...form, staffName: e.target.value })} placeholder="To'liq ism" /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Lavozim</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full h-10 rounded-md border border-input px-3 text-sm bg-background">
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Sana *</label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Boshlanish</label><Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Tugash</label><Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Izoh</label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ixtiyoriy" /></div>
            </div>
            <div className="flex gap-2 justify-end"><Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Bekor</Button><Button size="sm" onClick={handleCreate} disabled={saving}>{saving ? 'Saqlanmoqda...' : 'Qo\'shish'}</Button></div>
          </CardContent>
        </Card>
      )}

      {/* Week navigator */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navWeek(-1)}>← Oldingi</Button>
        <span className="text-sm font-medium text-slate-700">{new Date(weekStart).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })} — {new Date(weekDays[6]).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        <Button variant="outline" size="sm" onClick={() => navWeek(1)}>Keyingi →</Button>
      </div>

      {loading && <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>}

      {/* Weekly grid */}
      {!loading && (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-1 min-w-[560px]">
            {weekDays.map((day, i) => {
              const dayShifts = weekShifts.filter((s) => s.date === day);
              const isToday = day === today;
              return (
                <div key={day} className={`rounded-xl border p-2 min-h-[120px] ${isToday ? 'border-blue-300 bg-blue-50/30' : 'bg-white border-slate-100'}`}>
                  <div className={`text-xs font-semibold mb-2 text-center ${isToday ? 'text-blue-600' : 'text-slate-500'}`}>
                    <div>{DAYS[i]}</div>
                    <div className={`text-base font-bold ${isToday ? 'text-blue-700' : 'text-slate-800'}`}>{new Date(day + 'T00:00:00').getDate()}</div>
                  </div>
                  <div className="space-y-1">
                    {dayShifts.map((s) => (
                      <div key={s.id} className="text-xs bg-blue-100 text-blue-800 rounded p-1 relative group">
                        <p className="font-medium truncate">{s.staffName}</p>
                        <p className="text-blue-600">{s.startTime}–{s.endTime}</p>
                        {canEdit && (
                          <button onClick={() => deleteShift(s.id).then(load)} className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity">×</button>
                        )}
                      </div>
                    ))}
                    {dayShifts.length === 0 && <p className="text-xs text-slate-300 text-center mt-3">—</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List view */}
      {!loading && weekShifts.length > 0 && (
        <Card>
          <CardHeader className="pb-3 border-b bg-slate-50"><CardTitle className="text-sm">Haftalik navbatlar ro&apos;yxati</CardTitle></CardHeader>
          <div className="divide-y">
            {weekShifts.sort((a, b) => (a.date + a.startTime) < (b.date + b.startTime) ? -1 : 1).map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">{s.staffName.charAt(0)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-800 text-sm">{s.staffName}</p>
                    <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">{s.role}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(s.date + 'T00:00:00').toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{s.startTime} – {s.endTime}</span>
                  </div>
                </div>
                {canEdit && <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-300 hover:text-red-500" onClick={() => deleteShift(s.id).then(load)}><Trash2 className="w-3.5 h-3.5" /></Button>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
