'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllClinics } from '@/lib/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Building2, Search, Users, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ClinicUser } from '@/types';

export default function ClinicsPage() {
  const { userRole } = useAuth();
  const { t, lang } = useLanguage();
  const DATE_LOCALE: Record<string, string> = { uz: 'uz-UZ', uz_cyrillic: 'uz-UZ', ru: 'ru-RU', en: 'en-US', kk: 'kk-KZ' };
  const router = useRouter();
  const [clinics, setClinics] = useState<ClinicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (userRole !== 'admin') { router.replace('/dashboard'); return; }
    getAllClinics()
      .then(setClinics)
      .catch(() => toast.error(t.common.error))
      .finally(() => setLoading(false));
  }, [userRole, router]);

  const filtered = clinics.filter(
    (c) =>
      c.clinicName?.toLowerCase().includes(search.toLowerCase()) ||
      c.region?.toLowerCase().includes(search.toLowerCase()) ||
      c.licenseNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.clinics.title}</h1>
        <p className="text-sm text-muted-foreground">{t.clinics.subtitle}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t.clinics.searchPlaceholder}
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{t.clinics.empty}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((clinic, idx) => (
            <Card key={clinic.uid ?? idx} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{clinic.clinicName || t.common.noData}</h3>
                      <Badge variant="outline" className="text-xs">{clinic.licenseNumber}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                      <span>{clinic.region}, {clinic.district}</span>
                      {clinic.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {clinic.phone}
                        </span>
                      )}
                    </div>
                    {clinic.specialties && clinic.specialties.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {clinic.specialties.slice(0, 4).map((s, i) => (
                          <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    {clinic.doctorCount !== undefined && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {clinic.doctorCount} {t.users.doctors}
                      </div>
                    )}
                    {clinic.licenseExpiry && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t.clinics.licenseExpiry}: {new Date(clinic.licenseExpiry).toLocaleDateString(DATE_LOCALE[lang] || 'uz-UZ')}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
