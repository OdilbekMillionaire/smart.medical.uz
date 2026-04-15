'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Droplets, Plus, AlertTriangle, CheckCircle2, Search, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface BloodStock {
  type: string;
  units: number;
  minUnits: number;
  expiring: number; // units expiring within 7 days
}

interface BloodRequest {
  id: string;
  patientName: string;
  bloodType: string;
  units: number;
  urgency: 'routine' | 'urgent' | 'emergency';
  requestedBy: string;
  date: string;
  status: 'pending' | 'fulfilled' | 'cancelled';
}

const INITIAL_STOCK: BloodStock[] = [
  { type: 'A+',  units: 12, minUnits: 5, expiring: 2 },
  { type: 'A-',  units: 3,  minUnits: 3, expiring: 0 },
  { type: 'B+',  units: 8,  minUnits: 5, expiring: 1 },
  { type: 'B-',  units: 1,  minUnits: 3, expiring: 0 },
  { type: 'O+',  units: 20, minUnits: 8, expiring: 3 },
  { type: 'O-',  units: 2,  minUnits: 5, expiring: 0 },
  { type: 'AB+', units: 5,  minUnits: 3, expiring: 0 },
  { type: 'AB-', units: 1,  minUnits: 2, expiring: 0 },
];

const INITIAL_REQUESTS: BloodRequest[] = [
  { id: '1', patientName: 'Azimov B.', bloodType: 'O+', units: 2, urgency: 'urgent', requestedBy: 'Dr. Karimov', date: '2026-04-06', status: 'pending' },
  { id: '2', patientName: 'Toshmatova N.', bloodType: 'A-', units: 1, urgency: 'routine', requestedBy: 'Dr. Ergasheva', date: '2026-04-05', status: 'fulfilled' },
];

const URGENCY_META = {
  routine:   { label: 'Oddiy',     color: 'bg-slate-100 text-slate-600' },
  urgent:    { label: 'Shoshilinch', color: 'bg-orange-100 text-orange-700' },
  emergency: { label: 'Favqulodda', color: 'bg-red-100 text-red-700' },
};

const EMPTY_FORM = { patientName: '', bloodType: 'A+', units: '1', urgency: 'routine' as BloodRequest['urgency'], requestedBy: '' };

export default function BloodBankPage() {
  const [stock] = useState<BloodStock[]>(INITIAL_STOCK);
  const [requests, setRequests] = useState<BloodRequest[]>(INITIAL_REQUESTS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');

  const lowStock = stock.filter((s) => s.units <= s.minUnits);
  const expiringTotal = stock.reduce((sum, s) => sum + s.expiring, 0);
  const totalUnits = stock.reduce((sum, s) => sum + s.units, 0);

  function handleAdd() {
    if (!form.patientName || !form.requestedBy) { toast.error('Bemor ismi va so\'rovchi majburiy'); return; }
    const req: BloodRequest = {
      id: Date.now().toString(),
      patientName: form.patientName,
      bloodType: form.bloodType,
      units: Number(form.units) || 1,
      urgency: form.urgency,
      requestedBy: form.requestedBy,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
    };
    setRequests([req, ...requests]);
    toast.success('Qon so\'rovi qo\'shildi');
    setShowForm(false);
    setForm(EMPTY_FORM);
  }

  function updateStatus(id: string, status: BloodRequest['status']) {
    setRequests(requests.map((r) => r.id === id ? { ...r, status } : r));
    toast.success('Holat yangilandi');
  }

  const filteredRequests = requests.filter((r) =>
    !search || r.patientName.toLowerCase().includes(search.toLowerCase()) || r.bloodType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Droplets className="w-6 h-6 text-red-600" />Qon Banki</h1>
          <p className="text-sm text-muted-foreground mt-1">Qon zaxiralari va qon so&apos;rovlari</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2 shrink-0"><Plus className="w-4 h-4" />So&apos;rov qo&apos;shish</Button>
      </div>

      {/* Alerts */}
      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <p className="text-sm text-red-700">
            <strong>{lowStock.map((s) => s.type).join(', ')}</strong> — zaxira kritik darajada past!
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-l-4 border-l-red-400"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-red-600">{totalUnits}</p><p className="text-xs text-slate-500">Jami birlik</p></CardContent></Card>
        <Card className="border-l-4 border-l-orange-400"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-orange-600">{lowStock.length}</p><p className="text-xs text-slate-500">Kam zaxira</p></CardContent></Card>
        <Card className="border-l-4 border-l-yellow-400"><CardContent className="p-3 text-center"><p className="text-xl font-bold text-yellow-600">{expiringTotal}</p><p className="text-xs text-slate-500">7 kunda muddati</p></CardContent></Card>
      </div>

      {/* Blood stock grid */}
      <div>
        <h2 className="font-semibold text-slate-700 mb-3 text-sm">Qon Turlari Zaxirasi</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {stock.map((s) => {
            const isLow = s.units <= s.minUnits;
            const isCritical = s.units < s.minUnits / 2;
            return (
              <div key={s.type} className={`rounded-xl border-2 p-3 text-center transition-all ${isCritical ? 'border-red-300 bg-red-50' : isLow ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-white'}`}>
                <p className="text-lg font-bold text-slate-800">{s.type}</p>
                <p className={`text-2xl font-bold ${isCritical ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-green-600'}`}>{s.units}</p>
                <p className="text-xs text-slate-400">birlik</p>
                {s.expiring > 0 && <p className="text-xs text-orange-600 mt-1">{s.expiring} muddatli</p>}
                {isLow && <p className="text-xs text-red-500 mt-0.5">Kam!</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <Card className="border-red-200 bg-red-50/10">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Yangi qon so&apos;rovi</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Bemor ismi *</label><Input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} placeholder="To'liq ism" /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Qon turi</label>
                <select value={form.bloodType} onChange={(e) => setForm({ ...form, bloodType: e.target.value })} className="w-full h-10 rounded-md border border-input px-3 text-sm bg-background">
                  {stock.map((s) => <option key={s.type}>{s.type}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Birlik soni</label><Input type="number" min="1" value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Shoshilinchlik</label>
                <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value as BloodRequest['urgency'] })} className="w-full h-10 rounded-md border border-input px-3 text-sm bg-background">
                  <option value="routine">Oddiy</option>
                  <option value="urgent">Shoshilinch</option>
                  <option value="emergency">Favqulodda</option>
                </select>
              </div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">So&apos;rovchi shifokor *</label><Input value={form.requestedBy} onChange={(e) => setForm({ ...form, requestedBy: e.target.value })} placeholder="Dr. ..." /></div>
            </div>
            <div className="flex gap-2 justify-end"><Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Bekor</Button><Button size="sm" onClick={handleAdd}>Qo&apos;shish</Button></div>
          </CardContent>
        </Card>
      )}

      {/* Requests list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-700 text-sm">Qon So&apos;rovlari</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Qidirish..." className="pl-8 h-8 text-sm w-40" />
          </div>
        </div>
        <Card>
          <div className="divide-y">
            {filteredRequests.map((r) => {
              const um = URGENCY_META[r.urgency];
              return (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 flex-wrap">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${r.urgency === 'emergency' ? 'bg-red-100 text-red-700' : r.urgency === 'urgent' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'}`}>
                    {r.bloodType}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-800 text-sm">{r.patientName}</p>
                      <span className={`text-xs rounded-full px-2 py-0.5 ${um.color}`}>{um.label}</span>
                      {r.status === 'fulfilled' && <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Bajarildi</span>}
                      {r.status === 'cancelled' && <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5">Bekor</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{r.units} birlik · {r.requestedBy} · {r.date}</p>
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus(r.id, 'fulfilled')}>Bajarildi</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500" onClick={() => updateStatus(r.id, 'cancelled')}>Bekor</Button>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredRequests.length === 0 && (
              <div className="text-center py-12"><Droplets className="w-10 h-10 mx-auto mb-2 text-slate-200" /><p className="text-sm text-slate-400">So&apos;rovlar topilmadi</p></div>
            )}
          </div>
        </Card>
      </div>

      {/* Emergency contact */}
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4 flex items-center gap-3">
          <Phone className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Favqulodda qon banki: <strong>+998 71 200 11 11</strong></p>
            <p className="text-xs text-red-600">24/7 faol — kritik holatlarda murojaat qiling</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
