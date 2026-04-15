'use client';

import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getDocs, collection } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import type { Document, ComplianceItem, Request } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, FileText, Clock, MessageSquare, UsersRound, ChevronRight, X,
  Filter, History, TrendingUp, ShieldCheck, AlertCircle,
} from 'lucide-react';

type LK = 'uz' | 'uz_cyrillic' | 'ru' | 'en' | 'kk';
const L: Record<LK, {
  title: string; subtitle: string; searchPlaceholder: string;
  searchBtn: string; clearBtn: string; allTypes: string;
  typeDoc: string; typeCompliance: string; typeRequest: string; typeForum: string;
  resultsFor: string; noResults: string; noResultsHint: string;
  recentSearches: string; clearHistory: string; popularSearches: string;
  docResult: string; complianceResult: string; requestResult: string; forumResult: string;
  viewBtn: string; total: string; loading: string; filterLabel: string;
  advancedSearch: string; dateFrom: string; dateTo: string;
  applyFilter: string; resetFilter: string; sortBy: string;
  sortRelevance: string; sortDate: string; sortTitle: string;
}> = {
  uz: {
    title: "Global Qidiruv", subtitle: "Platforma bo'ylab barcha ma'lumotlarni qidiring",
    searchPlaceholder: "Hujjat, muddatlar, murojaatlar, forum...",
    searchBtn: "Qidirish", clearBtn: "Tozalash", allTypes: "Barcha turlar",
    typeDoc: "Hujjatlar", typeCompliance: "Muddatlar", typeRequest: "Murojaatlar", typeForum: "Forum",
    resultsFor: "natija topildi:", noResults: "Hech narsa topilmadi",
    noResultsHint: "Boshqa kalit so'z bilan urinib ko'ring",
    recentSearches: "Oxirgi qidiruvlar", clearHistory: "Tozalash",
    popularSearches: "Mashhur qidiruvlar",
    docResult: "Hujjat", complianceResult: "Muddat", requestResult: "Murojaat", forumResult: "Forum posti",
    viewBtn: "Ko'rish", total: "ta natija", loading: "Qidirilmoqda...",
    filterLabel: "Filter", advancedSearch: "Kengaytirilgan qidiruv",
    dateFrom: "Sanadan", dateTo: "Sanagacha",
    applyFilter: "Qo'llash", resetFilter: "Bekor", sortBy: "Saralash",
    sortRelevance: "Dolzarblik", sortDate: "Sana", sortTitle: "Nom",
  },
  uz_cyrillic: {
    title: "Глобал Қидирув", subtitle: "Платформа бўйлаб барча маълумотларни қидиринг",
    searchPlaceholder: "Ҳужжат, муддатлар, мурожаатлар, форум...",
    searchBtn: "Қидириш", clearBtn: "Тозалаш", allTypes: "Барча турлар",
    typeDoc: "Ҳужжатлар", typeCompliance: "Муддатлар", typeRequest: "Мурожаатлар", typeForum: "Форум",
    resultsFor: "натижа топилди:", noResults: "Ҳеч нарса топилмади",
    noResultsHint: "Бошқа калит сўз билан уриниб кўринг",
    recentSearches: "Охирги қидирувлар", clearHistory: "Тозалаш",
    popularSearches: "Машҳур қидирувлар",
    docResult: "Ҳужжат", complianceResult: "Муддат", requestResult: "Мурожаат", forumResult: "Форум пости",
    viewBtn: "Кўриш", total: "та натижа", loading: "Қидирилмоқда...",
    filterLabel: "Фильтр", advancedSearch: "Кенгайтирилган қидирув",
    dateFrom: "Санадан", dateTo: "Санагача",
    applyFilter: "Қўллаш", resetFilter: "Бекор", sortBy: "Саралаш",
    sortRelevance: "Долзарблик", sortDate: "Сана", sortTitle: "Ном",
  },
  ru: {
    title: "Глобальный поиск", subtitle: "Поиск по всем данным платформы",
    searchPlaceholder: "Документы, сроки, обращения, форум...",
    searchBtn: "Поиск", clearBtn: "Очистить", allTypes: "Все типы",
    typeDoc: "Документы", typeCompliance: "Сроки", typeRequest: "Обращения", typeForum: "Форум",
    resultsFor: "результатов по:", noResults: "Ничего не найдено",
    noResultsHint: "Попробуйте другой поисковый запрос",
    recentSearches: "Последние запросы", clearHistory: "Очистить",
    popularSearches: "Популярные запросы",
    docResult: "Документ", complianceResult: "Срок", requestResult: "Обращение", forumResult: "Пост форума",
    viewBtn: "Открыть", total: "результатов", loading: "Поиск...",
    filterLabel: "Фильтр", advancedSearch: "Расширенный поиск",
    dateFrom: "С даты", dateTo: "По дату",
    applyFilter: "Применить", resetFilter: "Сбросить", sortBy: "Сортировка",
    sortRelevance: "По релевантности", sortDate: "По дате", sortTitle: "По названию",
  },
  en: {
    title: "Global Search", subtitle: "Search across all platform data",
    searchPlaceholder: "Documents, deadlines, requests, forum...",
    searchBtn: "Search", clearBtn: "Clear", allTypes: "All types",
    typeDoc: "Documents", typeCompliance: "Compliance", typeRequest: "Requests", typeForum: "Forum",
    resultsFor: "results for:", noResults: "Nothing found",
    noResultsHint: "Try a different search term",
    recentSearches: "Recent searches", clearHistory: "Clear",
    popularSearches: "Popular searches",
    docResult: "Document", complianceResult: "Deadline", requestResult: "Request", forumResult: "Forum post",
    viewBtn: "View", total: "results", loading: "Searching...",
    filterLabel: "Filter", advancedSearch: "Advanced search",
    dateFrom: "From date", dateTo: "To date",
    applyFilter: "Apply", resetFilter: "Reset", sortBy: "Sort by",
    sortRelevance: "Relevance", sortDate: "Date", sortTitle: "Title",
  },
  kk: {
    title: "Жаппай Іздеу", subtitle: "Платформадағы барлық деректерді іздеу",
    searchPlaceholder: "Құжаттар, мерзімдер, өтініштер, форум...",
    searchBtn: "Іздеу", clearBtn: "Тазалау", allTypes: "Барлық түрлер",
    typeDoc: "Құжаттар", typeCompliance: "Мерзімдер", typeRequest: "Өтініштер", typeForum: "Форум",
    resultsFor: "нәтиже табылды:", noResults: "Ештеңе табылмады",
    noResultsHint: "Басқа кілт сөзбен қайталап көріңіз",
    recentSearches: "Соңғы іздеулер", clearHistory: "Тазалау",
    popularSearches: "Танымал іздеулер",
    docResult: "Құжат", complianceResult: "Мерзім", requestResult: "Өтініш", forumResult: "Форум жазбасы",
    viewBtn: "Қарау", total: "нәтиже", loading: "Ізделуде...",
    filterLabel: "Сүзгі", advancedSearch: "Кеңейтілген іздеу",
    dateFrom: "Күнінен", dateTo: "Күніне дейін",
    applyFilter: "Қолдану", resetFilter: "Болдырмау", sortBy: "Сұрыптау",
    sortRelevance: "Өзектілік", sortDate: "Күні", sortTitle: "Аты",
  },
};

type SearchType = 'all' | 'documents' | 'compliance' | 'requests' | 'forum';
type SortType = 'relevance' | 'date' | 'title';

interface SearchResult {
  id: string; type: 'document' | 'compliance' | 'request' | 'forum';
  title: string; excerpt: string; date?: string; status?: string; href: string;
}

const POPULAR_SEARCHES = ['litsenziya', 'sterilizatsiya', 'pnevmoniya', 'malaka oshirish', 'sanitar qoidalar'];

export default function SearchPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const tx = L[lang as LK] ?? L.uz;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [typeFilter, setTypeFilter] = useState<SearchType>('all');
  const [sort, setSort] = useState<SortType>('relevance');
  const [recentSearches, setRecentSearches] = useState<string[]>(['litsenziya', 'sterilizatsiya']);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || !user) return;
    setLoading(true); setSearched(true);
    if (!recentSearches.includes(q)) setRecentSearches((prev) => [q, ...prev].slice(0, 6));
    try {
      const db = getFirebaseDb();
      const all: SearchResult[] = [];
      const lower = q.toLowerCase();

      // Firestore searches
      const [docSnap, compSnap, reqSnap] = await Promise.all([
        getDocs(collection(db, 'documents')),
        getDocs(collection(db, 'compliance')),
        getDocs(collection(db, 'requests')),
      ]);

      docSnap.forEach((d) => {
        const data = d.data() as Document;
        if (data.title?.toLowerCase().includes(lower) || data.content?.toLowerCase().includes(lower)) {
          all.push({ id: d.id, type: 'document', title: data.title, excerpt: data.content?.slice(0, 120) ?? '', date: data.createdAt, status: data.status, href: `/dashboard/documents/${d.id}` });
        }
      });
      compSnap.forEach((d) => {
        const data = d.data() as ComplianceItem;
        if (data.title?.toLowerCase().includes(lower)) {
          all.push({ id: d.id, type: 'compliance', title: data.title, excerpt: `${data.type} · ${data.dueDate}`, date: data.dueDate, status: data.status, href: '/dashboard/compliance' });
        }
      });
      reqSnap.forEach((d) => {
        const data = d.data() as Request;
        if (data.subject?.toLowerCase().includes(lower) || data.body?.toLowerCase().includes(lower)) {
          all.push({ id: d.id, type: 'request', title: data.subject, excerpt: data.body?.slice(0, 120) ?? '', date: data.createdAt, status: data.status, href: `/dashboard/requests/${d.id}` });
        }
      });

      setResults(all);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, [user, recentSearches]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); doSearch(query); };

  const filteredResults = results.filter((r) => {
    if (typeFilter === 'all') return true;
    const map: Record<SearchType, SearchResult['type'] | undefined> = { all: undefined, documents: 'document', compliance: 'compliance', requests: 'request', forum: 'forum' };
    return r.type === map[typeFilter];
  }).sort((a, b) => {
    if (sort === 'title') return a.title.localeCompare(b.title);
    if (sort === 'date') return (b.date ?? '').localeCompare(a.date ?? '');
    return 0;
  });

  const TYPE_ICONS: Record<SearchResult['type'], React.ReactNode> = {
    document: <FileText className="w-4 h-4 text-blue-500" />,
    compliance: <ShieldCheck className="w-4 h-4 text-green-500" />,
    request: <MessageSquare className="w-4 h-4 text-orange-500" />,
    forum: <UsersRound className="w-4 h-4 text-purple-500" />,
  };
  const TYPE_LABELS: Record<SearchResult['type'], string> = {
    document: tx.typeDoc, compliance: tx.typeCompliance, request: tx.typeRequest, forum: tx.typeForum,
  };
  const TYPE_COLORS: Record<SearchResult['type'], string> = {
    document: 'bg-blue-100 text-blue-700', compliance: 'bg-green-100 text-green-700',
    request: 'bg-orange-100 text-orange-700', forum: 'bg-purple-100 text-purple-700',
  };

  const typeTabs: { key: SearchType; label: string }[] = [
    { key: 'all', label: tx.allTypes },
    { key: 'documents', label: tx.typeDoc },
    { key: 'compliance', label: tx.typeCompliance },
    { key: 'requests', label: tx.typeRequest },
    { key: 'forum', label: tx.typeForum },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Search className="w-6 h-6 text-slate-700" />{tx.title}
        </h1>
        <p className="text-sm text-muted-foreground">{tx.subtitle}</p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tx.searchPlaceholder}
              className="pl-10 h-12 text-base"
              autoFocus
            />
            {query && (
              <button type="button" onClick={() => { setQuery(''); setResults([]); setSearched(false); inputRef.current?.focus(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button type="submit" className="h-12 px-6">{tx.searchBtn}</Button>
        </div>

        {/* Advanced search toggle */}
        <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />{tx.advancedSearch}
        </button>

        {showAdvanced && (
          <div className="flex gap-3 flex-wrap bg-slate-50 p-3 rounded-xl border">
            <div>
              <label className="text-xs text-slate-500 block mb-1">{tx.dateFrom}</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-xs w-36" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">{tx.dateTo}</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-xs w-36" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">{tx.sortBy}</label>
              <select value={sort} onChange={(e) => setSort(e.target.value as SortType)} className="h-8 rounded-md border border-input px-2 text-xs bg-background">
                <option value="relevance">{tx.sortRelevance}</option>
                <option value="date">{tx.sortDate}</option>
                <option value="title">{tx.sortTitle}</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" size="sm" className="h-8">{tx.applyFilter}</Button>
              <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => { setDateFrom(''); setDateTo(''); setSort('relevance'); }}>{tx.resetFilter}</Button>
            </div>
          </div>
        )}
      </form>

      {/* Pre-search state */}
      {!searched && !loading && (
        <div className="space-y-5">
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-600 flex items-center gap-1.5"><History className="w-3.5 h-3.5" />{tx.recentSearches}</p>
                <button onClick={() => setRecentSearches([])} className="text-xs text-slate-400 hover:text-red-500">{tx.clearHistory}</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s) => (
                  <button key={s} onClick={() => { setQuery(s); doSearch(s); }} className="px-3 py-1.5 rounded-full border border-slate-200 text-sm text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-slate-600 flex items-center gap-1.5 mb-2"><TrendingUp className="w-3.5 h-3.5" />{tx.popularSearches}</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map((s) => (
                <button key={s} onClick={() => { setQuery(s); doSearch(s); }} className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-sm text-blue-700 hover:bg-blue-100 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500 flex items-center gap-2"><Search className="w-4 h-4 animate-spin" />{tx.loading}</p>
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-800">{filteredResults.length}</span> {tx.total} — &ldquo;{query}&rdquo;
            </p>
            {/* Type filter tabs */}
            <div className="flex gap-1 overflow-x-auto">
              {typeTabs.map(({ key, label }) => (
                <button key={key} onClick={() => setTypeFilter(key)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${typeFilter === key ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filteredResults.length === 0 ? (
            <div className="text-center py-16 border border-dashed rounded-xl">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-200" />
              <p className="font-medium text-slate-700">{tx.noResults}</p>
              <p className="text-sm text-slate-400 mt-1">{tx.noResultsHint}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredResults.map((r) => (
                <Card key={r.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => window.location.href = r.href}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">{TYPE_ICONS[r.type]}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge className={`text-xs py-0 ${TYPE_COLORS[r.type]}`}>{TYPE_LABELS[r.type]}</Badge>
                        {r.status && <Badge variant="secondary" className="text-xs py-0">{r.status}</Badge>}
                      </div>
                      <p className="font-medium text-slate-800 truncate">{r.title}</p>
                      <p className="text-sm text-slate-500 line-clamp-2 mt-0.5">{r.excerpt}</p>
                      {r.date && (
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />{r.date}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
