'use client';

import { BookOpen, Briefcase, FileText, GraduationCap, Pill, UsersRound } from 'lucide-react';
import { WorkspaceHub } from '@/components/dashboard/WorkspaceHub';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getWorkspaceCopy } from '@/lib/workspace-hub-copy';

export default function KnowledgeBaseHubPage() {
  const { t, lang } = useLanguage();
  const { userRole } = useAuth();
  const workspaceCopy = getWorkspaceCopy(lang);
  const copy = workspaceCopy.hubs.knowledgeBase;
  const quickActions =
    userRole === 'clinic'
      ? [
          { title: t.nav.guidelines, href: '/dashboard/guidelines', icon: <BookOpen className="h-4 w-4" /> },
          { title: t.nav.education, href: '/dashboard/education', icon: <GraduationCap className="h-4 w-4" /> },
          { title: t.nav.jobs, href: '/dashboard/jobs', icon: <Briefcase className="h-4 w-4" /> },
        ]
      : [
          { title: t.nav.education, href: '/dashboard/education', icon: <GraduationCap className="h-4 w-4" /> },
          { title: t.nav.guidelines, href: '/dashboard/guidelines', icon: <BookOpen className="h-4 w-4" /> },
          { title: t.nav.forum, href: '/dashboard/forum', icon: <UsersRound className="h-4 w-4" /> },
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
        { title: t.nav.cases, href: '/dashboard/cases', icon: <UsersRound className="h-4 w-4" />, description: t.nav.requests },
        { title: t.nav.scheduleHub, href: '/dashboard/schedule', icon: <BookOpen className="h-4 w-4" />, description: t.nav.appointments },
      ]}
      items={[
        {
          title: t.nav.education,
          description: lang === 'ru' ? 'Обучение, материалы и профессиональное развитие.' : 'Learning, materials, and professional development.',
          href: '/dashboard/education',
          icon: <GraduationCap className="h-5 w-5" />,
        },
        {
          title: t.nav.guidelines,
          description: lang === 'ru' ? 'Клинические руководства и справочные материалы.' : 'Clinical guidelines and reference materials.',
          href: '/dashboard/guidelines',
          icon: <BookOpen className="h-5 w-5" />,
        },
        {
          title: t.nav.formulary,
          description: lang === 'ru' ? 'Формуляр и лекарственные справочники.' : 'Formulary and medication references.',
          href: '/dashboard/formulary',
          icon: <Pill className="h-5 w-5" />,
        },
        {
          title: t.nav.news,
          description: lang === 'ru' ? 'Медицинские новости и обновления платформы.' : 'Medical news and platform updates.',
          href: '/dashboard/news',
          icon: <FileText className="h-5 w-5" />,
        },
        {
          title: t.nav.forum,
          description: lang === 'ru' ? 'Профессиональное обсуждение и обмен опытом.' : 'Professional discussion and knowledge sharing.',
          href: '/dashboard/forum',
          icon: <UsersRound className="h-5 w-5" />,
        },
        {
          title: t.nav.jobs,
          description: lang === 'ru' ? 'Вакансии и карьерные возможности в медицине.' : 'Healthcare jobs and career opportunities.',
          href: '/dashboard/jobs',
          icon: <Briefcase className="h-5 w-5" />,
        },
      ]}
    />
  );
}
