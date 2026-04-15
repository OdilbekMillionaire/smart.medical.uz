'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getStaff, createStaffMember, updateStaffMember, deleteStaffMember } from '@/lib/firestore';
import type { StaffMember } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Users, Plus, Pencil, Trash2, Phone, Search, CheckCircle2, UserMinus } from 'lucide-react';

const ROLES = ['Shifokor', 'Hamshira', 'Registrator', 'Laborant', 'Farmatsevt', 'Xo\'jalik', 'Muhofaza', 'Boshqa'];
const STATUS_META: Record<StaffMember['status'], { label: string; color: string }> = {
  active: { label: 'Faol', color: 'bg-green-100 text-green-700' },
  leave: { label: 'Ta\'tilda', color: 'bg-yellow-100 text-yellow-700' },
  dismissed: { label: 'Ishdan ketgan', color: 'bg-red-100 text-red-700' },
};

const EMPTY_FORM: { fullName: string; role: string; specialization: string; phone: string; email: string; hireDate: string; salary: string; status: StaffMember['status'] } = { fullName: '', role: ROLES[0], specialization: '', phone: '', email: '', hireDate: '', salary: '', status: 'active' };

export default function StaffPage() {
  const { user, userRole } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const canEdit = userRole === 'clinic' || userRole === 'admin';

  async function load() {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getStaff(user.uid);
      setStaff(data);
    } catch { toast.error('Xodimlarni yuklashda xato'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    if (!user || !form.fullName || !form.phone) { toast.error('Ism va telefon majburiy'); return; }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (editId) {
        await updateStaffMember(editId, { ...form, salary: form.salary ? Number(form.salary) : undefined });
        toast.success('Yangilandi');
      } else {
        await createStaffMember({
          clinicId: user.uid, ...form,
          salary: form.salary ? Number(form.salary) : undefined,
          createdAt: now,
        });
        toast.success('Xodim qo\'shildi');
      }
      setShowForm(false); setEditId(null); setForm(EMPTY_FORM);
      await load();
    } catch { toast.error('Saqlashda xato'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try { await deleteStaffMember(id); toast.success('O\'chirildi'); await load(); }
    catch { toast.error('O\'chirishda xato'); }
  }

  function startEdit(s: StaffMember) {
    setEditId(s.id);
    setForm({ fullName: s.fullName, role: s.role, specialization: s.specialization ?? '', phone: s.phone, email: s.email ?? '', hireDate: s.hireDate, salary: String(s.salary ?? ''), status: s.status });
    setShowForm(true);
  }

  const filtered = staff.filter((s) => {
    const ms = filterStatus === 'all' || s.status === filterStatus;
    const ms2 = !search || s.fullName.toLowerCase().includes(search.toLowerCase()) || s.role.toLowerCase().includes(search.toLowerCase());
    return ms && ms2;
  });

  const activeCount = staff.filter((s) => s.status === 'active').length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-blue-600" />Xodimlar Boshqaruvi</h1>
          <p className="text-sm text-muted-foreground mt-1">Klinika xodimlar ro'yxati — {activeCount} faol xodim</p>
        </div>
        {canEdit && (
          <Button onClick={() => { setEditId(null); setForm(EMPTY_FORM); setShowForm(!showForm); }} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Xodim qo&apos;shish
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {(['active', 'leave', 'dismissed'] as const).map((s) => {
          const m = STATUS_META[s]; const cnt = staff.filter((x) => x.status === s).length;
          return (
            <Card key={s} className={`cursor-pointer ${filterStatus === s ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}>
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold">{cnt}</p>
                <span className={`text-xs rounded-full px-2 py-0.5 ${m.color}`}>{m.label}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Form */}
      {showForm && canEdit && (
        <Card className="border-blue-200 bg-blue-50/20">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">{editId ? 'Tahrirlash' : 'Yangi xodim'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">To'liq ism *</label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Ism Familiya" /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Lavozim</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full h-10 rounded-md border border-input px-3 text-sm bg-background">
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Mutaxassislik</label><Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="Ixtiyoriy" /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Telefon *</label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+998..." /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Email</label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@..." type="email" /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Ishga kirgan sana</label><Input type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Maosh (so'm)</label><Input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} placeholder="0" /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Holat</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as StaffMember['status'] })} className="w-full h-10 rounded-md border border-input px-3 text-sm bg-background">
                  <option value="active">Faol</option><option value="leave">Ta'tilda</option><option value="dismissed">Ishdan ketgan</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setEditId(null); }}>Bekor</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ism yoki lavozim..." className="pl-9" /></div>
      </div>

      {loading && <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed"><Users className="w-12 h-12 mx-auto mb-3 text-slate-200" /><p className="text-slate-500">Xodimlar topilmadi</p></div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((s) => {
            const meta = STATUS_META[s.status];
            return (
              <Card key={s.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 font-bold text-blue-700 text-sm">{s.fullName.charAt(0)}</div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-800">{s.fullName}</p>
                          <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${meta.color}`}>{meta.label}</span>
                        </div>
                        <p className="text-sm text-slate-500">{s.role}{s.specialization ? ` · ${s.specialization}` : ''}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</span>
                          {s.hireDate && <span>Ishga kirgan: {s.hireDate}</span>}
                          {s.salary && <span>{s.salary.toLocaleString()} so'm</span>}
                        </div>
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex gap-2 shrink-0">
                        {s.status === 'active' && (
                          <Button size="sm" variant="outline" className="text-yellow-600 h-8 text-xs" onClick={() => updateStaffMember(s.id, { status: 'leave' }).then(load)}>
                            <UserMinus className="w-3.5 h-3.5 mr-1" /> Ta&apos;til
                          </Button>
                        )}
                        {s.status === 'leave' && (
                          <Button size="sm" variant="outline" className="text-green-600 h-8 text-xs" onClick={() => updateStaffMember(s.id, { status: 'active' }).then(load)}>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Faollashtirish
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600" onClick={() => startEdit(s)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-red-600" onClick={() => handleDelete(s.id)}>
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
    </div>
  );
}
