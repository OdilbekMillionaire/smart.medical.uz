'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Newspaper, Globe, Clock, ExternalLink, Search, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

interface Article {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string;
}

// ─── Multilingual category definitions ────────────────────────────────────────

type LangKey = 'uz' | 'uz_cyrillic' | 'ru' | 'en' | 'kk';

interface CategoryDef {
  id: string;        // NewsAPI keyword / query slug
  labels: Record<LangKey, string>;
}

const CATEGORIES: CategoryDef[] = [
  {
    id: 'all',
    labels: { uz: 'Barchasi', uz_cyrillic: 'Барчаси', ru: 'Все', en: 'All', kk: 'Barlıǵı' },
  },
  {
    id: 'health',
    labels: { uz: 'Sog\'liqni saqlash', uz_cyrillic: 'Соғлиқни сақлаш', ru: 'Здравоохранение', en: 'Healthcare', kk: 'Densawlıq saqlaw' },
  },
  {
    id: 'medicine',
    labels: { uz: 'Dori-darmon', uz_cyrillic: 'Дори-дармон', ru: 'Фармацевтика', en: 'Pharmaceuticals', kk: 'Dáriger' },
  },
  {
    id: 'cancer',
    labels: { uz: 'Onkologiya', uz_cyrillic: 'Онкология', ru: 'Онкология', en: 'Oncology', kk: 'Onkologiya' },
  },
  {
    id: 'surgery',
    labels: { uz: 'Jarrohlik', uz_cyrillic: 'Жарроҳлик', ru: 'Хирургия', en: 'Surgery', kk: 'Xirurgiya' },
  },
  {
    id: 'mental health',
    labels: { uz: 'Psixologiya', uz_cyrillic: 'Психология', ru: 'Психология', en: 'Mental Health', kk: 'Psixologiya' },
  },
  {
    id: 'vaccine',
    labels: { uz: 'Emlash', uz_cyrillic: 'Эмлаш', ru: 'Вакцинация', en: 'Vaccines', kk: 'Ekpeler' },
  },
  {
    id: 'technology',
    labels: { uz: 'Tibbiy texnologiya', uz_cyrillic: 'Тиббий технология', ru: 'Медтех', en: 'MedTech', kk: 'Medtexnologiya' },
  },
];

const PAGE_LABELS: Record<LangKey, { title: string; subtitle: string; search: string; read: string; refresh: string; noNews: string; error: string }> = {
  uz: { title: 'Jahon Tibbiyot Yangiliklari', subtitle: 'Real-vaqt xalqaro tibbiy maqolalar', search: 'Yangilik qidirish...', read: 'O\'qish', refresh: 'Yangilash', noNews: 'Yangiliklar topilmadi', error: 'Yuklashda xatolik' },
  uz_cyrillic: { title: 'Жаҳон Тиббиёт Янгиликлари', subtitle: 'Real-вақт халқаро тиббий мақолалар', search: 'Янгилик қидириш...', read: 'Ўқиш', refresh: 'Янгилаш', noNews: 'Янгиликлар топилмади', error: 'Юклашда хатолик' },
  ru: { title: 'Мировые медицинские новости', subtitle: 'Международные медицинские статьи в реальном времени', search: 'Поиск новостей...', read: 'Читать', refresh: 'Обновить', noNews: 'Новости не найдены', error: 'Ошибка загрузки' },
  en: { title: 'World Medical News', subtitle: 'Real-time international medical articles', search: 'Search news...', read: 'Read', refresh: 'Refresh', noNews: 'No news found', error: 'Loading error' },
  kk: { title: 'Dúnya Tıbbıy Jańalıqları', subtitle: 'Real-waqıt xalıqaralıq tıbbıy maqalalar', search: 'Jańalıq izdew...', read: 'Oqıw', refresh: 'Jańartıw', noNews: 'Jańalıqlar tabılmadı', error: 'Júklew qatesi' },
};

export default function NewsBoardPage() {
  const { lang } = useLanguage();
  const activeLang = (lang as LangKey) in PAGE_LABELS ? (lang as LangKey) : 'uz';
  const labels = PAGE_LABELS[activeLang];

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const fetchNews = async (category: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ category });
      const res = await fetch(`/api/news?${params}`);
      if (!res.ok) throw new Error(labels.error);
      const data = await res.json() as { articles?: Article[]; error?: string };
      if (data.error) throw new Error(data.error);
      setArticles((data.articles ?? []).filter((a) => a.title !== '[Removed]'));
    } catch (e) {
      setError(e instanceof Error ? e.message : labels.error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNews(activeCategory); }, [activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = articles.filter(
    (a) =>
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-blue-600" />
            {labels.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{labels.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-white px-4 py-2 border rounded-full shadow-sm">
            <Globe className="w-4 h-4 text-emerald-500" /> Live
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchNews(activeCategory)} disabled={loading} className="gap-1.5">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {labels.refresh}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={labels.search}
          className="pl-9"
        />
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setActiveCategory(cat.id); setSearch(''); }}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap text-sm font-medium border transition-all shrink-0 ${
              activeCategory === cat.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {cat.labels[activeLang]}
          </button>
        ))}
      </div>

      {/* Note: news is sourced from international English-language medical sources */}
      <p className="text-xs text-slate-400 italic">
        {activeLang === 'ru' ? '* Новости публикуются на языке оригинала (английский)' :
         activeLang === 'en' ? '* News is sourced from international English-language publications' :
         activeLang === 'uz_cyrillic' ? '* Янгиликлар хорижий инглизча манбалардан олинади' :
         activeLang === 'kk' ? '* Jańalıqlar xalıqaralıq aǵılshın tildegi basılımlardan alınadı' :
         '* Yangiliklar xalqaro inglizcha manbalardan olinadi'}
      </p>

      {/* Error */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-8 text-center text-red-600 flex flex-col items-center">
            <Newspaper className="w-12 h-12 mb-4 opacity-50" />
            <h2 className="text-lg font-bold mb-2">{labels.error}!</h2>
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchNews(activeCategory)} className="mt-4">
              {labels.refresh}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="break-inside-avoid">
              <Skeleton className="h-64 rounded-xl w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-20 text-slate-500 bg-white rounded-xl border border-dashed">
          {labels.noNews}
        </div>
      )}

      {/* Articles grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 pb-8">
          {filtered.map((article, i) => (
            <div key={i} className="break-inside-avoid">
              <Card className="overflow-hidden hover:shadow-lg transition-all group border-slate-200 bg-white">
                {article.urlToImage ? (
                  <div className="w-full h-48 bg-slate-100 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={article.urlToImage}
                      alt={article.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow">
                      {article.source.name}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-1 bg-blue-600" />
                )}
                <CardContent className="p-5">
                  {!article.urlToImage && (
                    <div className="text-xs font-bold text-blue-600 mb-2">{article.source.name}</div>
                  )}
                  <h3 className="font-bold text-slate-800 leading-snug mb-3 group-hover:text-blue-700 transition-colors">
                    {article.title}
                  </h3>
                  {article.description && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                      {article.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(article.publishedAt).toLocaleDateString('ru-RU', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 h-7 font-semibold">
                        {labels.read}
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
