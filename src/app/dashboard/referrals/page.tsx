'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { Referral } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowRightLeft, Plus, Stethoscope, User, AlertTriangle, Search, CheckCircle2 } from 'lucide-react';

const URGENCY_META: Record<Referral['urgency'], { label: string; color: string }> = {
  routine:   { label: 'Oddiy',     color: 'bg-blue-100 text-blue-700' },
  urgent:    { label: 'Tezkor',    color: 'bg-orange-100 text-orange-700' },
  emergency: { label: 'Shoshilinch', color: 'bg-red-100 text-red-700' },
};

const STATUS_META: Record<Referral['status'], { label: string; color: string }> = {
  sent:      { label: 'Yuborildi', color: 'bg-yellow-100 text-yellow-700' },
  received:  { label: 'Qabul qilindi', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Bajarildi', color: 'bg-green-100 text-green-700' },
};

const EMPTY = { toClinicName: '', patientName: '', patientDob: '', diagnosis: '', urgency: 'routine' as Referral['urgency'], doctorName: '', notes: '' };

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

export default function ReferralsPage() {
  const { user, userRole, userProfile } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const canCreate = userRole === 'clinic' || userRole === 'admin' || userRole === 'doctor';

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const data = await requestJson<{ referrals: Referral[] }>('/api/referrals', token);
      setReferrals(data.referrals);
    }
    catch { toast.error('Yuklashda xato'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!user || !form.toClinicName || !form.patientName || !form.diagnosis || !form.doctorName) {
      toast.error('Majburiy maydonlarni to\'ldiring'); return;
    }
    setSaving(true);
    try {
      const clinicName = (userProfile as { clinicName?: string })?.clinicName ?? (userProfile as { fullName?: string })?.fullName ?? 'Klinika';
      const token = await user.getIdToken();
      await requestJson<Referral>('/api/referrals', token, {
        method: 'POST',
        body: JSON.stringify({
          fromClinicName: clinicName,
          ...form,
          patientDob: form.patientDob || undefined,
          notes: form.notes || undefined,
        }),
      });
      toast.success('Yo\'llanma yuborildi');
      setShowForm(false); setForm(EMPTY); await load();
    } catch { toast.error('Saqlashda xato'); }
    finally { setSaving(false); }
  }

  async function handleStatus(id: string, status: Referral['status']) {
    try {
      if (!user) return;
      const token = await user.getIdToken();
      await requestJson<Referral>('/api/referrals', token, {
        method: 'PATCH',
        body: JSON.stringify({ id, status }),
      });
      toast.success('Yangilandi');
      await load();
    }
    catch { toast.error('Xato'); }
  }

  const filtered = referrals.filter((r) => !search || r.patientName.toLowerCase().includes(search.toLowerCase()) || r.toClinicName.toLowerCase().includes(search.toLowerCase()) || r.diagnosis.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ArrowRightLeft className="w-6 h-6 text-purple-600" />Yo&apos;llanma Boshqaruvi</h1>
          <p className="text-sm text-muted-foreground mt-1">Bemorlarni boshqa muassasalarga yo&apos;llash</p>
        </div>
        {canCreate && <Button onClick={() => setShowForm(!showForm)} className="gap-2 shrink-0"><Plus className="w-4 h-4" />Yangi yo&apos;llanma</Button>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {(['sent','received','completed'] as const).map((s) => {
          const m = STATUS_META[s]; const cnt = referrals.filter((r) => r.status === s).length;
          return <Card key={s}><CardContent className="p-3 text-center"><p className="text-xl font-bold">{cnt}</p><span className={`text-xs rounded-full px-2 py-0.5 ${m.color}`}>{m.label}</span></CardContent></Card>;
        })}
      </div>

      {/* Form */}
      {showForm && canCreate && (
        <Card className="border-purple-200 bg-purple-50/10">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Yangi yo&apos;llanma yaratish</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Qayerga yuboriladi *</label><Input value={form.toClinicName} onChange={(e) => setForm({ ...form, toClinicName: e.target.value })} placeholder="Klinika nomi" /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Bemor ismi *</label><Input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} placeholder="To'liq ism" /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Tug'ilgan sana</label><Input type="date" value={form.patientDob} onChange={(e) => setForm({ ...form, patientDob: e.target.value })} /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Shifokor *</label><Input value={form.doctorName} onChange={(e) => setForm({ ...form, doctorName: e.target.value })} placeholder="Yo'llovchi shifokor" /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Tashxis *</label><Input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} placeholder="ICD-10 yoki erkin" /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Shoshilinchlik</label>
                <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value as Referral['urgency'] })} className="w-full h-10 rounded-md border border-input px-3 text-sm bg-background">
                  <option value="routine">Oddiy</option><option value="urgent">Tezkor</option><option value="emergency">Shoshilinch</option>
                </select>
              </div>
              <div className="sm:col-span-2"><label className="text-xs font-medium text-slate-500 mb-1 block">Izohlar</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Qo'shimcha ma'lumotlar..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="flex gap-2 justify-end"><Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Bekor</Button><Button size="sm" onClick={handleCreate} disabled={saving}>{saving ? 'Yuborilmoqda...' : 'Yuborish'}</Button></div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Bemor yoki klinika..." className="pl-9" /></div>

      {loading && <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>}
      {!loading && filtered.length === 0 && <div className="text-center py-16 bg-white rounded-xl border border-dashed"><ArrowRightLeft className="w-12 h-12 mx-auto mb-3 text-slate-200" /><p className="text-slate-500">Yo&apos;llanmalar topilmadi</p></div>}

      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((r) => {
            const um = URGENCY_META[r.urgency]; const sm = STATUS_META[r.status];
            return (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${um.color}`}>{um.label}</span>
                        <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${sm.color}`}>{sm.label}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-800 font-semibold"><User className="w-4 h-4 text-slate-400" />{r.patientName}{r.patientDob && <span className="font-normal text-slate-500 text-sm"> · {r.patientDob}</span>}</div>
                      <p className="text-sm text-slate-500 mt-0.5"><Stethoscope className="w-3.5 h-3.5 inline mr-1" />{r.diagnosis}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span>Yuborilgan: <span className="font-medium text-slate-600">{r.fromClinicName}</span></span>
                        <span>→</span>
                        <span>Qabul: <span className="font-medium text-slate-600">{r.toClinicName}</span></span>
                      </div>
                      {r.urgency === 'emergency' && <div className="flex items-center gap-1 text-xs text-red-600 mt-1"><AlertTriangle className="w-3 h-3" />Shoshilinch xizmat talab etiladi</div>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.status === 'sent' && <Button size="sm" variant="outline" className="h-8 text-xs text-blue-600" onClick={() => handleStatus(r.id, 'received')}>Qabul qilindi</Button>}
                      {r.status === 'received' && <Button size="sm" variant="outline" className="h-8 text-xs text-green-600" onClick={() => handleStatus(r.id, 'completed')}><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Bajarildi</Button>}
                      <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
