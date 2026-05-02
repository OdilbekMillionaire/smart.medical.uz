'use client';

import { AlertCircle, ArrowRightLeft, Calendar, Mail, MessageSquare } from 'lucide-react';
import { WorkspaceHub } from '@/components/dashboard/WorkspaceHub';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getWorkspaceCopy } from '@/lib/workspace-hub-copy';

export default function CasesHubPage() {
  const { t, lang } = useLanguage();
  const { userRole } = useAuth();
  const workspaceCopy = getWorkspaceCopy(lang);
  const copy = workspaceCopy.hubs.cases;
  const quickActions =
    userRole === 'patient'
      ? [
          { title: t.nav.messages, href: '/dashboard/messages', icon: <Mail className="h-4 w-4" /> },
          { title: t.nav.appointments, href: '/dashboard/appointments', icon: <Calendar className="h-4 w-4" /> },
          { title: t.nav.surveys, href: '/dashboard/surveys', icon: <MessageSquare className="h-4 w-4" /> },
        ]
      : [
          { title: t.nav.requests, href: '/dashboard/requests', icon: <MessageSquare className="h-4 w-4" /> },
          { title: t.nav.complaints, href: '/dashboard/complaints', icon: <AlertCircle className="h-4 w-4" /> },
          { title: t.nav.referrals, href: '/dashboard/referrals', icon: <ArrowRightLeft className="h-4 w-4" /> },
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
        { title: t.nav.scheduleHub, href: '/dashboard/schedule', icon: <Calendar className="h-4 w-4" />, description: t.nav.appointments },
        { title: t.nav.documentCenter, href: '/dashboard/document-center', icon: <MessageSquare className="h-4 w-4" />, description: t.nav.documents },
        { title: t.nav.knowledgeBase, href: '/dashboard/knowledge-base', icon: <ArrowRightLeft className="h-4 w-4" />, description: t.nav.forum },
      ]}
      items={[
        {
          title: t.nav.requests,
          description: lang === 'ru' ? 'Входящие обращения, AI-классификация и ответы.' : 'Incoming requests, AI classification, and replies.',
          href: '/dashboard/requests',
          icon: <MessageSquare className="h-5 w-5" />,
        },
        {
          title: t.nav.complaints,
          description: lang === 'ru' ? 'Жалобы пациентов, статусы и ответственные.' : 'Patient complaints, statuses, and owners.',
          href: '/dashboard/complaints',
          icon: <AlertCircle className="h-5 w-5" />,
        },
        {
          title: t.nav.referrals,
          description: lang === 'ru' ? 'Направления между врачами, клиниками и пациентами.' : 'Referrals between doctors, clinics, and patients.',
          href: '/dashboard/referrals',
          icon: <ArrowRightLeft className="h-5 w-5" />,
        },
        {
          title: t.nav.messages,
          description: lang === 'ru' ? 'Сообщения и рабочая переписка по кейсам.' : 'Messages and case communication.',
          href: '/dashboard/messages',
          icon: <Mail className="h-5 w-5" />,
        },
      ]}
    />
  );
}
