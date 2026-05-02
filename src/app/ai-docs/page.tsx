'use client';

import {
  FormEvent, KeyboardEvent, useEffect, useRef, useState, useCallback,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Bot, User, Send, Plus, RotateCcw, Square,
  FileText, Users, Award, ClipboardCheck, MessageSquare, Heart,
  ArrowLeft, Loader2, Sparkles, BookOpen,
  Mic, MicOff, Paperclip, X,
} from 'lucide-react';
import { AiMarkdown } from '@/components/shared/AiMarkdown';
import { AiMessageActions } from '@/components/shared/AiMessageActions';

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = 'user' | 'assistant';
interface Message { role: Role; content: string; }
interface Conversation { id: string; title: string; messages: Message[]; }
interface Attachment { name: string; size: number; }

// ─── Document templates ───────────────────────────────────────────────────────
const DOC_TEMPLATES = {
  uz: [
    { icon: Users,         label: 'Mehnat shartnomasi',        p: "Shifokor bilan mehnat shartnomasi tuzishga yordam bering. Ism, lavozim, oylik maosh va boshlanish sanasi: " },
    { icon: FileText,      label: "Ishdan bo'shatish buyrug'i", p: "Xodimni ishdan bo'shatish buyrug'ini tayyorlang. Xodim ismi, lavozim, sana va sabab: " },
    { icon: Award,         label: "Malaka oshirish buyrug'i",  p: "Xodimni malaka oshirishga yuborish buyrug'ini tayyorlang. Xodim ismi, muassasa va muddati: " },
    { icon: ClipboardCheck,label: 'Yig\'ilish bayonnomasi',    p: "Klinika yig'ilishi bayonnomasini tayyorlang. Sana, ishtirokchilar va muhokama qilingan masalalar: " },
    { icon: MessageSquare, label: 'Shikoyatga javob',          p: "Bemor shikoyatiga rasmiy javob xatini tayyorlang. Shikoyat mazmuni va klinika nomi: " },
    { icon: FileText,      label: 'Yo\'llanma xat',            p: "Bemorni boshqa muassasaga yo'llash uchun yo'llanma xati tayyorlang. Bemor ismi, tashxis va manzil muassasa: " },
    { icon: Heart,         label: 'Bemor rozilik shakli',      p: "Bemor rozilik shaklini tayyorlang. Tibbiy protsedura turi va klinika nomi: " },
    { icon: FileText,      label: 'Xizmat shartnomasi',        p: "Tibbiy xizmatlar ko'rsatish shartnomasini tayyorlang. Tomonlar ismi va xizmat turi: " },
  ],
  ru: [
    { icon: Users,         label: 'Трудовой договор',         p: 'Помогите составить трудовой договор с врачом. ФИО, должность, зарплата и дата начала: ' },
    { icon: FileText,      label: 'Приказ об увольнении',     p: 'Подготовьте приказ об увольнении сотрудника. ФИО, должность, дата и причина: ' },
    { icon: Award,         label: 'Приказ о квалификации',    p: 'Подготовьте приказ о направлении сотрудника на повышение квалификации. ФИО, учреждение и сроки: ' },
    { icon: ClipboardCheck,label: 'Протокол заседания',       p: 'Составьте протокол заседания клиники. Дата, участники и обсуждаемые вопросы: ' },
    { icon: MessageSquare, label: 'Ответ на жалобу',          p: 'Подготовьте официальный ответ на жалобу пациента. Содержание жалобы и название клиники: ' },
    { icon: FileText,      label: 'Направление',              p: 'Составьте направление пациента в другое учреждение. ФИО пациента, диагноз и учреждение назначения: ' },
    { icon: Heart,         label: 'Согласие пациента',        p: 'Подготовьте форму согласия пациента. Вид медицинской процедуры и название клиники: ' },
    { icon: FileText,      label: 'Договор услуг',            p: 'Составьте договор на оказание медицинских услуг. Стороны и вид услуг: ' },
  ],
  en: [
    { icon: Users,         label: 'Employment contract',      p: 'Help draft an employment contract for a doctor. Name, position, salary, and start date: ' },
    { icon: FileText,      label: 'Dismissal order',          p: 'Prepare a dismissal order for an employee. Name, position, date, and reason: ' },
    { icon: Award,         label: 'Qualification order',      p: 'Prepare an order to send an employee for qualification training. Name, institution, and dates: ' },
    { icon: ClipboardCheck,label: 'Meeting minutes',          p: 'Prepare clinic meeting minutes. Date, attendees, and topics discussed: ' },
    { icon: MessageSquare, label: 'Complaint response',       p: 'Prepare an official response to a patient complaint. Complaint content and clinic name: ' },
    { icon: FileText,      label: 'Referral letter',          p: "Prepare a patient referral letter to another institution. Patient name, diagnosis, and destination: " },
    { icon: Heart,         label: 'Patient consent form',     p: 'Prepare a patient consent form. Medical procedure type and clinic name: ' },
    { icon: FileText,      label: 'Service contract',         p: 'Draft a medical services contract. Parties and type of services: ' },
  ],
};

// ─── Language data ────────────────────────────────────────────────────────────
const L = {
  uz: {
    back: '← Dashboard',
    aiName: 'AI Hujjat ustasi',
    aiSub: 'Hujjat yaratish yordamchisi',
    newChat: 'Yangi hujjat',
    heroTitle: 'AI Hujjat ustasi',
    heroSub: "Tibbiy hujjatlarni AI yordamida bir necha soniyada tayyorlang: shartnomalar, buyruqlar, bayonnomalar, xatlar va boshqa rasmiy hujjatlar.",
    placeholder: "Hujjat turi va kerakli ma'lumotlarni kiriting...",
    send: 'Yaratish',
    stop: "To'xtatish",
    aiLabel: 'AI Hujjat',
    thinking: 'Tayyorlamoqda',
    noConvs: "Hujjat yo'q",
    templatesLabel: 'Hujjat turlari',
    copy: 'Nusxa olish',
    copied: 'Nusxalandi',
    tip: 'Hujjatni so\'ng tahrirlashingiz yoki chop etishingiz mumkin',
    attachFile: 'Fayl biriktirish',
    voiceInput: 'Ovozli kiritish',
    suggested: [
      { q: "Yangi shifokor bilan mehnat shartnomasi tayyorlab bering. Ism: Aliyev Sardor, Lavozim: Terapevt, Oylik: 5,000,000 so'm, Boshlanish sanasi: 2026-06-01", icon: Users },
      { q: "Yig'ilish bayonnomasi. Sana: 2026-05-15. Ishtirokchilar: bosh vrach, 3 shifokor. Mavzu: litsenziya yangilash masalalari.", icon: ClipboardCheck },
      { q: "Bemor shikoyatiga javob. Shikoyatchi: Rahimov Jasur. Shikoyat: navbat uzoq kutilganligi. Klinika: Sihhat Med.", icon: MessageSquare },
    ],
  },
  ru: {
    back: '← Dashboard',
    aiName: 'ИИ Составитель документов',
    aiSub: 'Помощник по созданию документов',
    newChat: 'Новый документ',
    heroTitle: 'ИИ Составитель документов',
    heroSub: 'Подготовьте медицинские документы с помощью ИИ за секунды: договоры, приказы, протоколы, письма и другие официальные документы.',
    placeholder: 'Укажите тип документа и необходимые данные...',
    send: 'Создать',
    stop: 'Остановить',
    aiLabel: 'ИИ Документ',
    thinking: 'Подготовка',
    noConvs: 'Документов нет',
    templatesLabel: 'Типы документов',
    copy: 'Скопировать',
    copied: 'Скопировано',
    tip: 'Документ можно отредактировать или распечатать',
    attachFile: 'Прикрепить файл',
    voiceInput: 'Голосовой ввод',
    suggested: [
      { q: 'Составьте трудовой договор с врачом. ФИО: Каримов Санжар, Должность: Хирург, Зарплата: 7 000 000 сум, Дата начала: 01.06.2026', icon: Users },
      { q: 'Протокол заседания. Дата: 15.05.2026. Участники: главврач, 3 врача. Тема: продление лицензии.', icon: ClipboardCheck },
      { q: 'Ответ на жалобу. Пациент: Рахимов Жасур. Жалоба: долгое ожидание. Клиника: Sihhat Med.', icon: MessageSquare },
    ],
  },
  en: {
    back: '← Dashboard',
    aiName: 'AI Document Maker',
    aiSub: 'Document drafting assistant',
    newChat: 'New document',
    heroTitle: 'AI Document Maker',
    heroSub: 'Draft medical documents with AI in seconds: contracts, orders, minutes, letters, and other official documents.',
    placeholder: 'Enter document type and required details...',
    send: 'Draft',
    stop: 'Stop',
    aiLabel: 'AI Docs',
    thinking: 'Drafting',
    noConvs: 'No documents',
    templatesLabel: 'Document types',
    copy: 'Copy',
    copied: 'Copied!',
    tip: 'You can edit or print the document afterwards',
    attachFile: 'Attach file',
    voiceInput: 'Voice input',
    suggested: [
      { q: 'Draft an employment contract. Name: Sardor Aliyev, Position: General Practitioner, Salary: $500/month, Start: 2026-06-01', icon: Users },
      { q: 'Meeting minutes. Date: 2026-05-15. Attendees: head doctor, 3 physicians. Topic: licence renewal.', icon: ClipboardCheck },
      { q: 'Complaint response. Patient: Jasur Rahimov. Complaint: long waiting time. Clinic: Sihhat Med.', icon: MessageSquare },
    ],
  },
  uz_cyrillic: {
    back: '← Dashboard',
    aiName: 'АИ Ҳужжат устаси',
    aiSub: 'Ҳужжат яратиш ёрдамчиси',
    newChat: 'Янги ҳужжат',
    heroTitle: 'АИ Ҳужжат устаси',
    heroSub: "Тиббий ҳужжатларни АИ ёрдамида бир неча сониядa тайёрланг: шартномалар, буйруқлар, баённомалар, хатлар ва бошқа расмий ҳужжатлар.",
    placeholder: "Ҳужжат тури ва керакли маълумотларни киритинг...",
    send: 'Яратиш',
    stop: 'Тўхтатиш',
    aiLabel: 'АИ Ҳужжат',
    thinking: 'Тайёрламоқда',
    noConvs: 'Ҳужжат йўқ',
    templatesLabel: 'Ҳужжат турлари',
    copy: 'Нусха олиш',
    copied: 'Нусхаланди',
    tip: "Ҳужжатни сўнг таҳрирлашингиз ёки чоп этишингиз мумкин",
    attachFile: 'Файл бириктириш',
    voiceInput: 'Овозли киритиш',
    suggested: [
      { q: "Янги шифокор билан меҳнат шартномаси тайёрланг. Исм: Алиев Сардор, Лавозим: Терапевт, Ойлик: 5 000 000 сўм, Бошланиш санаси: 2026-06-01", icon: Users },
      { q: "Йиғилиш баённомаси. Сана: 2026-05-15. Иштирокчилар: бош врач, 3 шифокор. Мавзу: лицензия янгилаш масалалари.", icon: ClipboardCheck },
      { q: "Бемор шикоятига жавоб. Шикоятчи: Раҳимов Жасур. Шикоят: навбат узоқ кутилганлиги. Клиника: Sihhat Med.", icon: MessageSquare },
    ],
  },
  kk: {
    back: '← Dashboard',
    aiName: 'ЖИ Құjat шебері',
    aiSub: 'Құjat жасау көмекшісі',
    newChat: 'Жаңа құjat',
    heroTitle: 'ЖИ Құjat шебері',
    heroSub: 'Медициналық құжаттарды ЖИ көмегімен бірнеше секундта дайындаңыз: шарттар, бұйрықтар, хаттамалар, хаттар және басқа ресми құжаттар.',
    placeholder: 'Құжат түрі мен қажетті деректерді енгізіңіз...',
    send: 'Жасау',
    stop: 'Тоқтату',
    aiLabel: 'ЖИ Құjat',
    thinking: 'Дайындалуда',
    noConvs: 'Құжат жоқ',
    templatesLabel: 'Құжат түрлері',
    copy: 'Көшіру',
    copied: 'Көшірілді',
    tip: 'Құжатты кейін өңдеуге немесе басып шығаруға болады',
    attachFile: 'Файл тіркеу',
    voiceInput: 'Дауыстық енгізу',
    suggested: [
      { q: 'Дәрігермен еңбек шарты жасаңыз. Аты: Алиев Сарадор, Лауазым: Терапевт, Айлық: 5 000 000 сом, Басталу күні: 2026-06-01', icon: Users },
      { q: 'Жиналыс хаттамасы. Күні: 2026-05-15. Қатысушылар: бас дәрігер, 3 дәрігер. Тақырып: лицензия жаңарту.', icon: ClipboardCheck },
      { q: 'Шағымға жауап. Пациент: Рахимов Жасур. Шағым: ұзақ күту. Клиника: Sihhat Med.', icon: MessageSquare },
    ],
  },
} as const;

type LangKey = keyof typeof L;

const SYSTEM_PROMPT = `You are an expert legal and administrative document drafter for Uzbekistan private medical clinics (xususiy tibbiyot muassasalari).

Your ONLY job: produce a COMPLETE, READY-TO-USE formal document based on the user's request.

Strict rules:
1. Write the FULL document body — never write outlines, templates with "[...]", or partial drafts. Every section must have real content.
2. Follow Uzbekistan document structure standards:
   - Header: organization name, document type title (BUYRUQ / MEHNAT SHARTNOMASI / BAYONNOMA / XIZMAT KO'RSATISH SHARTNOMASI / YO'LLANMA), number, city, date
   - Body: full recitals, all clauses numbered, parties identified
   - Closing: signature blocks for both parties, stamp placeholders (M.O.), date lines
3. Use formal O'zbek yoki rus tili (match the user's language)
4. Include realistic placeholder values in [KVADRAT QAVSLAR] only for data the clinic must fill in (e.g., [Klinika nomi], [Xodim ismi], [Summa])
5. Length: documents must be substantive — at least 300 words for contracts, 150 words for orders/minutes
6. End every response with a short "To'ldirish kerak:" section listing the [placeholder] fields the user must fill in
7. Never refuse to draft a medical/administrative document type`;

// ─── Main component ───────────────────────────────────────────────────────────
export default function AiDocsPage() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLanguage();
  const router = useRouter();

  const lk: LangKey = lang === 'uz_cyrillic' ? 'uz_cyrillic' : lang === 'ru' ? 'ru' : lang === 'en' ? 'en' : lang === 'kk' ? 'kk' : 'uz';
  const tx = L[lk];
  const templates = DOC_TEMPLATES[(lk === 'uz_cyrillic' || lk === 'kk') ? 'uz' : lk as 'uz' | 'ru' | 'en'] ?? DOC_TEMPLATES.uz;

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [listening, setListening] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<object | null>(null);

  const activeConv = conversations.find((c) => c.id === activeId) ?? null;
  const messages = activeConv?.messages ?? [];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  function newChat() {
    if (loading) { abortRef.current?.abort(); setLoading(false); }
    setActiveId(null); setInput(''); setError(null); setAttachments([]);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setAttachments((prev) => [...prev, ...files.map((f) => ({ name: f.name, size: f.size }))]);
    e.target.value = '';
  }

  function removeAttachment(i: number) {
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));
  }

  function toggleMic() {
    const SpeechRecognition =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (listening) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (recognitionRef.current as any)?.stop?.();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'uz-UZ';
    recognition.continuous = false;
    recognition.interimResults = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const text = event.results[0]?.[0]?.transcript ?? '';
      setInput((prev) => (prev ? prev + ' ' + text : text));
    };
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  }

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null); setInput(''); setLoading(true); setAttachments([]);

    let cid = activeId;
    if (!cid) {
      cid = crypto.randomUUID();
      const title = trimmed.slice(0, 48) + (trimmed.length > 48 ? '...' : '');
      setConversations((prev) => [{ id: cid!, title, messages: [] }, ...prev]);
      setActiveId(cid);
    }

    const userMsg: Message = { role: 'user', content: trimmed };
    setConversations((prev) => prev.map((c) =>
      c.id === cid ? { ...c, messages: [...c.messages, userMsg, { role: 'assistant', content: '' }] } : c
    ));

    const reqMsgs: Message[] = [...messages, userMsg];
    abortRef.current = new AbortController();

    try {
      const idToken = user ? await user.getIdToken() : '';
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          messages: reqMsgs,
          mode: 'deep',
          format: 'default',
          context: SYSTEM_PROMPT,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? `Error ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const p = line.slice(6);
          if (p === '[DONE]') continue;
          try {
            const j = JSON.parse(p) as { delta?: string; model?: string };
            if (j.model || !j.delta) continue;
            full += j.delta;
            setConversations((prev) => prev.map((c) => {
              if (c.id !== cid) return c;
              const ms = [...c.messages];
              ms[ms.length - 1] = { role: 'assistant', content: full };
              return { ...c, messages: ms };
            }));
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Xato yuz berdi.');
      setConversations((prev) => prev.map((c) =>
        c.id === cid ? { ...c, messages: c.messages.slice(0, -1) } : c
      ));
    } finally {
      setLoading(false); abortRef.current = null;
    }
  }, [activeId, loading, messages, user]);

  function handleSubmit(e: FormEvent) { e.preventDefault(); sendMessage(input); }
  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  }

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 overflow-hidden">

      {/* ── Left Sidebar ──────────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 bg-slate-900 flex flex-col border-r border-slate-800/60 hidden lg:flex">

        <div className="px-4 pt-4 pb-3 border-b border-slate-800/60">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-medium mb-3 group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            {tx.back}
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shrink-0">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-none">{tx.aiName}</p>
              <p className="text-[10px] text-emerald-400 font-semibold tracking-wide mt-0.5">{tx.aiSub}</p>
            </div>
          </div>
        </div>

        <div className="px-3 pt-3 pb-2">
          <button
            onClick={newChat}
            className="w-full flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 px-3 py-2 text-sm font-semibold text-white transition-all"
          >
            <Plus className="h-4 w-4" />{tx.newChat}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
          {conversations.length > 0 && (
            <div className="mb-1">
              {conversations.slice(0, 6).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-all ${
                    activeId === c.id ? 'bg-white/12 text-white' : 'text-slate-400 hover:bg-white/7 hover:text-slate-200'
                  }`}
                >
                  <FileText className="h-3 w-3 shrink-0 opacity-50" />
                  <span className="text-xs truncate">{c.title}</span>
                </button>
              ))}
            </div>
          )}

          <div className="pt-1">
            <p className="px-2 py-1.5 text-[10px] font-bold tracking-[0.14em] text-slate-600">{tx.templatesLabel}</p>
            {templates.map((tpl) => (
              <button
                key={tpl.label}
                onClick={() => sendMessage(tpl.p)}
                className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-all group"
              >
                <tpl.icon className="h-3.5 w-3.5 shrink-0 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors truncate">{tpl.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-800/60 px-3 py-3 shrink-0">
          <div className="rounded-lg bg-emerald-950/40 border border-emerald-800/30 px-3 py-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Maslahat</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-snug">{tx.tip}</p>
          </div>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">

        {/* ── Top Bar ──────────────────────────────────────────────────────── */}
        <div className="h-12 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 gap-3 shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
              <FileText className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{tx.aiName}</p>
              <p className="text-[10px] text-emerald-500 font-semibold">{tx.aiSub}</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={newChat} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* ── Chat Area ─────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center min-h-full px-6 py-10 text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/20 mb-5">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{tx.heroTitle}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-8">{tx.heroSub}</p>

              <div className="flex flex-col gap-2.5 max-w-2xl w-full">
                {tx.suggested.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s.q)}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-left hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all"
                  >
                    <span className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30">
                      <s.icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-300 leading-snug text-left">{s.q}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
              {messages.map((msg, i) => (
                <div key={`${msg.role}-${i}`} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm mt-1">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className={`flex-1 min-w-0 max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-tl-sm'
                  }`}>
                    {msg.role === 'assistant' && (
                      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
                        {tx.aiLabel}
                      </p>
                    )}
                    {msg.content
                      ? <AiMarkdown text={msg.content} streaming={loading && i === messages.length - 1} />
                      : (
                        <div className="flex items-center gap-1 py-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0ms]" />
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:150ms]" />
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:300ms]" />
                        </div>
                      )
                    }
                    {msg.role === 'assistant' && msg.content && !loading && (
                      <AiMessageActions
                        text={msg.content}
                        lang={lk}
                        downloadFilename="AI-hujjat"
                        onRetry={i === messages.length - 1 ? () => {
                          const last = [...messages].reverse().find((m) => m.role === 'user');
                          if (last) sendMessage(last.content);
                        } : undefined}
                      />
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="h-8 w-8 shrink-0 rounded-xl bg-emerald-100 dark:bg-slate-700 flex items-center justify-center mt-1">
                      <User className="h-4 w-4 text-emerald-600 dark:text-slate-300" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* ── Input Area ────────────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-4">
          {error && (
            <div className="mb-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-3 py-2 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((a, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300">
                  <Paperclip className="h-3 w-3" />
                  <span className="truncate max-w-[140px]">{a.name}</span>
                  <button onClick={() => removeAttachment(i)} className="hover:text-red-500 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus-within:border-emerald-400 dark:focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-400/15 transition-all">
            <form onSubmit={handleSubmit}>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={tx.placeholder}
                disabled={loading}
                className="border-0 shadow-none focus-visible:ring-0 resize-none min-h-[80px] max-h-[180px] text-sm px-4 pt-3 pb-1 dark:bg-transparent dark:text-slate-100 placeholder:text-slate-400"
              />
              <div className="flex items-center justify-between px-3 pb-2.5 pt-1 gap-3">
                <div className="flex items-center gap-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title={tx.attachFile}
                    className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleMic}
                    title={tx.voiceInput}
                    className={`p-1.5 rounded-lg transition-colors ${
                      listening
                        ? 'text-red-500 bg-red-50 dark:bg-red-950/30'
                        : 'text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                    }`}
                  >
                    {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                  <span className="text-[10px] text-slate-400 hidden sm:block ml-1">
                    <BookOpen className="h-3 w-3 inline mr-1" />
                    Gemini 2.5 Pro
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {loading && (
                    <Button type="button" size="sm" variant="outline" onClick={() => { abortRef.current?.abort(); setLoading(false); }} className="h-7 px-2 text-xs gap-1">
                      <Square className="h-3 w-3 fill-current" />
                      {tx.stop}
                    </Button>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!input.trim() || loading}
                    className="h-8 px-4 gap-1.5 text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 shadow-sm disabled:opacity-40 font-semibold"
                  >
                    {loading
                      ? <><span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />{tx.thinking}</>
                      : <><FileText className="h-3.5 w-3.5" />{tx.send}</>
                    }
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
