'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getRequestsByUser, getAllRequests } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, MessageSquare, Clock, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Request } from '@/types';

export default function RequestsPage() {
  const { user, userRole } = useAuth();
  const { t, lang } = useLanguage();
  const DATE_LOCALE: Record<string, string> = { uz: 'uz-UZ', uz_cyrillic: 'uz-UZ', ru: 'ru-RU', en: 'en-US', kk: 'kk-KZ' };
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Request['status'] | 'all'>('all');

  const STATUS_MAP: Record<Request['status'], { label: string; color: string }> = {
    received: { label: t.requests.received, color: 'bg-blue-100 text-blue-700' },
    in_review: { label: t.requests.inReview, color: 'bg-orange-100 text-orange-700' },
    replied: { label: t.requests.replied, color: 'bg-green-100 text-green-700' },
    closed: { label: t.requests.closed, color: 'bg-slate-100 text-slate-600' },
  };

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const data = userRole === 'admin'
          ? await getAllRequests()
          : await getRequestsByUser(user!.uid);
        setRequests(data);
      } catch {
        toast.error(t.common.error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, userRole]);

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.requests.title}</h1>
          <p className="text-sm text-muted-foreground">
            {userRole === 'admin' ? t.requests.adminTitle : t.requests.myTitle}
          </p>
        </div>
        <Link href="/dashboard/requests/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t.requests.new}
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'received', 'in_review', 'replied', 'closed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f === 'all' ? t.common.all : STATUS_MAP[f].label}
            <span className="ml-1.5 text-xs opacity-70">
              {f === 'all' ? requests.length : requests.filter((r) => r.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-14 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{t.requests.empty}</p>
          <p className="text-sm mt-1">{t.requests.emptyDesc}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const s = STATUS_MAP[req.status];
            return (
              <Card key={req.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{req.subject}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.color}`}>
                          {s.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{req.body}</p>
                      {req.aiClassification && (
                        <p className="text-xs text-blue-600 mt-1">AI: {req.aiClassification}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(req.createdAt).toLocaleDateString(DATE_LOCALE[lang] || 'uz-UZ')}
                      </div>
                    </div>
                    <Link href={`/dashboard/requests/${req.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        {t.common.view}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
