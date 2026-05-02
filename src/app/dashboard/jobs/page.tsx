'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Briefcase, Building2, MapPin, Search, Check, Send, X, HandCoins, Plus, Clock,
  TrendingUp, Bookmark, BookmarkCheck, Share2, Filter,
} from 'lucide-react';
import type { JobListing } from '@/types';

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
  title: string; subtitle: string; postBtn: string; searchPlaceholder: string;
  newJobTitle: string; applyTitle: string; applyDesc: string;
  titleLabel: string; salaryLabel: string; locationLabel: string;
  regionLabel: string; requirementsLabel: string; descLabel: string;
  tagsLabel: string; postJobBtn: string; cancelBtn: string; sendBtn: string;
  urgentTag: string; emptyTitle: string; emptyDesc: string; postFirstBtn: string;
  applied: string; saved: string; shared: string; viewsLabel: string;
  applicantsLabel: string; postedLabel: string; profileNote: string;
  messageLabel: string; messagePlaceholder: string; posting: string; applying: string;
  statsTitle: string; totalJobs: string; urgentJobs: string; newThisWeek: string;
  filterAll: string;
}> = {
  uz: {
    title: "Kadrlar Markazi", subtitle: "Tibbiyot vakansiyalari portali",
    postBtn: "Vakansiya e'lon qilish", searchPlaceholder: "Mutaxassislik yoki klinika...",
    newJobTitle: "Yangi Vakansiya", applyTitle: "Ariza yuborish",
    applyDesc: "Ushbu ariza HR bo'limiga yuboriladi.",
    titleLabel: "Mutaxassislik nomi *", salaryLabel: "Maosh (UZS)", locationLabel: "Shahar / Tuman *",
    regionLabel: "Viloyat", requirementsLabel: "Talablar", descLabel: "Tavsif",
    tagsLabel: "Teglar", postJobBtn: "E'lon qilish", cancelBtn: "Bekor qilish", sendBtn: "Yuborish",
    urgentTag: "Shoshilinch", emptyTitle: "Vakansiyalar topilmadi",
    emptyDesc: "Hozircha hech qanday vakansiya yo'q",
    postFirstBtn: "Birinchi vakansiyani e'lon qiling",
    applied: "Ariza yuborildi!", saved: "Saqlandi", shared: "Havola nusxalandi",
    viewsLabel: "ko'rishlar", applicantsLabel: "ariza", postedLabel: "Joylashtirildi",
    profileNote: "Platformadagi profilingiz rezyume sifatida biriktiriladi.",
    messageLabel: "Qo'shimcha xabar (ixtiyoriy)", messagePlaceholder: "HR menejer uchun qisqacha xabar...",
    posting: "Joylashtirilmoqda...", applying: "Yuborilmoqda...",
    statsTitle: "Statistika", totalJobs: "Jami vakansiya", urgentJobs: "Shoshilinch", newThisWeek: "Bu hafta yangi",
    filterAll: "Barchasi",
  },
  uz_cyrillic: {
    title: "Кадрлар Маркази", subtitle: "Тиббиёт вакансиялари порталы",
    postBtn: "Вакансия эълон қилиш", searchPlaceholder: "Мутахассислик ёки клиника...",
    newJobTitle: "Янги Вакансия", applyTitle: "Ариза юбориш",
    applyDesc: "Ушбу ариза HR бўлимига юборилади.",
    titleLabel: "Мутахассислик номи *", salaryLabel: "Маош (UZS)", locationLabel: "Шаҳар / Туман *",
    regionLabel: "Вилоят", requirementsLabel: "Талаблар", descLabel: "Тавсиф",
    tagsLabel: "Теглар", postJobBtn: "Эълон қилиш", cancelBtn: "Бекор қилиш", sendBtn: "Юбориш",
    urgentTag: "Шошилинч", emptyTitle: "Вакансиялар топилмади",
    emptyDesc: "Ҳозирча ҳеч қандай вакансия йўқ",
    postFirstBtn: "Биринчи вакансияни эълон қилинг",
    applied: "Ариза юборилди!", saved: "Сақланди", shared: "Ҳавола нусхаланди",
    viewsLabel: "кўришлар", applicantsLabel: "ариза", postedLabel: "Жойлаштирилди",
    profileNote: "Платформадаги профилингиз резюме сифатида бириктирилади.",
    messageLabel: "Қўшимча хабар (ихтиёрий)", messagePlaceholder: "HR менежер учун қисқача хабар...",
    posting: "Жойлаштирилмоқда...", applying: "Юборилмоқда...",
    statsTitle: "Статистика", totalJobs: "Жами вакансия", urgentJobs: "Шошилинч", newThisWeek: "Бу ҳафта янги",
    filterAll: "Барчаси",
  },
  ru: {
    title: "Кадровый центр", subtitle: "Портал медицинских вакансий",
    postBtn: "Опубликовать вакансию", searchPlaceholder: "Специальность или клиника...",
    newJobTitle: "Новая вакансия", applyTitle: "Подать заявку",
    applyDesc: "Заявка будет направлена в HR-отдел.",
    titleLabel: "Название должности *", salaryLabel: "Зарплата (UZS)", locationLabel: "Город / Район *",
    regionLabel: "Регион", requirementsLabel: "Требования", descLabel: "Описание",
    tagsLabel: "Теги", postJobBtn: "Опубликовать", cancelBtn: "Отмена", sendBtn: "Отправить",
    urgentTag: "Срочно", emptyTitle: "Вакансии не найдены",
    emptyDesc: "Пока нет активных вакансий",
    postFirstBtn: "Опубликуйте первую вакансию",
    applied: "Заявка отправлена!", saved: "Сохранено", shared: "Ссылка скопирована",
    viewsLabel: "просмотров", applicantsLabel: "заявок", postedLabel: "Опубликовано",
    profileNote: "Ваш профиль на платформе будет приложен как резюме.",
    messageLabel: "Дополнительное сообщение (необязательно)", messagePlaceholder: "Краткое сообщение для HR...",
    posting: "Публикация...", applying: "Отправка...",
    statsTitle: "Статистика", totalJobs: "Всего вакансий", urgentJobs: "Срочных", newThisWeek: "Новых за неделю",
    filterAll: "Все",
  },
  en: {
    title: "HR Center", subtitle: "Medical vacancies portal",
    postBtn: "Post a vacancy", searchPlaceholder: "Position or clinic...",
    newJobTitle: "New Vacancy", applyTitle: "Submit application",
    applyDesc: "Your application will be sent to the HR department.",
    titleLabel: "Position title *", salaryLabel: "Salary (UZS)", locationLabel: "City / District *",
    regionLabel: "Region", requirementsLabel: "Requirements", descLabel: "Description",
    tagsLabel: "Tags", postJobBtn: "Publish", cancelBtn: "Cancel", sendBtn: "Send",
    urgentTag: "Urgent", emptyTitle: "No vacancies found",
    emptyDesc: "No active vacancies at the moment",
    postFirstBtn: "Post the first vacancy",
    applied: "Application sent!", saved: "Saved", shared: "Link copied",
    viewsLabel: "views", applicantsLabel: "applications", postedLabel: "Posted",
    profileNote: "Your platform profile will be attached as a resume.",
    messageLabel: "Additional message (optional)", messagePlaceholder: "Brief note for HR...",
    posting: "Publishing...", applying: "Sending...",
    statsTitle: "Statistics", totalJobs: "Total vacancies", urgentJobs: "Urgent", newThisWeek: "New this week",
    filterAll: "All",
  },
  kk: {
    title: "Кадрлар Орталығы", subtitle: "Медицина вакансиялары порталы",
    postBtn: "Вакансия жариялау", searchPlaceholder: "Мамандық немесе клиника...",
    newJobTitle: "Жаңа вакансия", applyTitle: "Өтініш жіберу",
    applyDesc: "Өтініш HR бөліміне жіберіледі.",
    titleLabel: "Лауазым атауы *", salaryLabel: "Еңбекақы (UZS)", locationLabel: "Қала / Аудан *",
    regionLabel: "Аймақ", requirementsLabel: "Талаптар", descLabel: "Сипаттама",
    tagsLabel: "Тегтер", postJobBtn: "Жариялау", cancelBtn: "Болдырмау", sendBtn: "Жіберу",
    urgentTag: "Шұғыл", emptyTitle: "Вакансиялар табылмады",
    emptyDesc: "Қазір белсенді вакансиялар жоқ",
    postFirstBtn: "Алғашқы вакансияны жариялаңыз",
    applied: "Өтініш жіберілді!", saved: "Сақталды", shared: "Сілтеме көшірілді",
    viewsLabel: "қарау", applicantsLabel: "өтініш", postedLabel: "Жарияланды",
    profileNote: "Платформадағы профиліңіз түйіндеме ретінде қосылады.",
    messageLabel: "Қосымша хабар (міндетті емес)", messagePlaceholder: "HR менеджеріне қысқаша хабар...",
    posting: "Жарияланып жатыр...", applying: "Жіберілуде...",
    statsTitle: "Статистика", totalJobs: "Барлық вакансия", urgentJobs: "Шұғыл", newThisWeek: "Осы аптада жаңа",
    filterAll: "Барлығы",
  },
};

const BADGE_FILTERS_BASE = ['Barchasi', 'Shoshilinch', 'Oliy Toifa', 'Hamshira', "To'liq stavka", 'Yarim stavka'];
const UZBEK_REGIONS = ['Toshkent sh.', 'Toshkent v.', 'Samarqand', 'Buxoro', 'Andijon', 'Namangan', "Farg'ona", 'Xorazm', 'Qashqadaryo', 'Surxondaryo', 'Jizzax', 'Sirdaryo', 'Navoiy', "Qoraqalpog'iston"];

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

export default function JobsPage() {
  const { user, userProfile, userRole } = useAuth();
  const { lang } = useLanguage();
  const tx = L[lang as LK] ?? L.uz;

  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Barchasi');
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());

  const [showPostModal, setShowPostModal] = useState(false);
  const [postForm, setPostForm] = useState({ title: '', salary: '', location: '', region: 'Toshkent sh.', description: '', requirements: '', badges: [] as string[] });
  const [posting, setPosting] = useState(false);

  const [applyJob, setApplyJob] = useState<JobListing | null>(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [applying, setApplying] = useState(false);

  const fetchJobs = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const data = await requestJson<{ jobs: JobListing[] }>('/api/jobs', token);
      setJobs(data.jobs);
    }
    catch { toast.error("Vakansiyalarni yuklashda xatolik"); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = !search || job.title.toLowerCase().includes(search.toLowerCase()) || job.clinicName.toLowerCase().includes(search.toLowerCase()) || job.location.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'Barchasi' || job.badges.includes(activeFilter);
    return matchesSearch && matchesFilter;
  });

  const toggleBadge = (badge: string) => setPostForm((prev) => ({ ...prev, badges: prev.badges.includes(badge) ? prev.badges.filter((b) => b !== badge) : [...prev.badges, badge] }));
  const toggleSave = (id: string) => { setSavedJobs((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else { next.add(id); toast.success(tx.saved); } return next; }); };

  const handlePostJob = async () => {
    if (!postForm.title.trim() || !postForm.location.trim()) { toast.error(tx.titleLabel.replace(' *', '') + " va " + tx.locationLabel.replace(' *', '') + " majburiy"); return; }
    if (!user || !userProfile) { toast.error("Tizimga kiring"); return; }
    setPosting(true);
    try {
      const token = await user.getIdToken();
      await requestJson<JobListing>('/api/jobs', token, {
        method: 'POST',
        body: JSON.stringify({
        title: postForm.title.trim(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        clinicName: (userProfile as any).clinicName || userProfile.displayName || user.email?.split('@')[0] || 'Klinika',
        location: postForm.location.trim(), region: postForm.region,
        salary: postForm.salary.trim() || 'Kelishilgan holda',
        description: postForm.description.trim(), requirements: postForm.requirements.trim(),
        badges: postForm.badges,
      }),
      });
      toast.success("Vakansiya platformaga qo'shildi!");
      setShowPostModal(false);
      setPostForm({ title: '', salary: '', location: '', region: 'Toshkent sh.', description: '', requirements: '', badges: [] });
      fetchJobs();
    } catch { toast.error("Vakansiya qo'shishda xatolik"); }
    finally { setPosting(false); }
  };

  const handleApply = async () => {
    if (!applyJob || !user || !userProfile) { toast.error("Tizimga kiring"); return; }
    setApplying(true);
    try {
      const token = await user.getIdToken();
      await requestJson('/api/jobs/applications', token, {
        method: 'POST',
        body: JSON.stringify({
        jobId: applyJob.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        applicantName: userProfile.displayName || (userProfile as any).fullName || user.displayName || 'Nomaqlum',
        message: applyMessage.trim(),
      }),
      });
      toast.success(tx.applied);
      setApplyJob(null); setApplyMessage('');
    } catch { toast.error("Ariza yuborishda xatolik"); }
    finally { setApplying(false); }
  };

  const stats = { total: jobs.length, urgent: jobs.filter((j) => j.badges?.includes('Shoshilinch')).length, newThisWeek: jobs.filter((j) => { const d = new Date(j.createdAt); return (Date.now() - d.getTime()) < 7 * 86400000; }).length };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-slate-700" />{tx.title}
          </h1>
          <p className="text-sm text-muted-foreground">{tx.subtitle}</p>
        </div>
        {(userRole === 'admin' || userRole === 'clinic') && (
          <Button onClick={() => setShowPostModal(true)} className="bg-slate-900 text-white gap-2">
            <Plus className="w-4 h-4" />{tx.postBtn}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: tx.totalJobs, value: stats.total, icon: <Briefcase className="w-4 h-4 text-blue-500" />, bg: 'bg-blue-50' },
          { label: tx.urgentJobs, value: stats.urgent, icon: <TrendingUp className="w-4 h-4 text-red-500" />, bg: 'bg-red-50' },
          { label: tx.newThisWeek, value: stats.newThisWeek, icon: <Clock className="w-4 h-4 text-green-500" />, bg: 'bg-green-50' },
        ].map(({ label, value, icon, bg }) => (
          <Card key={label} className={`${bg} border-0`}>
            <CardContent className="p-3 flex items-center gap-3">
              {icon}
              <div><p className="text-xl font-bold text-slate-800">{value}</p><p className="text-xs text-slate-500">{label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl border shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tx.searchPlaceholder} className="pl-10 bg-slate-50 border-transparent" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
        </div>
        <div className="flex gap-2 overflow-x-auto items-center">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {BADGE_FILTERS_BASE.map((f) => (
            <Badge key={f} variant={activeFilter === f ? 'default' : 'outline'} onClick={() => setActiveFilter(f)} className={`px-3 py-1.5 cursor-pointer whitespace-nowrap text-xs ${activeFilter === f ? 'bg-slate-900' : 'bg-white hover:bg-slate-100'}`}>
              {f === 'Barchasi' ? tx.filterAll : f}
            </Badge>
          ))}
        </div>
      </div>

      {/* Job cards */}
      <div className="grid lg:grid-cols-2 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)
        ) : filteredJobs.length === 0 ? (
          <div className="lg:col-span-2 text-center py-12 bg-white rounded-xl border border-dashed">
            <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-200" />
            <p className="font-medium text-slate-700">{tx.emptyTitle}</p>
            <p className="text-sm text-slate-400 mt-1">{tx.emptyDesc}</p>
            {(userRole === 'clinic' || userRole === 'admin') && (
              <Button size="sm" className="mt-4 gap-1.5" onClick={() => setShowPostModal(true)}>
                <Plus className="w-3.5 h-3.5" />{tx.postFirstBtn}
              </Button>
            )}
          </div>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job.id} className="hover:border-slate-400 hover:shadow-md transition-all group flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <h3 className="text-lg font-bold group-hover:text-blue-700 transition-colors">{job.title}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      {job.badges?.includes('Shoshilinch') && <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{tx.urgentTag}</span>}
                      <button onClick={() => toggleSave(job.id)} className="p-1.5 rounded-lg hover:bg-yellow-50">
                        {savedJobs.has(job.id) ? <BookmarkCheck className="w-4 h-4 text-yellow-500" /> : <Bookmark className="w-4 h-4 text-slate-300 hover:text-yellow-400" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm text-slate-600 mb-3">
                    <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-400 shrink-0" /><span className="font-medium text-slate-800">{job.clinicName}</span></div>
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400 shrink-0" />{job.location}{job.region ? `, ${job.region}` : ''}</div>
                    <div className="flex items-center gap-2 font-semibold text-emerald-700 bg-emerald-50 w-fit px-2.5 py-1 rounded-lg"><HandCoins className="w-4 h-4" />{job.salary}</div>
                  </div>
                  {job.description && <p className="text-sm text-slate-500 line-clamp-2">{job.description}</p>}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t">
                  <div className="flex flex-wrap gap-1 items-center">
                    {job.badges?.filter((b) => b !== 'Shoshilinch').map((badge, j) => (
                      <Badge key={j} variant="secondary" className="text-xs">{badge}</Badge>
                    ))}
                    <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(job.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { navigator.clipboard.writeText(job.id); toast.success(tx.shared); }} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    {(userRole === 'doctor' || userRole === 'patient') && (
                      <Button onClick={() => setApplyJob(job)} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5" size="sm">
                        <Send className="w-3.5 h-3.5" />Ariza
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Post Job Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-lg shadow-2xl my-4">
            <CardHeader className="flex flex-row justify-between items-center bg-slate-50 border-b">
              <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5" />{tx.newJobTitle}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowPostModal(false)}><X className="w-5 h-5" /></Button>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div><label className="text-sm font-medium mb-1 block">{tx.titleLabel}</label><Input value={postForm.title} onChange={(e) => setPostForm((p) => ({ ...p, title: e.target.value }))} placeholder="Masalan: Bosh pediatr..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium mb-1 block">{tx.salaryLabel}</label><Input value={postForm.salary} onChange={(e) => setPostForm((p) => ({ ...p, salary: e.target.value }))} placeholder="5 000 000 dan" /></div>
                <div><label className="text-sm font-medium mb-1 block">{tx.locationLabel}</label><Input value={postForm.location} onChange={(e) => setPostForm((p) => ({ ...p, location: e.target.value }))} placeholder="Masalan: Yunusobod" /></div>
              </div>
              <div><label className="text-sm font-medium mb-1 block">{tx.regionLabel}</label><select className="w-full border rounded-md px-3 py-2 text-sm bg-white" value={postForm.region} onChange={(e) => setPostForm((p) => ({ ...p, region: e.target.value }))}>{UZBEK_REGIONS.map((r) => <option key={r}>{r}</option>)}</select></div>
              <div><label className="text-sm font-medium mb-1 block">{tx.requirementsLabel}</label><Textarea value={postForm.requirements} onChange={(e) => setPostForm((p) => ({ ...p, requirements: e.target.value }))} placeholder="Kamida 3 yillik tajriba, oliy toifa..." rows={2} className="resize-none" /></div>
              <div><label className="text-sm font-medium mb-1 block">{tx.descLabel}</label><Textarea value={postForm.description} onChange={(e) => setPostForm((p) => ({ ...p, description: e.target.value }))} placeholder="Ish joyi, vazifalar haqida..." rows={2} className="resize-none" /></div>
              <div>
                <label className="text-sm font-medium mb-2 block">{tx.tagsLabel}</label>
                <div className="flex flex-wrap gap-2">
                  {['Shoshilinch', 'Oliy Toifa', '1-Toifa', 'Hamshira', "To'liq stavka", 'Yarim stavka'].map((badge) => (
                    <button key={badge} type="button" onClick={() => toggleBadge(badge)} className={`px-3 py-1 rounded-full text-xs border font-medium transition-all ${postForm.badges.includes(badge) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>{badge}</button>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t p-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPostModal(false)}>{tx.cancelBtn}</Button>
              <Button onClick={handlePostJob} disabled={posting} className="bg-slate-900 text-white gap-2">
                {posting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                {posting ? tx.posting : tx.postJobBtn}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Apply Modal */}
      {applyJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white text-center relative">
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-white hover:bg-blue-500" onClick={() => { setApplyJob(null); setApplyMessage(''); }}><X className="w-5 h-5" /></Button>
              <Send className="w-10 h-10 mx-auto mb-2 opacity-80" />
              <h2 className="text-xl font-bold mb-1">{applyJob.title}</h2>
              <p className="text-blue-100 text-sm">{tx.applyDesc} <strong>{applyJob.clinicName}</strong></p>
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 border rounded-xl flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-600">{tx.profileNote}</p>
              </div>
              <div><label className="text-sm font-medium mb-1 block">{tx.messageLabel}</label><Textarea value={applyMessage} onChange={(e) => setApplyMessage(e.target.value)} placeholder={tx.messagePlaceholder} rows={3} className="resize-none" /></div>
            </CardContent>
            <CardFooter className="p-5 pt-0 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setApplyJob(null); setApplyMessage(''); }}>{tx.cancelBtn}</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={handleApply} disabled={applying}>
                {applying && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                {applying ? tx.applying : tx.sendBtn}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
