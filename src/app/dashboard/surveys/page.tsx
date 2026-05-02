'use client';

import { useCallback, useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Survey } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Star, MessageSquare, ThumbsUp, BarChart3, Plus, Users, CheckCircle2,
  TrendingUp, Download, Search,
  Calendar, ThumbsDown, Smile, Meh, Frown,
} from 'lucide-react';

type LK = 'uz' | 'uz_cyrillic' | 'ru' | 'en' | 'kk';

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

const L: Record<LK, {
  title: string; subtitle: string; writeReview: string; totalReviews: string;
  avgRating: string; recommend: string; thisMonth: string; breakdown: string;
  distribution: string; recentComments: string; myReviews: string; noReviews: string;
  beFirst: string; cancel: string; submit: string; submitting: string;
  overallLabel: string; staffLabel: string; cleanLabel: string; speedLabel: string;
  commentLabel: string; commentPlaceholder: string; recommendQ: string;
  yes: string; no: string; thankYou: string; thankYouMsg: string;
  ratingRequired: string; submitError: string; loadError: string;
  filterAll: string; filterPositive: string; filterNegative: string; filterWithComment: string;
  sortLatest: string; sortHighest: string; sortLowest: string;
  exportCSV: string; searchPlaceholder: string; excellent: string; good: string;
  average: string; poor: string; terrible: string; satisfactionScore: string;
  npsScore: string; trend: string; clinic: string; patient: string;
  anonymous: string; verified: string; helpful: string; reported: string;
  responseRate: string; noComment: string; viewAll: string;
}> = {
  uz: {
    title: "Bemor Baholashuvi",
    subtitle: "Klinika sifati va xizmat darajasini baholash",
    writeReview: "Baholash yozish",
    totalReviews: "Jami baholashlar",
    avgRating: "O'rtacha baho",
    recommend: "Tavsiya etish",
    thisMonth: "Bu oy",
    breakdown: "Baholash tafsilotlari",
    distribution: "Baho taqsimoti",
    recentComments: "So'nggi izohlar",
    myReviews: "Mening baholashlarim",
    noReviews: "Hali baholashlar yo'q",
    beFirst: "Birinchi bo'ling!",
    cancel: "Bekor qilish",
    submit: "Yuborish",
    submitting: "Yuborilmoqda...",
    overallLabel: "Umumiy baho *",
    staffLabel: "Xodimlar munosabati",
    cleanLabel: "Tozalik va tartib",
    speedLabel: "Xizmat tezligi",
    commentLabel: "Izoh (ixtiyoriy)",
    commentPlaceholder: "Tajribangiz haqida yozing...",
    recommendQ: "Bu klinikani tavsiya etasizmi?",
    yes: "Ha",
    no: "Yo'q",
    thankYou: "Rahmat!",
    thankYouMsg: "Baholingiz qabul qilindi va klinika sifatini yaxshilashga yordam beradi.",
    ratingRequired: "Umumiy bahoni tanlang",
    submitError: "Yuborishda xato yuz berdi",
    loadError: "Ma'lumotlarni yuklashda xato",
    filterAll: "Barchasi",
    filterPositive: "Ijobiy (4-5 yulduz)",
    filterNegative: "Salbiy (1-2 yulduz)",
    filterWithComment: "Izohli",
    sortLatest: "Yangi",
    sortHighest: "Yuqori baho",
    sortLowest: "Past baho",
    exportCSV: "CSV yuklash",
    searchPlaceholder: "Izohlarni qidiring...",
    excellent: "A'lo",
    good: "Yaxshi",
    average: "O'rtacha",
    poor: "Yomon",
    terrible: "Juda yomon",
    satisfactionScore: "Qoniqish ko'rsatkichi",
    npsScore: "NPS ko'rsatkichi",
    trend: "Trend",
    clinic: "Klinika",
    patient: "Bemor",
    anonymous: "Anonim",
    verified: "Tasdiqlangan",
    helpful: "Foydali",
    reported: "Shikoyat",
    responseRate: "Javob darajasi",
    noComment: "Izoh yo'q",
    viewAll: "Hammasini ko'rish",
  },
  uz_cyrillic: {
    title: "Бемор Баҳолашуви",
    subtitle: "Клиника сифати ва хизмат даражасини баҳолаш",
    writeReview: "Баҳолаш ёзиш",
    totalReviews: "Жами баҳолашлар",
    avgRating: "Ўртача баҳо",
    recommend: "Тавсия этиш",
    thisMonth: "Бу ой",
    breakdown: "Баҳолаш тафсилотлари",
    distribution: "Баҳо тақсимоти",
    recentComments: "Сўнгги изоҳлар",
    myReviews: "Менинг баҳолашларим",
    noReviews: "Ҳали баҳолашлар йўқ",
    beFirst: "Биринчи бўлинг!",
    cancel: "Бекор қилиш",
    submit: "Юбориш",
    submitting: "Юборилмоқда...",
    overallLabel: "Умумий баҳо *",
    staffLabel: "Ходимлар муносабати",
    cleanLabel: "Тозалик ва тартиб",
    speedLabel: "Хизмат тезлиги",
    commentLabel: "Изоҳ (ихтиёрий)",
    commentPlaceholder: "Тажрибангиз ҳақида ёзинг...",
    recommendQ: "Бу клиникани тавсия этасизми?",
    yes: "Ҳа",
    no: "Йўқ",
    thankYou: "Раҳмат!",
    thankYouMsg: "Баҳоингиз қабул қилинди ва клиника сифатини яхшилашга ёрдам беради.",
    ratingRequired: "Умумий баҳони танланг",
    submitError: "Юборишда хато юз берди",
    loadError: "Маълумотларни юклашда хато",
    filterAll: "Барчаси",
    filterPositive: "Ижобий (4-5 юлдуз)",
    filterNegative: "Салбий (1-2 юлдуз)",
    filterWithComment: "Изоҳли",
    sortLatest: "Янги",
    sortHighest: "Юқори баҳо",
    sortLowest: "Паст баҳо",
    exportCSV: "CSV юклаш",
    searchPlaceholder: "Изоҳларни қидиринг...",
    excellent: "Аъло",
    good: "Яхши",
    average: "Ўртача",
    poor: "Ёмон",
    terrible: "Жуда ёмон",
    satisfactionScore: "Қониқиш кўрсаткичи",
    npsScore: "NPS кўрсаткичи",
    trend: "Тренд",
    clinic: "Клиника",
    patient: "Бемор",
    anonymous: "Аноним",
    verified: "Тасдиқланган",
    helpful: "Фойдали",
    reported: "Шикоят",
    responseRate: "Жавоб даражаси",
    noComment: "Изоҳ йўқ",
    viewAll: "Ҳаммасини кўриш",
  },
  ru: {
    title: "Оценки пациентов",
    subtitle: "Оценка качества клиники и уровня обслуживания",
    writeReview: "Написать отзыв",
    totalReviews: "Всего отзывов",
    avgRating: "Средняя оценка",
    recommend: "Рекомендуют",
    thisMonth: "В этом месяце",
    breakdown: "Детали оценок",
    distribution: "Распределение оценок",
    recentComments: "Последние отзывы",
    myReviews: "Мои отзывы",
    noReviews: "Отзывов пока нет",
    beFirst: "Будьте первым!",
    cancel: "Отмена",
    submit: "Отправить",
    submitting: "Отправка...",
    overallLabel: "Общая оценка *",
    staffLabel: "Отношение персонала",
    cleanLabel: "Чистота и порядок",
    speedLabel: "Скорость обслуживания",
    commentLabel: "Комментарий (необязательно)",
    commentPlaceholder: "Напишите о своём опыте...",
    recommendQ: "Рекомендуете ли эту клинику?",
    yes: "Да",
    no: "Нет",
    thankYou: "Спасибо!",
    thankYouMsg: "Ваш отзыв принят и поможет улучшить качество клиники.",
    ratingRequired: "Выберите общую оценку",
    submitError: "Ошибка при отправке",
    loadError: "Ошибка загрузки данных",
    filterAll: "Все",
    filterPositive: "Положительные (4-5 звёзд)",
    filterNegative: "Отрицательные (1-2 звезды)",
    filterWithComment: "С комментарием",
    sortLatest: "Новые",
    sortHighest: "Высокая оценка",
    sortLowest: "Низкая оценка",
    exportCSV: "Скачать CSV",
    searchPlaceholder: "Поиск по отзывам...",
    excellent: "Отлично",
    good: "Хорошо",
    average: "Средне",
    poor: "Плохо",
    terrible: "Ужасно",
    satisfactionScore: "Индекс удовлетворённости",
    npsScore: "NPS-показатель",
    trend: "Тренд",
    clinic: "Клиника",
    patient: "Пациент",
    anonymous: "Анонимно",
    verified: "Подтверждён",
    helpful: "Полезно",
    reported: "Жалоба",
    responseRate: "Процент ответов",
    noComment: "Без комментария",
    viewAll: "Показать все",
  },
  en: {
    title: "Patient Surveys",
    subtitle: "Evaluate clinic quality and service level",
    writeReview: "Write Review",
    totalReviews: "Total Reviews",
    avgRating: "Avg Rating",
    recommend: "Would Recommend",
    thisMonth: "This Month",
    breakdown: "Rating Breakdown",
    distribution: "Rating Distribution",
    recentComments: "Recent Reviews",
    myReviews: "My Reviews",
    noReviews: "No reviews yet",
    beFirst: "Be the first!",
    cancel: "Cancel",
    submit: "Submit",
    submitting: "Submitting...",
    overallLabel: "Overall Rating *",
    staffLabel: "Staff Attitude",
    cleanLabel: "Cleanliness & Order",
    speedLabel: "Service Speed",
    commentLabel: "Comment (optional)",
    commentPlaceholder: "Write about your experience...",
    recommendQ: "Would you recommend this clinic?",
    yes: "Yes",
    no: "No",
    thankYou: "Thank you!",
    thankYouMsg: "Your review has been received and will help improve clinic quality.",
    ratingRequired: "Please select an overall rating",
    submitError: "Error submitting review",
    loadError: "Error loading data",
    filterAll: "All",
    filterPositive: "Positive (4-5 stars)",
    filterNegative: "Negative (1-2 stars)",
    filterWithComment: "With comment",
    sortLatest: "Latest",
    sortHighest: "Highest rated",
    sortLowest: "Lowest rated",
    exportCSV: "Export CSV",
    searchPlaceholder: "Search reviews...",
    excellent: "Excellent",
    good: "Good",
    average: "Average",
    poor: "Poor",
    terrible: "Terrible",
    satisfactionScore: "Satisfaction Score",
    npsScore: "NPS Score",
    trend: "Trend",
    clinic: "Clinic",
    patient: "Patient",
    anonymous: "Anonymous",
    verified: "Verified",
    helpful: "Helpful",
    reported: "Report",
    responseRate: "Response Rate",
    noComment: "No comment",
    viewAll: "View all",
  },
  kk: {
    title: "Пациент Бағалаулары",
    subtitle: "Клиника сапасы мен қызмет деңгейін бағалау",
    writeReview: "Пікір жазу",
    totalReviews: "Барлық бағалаулар",
    avgRating: "Орташа баға",
    recommend: "Ұсынады",
    thisMonth: "Осы айда",
    breakdown: "Баға мәліметтері",
    distribution: "Баға таралуы",
    recentComments: "Соңғы пікірлер",
    myReviews: "Менің бағалауларым",
    noReviews: "Бағалаулар жоқ",
    beFirst: "Бірінші болыңыз!",
    cancel: "Болдырмау",
    submit: "Жіберу",
    submitting: "Жіберілуде...",
    overallLabel: "Жалпы баға *",
    staffLabel: "Қызметкерлер қатынасы",
    cleanLabel: "Тазалық пен тәртіп",
    speedLabel: "Қызмет жылдамдығы",
    commentLabel: "Пікір (міндетті емес)",
    commentPlaceholder: "Тәжірибеңіз туралы жазыңыз...",
    recommendQ: "Осы клиниканы ұсынасыз ба?",
    yes: "Иә",
    no: "Жоқ",
    thankYou: "Рахмет!",
    thankYouMsg: "Бағалауыңыз қабылданды және клиника сапасын жақсартуға көмектеседі.",
    ratingRequired: "Жалпы бағаны таңдаңыз",
    submitError: "Жіберуде қате орын алды",
    loadError: "Деректерді жүктеуде қате",
    filterAll: "Барлығы",
    filterPositive: "Оң (4-5 жұлдыз)",
    filterNegative: "Теріс (1-2 жұлдыз)",
    filterWithComment: "Пікірмен",
    sortLatest: "Жаңа",
    sortHighest: "Жоғары баға",
    sortLowest: "Төмен баға",
    exportCSV: "CSV жүктеу",
    searchPlaceholder: "Пікірлерді іздеңіз...",
    excellent: "Өте жақсы",
    good: "Жақсы",
    average: "Орташа",
    poor: "Нашар",
    terrible: "Өте нашар",
    satisfactionScore: "Қанағаттану индексі",
    npsScore: "NPS көрсеткіші",
    trend: "Үрдіс",
    clinic: "Клиника",
    patient: "Пациент",
    anonymous: "Анонимді",
    verified: "Расталған",
    helpful: "Пайдалы",
    reported: "Шағым",
    responseRate: "Жауап деңгейі",
    noComment: "Пікір жоқ",
    viewAll: "Барлығын көру",
  },
};

function StarRating({ value, onChange, size = 'md' }: { value: number; onChange?: (v: number) => void; size?: 'sm' | 'md' | 'lg' }) {
  const [hover, setHover] = useState(0);
  const dim = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${dim} transition-colors ${onChange ? 'cursor-pointer' : ''} ${(hover || value) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`}
          onMouseEnter={() => onChange && setHover(star)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange?.(star)}
        />
      ))}
    </div>
  );
}

function avg(surveys: Survey[], key: keyof Survey['ratings']): number {
  if (!surveys.length) return 0;
  return surveys.reduce((s, v) => s + (v.ratings[key] ?? 0), 0) / surveys.length;
}

function RatingBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 5) * 100;
  const barColor = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center gap-1 w-12 shrink-0">
        <span className="text-xs font-bold text-slate-700">{value.toFixed(1)}</span>
        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
      </div>
    </div>
  );
}

function getRatingLabel(score: number, tx: typeof L.uz): string {
  if (score >= 4.5) return tx.excellent;
  if (score >= 3.5) return tx.good;
  if (score >= 2.5) return tx.average;
  if (score >= 1.5) return tx.poor;
  return tx.terrible;
}

function getRatingEmoji(score: number): typeof Smile {
  if (score >= 4) return Smile;
  if (score >= 3) return Meh;
  return Frown;
}

const EMPTY_FORM = { overall: 0, staff: 0, cleanliness: 0, speed: 0, comment: '', wouldRecommend: true };

type FilterType = 'all' | 'positive' | 'negative' | 'withComment';
type SortType = 'latest' | 'highest' | 'lowest';

export default function SurveysPage() {
  const { user, userRole, userProfile } = useAuth();
  const { lang } = useLanguage();
  const tx = L[lang as LK] ?? L.uz;

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('latest');
  const [helpfulPosts, setHelpfulPosts] = useState<Set<string>>(new Set());
  const [expandedReview, setExpandedReview] = useState<string | null>(null);

  const isClinic = userRole === 'clinic';
  const isAdmin = userRole === 'admin';
  const isPatient = userRole === 'patient' || userRole === 'doctor';

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const data = await requestJson<{ surveys: Survey[] }>('/api/surveys', token);
      setSurveys(data.surveys);
    } catch {
      toast.error(tx.loadError);
    } finally {
      setLoading(false);
    }
  }, [tx.loadError, user]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit() {
    if (!user) return;
    if (form.overall === 0) { toast.error(tx.ratingRequired); return; }
    setSaving(true);
    try {
      const token = await user.getIdToken();
      await requestJson<Survey>('/api/surveys', token, {
        method: 'POST',
        body: JSON.stringify({
        clinicId: isClinic ? user.uid : (userProfile as { linkedClinicId?: string } | null)?.linkedClinicId,
        ratings: {
          overall: form.overall,
          staff: form.staff || form.overall,
          cleanliness: form.cleanliness || form.overall,
          speed: form.speed || form.overall,
        },
        comment: form.comment,
        wouldRecommend: form.wouldRecommend,
      }),
      });
      toast.success(tx.thankYou);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setSubmitted(true);
      await load();
    } catch {
      toast.error(tx.submitError);
    } finally {
      setSaving(false);
    }
  }

  function handleExport() {
    const rows = [['Patient', 'Overall', 'Staff', 'Cleanliness', 'Speed', 'Recommend', 'Comment', 'Date']];
    surveys.forEach(s => rows.push([s.patientName, String(s.ratings.overall), String(s.ratings.staff), String(s.ratings.cleanliness), String(s.ratings.speed), s.wouldRecommend ? 'Yes' : 'No', s.comment ?? '', s.createdAt]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'surveys.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  const avgOverall = avg(surveys, 'overall');
  const avgStaff = avg(surveys, 'staff');
  const avgClean = avg(surveys, 'cleanliness');
  const avgSpeed = avg(surveys, 'speed');
  const recommendPct = surveys.length ? (surveys.filter(s => s.wouldRecommend).length / surveys.length) * 100 : 0;
  const thisMonthCount = surveys.filter(s => s.createdAt.startsWith(new Date().toISOString().slice(0, 7))).length;
  const nps = surveys.length ? Math.round(((surveys.filter(s => s.ratings.overall >= 4).length - surveys.filter(s => s.ratings.overall <= 2).length) / surveys.length) * 100) : 0;

  const filteredSurveys = useMemo(() => {
    let list = [...surveys];
    if (filter === 'positive') list = list.filter(s => s.ratings.overall >= 4);
    else if (filter === 'negative') list = list.filter(s => s.ratings.overall <= 2);
    else if (filter === 'withComment') list = list.filter(s => s.comment);
    const q = search.toLowerCase();
    if (q) list = list.filter(s => s.comment?.toLowerCase().includes(q) || s.patientName.toLowerCase().includes(q));
    if (sort === 'highest') list.sort((a, b) => b.ratings.overall - a.ratings.overall);
    else if (sort === 'lowest') list.sort((a, b) => a.ratings.overall - b.ratings.overall);
    else list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return list;
  }, [surveys, filter, sort, search]);

  const EmojiIcon = getRatingEmoji(avgOverall);

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />{tx.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{tx.subtitle}</p>
        </div>
        <div className="flex gap-2">
          {(isClinic || isAdmin) && surveys.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
              <Download className="w-3.5 h-3.5" />{tx.exportCSV}
            </Button>
          )}
          {isPatient && !submitted && (
            <Button onClick={() => setShowForm(v => !v)} className="gap-1.5 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4" />{tx.writeReview}
            </Button>
          )}
        </div>
      </div>

      {/* Thank you banner */}
      {submitted && isPatient && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800">{tx.thankYou}</p>
            <p className="text-sm text-green-700">{tx.thankYouMsg}</p>
          </div>
        </div>
      )}

      {/* Survey form */}
      {showForm && isPatient && (
        <Card className="border-yellow-200 shadow-sm">
          <CardHeader className="pb-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-t-xl">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />{tx.writeReview}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              {([
                { key: 'overall' as const, label: tx.overallLabel },
                { key: 'staff' as const, label: tx.staffLabel },
                { key: 'cleanliness' as const, label: tx.cleanLabel },
                { key: 'speed' as const, label: tx.speedLabel },
              ]).map(({ key, label }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">{label}</label>
                  <div className="flex items-center gap-2">
                    <StarRating value={form[key]} onChange={v => setForm({ ...form, [key]: v })} />
                    {form[key] > 0 && (
                      <span className="text-xs font-medium text-slate-500">
                        {form[key] >= 5 ? tx.excellent : form[key] >= 4 ? tx.good : form[key] >= 3 ? tx.average : form[key] >= 2 ? tx.poor : tx.terrible}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{tx.commentLabel}</label>
              <textarea
                value={form.comment}
                onChange={e => setForm({ ...form, comment: e.target.value })}
                placeholder={tx.commentPlaceholder}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-slate-400 mt-1">{form.comment.length}/500</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-2 block">{tx.recommendQ}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setForm({ ...form, wouldRecommend: true })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${form.wouldRecommend ? 'bg-green-600 text-white border-green-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-green-300'}`}
                >
                  <ThumbsUp className="w-4 h-4" />{tx.yes}
                </button>
                <button
                  onClick={() => setForm({ ...form, wouldRecommend: false })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${!form.wouldRecommend ? 'bg-red-500 text-white border-red-500 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-red-300'}`}
                >
                  <ThumbsDown className="w-4 h-4" />{tx.no}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>{tx.cancel}</Button>
              <Button onClick={handleSubmit} disabled={saving || form.overall === 0} className="bg-indigo-600 hover:bg-indigo-700">
                {saving ? tx.submitting : tx.submit}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        </div>
      )}

      {/* Clinic / Admin stats */}
      {!loading && (isClinic || isAdmin) && surveys.length > 0 && (
        <>
          {/* Hero rating card */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-6 text-white">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <EmojiIcon className="w-8 h-8 text-yellow-300" />
                  <span className="text-5xl font-bold">{avgOverall.toFixed(1)}</span>
                </div>
                <StarRating value={Math.round(avgOverall)} size="md" />
                <p className="text-white/80 text-sm mt-1">{getRatingLabel(avgOverall, tx)}</p>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{surveys.length}</p>
                  <p className="text-white/70 text-xs">{tx.totalReviews}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{recommendPct.toFixed(0)}%</p>
                  <p className="text-white/70 text-xs">{tx.recommend}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{nps > 0 ? '+' : ''}{nps}</p>
                  <p className="text-white/70 text-xs">{tx.npsScore}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: tx.totalReviews, value: surveys.length, icon: Users, color: 'text-blue-600 bg-blue-50', border: 'border-l-blue-400' },
              { label: tx.avgRating, value: avgOverall.toFixed(1), icon: Star, color: 'text-yellow-600 bg-yellow-50', border: 'border-l-yellow-400' },
              { label: tx.recommend, value: `${recommendPct.toFixed(0)}%`, icon: ThumbsUp, color: 'text-green-600 bg-green-50', border: 'border-l-green-400' },
              { label: tx.thisMonth, value: thisMonthCount, icon: Calendar, color: 'text-purple-600 bg-purple-50', border: 'border-l-purple-400' },
            ].map(({ label, value, icon: Icon, color, border }) => (
              <Card key={label} className={`border-l-4 ${border}`}>
                <CardContent className="p-4">
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-slate-800">{value}</p>
                    <div className={`p-1.5 rounded-lg ${color}`}><Icon className="w-4 h-4" /></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-500" />{tx.breakdown}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <RatingBar label={tx.overallLabel.replace(' *', '')} value={avgOverall} />
                <RatingBar label={tx.staffLabel} value={avgStaff} />
                <RatingBar label={tx.cleanLabel} value={avgClean} />
                <RatingBar label={tx.speedLabel} value={avgSpeed} />
              </CardContent>
            </Card>

            {/* Distribution */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />{tx.distribution}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = surveys.filter(s => s.ratings.overall === star).length;
                  const pct = surveys.length ? (count / surveys.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5 w-12 shrink-0">
                        <span className="text-xs font-medium text-slate-600">{star}</span>
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      </div>
                      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center gap-1 w-16 shrink-0">
                        <span className="text-xs text-slate-500">{count}</span>
                        <span className="text-xs text-slate-400">({pct.toFixed(0)}%)</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Reviews list with filters */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />{tx.recentComments}
                  <Badge className="bg-slate-100 text-slate-600 font-normal">{filteredSurveys.length}</Badge>
                </CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder={tx.searchPlaceholder}
                      className="h-8 pl-8 pr-3 rounded-md border border-input text-xs bg-background w-40 focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <select value={filter} onChange={e => setFilter(e.target.value as FilterType)} className="h-8 rounded-md border border-input px-2 text-xs bg-background">
                    <option value="all">{tx.filterAll}</option>
                    <option value="positive">{tx.filterPositive}</option>
                    <option value="negative">{tx.filterNegative}</option>
                    <option value="withComment">{tx.filterWithComment}</option>
                  </select>
                  <select value={sort} onChange={e => setSort(e.target.value as SortType)} className="h-8 rounded-md border border-input px-2 text-xs bg-background">
                    <option value="latest">{tx.sortLatest}</option>
                    <option value="highest">{tx.sortHighest}</option>
                    <option value="lowest">{tx.sortLowest}</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredSurveys.slice(0, expandedReview ? undefined : 5).map((survey) => {
                const SurveyEmoji = getRatingEmoji(survey.ratings.overall);
                return (
                  <div key={survey.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 shrink-0">
                          {survey.patientName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-slate-700">{survey.patientName}</span>
                            <Badge className="text-xs bg-green-100 text-green-700 py-0">{tx.verified}</Badge>
                          </div>
                          <p className="text-xs text-slate-400">{new Date(survey.createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'uz-UZ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <SurveyEmoji className="w-4 h-4 text-slate-400" />
                        <StarRating value={survey.ratings.overall} size="sm" />
                        <span className="text-xs font-bold text-slate-600">{survey.ratings.overall}.0</span>
                      </div>
                    </div>
                    {survey.comment ? (
                      <p className="text-sm text-slate-600 italic mb-2">&quot;{survey.comment}&quot;</p>
                    ) : (
                      <p className="text-xs text-slate-400 italic mb-2">{tx.noComment}</p>
                    )}
                    <div className="flex items-center justify-between">
                      {survey.wouldRecommend ? (
                        <div className="flex items-center gap-1"><ThumbsUp className="w-3 h-3 text-green-500" /><span className="text-xs text-green-600 font-medium">{tx.yes}</span></div>
                      ) : (
                        <div className="flex items-center gap-1"><ThumbsDown className="w-3 h-3 text-red-500" /><span className="text-xs text-red-600 font-medium">{tx.no}</span></div>
                      )}
                      <button
                        onClick={() => setHelpfulPosts(prev => { const next = new Set(prev); if (next.has(survey.id)) { next.delete(survey.id); } else { next.add(survey.id); } return next; })}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors ${helpfulPosts.has(survey.id) ? 'border-indigo-300 bg-indigo-50 text-indigo-600' : 'border-slate-200 text-slate-400 hover:border-indigo-200'}`}
                      >
                        <ThumbsUp className="w-3 h-3" />{tx.helpful}
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredSurveys.length > 5 && !expandedReview && (
                <button onClick={() => setExpandedReview('all')} className="w-full text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium py-2">
                  {tx.viewAll} ({filteredSurveys.length - 5} {tx.totalReviews.toLowerCase()})
                </button>
              )}
              {filteredSurveys.length === 0 && (
                <div className="text-center py-8">
                  <Star className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                  <p className="text-sm text-slate-500">{tx.noReviews}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Patient past surveys */}
      {!loading && isPatient && surveys.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-500" />{tx.myReviews}
              <Badge className="bg-slate-100 text-slate-600 font-normal">{surveys.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {surveys.map((survey) => (
              <div key={survey.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <StarRating value={survey.ratings.overall} size="sm" />
                  <div className="flex items-center gap-2">
                    {survey.wouldRecommend ? <ThumbsUp className="w-3.5 h-3.5 text-green-500" /> : <ThumbsDown className="w-3.5 h-3.5 text-red-500" />}
                    <span className="text-xs text-slate-400">{new Date(survey.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {survey.comment && <p className="text-sm text-slate-600 italic">&quot;{survey.comment}&quot;</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && surveys.length === 0 && !showForm && (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="w-16 h-16 rounded-2xl bg-yellow-50 flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-yellow-400" />
          </div>
          <p className="font-semibold text-slate-700 text-lg">{tx.noReviews}</p>
          {isPatient && (
            <Button className="mt-4 gap-1.5 bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowForm(true)}>
              <MessageSquare className="w-4 h-4" />{tx.beFirst}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
