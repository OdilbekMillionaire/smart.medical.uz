'use client';

import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Message, BaseUser } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Mail, Send, Inbox, PenLine, User, Circle } from 'lucide-react';

const DATE_LOCALE: Record<string, string> = {
  uz: 'uz-UZ',
  en: 'en-US',
  ru: 'ru-RU',
  uz_cyrillic: 'uz-UZ',
  kk: 'kk-KZ',
};

type Tab = 'inbox' | 'sent' | 'compose';

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

export default function MessagesPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<Tab>('inbox');
  const [inbox, setInbox] = useState<Message[]>([]);
  const [sent, setSent] = useState<Message[]>([]);
  const [users, setUsers] = useState<BaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);
  const [form, setForm] = useState({ toUserId: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const locale = DATE_LOCALE[lang] || 'uz-UZ';

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const data = await requestJson<{ inbox: Message[]; sent: Message[]; users: BaseUser[] }>('/api/messages', token);
      setInbox(data.inbox);
      setSent(data.sent);
      setUsers(data.users);
    } catch { toast.error(t.messages.loadError); }
    finally { setLoading(false); }
  }, [t.messages.loadError, user]);

  useEffect(() => { load(); }, [load]);

  async function handleSelect(msg: Message) {
    setSelected(msg);
    if (!msg.read && msg.toUserId === user?.uid) {
      const token = await user.getIdToken();
      await requestJson<{ success: boolean }>('/api/messages', token, {
        method: 'PATCH',
        body: JSON.stringify({ id: msg.id }),
      });
      setInbox((prev) => prev.map((m) => m.id === msg.id ? { ...m, read: true } : m));
    }
  }

  async function handleSend() {
    if (!user || !form.toUserId || !form.subject || !form.body) { toast.error(t.messages.fillAll); return; }
    setSending(true);
    try {
      const token = await user.getIdToken();
      await requestJson<Message>('/api/messages', token, {
        method: 'POST',
        body: JSON.stringify({
        toUserId: form.toUserId,
        subject: form.subject,
        body: form.body,
      }),
      });
      toast.success(t.messages.sendSuccess);
      setForm({ toUserId: '', subject: '', body: '' });
      setTab('sent');
      await load();
    } catch { toast.error(t.messages.sendError); }
    finally { setSending(false); }
  }

  const unreadCount = inbox.filter((m) => !m.read).length;
  const activeList = tab === 'inbox' ? inbox : sent;

  const tabs: [Tab, string, React.ReactNode][] = [
    ['inbox', t.messages.inbox, <Inbox key="i" className="w-4 h-4" />],
    ['sent', t.messages.sent, <Send key="s" className="w-4 h-4" />],
    ['compose', t.messages.compose, <PenLine key="c" className="w-4 h-4" />],
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Mail className="w-6 h-6 text-blue-600" />{t.messages.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.messages.subtitle}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-0">
        {tabs.map(([key, label, icon]) => (
          <button key={key} onClick={() => { setTab(key); setSelected(null); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {icon}{label}
            {key === 'inbox' && unreadCount > 0 && <span className="ml-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{unreadCount}</span>}
          </button>
        ))}
      </div>

      {/* Compose */}
      {tab === 'compose' && (
        <Card className="border-blue-200 bg-blue-50/10">
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">{t.messages.to} *</label>
              <select value={form.toUserId} onChange={(e) => setForm({ ...form, toUserId: e.target.value })} className="w-full h-10 rounded-md border border-input px-3 text-sm bg-background">
                <option value="">{t.messages.selectUser}</option>
                {users.map((u) => <option key={u.uid} value={u.uid}>{u.displayName || u.email} ({u.role})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">{t.messages.subject} *</label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder={t.messages.subjectPlaceholder} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">{t.messages.message} *</label>
              <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={5} placeholder={t.messages.messagePlaceholder} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setForm({ toUserId: '', subject: '', body: '' })}>{t.messages.clear}</Button>
              <Button size="sm" className="gap-1.5" onClick={handleSend} disabled={sending}>
                <Send className="w-3.5 h-3.5" />{sending ? t.messages.sending : t.messages.send}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List + Detail */}
      {tab !== 'compose' && (
        <div className="grid lg:grid-cols-5 gap-4">
          {/* Message list */}
          <div className="lg:col-span-2 space-y-2">
            {loading && [1,2,3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            {!loading && activeList.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed"><Mail className="w-10 h-10 mx-auto mb-2 text-slate-200" /><p className="text-slate-400 text-sm">{tab === 'inbox' ? t.messages.inboxEmpty : t.messages.sentEmpty}</p></div>
            )}
            {!loading && activeList.map((msg) => (
              <div key={msg.id} onClick={() => handleSelect(msg)}
                className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${selected?.id === msg.id ? 'border-blue-300 bg-blue-50' : 'bg-white border-slate-200 hover:border-blue-200'} ${!msg.read && tab === 'inbox' ? 'border-l-4 border-l-blue-500' : ''}`}>
                <div className="flex items-start gap-2">
                  {!msg.read && tab === 'inbox' && <Circle className="w-2 h-2 fill-blue-500 text-blue-500 mt-1.5 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${!msg.read && tab === 'inbox' ? 'font-semibold text-slate-800' : 'font-medium text-slate-700'}`}>
                        {tab === 'inbox' ? msg.fromName : msg.toName}
                      </p>
                      <span className="text-xs text-slate-400 shrink-0">{new Date(msg.createdAt).toLocaleDateString(locale)}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{msg.subject}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-3">
            {selected ? (
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{selected.subject}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                        <User className="w-3.5 h-3.5" />
                        {tab === 'inbox' ? <span>{t.messages.sender}: <strong>{selected.fromName}</strong></span> : <span>{t.messages.recipient}: <strong>{selected.toName}</strong></span>}
                        <span className="text-slate-300">&middot;</span>
                        <span>{new Date(selected.createdAt).toLocaleString(locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    {tab === 'inbox' && (
                      <Button size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={() => { setTab('compose'); setForm({ toUserId: selected.fromUserId, subject: `Re: ${selected.subject}`, body: '' }); }}>
                        <Send className="w-3.5 h-3.5" /> {t.messages.reply}
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{selected.body}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
                <div className="text-center">
                  <Mail className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                  <p className="text-sm text-slate-400">{t.messages.selectToRead}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
