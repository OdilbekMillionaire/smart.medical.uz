'use client';

import { FileBarChart, FilePlus2, FileSpreadsheet, FileText, MessageSquare, ShieldCheck } from 'lucide-react';
import { WorkspaceHub } from '@/components/dashboard/WorkspaceHub';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getWorkspaceCopy } from '@/lib/workspace-hub-copy';

export default function DocumentCenterHubPage() {
  const { t, lang } = useLanguage();
  const { userRole } = useAuth();
  const workspaceCopy = getWorkspaceCopy(lang);
  const copy = workspaceCopy.hubs.documentCenter;
  const quickActions =
    userRole === 'patient'
      ? [
          { title: t.nav.documents, href: '/dashboard/documents', icon: <FileText className="h-4 w-4" /> },
          { title: t.nav.qrCard, href: '/dashboard/qr-card', icon: <FileText className="h-4 w-4" /> },
        ]
      : [
          { title: t.documents.createTitle, href: '/dashboard/documents/new', icon: <FilePlus2 className="h-4 w-4" /> },
          { title: t.nav.documents, href: '/dashboard/documents', icon: <FileText className="h-4 w-4" /> },
          { title: t.nav.reports, href: '/dashboard/reports', icon: <FileBarChart className="h-4 w-4" /> },
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
        { title: t.nav.complianceCenter, href: '/dashboard/compliance-center', icon: <ShieldCheck className="h-4 w-4" />, description: t.nav.compliance },
        { title: t.nav.cases, href: '/dashboard/cases', icon: <MessageSquare className="h-4 w-4" />, description: t.nav.requests },
        { title: t.nav.clinicOperations, href: '/dashboard/clinic-operations', icon: <FileBarChart className="h-4 w-4" />, description: t.nav.erp },
      ]}
      items={[
        {
          title: t.nav.documents,
          description: lang === 'ru' ? 'Список документов, статусы и согласование.' : 'Document list, statuses, and review flow.',
          href: '/dashboard/documents',
          icon: <FileText className="h-5 w-5" />,
        },
        {
          title: t.documents.createTitle,
          description: lang === 'ru' ? 'Создание документа из шаблонов с AI-помощью.' : 'Create documents from templates with AI support.',
          href: '/dashboard/documents/new',
          icon: <FilePlus2 className="h-5 w-5" />,
        },
        {
          title: t.nav.reports,
          description: lang === 'ru' ? 'Отчеты по документам и операционной активности.' : 'Reports for documents and operating activity.',
          href: '/dashboard/reports',
          icon: <FileBarChart className="h-5 w-5" />,
        },
        {
          title: t.nav.exports,
          description: lang === 'ru' ? 'Экспорт данных и рабочих результатов.' : 'Export data and workflow outputs.',
          href: '/dashboard/exports',
          icon: <FileSpreadsheet className="h-5 w-5" />,
        },
      ]}
    />
  );
}
