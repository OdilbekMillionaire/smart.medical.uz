'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllClinics } from '@/lib/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Building2, Search, Users, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ClinicUser } from '@/types';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonList } from '@/components/shared/SkeletonList';

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
  }, [userRole, router, t.common.error]);

  const filtered = clinics.filter(
    (c) =>
      c.clinicName?.toLowerCase().includes(search.toLowerCase()) ||
      c.region?.toLowerCase().includes(search.toLowerCase()) ||
      c.licenseNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<Building2 className="w-6 h-6 text-blue-600" />}
        title={t.clinics.title}
        subtitle={t.clinics.subtitle}
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t.clinics.searchPlaceholder} className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <SkeletonList count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-12 h-12" />}
          title={t.clinics.empty}
        />
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
