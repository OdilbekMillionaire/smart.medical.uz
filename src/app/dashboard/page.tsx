'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getAllClinics, getUsersByRole, getPendingDocuments,
  getOverdueCompliance, getDocumentsByOwner, getComplianceByClinic,
  getRequestsByUser, getAppointmentsByPatient, getVaccinationsByPatient,
  getMessagesByUser, getSurveysByPatient,
} from '@/lib/firestore';
import {
  Building2, Users, FileText, Clock, Bot, ArrowRight,
  AlertTriangle, MessageSquare, ShieldCheck,
  TrendingUp, Newspaper, ExternalLink, Zap, Database,
  Calendar, Bell, Globe, BarChart3, UserCheck,
  Syringe, QrCode, Star,
} from 'lucide-react';

// ─── Locale mapping for date formatting ──────────────────────────────────────
type Lang = 'uz' | 'uz_cyrillic' | 'ru' | 'en' | 'kk';
const DATE_LOCALE: Record<Lang, string> = {
  uz: 'uz-Latn-UZ',
  uz_cyrillic: 'uz-Cyrl-UZ',
  ru: 'ru-RU',
  en: 'en-US',
  kk: 'kk-KZ',
};

// ─── Shared mini-components ───────────────────────────────────────────────────

function StatCard({ label, value, icon, color, href }: {
  label: string; value: number | null; icon: React.ReactNode;
  color: string; href?: string;
}) {
  const content = (
    <Card className={`hover:shadow-md transition-all group border-l-4 ${color}`}>
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          {value === null
            ? <Skeleton className="h-8 w-16 mt-1" />
            : <p className="text-3xl font-bold mt-1">{value}</p>}
        </div>
        <div className="rounded-xl bg-white/80 p-3 shadow-sm">{icon}</div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : <>{content}</>;
}

function QuickAction({ icon, label, href, color }: { icon: React.ReactNode; label: string; href: string; color: string }) {
  return (
    <Link href={href}>
      <div className={`flex flex-col items-center gap-2 p-4 rounded-xl border bg-white hover:shadow-md transition-all cursor-pointer group ${color}`}>
        <div className="rounded-full bg-white p-3 shadow-sm group-hover:scale-110 transition-transform">{icon}</div>
        <span className="text-xs font-semibold text-center text-slate-700 leading-tight">{label}</span>
      </div>
    </Link>
  );
}

function WorkspaceCard({ icon, title, description, href }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="h-full rounded-xl border bg-white p-4 transition-all hover:border-slate-300 hover:shadow-md">
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          {icon}
        </div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
      </div>
    </Link>
  );
}

function NewsWidget() {
  const { t } = useLanguage();
  interface NewsItem { title: string; source: { name: string }; url: string; publishedAt: string }
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/news?category=all')
      .then((r) => r.json())
      .then((d: { articles?: NewsItem[] }) => { setNews((d.articles ?? []).slice(0, 4)); })
      .catch(() => setNews([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-blue-600" /> {t.dashboard.medicalNews}
        </CardTitle>
        <Link href="/dashboard/news">
          <Button variant="ghost" size="sm" className="text-xs gap-1 text-blue-600">
            {t.dashboard.viewAllShort} <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)
          : news.length === 0
          ? <p className="text-sm text-muted-foreground text-center py-4">{t.dashboard.noNews}</p>
          : news.map((item, i) => (
            <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 line-clamp-2 group-hover:text-blue-700 transition-colors leading-snug">
                  {item.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{item.source.name}</p>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-blue-400 shrink-0 mt-1" />
            </a>
          ))
        }
      </CardContent>
    </Card>
  );
}

// ─── ADMIN DASHBOARD ─────────────────────────────────────────────────────────

function AdminDashboard() {
  const { t, lang } = useLanguage();
  const [stats, setStats] = useState<{
    clinics: number; users: number; pendingDocs: number; overdue: number;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      getAllClinics(), getUsersByRole('doctor'), getUsersByRole('patient'),
      getPendingDocuments(), getOverdueCompliance(),
    ]).then(([clinics, doctors, patients, pending, overdue]) => {
      setStats({ clinics: clinics.length, users: doctors.length + patients.length, pendingDocs: pending.length, overdue: overdue.length });
    }).catch(() => setStats({ clinics: 0, users: 0, pendingDocs: 0, overdue: 0 }));
  }, []);

  const today = new Date().toLocaleDateString(DATE_LOCALE[lang], {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.dashboard.adminTitle}</h1>
          <p className="text-sm text-muted-foreground capitalize mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-red-100 text-red-700 border-red-200 font-medium">
            {stats?.overdue ?? '—'} {t.dashboard.overdueBadge}
          </Badge>
          <Badge className="bg-orange-100 text-orange-700 border-orange-200 font-medium">
            {stats?.pendingDocs ?? '—'} {t.dashboard.pendingDocsBadge}
          </Badge>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <WorkspaceCard
          icon={<Building2 className="h-4 w-4" />}
          title={`${t.nav.clinics} / ${t.nav.users}`}
          description={t.dashboard.totalUsers}
          href="/dashboard/clinics"
        />
        <WorkspaceCard
          icon={<FileText className="h-4 w-4" />}
          title={`${t.nav.documents} / ${t.nav.requests}`}
          description={t.dashboard.pendingDocuments}
          href="/dashboard/documents"
        />
        <WorkspaceCard
          icon={<ShieldCheck className="h-4 w-4" />}
          title={`${t.nav.audit} / ${t.nav.compliance}`}
          description={t.dashboard.overdueItems}
          href="/dashboard/audit"
        />
        <WorkspaceCard
          icon={<BarChart3 className="h-4 w-4" />}
          title={`${t.nav.reports} / ${t.nav.exports}`}
          description={t.dashboard.platformStatus}
          href="/dashboard/reports"
        />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t.dashboard.clinics} value={stats?.clinics ?? null} href="/dashboard/clinics"
          icon={<Building2 className="h-6 w-6 text-blue-600" />} color="border-l-blue-500 bg-blue-50/30" />
        <StatCard label={t.dashboard.users} value={stats?.users ?? null} href="/dashboard/users"
          icon={<Users className="h-6 w-6 text-green-600" />} color="border-l-green-500 bg-green-50/30" />
        <StatCard label={t.dashboard.pendingDocuments} value={stats?.pendingDocs ?? null} href="/dashboard/documents"
          icon={<FileText className="h-6 w-6 text-orange-600" />} color="border-l-orange-500 bg-orange-50/30" />
        <StatCard label={t.dashboard.overdueItems} value={stats?.overdue ?? null} href="/dashboard/compliance"
          icon={<AlertTriangle className="h-6 w-6 text-red-600" />} color="border-l-red-500 bg-red-50/30" />
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" /> {t.dashboard.quickActions}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <QuickAction icon={<FileText className="w-5 h-5 text-orange-600" />} label={t.dashboard.reviewDocuments} href="/dashboard/documents" color="hover:border-orange-200" />
            <QuickAction icon={<Building2 className="w-5 h-5 text-blue-600" />} label={t.dashboard.clinics} href="/dashboard/clinics" color="hover:border-blue-200" />
            <QuickAction icon={<MessageSquare className="w-5 h-5 text-purple-600" />} label={t.dashboard.requests} href="/dashboard/requests" color="hover:border-purple-200" />
            <QuickAction icon={<Clock className="w-5 h-5 text-red-600" />} label={t.dashboard.compliance} href="/dashboard/compliance" color="hover:border-red-200" />
            <QuickAction icon={<ShieldCheck className="w-5 h-5 text-green-600" />} label={t.dashboard.inspection} href="/dashboard/inspection" color="hover:border-green-200" />
            <QuickAction icon={<Users className="w-5 h-5 text-slate-600" />} label={t.dashboard.users} href="/dashboard/users" color="hover:border-slate-200" />
          </div>
        </CardContent>
      </Card>

      {/* News + Stats grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NewsWidget />
        </div>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-600" /> {t.dashboard.platformStatus}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: t.dashboard.clinics, value: stats?.clinics ?? 0, max: 100, color: 'bg-blue-500' },
              { label: t.dashboard.users, value: stats?.users ?? 0, max: 500, color: 'bg-green-500' },
              { label: t.dashboard.pendingDocuments, value: stats?.pendingDocs ?? 0, max: 50, color: 'bg-orange-500' },
              { label: t.dashboard.overdueItems, value: stats?.overdue ?? 0, max: 30, color: 'bg-red-500' },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>{item.label}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── CLINIC DASHBOARD ─────────────────────────────────────────────────────────

function ClinicDashboard() {
  const { user, userProfile } = useAuth();
  const { t, lang } = useLanguage();
  const [stats, setStats] = useState<{
    myDocs: number; overdue: number; upcoming: number; requests: number;
  } | null>(null);

  const profileFields = userProfile ? Object.values(userProfile).filter(Boolean).length : 0;
  const profileProgress = Math.min(100, Math.round((profileFields / 15) * 100));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clinicName = (userProfile as any)?.clinicName ?? userProfile?.displayName ?? t.auth.roleClinic;

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getDocumentsByOwner(user.uid),
      getComplianceByClinic(user.uid),
      getRequestsByUser(user.uid),
    ]).then(([docs, compliance, requests]) => {
      const now = new Date();
      const overdue = compliance.filter((c) => new Date(c.dueDate) < now && c.status !== 'done').length;
      const upcoming = compliance.filter((c) => {
        const d = new Date(c.dueDate);
        const days = Math.ceil((d.getTime() - now.getTime()) / 86400000);
        return days >= 0 && days <= 30 && c.status !== 'done';
      }).length;
      setStats({ myDocs: docs.length, overdue, upcoming, requests: requests.length });
    }).catch(() => setStats({ myDocs: 0, overdue: 0, upcoming: 0, requests: 0 }));
  }, [user]);

  const today = new Date().toLocaleDateString(DATE_LOCALE[lang], {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 text-white p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-slate-300 text-sm capitalize">{today}</p>
          <h1 className="text-2xl font-bold mt-1">{t.dashboard.welcome}, {clinicName}!</h1>
          <p className="text-slate-300 text-sm mt-1">{t.dashboard.overview}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {(stats?.overdue ?? 0) > 0 && (
            <Link href="/dashboard/compliance">
              <Badge className="bg-red-500 text-white border-0 gap-1 cursor-pointer hover:bg-red-600">
                <AlertTriangle className="w-3 h-3" /> {stats?.overdue} {t.dashboard.overdueBadge}
              </Badge>
            </Link>
          )}
          <Link href="/dashboard/compliance/new">
            <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100 gap-1.5">
              <Calendar className="w-4 h-4" /> {t.dashboard.addDeadline}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <WorkspaceCard
          icon={<Calendar className="h-4 w-4" />}
          title={`${t.nav.appointments} / ${t.nav.shifts}`}
          description={t.dashboard.within30Days}
          href="/dashboard/appointments"
        />
        <WorkspaceCard
          icon={<Database className="h-4 w-4" />}
          title={`${t.nav.erp} / ${t.nav.staff}`}
          description={t.dashboard.erpSystem}
          href="/dashboard/erp"
        />
        <WorkspaceCard
          icon={<ShieldCheck className="h-4 w-4" />}
          title={`${t.nav.compliance} / ${t.nav.inspection}`}
          description={t.dashboard.overdueItems}
          href="/dashboard/compliance"
        />
        <WorkspaceCard
          icon={<FileText className="h-4 w-4" />}
          title={`${t.nav.documents} / ${t.nav.requests}`}
          description={t.dashboard.myDocuments}
          href="/dashboard/documents"
        />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t.dashboard.myDocuments} value={stats?.myDocs ?? null} href="/dashboard/documents"
          icon={<FileText className="h-6 w-6 text-blue-600" />} color="border-l-blue-500 bg-blue-50/30" />
        <StatCard label={t.dashboard.overdueItems} value={stats?.overdue ?? null} href="/dashboard/compliance"
          icon={<AlertTriangle className="h-6 w-6 text-red-600" />} color="border-l-red-500 bg-red-50/30" />
        <StatCard label={t.dashboard.within30Days} value={stats?.upcoming ?? null} href="/dashboard/compliance"
          icon={<Clock className="h-6 w-6 text-orange-600" />} color="border-l-orange-500 bg-orange-50/30" />
        <StatCard label={t.dashboard.requests} value={stats?.requests ?? null} href="/dashboard/requests"
          icon={<MessageSquare className="h-6 w-6 text-purple-600" />} color="border-l-purple-500 bg-purple-50/30" />
      </div>

      {/* Profile completion */}
      {profileProgress < 80 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center gap-4">
            <UserCheck className="w-8 h-8 text-amber-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-800 text-sm">{t.dashboard.completeProfile}</p>
              <Progress value={profileProgress} className="h-1.5 mt-1.5 bg-amber-200" />
              <p className="text-xs text-amber-600 mt-1">
                {t.dashboard.percentComplete.replace('{percent}', String(profileProgress))}
              </p>
            </div>
            <Link href="/dashboard/profile">
              <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100 shrink-0">
                {t.dashboard.fill}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" /> {t.dashboard.quickActions}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <QuickAction icon={<FileText className="w-5 h-5 text-blue-600" />} label={t.dashboard.newDocument} href="/dashboard/documents" color="hover:border-blue-200" />
            <QuickAction icon={<MessageSquare className="w-5 h-5 text-purple-600" />} label={t.dashboard.sendRequest} href="/dashboard/requests" color="hover:border-purple-200" />
            <QuickAction icon={<Clock className="w-5 h-5 text-orange-600" />} label={t.dashboard.addDeadline} href="/dashboard/compliance/new" color="hover:border-orange-200" />
            <QuickAction icon={<Database className="w-5 h-5 text-green-600" />} label={t.dashboard.erpSystem} href="/dashboard/erp" color="hover:border-green-200" />
            <QuickAction icon={<ShieldCheck className="w-5 h-5 text-red-600" />} label={t.dashboard.antiInspection} href="/dashboard/inspection" color="hover:border-red-200" />
            <QuickAction icon={<Bot className="w-5 h-5 text-cyan-600" />} label={t.dashboard.aiAdvice} href="/ai" color="hover:border-cyan-200" />
          </div>
        </CardContent>
      </Card>

      {/* News + map quick-link */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NewsWidget />
        </div>
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-5">
              <Globe className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-bold text-green-800">{t.dashboard.clinicOnMap}</h3>
              <p className="text-sm text-green-600 mt-1 mb-3">{t.dashboard.markLocationHint}</p>
              <Link href="/dashboard/profile">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white w-full">
                  {t.dashboard.markLocation}
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-500 shrink-0" />
              <div>
                <p className="font-semibold text-sm">{t.dashboard.notificationsLabel}</p>
                <p className="text-xs text-muted-foreground">{t.dashboard.viewNewMessages}</p>
              </div>
              <Link href="/dashboard/notifications" className="ml-auto">
                <Button size="sm" variant="outline"><ArrowRight className="w-4 h-4" /></Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── USER (DOCTOR/PATIENT) DASHBOARD ─────────────────────────────────────────

function UserDashboard() {
  const { user, userProfile, userRole } = useAuth();
  const { t, lang } = useLanguage();
  const [myDocs, setMyDocs] = useState<number | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<number | null>(null);

  const profileFields = userProfile ? Object.values(userProfile).filter(Boolean).length : 0;
  const profileProgress = Math.min(100, Math.round((profileFields / 10) * 100));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const displayName = (userProfile as any)?.fullName ?? userProfile?.displayName ?? t.nav.profile;
  const isDoctor = userRole === 'doctor';

  useEffect(() => {
    if (!user) return;
    getDocumentsByOwner(user.uid).then((d) => setMyDocs(d.length)).catch(() => setMyDocs(0));
    getMessagesByUser(user.uid)
      .then((messages) => setUnreadMessages(messages.filter((message) => !message.read).length))
      .catch(() => setUnreadMessages(0));
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-6">
        <p className="text-blue-100 text-sm">
          {new Date().toLocaleDateString(DATE_LOCALE[lang], { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="text-2xl font-bold mt-1">
          {t.dashboard.welcomeUser}, {displayName}!
        </h1>
        <p className="text-blue-100 text-sm mt-1">
          {isDoctor ? t.dashboard.doctorWelcome : t.dashboard.patientWelcome}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label={t.documents.myTitle} value={myDocs} href="/dashboard/documents"
          icon={<FileText className="h-6 w-6 text-blue-600" />} color="border-l-blue-500 bg-blue-50/30" />
        <StatCard label={t.nav.messages} value={unreadMessages} href="/dashboard/messages"
          icon={<MessageSquare className="h-6 w-6 text-purple-600" />} color="border-l-purple-500 bg-purple-50/30" />
        <Card className="border-l-4 border-l-green-500 bg-green-50/30 col-span-2 lg:col-span-1">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t.dashboard.profileCompletion}</p>
            <div className="mt-2 space-y-1">
              <Progress value={profileProgress} className="h-2" />
              <p className="text-sm font-semibold">{profileProgress}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" /> {t.dashboard.quickActions}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            <QuickAction icon={<Bot className="w-5 h-5 text-cyan-600" />} label={t.dashboard.aiAdvisor} href="/ai" color="hover:border-cyan-200" />
            <QuickAction icon={<FileText className="w-5 h-5 text-blue-600" />} label={t.dashboard.myDocumentsShort} href="/dashboard/documents" color="hover:border-blue-200" />
            <QuickAction icon={<MessageSquare className="w-5 h-5 text-purple-600" />} label={t.nav.messages} href="/dashboard/messages" color="hover:border-purple-200" />
            <QuickAction icon={<ArrowRight className="w-5 h-5 text-orange-600" />} label={t.nav.referrals} href="/dashboard/referrals" color="hover:border-orange-200" />
            <QuickAction icon={<TrendingUp className="w-5 h-5 text-green-600" />} label={t.dashboard.forum} href="/dashboard/forum" color="hover:border-green-200" />
          </div>
        </CardContent>
      </Card>

      {/* News + tips */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NewsWidget />
        </div>
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200">
            <CardContent className="p-5">
              <Bot className="w-8 h-8 text-cyan-600 mb-3" />
              <h3 className="font-bold text-cyan-800">{t.dashboard.aiAdvisor}</h3>
              <p className="text-sm text-cyan-600 mt-1 mb-3">
                {isDoctor ? t.dashboard.doctorAiHint : t.dashboard.patientAiHint}
              </p>
              <Link href="/ai">
                <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white w-full gap-1.5">
                  <Bot className="w-4 h-4" /> {t.dashboard.startQuestion}
                </Button>
              </Link>
            </CardContent>
          </Card>
          {profileProgress < 80 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <p className="font-semibold text-amber-800 text-sm mb-2">{t.dashboard.completeProfile}</p>
                <Progress value={profileProgress} className="h-1.5 bg-amber-200" />
                <p className="text-xs text-amber-600 mt-1.5">
                  {t.dashboard.percentDone.replace('{percent}', String(profileProgress))}
                </p>
                <Link href="/dashboard/profile">
                  <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 mt-3 w-full">
                    {t.dashboard.editProfile}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

function PatientDashboard() {
  const { user, userProfile } = useAuth();
  const { t, lang } = useLanguage();
  const [stats, setStats] = useState<{
    appointments: number;
    vaccinations: number;
    unreadMessages: number;
    surveys: number;
  } | null>(null);

  const profileFields = userProfile ? Object.values(userProfile).filter(Boolean).length : 0;
  const profileProgress = Math.min(100, Math.round((profileFields / 10) * 100));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const displayName = (userProfile as any)?.fullName ?? userProfile?.displayName ?? t.nav.profile;

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getAppointmentsByPatient(user.uid),
      getVaccinationsByPatient(user.uid),
      getMessagesByUser(user.uid),
      getSurveysByPatient(user.uid),
    ]).then(([appointments, vaccinations, messages, surveys]) => {
      setStats({
        appointments: appointments.length,
        vaccinations: vaccinations.length,
        unreadMessages: messages.filter((message) => !message.read).length,
        surveys: surveys.length,
      });
    }).catch(() => setStats({ appointments: 0, vaccinations: 0, unreadMessages: 0, surveys: 0 }));
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white p-6">
        <p className="text-emerald-100 text-sm">
          {new Date().toLocaleDateString(DATE_LOCALE[lang], { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="text-2xl font-bold mt-1">
          {t.dashboard.welcomeUser}, {displayName}!
        </h1>
        <p className="text-emerald-100 text-sm mt-1">
          {t.dashboard.patientWelcome}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t.nav.appointments} value={stats?.appointments ?? null} href="/dashboard/appointments"
          icon={<Calendar className="h-6 w-6 text-blue-600" />} color="border-l-blue-500 bg-blue-50/30" />
        <StatCard label={t.nav.vaccinations} value={stats?.vaccinations ?? null} href="/dashboard/vaccinations"
          icon={<Syringe className="h-6 w-6 text-emerald-600" />} color="border-l-emerald-500 bg-emerald-50/30" />
        <StatCard label={t.nav.messages} value={stats?.unreadMessages ?? null} href="/dashboard/messages"
          icon={<Bell className="h-6 w-6 text-orange-600" />} color="border-l-orange-500 bg-orange-50/30" />
        <StatCard label={t.nav.surveys} value={stats?.surveys ?? null} href="/dashboard/surveys"
          icon={<Star className="h-6 w-6 text-purple-600" />} color="border-l-purple-500 bg-purple-50/30" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" /> {t.dashboard.quickActions}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <QuickAction icon={<Calendar className="w-5 h-5 text-blue-600" />} label={t.nav.appointments} href="/dashboard/appointments" color="hover:border-blue-200" />
            <QuickAction icon={<Syringe className="w-5 h-5 text-emerald-600" />} label={t.nav.vaccinations} href="/dashboard/vaccinations" color="hover:border-emerald-200" />
            <QuickAction icon={<QrCode className="w-5 h-5 text-slate-700" />} label={t.nav.qrCard} href="/dashboard/qr-card" color="hover:border-slate-200" />
            <QuickAction icon={<MessageSquare className="w-5 h-5 text-purple-600" />} label={t.nav.messages} href="/dashboard/messages" color="hover:border-purple-200" />
            <QuickAction icon={<Star className="w-5 h-5 text-amber-600" />} label={t.nav.surveys} href="/dashboard/surveys" color="hover:border-amber-200" />
            <QuickAction icon={<Bot className="w-5 h-5 text-cyan-600" />} label={t.dashboard.aiAdvisor} href="/ai" color="hover:border-cyan-200" />
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NewsWidget />
        </div>
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-5">
            <UserCheck className="w-8 h-8 text-emerald-700 mb-3" />
            <h3 className="font-bold text-emerald-900">{t.dashboard.profileCompletion}</h3>
            <Progress value={profileProgress} className="h-2 mt-3 bg-emerald-100" />
            <p className="text-sm text-emerald-700 mt-2">
              {t.dashboard.percentDone.replace('{percent}', String(profileProgress))}
            </p>
            <Link href="/dashboard/profile">
              <Button size="sm" className="mt-4 w-full bg-emerald-700 hover:bg-emerald-800">
                {t.dashboard.editProfile}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (userRole === 'admin') return <AdminDashboard />;
  if (userRole === 'clinic') return <ClinicDashboard />;
  if (userRole === 'doctor') return <UserDashboard />;
  return <PatientDashboard />;
}
