'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getComplaintsByClinic, getAllComplaints, createComplaint, updateComplaintStatus } from '@/lib/firestore';
import type { Complaint } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { AlertCircle, Plus, Search, CheckCircle2, Clock, XCircle, MessageSquare } from 'lucide-react';

const STATUS_META: Record<Complaint['status'], { label: string; color: string; icon: React.ReactNode }> = {
  open:         { label: 'Ochiq',         color: 'bg-red-100 text-red-700',    icon: <AlertCircle className="w-3.5 h-3.5" /> },
  investigating:{ label: 'Ko\'rib chiqilmoqda', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3.5 h-3.5" /> },
  resolved:     { label: 'Hal qilindi',   color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  closed:       { label: 'Yopildi',       color: 'bg-slate-100 text-slate-600', icon: <XCircle className="w-3.5 h-3.5" /> },
};

const PRIORITY_META: Record<Complaint['priority'], { label: string; color: string }> = {
  low:    { label: 'Past',    color: 'text-slate-500' },
  medium: { label: 'O\'rta',  color: 'text-yellow-600' },
  high:   { label: 'Yuqori', color: 'text-red-600 font-semibold' },
};

const CATEGORIES: { key: Complaint['category']; label: string }[] = [
  { key: 'service', label: 'Xizmat' },
  { key: 'staff', label: 'Xodim' },
  { key: 'billing', label: 'To\'lov' },
  { key: 'facility', label: 'Muassasa' },
  { key: 'other', label: 'Boshqa' },
];

const EMPTY = { complainantName: '', complainantPhone: '', subject: '', description: '', category: 'service' as Complaint['category'], priority: 'medium' as Complaint['priority'] };

export default function ComplaintsPage() {
  const { user, userRole } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');

  const isAdmin = userRole === 'admin';

  async function load() {
    if (!user) return;
    setLoading(true);
    try {
      const data = isAdmin ? await getAllComplaints() : await getComplaintsByClinic(user.uid);
      setComplaints(data);
    } catch { toast.error('Yuklashda xato'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [user, userRole]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate() {
    if (!user || !form.complainantName || !form.subject || !form.description) { toast.error('Majburiy maydonlarni to\'ldiring'); return; }
    setSaving(true);
    try {
      await createComplaint({ ...form, clinicId: user.uid, status: 'open', createdAt: new Date().toISOString() });
      toast.success('Shikoyat qo\'shildi');
      setShowForm(false); setForm(EMPTY); await load();
    } catch { toast.error('Saqlashda xato'); }
    finally { setSaving(false); }
  }

  async function handleResolve(id: string) {
    try {
      await updateComplaintStatus(id, 'resolved', resolution);
      toast.success('Hal qilindi deb belgilandi');
      setSelectedId(null); setResolution(''); await load();
    } catch { toast.error('Yangilashda xato'); }
  }

  async function quickStatus(id: string, status: Complaint['status']) {
    try { await updateComplaintStatus(id, status); toast.success('Yangilandi'); await load(); }
    catch { toast.error('Xato'); }
  }

  const filtered = complaints.filter((c) => {
    const ms = filterStatus === 'all' || c.status === filterStatus;
    const ms2 = !search || c.subject.toLowerCase().includes(search.toLowerCase()) || c.complainantName.toLowerCase().includes(search.toLowerCase());
    return ms && ms2;
  });

  const openCount = complaints.filter((c) => c.status === 'open').length;
  const investigatingCount = complaints.filter((c) => c.status === 'investigating').length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><AlertCircle className="w-6 h-6 text-red-500" />Shikoyatlar Boshqaruvi</h1>
          <p className="text-sm text-muted-foreground mt-1">Bemor va xodim shikoyatlarini kuzatish</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2 shrink-0"><Plus className="w-4 h-4" />Shikoyat qo&apos;shish</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['open','investigating','resolved','closed'] as const).map((s) => {
          const m = STATUS_META[s]; const cnt = complaints.filter((c) => c.status === s).length;
          return <Card key={s} className="cursor-pointer" onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}><CardContent className="p-3 text-center"><p className="text-lg font-bold">{cnt}</p><span className={`text-xs rounded-full px-2 py-0.5 ${m.color}`}>{m.label}</span></CardContent></Card>;
        })}
      </div>

      {(openCount > 0 || investigatingCount > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <p className="text-sm text-red-700 font-medium">{openCount} ta ochiq, {investigatingCount} ta ko&apos;rib chiqilayotgan shikoyat mavjud</p>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <Card className="border-red-200 bg-red-50/10">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Yangi shikoyat qo&apos;shish</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Shikoyat beruvchi *</label><Input value={form.complainantName} onChange={(e) => setForm({ ...form, complainantName: e.target.value })} placeholder="To'liq ism" /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Telefon</label><Input value={form.complainantPhone} onChange={(e) => setForm({ ...form, complainantPhone: e.target.value })} placeholder="+998..." /></div>
              <div className="sm:col-span-2"><label className="text-xs font-medium text-slate-500 mb-1 block">Mavzu *</label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Shikoyat mavzusi" /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Kategoriya</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Complaint['category'] })} className="w-full h-10 rounded-md border border-input px-3 text-sm bg-background">
                  {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Muhimlik</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Complaint['priority'] })} className="w-full h-10 rounded-md border border-input px-3 text-sm bg-background">
                  <option value="low">Past</option><option value="medium">O'rta</option><option value="high">Yuqori</option>
                </select>
              </div>
              <div className="sm:col-span-2"><label className="text-xs font-medium text-slate-500 mb-1 block">Tavsif *</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Shikoyat tafsilotlari..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="flex gap-2 justify-end"><Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Bekor</Button><Button size="sm" onClick={handleCreate} disabled={saving}>{saving ? 'Saqlanmoqda...' : 'Qo\'shish'}</Button></div>
          </CardContent>
        </Card>
      )}

      {/* Resolution dialog */}
      {selectedId && (
        <Card className="border-green-200 bg-green-50/20">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold text-green-700">Hal qilish yechimi yozing</p>
            <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} placeholder="Qanday hal qilindi..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
            <div className="flex gap-2 justify-end"><Button variant="outline" size="sm" onClick={() => setSelectedId(null)}>Bekor</Button><Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleResolve(selectedId)}>Tasdiqlash</Button></div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Shikoyat qidirish..." className="pl-9" /></div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'open', 'investigating', 'resolved', 'closed'].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${filterStatus === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
              {s === 'all' ? 'Barchasi' : STATUS_META[s as Complaint['status']].label}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed"><MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-200" /><p className="text-slate-500">Shikoyatlar topilmadi</p></div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((c) => {
            const sm = STATUS_META[c.status]; const pm = PRIORITY_META[c.priority];
            const cat = CATEGORIES.find((x) => x.key === c.category);
            return (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 font-medium ${sm.color}`}>{sm.icon}{sm.label}</span>
                        <span className="text-xs text-slate-500">{cat?.label}</span>
                        <span className={`text-xs ${pm.color}`}>{pm.label} muhimlik</span>
                      </div>
                      <p className="font-semibold text-slate-800">{c.subject}</p>
                      <p className="text-sm text-slate-500 mt-0.5">Shikoyatchi: {c.complainantName}{c.complainantPhone ? ` · ${c.complainantPhone}` : ''}</p>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.description}</p>
                      {c.resolution && <p className="text-xs text-green-700 mt-1 bg-green-50 rounded px-2 py-1">Yechim: {c.resolution}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {c.status === 'open' && <Button size="sm" variant="outline" className="h-8 text-xs text-yellow-600 border-yellow-200" onClick={() => quickStatus(c.id, 'investigating')}><Clock className="w-3.5 h-3.5 mr-1" />Ko&apos;rib chiqish</Button>}
                      {(c.status === 'open' || c.status === 'investigating') && <Button size="sm" variant="outline" className="h-8 text-xs text-green-600 border-green-200" onClick={() => setSelectedId(c.id)}><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Hal qilish</Button>}
                      {c.status === 'resolved' && <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => quickStatus(c.id, 'closed')}>Yopish</Button>}
                      <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString('ru-RU')}</span>
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
