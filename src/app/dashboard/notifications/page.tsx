'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToNotifications } from '@/lib/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, CheckCheck, FileText, MessageSquare, AlertTriangle, Briefcase, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AppNotification } from '@/types';

async function requestJson<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

const TYPE_ICONS: Record<AppNotification['type'], { icon: React.ReactNode; color: string }> = {
  document_submitted: { icon: <FileText className="w-4 h-4" />, color: 'bg-amber-100 text-amber-700' },
  document_approved: { icon: <FileText className="w-4 h-4" />, color: 'bg-green-100 text-green-700' },
  document_rejected: { icon: <FileText className="w-4 h-4" />, color: 'bg-red-100 text-red-700' },
  new_request: { icon: <MessageSquare className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700' },
  request_replied: { icon: <MessageSquare className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700' },
  compliance_due: { icon: <AlertTriangle className="w-4 h-4" />, color: 'bg-orange-100 text-orange-700' },
  job_application: { icon: <Briefcase className="w-4 h-4" />, color: 'bg-purple-100 text-purple-700' },
  forum_reply: { icon: <MessageSquare className="w-4 h-4" />, color: 'bg-slate-100 text-slate-700' },
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const DATE_LOCALE: Record<string, string> = { uz: 'uz-UZ', uz_cyrillic: 'uz-UZ', ru: 'ru-RU', en: 'en-US', kk: 'kk-KZ' };

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString(DATE_LOCALE[lang] || 'uz-UZ', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
  }
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToNotifications(user.uid, (data) => {
      setNotifications(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleMarkRead = async (id: string) => {
    if (!user) return;
    const token = await user.getIdToken();
    await requestJson<{ success: boolean }>('/api/notifications', token, {
      method: 'PATCH',
      body: JSON.stringify({ id }),
    });
    // onSnapshot will auto-update state
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    setMarkingAll(true);
    try {
      const token = await user.getIdToken();
      await requestJson<{ success: boolean }>('/api/notifications', token, {
        method: 'PATCH',
        body: JSON.stringify({ all: true }),
      });
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t.notifications.title}</h1>
          {unreadCount > 0 && (
            <Badge className="bg-blue-600 text-white">{unreadCount} {t.notifications.newCount}</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            {t.notifications.markAllRead}
          </Button>
        )}
      </div>

      {/* List */}
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="w-12 h-12 text-slate-200 mb-4" />
            <p className="font-medium text-slate-600">{t.notifications.empty}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t.notifications.emptyDesc}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const meta = TYPE_ICONS[n.type];
            return (
              <Card
                key={n.id}
                className={`transition-all ${!n.read ? 'border-blue-200 bg-blue-50/40' : 'bg-white'}`}
              >
                <CardContent className="p-4 flex items-start gap-4">
                  {/* Icon */}
                  <div className={`rounded-full p-2 shrink-0 ${meta.color}`}>
                    {meta.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                          {n.title}
                        </p>
                        <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-xs text-slate-400 mt-1">{formatDate(n.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!n.read && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                          >
                            {t.notifications.markRead}
                          </button>
                        )}
                        {n.link && (
                          <Link href={n.link}>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
