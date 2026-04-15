'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getERPByClinic,
  getComplaintsByClinic,
  getVaccinationsByClinic,
  getShiftsByClinic,
  getInventory,
  getStaff,
} from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, Users, ShieldCheck, Clock4, Package, MessageCircle, Database, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportItem {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  fetch: (uid: string) => Promise<unknown[]>;
}

const EXPORTS: ExportItem[] = [
  {
    key: 'erp',
    label: 'Bemor Tashriflari (ERP)',
    description: 'Barcha bemor tashrif yozuvlari, tashxislar va retseptlar',
    icon: <Database className="w-5 h-5" />,
    color: 'text-blue-600 bg-blue-50',
    fetch: (uid) => getERPByClinic(uid),
  },
  {
    key: 'staff',
    label: 'Xodimlar',
    description: 'Barcha xodimlar ro\'yxati va lavozim ma\'lumotlari',
    icon: <Users className="w-5 h-5" />,
    color: 'text-green-600 bg-green-50',
    fetch: (uid) => getStaff(uid),
  },
  {
    key: 'vaccinations',
    label: 'Emlash Yozuvlari',
    description: 'Barcha emlash tarixi va navbatdagi dozalar',
    icon: <ShieldCheck className="w-5 h-5" />,
    color: 'text-emerald-600 bg-emerald-50',
    fetch: (uid) => getVaccinationsByClinic(uid),
  },
  {
    key: 'shifts',
    label: 'Ish Navbatlari',
    description: 'Barcha xodimlar ish navbati jadval ma\'lumotlari',
    icon: <Clock4 className="w-5 h-5" />,
    color: 'text-purple-600 bg-purple-50',
    fetch: (uid) => getShiftsByClinic(uid),
  },
  {
    key: 'inventory',
    label: 'Inventar',
    description: 'Dori-darmonlar, jihozlar va materiallar ro\'yxati',
    icon: <Package className="w-5 h-5" />,
    color: 'text-orange-600 bg-orange-50',
    fetch: (uid) => getInventory(uid),
  },
  {
    key: 'complaints',
    label: 'Shikoyatlar',
    description: 'Barcha shikoyatlar, holatlari va hal qilish ma\'lumotlari',
    icon: <MessageCircle className="w-5 h-5" />,
    color: 'text-red-600 bg-red-50',
    fetch: (uid) => getComplaintsByClinic(uid),
  },
];

type ExportStatus = 'idle' | 'loading' | 'done' | 'error';

export default function ExportsPage() {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<Record<string, ExportStatus>>({});

  async function handleExport(item: ExportItem) {
    if (!user) return;
    setStatuses((s) => ({ ...s, [item.key]: 'loading' }));
    try {
      const data = await item.fetch(user.uid);
      if (data.length === 0) { toast.error('Eksport qilish uchun ma\'lumot yo\'q'); setStatuses((s) => ({ ...s, [item.key]: 'idle' })); return; }
      const keys = Object.keys(data[0] as Record<string, unknown>);
      const rows = (data as Record<string, unknown>[]).map((row) =>
        keys.map((k) => {
          const v = row[k];
          return `"${String(Array.isArray(v) ? JSON.stringify(v) : (v ?? '')).replace(/"/g, '""')}"`;
        }).join(',')
      );
      const csv = [keys.map((k) => `"${k}"`).join(','), ...rows].join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.key}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setStatuses((s) => ({ ...s, [item.key]: 'done' }));
      toast.success(`${item.label} — ${data.length} ta yozuv eksport qilindi`);
      setTimeout(() => setStatuses((s) => ({ ...s, [item.key]: 'idle' })), 3000);
    } catch {
      setStatuses((s) => ({ ...s, [item.key]: 'error' }));
      toast.error('Eksport qilishda xato');
      setTimeout(() => setStatuses((s) => ({ ...s, [item.key]: 'idle' })), 3000);
    }
  }

  async function exportAll() {
    if (!user) return;
    toast.info('Barcha ma\'lumotlar eksport qilinmoqda...');
    for (const item of EXPORTS) {
      await handleExport(item);
    }
    toast.success('Barcha fayllar yuklab olindi');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileSpreadsheet className="w-6 h-6 text-green-600" />Ma&apos;lumotlar Eksporti</h1>
          <p className="text-sm text-muted-foreground mt-1">Klinika ma&apos;lumotlarini CSV formatida yuklab oling</p>
        </div>
        <Button onClick={exportAll} className="gap-2 shrink-0"><Download className="w-4 h-4" />Barchasini eksport</Button>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 flex items-start gap-3">
          <FileSpreadsheet className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">CSV Format haqida</p>
            <p className="text-sm text-blue-700 mt-0.5">Barcha fayllar UTF-8 kodlashda eksport qilinadi va Excel, Google Sheets da ochilishi mumkin. BOM belgisi qo&apos;shilgan — o&apos;zbek harflari to&apos;g&apos;ri ko&apos;rinadi.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPORTS.map((item) => {
          const status = statuses[item.key] ?? 'idle';
          return (
            <Card key={item.key} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>{item.icon}</div>
                  <CardTitle className="text-sm">{item.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">{item.description}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleExport(item)}
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? (
                    <><div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />Yuklanmoqda...</>
                  ) : status === 'done' ? (
                    <><CheckCircle2 className="w-4 h-4 text-green-600" />Yuklab olindi</>
                  ) : (
                    <><Download className="w-4 h-4" />CSV Yuklab olish</>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-3 border-b bg-slate-50"><CardTitle className="text-sm">Eksport eslatmalari</CardTitle></CardHeader>
        <CardContent className="p-4">
          <ul className="space-y-2">
            {[
              'Barcha eksportlar real vaqtli ma\'lumotlar asosida yaratiladi',
              'Moliya ma\'lumotlari alohida eksport qilinmaydi — brauzer sessiyasiga bog\'liq',
              'PDF eksport uchun hisobotlar sahifasidan foydalaning',
              'Katta hajmdagi ma\'lumotlar (1000+) uchun eksport biroz vaqt olishi mumkin',
              'Eksport qilingan fayllarni xavfsiz saqlang — shaxsiy tibbiy ma\'lumotlar mavjud',
            ].map((note, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-slate-300 mt-0.5 shrink-0">•</span>
                {note}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
