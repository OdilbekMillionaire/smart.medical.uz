'use client';

import { Clock, ClipboardCheck, FileText, Scale, ShieldCheck } from 'lucide-react';
import { WorkspaceHub } from '@/components/dashboard/WorkspaceHub';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getWorkspaceCopy } from '@/lib/workspace-hub-copy';

export default function ComplianceCenterHubPage() {
  const { t, lang } = useLanguage();
  const { userRole } = useAuth();
  const workspaceCopy = getWorkspaceCopy(lang);
  const copy = workspaceCopy.hubs.complianceCenter;
  const quickActions =
    userRole === 'doctor'
      ? [
          { title: t.nav.licensing, href: '/dashboard/litsenziya', icon: <Scale className="h-4 w-4" /> },
          { title: t.nav.guidelines, href: '/dashboard/guidelines', icon: <FileText className="h-4 w-4" /> },
        ]
      : [
          { title: t.nav.compliance, href: '/dashboard/compliance', icon: <Clock className="h-4 w-4" /> },
          { title: t.nav.inspection, href: '/dashboard/inspection', icon: <ClipboardCheck className="h-4 w-4" /> },
          { title: t.nav.licensing, href: '/dashboard/litsenziya', icon: <Scale className="h-4 w-4" /> },
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
        { title: t.nav.documentCenter, href: '/dashboard/document-center', icon: <FileText className="h-4 w-4" />, description: t.nav.documents },
        { title: t.nav.clinicOperations, href: '/dashboard/clinic-operations', icon: <ShieldCheck className="h-4 w-4" />, description: t.nav.erp },
        { title: t.nav.cases, href: '/dashboard/cases', icon: <ClipboardCheck className="h-4 w-4" />, description: t.nav.requests },
      ]}
      items={[
        {
          title: t.nav.compliance,
          description: lang === 'ru' ? 'Сроки документов, сертификатов, договоров и протоколов.' : 'Document, certificate, contract, and protocol deadlines.',
          href: '/dashboard/compliance',
          icon: <Clock className="h-5 w-5" />,
        },
        {
          title: t.nav.inspection,
          description: lang === 'ru' ? 'Подготовка к проверкам, чек-листы и рекомендации.' : 'Inspection readiness, checklists, and recommendations.',
          href: '/dashboard/inspection',
          icon: <ClipboardCheck className="h-5 w-5" />,
        },
        {
          title: t.nav.licensing,
          description: lang === 'ru' ? 'Лицензирование и вопросы медицинско-правовой готовности.' : 'Licensing and medical-legal readiness.',
          href: '/dashboard/litsenziya',
          icon: <Scale className="h-5 w-5" />,
        },
        {
          title: t.nav.audit,
          description: lang === 'ru' ? 'Журнал действий и контроль изменений для надзора.' : 'Action log and change control for oversight.',
          href: '/dashboard/audit',
          icon: <ShieldCheck className="h-5 w-5" />,
        },
      ]}
    />
  );
}
