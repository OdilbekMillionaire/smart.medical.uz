'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  BookOpen, Search, ChevronDown, ExternalLink, Star, StarOff,
  Clock, Download, Share2, Filter, X, CheckCircle2,
  AlertCircle, Info, Printer,
} from 'lucide-react';

type LK = 'uz' | 'uz_cyrillic' | 'ru' | 'en' | 'kk';
const L: Record<LK, {
  title: string; subtitle: string; searchPlaceholder: string;
  allCategories: string; results: string; keyPoints: string;
  source: string; year: string; updated: string; openBtn: string;
  downloadBtn: string; shareBtn: string; starBtn: string; unstarBtn: string;
  printBtn: string; starredMsg: string; unstarredMsg: string; copiedMsg: string;
  notFound: string; notFoundHint: string; evidenceLabel: string;
  favTab: string; allTab: string; recentTab: string;
  noFavorites: string; disclaimer: string;
}> = {
  uz: {
    title: "Klinik Ko'rsatmalar", subtitle: "ta tibbiy ko'rsatma mavjud",
    searchPlaceholder: "Ko'rsatma nomi, kasallik yoki mutaxassislik...",
    allCategories: "Barcha sohalar", results: "ta natija",
    keyPoints: "Asosiy qoidalar", source: "Manba", year: "Yil", updated: "Yangilangan",
    openBtn: "To'liq o'qish", downloadBtn: "PDF yuklash", shareBtn: "Ulashish",
    starBtn: "Tanlash", unstarBtn: "Olib tashlash", printBtn: "Chop etish",
    starredMsg: "Tanlanganlar ro'yxatiga qo'shildi", unstarredMsg: "Ro'yxatdan olib tashlandi",
    copiedMsg: "Havola nusxalandi", notFound: "Ko'rsatmalar topilmadi", notFoundHint: "Qidiruv so'zini o'zgartiring",
    evidenceLabel: "Dalil darajasi", favTab: "Tanlangan", allTab: "Barchasi", recentTab: "Yangi",
    noFavorites: "Tanlangan ko'rsatmalar yo'q. Yulduzchani bosing.", disclaimer: "* Bu ko'rsatmalar faqat ma'lumot uchun. Klinik qaror qabul qilishda mutaxassis bilan maslahatlashing.",
  },
  uz_cyrillic: {
    title: "Клиник Кўрсатмалар", subtitle: "та тиббий кўрсатма мавжуд",
    searchPlaceholder: "Кўрсатма номи, касаллик ёки мутахассислик...",
    allCategories: "Барча соҳалар", results: "та натижа",
    keyPoints: "Асосий қоидалар", source: "Манба", year: "Йил", updated: "Янгиланган",
    openBtn: "Тўлиқ ўқиш", downloadBtn: "PDF юклаш", shareBtn: "Улашиш",
    starBtn: "Танлаш", unstarBtn: "Олиб ташлаш", printBtn: "Чоп этиш",
    starredMsg: "Танланганлар рўйхатига қўшилди", unstarredMsg: "Рўйхатдан олиб ташланди",
    copiedMsg: "Ҳавола нусхаланди", notFound: "Кўрсатмалар топилмади", notFoundHint: "Қидируш сўзини ўзгартиринг",
    evidenceLabel: "Далил даражаси", favTab: "Танланган", allTab: "Барчаси", recentTab: "Янги",
    noFavorites: "Танланган кўрсатмалар йўқ. Юлдузчани босинг.", disclaimer: "* Бу кўрсатмалар фақат маълумот учун. Клиник қарор қабул қилишда мутахассис билан маслаҳатлашинг.",
  },
  ru: {
    title: "Клинические рекомендации", subtitle: "медицинских рекомендаций доступно",
    searchPlaceholder: "Название, диагноз или специальность...",
    allCategories: "Все специальности", results: "результатов",
    keyPoints: "Ключевые положения", source: "Источник", year: "Год", updated: "Обновлено",
    openBtn: "Читать полностью", downloadBtn: "Скачать PDF", shareBtn: "Поделиться",
    starBtn: "В избранное", unstarBtn: "Убрать", printBtn: "Печать",
    starredMsg: "Добавлено в избранное", unstarredMsg: "Удалено из избранного",
    copiedMsg: "Ссылка скопирована", notFound: "Рекомендации не найдены", notFoundHint: "Измените запрос",
    evidenceLabel: "Уровень доказательности", favTab: "Избранное", allTab: "Все", recentTab: "Новые",
    noFavorites: "Нет избранных рекомендаций. Нажмите на звёздочку.", disclaimer: "* Рекомендации предназначены только для справки. Для принятия клинических решений консультируйтесь со специалистом.",
  },
  en: {
    title: "Clinical Guidelines", subtitle: "medical guidelines available",
    searchPlaceholder: "Guideline title, condition or specialty...",
    allCategories: "All specialties", results: "results",
    keyPoints: "Key points", source: "Source", year: "Year", updated: "Updated",
    openBtn: "Read full text", downloadBtn: "Download PDF", shareBtn: "Share",
    starBtn: "Star", unstarBtn: "Unstar", printBtn: "Print",
    starredMsg: "Added to favorites", unstarredMsg: "Removed from favorites",
    copiedMsg: "Link copied", notFound: "No guidelines found", notFoundHint: "Try a different search",
    evidenceLabel: "Evidence level", favTab: "Favorites", allTab: "All", recentTab: "Recent",
    noFavorites: "No starred guidelines. Click the star icon.", disclaimer: "* Guidelines are for reference only. Consult a specialist for clinical decision-making.",
  },
  kk: {
    title: "Клиникалық Нұсқаулар", subtitle: "медициналық нұсқаулар қол жетімді",
    searchPlaceholder: "Нұсқаулық аты, ауру немесе мамандық...",
    allCategories: "Барлық мамандықтар", results: "нәтиже",
    keyPoints: "Негізгі қағидалар", source: "Дереккөз", year: "Жыл", updated: "Жаңартылды",
    openBtn: "Толық оқу", downloadBtn: "PDF жүктеу", shareBtn: "Бөлісу",
    starBtn: "Таңдау", unstarBtn: "Жою", printBtn: "Басып шығару",
    starredMsg: "Таңдаулыларға қосылды", unstarredMsg: "Таңдаулылардан жойылды",
    copiedMsg: "Сілтеме көшірілді", notFound: "Нұсқаулар табылмады", notFoundHint: "Іздеуді өзгертіңіз",
    evidenceLabel: "Дәлелдеме деңгейі", favTab: "Таңдаулылар", allTab: "Барлығы", recentTab: "Жаңа",
    noFavorites: "Таңдаулы нұсқаулар жоқ. Жұлдызды басыңыз.", disclaimer: "* Нұсқаулар тек анықтама үшін. Клиникалық шешім қабылдауда маманмен кеңесіңіз.",
  },
};

interface Guideline {
  id: string; title: string; category: string; source: string; year: number;
  summary: string; keyPoints: string[]; evidence: 'A' | 'B' | 'C'; url?: string; isNew?: boolean;
}

const EVIDENCE_COLORS = { A: 'bg-green-100 text-green-700', B: 'bg-blue-100 text-blue-700', C: 'bg-yellow-100 text-yellow-700' };

const GUIDELINES: Guideline[] = [
  { id: 'g1', title: 'Arterial Gipertoniya: Tashxis va Davolash', category: 'Kardiologiya', source: "O'zbekiston SSV + ESC/ESH", year: 2024, summary: "Kattalar arterial gipertenziyasini boshqarish bo'yicha milliy standart.", keyPoints: ["Gipertoniya: ≥140/90 mmHg (ofis o'lchovi)", "1-qator: AKF inhibitori yoki ARB + kaltsiy blokatori", "Maqsad BP: <130/80 mmHg (18-65 yosh)", "Hayot tarzini o'zgartirish — barcha holatlarda", "Klinik tekshiruv: har 3-6 oyda"], evidence: 'A' },
  { id: 'g2', title: "2-Tip Qandli Diabet Menejmenti", category: 'Endokrinologiya', source: "SSV + ADA 2024", year: 2024, summary: "2-tip CD bo'lgan kattalar uchun glikemik nazorat va komorbiditlarni boshqarish.", keyPoints: ["HbA1c maqsad: <7% (ko'pchilik bemorlar uchun)", "Metformin — birinchi qator terapiya", "SGLT2 inhibitori yoki GLP-1 RA — yurak/buyrak kasalligida", "Qon bosimini nazorat qilish: <130/80 mmHg", "Diabetik retinopatiyanı yılda bir tekshirish"], evidence: 'A' },
  { id: 'g3', title: "O'tkir Miokard Infarkti (STEMI)", category: 'Kardiologiya', source: "ESC 2023", year: 2023, summary: "STEMI diagnoistikasi, reanimatsiya va uzoq muddatli boshqarish standartlari.", keyPoints: ["Tibbiy aloqa: EKG ≤10 daqiqa ichida", "PCI maqsad vaqti: ≤90 daqiqa (birinchi tibbiy kontaktdan)", "Fibrinoliz: PCI <120 daqiqada amalga oshirilmasa", "Antiplatelet: aspirin + P2Y12 inhibitori", "ACEI/ARB va beta-bloker: barcha STEMI da"], evidence: 'A', isNew: true },
  { id: 'g4', title: "Jamoat orttirilgan Pnevmoniya", category: "Pulmonologiya", source: "O'zbekiston SSV + ERS/IDSA", year: 2024, summary: "Jamoat orttirilgan pnevmoniyani klassifikatsiya, tashxis va antibiotik tanlash.", keyPoints: ["CRB-65 balini baholash — shifoxonaga yotqizish qaroriga", "Hafif: amoksitsillin 3g/kun yoki azitromitsin", "O'rta og'ir: beta-laktam + makrolid", "Og'ir: birinchi kunda keng spektrli antibiotiklar IV", "Profilaktika: pnevmokokk vaksina ≥65 yosh"], evidence: 'B' },
  { id: 'g5', title: "Oshqozon-ichak Refluks Kasalligi (GERD)", category: "Gastroenterologiya", source: "ACG 2022", year: 2022, summary: "GERD diagnostikasi va terapevtik yondashuvlar.", keyPoints: ["Dastlabki tashxis: klinik tahlil + PPI sinovdan o'tkazish", "PPI: omeprazol 20-40mg/kun 8 hafta", "Endoskopiya: alarm simptomlari bo'lsa", "Hayot tarzi: og'irlikni kamaytirish, tamaki tashish", "Barret pishlog'i: 3-5 yilda nazorat EGDS"], evidence: 'B' },
  { id: 'g6', title: "Xavflilik omillarini oldini olish: Statistin terapiyasi", category: "Kardiologiya", source: "ESC 2021 + AHA/ACC", year: 2021, summary: "ASCVD xavfi yuqori bemorlarda lipidlarni pasaytirish strategiyalari.", keyPoints: ["Yuqori xavf: LDL maqsad <1.8 mmol/L", "Juda yuqori xavf: LDL <1.4 mmol/L", "Intensiv statin terapiyasi (atorvastatin 40-80mg) birinchi qator", "Ezetimib: statin monokuri yetarli bo'lmasa qo'shimcha", "PCSK9 inhibitori: hali ham maqsadga erishilmasa"], evidence: 'A' },
  { id: 'g7', title: "Ruhiy sog'liqni saqlash: depressiya davolash", category: "Psixiatriya", source: "WHO + O'zbekiston SSV", year: 2023, summary: "Katta depressiv buzilishni tashxislash va davolash protokoli.", keyPoints: ["PHQ-9 bilan skrining", "Yengil: psixoterapiya (kognitiv-xulq-atvor)", "O'rta-og'ir: SSRI/SNRI + psixoterapiya", "Dori: kamida 6-9 oy davom ettirilsin", "Suitsidal xavf baholash: har bir tashrif"], evidence: 'B', isNew: true },
];

const CATEGORIES = Array.from(new Set(GUIDELINES.map((g) => g.category)));
type Tab = 'all' | 'recent' | 'starred';

export default function GuidelinesPage() {
  const { lang } = useLanguage();
  const tx = L[lang as LK] ?? L.uz;

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<Tab>('all');

  const filtered = useMemo(() => {
    let list = GUIDELINES;
    if (tab === 'starred') list = list.filter((g) => starred.has(g.id));
    if (tab === 'recent') list = list.filter((g) => g.isNew);
    const q = search.toLowerCase();
    if (q) list = list.filter((g) => g.title.toLowerCase().includes(q) || g.category.toLowerCase().includes(q) || g.summary.toLowerCase().includes(q));
    if (category !== 'all') list = list.filter((g) => g.category === category);
    return list;
  }, [search, category, tab, starred]);

  function toggleStar(id: string) {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast.info(tx.unstarredMsg); }
      else { next.add(id); toast.success(tx.starredMsg); }
      return next;
    });
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'all', label: tx.allTab, count: GUIDELINES.length },
    { key: 'recent', label: tx.recentTab, count: GUIDELINES.filter((g) => g.isNew).length },
    { key: 'starred', label: tx.favTab, count: starred.size },
  ];

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />{tx.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{GUIDELINES.length} {tx.subtitle}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
          <Printer className="w-3.5 h-3.5" />{tx.printBtn}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map(({ key, label, count }) => (
          <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {label}
            <span className={`rounded-full px-1.5 text-xs font-bold ${tab === key ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tx.searchPlaceholder} className="pl-9" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 rounded-md border border-input px-2 text-sm bg-background">
            <option value="all">{tx.allCategories}</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <p className="text-xs text-slate-400">{filtered.length} {tx.results}</p>

      {/* No favorites */}
      {tab === 'starred' && filtered.length === 0 && (
        <div className="text-center py-16 border border-dashed rounded-xl">
          <Star className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="text-slate-500">{tx.noFavorites}</p>
        </div>
      )}

      {/* Guidelines list */}
      <div className="space-y-3">
        {filtered.map((g) => (
          <Card key={g.id} className={`overflow-hidden hover:shadow-sm transition-all ${g.isNew ? 'border-indigo-100' : ''}`}>
            <button className="w-full text-left" onClick={() => setExpanded(expanded === g.id ? null : g.id)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {g.isNew && <Badge className="bg-indigo-100 text-indigo-700 text-xs py-0">NEW</Badge>}
                      <span className="font-semibold text-slate-800">{g.title}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <Badge variant="secondary" className="text-xs">{g.category}</Badge>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{g.year}</span>
                      <span>{g.source}</span>
                      <span className={`rounded-full px-2 py-0.5 font-bold text-xs ${EVIDENCE_COLORS[g.evidence]}`}>{tx.evidenceLabel}: {g.evidence}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">{g.summary}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); toggleStar(g.id); }} className="p-1.5 rounded-lg hover:bg-yellow-50">
                      {starred.has(g.id) ? <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> : <StarOff className="w-4 h-4 text-slate-300 hover:text-yellow-400" />}
                    </button>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded === g.id ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </CardContent>
            </button>

            {expanded === g.id && (
              <div className="border-t border-slate-100 bg-slate-50/50 px-4 pb-4 pt-3 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />{tx.keyPoints}
                  </p>
                  <ul className="space-y-1.5">
                    {g.keyPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">{i + 1}</span>
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
                  {g.url && (
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={() => window.open(g.url, '_blank')}>
                      <ExternalLink className="w-3 h-3" />{tx.openBtn}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={() => toast.info(tx.downloadBtn)}>
                    <Download className="w-3 h-3" />{tx.downloadBtn}
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={() => { navigator.clipboard.writeText(g.title); toast.success(tx.copiedMsg); }}>
                    <Share2 className="w-3 h-3" />{tx.shareBtn}
                  </Button>
                </div>
                <p className="text-xs text-slate-400 italic flex items-center gap-1"><AlertCircle className="w-3 h-3" />{tx.disclaimer}</p>
              </div>
            )}
          </Card>
        ))}

        {filtered.length === 0 && tab !== 'starred' && (
          <div className="text-center py-16 border border-dashed rounded-xl">
            <Info className="w-12 h-12 mx-auto mb-3 text-slate-200" />
            <p className="font-medium text-slate-700">{tx.notFound}</p>
            <p className="text-xs text-slate-400 mt-1">{tx.notFoundHint}</p>
          </div>
        )}
      </div>
    </div>
  );
}
