'use client';

import { useState, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
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
  Scale,
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  featured?: boolean;           // renders AI-style glowing button (main AI Advisor)
  aiColor?: 'amber' | 'violet' | 'emerald'; // renders colored AI sub-item pill
  section?: string;             // renders a section label above this item
  collapsibleSection?: boolean; // section header is collapsible (starts collapsed)
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
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    // Use first-item href as stable key (language-independent)
    const defaults = new Set<string>();
    navItems.forEach(item => {
      if (item.section && item.collapsibleSection) defaults.add(item.href);
    });
    return defaults;
  });
  const pathname = usePathname();
  const { user, userProfile, userRole } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('sma-sidebar-collapsed');
    if (saved === 'true') setCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sma-sidebar-collapsed', String(next));
  };

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

  const SidebarContent = ({ isDesktop = false }: { isDesktop?: boolean }) => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className={cn('flex items-center border-b', collapsed && isDesktop ? 'justify-center p-3' : 'gap-3 p-4')}>
        <Image src="/logo.png" alt="SMA Logo" width={32} height={32} className="rounded-md shadow-sm shrink-0" />
        {(!collapsed || !isDesktop) && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">Smart Medical</p>
            <p className="text-xs text-muted-foreground">Association</p>
          </div>
        )}
        {/* Collapse toggle вЂ" desktop only */}
        {isDesktop && (
          <button
            onClick={toggleCollapse}
            className="ml-auto shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title={collapsed ? 'Kengaytirish' : 'Yig\'ish'}
          >
            {collapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className={cn('flex-1 overflow-y-auto space-y-0.5', collapsed && isDesktop ? 'p-2' : 'p-3')}>
        {(() => {
          const sectionFirstSeen = new Set<string>();
          // Maps translated section label в†’ first-item href (stable collapse key)
          const sectionKeyMap = new Map<string, string>();
          return navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const isCollapsedDesktop = collapsed && isDesktop;
            const isFirstInSection = item.section ? !sectionFirstSeen.has(item.section) : false;
            if (item.section && isFirstInSection) {
              sectionFirstSeen.add(item.section);
              sectionKeyMap.set(item.section, item.href);
            }

            const sectionKey = item.section ? (sectionKeyMap.get(item.section) ?? item.href) : '';
            const sectionCollapsed = sectionKey ? collapsedSections.has(sectionKey) : false;

            // Items that are NOT the first in a collapsible section get hidden when section is collapsed
            if (item.section && !isFirstInSection && sectionCollapsed && !isCollapsedDesktop) return null;

            const toggleSection = (key: string) => {
              setCollapsedSections(prev => {
                const next = new Set(prev);
                if (next.has(key)) next.delete(key);
                else next.add(key);
                return next;
              });
            };

            return (
              <div key={item.href}>
                {/* Section header */}
                {isFirstInSection && item.section && !isCollapsedDesktop && (
                  item.collapsibleSection ? (
                    <button
                      onClick={() => toggleSection(sectionKey)}
                      className="mt-5 mb-0.5 w-full flex items-center justify-between px-2 pt-2.5 border-t border-slate-100 group"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 group-hover:text-slate-600 select-none text-left leading-tight">
                        {item.section}
                      </span>
                      <ChevronRightIcon className={cn(
                        'h-3 w-3 text-slate-300 group-hover:text-slate-400 transition-transform duration-200 shrink-0 ml-1',
                        !sectionCollapsed && 'rotate-90'
                      )} />
                    </button>
                  ) : (
                    <p className="mt-5 mb-0.5 px-2 pt-2.5 border-t border-slate-100 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 select-none leading-tight">
                      {item.section}
                    </p>
                  )
                )}
                {isFirstInSection && item.section && isCollapsedDesktop && (
                  <div className="mt-2 mb-1 border-t border-slate-100" />
                )}

                {/* Hide the actual link when first item's collapsible section is collapsed */}
                {isFirstInSection && item.collapsibleSection && sectionCollapsed && !isCollapsedDesktop ? null : (
                  <>
                    {/* Featured AI item */}
                    {item.featured ? (
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        title={isCollapsedDesktop ? item.label : undefined}
                        className={cn(
                          'group relative flex items-center rounded-xl transition-all duration-200 overflow-hidden',
                          isCollapsedDesktop ? 'justify-center p-2' : 'gap-3 px-3 py-2.5',
                          'text-sm font-semibold',
                          active
                            ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-lg shadow-cyan-500/25'
                            : 'bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 text-cyan-700 hover:from-cyan-500/20 hover:to-emerald-500/20 hover:shadow-md hover:shadow-cyan-500/10 hover:scale-[1.02]'
                        )}
                      >
                        <span className={cn(
                          'absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                          'ring-2 ring-cyan-400/40'
                        )} />
                        <span className={cn(
                          'relative shrink-0 flex h-7 w-7 items-center justify-center rounded-lg',
                          active ? 'bg-white/20' : 'bg-gradient-to-br from-cyan-500 to-emerald-500 shadow-sm'
                        )}>
                          <Bot className="h-4 w-4 text-white" />
                        </span>
                        {!isCollapsedDesktop && (
                          <>
                            <span className="relative truncate">{item.label}</span>
                            {!active && (
                              <span className="relative ml-auto shrink-0 rounded-full bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-cyan-600">
                                AI
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    ) : item.aiColor ? (
                      /* Colored AI sub-item */
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        title={isCollapsedDesktop ? item.label : undefined}
                        className={cn(
                          'group flex items-center rounded-lg text-xs font-semibold transition-all duration-150',
                          isCollapsedDesktop ? 'justify-center p-2' : 'gap-2.5 px-3 py-1.5',
                          item.aiColor === 'amber' && (active
                            ? 'bg-amber-500 text-white shadow-sm shadow-amber-200'
                            : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-100'),
                          item.aiColor === 'violet' && (active
                            ? 'bg-violet-600 text-white shadow-sm shadow-violet-200'
                            : 'text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-100'),
                          item.aiColor === 'emerald' && (active
                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100'),
                        )}
                      >
                        <span className={cn(
                          'shrink-0 flex h-5 w-5 items-center justify-center rounded-md',
                          active ? 'opacity-90' : (
                            item.aiColor === 'amber' ? 'bg-amber-100 text-amber-600' :
                            item.aiColor === 'violet' ? 'bg-violet-100 text-violet-600' :
                            'bg-emerald-100 text-emerald-600'
                          ),
                        )}>{item.icon}</span>
                        {!isCollapsedDesktop && <span className="truncate flex-1">{item.label}</span>}
                        {!isCollapsedDesktop && (
                          <span className={cn(
                            'ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-black tracking-wide',
                            active ? 'bg-white/25 text-white' : (
                              item.aiColor === 'amber' ? 'bg-amber-100 text-amber-600' :
                              item.aiColor === 'violet' ? 'bg-violet-100 text-violet-600' :
                              'bg-emerald-100 text-emerald-600'
                            ),
                          )}>AI</span>
                        )}
                      </Link>
                    ) : (
                      /* Regular nav item */
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        title={isCollapsedDesktop ? item.label : undefined}
                        className={cn(
                          'flex items-center rounded-lg text-sm font-medium transition-all duration-150',
                          isCollapsedDesktop ? 'justify-center p-2' : 'gap-3 px-3 py-2',
                          active
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:translate-x-0.5'
                        )}
                      >
                        <span className="shrink-0">{item.icon}</span>
                        {!isCollapsedDesktop && <span className="truncate">{item.label}</span>}
                      </Link>
                    )}
                  </>
                )}
              </div>
            );
          });
        })()}
      </nav>

      <Separator />

      {/* User section */}
      <div className={cn('space-y-3', collapsed && isDesktop ? 'p-2' : 'p-4')}>
        {collapsed && isDesktop ? (
          /* Collapsed: show only avatar + logout icon */
          <div className="flex flex-col items-center gap-2">
            <Link href="/dashboard/profile" title={t.nav.profile}>
              <Avatar className="h-8 w-8 ring-2 ring-transparent hover:ring-cyan-400 transition-all">
                <AvatarImage src={user?.photoURL ?? undefined} />
                <AvatarFallback className="bg-slate-200 text-slate-700 text-[10px] font-bold">{initials}</AvatarFallback>
              </Avatar>
            </Link>
            <button onClick={handleLogout} className="rounded-md p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title={t.nav.logout}>
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <Link href="/dashboard/profile" className="flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-slate-100 transition-colors group">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={user?.photoURL ?? undefined} />
                <AvatarFallback className="bg-slate-200 text-slate-700 text-xs font-bold group-hover:bg-cyan-100 group-hover:text-cyan-700 transition-colors">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate group-hover:text-cyan-700 transition-colors">{displayName}</p>
                <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', roleBadgeColor)}>
                  {roleBadgeLabel}
                </span>
              </div>
            </Link>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" className="justify-start gap-2 text-slate-600 hover:text-red-600 flex-1" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                {t.nav.logout}
              </Button>
              <div className="flex items-center gap-1">
                <LanguageSwitcher variant="compact" direction="up" />
              </div>
            </div>
          </>
        )}
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
        <SidebarContent isDesktop={false} />
      </div>

      {/* Desktop sidebar вЂ" width transitions on collapse */}
      <aside
        className={cn(
          'hidden lg:flex shrink-0 flex-col border-r bg-white transition-all duration-300',
          collapsed ? 'w-[60px]' : 'w-64'
        )}
      >
        <SidebarContent isDesktop={true} />
      </aside>
    </>
  );
}

// в"Ђв"Ђв"Ђ Nav item sets (translation-aware) в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ

import type { Translations } from '@/i18n/messages/uz';

export function getAdminNavItems(t: Translations): NavItem[] {
  return [
    { label: t.nav.home,      href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: t.nav.aiAdvisor, href: '/ai',         icon: <Bot className="h-4 w-4" />, featured: true },
    { label: t.nav.aiLicence, href: '/ai-licence', icon: <Scale className="h-4 w-4" />,   aiColor: 'amber',   section: 'AI Vositalar' },
    { label: t.nav.aiHr,      href: '/ai-hr',      icon: <Users className="h-4 w-4" />,   aiColor: 'violet' },
    { label: t.nav.aiDocs,    href: '/ai-docs',    icon: <BookOpen className="h-4 w-4" />, aiColor: 'emerald' },

    // вЂ" Management (expanded by default)
    { label: t.nav.statistics,    href: '/dashboard/statistics',    icon: <BarChart3 className="h-4 w-4" />,     section: 'Boshqaruv' },
    { label: t.nav.clinics,       href: '/dashboard/clinics',       icon: <Building2 className="h-4 w-4" /> },
    { label: t.nav.users,         href: '/dashboard/users',         icon: <Users className="h-4 w-4" /> },

    // вЂ" Platform operations (expanded by default)
    { label: t.nav.documents,     href: '/dashboard/documents',     icon: <FileText className="h-4 w-4" />,      section: 'Platforma' },
    { label: t.nav.requests,      href: '/dashboard/requests',      icon: <MessageSquare className="h-4 w-4" /> },
    { label: t.nav.compliance,    href: '/dashboard/compliance',    icon: <Clock className="h-4 w-4" /> },
    { label: t.nav.inspection,    href: '/dashboard/inspection',    icon: <ClipboardCheck className="h-4 w-4" /> },
    { label: t.nav.audit,         href: '/dashboard/audit',         icon: <Shield className="h-4 w-4" /> },

    // вЂ" Communication (collapsed by default)
    { label: t.nav.announcements, href: '/dashboard/announcements', icon: <Megaphone className="h-4 w-4" />,     section: 'Aloqa', collapsibleSection: true },
    { label: t.nav.messages,      href: '/dashboard/messages',      icon: <Mail className="h-4 w-4" /> },
    { label: t.nav.notifications, href: '/dashboard/notifications', icon: <Bell className="h-4 w-4" /> },

    // вЂ" Data & reporting (collapsed by default)
    { label: t.nav.reports,       href: '/dashboard/reports',       icon: <FileBarChart className="h-4 w-4" />,  section: "Ma'lumot", collapsibleSection: true },
    { label: t.nav.surveys,       href: '/dashboard/surveys',       icon: <Star className="h-4 w-4" /> },
    { label: t.nav.exports,       href: '/dashboard/exports',       icon: <FileSpreadsheet className="h-4 w-4" /> },
    { label: t.nav.search,        href: '/dashboard/search',        icon: <Search className="h-4 w-4" /> },
    { label: t.nav.map,           href: '/dashboard/map',           icon: <Globe className="h-4 w-4" /> },

    // вЂ" Community (collapsed by default)
    { label: t.nav.news,          href: '/dashboard/news',          icon: <FileText className="h-4 w-4" />,      section: 'Hamjamiyat', collapsibleSection: true },
    { label: t.nav.jobs,          href: '/dashboard/jobs',          icon: <Briefcase className="h-4 w-4" /> },
    { label: t.nav.forum,         href: '/dashboard/forum',         icon: <UsersRound className="h-4 w-4" /> },

    // вЂ" Clinical oversight (collapsed by default)
    { label: t.nav.appointments,  href: '/dashboard/appointments',  icon: <Calendar className="h-4 w-4" />,      section: 'Tibbiy Nazorat', collapsibleSection: true },

    // вЂ" Settings (collapsed by default)
    { label: t.nav.settings, href: '/dashboard/settings', icon: <Settings className="h-4 w-4" />, section: 'Sozlamalar', collapsibleSection: true },
  ];
}

export function getClinicNavItems(t: Translations): NavItem[] {
  return [
    { label: t.nav.home,      href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: t.nav.aiAdvisor, href: '/ai',         icon: <Bot className="h-4 w-4" />, featured: true },
    { label: t.nav.aiLicence, href: '/ai-licence', icon: <Scale className="h-4 w-4" />,    aiColor: 'amber',   section: 'AI Vositalar' },
    { label: t.nav.aiHr,      href: '/ai-hr',      icon: <Users className="h-4 w-4" />,    aiColor: 'violet' },
    { label: t.nav.aiDocs,    href: '/ai-docs',    icon: <BookOpen className="h-4 w-4" />,  aiColor: 'emerald' },

    // вЂ" Core platform (expanded by default вЂ" primary UX for clinic managers)
    { label: t.nav.documents,     href: '/dashboard/documents',     icon: <FileText className="h-4 w-4" />,      section: 'Platforma' },
    { label: t.nav.requests,      href: '/dashboard/requests',      icon: <MessageSquare className="h-4 w-4" /> },
    { label: t.nav.compliance,    href: '/dashboard/compliance',    icon: <Clock className="h-4 w-4" /> },
    { label: t.nav.inspection,    href: '/dashboard/inspection',    icon: <ShieldCheck className="h-4 w-4" /> },

    // вЂ" ERP system (collapsed by default)
    { label: t.nav.erp,           href: '/dashboard/erp',           icon: <Database className="h-4 w-4" />,      section: 'ERP Tizim', collapsibleSection: true },
    { label: t.nav.staff,         href: '/dashboard/staff',         icon: <UserCog className="h-4 w-4" /> },
    { label: t.nav.inventory,     href: '/dashboard/inventory',     icon: <Package className="h-4 w-4" /> },
    { label: t.nav.equipment,     href: '/dashboard/equipment',     icon: <Wrench className="h-4 w-4" /> },
    { label: t.nav.shifts,        href: '/dashboard/shifts',        icon: <Clock4 className="h-4 w-4" /> },

    // вЂ" Finance (collapsed by default)
    { label: t.nav.finance,       href: '/dashboard/finance',       icon: <DollarSign className="h-4 w-4" />,    section: 'Moliya', collapsibleSection: true },
    { label: t.nav.reports,       href: '/dashboard/reports',       icon: <FileBarChart className="h-4 w-4" /> },
    { label: t.nav.exports,       href: '/dashboard/exports',       icon: <FileSpreadsheet className="h-4 w-4" /> },

    // вЂ" Communication (collapsed by default)
    { label: t.nav.announcements, href: '/dashboard/announcements', icon: <Megaphone className="h-4 w-4" />,     section: 'Aloqa', collapsibleSection: true },
    { label: t.nav.messages,      href: '/dashboard/messages',      icon: <Mail className="h-4 w-4" /> },
    { label: t.nav.notifications, href: '/dashboard/notifications', icon: <Bell className="h-4 w-4" /> },
    { label: t.nav.calendar,      href: '/dashboard/calendar',      icon: <Calendar className="h-4 w-4" /> },
    { label: t.nav.surveys,       href: '/dashboard/surveys',       icon: <Star className="h-4 w-4" /> },

    // вЂ" Knowledge (collapsed by default)
    { label: t.nav.guidelines,    href: '/dashboard/guidelines',    icon: <BookOpen className="h-4 w-4" />,      section: 'Bilim', collapsibleSection: true },
    { label: t.nav.formulary,     href: '/dashboard/formulary',     icon: <Pill className="h-4 w-4" /> },
    { label: t.nav.education,     href: '/dashboard/education',     icon: <GraduationCap className="h-4 w-4" /> },
    { label: t.nav.news,          href: '/dashboard/news',          icon: <FileText className="h-4 w-4" /> },
    { label: t.nav.jobs,          href: '/dashboard/jobs',          icon: <Briefcase className="h-4 w-4" /> },
    { label: t.nav.forum,         href: '/dashboard/forum',         icon: <UsersRound className="h-4 w-4" /> },
    { label: t.nav.search,        href: '/dashboard/search',        icon: <Search className="h-4 w-4" /> },
    { label: t.nav.map,           href: '/dashboard/map',           icon: <Globe className="h-4 w-4" /> },

    // вЂ" Clinical services (collapsed by default)
    { label: t.nav.appointments,  href: '/dashboard/appointments',  icon: <Calendar className="h-4 w-4" />,      section: 'Tibbiy Xizmatlar', collapsibleSection: true },
    { label: t.nav.vaccinations,  href: '/dashboard/vaccinations',  icon: <Syringe className="h-4 w-4" /> },
    { label: t.nav.referrals,     href: '/dashboard/referrals',     icon: <ArrowRightLeft className="h-4 w-4" /> },
    { label: t.nav.complaints,    href: '/dashboard/complaints',    icon: <AlertCircle className="h-4 w-4" /> },
    { label: t.nav.telemedicine,  href: '/dashboard/telemedicine',  icon: <Video className="h-4 w-4" /> },
    { label: t.nav.prescriptions, href: '/dashboard/prescriptions', icon: <Pill className="h-4 w-4" /> },
    { label: t.nav.bloodbank,     href: '/dashboard/bloodbank',     icon: <Droplets className="h-4 w-4" /> },

    // вЂ" Settings (collapsed by default)
    { label: t.nav.profile,       href: '/dashboard/profile',       icon: <User className="h-4 w-4" />,          section: 'Sozlamalar', collapsibleSection: true },
    { label: t.nav.help,          href: '/dashboard/help',          icon: <HelpCircle className="h-4 w-4" /> },
    { label: t.nav.onboarding,    href: '/dashboard/onboarding',    icon: <Rocket className="h-4 w-4" /> },
  ];
}

export function getDoctorNavItems(t: Translations): NavItem[] {
  return [
    // вЂ" Top level
    { label: t.nav.home,      href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: t.nav.aiAdvisor, href: '/ai',         icon: <Bot className="h-4 w-4" />, featured: true },
    { label: t.nav.aiLicence, href: '/ai-licence', icon: <Scale className="h-4 w-4" />,    aiColor: 'amber',   section: 'AI Vositalar' },
    { label: t.nav.aiHr,      href: '/ai-hr',      icon: <Users className="h-4 w-4" />,    aiColor: 'violet' },
    { label: t.nav.aiDocs,    href: '/ai-docs',    icon: <BookOpen className="h-4 w-4" />,  aiColor: 'emerald' },

    // Medical
    { label: t.nav.appointments, href: '/dashboard/appointments', icon: <Calendar className="h-4 w-4" />, section: 'Tibbiy' },
    { label: t.nav.prescriptions, href: '/dashboard/prescriptions', icon: <Pill className="h-4 w-4" /> },
    { label: t.nav.formulary,    href: '/dashboard/formulary',    icon: <Pill className="h-4 w-4" /> },
    { label: t.nav.telemedicine, href: '/dashboard/telemedicine', icon: <Video className="h-4 w-4" /> },

    // вЂ" Documents & communication
    { label: t.nav.documents,    href: '/dashboard/documents',    icon: <FileText className="h-4 w-4" />,   section: 'Hujjatlar' },
    { label: t.nav.requests,     href: '/dashboard/requests',     icon: <MessageSquare className="h-4 w-4" /> },
    { label: t.nav.messages,     href: '/dashboard/messages',     icon: <Mail className="h-4 w-4" /> },
    { label: t.nav.notifications, href: '/dashboard/notifications', icon: <Bell className="h-4 w-4" /> },

    // вЂ" Knowledge
    { label: t.nav.guidelines,   href: '/dashboard/guidelines',   icon: <BookOpen className="h-4 w-4" />,   section: 'Bilim' },
    { label: t.nav.education,    href: '/dashboard/education',    icon: <GraduationCap className="h-4 w-4" /> },
    { label: t.nav.news,         href: '/dashboard/news',         icon: <FileText className="h-4 w-4" /> },
    { label: t.nav.search,       href: '/dashboard/search',       icon: <Search className="h-4 w-4" /> },

    // вЂ" Community
    { label: t.nav.jobs,         href: '/dashboard/jobs',         icon: <Briefcase className="h-4 w-4" />,  section: 'Hamjamiyat' },
    { label: t.nav.forum,        href: '/dashboard/forum',        icon: <UsersRound className="h-4 w-4" /> },

    // вЂ" Settings
    { label: t.nav.help,         href: '/dashboard/help',         icon: <HelpCircle className="h-4 w-4" />, section: 'Sozlamalar' },
    { label: t.nav.onboarding,   href: '/dashboard/onboarding',   icon: <Rocket className="h-4 w-4" /> },
    { label: t.nav.profile,      href: '/dashboard/profile',      icon: <User className="h-4 w-4" /> },
  ];
}

// в"Ђв"Ђв"Ђ User (patient) nav вЂ" all groups collapsed в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ

export function getUserNavItems(t: Translations): NavItem[] {
  return [
    { label: t.nav.home,      href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: t.nav.aiAdvisor, href: '/ai',         icon: <Bot className="h-4 w-4" />, featured: true },
    { label: t.nav.aiLicence, href: '/ai-licence', icon: <Scale className="h-4 w-4" />,    aiColor: 'amber',   section: 'AI Vositalar' },
    { label: t.nav.aiHr,      href: '/ai-hr',      icon: <Users className="h-4 w-4" />,    aiColor: 'violet' },
    { label: t.nav.aiDocs,    href: '/ai-docs',    icon: <BookOpen className="h-4 w-4" />,  aiColor: 'emerald' },

    // My Health
    { label: t.nav.scheduleHub,   href: '/dashboard/schedule',       icon: <Calendar className="h-4 w-4" />,      section: t.nav.scheduleHub,                          collapsibleSection: true },
    { label: t.nav.appointments,  href: '/dashboard/appointments',   icon: <Calendar className="h-4 w-4" />,      section: t.nav.scheduleHub },
    { label: t.nav.vaccinations,  href: '/dashboard/vaccinations',   icon: <Syringe className="h-4 w-4" />,       section: t.nav.scheduleHub },
    { label: t.nav.qrCard,        href: '/dashboard/qr-card',        icon: <QrCode className="h-4 w-4" />,        section: t.nav.scheduleHub },
    { label: t.nav.prescriptions, href: '/dashboard/prescriptions',  icon: <Pill className="h-4 w-4" />,          section: t.nav.scheduleHub },
    { label: t.nav.telemedicine,  href: '/dashboard/telemedicine',   icon: <Video className="h-4 w-4" />,         section: t.nav.scheduleHub },

    // Messages & Cases
    { label: t.nav.cases,         href: '/dashboard/cases',          icon: <MessageSquare className="h-4 w-4" />, section: t.nav.cases,                                collapsibleSection: true },
    { label: t.nav.messages,      href: '/dashboard/messages',       icon: <Mail className="h-4 w-4" />,          section: t.nav.cases },
    { label: t.nav.forum,         href: '/dashboard/forum',          icon: <UsersRound className="h-4 w-4" />,    section: t.nav.cases },
    { label: t.nav.notifications, href: '/dashboard/notifications',  icon: <Bell className="h-4 w-4" />,          section: t.nav.cases },

    // Resources
    { label: t.nav.knowledgeBase, href: '/dashboard/knowledge-base', icon: <BookOpen className="h-4 w-4" />,      section: t.nav.knowledgeBase,                        collapsibleSection: true },
    { label: t.nav.formulary,     href: '/dashboard/formulary',      icon: <Pill className="h-4 w-4" />,          section: t.nav.knowledgeBase },
    { label: t.nav.guidelines,    href: '/dashboard/guidelines',     icon: <BookOpen className="h-4 w-4" />,      section: t.nav.knowledgeBase },
    { label: t.nav.news,          href: '/dashboard/news',           icon: <FileText className="h-4 w-4" />,      section: t.nav.knowledgeBase },
    { label: t.nav.search,        href: '/dashboard/search',         icon: <Search className="h-4 w-4" />,        section: t.nav.knowledgeBase },

    // Account
    { label: t.nav.profile,       href: '/dashboard/profile',        icon: <User className="h-4 w-4" />,          section: 'Profil',         collapsibleSection: true },
    { label: t.nav.help,          href: '/dashboard/help',           icon: <HelpCircle className="h-4 w-4" />,    section: 'Profil' },
    { label: t.nav.surveys,       href: '/dashboard/surveys',        icon: <Star className="h-4 w-4" />,          section: 'Profil' },
    { label: t.nav.onboarding,    href: '/dashboard/onboarding',     icon: <Rocket className="h-4 w-4" />,        section: 'Profil' },
  ];
}

// в"Ђв"Ђв"Ђ Admin workspace nav вЂ" all groups collapsed в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ

export function getAdminWorkspaceNavItems(t: Translations): NavItem[] {
  return [
    { label: t.nav.home,             href: '/dashboard',                    icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: t.nav.aiAdvisor,        href: '/ai',                           icon: <Bot className="h-4 w-4" />, featured: true },
    { label: t.nav.aiLicence,        href: '/ai-licence',                   icon: <Scale className="h-4 w-4" />,    aiColor: 'amber',   section: 'AI Vositalar' },
    { label: t.nav.aiHr,             href: '/ai-hr',                        icon: <Users className="h-4 w-4" />,    aiColor: 'violet' },
    { label: t.nav.aiDocs,           href: '/ai-docs',                      icon: <BookOpen className="h-4 w-4" />, aiColor: 'emerald' },

    // Management
    { label: t.nav.clinics,          href: '/dashboard/clinics',            icon: <Building2 className="h-4 w-4" />,      section: 'Boshqaruv',          collapsibleSection: true },
    { label: t.nav.users,            href: '/dashboard/users',              icon: <Users className="h-4 w-4" />,          section: 'Boshqaruv' },
    { label: t.nav.statistics,       href: '/dashboard/statistics',         icon: <BarChart3 className="h-4 w-4" />,      section: 'Boshqaruv' },

    // Documents & Requests
    { label: t.nav.documentCenter,   href: '/dashboard/document-center',    icon: <FileText className="h-4 w-4" />,       section: 'Hujjatlar',     collapsibleSection: true },
    { label: t.nav.documents,        href: '/dashboard/documents',          icon: <FileText className="h-4 w-4" />,       section: 'Hujjatlar' },
    { label: t.nav.cases,            href: '/dashboard/cases',              icon: <MessageSquare className="h-4 w-4" />,  section: 'Hujjatlar' },
    { label: t.nav.requests,         href: '/dashboard/requests',           icon: <MessageSquare className="h-4 w-4" />,  section: 'Hujjatlar' },
    { label: t.nav.complaints,       href: '/dashboard/complaints',         icon: <AlertCircle className="h-4 w-4" />,    section: 'Hujjatlar' },
    { label: t.nav.referrals,        href: '/dashboard/referrals',          icon: <ArrowRightLeft className="h-4 w-4" />, section: 'Hujjatlar' },

    // Compliance & Audit
    { label: t.nav.complianceCenter, href: '/dashboard/compliance-center',  icon: <ShieldCheck className="h-4 w-4" />,    section: 'Muvofiqlik',       collapsibleSection: true },
    { label: t.nav.audit,            href: '/dashboard/audit',              icon: <Shield className="h-4 w-4" />,         section: 'Muvofiqlik' },
    { label: t.nav.compliance,       href: '/dashboard/compliance',         icon: <Clock className="h-4 w-4" />,          section: 'Muvofiqlik' },
    { label: t.nav.inspection,       href: '/dashboard/inspection',         icon: <ClipboardCheck className="h-4 w-4" />, section: 'Muvofiqlik' },

    // Communication
    { label: t.nav.messages,         href: '/dashboard/messages',           icon: <Mail className="h-4 w-4" />,           section: 'Muloqot',                              collapsibleSection: true },
    { label: t.nav.announcements,    href: '/dashboard/announcements',      icon: <Megaphone className="h-4 w-4" />,      section: 'Muloqot' },
    { label: t.nav.forum,            href: '/dashboard/forum',              icon: <UsersRound className="h-4 w-4" />,     section: 'Muloqot' },
    { label: t.nav.notifications,    href: '/dashboard/notifications',      icon: <Bell className="h-4 w-4" />,           section: 'Muloqot' },
    { label: t.nav.surveys,          href: '/dashboard/surveys',            icon: <Star className="h-4 w-4" />,           section: 'Muloqot' },

    // Reports & Data
    { label: t.nav.reports,          href: '/dashboard/reports',            icon: <FileBarChart className="h-4 w-4" />,   section: 'Hisobotlar',        collapsibleSection: true },
    { label: t.nav.exports,          href: '/dashboard/exports',            icon: <FileSpreadsheet className="h-4 w-4" />,section: 'Hisobotlar' },
    { label: t.nav.map,              href: '/dashboard/map',                icon: <Globe className="h-4 w-4" />,          section: 'Hisobotlar' },
    { label: t.nav.search,           href: '/dashboard/search',             icon: <Search className="h-4 w-4" />,         section: 'Hisobotlar' },
    { label: t.nav.news,             href: '/dashboard/news',               icon: <FileText className="h-4 w-4" />,       section: 'Hisobotlar' },
    { label: t.nav.jobs,             href: '/dashboard/jobs',               icon: <Briefcase className="h-4 w-4" />,      section: 'Hisobotlar' },

    // Settings
    { label: t.nav.settings,         href: '/dashboard/settings',           icon: <Settings className="h-4 w-4" />,       section: 'Sozlamalar',    collapsibleSection: true },
  ];
}

// в"Ђв"Ђв"Ђ Clinic workspace nav вЂ" all groups collapsed в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ

export function getClinicWorkspaceNavItems(t: Translations): NavItem[] {
  return [
    { label: t.nav.home,             href: '/dashboard',                    icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: t.nav.aiAdvisor,        href: '/ai',                           icon: <Bot className="h-4 w-4" />, featured: true },
    { label: t.nav.aiLicence,        href: '/ai-licence',                   icon: <Scale className="h-4 w-4" />,    aiColor: 'amber',   section: 'AI Vositalar' },
    { label: t.nav.aiHr,             href: '/ai-hr',                        icon: <Users className="h-4 w-4" />,    aiColor: 'violet' },
    { label: t.nav.aiDocs,           href: '/ai-docs',                      icon: <BookOpen className="h-4 w-4" />, aiColor: 'emerald' },

    // Schedule
    { label: t.nav.scheduleHub,      href: '/dashboard/schedule',           icon: <Calendar className="h-4 w-4" />,       section: t.nav.scheduleHub,                           collapsibleSection: true },
    { label: t.nav.appointments,     href: '/dashboard/appointments',       icon: <Calendar className="h-4 w-4" />,       section: t.nav.scheduleHub },
    { label: t.nav.calendar,         href: '/dashboard/calendar',           icon: <Calendar className="h-4 w-4" />,       section: t.nav.scheduleHub },
    { label: t.nav.shifts,           href: '/dashboard/shifts',             icon: <Clock4 className="h-4 w-4" />,         section: t.nav.scheduleHub },

    // Clinic Operations
    { label: t.nav.clinicOperations, href: '/dashboard/clinic-operations',  icon: <Database className="h-4 w-4" />,       section: t.nav.clinicOperations,                      collapsibleSection: true },
    { label: t.nav.erp,              href: '/dashboard/erp',                icon: <Database className="h-4 w-4" />,       section: t.nav.clinicOperations },
    { label: t.nav.staff,            href: '/dashboard/staff',              icon: <UserCog className="h-4 w-4" />,        section: t.nav.clinicOperations },
    { label: t.nav.inventory,        href: '/dashboard/inventory',          icon: <Package className="h-4 w-4" />,        section: t.nav.clinicOperations },
    { label: t.nav.equipment,        href: '/dashboard/equipment',          icon: <Wrench className="h-4 w-4" />,         section: t.nav.clinicOperations },

    // Compliance
    { label: t.nav.complianceCenter, href: '/dashboard/compliance-center',  icon: <ShieldCheck className="h-4 w-4" />,   section: t.nav.complianceCenter,                      collapsibleSection: true },
    { label: t.nav.compliance,       href: '/dashboard/compliance',         icon: <Clock className="h-4 w-4" />,          section: t.nav.complianceCenter },
    { label: t.nav.inspection,       href: '/dashboard/inspection',         icon: <ShieldCheck className="h-4 w-4" />,    section: t.nav.complianceCenter },

    // Documents & Cases
    { label: t.nav.documentCenter,   href: '/dashboard/document-center',   icon: <FileText className="h-4 w-4" />,       section: 'Hujjatlar',       collapsibleSection: true },
    { label: t.nav.documents,        href: '/dashboard/documents',          icon: <FileText className="h-4 w-4" />,       section: 'Hujjatlar' },
    { label: t.nav.cases,            href: '/dashboard/cases',              icon: <MessageSquare className="h-4 w-4" />,  section: 'Hujjatlar' },
    { label: t.nav.requests,         href: '/dashboard/requests',           icon: <MessageSquare className="h-4 w-4" />,  section: 'Hujjatlar' },
    { label: t.nav.complaints,       href: '/dashboard/complaints',         icon: <AlertCircle className="h-4 w-4" />,    section: 'Hujjatlar' },
    { label: t.nav.referrals,        href: '/dashboard/referrals',          icon: <ArrowRightLeft className="h-4 w-4" />, section: 'Hujjatlar' },

    // Communication
    { label: t.nav.messages,         href: '/dashboard/messages',           icon: <Mail className="h-4 w-4" />,           section: t.nav.messages,                              collapsibleSection: true },
    { label: t.nav.announcements,    href: '/dashboard/announcements',      icon: <Megaphone className="h-4 w-4" />,      section: t.nav.messages },
    { label: t.nav.notifications,    href: '/dashboard/notifications',      icon: <Bell className="h-4 w-4" />,           section: t.nav.messages },
    { label: t.nav.surveys,          href: '/dashboard/surveys',            icon: <Star className="h-4 w-4" />,           section: t.nav.messages },
    { label: t.nav.forum,            href: '/dashboard/forum',              icon: <UsersRound className="h-4 w-4" />,     section: t.nav.messages },

    // Resources
    { label: t.nav.knowledgeBase,    href: '/dashboard/knowledge-base',     icon: <BookOpen className="h-4 w-4" />,       section: t.nav.knowledgeBase,                         collapsibleSection: true },
    { label: t.nav.guidelines,       href: '/dashboard/guidelines',         icon: <BookOpen className="h-4 w-4" />,       section: t.nav.knowledgeBase },
    { label: t.nav.formulary,        href: '/dashboard/formulary',          icon: <Pill className="h-4 w-4" />,           section: t.nav.knowledgeBase },
    { label: t.nav.finance,          href: '/dashboard/finance',            icon: <DollarSign className="h-4 w-4" />,     section: t.nav.knowledgeBase },
    { label: t.nav.reports,          href: '/dashboard/reports',            icon: <FileBarChart className="h-4 w-4" />,   section: t.nav.knowledgeBase },
    { label: t.nav.exports,          href: '/dashboard/exports',            icon: <FileSpreadsheet className="h-4 w-4" />,section: t.nav.knowledgeBase },
    { label: t.nav.news,             href: '/dashboard/news',               icon: <FileText className="h-4 w-4" />,       section: t.nav.knowledgeBase },
    { label: t.nav.map,              href: '/dashboard/map',                icon: <Globe className="h-4 w-4" />,          section: t.nav.knowledgeBase },

    // Account
    { label: t.nav.profile,          href: '/dashboard/profile',            icon: <User className="h-4 w-4" />,           section: 'Profil',          collapsibleSection: true },
    { label: t.nav.help,             href: '/dashboard/help',               icon: <HelpCircle className="h-4 w-4" />,     section: 'Profil' },
    { label: t.nav.onboarding,       href: '/dashboard/onboarding',         icon: <Rocket className="h-4 w-4" />,         section: 'Profil' },
  ];
}

// в"Ђв"Ђв"Ђ Doctor workspace nav вЂ" all groups collapsed в"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђв"Ђ

export function getDoctorWorkspaceNavItems(t: Translations): NavItem[] {
  return [
    { label: t.nav.home,             href: '/dashboard',                icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: t.nav.aiAdvisor,        href: '/ai',                       icon: <Bot className="h-4 w-4" />, featured: true },
    { label: t.nav.aiLicence,        href: '/ai-licence',               icon: <Scale className="h-4 w-4" />,    aiColor: 'amber',   section: 'AI Vositalar' },
    { label: t.nav.aiHr,             href: '/ai-hr',                    icon: <Users className="h-4 w-4" />,    aiColor: 'violet' },
    { label: t.nav.aiDocs,           href: '/ai-docs',                  icon: <BookOpen className="h-4 w-4" />, aiColor: 'emerald' },

    // Documents & Cases
    { label: t.nav.documentCenter,   href: '/dashboard/document-center', icon: <FileText className="h-4 w-4" />,    section: 'Hujjatlar',    collapsibleSection: true },
    { label: t.nav.documents,        href: '/dashboard/documents',       icon: <FileText className="h-4 w-4" />,    section: 'Hujjatlar' },
    { label: t.nav.cases,            href: '/dashboard/cases',           icon: <MessageSquare className="h-4 w-4" />,section: 'Hujjatlar' },
    { label: t.nav.referrals,        href: '/dashboard/referrals',       icon: <ArrowRightLeft className="h-4 w-4" />,section: 'Hujjatlar' },
    { label: t.nav.messages,         href: '/dashboard/messages',        icon: <Mail className="h-4 w-4" />,        section: 'Hujjatlar' },

    // Schedule & Clinical
    { label: t.nav.scheduleHub,      href: '/dashboard/schedule',        icon: <Calendar className="h-4 w-4" />,     section: t.nav.scheduleHub,                        collapsibleSection: true },
    { label: t.nav.appointments,     href: '/dashboard/appointments',    icon: <Calendar className="h-4 w-4" />,     section: t.nav.scheduleHub },
    { label: t.nav.prescriptions,    href: '/dashboard/prescriptions',   icon: <Pill className="h-4 w-4" />,         section: t.nav.scheduleHub },
    { label: t.nav.telemedicine,     href: '/dashboard/telemedicine',    icon: <Video className="h-4 w-4" />,        section: t.nav.scheduleHub },

    // Knowledge
    { label: t.nav.knowledgeBase,    href: '/dashboard/knowledge-base',  icon: <BookOpen className="h-4 w-4" />,     section: t.nav.knowledgeBase,                      collapsibleSection: true },
    { label: t.nav.guidelines,       href: '/dashboard/guidelines',      icon: <BookOpen className="h-4 w-4" />,     section: t.nav.knowledgeBase },
    { label: t.nav.formulary,        href: '/dashboard/formulary',       icon: <Pill className="h-4 w-4" />,         section: t.nav.knowledgeBase },
    { label: t.nav.education,        href: '/dashboard/education',       icon: <GraduationCap className="h-4 w-4" />,section: t.nav.knowledgeBase },
    { label: t.nav.news,             href: '/dashboard/news',            icon: <FileText className="h-4 w-4" />,     section: t.nav.knowledgeBase },
    { label: t.nav.search,           href: '/dashboard/search',          icon: <Search className="h-4 w-4" />,       section: t.nav.knowledgeBase },

    // Community
    { label: t.nav.forum,            href: '/dashboard/forum',           icon: <UsersRound className="h-4 w-4" />,   section: 'Hamjamiyat',         collapsibleSection: true },
    { label: t.nav.jobs,             href: '/dashboard/jobs',            icon: <Briefcase className="h-4 w-4" />,    section: 'Hamjamiyat' },

    // Account
    { label: t.nav.profile,          href: '/dashboard/profile',         icon: <User className="h-4 w-4" />,         section: 'Profil',       collapsibleSection: true },
    { label: t.nav.notifications,    href: '/dashboard/notifications',   icon: <Bell className="h-4 w-4" />,         section: 'Profil' },
    { label: t.nav.help,             href: '/dashboard/help',            icon: <HelpCircle className="h-4 w-4" />,   section: 'Profil' },
    { label: t.nav.onboarding,       href: '/dashboard/onboarding',      icon: <Rocket className="h-4 w-4" />,       section: 'Profil' },
  ];
}

// Keep backward-compat static exports (used by role-group layouts)
export const adminNavItems: NavItem[] = [];
export const clinicNavItems: NavItem[] = [];
export const userNavItems: NavItem[] = [];
// Alias so existing imports keep working
export { getUserNavItems as getPatientNavItems };
