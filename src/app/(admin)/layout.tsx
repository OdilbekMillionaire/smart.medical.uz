import { Sidebar, adminNavItems } from '@/components/shared/Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar navItems={adminNavItems} roleLabel="Admin" />
      <main className="flex-1 overflow-auto p-6 pt-16 lg:pt-6">{children}</main>
    </div>
  );
}
