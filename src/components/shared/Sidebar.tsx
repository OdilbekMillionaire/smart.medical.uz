'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { logout } from '@/lib/auth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Building2,
  Users,
  Bot,
  FileText,
  MessageSquare,
  Clock,
  ClipboardCheck,
  Settings,
  ShieldCheck,
  Database,
  User,
  Globe,
  Video,
  Pill,
  GraduationCap,
  Briefcase,
  UsersRound,
  Bell,
  Calendar,
  QrCode,
  Shield,
  Star,
  Search,
  UserCog,
  Package,
  ArrowRightLeft,
  AlertCircle,
  Mail,
  Wrench,
  Megaphone,
  DollarSign,
  Syringe,
  Clock4,
  HelpCircle,
  BarChart3,
  RefreshCw,
  FileBarChart,
  FileSpreadsheet,
  BookOpen,
  Droplets,
  Rocket,
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  featured?: boolean;   // renders AI-style glowing button
  section?: string;     // renders a section label above this item
}

interface SidebarProps {
  navItems: NavItem[];
  roleLabel: string;
}

const ROLE_COLOR_MAP: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  clinic: 'bg-blue-100 text-blue-700',
  doctor: 'bg-green-100 text-green-700',
  patient: 'bg-purple-100 text-purple-700',
};

export function Sidebar({ navItems, roleLabel }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, userProfile, userRole } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  async function handleLogout() {
    try {
      await logout();
      router.replace('/login');
    } catch {
      toast.error(t.common.error);
    }
  }

  const displayName =
    userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || t.nav.profile;

  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  const roleBadgeLabel = userRole
    ? userRole === 'admin'
      ? t.auth.roleAdmin
      : userRole === 'clinic'
      ? t.auth.roleClinic
      : userRole === 'doctor'
      ? t.auth.roleDoctor
      : t.auth.rolePatient
    : roleLabel;
  const roleBadgeColor = userRole ? ROLE_COLOR_MAP[userRole] ?? '' : '';

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Image src="/logo.png" alt="SMA Logo" width={32} height={32} className="rounded-md shadow-sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">Smart Medical</p>
          <p className="text-xs text-muted-foreground">Association</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <div key={item.href}>
              {/* Section header */}
              {item.section && (
                <p className="mt-3 mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 select-none">
                  {item.section}
                </p>
              )}

              {/* Featured AI item */}
              {item.featured ? (
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 overflow-hidden',
                    active
                      ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-lg shadow-cyan-500/25'
                      : 'bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 text-cyan-700 hover:from-cyan-500/20 hover:to-emerald-500/20 hover:shadow-md hover:shadow-cyan-500/10 hover:scale-[1.02]'
                  )}
                >
                  {/* Animated glow ring on hover */}
                  <span className={cn(
                    'absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                    'ring-2 ring-cyan-400/40'
                  )} />
                  <span className={cn(
                    'relative shrink-0 flex h-7 w-7 items-center justify-center rounded-lg',
                    active
                      ? 'bg-white/20'
                      : 'bg-gradient-to-br from-cyan-500 to-emerald-500 shadow-sm'
                  )}>
                    <Bot className={cn('h-4 w-4', active ? 'text-white' : 'text-white')} />
                  </span>
                  <span className="relative truncate">{item.label}</span>
                  {!active && (
                    <span className="relative ml-auto shrink-0 rounded-full bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-cyan-600">
                      AI
                    </span>
                  )}
                </Link>
              ) : (
                /* Regular nav item */
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:translate-x-0.5'
                  )}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      <Separator />

      {/* User section */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={user?.photoURL ?? undefined} />
            <AvatarFallback className="bg-slate-200 text-slate-700 text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', roleBadgeColor)}>
              {roleBadgeLabel}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2 text-slate-600 hover:text-red-600 flex-1"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {t.nav.logout}
          </Button>
          <div className="flex items-center gap-1">
            <LanguageSwitcher variant="compact" direction="up" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 rounded-md bg-white p-2 shadow-md lg:hidden"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transition-transform duration-300 lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-white">
        <SidebarContent />
      </aside>
    </>
  );
}

// ─── Nav item sets (translation-aware) ───────────────────────────────────────

import type { Translations } from '@/i18n/messages/uz';

export function getAdminNavItems(t: Translations): NavItem[] {
  return [
    // — Top level
    { label: t.nav.home,         href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: t.nav.aiAdvisor,    href: '/ai',        icon: <Bot className="h-4 w-4" />, featured: true },

    // — Platform management
    { label: t.nav.statistics,   href: '/dashboard/statistics',   icon: <BarChart3 className="h-4 w-4" />,    section: 'Boshqaruv' },
    { label: t.nav.clinics,      href: '/dashboard/clinics',      icon: <Building2 className="h-4 w-4" /> },
    { label: t.nav.users,        href: '/dashboard/users',        icon: <Users className="h-4 w-4" /> },

    // — Platform operations
    { label: t.nav.documents,    href: '/dashboard/documents',    icon: <FileText className="h-4 w-4" />,     section: 'Platforma' },
    { label: t.nav.requests,     href: '/dashboard/requests',     icon: <MessageSquare className="h-4 w-4" /> },
    { label: t.nav.compliance,   href: '/dashboard/compliance',   icon: <Clock className="h-4 w-4" /> },
    { label: t.nav.inspection,   href: '/dashboard/inspection',   icon: <ClipboardCheck className="h-4 w-4" /> },
    { label: t.nav.audit,        href: '/dashboard/audit',        icon: <Shield className="h-4 w-4" /> },

    // — Communication
    { label: t.nav.announcements, href: '/dashboard/announcements', icon: <Megaphone className="h-4 w-4" />, section: 'Aloqa' },
    { label: t.nav.messages,     href: '/dashboard/messages',     icon: <Mail className="h-4 w-4" /> },
    { label: t.nav.notifications, href: '/dashboard/notifications', icon: <Bell className="h-4 w-4" /> },

    // — Data & reporting
    { label: t.nav.appointments, href: '/dashboard/appointments', icon: <Calendar className="h-4 w-4" />,    section: "Ma'lumot" },
    { label: t.nav.surveys,      href: '/dashboard/surveys',      icon: <Star className="h-4 w-4" /> },
    { label: t.nav.reports,      href: '/dashboard/reports',      icon: <FileBarChart className="h-4 w-4" /> },
    { label: t.nav.exports,      href: '/dashboard/exports',      icon: <FileSpreadsheet className="h-4 w-4" /> },
    { label: t.nav.search,       href: '/dashboard/search',       icon: <Search className="h-4 w-4" /> },
    { label: t.nav.map,          href: '/dashboard/map',          icon: <Globe className="h-4 w-4" /> },

    // — Community
    { label: t.nav.news,         href: '/dashboard/news',         icon: <FileText className="h-4 w-4" />,    section: 'Hamjamiyat' },
    { label: t.nav.jobs,         href: '/dashboard/jobs',         icon: <Briefcase className="h-4 w-4" /> },
    { label: t.nav.forum,        href: '/dashboard/forum',        icon: <UsersRound className="h-4 w-4" /> },

    // — Settings
    { label: t.nav.changelog,    href: '/dashboard/changelog',    icon: <RefreshCw className="h-4 w-4" />,   section: 'Sozlamalar' },
    { label: t.nav.settings,     href: '/dashboard/settings',     icon: <Settings className="h-4 w-4" /> },
  ];
}

export function getClinicNavItems(t: Translations): NavItem[] {
  return [
    // — Top level
    { label: t.nav.home,         href: '/dashboard',              icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: t.nav.aiAdvisor,    href: '/ai',                     icon: <Bot className="h-4 w-4" />, featured: true },

    // — Core management
    { label: t.nav.documents,    href: '/dashboard/documents',    icon: <FileText className="h-4 w-4" />,    section: 'Boshqaruv' },
    { label: t.nav.requests,     href: '/dashboard/requests',     icon: <MessageSquare className="h-4 w-4" /> },
    { label: t.nav.compliance,   href: '/dashboard/compliance',   icon: <Clock className="h-4 w-4" /> },
    { label: t.nav.inspection,   href: '/dashboard/inspection',   icon: <ShieldCheck className="h-4 w-4" /> },

    // — ERP system
    { label: t.nav.erp,          href: '/dashboard/erp',          icon: <Database className="h-4 w-4" />,    section: 'ERP Tizim' },
    { label: t.nav.staff,        href: '/dashboard/staff',        icon: <UserCog className="h-4 w-4" /> },
    { label: t.nav.inventory,    href: '/dashboard/inventory',    icon: <Package className="h-4 w-4" /> },
    { label: t.nav.equipment,    href: '/dashboard/equipment',    icon: <Wrench className="h-4 w-4" /> },
    { label: t.nav.shifts,       href: '/dashboard/shifts',       icon: <Clock4 className="h-4 w-4" /> },

    // — Medical services
    { label: t.nav.appointments, href: '/dashboard/appointments', icon: <Calendar className="h-4 w-4" />,    section: 'Tibbiy' },
    { label: t.nav.vaccinations, href: '/dashboard/vaccinations', icon: <Syringe className="h-4 w-4" /> },
    { label: t.nav.referrals,    href: '/dashboard/referrals',    icon: <ArrowRightLeft className="h-4 w-4" /> },
    { label: t.nav.complaints,   href: '/dashboard/complaints',   icon: <AlertCircle className="h-4 w-4" /> },
    { label: t.nav.telemedicine, href: '/dashboard/telemedicine', icon: <Video className="h-4 w-4" /> },
    { label: t.nav.prescriptions, href: '/dashboard/prescriptions', icon: <Pill className="h-4 w-4" /> },
    { label: t.nav.bloodbank,    href: '/dashboard/bloodbank',    icon: <Droplets className="h-4 w-4" /> },

    // — Finance & analytics
    { label: t.nav.finance,      href: '/dashboard/finance',      icon: <DollarSign className="h-4 w-4" />,  section: 'Moliya' },
    { label: t.nav.reports,      href: '/dashboard/reports',      icon: <FileBarChart className="h-4 w-4" /> },
    { label: t.nav.exports,      href: '/dashboard/exports',      icon: <FileSpreadsheet className="h-4 w-4" /> },

    // — Communication
    { label: t.nav.announcements, href: '/dashboard/announcements', icon: <Megaphone className="h-4 w-4" />, section: 'Aloqa' },
    { label: t.nav.messages,     href: '/dashboard/messages',     icon: <Mail className="h-4 w-4" /> },
    { label: t.nav.calendar,     href: '/dashboard/calendar',     icon: <Calendar className="h-4 w-4" /> },
    { label: t.nav.surveys,      href: '/dashboard/surveys',      icon: <Star className="h-4 w-4" /> },

    // — Knowledge & community
    { label: t.nav.guidelines,   href: '/dashboard/guidelines',   icon: <BookOpen className="h-4 w-4" />,    section: 'Bilim' },
    { label: t.nav.formulary,    href: '/dashboard/formulary',    icon: <Pill className="h-4 w-4" /> },
    { label: t.nav.education,    href: '/dashboard/education',    icon: <GraduationCap className="h-4 w-4" /> },
    { label: t.nav.news,         href: '/dashboard/news',         icon: <FileText className="h-4 w-4" /> },
    { label: t.nav.jobs,         href: '/dashboard/jobs',         icon: <Briefcase className="h-4 w-4" /> },
    { label: t.nav.forum,        href: '/dashboard/forum',        icon: <UsersRound className="h-4 w-4" /> },
    { label: t.nav.search,       href: '/dashboard/search',       icon: <Search className="h-4 w-4" /> },
    { label: t.nav.map,          href: '/dashboard/map',          icon: <Globe className="h-4 w-4" /> },

    // — Settings
    { label: t.nav.notifications, href: '/dashboard/notifications', icon: <Bell className="h-4 w-4" />,     section: 'Sozlamalar' },
    { label: t.nav.help,         href: '/dashboard/help',         icon: <HelpCircle className="h-4 w-4" /> },
    { label: t.nav.onboarding,   href: '/dashboard/onboarding',   icon: <Rocket className="h-4 w-4" /> },
    { label: t.nav.profile,      href: '/dashboard/profile',      icon: <User className="h-4 w-4" /> },
  ];
}

export function getUserNavItems(t: Translations): NavItem[] {
  return [
    // — Top level
    { label: t.nav.home,         href: '/dashboard',              icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: t.nav.aiAdvisor,    href: '/ai',                     icon: <Bot className="h-4 w-4" />, featured: true },

    // — Medical
    { label: t.nav.appointments, href: '/dashboard/appointments', icon: <Calendar className="h-4 w-4" />,   section: 'Tibbiy' },
    { label: t.nav.vaccinations, href: '/dashboard/vaccinations', icon: <Syringe className="h-4 w-4" /> },
    { label: t.nav.prescriptions, href: '/dashboard/prescriptions', icon: <Pill className="h-4 w-4" /> },
    { label: t.nav.formulary,    href: '/dashboard/formulary',    icon: <Pill className="h-4 w-4" /> },
    { label: t.nav.qrCard,       href: '/dashboard/qr-card',      icon: <QrCode className="h-4 w-4" /> },
    { label: t.nav.telemedicine, href: '/dashboard/telemedicine', icon: <Video className="h-4 w-4" /> },

    // — Documents & communication
    { label: t.nav.documents,    href: '/dashboard/documents',    icon: <FileText className="h-4 w-4" />,   section: 'Hujjatlar' },
    { label: t.nav.requests,     href: '/dashboard/requests',     icon: <MessageSquare className="h-4 w-4" /> },
    { label: t.nav.messages,     href: '/dashboard/messages',     icon: <Mail className="h-4 w-4" /> },
    { label: t.nav.notifications, href: '/dashboard/notifications', icon: <Bell className="h-4 w-4" /> },

    // — Knowledge
    { label: t.nav.guidelines,   href: '/dashboard/guidelines',   icon: <BookOpen className="h-4 w-4" />,   section: 'Bilim' },
    { label: t.nav.education,    href: '/dashboard/education',    icon: <GraduationCap className="h-4 w-4" /> },
    { label: t.nav.news,         href: '/dashboard/news',         icon: <FileText className="h-4 w-4" /> },
    { label: t.nav.search,       href: '/dashboard/search',       icon: <Search className="h-4 w-4" /> },

    // — Community
    { label: t.nav.jobs,         href: '/dashboard/jobs',         icon: <Briefcase className="h-4 w-4" />,  section: 'Hamjamiyat' },
    { label: t.nav.forum,        href: '/dashboard/forum',        icon: <UsersRound className="h-4 w-4" /> },
    { label: t.nav.surveys,      href: '/dashboard/surveys',      icon: <Star className="h-4 w-4" /> },

    // — Settings
    { label: t.nav.help,         href: '/dashboard/help',         icon: <HelpCircle className="h-4 w-4" />, section: 'Sozlamalar' },
    { label: t.nav.onboarding,   href: '/dashboard/onboarding',   icon: <Rocket className="h-4 w-4" /> },
    { label: t.nav.profile,      href: '/dashboard/profile',      icon: <User className="h-4 w-4" /> },
  ];
}

// Keep backward-compat static exports (used by layout.tsx currently)
export const adminNavItems: NavItem[] = [];
export const clinicNavItems: NavItem[] = [];
export const userNavItems: NavItem[] = [];
