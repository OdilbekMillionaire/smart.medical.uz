'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '@/lib/firestore';
import type { InventoryItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Package, Plus, AlertTriangle, Search, Pencil, Trash2, TrendingDown } from 'lucide-react';

const CATEGORIES: { key: InventoryItem['category']; label: string; color: string }[] = [
  { key: 'medicine', label: 'Dori-darmon', color: 'bg-blue-100 text-blue-700' },
  { key: 'equipment', label: 'Jihozlar', color: 'bg-purple-100 text-purple-700' },
  { key: 'consumable', label: 'Sarflanuvchi', color: 'bg-orange-100 text-orange-700' },
  { key: 'reagent', label: 'Reagentlar', color: 'bg-teal-100 text-teal-700' },
];

const EMPTY = { name: '', category: 'medicine' as InventoryItem['category'], unit: 'dona', quantity: '', minQuantity: '', expiryDate: '', supplier: '', price: '' };

export default function InventoryPage() {
  const { user, userRole } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const canEdit = userRole === 'clinic' || userRole === 'admin';

  async function load() {
    if (!user) return;
    setLoading(true);
    try { setItems(await getInventory(user.uid)); }
    catch { toast.error('Yuklashda xato'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    if (!form.name || !form.quantity) { toast.error('Nom va miqdor majburiy'); return; }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const data = { ...form, quantity: Number(form.quantity), minQuantity: Number(form.minQuantity) || 0, price: form.price ? Number(form.price) : undefined, expiryDate: form.expiryDate || undefined, supplier: form.supplier || undefined, updatedAt: now };
      if (editId) {
        await updateInventoryItem(editId, data);
        toast.success('Yangilandi');
      } else {
        await createInventoryItem({ ...data, clinicId: user!.uid, createdAt: now });
        toast.success('Qo\'shildi');
      }
      setShowForm(false); setEditId(null); setForm(EMPTY); await load();
    } catch { toast.error('Saqlashda xato'); }
    finally { setSaving(false); }
  }

  function startEdit(item: InventoryItem) {
    setEditId(item.id);
    setForm({ name: item.name, category: item.category, unit: item.unit, quantity: String(item.quantity), minQuantity: String(item.minQuantity), expiryDate: item.expiryDate ?? '', supplier: item.supplier ?? '', price: String(item.price ?? '') });
    setShowForm(true);
  }

  const filtered = items.filter((i) => {
    const mc = filterCat === 'all' || i.category === filterCat;
    const ms = !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.supplier ?? '').toLowerCase().includes(search.toLowerCase());
    return mc && ms;
  });

  const lowStock = items.filter((i) => i.quantity <= i.minQuantity).length;
  const expiringSoon = items.filter((i) => {
    if (!i.expiryDate) return false;
    return (new Date(i.expiryDate).getTime() - Date.now()) / 86400000 <= 30;
  }).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="w-6 h-6 text-emerald-600" />Inventar Boshqaruvi</h1>
          <p className="text-sm text-muted-foreground mt-1">Dori-darmonlar, jihozlar va sarflanuvchi materiallar</p>
        </div>
        {canEdit && <Button onClick={() => { setEditId(null); setForm(EMPTY); setShowForm(!showForm); }} className="gap-2 shrink-0"><Plus className="w-4 h-4" />Yangi element</Button>}
      </div>

      {/* Alert cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-slate-300"><CardContent className="p-3"><p className="text-xs text-slate-500">Jami pozitsiya</p><p className="text-xl font-bold">{items.length}</p></CardContent></Card>
        <Card className="border-l-4 border-l-red-400"><CardContent className="p-3"><p className="text-xs text-slate-500">Kam qolgan</p><p className="text-xl font-bold text-red-600">{lowStock}</p></CardContent></Card>
        <Card className="border-l-4 border-l-orange-400"><CardContent className="p-3"><p className="text-xs text-slate-500">Muddati yaqin</p><p className="text-xl font-bold text-orange-600">{expiringSoon}</p></CardContent></Card>
        <Card className="border-l-4 border-l-blue-400"><CardContent className="p-3"><p className="text-xs text-slate-500">Kategoriyalar</p><p className="text-xl font-bold text-blue-600">4</p></CardContent></Card>
      </div>

      {/* Form */}
      {showForm && canEdit && (
        <Card className="border-emerald-200 bg-emerald-50/20">
          <CardHeader className="pb-3"><CardTitle className="text-sm">{editId ? 'Tahrirlash' : 'Yangi element qo\'shish'}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Nomi *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Mahsulot nomi" /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Kategoriya</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as InventoryItem['category'] })} className="w-full h-10 rounded-md border border-input px-3 text-sm bg-background">
                  {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">O'lchov birligi</label>
                <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full h-10 rounded-md border border-input px-3 text-sm bg-background">
                  {['dona', 'ml', 'mg', 'g', 'kg', 'litr', 'paket', 'quti', 'ampula', 'blister'].map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Miqdor *</label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Min. miqdor (ogohlantirish)</label><Input type="number" value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: e.target.value })} placeholder="0" /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Yaroqlilik muddati</label><Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Ta'minotchi</label><Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Firma nomi" /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Narx (so'm)</label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" /></div>
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
        <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nomi yoki ta'minotchi..." className="pl-9" /></div>
        <div className="flex gap-2 flex-wrap">
          {[{ key: 'all', label: 'Barchasi' }, ...CATEGORIES].map(({ key, label }) => (
            <button key={key} onClick={() => setFilterCat(key)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterCat === key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>{label}</button>
          ))}
        </div>
      </div>

      {loading && <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed"><Package className="w-12 h-12 mx-auto mb-3 text-slate-200" /><p className="text-slate-500">Inventar topilmadi</p></div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead><tr className="border-b bg-slate-50/50">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Nomi</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Kategoriya</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500">Miqdor</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Muddati</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500">Ta'minotchi</th>
              {canEdit && <th className="px-3 py-2.5" />}
            </tr></thead>
            <tbody>
              {filtered.map((item) => {
                const cat = CATEGORIES.find((c) => c.key === item.category);
                const isLow = item.quantity <= item.minQuantity;
                const isExpiring = item.expiryDate && (new Date(item.expiryDate).getTime() - Date.now()) / 86400000 <= 30;
                return (
                  <tr key={item.id} className={`border-b last:border-0 hover:bg-slate-50 transition-colors ${isLow ? 'bg-red-50/30' : ''}`}>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        {isLow && <TrendingDown className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                        <span className="font-medium text-slate-800">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5"><span className={`text-xs rounded-full px-2 py-0.5 font-medium ${cat?.color}`}>{cat?.label}</span></td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={`font-semibold ${isLow ? 'text-red-600' : 'text-slate-700'}`}>{item.quantity}</span>
                      <span className="text-slate-400 text-xs ml-1">{item.unit}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      {item.expiryDate ? (
                        <span className={isExpiring ? 'text-orange-600 font-medium' : 'text-slate-500'}>
                          {isExpiring && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                          {new Date(item.expiryDate).toLocaleDateString('ru-RU')}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">{item.supplier ?? '—'}</td>
                    {canEdit && (
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600" onClick={() => startEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-red-600" onClick={() => deleteInventoryItem(item.id).then(load)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
