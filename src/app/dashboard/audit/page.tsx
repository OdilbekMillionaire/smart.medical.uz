'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAuditLogs } from '@/lib/firestore';
import type { AuditLog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Search, Download, RefreshCw, User, Clock, FileText, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const ACTION_COLOR: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  login:  'bg-purple-100 text-purple-700',
  logout: 'bg-slate-100 text-slate-600',
  approve: 'bg-emerald-100 text-emerald-700',
  reject: 'bg-orange-100 text-orange-700',
  view:   'bg-slate-100 text-slate-600',
};

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  document: <FileText className="w-3.5 h-3.5" />,
  user: <User className="w-3.5 h-3.5" />,
  compliance: <Clock className="w-3.5 h-3.5" />,
  request: <AlertTriangle className="w-3.5 h-3.5" />,
};

function getActionColor(action: string) {
  const key = Object.keys(ACTION_COLOR).find((k) => action.toLowerCase().includes(k));
  return key ? ACTION_COLOR[key] : 'bg-slate-100 text-slate-600';
}

function getResourceIcon(resourceType: string) {
  const key = Object.keys(RESOURCE_ICONS).find((k) => resourceType.toLowerCase().includes(k));
  return key ? RESOURCE_ICONS[key] : <FileText className="w-3.5 h-3.5" />;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  clinic: 'Klinika',
  doctor: 'Shifokor',
  patient: 'Bemor',
};

export default function AuditLogPage() {
  const { userRole } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterResource, setFilterResource] = useState('all');
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    if (userRole !== 'admin') { router.replace('/dashboard'); return; }
    load();
  }, [userRole]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load(n = limit) {
    setLoading(true);
    try {
      const data = await getAuditLogs(n);
      setLogs(data);
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    const header = ['Sana', 'Foydalanuvchi', 'Email', 'Rol', 'Amal', 'Resurs', 'Resurs ID', 'Tafsilotlar'];
    const rows = filtered.map((l) => [
      new Date(l.createdAt).toLocaleString('ru-RU'),
      '', l.userEmail, ROLE_LABELS[l.userRole] ?? l.userRole,
      l.action, l.resourceType, l.resourceId ?? '', l.details ?? '',
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const resourceTypes = Array.from(new Set(logs.map((l) => l.resourceType)));

  const filtered = logs.filter((l) => {
    const matchRole = filterRole === 'all' || l.userRole === filterRole;
    const matchResource = filterResource === 'all' || l.resourceType === filterResource;
    const matchSearch =
      !search ||
      l.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.details ?? '').toLowerCase().includes(search.toLowerCase());
    return matchRole && matchResource && matchSearch;
  });

  if (userRole !== 'admin') return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-slate-700" />
            Audit Jurnali
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Platformadagi barcha amallar tarixi — {logs.length} ta yozuv
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => load(limit)} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Yangilash
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCSV} disabled={filtered.length === 0}>
            <Download className="w-4 h-4" />
            CSV
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['admin','clinic','doctor','patient'] as const).map((role) => {
          const count = logs.filter((l) => l.userRole === role).length;
          const colors: Record<string, string> = {
            admin: 'border-l-red-500 text-red-700',
            clinic: 'border-l-blue-500 text-blue-700',
            doctor: 'border-l-green-500 text-green-700',
            patient: 'border-l-purple-500 text-purple-700',
          };
          return (
            <Card key={role} className={`border-l-4 ${colors[role].split(' ')[0]}`}>
              <CardContent className="p-3">
                <p className="text-xs text-slate-500">{ROLE_LABELS[role]}</p>
                <p className={`text-xl font-bold ${colors[role].split(' ')[1]}`}>{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Email yoki amal bo'yicha qidiring..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'admin', 'clinic', 'doctor', 'patient'].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                filterRole === r ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {r === 'all' ? 'Barchasi' : ROLE_LABELS[r]}
            </button>
          ))}
        </div>
        {resourceTypes.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {['all', ...resourceTypes].map((r) => (
              <button
                key={r}
                onClick={() => setFilterResource(r)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  filterResource === r ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                {r === 'all' ? 'Barcha resurslar' : r}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
          <Shield className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">Audit yozuvlari topilmadi</p>
          <p className="text-xs text-slate-400 mt-1">Platforma foydalanuvchilarning amallari shu yerda ko&apos;rsatiladi</p>
        </div>
      )}

      {/* Log table */}
      {!loading && filtered.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="py-3 px-4 border-b bg-slate-50">
            <CardTitle className="text-sm text-slate-600">
              {filtered.length} ta yozuv ko&apos;rsatilmoqda
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto -mx-px">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b bg-slate-50/50">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Sana</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Foydalanuvchi</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Rol</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Amal</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Resurs</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Tafsilotlar</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap font-mono">
                      {new Date(log.createdAt).toLocaleString('ru-RU', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{log.userEmail}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        log.userRole === 'admin' ? 'bg-red-100 text-red-700' :
                        log.userRole === 'clinic' ? 'bg-blue-100 text-blue-700' :
                        log.userRole === 'doctor' ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {ROLE_LABELS[log.userRole]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-1 text-xs text-slate-600">
                        {getResourceIcon(log.resourceType)}
                        {log.resourceType}
                        {log.resourceId && (
                          <span className="text-slate-400 font-mono truncate max-w-[80px]">#{log.resourceId.slice(-6)}</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500 max-w-[200px] truncate">
                      {log.details ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length >= limit && (
            <div className="p-4 border-t text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { const n = limit + 100; setLimit(n); load(n); }}
              >
                Ko&apos;proq yuklash (+100)
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
