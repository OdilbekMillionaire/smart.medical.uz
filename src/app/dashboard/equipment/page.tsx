'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getEquipment, createEquipment, updateEquipment, deleteEquipment } from '@/lib/firestore';
import type { Equipment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Wrench, Plus, AlertTriangle, Search, Pencil, Trash2, CheckCircle2 } from 'lucide-react';

const STATUS_META: Record<Equipment['status'], { label: string; color: string }> = {
  operational:    { label: 'Ishlamoqda',    color: 'bg-green-100 text-green-700' },
  maintenance:    { label: 'Ta\'mirda',      color: 'bg-yellow-100 text-yellow-700' },
  broken:         { label: 'Ishlamayapti', color: 'bg-red-100 text-red-700' },
  decommissioned: { label: 'Hisobdan chiqarilgan', color: 'bg-slate-100 text-slate-500' },
};

const EMPTY = { name: '', model: '', serialNumber: '', purchaseDate: '', warrantyExpiry: '', lastService: '', nextService: '', status: 'operational' as Equipment['status'], location: '', notes: '' };

export default function EquipmentPage() {
  const { user, userRole } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const canEdit = userRole === 'clinic' || userRole === 'admin';

  async function load() {
    if (!user) return;
    setLoading(true);
    try { setEquipment(await getEquipment(user.uid)); }
    catch { toast.error('Yuklashda xato'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    if (!user || !form.name || !form.location) { toast.error('Nom va joylashuv majburiy'); return; }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const clean = { ...form, serialNumber: form.serialNumber || undefined, purchaseDate: form.purchaseDate || undefined, warrantyExpiry: form.warrantyExpiry || undefined, lastService: form.lastService || undefined, nextService: form.nextService || undefined, notes: form.notes || undefined };
      if (editId) {
        await updateEquipment(editId, clean);
        toast.success('Yangilandi');
      } else {
        await createEquipment({ ...clean, clinicId: user.uid, createdAt: now });
        toast.success('Jihozlar ro\'yxatiga qo\'shildi');
      }
      setShowForm(false); setEditId(null); setForm(EMPTY); await load();
    } catch { toast.error('Saqlashda xato'); }
    finally { setSaving(false); }
  }

  function startEdit(e: Equipment) {
    setEditId(e.id);
    setForm({ name: e.name, model: e.model, serialNumber: e.serialNumber ?? '', purchaseDate: e.purchaseDate ?? '', warrantyExpiry: e.warrantyExpiry ?? '', lastService: e.lastService ?? '', nextService: e.nextService ?? '', status: e.status, location: e.location, notes: e.notes ?? '' });
    setShowForm(true);
  }

  const filtered = equipment.filter((e) => {
    const ms = filterStatus === 'all' || e.status === filterStatus;
    const ms2 = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.location.toLowerCase().includes(search.toLowerCase()) || e.model.toLowerCase().includes(search.toLowerCase());
    return ms && ms2;
  });

  const brokenCount = equipment.filter((e) => e.status === 'broken').length;
  const maintenanceCount = equipment.filter((e) => e.status === 'maintenance').length;
  const warrantyExpiring = equipment.filter((e) => e.warrantyExpiry && (new Date(e.warrantyExpiry).getTime() - Date.now()) / 86400000 <= 30 && e.status !== 'decommissioned').length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Wrench className="w-6 h-6 text-slate-700" />Tibbiy Jihozlar</h1>
          <p className="text-sm text-muted-foreground mt-1">Klinika jihozlar registri va texnik xizmat jadvali</p>
        </div>
        {canEdit && <Button onClick={() => { setEditId(null); setForm(EMPTY); setShowForm(!showForm); }} className="gap-2 shrink-0"><Plus className="w-4 h-4" />Jihoz qo&apos;shish</Button>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-slate-300"><CardContent className="p-3"><p className="text-xs text-slate-500">Jami</p><p className="text-xl font-bold">{equipment.length}</p></CardContent></Card>
        <Card className="border-l-4 border-l-green-400"><CardContent className="p-3"><p className="text-xs text-slate-500">Ishlayapti</p><p className="text-xl font-bold text-green-600">{equipment.filter((e) => e.status === 'operational').length}</p></CardContent></Card>
        <Card className="border-l-4 border-l-red-400"><CardContent className="p-3"><p className="text-xs text-slate-500">Ishlamayapti</p><p className="text-xl font-bold text-red-600">{brokenCount}</p></CardContent></Card>
        <Card className="border-l-4 border-l-orange-400"><CardContent className="p-3"><p className="text-xs text-slate-500">Kafolat tugayapti</p><p className="text-xl font-bold text-orange-600">{warrantyExpiring}</p></CardContent></Card>
      </div>

      {(brokenCount > 0 || maintenanceCount > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">{brokenCount > 0 && `${brokenCount} ta jihoz ishlamayapti. `}{maintenanceCount > 0 && `${maintenanceCount} ta jihozda ta'mirlash davom etmoqda.`}</p>
        </div>
      )}

      {/* Form */}
      {showForm && canEdit && (
        <Card className="border-slate-200 bg-slate-50/20">
          <CardHeader className="pb-3"><CardTitle className="text-sm">{editId ? 'Tahrirlash' : 'Yangi jihoz qo\'shish'}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Jihoz nomi *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Masalan: EKG apparati" /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Model</label><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Model raqami" /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Seriya raqami</label><Input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} placeholder="SN-..." /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Joylashuvi *</label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Xona, bo'lim..." /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Holat</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Equipment['status'] })} className="w-full h-10 rounded-md border border-input px-3 text-sm bg-background">
                  {(Object.keys(STATUS_META) as Equipment['status'][]).map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Sotib olingan sana</label><Input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Kafolat tugaydi</label><Input type="date" value={form.warrantyExpiry} onChange={(e) => setForm({ ...form, warrantyExpiry: e.target.value })} /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Oxirgi texnik xizmat</label><Input type="date" value={form.lastService} onChange={(e) => setForm({ ...form, lastService: e.target.value })} /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Keyingi texnik xizmat</label><Input type="date" value={form.nextService} onChange={(e) => setForm({ ...form, nextService: e.target.value })} /></div>
            </div>
            <div><label className="text-xs font-medium text-slate-500 mb-1 block">Izohlar</label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Qo'shimcha ma'lumotlar" /></div>
            <div className="flex gap-2 justify-end"><Button variant="outline" size="sm" onClick={() => { setShowForm(false); setEditId(null); }}>Bekor</Button><Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Button></div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, model yoki xona..." className="pl-9" /></div>
        <div className="flex gap-2 flex-wrap">
          {[{ key: 'all', label: 'Barchasi' }, ...Object.entries(STATUS_META).map(([k, v]) => ({ key: k, label: v.label }))].map(({ key, label }) => (
            <button key={key} onClick={() => setFilterStatus(key)} className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${filterStatus === key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>{label}</button>
          ))}
        </div>
      </div>

      {loading && <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>}
      {!loading && filtered.length === 0 && <div className="text-center py-16 bg-white rounded-xl border border-dashed"><Wrench className="w-12 h-12 mx-auto mb-3 text-slate-200" /><p className="text-slate-500">Jihozlar topilmadi</p></div>}

      {!loading && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((eq) => {
            const sm = STATUS_META[eq.status];
            const warrantyDays = eq.warrantyExpiry ? (new Date(eq.warrantyExpiry).getTime() - Date.now()) / 86400000 : null;
            const isWarrantyExpiring = warrantyDays !== null && warrantyDays <= 30 && warrantyDays > 0;
            return (
              <Card key={eq.id} className={`hover:shadow-md transition-shadow ${eq.status === 'broken' ? 'border-red-200' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{eq.name}</p>
                      <p className="text-xs text-slate-500">{eq.model}</p>
                    </div>
                    <span className={`text-xs rounded-full px-2 py-0.5 font-medium shrink-0 ml-2 ${sm.color}`}>{sm.label}</span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-500">
                    <p>Joylashuvi: <span className="text-slate-700 font-medium">{eq.location}</span></p>
                    {eq.serialNumber && <p>SN: <span className="font-mono">{eq.serialNumber}</span></p>}
                    {eq.nextService && (
                      <p className={`flex items-center gap-1 ${new Date(eq.nextService) < new Date() ? 'text-red-600' : ''}`}>
                        {new Date(eq.nextService) < new Date() && <AlertTriangle className="w-3 h-3" />}
                        TX: {new Date(eq.nextService).toLocaleDateString('ru-RU')}
                      </p>
                    )}
                    {isWarrantyExpiring && <p className="text-orange-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Kafolat {Math.round(warrantyDays ?? 0)} kunda tugaydi</p>}
                  </div>
                  {canEdit && (
                    <div className="flex gap-1 mt-3 pt-3 border-t border-slate-100">
                      {eq.status === 'broken' && <Button size="sm" variant="outline" className="h-7 text-xs text-green-600 flex-1" onClick={() => updateEquipment(eq.id, { status: 'operational' }).then(load)}><CheckCircle2 className="w-3 h-3 mr-1" />Tuzatildi</Button>}
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 ml-auto text-slate-400 hover:text-blue-600" onClick={() => startEdit(eq)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-red-600" onClick={() => deleteEquipment(eq.id).then(load)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
