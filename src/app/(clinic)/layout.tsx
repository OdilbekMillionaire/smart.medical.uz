import { Sidebar, clinicNavItems } from '@/components/shared/Sidebar';

export default function ClinicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar navItems={clinicNavItems} roleLabel="Klinika" />
      <main className="flex-1 overflow-auto p-6 pt-16 lg:pt-6">{children}</main>
    </div>
  );
}
