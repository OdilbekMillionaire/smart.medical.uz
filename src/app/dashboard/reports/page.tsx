'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getERPByClinic, getComplaintsByClinic, getVaccinationsByClinic, getShiftsByClinic } from '@/lib/firestore';
import type { ERPRecord, Complaint, VaccinationRecord, Shift } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { FileBarChart, Download, Calendar, Users, ShieldCheck, MessageCircle, Clock4 } from 'lucide-react';
import { toast } from 'sonner';

type ReportType = 'visits' | 'complaints' | 'vaccinations' | 'shifts';

interface ReportConfig {
  type: ReportType;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const REPORTS: ReportConfig[] = [
  { type: 'visits',       label: 'Bemor Tashriflari',    icon: <Users className="w-5 h-5" />,       color: 'text-blue-600 bg-blue-50 border-blue-200',   description: 'Tanlangan davr uchun barcha bemor tashriflarining to\'liq hisoboti' },
  { type: 'complaints',   label: 'Shikoyatlar',           icon: <MessageCircle className="w-5 h-5" />, color: 'text-red-600 bg-red-50 border-red-200',     description: 'Shikoyatlar holati, kategoriyasi va hal qilish statistikasi' },
  { type: 'vaccinations', label: 'Emlash',                icon: <ShieldCheck className="w-5 h-5" />,  color: 'text-green-600 bg-green-50 border-green-200', description: 'Emlash yozuvlari, muddati o\'tganlar va rejalashtirilganlar' },
  { type: 'shifts',       label: 'Ish Navbatlari',        icon: <Clock4 className="w-5 h-5" />,       color: 'text-purple-600 bg-purple-50 border-purple-200', description: 'Xodimlar ish navbatlari va soatlari statistikasi' },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<ReportType>('visits');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<ERPRecord[] | Complaint[] | VaccinationRecord[] | Shift[]>([]);
  const [loading, setLoading] = useState(false);

  async function generateReport() {
    if (!user) return;
    setLoading(true);
    try {
      switch (selected) {
        case 'visits':      setData(await getERPByClinic(user.uid)); break;
        case 'complaints':  setData(await getComplaintsByClinic(user.uid)); break;
        case 'vaccinations': setData(await getVaccinationsByClinic(user.uid)); break;
        case 'shifts':      setData(await getShiftsByClinic(user.uid)); break;
      }
      toast.success('Hisobot yaratildi');
    } catch { toast.error('Hisobot yaratishda xato'); }
    finally { setLoading(false); }
  }

  useEffect(() => { setData([]); }, [selected]);

  function exportCSV() {
    if (data.length === 0) { toast.error('Eksport qilish uchun ma\'lumot yo\'q'); return; }
    const anyData = data as unknown as Record<string, unknown>[];
    const keys = Object.keys(anyData[0]);
    const rows = anyData.map((row) => keys.map((k) => {
      const val = row[k];
      return `"${String(val ?? '').replace(/"/g, '""')}"`;
    }).join(','));
    const csv = [keys.map((k) => `"${k}"`).join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `hisobot-${selected}-${dateFrom}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV yuklab olindi');
  }

  function printReport() {
    window.print();
  }

  // Filter by date range client-side
  const filtered = data.filter((row) => {
    const dateField = 'visitDate' in row ? row.visitDate
      : 'createdAt' in row ? (row as { createdAt: string }).createdAt
      : 'dateGiven' in row ? (row as { dateGiven: string }).dateGiven
      : 'date' in row ? (row as { date: string }).date : '';
    const d = dateField?.split('T')[0] ?? '';
    return d >= dateFrom && d <= dateTo;
  });

  const cfg = REPORTS.find((r) => r.type === selected)!;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileBarChart className="w-6 h-6 text-blue-600" />Hisobotlar</h1>
          <p className="text-sm text-muted-foreground mt-1">Ma&apos;lumotlar eksporti va hisobot generatsiyasi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={printReport}><Download className="w-4 h-4" />Chop</Button>
          <Button size="sm" className="gap-1.5" onClick={exportCSV} disabled={filtered.length === 0}><Download className="w-4 h-4" />CSV ({filtered.length})</Button>
        </div>
      </div>

      {/* Report type selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {REPORTS.map((r) => (
          <Card
            key={r.type}
            onClick={() => setSelected(r.type)}
            className={`cursor-pointer transition-all hover:shadow-md border-2 ${selected === r.type ? 'border-blue-500 shadow-md' : 'border-transparent'}`}
          >
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 border ${r.color}`}>{r.icon}</div>
              <p className="text-sm font-semibold text-slate-800">{r.label}</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-tight">{r.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Date range + generate */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Dan</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Gacha</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="pl-9" />
              </div>
            </div>
            <Button onClick={generateReport} disabled={loading} className="shrink-0">
              {loading ? 'Yuklanmoqda...' : `${cfg.label} hisoboti`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading && <div className="space-y-2">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-12 w-full rounded" />)}</div>}

      {!loading && filtered.length === 0 && data.length > 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed">
          <FileBarChart className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="text-slate-500">Tanlangan sana oralig&apos;ida ma&apos;lumot topilmadi</p>
          <p className="text-xs text-slate-400 mt-1">Jami {data.length} ta yozuv mavjud, lekin filtrlarga mos kelmadi</p>
        </div>
      )}

      {!loading && data.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed">
          <FileBarChart className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="text-slate-500">Hisobot yaratish uchun yuqoridagi tugmani bosing</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4 border-b bg-slate-50">
            <CardTitle className="text-sm">{cfg.label} — {filtered.length} ta yozuv ({dateFrom} — {dateTo})</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr className="border-b bg-slate-50/50">
                  {Object.keys(filtered[0]).filter((k) => k !== 'id').map((k) => (
                    <th key={k} className="text-left px-3 py-2.5 font-semibold text-slate-500 capitalize">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((row, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                    {Object.entries(row).filter(([k]) => k !== 'id').map(([k, v]) => (
                      <td key={k} className="px-3 py-2 text-slate-600 max-w-[200px] truncate">
                        {Array.isArray(v) ? `[${v.length} ta]` : String(v ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 50 && (
              <p className="text-center text-xs text-slate-400 py-2">... va yana {filtered.length - 50} ta yozuv (CSV ga eksport qiling)</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
