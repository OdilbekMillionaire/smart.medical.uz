'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers } from '@/lib/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Users, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import type { BaseUser } from '@/types';

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  clinic: 'bg-blue-100 text-blue-700',
  doctor: 'bg-green-100 text-green-700',
  patient: 'bg-purple-100 text-purple-700',
};

export default function UsersPage() {
  const { userRole } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const ROLE_LABELS: Record<string, string> = {
    admin: t.auth.roleAdmin,
    clinic: t.auth.roleClinic,
    doctor: t.auth.roleDoctor,
    patient: t.auth.rolePatient,
  };
  const [users, setUsers] = useState<BaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    if (userRole !== 'admin') { router.replace('/dashboard'); return; }
    getAllUsers()
      .then((data) => setUsers(data as BaseUser[]))
      .catch(() => toast.error(t.common.error))
      .finally(() => setLoading(false));
  }, [userRole, router, t.common.error]);

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleCounts = users.reduce((acc: Record<string, number>, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.users.title}</h1>
        <p className="text-sm text-muted-foreground">{t.users.subtitle}</p>
      </div>

      {/* Role filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'clinic', 'doctor', 'patient', 'admin'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              roleFilter === r ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {r === 'all' ? t.common.all : ROLE_LABELS[r]}
            <span className="ml-1.5 text-xs opacity-70">
              {r === 'all' ? users.length : (roleCounts[r] ?? 0)}
            </span>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t.common.search}
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-10 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{t.users.empty}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <Card key={u.uid} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-700">
                      {(u.displayName || u.email || 'U')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{u.displayName || t.common.noData}</p>
                      <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[u.role] ?? ''}`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                    <span className={`text-xs ${u.profileComplete ? 'text-green-600' : 'text-orange-500'}`}>
                      {u.profileComplete ? t.common.success : t.common.noData}
                    </span>
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
