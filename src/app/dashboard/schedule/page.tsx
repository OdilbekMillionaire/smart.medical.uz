'use client';

import { Calendar, Clock4, Users } from 'lucide-react';
import { WorkspaceHub } from '@/components/dashboard/WorkspaceHub';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getWorkspaceCopy } from '@/lib/workspace-hub-copy';

export default function ScheduleHubPage() {
  const { t, lang } = useLanguage();
  const { userRole } = useAuth();
  const workspaceCopy = getWorkspaceCopy(lang);
  const copy = workspaceCopy.hubs.schedule;
  const quickActions =
    userRole === 'patient'
      ? [
          { title: t.nav.appointments, href: '/dashboard/appointments', icon: <Users className="h-4 w-4" /> },
          { title: t.nav.telemedicine, href: '/dashboard/telemedicine', icon: <Calendar className="h-4 w-4" /> },
        ]
      : [
          { title: t.nav.appointments, href: '/dashboard/appointments', icon: <Users className="h-4 w-4" /> },
          { title: t.nav.calendar, href: '/dashboard/calendar', icon: <Calendar className="h-4 w-4" /> },
          { title: t.nav.shifts, href: '/dashboard/shifts', icon: <Clock4 className="h-4 w-4" /> },
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
        { title: t.nav.clinicOperations, href: '/dashboard/clinic-operations', icon: <Clock4 className="h-4 w-4" />, description: t.nav.staff },
        { title: t.nav.cases, href: '/dashboard/cases', icon: <Users className="h-4 w-4" />, description: t.nav.requests },
        { title: t.nav.complianceCenter, href: '/dashboard/compliance-center', icon: <Calendar className="h-4 w-4" />, description: t.nav.compliance },
      ]}
      items={[
        {
          title: t.nav.appointments,
          description: lang === 'ru' ? 'Приемы пациентов, статусы и рабочая загрузка.' : 'Patient appointments, statuses, and workload.',
          href: '/dashboard/appointments',
          icon: <Users className="h-5 w-5" />,
        },
        {
          title: t.nav.calendar,
          description: lang === 'ru' ? 'Календарный вид событий, приемов и операционных задач.' : 'Calendar view for events, visits, and operating tasks.',
          href: '/dashboard/calendar',
          icon: <Calendar className="h-5 w-5" />,
        },
        {
          title: t.nav.shifts,
          description: lang === 'ru' ? 'Планирование смен, доступности и покрытия клиники.' : 'Plan shifts, availability, and clinic coverage.',
          href: '/dashboard/shifts',
          icon: <Clock4 className="h-5 w-5" />,
        },
      ]}
    />
  );
}
