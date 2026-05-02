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
  Shield, FileText, Award, Users, ClipboardCheck, Search, AlertTriangle,
  ArrowLeft, Loader2, Sparkles, BookOpen, Globe,
  Mic, MicOff, Paperclip, X,
} from 'lucide-react';
import { AiMarkdown } from '@/components/shared/AiMarkdown';
import { SourcesList, type AiSource } from '@/components/shared/SourcesList';
import { AiMessageActions } from '@/components/shared/AiMessageActions';

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = 'user' | 'assistant';
type Mode = 'fast' | 'balanced' | 'deep';
interface Message { role: Role; content: string; sources?: AiSource[]; }
interface Conversation { id: string; title: string; messages: Message[]; }
interface Attachment { name: string; size: number; }

// ─── Language data ────────────────────────────────────────────────────────────
const L = {
  uz: {
    back: '← Dashboard',
    aiName: 'AI HR Maslahatchi',
    aiSub: 'Mehnat Qonunchiligi AI',
    newChat: 'Yangi suhbat',
    fast: 'Tez', balanced: 'Balanced', deep: 'Deep Think',
    heroTitle: 'AI HR Maslahatchi',
    heroSub: "O'zbekiston mehnat qonunchiligi, ish shartnomasi, kadrlar boshqaruvi va malaka talablariga oid savollarga mutaxassis AI yordamida javob oling.",
    placeholder: "Mehnat qonunchiligi yoki kadrlar bo'yicha savol...",
    send: 'Yuborish',
    stop: "To'xtatish",
    aiLabel: 'AI HR',
    thinking: 'Tahlil qilyapti',
    noConvs: "Suhbat yo'q",
    ragNote: 'RAG tizimi orqali haqiqiy mehnat kodeksi asosida javob beriladi',
    webNote: 'Veb qidirish orqali eng yangi qonunchilik ma\'lumotlari',
    quickLabel: 'Tez savollar',
    regsLabel: 'Manbalar',
    webSearch: 'Veb qidirish',
    attachFile: 'Fayl biriktirish',
    voiceInput: 'Ovozli kiritish',
    suggested: [
      { q: "Shifokorni ishdan bo'shatish uchun qanday asoslar kerak?", icon: 'alert' },
      { q: "Mehnat shartnomasi tuzishda majburiy bandlar qanday?", icon: 'doc' },
      { q: "Malaka oshirish muddatlari va talablari qanday?", icon: 'award' },
      { q: "Sanitariya daftarchasi qachon yangilanishi kerak?", icon: 'search' },
      { q: "Shifokorga mehnat ta'tili qanday beriladi?", icon: 'shield' },
    ],
    tpls: [
      { icon: Users, label: 'Mehnat shartnomasi', p: "Tibbiy xodim bilan mehnat shartnomasi tuzish uchun zarur bandlar va O'zbekiston mehnat kodeksi talablarini batafsil ko'rsating." },
      { icon: FileText, label: 'Ishdan bo\'shatish tartibi', p: "Tibbiy xodimni qonuniy ravishda ishdan bo'shatish uchun barcha bosqichlar va zarur hujjatlarni tushuntiring." },
      { icon: Award, label: 'Malaka toifalari', p: "Tibbiy xodimlarning malaka toifalari, ularni oshirish tartibi, muddatlari va zarur hujjatlarni batafsil ko'rsating." },
      { icon: ClipboardCheck, label: 'Sanitariya daftarchasi', p: "Tibbiy xodimlar uchun sanitariya daftarchasi talablari, yangilash muddatlari va javobgarlikni tushuntiring." },
      { icon: Shield, label: "Mehnat ta'tili", p: "Tibbiy xodimlar uchun mehnat ta'tili huquqi, muddatlari va hisoblash tartibini O'zbekiston qonunchiligi asosida ko'rsating." },
      { icon: Search, label: 'Intizom jazolari', p: "Tibbiy xodimga intizom jazosi qo'llash tartibi, asoslari va xodimning huquqlarini tushuntiring." },
    ],
    regs: ["Mehnat kodeksi", "SSV HR buyruqlari", "Malaka talablari", "San. daftarcha qoidalari", "Ta'til qoidalari"],
  },
  ru: {
    back: '← Dashboard',
    aiName: 'ИИ HR Советник',
    aiSub: 'Трудовое Законодательство ИИ',
    newChat: 'Новый чат',
    fast: 'Быстро', balanced: 'Balanced', deep: 'Глубокий',
    heroTitle: 'ИИ HR Советник',
    heroSub: 'Получите экспертные ответы по трудовому законодательству Узбекистана, кадровому управлению и квалификационным требованиям.',
    placeholder: 'Вопрос о трудовом праве или кадрах...',
    send: 'Отправить',
    stop: 'Остановить',
    aiLabel: 'ИИ HR',
    thinking: 'Анализирует',
    noConvs: 'Нет разговоров',
    ragNote: 'После подключения RAG ответы будут основаны на реальных правовых документах',
    webNote: 'Актуальные данные законодательства через веб-поиск',
    quickLabel: 'Быстрые вопросы',
    regsLabel: 'Источники',
    webSearch: 'Веб-поиск',
    attachFile: 'Прикрепить файл',
    voiceInput: 'Голосовой ввод',
    suggested: [
      { q: 'Каковы основания для увольнения врача?', icon: 'alert' },
      { q: 'Какие обязательные пункты в трудовом договоре?', icon: 'doc' },
      { q: 'Каковы сроки и требования к повышению квалификации?', icon: 'award' },
      { q: 'Когда нужно обновлять санитарную книжку?', icon: 'search' },
      { q: 'Как предоставляется отпуск медицинскому работнику?', icon: 'shield' },
    ],
    tpls: [
      { icon: Users, label: 'Трудовой договор', p: 'Подробно опишите обязательные пункты и требования Трудового кодекса Узбекистана для трудового договора с медицинским работником.' },
      { icon: FileText, label: 'Порядок увольнения', p: 'Объясните все этапы законного увольнения медицинского работника и необходимые документы.' },
      { icon: Award, label: 'Квалификационные категории', p: 'Подробно укажите квалификационные категории медработников, порядок повышения, сроки и необходимые документы.' },
      { icon: ClipboardCheck, label: 'Санитарная книжка', p: 'Объясните требования к санитарной книжке медработников, сроки обновления и ответственность.' },
      { icon: Shield, label: 'Отпуск', p: 'Укажите права на отпуск медицинских работников, сроки и порядок расчёта по законодательству Узбекистана.' },
      { icon: Search, label: 'Дисциплинарные взыскания', p: 'Объясните порядок применения дисциплинарных взысканий к медработнику, основания и права работника.' },
    ],
    regs: ['Трудовой кодекс', 'Приказы SSV по кадрам', 'Квалиф. требования', 'Правила сан. книжки', 'Правила отпуска'],
  },
  en: {
    back: '← Dashboard',
    aiName: 'AI HR Advisor',
    aiSub: 'Labour Law AI',
    newChat: 'New Chat',
    fast: 'Fast', balanced: 'Balanced', deep: 'Deep Think',
    heroTitle: 'AI HR Advisor',
    heroSub: 'Get expert answers on Uzbekistan labour law, employment contracts, staff management, and qualification requirements.',
    placeholder: 'Ask about labour law or HR management...',
    send: 'Send',
    stop: 'Stop',
    aiLabel: 'AI HR',
    thinking: 'Analysing',
    noConvs: 'No conversations',
    ragNote: 'RAG integration will ground answers in real legal documents',
    webNote: 'Latest legislation data via web search',
    quickLabel: 'Quick questions',
    regsLabel: 'Sources',
    webSearch: 'Web search',
    attachFile: 'Attach file',
    voiceInput: 'Voice input',
    suggested: [
      { q: 'What are the legal grounds for dismissing a doctor?', icon: 'alert' },
      { q: 'What mandatory clauses must be in an employment contract?', icon: 'doc' },
      { q: 'What are the qualification upgrade deadlines and requirements?', icon: 'award' },
      { q: 'When must a health book be renewed?', icon: 'search' },
      { q: 'How is annual leave granted to healthcare workers?', icon: 'shield' },
    ],
    tpls: [
      { icon: Users, label: 'Employment Contract', p: 'Detail the mandatory clauses and Uzbekistan Labour Code requirements for an employment contract with a medical worker.' },
      { icon: FileText, label: 'Dismissal Procedure', p: 'Explain all steps for lawfully dismissing a medical worker and the required documentation.' },
      { icon: Award, label: 'Qualification Categories', p: 'Detail the qualification categories for medical workers, the upgrade procedure, deadlines, and required documents.' },
      { icon: ClipboardCheck, label: 'Health Book', p: 'Explain the health book requirements for medical workers, renewal deadlines, and responsibilities.' },
      { icon: Shield, label: 'Annual Leave', p: "Outline healthcare workers' leave rights, durations, and calculation procedures under Uzbekistan law." },
      { icon: Search, label: 'Disciplinary Sanctions', p: 'Explain the procedure for applying disciplinary sanctions to a medical worker, grounds, and employee rights.' },
    ],
    regs: ['Labour Code', 'SSV HR Orders', 'Qualification Requirements', 'Health Book Rules', 'Leave Rules'],
  },
  uz_cyrillic: {
    back: '← Dashboard',
    aiName: 'АИ КР Маслаҳатчи',
    aiSub: 'Меҳнат Қонунчилиги АИ',
    fast: 'Тез', balanced: 'Balanced', deep: 'Deep Think',
    newChat: 'Янги суҳбат',
    heroTitle: 'АИ КР Маслаҳатчи',
    heroSub: "Ўзбекистон меҳнат қонунчилиги, иш шартномаси, кадрлар бошқаруви ва малака талабларига оид саволларга мутахассис АИ ёрдамида жавоб олинг.",
    placeholder: "Меҳнат қонунчилиги ёки кадрлар бўйича савол...",
    send: 'Юбориш',
    stop: 'Тўхтатиш',
    aiLabel: 'АИ КР',
    thinking: 'Таҳлил қиляпти',
    noConvs: 'Суҳбат йўқ',
    ragNote: 'RAG тизими орқали ҳақиқий меҳнат кодекси асосида жавоб берилади',
    webNote: 'Веб қидириш орқали энг янги қонунчилик маълумотлари',
    quickLabel: 'Тез саволлар',
    regsLabel: 'Манбалар',
    webSearch: 'Веб қидириш',
    attachFile: 'Файл бириктириш',
    voiceInput: 'Овозли киритиш',
    suggested: [
      { q: "Шифокорни ишдан бўшатиш учун қандай асослар керак?", icon: 'alert' },
      { q: "Меҳнат шартномаси тузишда мажбурий бандлар қандай?", icon: 'doc' },
      { q: "Малака ошириш муддатлари ва талаблари қандай?", icon: 'award' },
      { q: "Санитария дафтарчаси қачон янгиланиши керак?", icon: 'search' },
      { q: "Шифокорга меҳнат таттили қандай берилади?", icon: 'shield' },
    ],
    tpls: [
      { icon: Users, label: 'Меҳнат шартномаси', p: "Тиббий ходим билан меҳнат шартномаси тузиш учун зарур бандлар ва Ўзбекистон меҳнат кодекси талабларини батафсил кўрсатинг." },
      { icon: FileText, label: 'Ишдан бўшатиш тартиби', p: "Тиббий ходимни қонуний равишда ишдан бўшатиш учун барча босқичлар ва зарур ҳужжатларни тушунтиринг." },
      { icon: Award, label: 'Малака тоифалари', p: "Тиббий ходимларнинг малака тоифалари, уларни ошириш тартиби, муддатлари ва зарур ҳужжатларни батафсил кўрсатинг." },
      { icon: ClipboardCheck, label: 'Санитария дафтарчаси', p: "Тиббий ходимлар учун санитария дафтарчаси талаблари, янгилаш муддатлари ва жавобгарликни тушунтиринг." },
      { icon: Shield, label: "Меҳнат таттили", p: "Тиббий ходимлар учун меҳнат таттили ҳуқуқи, муддатлари ва ҳисоблаш тартибини Ўзбекистон қонунчилиги асосида кўрсатинг." },
      { icon: Search, label: 'Интизом жазолари', p: "Тиббий ходимга интизом жазоси қўллаш тартиби, асослари ва ходимнинг ҳуқуқларини тушунтиринг." },
    ],
    regs: ["Меҳнат кодекси", "ССВ КР буйруқлари", "Малака талаблари", "Сан. дафтарча қоидалари", "Таттил қоидалари"],
  },
  kk: {
    back: '← Dashboard',
    aiName: 'ЖИ HR Кеңесші',
    aiSub: 'Еңбек Заңы ЖИ',
    newChat: 'Жаңа сөйлесу',
    fast: 'Жылдам', balanced: 'Balanced', deep: 'Терең',
    heroTitle: 'ЖИ HR Кеңесші',
    heroSub: "Өзбекстанның еңбек заңнамасы, жұмыс шарттары, кадр басқаруы және біліктілік талаптары бойынша сарапшы ЖИ жауаптарын алыңыз.",
    placeholder: 'Еңбек заңы немесе HR туралы сұрақ...',
    send: 'Жіберу',
    stop: 'Тоқтату',
    aiLabel: 'ЖИ HR',
    thinking: 'Талдауда',
    noConvs: 'Сөйлесу жоқ',
    ragNote: 'RAG жүйесі арқылы нақты еңбек кодексі негізінде жауап беріледі',
    webNote: 'Веб іздеу арқылы ең жаңа заңнама деректері',
    quickLabel: 'Жылдам сұрақтар',
    regsLabel: 'Дереккөздер',
    webSearch: 'Веб іздеу',
    attachFile: 'Файл тіркеу',
    voiceInput: 'Дауыстық енгізу',
    suggested: [
      { q: 'Дәрігерді жұмыстан шығару үшін қандай негіздер қажет?', icon: 'alert' },
      { q: 'Еңбек шартында міндетті тармақтар қандай?', icon: 'doc' },
      { q: 'Біліктілікті арттыру мерзімдері мен талаптары қандай?', icon: 'award' },
      { q: 'Санитарлық кітапша қашан жаңартылуы керек?', icon: 'search' },
      { q: 'Медицина қызметкеріне демалыс қалай беріледі?', icon: 'shield' },
    ],
    tpls: [
      { icon: Users, label: 'Еңбек шарты', p: 'Өзбекстан Еңбек кодексі бойынша медицина қызметкерімен еңбек шарты жасасу үшін міндетті тармақтарды толық көрсетіңіз.' },
      { icon: FileText, label: 'Жұмыстан шығару тәртібі', p: 'Медицина қызметкерін заңды түрде жұмыстан шығарудың барлық кезеңдері мен қажетті құжаттарды түсіндіріңіз.' },
      { icon: Award, label: 'Біліктілік санаттары', p: 'Медицина қызметкерлерінің біліктілік санаттары, арттыру тәртібі, мерзімдері мен қажетті құжаттарды толық көрсетіңіз.' },
      { icon: ClipboardCheck, label: 'Санитарлық кітапша', p: 'Медицина қызметкерлеріне арналған санитарлық кітапша талаптарын, жаңарту мерзімдері мен жауапкершілікті түсіндіріңіз.' },
      { icon: Shield, label: 'Жыл сайынғы демалыс', p: "Өзбекстан заңнамасы бойынша медицина қызметкерлерінің демалыс құқықтары, мерзімдері мен есептеу тәртібін көрсетіңіз." },
      { icon: Search, label: 'Тәртіптік жазалар', p: 'Медицина қызметкеріне тәртіптік жаза қолдану тәртібін, негіздерін және қызметкер құқықтарын түсіндіріңіз.' },
    ],
    regs: ['Еңбек кодексі', 'SSV HR бұйрықтары', 'Біліктілік талаптары', 'Сан. кітапша ережелері', 'Демалыс ережелері'],
  },
} as const;

type LangKey = keyof typeof L;

function SuggestIcon({ type }: { type: string }) {
  const cls = 'h-4 w-4';
  if (type === 'alert') return <AlertTriangle className={cls} />;
  if (type === 'doc') return <FileText className={cls} />;
  if (type === 'award') return <Award className={cls} />;
  if (type === 'search') return <Search className={cls} />;
  return <Shield className={cls} />;
}

const SUGGEST_COLORS = [
  'text-violet-500 bg-violet-50 dark:bg-violet-950/30',
  'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30',
  'text-purple-500 bg-purple-50 dark:bg-purple-950/30',
  'text-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-950/30',
  'text-pink-500 bg-pink-50 dark:bg-pink-950/30',
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function AiHrPage() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLanguage();
  const router = useRouter();

  const lk: LangKey = lang === 'uz_cyrillic' ? 'uz_cyrillic' : lang === 'ru' ? 'ru' : lang === 'en' ? 'en' : lang === 'kk' ? 'kk' : 'uz';
  const tx = L[lk];

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('balanced');
  const [useWebSearch, setUseWebSearch] = useState(false);
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
      const res = await fetch('/api/ai-rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          messages: reqMsgs.map((m) => ({ role: m.role, content: m.content })),
          corpusType: 'hr',
          useWebSearch,
          mode,
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
      let finalSources: AiSource[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const p = line.slice(6);
          if (p === '[DONE]') continue;
          try {
            const j = JSON.parse(p) as { delta?: string; sources?: AiSource[]; model?: string };
            if (j.sources) { finalSources = j.sources; continue; }
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

      if (finalSources.length) {
        setConversations((prev) => prev.map((c) => {
          if (c.id !== cid) return c;
          const ms = [...c.messages];
          ms[ms.length - 1] = { ...ms[ms.length - 1], sources: finalSources };
          return { ...c, messages: ms };
        }));
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
  }, [activeId, loading, messages, mode, useWebSearch, user]);

  function handleSubmit(e: FormEvent) { e.preventDefault(); sendMessage(input); }
  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  }

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
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
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shrink-0">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-none">{tx.aiName}</p>
              <p className="text-[10px] text-violet-400 font-semibold tracking-wide mt-0.5">{tx.aiSub}</p>
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
          {conversations.length === 0 ? (
            <p className="px-2 py-4 text-xs text-slate-600 text-center">{tx.noConvs}</p>
          ) : (
            conversations.slice(0, 8).map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-all ${
                  activeId === c.id ? 'bg-white/12 text-white' : 'text-slate-400 hover:bg-white/7 hover:text-slate-200'
                }`}
              >
                <BookOpen className="h-3 w-3 shrink-0 opacity-50" />
                <span className="text-xs truncate">{c.title}</span>
              </button>
            ))
          )}

          <div className="pt-2">
            <p className="px-2 py-1.5 text-[10px] font-bold tracking-[0.14em] text-slate-600">{tx.quickLabel}</p>
            {tx.tpls.map((tpl) => (
              <button
                key={tpl.label}
                onClick={() => sendMessage(tpl.p)}
                className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-all group"
              >
                <tpl.icon className="h-3.5 w-3.5 shrink-0 text-slate-500 group-hover:text-violet-400 transition-colors" />
                <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors truncate">{tpl.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-2">
            <p className="px-2 py-1.5 text-[10px] font-bold tracking-[0.14em] text-slate-600">{tx.regsLabel}</p>
            {tx.regs.map((reg) => (
              <div key={reg} className="flex items-center gap-2 px-2.5 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                <span className="text-[11px] text-slate-500">{reg}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-800/60 px-3 py-3 shrink-0">
          <div className="rounded-lg bg-violet-950/40 border border-violet-800/30 px-3 py-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="h-3 w-3 text-violet-400" />
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wide">RAG</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-snug">{tx.ragNote}</p>
          </div>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">

        {/* ── Top Bar ──────────────────────────────────────────────────────── */}
        <div className="h-12 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 gap-3 shrink-0 bg-white dark:bg-slate-900">
          {/* Mode pills */}
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-full p-0.5">
            {([
              { id: 'fast' as Mode, label: tx.fast, emoji: '⚡', cls: 'bg-orange-500' },
              { id: 'balanced' as Mode, label: tx.balanced, emoji: '⚖️', cls: 'bg-violet-600' },
              { id: 'deep' as Mode, label: tx.deep, emoji: '🧠', cls: 'bg-purple-700' },
            ]).map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                  mode === m.id
                    ? `${m.cls} text-white shadow-sm`
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
              >
                <span>{m.emoji}</span>
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setUseWebSearch((v) => !v)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
                useWebSearch
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-500/25'
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-violet-400'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tx.webSearch}</span>
            </button>
            {messages.length > 0 && (
              <button onClick={newChat} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Chat Area ─────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center min-h-full px-6 py-10 text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl shadow-violet-500/20 mb-5">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{tx.heroTitle}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-8">{tx.heroSub}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl w-full">
                {tx.suggested.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s.q)}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-left hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm transition-all group"
                  >
                    <span className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${SUGGEST_COLORS[i % 5]}`}>
                      <SuggestIcon type={s.icon} />
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
                    <div className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm mt-1">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className={`flex-1 min-w-0 max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-violet-600 text-white rounded-tr-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-tl-sm'
                  }`}>
                    {msg.role === 'assistant' && (
                      <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-2">
                        {tx.aiLabel}
                      </p>
                    )}
                    {msg.content
                      ? <AiMarkdown text={msg.content} />
                      : (
                        <div className="flex items-center gap-1 py-1">
                          <span className="h-2 w-2 rounded-full bg-violet-500 animate-bounce [animation-delay:0ms]" />
                          <span className="h-2 w-2 rounded-full bg-violet-500 animate-bounce [animation-delay:150ms]" />
                          <span className="h-2 w-2 rounded-full bg-violet-500 animate-bounce [animation-delay:300ms]" />
                        </div>
                      )
                    }
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3">
                        <SourcesList sources={msg.sources} />
                      </div>
                    )}
                    {msg.role === 'assistant' && msg.content && !loading && (
                      <AiMessageActions
                        text={msg.content}
                        lang={lk}
                        downloadFilename="AI-HR-maslahat"
                        onRetry={i === messages.length - 1 ? () => {
                          const last = [...messages].reverse().find((m) => m.role === 'user');
                          if (last) sendMessage(last.content);
                        } : undefined}
                      />
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="h-8 w-8 shrink-0 rounded-xl bg-violet-100 dark:bg-slate-700 flex items-center justify-center mt-1">
                      <User className="h-4 w-4 text-violet-600 dark:text-slate-300" />
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

          {useWebSearch && (
            <div className="mb-2 flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
              <Globe className="h-3.5 w-3.5" />
              <span>{tx.webNote}</span>
            </div>
          )}

          <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus-within:border-violet-400 dark:focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-400/15 transition-all">
            <form onSubmit={handleSubmit}>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={tx.placeholder}
                disabled={loading}
                className="border-0 shadow-none focus-visible:ring-0 resize-none min-h-[72px] max-h-[160px] text-sm px-4 pt-3 pb-1 dark:bg-transparent dark:text-slate-100 placeholder:text-slate-400"
              />
              <div className="flex items-center justify-between px-3 pb-2.5 pt-1 gap-3">
                <div className="flex items-center gap-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title={tx.attachFile}
                    className="text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 p-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
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
                        : 'text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30'
                    }`}
                  >
                    {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
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
                    className="h-8 px-4 gap-1.5 text-sm bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0 shadow-sm disabled:opacity-40 font-semibold"
                  >
                    {loading
                      ? <><span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />{tx.thinking}</>
                      : <><Send className="h-3.5 w-3.5" />{tx.send}</>
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
