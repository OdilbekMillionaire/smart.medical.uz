'use client';

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Bot, User, Send, RotateCcw, Square,
  Stethoscope, Pill, FlaskConical, HeartPulse, ShieldCheck, FileText,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Message = {
  role: 'user' | 'assistant';
  content: string;
};

// ─── Static suggested questions ───────────────────────────────────────────────
const SUGGESTED = [
  { icon: <Stethoscope className="h-3.5 w-3.5" />, text: "SanQvaN talablari bo'yicha dezinfeksiya jadvali qanday bo'lishi kerak?" },
  { icon: <HeartPulse className="h-3.5 w-3.5" />, text: "Tibbiy klinika litsenziyasini yangilash uchun qanday hujjatlar kerak?" },
  { icon: <Pill className="h-3.5 w-3.5" />, text: "Shifokorning malaka oshirish sertifikati muddati o'tsa nima qilish kerak?" },
  { icon: <FlaskConical className="h-3.5 w-3.5" />, text: "Tekshiruv vaqtida inspektor qanday hujjatlarni so'raydi?" },
  { icon: <ShieldCheck className="h-3.5 w-3.5" />, text: "Sterilizatsiya protokollari mavjudligini qanday isbotlash mumkin?" },
  { icon: <FileText className="h-3.5 w-3.5" />, text: "Bemor tibbiy kartasini to'g'ri yuritish qoidalari qanday?" },
];

// ─── Welcome copy (Uzbek primary, instructions in English understood by AI) ───
const WELCOME_CONTENT =
  "Salom! Men AI for Medicine — tibbiy ma'lumot yordamchisiman.\n\nSimptomlar, dori vositalari, laboratoriya natijalari, davolash variantlari, SanQvaN me'yorlari, litsenziyalash va tekshiruv talablari bo'yicha yordam bera olaman.\n\nEslatma: men litsenziyalangan klinitsist emasman. Favqulodda vaziyatda 103 ni chaqiring.";

// ─── Simple markdown-like renderer ───────────────────────────────────────────
function MessageContent({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split('\n');
  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <p key={i} className="font-semibold text-sm mt-2">{line.slice(4)}</p>;
        if (line.startsWith('## ')) return <p key={i} className="font-bold text-sm mt-2">{line.slice(3)}</p>;
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-sm">{line.slice(2, -2)}</p>;
        if (line.startsWith('- ') || line.startsWith('• ')) return (
          <div key={i} className="flex gap-2 text-sm">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-current shrink-0 opacity-60" />
            <span>{line.slice(2)}</span>
          </div>
        );
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return <p key={i} className="text-sm">{line}</p>;
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AIForMedicineChat() {
  const { t } = useLanguage();

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: WELCOME_CONTENT },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(rawText: string) {
    const text = rawText.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const requestMessages: Message[] = [...messages, userMsg];

    setError(null);
    setLoading(true);
    setInput('');
    setMessages((prev) => [
      ...prev,
      userMsg,
      { role: 'assistant', content: '' },
    ]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: requestMessages }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') continue;
          try {
            const parsed = JSON.parse(payload) as { delta?: string };
            if (!parsed.delta) continue;
            full += parsed.delta;
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { role: 'assistant', content: full };
              return next;
            });
          } catch { /* ignore malformed chunks */ }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Xato yuz berdi.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function stopStreaming() {
    abortRef.current?.abort();
    setLoading(false);
  }

  function clearChat() {
    if (loading) stopStreaming();
    setMessages([{ role: 'assistant', content: WELCOME_CONTENT }]);
    setError(null);
    setInput('');
  }

  const showSuggested = messages.length <= 1;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-600 to-emerald-600 flex items-center justify-center shadow-sm">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{t.ai.title}</h1>
              <Badge variant="secondary" className="text-[10px] font-semibold tracking-wide uppercase">
                Claude AI
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{t.ai.subtitle}</p>
          </div>
        </div>
        {messages.length > 1 && (
          <Button variant="outline" size="sm" onClick={clearChat} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            {t.ai.newChat}
          </Button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto pr-1 mb-3 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={`${msg.role}-${i}`}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-br from-cyan-600 to-emerald-600 flex items-center justify-center shadow-sm mt-0.5">
                <Bot className="h-4 w-4 text-white" />
              </div>
            )}

            <div
              className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-slate-900 text-white rounded-tr-sm'
                  : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-tl-sm'
              }`}
            >
              {msg.role === 'assistant' && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mb-1.5">
                  AI for Medicine
                </p>
              )}
              {msg.content ? (
                <MessageContent content={msg.content} />
              ) : (
                /* Streaming cursor */
                <div className="flex items-center gap-1 py-1">
                  <span className="h-2 w-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:300ms]" />
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="h-8 w-8 shrink-0 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center mt-0.5">
                <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
            )}
          </div>
        ))}

        {/* Suggested questions — shown only on fresh chat */}
        {showSuggested && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            {SUGGESTED.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s.text)}
                className="flex items-start gap-2.5 text-left text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-cyan-300 dark:hover:border-cyan-600 transition-all duration-150 group shadow-sm"
              >
                <span className="text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                  {s.icon}
                </span>
                <span className="text-slate-600 dark:text-slate-300 leading-snug">{s.text}</span>
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error banner */}
      {error && (
        <Card className="mb-2 border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 shrink-0">
          <CardContent className="py-2.5 px-4 text-sm text-red-700 dark:text-red-400">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Input area */}
      <div className="shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-cyan-500/40 focus-within:border-cyan-400 transition-all">
        <form onSubmit={handleSubmit}>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.ai.inputPlaceholder}
            className="border-0 shadow-none focus-visible:ring-0 resize-none min-h-[80px] max-h-[180px] px-4 pt-3.5 pb-1 text-sm dark:bg-transparent dark:text-slate-100"
            disabled={loading}
          />
          <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
            <p className="text-[11px] text-muted-foreground select-none">
              Enter — yuborish &nbsp;·&nbsp; Shift+Enter — yangi qator
            </p>
            <div className="flex items-center gap-2">
              {loading && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={stopStreaming}
                  className="gap-1.5 text-xs h-8"
                >
                  <Square className="h-3 w-3 fill-current" />
                  To'xtatish
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={!input.trim() || loading}
                className="gap-1.5 h-8 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 text-white border-0 shadow-sm disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Yuklanmoqda...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    {t.ai.send ?? 'Yuborish'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
