'use client';

import { Database, DollarSign, FileBarChart, Package, ShieldCheck, UserCog, Wrench } from 'lucide-react';
import { WorkspaceHub } from '@/components/dashboard/WorkspaceHub';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getWorkspaceCopy } from '@/lib/workspace-hub-copy';

export default function ClinicOperationsHubPage() {
  const { t, lang } = useLanguage();
  const { userRole } = useAuth();
  const workspaceCopy = getWorkspaceCopy(lang);
  const copy = workspaceCopy.hubs.clinicOperations;
  const quickActions =
    userRole === 'admin'
      ? [
          { title: t.nav.clinics, href: '/dashboard/clinics', icon: <Database className="h-4 w-4" /> },
          { title: t.nav.statistics, href: '/dashboard/statistics', icon: <FileBarChart className="h-4 w-4" /> },
          { title: t.nav.reports, href: '/dashboard/reports', icon: <FileBarChart className="h-4 w-4" /> },
        ]
      : [
          { title: t.nav.erp, href: '/dashboard/erp', icon: <Database className="h-4 w-4" /> },
          { title: t.nav.staff, href: '/dashboard/staff', icon: <UserCog className="h-4 w-4" /> },
          { title: t.nav.inventory, href: '/dashboard/inventory', icon: <Package className="h-4 w-4" /> },
        ];

  return (
    <WorkspaceHub
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.description}
      actionLabel={t.common.view}
      highlights={copy.highlights}
      metrics={copy.metrics}
      workflow={copy.workflow}
      workflowTitle={copy.workflowTitle}
      quickActions={quickActions}
      quickActionsTitle={copy.quickTitle}
      relatedTitle={copy.relatedTitle}
      overviewLabel={workspaceCopy.common.overview}
      workflowLabel={workspaceCopy.common.workflow}
      connectedLabel={workspaceCopy.common.connected}
      startHereLabel={workspaceCopy.common.startHere}
      related={[
        { title: t.nav.scheduleHub, href: '/dashboard/schedule', icon: <Database className="h-4 w-4" />, description: t.nav.appointments },
        { title: t.nav.complianceCenter, href: '/dashboard/compliance-center', icon: <ShieldCheck className="h-4 w-4" />, description: t.nav.compliance },
        { title: t.nav.documentCenter, href: '/dashboard/document-center', icon: <FileBarChart className="h-4 w-4" />, description: t.nav.documents },
      ]}
      items={[
        {
          title: t.nav.erp,
          description: lang === 'ru' ? 'Визиты пациентов, диагнозы, процедуры, назначения и журналы.' : 'Patient visits, diagnoses, procedures, prescriptions, and logs.',
          href: '/dashboard/erp',
          icon: <Database className="h-5 w-5" />,
        },
        {
          title: t.nav.staff,
          description: lang === 'ru' ? 'Сотрудники клиники, роли, контакты и рабочая структура.' : 'Clinic staff, roles, contacts, and operating structure.',
          href: '/dashboard/staff',
          icon: <UserCog className="h-5 w-5" />,
        },
        {
          title: t.nav.inventory,
          description: lang === 'ru' ? 'Склад, расходники, остатки и предупреждения.' : 'Inventory, consumables, stock levels, and warnings.',
          href: '/dashboard/inventory',
          icon: <Package className="h-5 w-5" />,
        },
        {
          title: t.nav.equipment,
          description: lang === 'ru' ? 'Оборудование, обслуживание и эксплуатационный статус.' : 'Equipment, maintenance, and operating status.',
          href: '/dashboard/equipment',
          icon: <Wrench className="h-5 w-5" />,
        },
        {
          title: t.nav.finance,
          description: lang === 'ru' ? 'Финансовые показатели и управленческий обзор.' : 'Financial metrics and management overview.',
          href: '/dashboard/finance',
          icon: <DollarSign className="h-5 w-5" />,
        },
      ]}
    />
  );
}
