'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Pill, Search, ChevronDown, AlertTriangle, Info,
  BookOpen, Download, Star, StarOff, X, Filter,
  ShieldAlert, Activity, Printer, Copy,
} from 'lucide-react';

type LK = 'uz' | 'uz_cyrillic' | 'ru' | 'en' | 'kk';

const L: Record<LK, {
  title: string; subtitle: string; searchPlaceholder: string;
  allCategories: string; allTypes: string; rxOnly: string; otcOnly: string;
  results: string; rxBadge: string; otcBadge: string;
  indications: string; contraindications: string; sideEffects: string;
  disclaimer: string; favoriteAdded: string; favoriteRemoved: string;
  notFound: string; notFoundHint: string; copyMsg: string;
  favoritesTab: string; allTab: string; interactionsTab: string;
  printBtn: string; exportBtn: string; addToRx: string;
  dosageLabel: string; formLabel: string; categoryLabel: string;
  noFavorites: string; interactionCheck: string; interactionResult: string;
}> = {
  uz: {
    title: "Dorilar Formulyari", subtitle: "ta dori ma'lumotlar bazasi",
    searchPlaceholder: "INN nomi, brend yoki ko'rsatma bo'yicha qidirish...",
    allCategories: "Barcha kategoriyalar", allTypes: "Barcha", rxOnly: "Retsept bilan", otcOnly: "Retseptsiz (OTC)",
    results: "ta natija", rxBadge: "Retsept", otcBadge: "OTC",
    indications: "Ko'rsatmalar", contraindications: "Qarshi ko'rsatmalar", sideEffects: "Nojo'ya ta'sirlar",
    disclaimer: "* Bu ma'lumot faqat ma'lumot maqsadida. Retsept yozishda rasmiy qo'llanmadan foydalaning.",
    favoriteAdded: "Sevimlilar ro'yxatiga qo'shildi", favoriteRemoved: "Sevimlilardan olib tashlandi",
    notFound: "Dori topilmadi", notFoundHint: "Qidiruv so'zini o'zgartiring",
    copyMsg: "Nusxa ko'chirildi", favoritesTab: "Sevimlilar", allTab: "Barchasi", interactionsTab: "Ta'sirlar",
    printBtn: "Chop etish", exportBtn: "PDF yuklash", addToRx: "Retseptga qo'shish",
    dosageLabel: "Dozasi", formLabel: "Shakli", categoryLabel: "Kategoriya",
    noFavorites: "Sevimli dorilar yo'q. Yulduzchani bosing.", interactionCheck: "Ta'sirini tekshirish",
    interactionResult: "2 dori o'rtasida o'zaro ta'sir topildi. Diqqat bilan foydalaning.",
  },
  uz_cyrillic: {
    title: "Дорилар Формуляри", subtitle: "та дори маълумотлар базаси",
    searchPlaceholder: "INN номи, бренд ёки кўрсатма бўйича қидириш...",
    allCategories: "Барча категориялар", allTypes: "Барчаси", rxOnly: "Рецепт билан", otcOnly: "Рецептсиз (OTC)",
    results: "та натижа", rxBadge: "Рецепт", otcBadge: "OTC",
    indications: "Кўрсатмалар", contraindications: "Қарши кўрсатмалар", sideEffects: "Ножўя таъсирлар",
    disclaimer: "* Бу маълумот фақат маълумот мақсадида. Рецепт ёзишда расмий қўлланмадан фойдаланинг.",
    favoriteAdded: "Севимлилар рўйхатига қўшилди", favoriteRemoved: "Севимлилардан олиб ташланди",
    notFound: "Дори топилмади", notFoundHint: "Қидируш сўзини ўзгартиринг",
    copyMsg: "Нусха кўчирилди", favoritesTab: "Севимлилар", allTab: "Барчаси", interactionsTab: "Таъсирлар",
    printBtn: "Чоп этиш", exportBtn: "PDF юклаш", addToRx: "Рецептга қўшиш",
    dosageLabel: "Дозаси", formLabel: "Шакли", categoryLabel: "Категория",
    noFavorites: "Севимли дорилар йўқ. Юлдузчани босинг.", interactionCheck: "Таъсирини текшириш",
    interactionResult: "2 дори ўртасида ўзаро таъсир топилди. Диққат билан фойдаланинг.",
  },
  ru: {
    title: "Формуляр препаратов", subtitle: "препаратов в базе данных",
    searchPlaceholder: "Поиск по МНН, торговому названию или показанию...",
    allCategories: "Все категории", allTypes: "Все", rxOnly: "По рецепту", otcOnly: "Без рецепта (OTC)",
    results: "результатов", rxBadge: "Рецепт", otcBadge: "OTC",
    indications: "Показания", contraindications: "Противопоказания", sideEffects: "Побочные эффекты",
    disclaimer: "* Информация приведена только в справочных целях. При выписке рецепта используйте официальные руководства.",
    favoriteAdded: "Добавлено в избранное", favoriteRemoved: "Удалено из избранного",
    notFound: "Препарат не найден", notFoundHint: "Измените поисковый запрос",
    copyMsg: "Скопировано", favoritesTab: "Избранное", allTab: "Все", interactionsTab: "Взаимодействия",
    printBtn: "Печать", exportBtn: "Скачать PDF", addToRx: "Добавить в рецепт",
    dosageLabel: "Доза", formLabel: "Форма", categoryLabel: "Категория",
    noFavorites: "Нет избранных препаратов. Нажмите на звёздочку.", interactionCheck: "Проверить взаимодействие",
    interactionResult: "Обнаружено взаимодействие между 2 препаратами. Используйте с осторожностью.",
  },
  en: {
    title: "Drug Formulary", subtitle: "drugs in the database",
    searchPlaceholder: "Search by INN, brand name or indication...",
    allCategories: "All categories", allTypes: "All", rxOnly: "Prescription only", otcOnly: "Over the counter (OTC)",
    results: "results", rxBadge: "Rx", otcBadge: "OTC",
    indications: "Indications", contraindications: "Contraindications", sideEffects: "Side effects",
    disclaimer: "* This information is for reference only. Use official guidelines when prescribing.",
    favoriteAdded: "Added to favorites", favoriteRemoved: "Removed from favorites",
    notFound: "Drug not found", notFoundHint: "Try a different search term",
    copyMsg: "Copied", favoritesTab: "Favorites", allTab: "All", interactionsTab: "Interactions",
    printBtn: "Print", exportBtn: "Download PDF", addToRx: "Add to prescription",
    dosageLabel: "Dosage", formLabel: "Form", categoryLabel: "Category",
    noFavorites: "No favorite drugs. Click the star icon.", interactionCheck: "Check interactions",
    interactionResult: "Interaction found between 2 drugs. Use with caution.",
  },
  kk: {
    title: "Дәрілер Формуляры", subtitle: "дәрі мәліметтер базасында",
    searchPlaceholder: "INN, брендтік ат немесе көрсеткіш бойынша іздеу...",
    allCategories: "Барлық санаттар", allTypes: "Барлығы", rxOnly: "Рецепт бойынша", otcOnly: "Рецептсіз (OTC)",
    results: "нәтиже", rxBadge: "Рецепт", otcBadge: "OTC",
    indications: "Көрсеткіштер", contraindications: "Қарсы көрсеткіштер", sideEffects: "Жанама әсерлер",
    disclaimer: "* Бұл ақпарат тек анықтамалық мақсатта. Рецепт жазғанда ресми нұсқаулықты пайдаланыңыз.",
    favoriteAdded: "Таңдаулыларға қосылды", favoriteRemoved: "Таңдаулылардан жойылды",
    notFound: "Дәрі табылмады", notFoundHint: "Іздеу сөзін өзгертіңіз",
    copyMsg: "Көшірілді", favoritesTab: "Таңдаулылар", allTab: "Барлығы", interactionsTab: "Өзара әсерлер",
    printBtn: "Басып шығару", exportBtn: "PDF жүктеу", addToRx: "Рецептке қосу",
    dosageLabel: "Дозасы", formLabel: "Формасы", categoryLabel: "Санат",
    noFavorites: "Таңдаулы дәрілер жоқ. Жұлдызды басыңыз.", interactionCheck: "Өзара әсерін тексеру",
    interactionResult: "2 дәрі арасында өзара әсер табылды. Абайлап пайдаланыңыз.",
  },
};

interface Drug {
  inn: string; brandName: string; category: string; form: string;
  dosage: string; indication: string; contraindication: string;
  sideEffects: string; rx: boolean; pregnancy?: string; renal?: string;
}

const DRUGS: Drug[] = [
  { inn: 'Amoxicillin', brandName: 'Amoxil, Fleming', category: 'Antibiotik', form: 'Kapsula', dosage: '500mg × 3/kun, 7-10 kun', indication: "Nafas yo'li, siydik yo'li infeksiyalari, otit", contraindication: 'Penitsillin allergiyasi', sideEffects: "Ko'ngil aynish, diareya, temir toshma", rx: true, pregnancy: 'B', renal: 'Dozani kamaytiring' },
  { inn: 'Ibuprofen', brandName: 'Nurofen, Ibufen', category: 'YAQAM', form: 'Tablet', dosage: '400-600mg × 3-4/kun', indication: "Og'riq, isitma, yallig'lanish, artrit", contraindication: "Oshqozon yarasi, buyrak yetishmovchiligi", sideEffects: "GI bezovtalik, bosh og'riq, qon bosimi oshishi", rx: false, pregnancy: 'C/D', renal: 'Ehtiyotkorlik bilan' },
  { inn: 'Metformin', brandName: 'Glucophage, Siofor', category: 'Antidiabetik', form: 'Tablet', dosage: '500-1000mg × 2-3/kun', indication: '2-tip qandli diabet', contraindication: "Buyrak yetishmovchiligi (GFR<30), jigar kasalligi", sideEffects: "Ko'ngil aynish, qorin og'riq, laktik atsidoz (kam)", rx: true, pregnancy: 'B' },
  { inn: 'Atorvastatin', brandName: 'Liprimar, Atoris', category: 'Statin', form: 'Tablet', dosage: '10-80mg × 1/kun (kechasi)', indication: 'Yuqori xolesterin, yurak kasalliklari profilaktikasi', contraindication: 'Jigar kasalligi, homiladorlik', sideEffects: "Mushaklarda og'riq, jigar fermentlari oshishi", rx: true, pregnancy: 'X' },
  { inn: 'Omeprazole', brandName: 'Losek, Omez', category: 'PPI', form: 'Kapsula', dosage: '20-40mg × 1-2/kun', indication: 'Oshqozon yarasi, GERD, H.pylori eradikatsiyasi', contraindication: 'Allergiya', sideEffects: "Bosh og'riq, qorin og'riq, uzoq muddatda magnesiy kamligi", rx: false },
  { inn: 'Amlodipine', brandName: 'Norvasc, Tenox', category: 'Kaltsiy blokatori', form: 'Tablet', dosage: '5-10mg × 1/kun', indication: 'Gipertoniya, stabil stenokardiya', contraindication: "Og'ir aortik stenoz", sideEffects: "Oyoq shishi, bosh og'riq, terlash", rx: true, pregnancy: 'C' },
  { inn: 'Cetirizine', brandName: 'Zyrtec, Zodak', category: 'Antihistamin', form: 'Tablet', dosage: '10mg × 1/kun', indication: 'Allergik rinit, eshakemi, atopik dermatit', contraindication: "Og'ir buyrak yetishmovchiligi", sideEffects: "Uyquchanlik, quruq og'iz", rx: false, pregnancy: 'B' },
  { inn: 'Diclofenac', brandName: 'Voltaren, Dikloberl', category: 'YAQAM', form: 'Tablet/Inyeksiya', dosage: '50mg × 2-3/kun', indication: "Artrit, mushaklarda og'riq, postoperativ og'riq", contraindication: "Oshqozon yarasi, yurak yetishmovchiligi", sideEffects: "GI qon ketish, buyrak ta'siri", rx: true, pregnancy: 'C/D' },
  { inn: 'Lisinopril', brandName: 'Diroton, Lisinoton', category: 'AKF inhibitori', form: 'Tablet', dosage: '5-40mg × 1/kun', indication: 'Gipertoniya, yurak yetishmovchiligi, diabetik nefropatiya', contraindication: "Angioneyrotik shish tarixi, homiladorlik", sideEffects: "Yo'tal, giperkalemiya, bosh aylanish", rx: true, pregnancy: 'D' },
  { inn: 'Azithromycin', brandName: 'Sumamed, Azitro', category: 'Antibiotik', form: 'Kapsula', dosage: '500mg × 1/kun, 3-5 kun', indication: 'Atipik pnevmoniya, STI, teri infeksiyalari', contraindication: "Jigar kasalligi, QT uzayishi", sideEffects: "Diareya, ko'ngil aynish, QT uzayishi", rx: true, pregnancy: 'B' },
  { inn: 'Paracetamol', brandName: 'Panadol, Efferalgan', category: 'Analgetik', form: 'Tablet/Sirus', dosage: '500-1000mg × 4-6 soatda, max 4g/kun', indication: "Og'riq, isitma", contraindication: "Og'ir jigar kasalligi, alkogolizm", sideEffects: 'Dozadan oshsa jigar toksikligi', rx: false, pregnancy: 'B' },
  { inn: 'Metronidazole', brandName: 'Flagyl, Klion', category: 'Antibiotik/Protistosid', form: 'Tablet', dosage: '500mg × 3/kun, 7 kun', indication: 'Anaerob infeksiyalar, giardiaz, trixomoniaz', contraindication: 'Homiladorlik 1-trimester', sideEffects: "Ko'ngil aynish, metall ta'm, neyropatiya (uzoq)", rx: true, pregnancy: 'B/C' },
  { inn: 'Furosemide', brandName: 'Lasix, Furon', category: 'Diuretik', form: 'Tablet/Inyeksiya', dosage: '20-80mg × 1-2/kun', indication: "Shish, gipertoniya, yurak/buyrak yetishmovchiligi", contraindication: 'Anuriya, allergiya', sideEffects: 'Gipokaliemiya, dehidratatsiya, ototoksiklik', rx: true, pregnancy: 'C' },
  { inn: 'Insulin Glargine', brandName: 'Lantus, Basaglar', category: 'Insulin', form: 'Inyeksiya', dosage: 'Individual, odatda 10-40 ed/kun', indication: '1 va 2-tip qandli diabet', contraindication: "Gipoglikemiya", sideEffects: "Gipoglikemiya, inyeksiya joyida reaksiya", rx: true, pregnancy: 'B' },
  { inn: 'Warfarin', brandName: 'Coumadin', category: 'Antikoagulyant', form: 'Tablet', dosage: 'INR asosida individual (2-10mg/kun)', indication: 'DVT, AF, tromboz profilaktikasi', contraindication: "Faol qon ketish, homiladorlik", sideEffects: "Qon ketish, INR o'zgarishi, teratogenlik", rx: true, pregnancy: 'X' },
];

const CATEGORIES = Array.from(new Set(DRUGS.map((d) => d.category)));
type Tab = 'all' | 'favorites' | 'interactions';

const PREGNANCY_COLORS: Record<string, string> = {
  A: 'bg-green-100 text-green-700', B: 'bg-blue-100 text-blue-700',
  C: 'bg-yellow-100 text-yellow-700', D: 'bg-orange-100 text-orange-700',
  X: 'bg-red-100 text-red-700',
};

export default function FormularyPage() {
  const { lang } = useLanguage();
  const tx = L[lang as LK] ?? L.uz;

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [rxFilter, setRxFilter] = useState<'all' | 'rx' | 'otc'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<Tab>('all');
  const [interactionDrugs, setInteractionDrugs] = useState<string[]>([]);
  const [interactionResult, setInteractionResult] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = DRUGS;
    if (tab === 'favorites') list = list.filter((d) => favorites.has(d.inn));
    const q = search.toLowerCase();
    list = list.filter((d) => {
      const matchSearch = !q || d.inn.toLowerCase().includes(q) || d.brandName.toLowerCase().includes(q) || d.indication.toLowerCase().includes(q) || d.category.toLowerCase().includes(q);
      const matchCat = catFilter === 'all' || d.category === catFilter;
      const matchRx = rxFilter === 'all' || (rxFilter === 'rx' ? d.rx : !d.rx);
      return matchSearch && matchCat && matchRx;
    });
    return list;
  }, [search, catFilter, rxFilter, tab, favorites]);

  function toggleFavorite(inn: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(inn)) { next.delete(inn); toast.info(tx.favoriteRemoved); }
      else { next.add(inn); toast.success(tx.favoriteAdded); }
      return next;
    });
  }

  function toggleInteraction(inn: string) {
    setInteractionDrugs((prev) => {
      if (prev.includes(inn)) return prev.filter((d) => d !== inn);
      if (prev.length >= 5) return prev;
      return [...prev, inn];
    });
    setInteractionResult(null);
  }

  function checkInteractions() {
    if (interactionDrugs.length < 2) return;
    setInteractionResult(tx.interactionResult);
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'all', label: tx.allTab, count: DRUGS.length },
    { key: 'favorites', label: tx.favoritesTab, count: favorites.size },
    { key: 'interactions', label: tx.interactionsTab, count: interactionDrugs.length },
  ];

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-600" />{tx.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{DRUGS.length} {tx.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5" />{tx.printBtn}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info('PDF...')}>
            <Download className="w-3.5 h-3.5" />{tx.exportBtn}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
            <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${tab === key ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Interaction panel */}
      {tab === 'interactions' && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-600" />{tx.interactionsTab}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500">{tx.interactionCheck}</p>
            <div className="flex flex-wrap gap-2">
              {interactionDrugs.map((d) => (
                <div key={d} className="flex items-center gap-1 bg-white border border-orange-200 rounded-full px-3 py-1 text-sm">
                  {d}
                  <button onClick={() => toggleInteraction(d)} className="text-slate-400 hover:text-red-500 ml-1"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              {interactionDrugs.length === 0 && <p className="text-xs text-slate-400 italic">Formulyardan dorini tanlang...</p>}
            </div>
            {interactionDrugs.length >= 2 && (
              <Button size="sm" onClick={checkInteractions} className="bg-orange-600 hover:bg-orange-700 gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />{tx.interactionCheck}
              </Button>
            )}
            {interactionResult && (
              <div className="bg-orange-100 border border-orange-200 rounded-lg p-3 flex gap-2 text-sm text-orange-800">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{interactionResult}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tx.searchPlaceholder} className="pl-9" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="h-10 rounded-md border border-input px-2 text-sm bg-background">
              <option value="all">{tx.allCategories}</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <select value={rxFilter} onChange={(e) => setRxFilter(e.target.value as 'all' | 'rx' | 'otc')} className="h-10 rounded-md border border-input px-2 text-sm bg-background">
            <option value="all">{tx.allTypes}</option>
            <option value="rx">{tx.rxOnly}</option>
            <option value="otc">{tx.otcOnly}</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-slate-400">{filtered.length} {tx.results}</p>

      {/* Drug cards */}
      {tab === 'favorites' && filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed">
          <Star className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="text-slate-500">{tx.noFavorites}</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((drug) => (
          <Card key={drug.inn} className="overflow-hidden hover:shadow-sm transition-all">
            <button className="w-full text-left" onClick={() => setExpanded(expanded === drug.inn ? null : drug.inn)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-slate-800">{drug.inn}</span>
                      <span className="text-xs text-slate-400">({drug.brandName})</span>
                      <Badge variant="secondary" className="text-xs">{drug.category}</Badge>
                      {drug.rx
                        ? <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">{tx.rxBadge}</Badge>
                        : <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">{tx.otcBadge}</Badge>
                      }
                      {drug.pregnancy && (
                        <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${PREGNANCY_COLORS[drug.pregnancy.charAt(0)] ?? 'bg-slate-100 text-slate-600'}`}>
                          Hom. {drug.pregnancy}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{drug.form} · {drug.dosage}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {tab === 'interactions' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleInteraction(drug.inn); }}
                        className={`p-1.5 rounded-lg text-xs border transition-colors ${interactionDrugs.includes(drug.inn) ? 'bg-orange-100 border-orange-300 text-orange-700' : 'border-slate-200 text-slate-400 hover:border-orange-300'}`}
                      >
                        <Activity className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(drug.inn); }}
                      className="p-1.5 rounded-lg hover:bg-yellow-50 transition-colors"
                    >
                      {favorites.has(drug.inn)
                        ? <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        : <StarOff className="w-4 h-4 text-slate-300" />}
                    </button>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded === drug.inn ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </CardContent>
            </button>

            {expanded === drug.inn && (
              <div className="border-t border-slate-100 bg-slate-50/50 px-4 pb-4 pt-3 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-3 border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                      <Info className="w-3 h-3" />{tx.indications}
                    </p>
                    <p className="text-slate-700 text-sm">{drug.indication}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-orange-100">
                    <p className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-orange-400" />{tx.contraindications}
                    </p>
                    <p className="text-slate-700 text-sm">{drug.contraindication}</p>
                  </div>
                  <div className="sm:col-span-2 bg-white rounded-lg p-3 border border-red-50">
                    <p className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-red-400" />{tx.sideEffects}
                    </p>
                    <p className="text-slate-700 text-sm">{drug.sideEffects}</p>
                  </div>
                  {drug.renal && (
                    <div className="sm:col-span-2 bg-blue-50 rounded-lg p-2.5 border border-blue-100 text-xs text-blue-700">
                      <span className="font-medium">Buyrak yetishmovchiligida:</span> {drug.renal}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={() => { navigator.clipboard.writeText(`${drug.inn} (${drug.brandName}) - ${drug.dosage}`); toast.success(tx.copyMsg); }}>
                    <Copy className="w-3 h-3" />{tx.copyMsg.split(' ')[0]}
                  </Button>
                  <Button size="sm" className="gap-1.5 text-xs h-7 bg-emerald-600 hover:bg-emerald-700" onClick={() => toast.success(tx.addToRx)}>
                    <Pill className="w-3 h-3" />{tx.addToRx}
                  </Button>
                  <p className="text-xs text-slate-400 ml-auto italic hidden sm:block">{tx.disclaimer}</p>
                </div>
              </div>
            )}
          </Card>
        ))}

        {filtered.length === 0 && tab !== 'favorites' && (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed">
            <Pill className="w-12 h-12 mx-auto mb-3 text-slate-200" />
            <p className="font-medium text-slate-700">{tx.notFound}</p>
            <p className="text-xs text-slate-400 mt-1">{tx.notFoundHint}</p>
          </div>
        )}
      </div>
    </div>
  );
}
