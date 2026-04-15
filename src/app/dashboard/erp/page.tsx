'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getERPByClinic } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, User, Calendar, Stethoscope } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ERPRecord } from '@/types';

export default function ERPPage() {
  const { user, userRole } = useAuth();
  const { t, lang } = useLanguage();
  const DATE_LOCALE: Record<string, string> = { uz: 'uz-UZ', uz_cyrillic: 'uz-UZ', ru: 'ru-RU', en: 'en-US', kk: 'kk-KZ' };
  const [records, setRecords] = useState<ERPRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getERPByClinic(user.uid)
      .then(setRecords)
      .catch(() => toast.error(t.common.error))
      .finally(() => setLoading(false));
  }, [user]);

  const today = new Date().toISOString().slice(0, 10);
  const todayVisits = records.filter((r) => r.visitDate.slice(0, 10) === today).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.erp.title}</h1>
          <p className="text-sm text-muted-foreground">{t.erp.subtitle}</p>
        </div>
        {userRole === 'clinic' && (
          <Link href="/dashboard/erp/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t.erp.newVisit}
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.erp.todayVisits}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : (
              <p className="text-3xl font-bold">{todayVisits}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.erp.visits}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : (
              <p className="text-3xl font-bold">{records.length}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.erp.schedule}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : (
              <p className="text-3xl font-bold">
                {records.filter((r) => r.nextVisit && r.nextVisit > new Date().toISOString()).length}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Records */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Stethoscope className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{t.erp.noVisits}</p>
          <p className="text-sm mt-1">{t.erp.newVisit}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{record.diagnosis}</h3>
                      {record.nextVisit && (
                        <Badge variant="outline" className="text-xs">
                          {t.erp.nextVisit}: {new Date(record.nextVisit).toLocaleDateString(DATE_LOCALE[lang] || 'uz-UZ')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {t.erp.patient}: {record.patientId.slice(0, 8)}...
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(record.visitDate).toLocaleDateString(DATE_LOCALE[lang] || 'uz-UZ')}
                      </span>
                    </div>
                    {record.prescriptions.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {record.prescriptions.slice(0, 3).map((p, i) => (
                          <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {p}
                          </span>
                        ))}
                        {record.prescriptions.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{record.prescriptions.length - 3} ta
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {record.cleaningLogs.length > 0 && (
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {record.cleaningLogs.length} log
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
