'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Sidebar,
  getAdminNavItems,
  getClinicNavItems,
  getUserNavItems,
} from '@/components/shared/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userRole } = useAuth();
  const { t } = useLanguage();

  const navItems =
    userRole === 'admin'
      ? getAdminNavItems(t)
      : userRole === 'clinic'
      ? getClinicNavItems(t)
      : getUserNavItems(t);

  const roleLabel =
    userRole === 'admin'
      ? t.auth.roleAdmin
      : userRole === 'clinic'
      ? t.auth.roleClinic
      : userRole === 'doctor'
      ? t.auth.roleDoctor
      : t.auth.rolePatient;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar navItems={navItems} roleLabel={roleLabel} />
      <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 pt-16 lg:pt-6 min-w-0">{children}</main>
    </div>
  );
}
