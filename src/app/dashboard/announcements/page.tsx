'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAnnouncementsByClinic, getAllAnnouncements, createAnnouncement, deleteAnnouncement } from '@/lib/firestore';
import type { Announcement } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Megaphone, Plus, Pin, Trash2, AlertTriangle, Info, Bell } from 'lucide-react';

const PRIORITY_META: Record<Announcement['priority'], { label: string; color: string; icon: React.ReactNode; border: string }> = {
  normal:    { label: 'Oddiy',      color: 'bg-slate-100 text-slate-600',    icon: <Info className="w-4 h-4" />,         border: 'border-l-slate-300' },
  important: { label: 'Muhim',      color: 'bg-blue-100 text-blue-700',      icon: <Bell className="w-4 h-4" />,         border: 'border-l-blue-500' },
  urgent:    { label: 'Shoshilinch', color: 'bg-red-100 text-red-700',       icon: <AlertTriangle className="w-4 h-4" />, border: 'border-l-red-500' },
};

const EMPTY = { title: '', body: '', priority: 'normal' as Announcement['priority'], pinned: false, targetRole: 'all', expiresAt: '' };

export default function AnnouncementsPage() {
  const { user, userRole, userProfile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const canCreate = userRole === 'clinic' || userRole === 'admin';

  async function load() {
    if (!user) return;
    setLoading(true);
    try {
      const data = userRole === 'admin' ? await getAllAnnouncements() : await getAnnouncementsByClinic(user.uid);
      setAnnouncements(data);
    } catch { toast.error('Yuklashda xato'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [user, userRole]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate() {
    if (!user || !form.title || !form.body) { toast.error('Sarlavha va matn majburiy'); return; }
    setSaving(true);
    try {
      await createAnnouncement({
        clinicId: user.uid, authorId: user.uid,
        authorName: userProfile?.displayName ?? user.email ?? '',
        ...form, expiresAt: form.expiresAt || undefined,
        createdAt: new Date().toISOString(),
      });
      toast.success('E\'lon qo\'shildi');
      setShowForm(false); setForm(EMPTY); await load();
    } catch { toast.error('Saqlashda xato'); }
    finally { setSaving(false); }
  }

  const pinned = announcements.filter((a) => a.pinned);
  const regular = announcements.filter((a) => !a.pinned);
  const now = new Date().toISOString();
  const active = announcements.filter((a) => !a.expiresAt || a.expiresAt > now);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone className="w-6 h-6 text-orange-500" />E&apos;lonlar Taxtasi</h1>
          <p className="text-sm text-muted-foreground mt-1">{active.length} ta faol e&apos;lon</p>
        </div>
        {canCreate && <Button onClick={() => setShowForm(!showForm)} className="gap-2 shrink-0"><Plus className="w-4 h-4" />E&apos;lon qo&apos;shish</Button>}
      </div>

      {/* Form */}
      {showForm && canCreate && (
        <Card className="border-orange-200 bg-orange-50/10">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Yangi e&apos;lon yaratish</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2"><label className="text-xs font-medium text-slate-500 mb-1 block">Sarlavha *</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="E'lon sarlavhasi" /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Muhimlik darajasi</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Announcement['priority'] })} className="w-full h-10 rounded-md border border-input px-3 text-sm bg-background">
                  {(Object.keys(PRIORITY_META) as Announcement['priority'][]).map((p) => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Murojaat qiluvchi</label>
                <select value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })} className="w-full h-10 rounded-md border border-input px-3 text-sm bg-background">
                  <option value="all">Barcha</option><option value="doctor">Shifokorlar</option><option value="patient">Bemorlar</option>
                </select>
              </div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Amal qilish muddati</label><Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="pinned" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} className="w-4 h-4" />
                <label htmlFor="pinned" className="text-sm text-slate-600">Tepada mahkamlash (pin)</label>
              </div>
              <div className="sm:col-span-2"><label className="text-xs font-medium text-slate-500 mb-1 block">Matn *</label>
                <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} placeholder="E'lon matni..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="flex gap-2 justify-end"><Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Bekor</Button><Button size="sm" onClick={handleCreate} disabled={saving}>{saving ? 'Saqlanmoqda...' : 'E\'lon qilish'}</Button></div>
          </CardContent>
        </Card>
      )}

      {loading && <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>}
      {!loading && announcements.length === 0 && <div className="text-center py-16 bg-white rounded-xl border border-dashed"><Megaphone className="w-12 h-12 mx-auto mb-3 text-slate-200" /><p className="text-slate-500">Hali e&apos;lon yo&apos;q</p></div>}

      {/* Pinned */}
      {!loading && pinned.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Pin className="w-3 h-3" />Mahkamlangan</p>
          <div className="space-y-3">
            {pinned.map((a) => <AnnouncementCard key={a.id} a={a} canDelete={canCreate} onDelete={() => deleteAnnouncement(a.id).then(load)} />)}
          </div>
        </div>
      )}

      {/* Regular */}
      {!loading && regular.length > 0 && (
        <div>
          {pinned.length > 0 && <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Barchasi</p>}
          <div className="space-y-3">
            {regular.map((a) => <AnnouncementCard key={a.id} a={a} canDelete={canCreate} onDelete={() => deleteAnnouncement(a.id).then(load)} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function AnnouncementCard({ a, canDelete, onDelete }: { a: Announcement; canDelete: boolean; onDelete: () => void }) {
  const pm = PRIORITY_META[a.priority];
  const isExpired = a.expiresAt && a.expiresAt < new Date().toISOString();
  return (
    <Card className={`border-l-4 ${pm.border} ${isExpired ? 'opacity-60' : ''} hover:shadow-sm transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 font-medium ${pm.color}`}>{pm.icon}{pm.label}</span>
              {a.pinned && <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Pin className="w-3 h-3" />Mahkamlangan</span>}
              {a.targetRole && a.targetRole !== 'all' && <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">{a.targetRole === 'doctor' ? 'Shifokorlar' : 'Bemorlar'}</span>}
              {isExpired && <span className="text-xs text-red-500">Muddati o&apos;tgan</span>}
            </div>
            <h3 className="font-semibold text-slate-800">{a.title}</h3>
            <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{a.body}</p>
            <p className="text-xs text-slate-400 mt-2">{a.authorName} · {new Date(a.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })}{a.expiresAt && ` · Muddati: ${new Date(a.expiresAt).toLocaleDateString('ru-RU')}`}</p>
          </div>
          {canDelete && <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-300 hover:text-red-500 shrink-0" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /></Button>}
        </div>
      </CardContent>
    </Card>
  );
}
