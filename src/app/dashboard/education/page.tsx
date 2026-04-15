'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  BookOpen, FileText, CheckCircle2, GraduationCap, PlayCircle,
  X, Clock, Trophy, Award, Search, Filter, ChevronRight,
  Download, Users, TrendingUp, Lock, Unlock,
} from 'lucide-react';

type LK = 'uz' | 'uz_cyrillic' | 'ru' | 'en' | 'kk';
const L: Record<LK, {
  title: string; subtitle: string; searchPlaceholder: string;
  allTypes: string; videoType: string; articleType: string; quizType: string; seminarType: string;
  startBtn: string; continueBtn: string; completedBtn: string; lockedBtn: string;
  downloadCertBtn: string; statsTitle: string; cmePoints: string;
  completedCourses: string; inProgress: string; totalHours: string;
  hoursLabel: string; pointsLabel: string; studentsLabel: string;
  certAvailable: string; certDownloaded: string; progressLabel: string;
  filterAll: string; filterCompleted: string; filterInProgress: string; filterNew: string;
  emptyTitle: string; leaderboardTitle: string; yourRank: string;
  quizTitle: string; quizDesc: string; submitQuiz: string; nextQuestion: string;
  correct: string; wrong: string; quizScore: string;
}> = {
  uz: {
    title: "Tibbiy Ta'lim Markazi", subtitle: "Malaka oshirish, sertifikatlar va CME kreditlar",
    searchPlaceholder: "Kurs nomi, mutaxassislik...",
    allTypes: "Barcha turlar", videoType: "Video kurs", articleType: "Maqola", quizType: "Test", seminarType: "Seminar",
    startBtn: "Boshlash", continueBtn: "Davom etish", completedBtn: "Bajarilgan", lockedBtn: "Qulflangan",
    downloadCertBtn: "Sertifikat yuklash", statsTitle: "Statistika",
    cmePoints: "CME kreditlar", completedCourses: "Tugallangan kurslar",
    inProgress: "Jarayonda", totalHours: "Jami soatlar",
    hoursLabel: "soat", pointsLabel: "kredit", studentsLabel: "talaba",
    certAvailable: "Sertifikat tayyor", certDownloaded: "Sertifikat yuklandi",
    progressLabel: "jarayon",
    filterAll: "Barchasi", filterCompleted: "Tugallangan", filterInProgress: "Jarayonda", filterNew: "Yangi",
    emptyTitle: "Kurslar topilmadi", leaderboardTitle: "Faol o'quvchilar",
    yourRank: "Sizning o'rningiz", quizTitle: "Bilimni tekshirish",
    quizDesc: "Ushbu kursni tugallash uchun testni yechishing kerak",
    submitQuiz: "Javobni yuborish", nextQuestion: "Keyingi savol",
    correct: "To'g'ri!", wrong: "Noto'g'ri. To'g'ri javob:", quizScore: "Natija",
  },
  uz_cyrillic: {
    title: "Тиббий Таълим Маркази", subtitle: "Малака ошириш, сертификатлар ва CME кредитлар",
    searchPlaceholder: "Курс номи, мутахассислик...",
    allTypes: "Барча турлар", videoType: "Видео курс", articleType: "Мақола", quizType: "Тест", seminarType: "Семинар",
    startBtn: "Бошлаш", continueBtn: "Давом этиш", completedBtn: "Бажарилган", lockedBtn: "Қулфланган",
    downloadCertBtn: "Сертификат юклаш", statsTitle: "Статистика",
    cmePoints: "CME кредитлар", completedCourses: "Тугалланган курслар",
    inProgress: "Жараёнда", totalHours: "Жами соатлар",
    hoursLabel: "соат", pointsLabel: "кредит", studentsLabel: "талаба",
    certAvailable: "Сертификат тайёр", certDownloaded: "Сертификат юкланди",
    progressLabel: "жараён",
    filterAll: "Барчаси", filterCompleted: "Тугалланган", filterInProgress: "Жараёнда", filterNew: "Янги",
    emptyTitle: "Курслар топилмади", leaderboardTitle: "Фаол ўқувчилар",
    yourRank: "Сизнинг ўрнингиз", quizTitle: "Билимни текшириш",
    quizDesc: "Ушбу курсни тугаллаш учун тестни ечишингиз керак",
    submitQuiz: "Жавобни юбориш", nextQuestion: "Кейинги савол",
    correct: "Тўғри!", wrong: "Нотўғри. Тўғри жавоб:", quizScore: "Натижа",
  },
  ru: {
    title: "Центр медицинского образования", subtitle: "Повышение квалификации, сертификаты и кредиты НМО",
    searchPlaceholder: "Название курса, специальность...",
    allTypes: "Все типы", videoType: "Видеокурс", articleType: "Статья", quizType: "Тест", seminarType: "Семинар",
    startBtn: "Начать", continueBtn: "Продолжить", completedBtn: "Завершено", lockedBtn: "Закрыто",
    downloadCertBtn: "Скачать сертификат", statsTitle: "Статистика",
    cmePoints: "Кредиты НМО", completedCourses: "Пройдено курсов",
    inProgress: "В процессе", totalHours: "Всего часов",
    hoursLabel: "ч.", pointsLabel: "кредит", studentsLabel: "учащихся",
    certAvailable: "Сертификат доступен", certDownloaded: "Сертификат скачан",
    progressLabel: "прогресс",
    filterAll: "Все", filterCompleted: "Завершено", filterInProgress: "В процессе", filterNew: "Новые",
    emptyTitle: "Курсы не найдены", leaderboardTitle: "Активные участники",
    yourRank: "Ваш рейтинг", quizTitle: "Проверка знаний",
    quizDesc: "Для завершения курса необходимо пройти тест",
    submitQuiz: "Отправить ответ", nextQuestion: "Следующий вопрос",
    correct: "Верно!", wrong: "Неверно. Правильный ответ:", quizScore: "Результат",
  },
  en: {
    title: "Medical Education Center", subtitle: "CME credits, certifications and continuing education",
    searchPlaceholder: "Course name, specialty...",
    allTypes: "All types", videoType: "Video course", articleType: "Article", quizType: "Quiz", seminarType: "Seminar",
    startBtn: "Start", continueBtn: "Continue", completedBtn: "Completed", lockedBtn: "Locked",
    downloadCertBtn: "Download certificate", statsTitle: "Statistics",
    cmePoints: "CME credits", completedCourses: "Completed courses",
    inProgress: "In progress", totalHours: "Total hours",
    hoursLabel: "hrs", pointsLabel: "credits", studentsLabel: "students",
    certAvailable: "Certificate ready", certDownloaded: "Certificate downloaded",
    progressLabel: "progress",
    filterAll: "All", filterCompleted: "Completed", filterInProgress: "In progress", filterNew: "New",
    emptyTitle: "No courses found", leaderboardTitle: "Top learners",
    yourRank: "Your rank", quizTitle: "Knowledge check",
    quizDesc: "Complete the quiz to finish this course",
    submitQuiz: "Submit answer", nextQuestion: "Next question",
    correct: "Correct!", wrong: "Incorrect. Correct answer:", quizScore: "Score",
  },
  kk: {
    title: "Медициналық Білім Орталығы", subtitle: "CME кредиттер, сертификаттар және тиісті білім",
    searchPlaceholder: "Курс аты, мамандық...",
    allTypes: "Барлық түрлер", videoType: "Бейне курс", articleType: "Мақала", quizType: "Тест", seminarType: "Семинар",
    startBtn: "Бастау", continueBtn: "Жалғастыру", completedBtn: "Аяқталды", lockedBtn: "Бекітілген",
    downloadCertBtn: "Сертификат жүктеу", statsTitle: "Статистика",
    cmePoints: "CME кредиттер", completedCourses: "Аяқталған курстар",
    inProgress: "Үрдісте", totalHours: "Барлық сағаттар",
    hoursLabel: "сағ.", pointsLabel: "кредит", studentsLabel: "оқушы",
    certAvailable: "Сертификат дайын", certDownloaded: "Сертификат жүктелді",
    progressLabel: "үрдіс",
    filterAll: "Барлығы", filterCompleted: "Аяқталған", filterInProgress: "Үрдісте", filterNew: "Жаңа",
    emptyTitle: "Курстар табылмады", leaderboardTitle: "Белсенді оқушылар",
    yourRank: "Сіздің рейтингіңіз", quizTitle: "Білімді тексеру",
    quizDesc: "Курсты аяқтау үшін тесттен өту керек",
    submitQuiz: "Жауапты жіберу", nextQuestion: "Келесі сұрақ",
    correct: "Дұрыс!", wrong: "Қате. Дұрыс жауап:", quizScore: "Нәтиже",
  },
};

interface Course {
  id: string; title: string; type: 'video' | 'article' | 'quiz' | 'seminar';
  hours: number; cmePoints: number; students: number; progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'locked';
  category: string; videoId?: string; isNew?: boolean; rating: number;
  instructor: string;
}

const COURSES: Course[] = [
  { id: 'c1', title: "Kardiologiyada Yangi Standartlar (2026)", type: 'video', hours: 4, cmePoints: 4, students: 234, progress: 0, status: 'not_started', category: 'Kardiologiya', videoId: 'dQw4w9WgXcQ', isNew: true, rating: 4.8, instructor: 'Prof. Azimov' },
  { id: 'c2', title: "Farmakologiya Yangiliklari — Antibiotiklar", type: 'article', hours: 2, cmePoints: 2, students: 189, progress: 60, status: 'in_progress', category: 'Farmakologiya', rating: 4.5, instructor: 'Dr. Karimova' },
  { id: 'c3', title: "Pnevmoniya diagnostikasi va Davolash", type: 'quiz', hours: 5, cmePoints: 5, students: 312, progress: 100, status: 'completed', category: 'Pulmonologiya', rating: 4.9, instructor: 'Prof. Toshmatov' },
  { id: 'c4', title: "Pediatriyada Zamonaviy Yondashuvlar", type: 'seminar', hours: 8, cmePoints: 8, students: 145, progress: 0, status: 'not_started', category: 'Pediatriya', rating: 4.7, instructor: 'Dr. Yusupova' },
  { id: 'c5', title: "Endokrinologiya: Diabet menejmenti", type: 'video', hours: 6, cmePoints: 6, students: 278, progress: 30, status: 'in_progress', category: 'Endokrinologiya', isNew: true, rating: 4.6, instructor: 'Prof. Raxmatullayev' },
  { id: 'c6', title: "Jarrohlik asoratlarini oldini olish", type: 'article', hours: 3, cmePoints: 3, students: 98, progress: 0, status: 'locked', category: 'Jarrohlik', rating: 4.4, instructor: 'Dr. Xolmatov' },
];

const TYPE_ICONS = { video: <PlayCircle className="w-4 h-4 text-red-500" />, article: <FileText className="w-4 h-4 text-blue-500" />, quiz: <CheckCircle2 className="w-4 h-4 text-green-500" />, seminar: <BookOpen className="w-4 h-4 text-purple-500" /> };
const TYPE_COLORS_MAP = { video: 'bg-red-100', article: 'bg-blue-100', quiz: 'bg-green-100', seminar: 'bg-purple-100' };
type Filter = 'all' | 'completed' | 'in_progress' | 'new';

const QUIZ_QUESTIONS = [
  { q: "AKF inhibitorlari bilan dorining asosiy nojo'ya ta'siri?", opts: ["Yo'tal", "Diareya", "Gipokalemiya", "Bosh og'riq"], correct: 0 },
  { q: "STEMI da PCI uchun maqsadli vaqt?", opts: ["60 daqiqa", "90 daqiqa", "120 daqiqa", "30 daqiqa"], correct: 1 },
  { q: "2-tip diabetda birinchi qator dori?", opts: ["Insulin", "Metformin", "Sulfonilmochevina", "SGLT2 inhibitor"], correct: 1 },
];

export default function EducationPage() {
  const { lang } = useLanguage();
  const tx = L[lang as LK] ?? L.uz;

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'video' | 'article' | 'quiz' | 'seminar'>('all');
  const [statusFilter, setStatusFilter] = useState<Filter>('all');
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizDone, setQuizDone] = useState(false);

  const stats = useMemo(() => ({
    cme: COURSES.filter((c) => c.status === 'completed').reduce((s, c) => s + c.cmePoints, 0),
    completed: COURSES.filter((c) => c.status === 'completed').length,
    inProgress: COURSES.filter((c) => c.status === 'in_progress').length,
    hours: COURSES.filter((c) => c.status === 'completed').reduce((s, c) => s + c.hours, 0),
  }), []);

  const filtered = useMemo(() => {
    let list = COURSES;
    if (typeFilter !== 'all') list = list.filter((c) => c.type === typeFilter);
    if (statusFilter === 'completed') list = list.filter((c) => c.status === 'completed');
    else if (statusFilter === 'in_progress') list = list.filter((c) => c.status === 'in_progress');
    else if (statusFilter === 'new') list = list.filter((c) => c.isNew);
    if (search) list = list.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [typeFilter, statusFilter, search]);

  function handleQuizAnswer(answerIdx: number) {
    const newAnswers = [...quizAnswers, answerIdx];
    setQuizAnswers(newAnswers);
    if (quizIdx < QUIZ_QUESTIONS.length - 1) setQuizIdx(quizIdx + 1);
    else setQuizDone(true);
  }

  const quizScore = quizAnswers.filter((a, i) => a === QUIZ_QUESTIONS[i]?.correct).length;

  const filterTabs: { key: Filter; label: string }[] = [
    { key: 'all', label: tx.filterAll },
    { key: 'in_progress', label: tx.filterInProgress },
    { key: 'completed', label: tx.filterCompleted },
    { key: 'new', label: tx.filterNew },
  ];

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-purple-600" />{tx.title}
        </h1>
        <p className="text-sm text-muted-foreground">{tx.subtitle}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: tx.cmePoints, value: stats.cme, suffix: tx.pointsLabel, icon: <Award className="w-4 h-4 text-yellow-500" />, bg: 'bg-yellow-50' },
          { label: tx.completedCourses, value: stats.completed, suffix: '', icon: <Trophy className="w-4 h-4 text-green-500" />, bg: 'bg-green-50' },
          { label: tx.inProgress, value: stats.inProgress, suffix: '', icon: <TrendingUp className="w-4 h-4 text-blue-500" />, bg: 'bg-blue-50' },
          { label: tx.totalHours, value: stats.hours, suffix: tx.hoursLabel, icon: <Clock className="w-4 h-4 text-purple-500" />, bg: 'bg-purple-50' },
        ].map(({ label, value, suffix, icon, bg }) => (
          <Card key={label} className={`${bg} border-0`}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="shrink-0">{icon}</div>
              <div>
                <p className="text-xl font-bold text-slate-800">{value} <span className="text-sm font-normal text-slate-500">{suffix}</span></p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Video modal */}
      {activeCourse && activeCourse.type !== 'quiz' && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl overflow-hidden w-full max-w-3xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-slate-800 truncate">{activeCourse.title}</h2>
              <Button variant="ghost" size="icon" onClick={() => setActiveCourse(null)}><X className="w-5 h-5" /></Button>
            </div>
            {activeCourse.videoId ? (
              <div className="aspect-video bg-black">
                <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${activeCourse.videoId}?autoplay=1`} allow="autoplay; fullscreen" title={activeCourse.title} />
              </div>
            ) : (
              <div className="p-8 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                <p className="text-slate-500">Kurs matni yuklanmoqda...</p>
                <Button className="mt-4" onClick={() => toast.info(tx.downloadCertBtn)}><Download className="w-4 h-4 mr-2" />{tx.downloadCertBtn}</Button>
              </div>
            )}
            <div className="p-4 flex items-center justify-between bg-slate-50">
              <div className="text-sm text-slate-500">{activeCourse.instructor} · {activeCourse.hours} {tx.hoursLabel} · {activeCourse.cmePoints} {tx.pointsLabel}</div>
              {activeCourse.status === 'completed' && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { toast.success(tx.certDownloaded); setActiveCourse(null); }}>
                  <Download className="w-3.5 h-3.5" />{tx.downloadCertBtn}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quiz modal */}
      {activeCourse && activeCourse.type === 'quiz' && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{tx.quizTitle}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => { setActiveCourse(null); setQuizIdx(0); setQuizAnswers([]); setQuizDone(false); }}><X className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent>
              {!quizDone ? (
                <div className="space-y-4">
                  <Progress value={(quizIdx / QUIZ_QUESTIONS.length) * 100} className="h-2" />
                  <p className="text-xs text-slate-400">{quizIdx + 1}/{QUIZ_QUESTIONS.length}</p>
                  <p className="font-medium text-slate-800">{QUIZ_QUESTIONS[quizIdx]?.q}</p>
                  <div className="space-y-2">
                    {QUIZ_QUESTIONS[quizIdx]?.opts.map((opt, i) => (
                      <button key={i} onClick={() => handleQuizAnswer(i)} className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-sm">
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4 py-4">
                  <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
                  <p className="text-2xl font-bold">{tx.quizScore}: {quizScore}/{QUIZ_QUESTIONS.length}</p>
                  <p className="text-slate-500">{quizScore >= 2 ? tx.certAvailable : tx.wrong}</p>
                  {quizScore >= 2 && (
                    <Button onClick={() => { toast.success(tx.certDownloaded); setActiveCourse(null); setQuizIdx(0); setQuizAnswers([]); setQuizDone(false); }}>
                      <Download className="w-4 h-4 mr-2" />{tx.downloadCertBtn}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tx.searchPlaceholder} className="pl-9" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} className="h-10 rounded-md border border-input px-2 text-sm bg-background">
            <option value="all">{tx.allTypes}</option>
            <option value="video">{tx.videoType}</option>
            <option value="article">{tx.articleType}</option>
            <option value="quiz">{tx.quizType}</option>
            <option value="seminar">{tx.seminarType}</option>
          </select>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {filterTabs.map(({ key, label }) => (
          <button key={key} onClick={() => setStatusFilter(key)} className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${statusFilter === key ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Courses grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="text-slate-500">{tx.emptyTitle}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course) => (
            <Card key={course.id} className={`hover:shadow-md transition-all flex flex-col ${course.status === 'locked' ? 'opacity-70' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className={`w-10 h-10 rounded-xl ${TYPE_COLORS_MAP[course.type]} flex items-center justify-center shrink-0`}>
                    {TYPE_ICONS[course.type]}
                  </div>
                  <div className="flex items-center gap-1">
                    {course.isNew && <Badge className="bg-purple-100 text-purple-700 text-xs py-0">NEW</Badge>}
                    {course.status === 'completed' && <Badge className="bg-green-100 text-green-700 text-xs py-0"><CheckCircle2 className="w-3 h-3 mr-0.5" /></Badge>}
                  </div>
                </div>
                <CardTitle className="text-sm mt-2 line-clamp-2">{course.title}</CardTitle>
                <p className="text-xs text-slate-400">{course.instructor}</p>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.hours} {tx.hoursLabel}</span>
                  <span className="flex items-center gap-1"><Award className="w-3 h-3 text-yellow-500" />{course.cmePoints} {tx.pointsLabel}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.students}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-yellow-500">
                  {'★'.repeat(Math.round(course.rating))}{'☆'.repeat(5 - Math.round(course.rating))}
                  <span className="text-slate-400 ml-0.5">{course.rating}</span>
                </div>
                {course.status === 'in_progress' && (
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{tx.progressLabel}</span><span>{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-1.5" />
                  </div>
                )}
              </CardContent>
              <div className="p-4 pt-0">
                {course.status === 'locked' ? (
                  <Button disabled className="w-full gap-1.5" size="sm"><Lock className="w-3.5 h-3.5" />{tx.lockedBtn}</Button>
                ) : course.status === 'completed' ? (
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-green-700 border-green-200" onClick={() => { toast.success(tx.certDownloaded); }}>
                    <Download className="w-3.5 h-3.5" />{tx.downloadCertBtn}
                  </Button>
                ) : (
                  <Button size="sm" className="w-full gap-1.5 bg-purple-600 hover:bg-purple-700" onClick={() => setActiveCourse(course)}>
                    {course.status === 'in_progress' ? <><ChevronRight className="w-3.5 h-3.5" />{tx.continueBtn}</> : <><Unlock className="w-3.5 h-3.5" />{tx.startBtn}</>}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
