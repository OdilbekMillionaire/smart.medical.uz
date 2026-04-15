'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getERPByClinic } from '@/lib/firestore';
import type { ERPRecord } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, TrendingDown, BarChart3, Download } from 'lucide-react';
import { toast } from 'sonner';

// Simulated financial records on top of ERP data
interface FinanceEntry {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
}

const EXPENSE_CATEGORIES = ['Maosh', 'Dori-darmon', 'Kommunal', 'Jihozlar', 'Ta\'mirlash', 'Reklama', 'Boshqa'];
const INCOME_CATEGORIES = ['Konsultatsiya', 'Protsedura', 'Laboratoriya', 'Tibbiy sertifikat', 'Boshqa'];

const MONTH_NAMES = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

export default function FinancePage() {
  const { user, userRole } = useAuth();
  const [erpRecords, setErpRecords] = useState<ERPRecord[]>([]);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'income' as 'income' | 'expense', category: 'Konsultatsiya', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));

  const canEdit = userRole === 'clinic' || userRole === 'admin';

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getERPByClinic(user.uid)
      .then((data) => {
        setErpRecords(data);
        // Generate finance entries from local storage per clinic
        const key = `finance_${user.uid}`;
        const stored = localStorage.getItem(key);
        setEntries(stored ? JSON.parse(stored) : []);
      })
      .catch(() => toast.error('Yuklashda xato'))
      .finally(() => setLoading(false));
  }, [user]);

  function saveEntries(newEntries: FinanceEntry[]) {
    if (!user) return;
    localStorage.setItem(`finance_${user.uid}`, JSON.stringify(newEntries));
    setEntries(newEntries);
  }

  function handleAdd() {
    if (!form.amount || !form.date) { toast.error('Miqdor va sana majburiy'); return; }
    const entry: FinanceEntry = { id: Date.now().toString(), ...form, amount: Number(form.amount) };
    saveEntries([entry, ...entries]);
    toast.success('Qo\'shildi');
    setShowForm(false);
    setForm({ type: 'income', category: 'Konsultatsiya', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
  }

  function handleDelete(id: string) {
    saveEntries(entries.filter((e) => e.id !== id));
    toast.success('O\'chirildi');
  }

  // Derive visit-based income estimate from ERP
  const visitIncome = erpRecords.filter((r) => r.visitDate.startsWith(filterMonth)).length * 150000;

  const filtered = entries.filter((e) => e.date.startsWith(filterMonth));
  const income = filtered.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0) + visitIncome;
  const expense = filtered.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const profit = income - expense;

  // Monthly trend (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    return d.toISOString().slice(0, 7);
  });

  function exportCSV() {
    const header = ['Sana', 'Tur', 'Kategoriya', 'Miqdor', 'Tavsif'];
    const rows = filtered.map((e) => [e.date, e.type === 'income' ? 'Daromad' : 'Xarajat', e.category, e.amount, e.description]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `moliya-${filterMonth}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="w-6 h-6 text-emerald-600" />Moliya Hisoboti</h1>
          <p className="text-sm text-muted-foreground mt-1">Daromad va xarajatlar holati</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-36 h-9" />
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCSV}><Download className="w-4 h-4" />CSV</Button>
          {canEdit && <Button size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>{showForm ? 'Yopish' : '+ Qo\'shish'}</Button>}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-green-500" /><p className="text-xs text-slate-500">Daromad</p></div>
            <p className="text-2xl font-bold text-green-600">{(income / 1000000).toFixed(1)} M</p>
            <p className="text-xs text-slate-400 mt-1">so'm</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><TrendingDown className="w-4 h-4 text-red-400" /><p className="text-xs text-slate-500">Xarajat</p></div>
            <p className="text-2xl font-bold text-red-500">{(expense / 1000000).toFixed(1)} M</p>
            <p className="text-xs text-slate-400 mt-1">so'm</p>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${profit >= 0 ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><BarChart3 className="w-4 h-4 text-blue-500" /><p className="text-xs text-slate-500">Foyda</p></div>
            <p className={`text-2xl font-bold ${profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{(profit / 1000000).toFixed(1)} M</p>
            <p className="text-xs text-slate-400 mt-1">so'm</p>
          </CardContent>
        </Card>
      </div>

      {/* Trend bars */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">6 oylik daromad trendi</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-24">
            {months.map((m) => {
              const mEntries = entries.filter((e) => e.date.startsWith(m) && e.type === 'income');
              const mVisits = erpRecords.filter((r) => r.visitDate.startsWith(m)).length * 150000;
              const mIncome = mEntries.reduce((s, e) => s + e.amount, 0) + mVisits;
              const maxVal = Math.max(...months.map((mm) => {
                return entries.filter((e) => e.date.startsWith(mm) && e.type === 'income').reduce((s, e) => s + e.amount, 0) + erpRecords.filter((r) => r.visitDate.startsWith(mm)).length * 150000;
              }), 1);
              const pct = Math.round((mIncome / maxVal) * 100);
              return (
                <div key={m} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-slate-100 rounded-t-sm relative" style={{ height: '80px' }}>
                    <div className={`absolute bottom-0 left-0 right-0 rounded-t-sm ${m === filterMonth ? 'bg-emerald-500' : 'bg-emerald-200'}`} style={{ height: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400">{MONTH_NAMES[parseInt(m.slice(5, 7)) - 1]}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add form */}
      {showForm && canEdit && (
        <Card className="border-emerald-200 bg-emerald-50/10">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">Yangi yozuv qo&apos;shish</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Tur</label>
                <select value={form.type} onChange={(e) => { const t = e.target.value as 'income'|'expense'; setForm({ ...form, type: t, category: t === 'income' ? 'Konsultatsiya' : 'Maosh' }); }} className="w-full h-10 rounded-md border border-input px-3 text-sm bg-background">
                  <option value="income">Daromad</option><option value="expense">Xarajat</option>
                </select>
              </div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Kategoriya</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full h-10 rounded-md border border-input px-3 text-sm bg-background">
                  {(form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Miqdor (so'm) *</label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" /></div>
              <div><label className="text-xs font-medium text-slate-500 mb-1 block">Sana *</label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="text-xs font-medium text-slate-500 mb-1 block">Tavsif</label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Izoh" /></div>
            </div>
            <div className="flex gap-2 justify-end"><Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Bekor</Button><Button size="sm" onClick={handleAdd}>Qo&apos;shish</Button></div>
          </CardContent>
        </Card>
      )}

      {/* Transactions */}
      {loading ? <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-12 w-full rounded" />)}</div> : (
        <Card>
          <CardHeader className="py-3 px-4 border-b bg-slate-50"><CardTitle className="text-sm">{filterMonth} — Yozuvlar ({filtered.length})</CardTitle></CardHeader>
          {filtered.length === 0 ? (
            <CardContent className="p-8 text-center text-slate-400"><p>Bu oy uchun yozuv yo&apos;q</p><p className="text-xs mt-1">ERP tashriflari asosida {visitIncome.toLocaleString()} so&apos;m daromad hisoblab qo&apos;shildi</p></CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead><tr className="border-b bg-slate-50/50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Sana</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Kategoriya</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Tavsif</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Miqdor</th>
                  <th className="px-4 py-2.5" />
                </tr></thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-slate-500">{new Date(e.date).toLocaleDateString('ru-RU')}</td>
                      <td className="px-4 py-2.5 text-xs">{e.category}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">{e.description || '—'}</td>
                      <td className={`px-4 py-2.5 text-right text-sm font-semibold ${e.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                        {e.type === 'income' ? '+' : '-'}{e.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right"><Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-slate-300 hover:text-red-500" onClick={() => handleDelete(e.id)}><span className="text-xs">×</span></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <p className="text-xs text-slate-400 italic">* ERP tizimidagi bemor tashrif ma&#39;lumotlari asosida taxminiy daromad hisoblab qo&#39;shiladi (1 tashrif = 150,000 so&#39;m)</p>
    </div>
  );
}
