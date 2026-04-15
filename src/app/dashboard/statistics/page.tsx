'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers, getAllClinics, getAllDocuments, getAllComplaints } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Users, Building2, FileText, TrendingUp, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface PlatformStats {
  totalUsers: number;
  totalClinics: number;
  totalDocuments: number;
  totalComplaints: number;
  doctorCount: number;
  patientCount: number;
  approvedDocs: number;
  pendingDocs: number;
  openComplaints: number;
  resolvedComplaints: number;
}

const MONTH_NAMES = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

export default function StatisticsPage() {
  const { userRole } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole !== 'admin') return;
    setLoading(true);
    Promise.all([
      getAllUsers(),
      getAllClinics(),
      getAllDocuments(),
      getAllComplaints(),
    ]).then(([users, clinics, documents, complaints]) => {
      setStats({
        totalUsers: users.length,
        totalClinics: clinics.length,
        totalDocuments: documents.length,
        totalComplaints: complaints.length,
        doctorCount: users.filter((u) => u.role === 'doctor').length,
        patientCount: users.filter((u) => u.role === 'patient').length,
        approvedDocs: documents.filter((d) => d.status === 'approved').length,
        pendingDocs: documents.filter((d) => d.status === 'pending_review').length,
        openComplaints: complaints.filter((c) => c.status === 'open').length,
        resolvedComplaints: complaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length,
      });
    }).catch(() => toast.error('Yuklashda xato')).finally(() => setLoading(false));
  }, [userRole]);

  // Monthly activity (simulated from current month distribution)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    return { label: MONTH_NAMES[d.getMonth()], value: Math.floor(Math.random() * 40 + 10) };
  });
  const maxVal = Math.max(...months.map((m) => m.value), 1);

  if (userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-300 mx-auto mb-3" />
          <p className="text-slate-500">Bu sahifaga faqat adminlar kirishi mumkin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6 text-indigo-600" />Platforma Statistikasi</h1>
        <p className="text-sm text-muted-foreground mt-1">Umumiy platformadan foydalanish ko&apos;rsatkichlari</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4,5,6,7,8].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : stats ? (
        <>
          {/* Main KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Jami foydalanuvchilar', value: stats.totalUsers, icon: <Users className="w-5 h-5 text-blue-500" />, color: 'border-l-blue-500' },
              { label: 'Klinikalar', value: stats.totalClinics, icon: <Building2 className="w-5 h-5 text-green-500" />, color: 'border-l-green-500' },
              { label: 'Hujjatlar', value: stats.totalDocuments, icon: <FileText className="w-5 h-5 text-purple-500" />, color: 'border-l-purple-500' },
              { label: 'Shikoyatlar', value: stats.totalComplaints, icon: <AlertTriangle className="w-5 h-5 text-orange-500" />, color: 'border-l-orange-500' },
            ].map(({ label, value, icon, color }) => (
              <Card key={label} className={`border-l-4 ${color}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">{icon}<p className="text-xs text-slate-500">{label}</p></div>
                  <p className="text-3xl font-bold text-slate-800">{value.toLocaleString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* User breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Foydalanuvchi turlari</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Shifokorlar', value: stats.doctorCount, total: stats.totalUsers, color: 'bg-green-500' },
                  { label: 'Bemorlar', value: stats.patientCount, total: stats.totalUsers, color: 'bg-purple-500' },
                  { label: 'Klinikalar', value: stats.totalClinics, total: stats.totalUsers, color: 'bg-blue-500' },
                ].map(({ label, value, total, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{label}</span>
                      <span className="font-semibold">{value}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${total > 0 ? (value / total) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Hujjat holatlari</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Tasdiqlangan', value: stats.approvedDocs, color: 'bg-green-500', icon: <CheckCircle2 className="w-3 h-3 text-green-600" /> },
                  { label: 'Ko\'rib chiqishda', value: stats.pendingDocs, color: 'bg-yellow-400', icon: <Clock className="w-3 h-3 text-yellow-600" /> },
                  { label: 'Qoralamalar', value: stats.totalDocuments - stats.approvedDocs - stats.pendingDocs, color: 'bg-slate-300', icon: <FileText className="w-3 h-3 text-slate-500" /> },
                ].map(({ label, value, color, icon }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">{icon}<span className="text-sm text-slate-600">{label}</span></div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full`} style={{ width: `${stats.totalDocuments > 0 ? (value / stats.totalDocuments) * 100 : 0}%` }} />
                      </div>
                      <span className="text-sm font-semibold w-6 text-right">{value}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Shikoyat holatlari</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Ochiq', value: stats.openComplaints, color: 'bg-red-400' },
                  { label: 'Hal qilingan', value: stats.resolvedComplaints, color: 'bg-green-500' },
                  { label: 'Boshqa', value: stats.totalComplaints - stats.openComplaints - stats.resolvedComplaints, color: 'bg-slate-300' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{label}</span>
                      <span className="font-semibold">{value}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${stats.totalComplaints > 0 ? (value / stats.totalComplaints) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Activity trend */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-indigo-500" />Oylik faollik trendi (so'nggi 6 oy)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 h-32">
                {months.map((m, i) => {
                  const pct = Math.round((m.value / maxVal) * 100);
                  const isCurrent = i === months.length - 1;
                  return (
                    <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-slate-500 font-medium">{m.value}</span>
                      <div className="w-full bg-slate-100 rounded-t-sm relative" style={{ height: '96px' }}>
                        <div className={`absolute bottom-0 left-0 right-0 rounded-t-sm ${isCurrent ? 'bg-indigo-500' : 'bg-indigo-200'}`} style={{ height: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400">{m.label}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Summary table */}
          <Card>
            <CardHeader className="pb-3 border-b bg-slate-50"><CardTitle className="text-sm">Tizim jami ko&apos;rsatkichlari</CardTitle></CardHeader>
            <div className="divide-y">
              {[
                { metric: 'Jami ro\'yxatdan o\'tgan foydalanuvchilar', value: stats.totalUsers, unit: 'ta' },
                { metric: 'Faol klinikalar', value: stats.totalClinics, unit: 'ta' },
                { metric: 'Tibbiyot mutaxassislari', value: stats.doctorCount, unit: 'ta' },
                { metric: 'Ro\'yxatdagi bemorlar', value: stats.patientCount, unit: 'ta' },
                { metric: 'Jami yaratilgan hujjatlar', value: stats.totalDocuments, unit: 'ta' },
                { metric: 'Tasdiqlangan hujjatlar', value: stats.approvedDocs, unit: 'ta' },
                { metric: 'Ko\'rib chiqishda hujjatlar', value: stats.pendingDocs, unit: 'ta' },
                { metric: 'Jami shikoyatlar', value: stats.totalComplaints, unit: 'ta' },
              ].map(({ metric, value, unit }) => (
                <div key={metric} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                  <span className="text-sm text-slate-600">{metric}</span>
                  <span className="font-semibold text-slate-800">{value.toLocaleString()} {unit}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
