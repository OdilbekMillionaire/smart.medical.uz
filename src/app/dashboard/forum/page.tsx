'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  MessageSquare, Eye, UserCircle2, Flame, AlertCircle, Scale,
  Plus, X, ArrowLeft, Send, Trash2, Pin, Search,
  ThumbsUp, Bookmark, BookmarkCheck, Share2,
  Clock, ChevronDown, Bell, BellOff,
  CheckCircle2, Award, Hash,
} from 'lucide-react';
import {
  getForumPosts, createForumPost, deleteForumPost,
  incrementForumViews, getForumReplies, createForumReply,
} from '@/lib/firestore';
import type { ForumPost, ForumReply, UserRole } from '@/types';

type LK = 'uz' | 'uz_cyrillic' | 'ru' | 'en' | 'kk';

const L: Record<LK, {
  title: string; subtitle: string; newPost: string; searchPlaceholder: string;
  allCategories: string; trending: string; latest: string; unanswered: string;
  saved: string; replies: string; views: string; post: string; cancel: string;
  titleLabel: string; bodyLabel: string; categoryLabel: string; tagLabel: string;
  anonymous: string; submit: string; submitting: string; replyPlaceholder: string;
  sendReply: string; deletePost: string; deleteConfirm: string; pinPost: string;
  savePost: string; unsavePost: string; savedMsg: string; unsavedMsg: string;
  like: string; share: string; shareCopied: string; noResults: string;
  noResultsHint: string; noReplies: string; beFirst: string; expert: string;
  verified: string; posted: string; sortBy: string; sortNew: string;
  sortTop: string; sortHot: string; deleteSuccess: string; deleteError: string;
  createSuccess: string; createError: string; replySuccess: string; replyError: string;
  requiredFields: string; stats: string; totalPosts: string; activeUsers: string;
  todayPosts: string; experts: string; filterBy: string; followThread: string;
  unfollowThread: string; subscribeSuccess: string; moreReplies: string; collapseReplies: string;
  rules: string; rulesText: string[]; guidelines: string;
}> = {
  uz: {
    title: "Professional Forum",
    subtitle: "Tibbiy mutaxassislar uchun bilim almashish platformasi",
    newPost: "Yangi mavzu",
    searchPlaceholder: "Mavzu, teg yoki kalit so'z qidiring...",
    allCategories: "Barcha mavzular",
    trending: "Mashhur",
    latest: "Yangi",
    unanswered: "Javobsiz",
    saved: "Saqlanganlar",
    replies: "javob",
    views: "ko'rish",
    post: "ta post",
    cancel: "Bekor qilish",
    titleLabel: "Sarlavha",
    bodyLabel: "Mazmun",
    categoryLabel: "Kategoriya",
    tagLabel: "Teglar (vergul bilan ajrating)",
    anonymous: "Anonim sifatida yuborish",
    submit: "E'lon qilish",
    submitting: "Yuborilmoqda...",
    replyPlaceholder: "Javobingizni yozing...",
    sendReply: "Yuborish",
    deletePost: "O'chirish",
    deleteConfirm: "Rostdan ham ushbu postni o'chirmoqchimisiz?",
    pinPost: "Mahkamlash",
    savePost: "Saqlash",
    unsavePost: "Saqlashdan olib tashlash",
    savedMsg: "Post saqlandi",
    unsavedMsg: "Post o'chirildi",
    like: "Foydali",
    share: "Ulashish",
    shareCopied: "Havola nusxalandi",
    noResults: "Postlar topilmadi",
    noResultsHint: "Boshqa kalit so'z bilan urinib ko'ring",
    noReplies: "Hali javoblar yo'q",
    beFirst: "Birinchi bo'lib javob bering!",
    expert: "Mutaxassis",
    verified: "Tasdiqlangan",
    posted: "Yuborildi",
    sortBy: "Saralash",
    sortNew: "Yangi",
    sortTop: "Top",
    sortHot: "Mashhur",
    deleteSuccess: "Post o'chirildi",
    deleteError: "Xato yuz berdi",
    createSuccess: "Post yaratildi",
    createError: "Post yaratishda xato",
    replySuccess: "Javob yuborildi",
    replyError: "Javob yuborishda xato",
    requiredFields: "Sarlavha va mazmun majburiy",
    stats: "Forum statistikasi",
    totalPosts: "Jami postlar",
    activeUsers: "Faol foydalanuvchilar",
    todayPosts: "Bugungi postlar",
    experts: "Ekspertlar",
    filterBy: "Filter",
    followThread: "Kuzatish",
    unfollowThread: "Kuzatishni to'xtatish",
    subscribeSuccess: "Yangiliklarga obuna bo'ldingiz",
    moreReplies: "Ko'proq javoblar",
    collapseReplies: "Yig'ish",
    rules: "Forum qoidalari",
    rulesText: [
      "Hurmat va madaniy muloqot saqlang",
      "Tibbiy ma'lumotlarni ehtiyotkorlik bilan ulashing",
      "Bemorlar ma'lumotlarini oshkor etmang (maxfiylik)",
      "Spam va reklama taqiqlangan",
      "Professional standartlarga rioya qiling",
    ],
    guidelines: "Ko'rsatmalar",
  },
  uz_cyrillic: {
    title: "Профессионал Форум",
    subtitle: "Тиббий мутахассислар учун билим алмашиш платформаси",
    newPost: "Янги мавзу",
    searchPlaceholder: "Мавзу, тег ёки калит сўз қидиринг...",
    allCategories: "Барча мавзулар",
    trending: "Машҳур",
    latest: "Янги",
    unanswered: "Жавобсиз",
    saved: "Сақланганлар",
    replies: "жавоб",
    views: "кўриш",
    post: "та пост",
    cancel: "Бекор қилиш",
    titleLabel: "Сарлавҳа",
    bodyLabel: "Мазмун",
    categoryLabel: "Категория",
    tagLabel: "Теглар (вергул билан ажратинг)",
    anonymous: "Аноним сифатида юбориш",
    submit: "Эълон қилиш",
    submitting: "Юборилмоқда...",
    replyPlaceholder: "Жавобингизни ёзинг...",
    sendReply: "Юбориш",
    deletePost: "Ўчириш",
    deleteConfirm: "Ростдан ҳам ушбу постни ўчирмоқчимисиз?",
    pinPost: "Маҳкамлаш",
    savePost: "Сақлаш",
    unsavePost: "Сақлашдан олиб ташлаш",
    savedMsg: "Пост сақланди",
    unsavedMsg: "Пост ўчирилди",
    like: "Фойдали",
    share: "Улашиш",
    shareCopied: "Ҳавола нусхаланди",
    noResults: "Постлар топилмади",
    noResultsHint: "Бошқа калит сўз билан уриниб кўринг",
    noReplies: "Ҳали жавоблар йўқ",
    beFirst: "Биринчи бўлиб жавоб беринг!",
    expert: "Мутахассис",
    verified: "Тасдиқланган",
    posted: "Юборилди",
    sortBy: "Саралаш",
    sortNew: "Янги",
    sortTop: "Топ",
    sortHot: "Машҳур",
    deleteSuccess: "Пост ўчирилди",
    deleteError: "Хато юз берди",
    createSuccess: "Пост яратилди",
    createError: "Пост яратишда хато",
    replySuccess: "Жавоб юборилди",
    replyError: "Жавоб юборишда хато",
    requiredFields: "Сарлавҳа ва мазмун мажбурий",
    stats: "Форум статистикаси",
    totalPosts: "Жами постлар",
    activeUsers: "Фаол фойдаланувчилар",
    todayPosts: "Бугунги постлар",
    experts: "Экспертлар",
    filterBy: "Филтр",
    followThread: "Кузатиш",
    unfollowThread: "Кузатишни тўхтатиш",
    subscribeSuccess: "Янгиликларга обуна бўлдингиз",
    moreReplies: "Кўпроқ жавоблар",
    collapseReplies: "Йиғиш",
    rules: "Форум қоидалари",
    rulesText: [
      "Ҳурмат ва маданий мулоқот сақланг",
      "Тиббий маълумотларни эҳтиёткорлик билан улашинг",
      "Беморлар маълумотларини ошкор этманг (махфийлик)",
      "Спам ва реклама тақиқланган",
      "Профессионал стандартларга риоя қилинг",
    ],
    guidelines: "Кўрсатмалар",
  },
  ru: {
    title: "Профессиональный Форум",
    subtitle: "Платформа обмена знаниями для медицинских специалистов",
    newPost: "Новая тема",
    searchPlaceholder: "Поиск по теме, тегу или ключевому слову...",
    allCategories: "Все темы",
    trending: "Популярное",
    latest: "Новые",
    unanswered: "Без ответа",
    saved: "Сохранённые",
    replies: "ответов",
    views: "просмотров",
    post: "постов",
    cancel: "Отмена",
    titleLabel: "Заголовок",
    bodyLabel: "Содержание",
    categoryLabel: "Категория",
    tagLabel: "Теги (через запятую)",
    anonymous: "Опубликовать анонимно",
    submit: "Опубликовать",
    submitting: "Публикация...",
    replyPlaceholder: "Напишите ответ...",
    sendReply: "Отправить",
    deletePost: "Удалить",
    deleteConfirm: "Вы уверены, что хотите удалить этот пост?",
    pinPost: "Закрепить",
    savePost: "Сохранить",
    unsavePost: "Убрать из сохранённых",
    savedMsg: "Пост сохранён",
    unsavedMsg: "Пост удалён из сохранённых",
    like: "Полезно",
    share: "Поделиться",
    shareCopied: "Ссылка скопирована",
    noResults: "Посты не найдены",
    noResultsHint: "Попробуйте другой запрос",
    noReplies: "Ответов пока нет",
    beFirst: "Будьте первым, кто ответит!",
    expert: "Эксперт",
    verified: "Подтверждён",
    posted: "Опубликовано",
    sortBy: "Сортировать",
    sortNew: "Новые",
    sortTop: "Топ",
    sortHot: "Популярные",
    deleteSuccess: "Пост удалён",
    deleteError: "Произошла ошибка",
    createSuccess: "Пост создан",
    createError: "Ошибка при создании поста",
    replySuccess: "Ответ отправлен",
    replyError: "Ошибка при отправке ответа",
    requiredFields: "Заголовок и содержание обязательны",
    stats: "Статистика форума",
    totalPosts: "Всего постов",
    activeUsers: "Активные пользователи",
    todayPosts: "Постов сегодня",
    experts: "Эксперты",
    filterBy: "Фильтр",
    followThread: "Подписаться",
    unfollowThread: "Отписаться",
    subscribeSuccess: "Вы подписались на обновления",
    moreReplies: "Больше ответов",
    collapseReplies: "Свернуть",
    rules: "Правила форума",
    rulesText: [
      "Соблюдайте уважение и культуру общения",
      "Осторожно делитесь медицинскими данными",
      "Не раскрывайте данные пациентов (конфиденциальность)",
      "Спам и реклама запрещены",
      "Соблюдайте профессиональные стандарты",
    ],
    guidelines: "Руководства",
  },
  en: {
    title: "Professional Forum",
    subtitle: "Knowledge sharing platform for medical professionals",
    newPost: "New Topic",
    searchPlaceholder: "Search by topic, tag or keyword...",
    allCategories: "All Topics",
    trending: "Trending",
    latest: "Latest",
    unanswered: "Unanswered",
    saved: "Saved",
    replies: "replies",
    views: "views",
    post: "posts",
    cancel: "Cancel",
    titleLabel: "Title",
    bodyLabel: "Content",
    categoryLabel: "Category",
    tagLabel: "Tags (comma separated)",
    anonymous: "Post anonymously",
    submit: "Post",
    submitting: "Posting...",
    replyPlaceholder: "Write your reply...",
    sendReply: "Send",
    deletePost: "Delete",
    deleteConfirm: "Are you sure you want to delete this post?",
    pinPost: "Pin",
    savePost: "Save",
    unsavePost: "Unsave",
    savedMsg: "Post saved",
    unsavedMsg: "Post removed from saved",
    like: "Helpful",
    share: "Share",
    shareCopied: "Link copied",
    noResults: "No posts found",
    noResultsHint: "Try a different search term",
    noReplies: "No replies yet",
    beFirst: "Be the first to reply!",
    expert: "Expert",
    verified: "Verified",
    posted: "Posted",
    sortBy: "Sort by",
    sortNew: "New",
    sortTop: "Top",
    sortHot: "Hot",
    deleteSuccess: "Post deleted",
    deleteError: "An error occurred",
    createSuccess: "Post created",
    createError: "Error creating post",
    replySuccess: "Reply sent",
    replyError: "Error sending reply",
    requiredFields: "Title and content are required",
    stats: "Forum Stats",
    totalPosts: "Total Posts",
    activeUsers: "Active Users",
    todayPosts: "Today's Posts",
    experts: "Experts",
    filterBy: "Filter",
    followThread: "Follow",
    unfollowThread: "Unfollow",
    subscribeSuccess: "Subscribed to updates",
    moreReplies: "More replies",
    collapseReplies: "Collapse",
    rules: "Forum Rules",
    rulesText: [
      "Be respectful and maintain professional discourse",
      "Share medical data carefully",
      "Do not disclose patient information (privacy)",
      "Spam and advertising are prohibited",
      "Adhere to professional standards",
    ],
    guidelines: "Guidelines",
  },
  kk: {
    title: "Кәсіби Форум",
    subtitle: "Медицина мамандары үшін білім алмасу платформасы",
    newPost: "Жаңа тақырып",
    searchPlaceholder: "Тақырып, тег немесе кілт сөз іздеңіз...",
    allCategories: "Барлық тақырыптар",
    trending: "Танымал",
    latest: "Жаңа",
    unanswered: "Жауапсыз",
    saved: "Сақталған",
    replies: "жауап",
    views: "көру",
    post: "жазба",
    cancel: "Болдырмау",
    titleLabel: "Тақырып",
    bodyLabel: "Мазмұн",
    categoryLabel: "Санат",
    tagLabel: "Тегтер (үтірмен бөліңіз)",
    anonymous: "Анонимді жіберу",
    submit: "Жариялау",
    submitting: "Жіберілуде...",
    replyPlaceholder: "Жауабыңызды жазыңыз...",
    sendReply: "Жіберу",
    deletePost: "Жою",
    deleteConfirm: "Бұл жазбаны жойғыңыз келе ме?",
    pinPost: "Бекіту",
    savePost: "Сақтау",
    unsavePost: "Сақтаудан алып тастау",
    savedMsg: "Жазба сақталды",
    unsavedMsg: "Жазба жойылды",
    like: "Пайдалы",
    share: "Бөлісу",
    shareCopied: "Сілтеме көшірілді",
    noResults: "Жазбалар табылмады",
    noResultsHint: "Басқа сөзбен іздеп көріңіз",
    noReplies: "Әзір жауаптар жоқ",
    beFirst: "Бірінші болып жауап беріңіз!",
    expert: "Сарапшы",
    verified: "Расталған",
    posted: "Жарияланды",
    sortBy: "Сұрыптау",
    sortNew: "Жаңа",
    sortTop: "Үздік",
    sortHot: "Танымал",
    deleteSuccess: "Жазба жойылды",
    deleteError: "Қате орын алды",
    createSuccess: "Жазба жасалды",
    createError: "Жазба жасауда қате",
    replySuccess: "Жауап жіберілді",
    replyError: "Жауап жіберуде қате",
    requiredFields: "Тақырып пен мазмұн міндетті",
    stats: "Форум статистикасы",
    totalPosts: "Барлық жазбалар",
    activeUsers: "Белсенді пайдаланушылар",
    todayPosts: "Бүгінгі жазбалар",
    experts: "Сарапшылар",
    filterBy: "Сүзгі",
    followThread: "Қадағалау",
    unfollowThread: "Қадағалауды тоқтату",
    subscribeSuccess: "Жаңалықтарға жазылдыңыз",
    moreReplies: "Көбірек жауаптар",
    collapseReplies: "Жию",
    rules: "Форум ережелері",
    rulesText: [
      "Сыйластық пен мәдени қарым-қатынасты сақтаңыз",
      "Медициналық деректерді сақтықпен бөлісіңіз",
      "Пациент деректерін ашпаңыз (құпиялылық)",
      "Спам мен жарнама тыйым салынған",
      "Кәсіби стандарттарды сақтаңыз",
    ],
    guidelines: "Нұсқаулар",
  },
};

const CATS = [
  { id: 'all', icon: MessageSquare, color: 'text-slate-500' },
  { id: 'Murakkab Holatlar', icon: AlertCircle, color: 'text-red-500' },
  { id: 'SanQvaN Maslahatlari', icon: Flame, color: 'text-orange-500' },
  { id: 'Huquqiy Yordam', icon: Scale, color: 'text-blue-500' },
  { id: 'Umumiy', icon: MessageSquare, color: 'text-slate-500' },
];

const CAT_LABELS: Record<LK, Record<string, string>> = {
  uz: { all: 'Barchasi', 'Murakkab Holatlar': 'Murakkab Holatlar', 'SanQvaN Maslahatlari': 'SanQvaN Maslahatlari', 'Huquqiy Yordam': 'Huquqiy Yordam', 'Umumiy': 'Umumiy' },
  uz_cyrillic: { all: 'Барчаси', 'Murakkab Holatlar': 'Мураккаб Ҳолатлар', 'SanQvaN Maslahatlari': 'СанҚвaN Маслаҳатлари', 'Huquqiy Yordam': 'Ҳуқуқий Ёрдам', 'Umumiy': 'Умумий' },
  ru: { all: 'Все', 'Murakkab Holatlar': 'Сложные случаи', 'SanQvaN Maslahatlari': 'Советы СанКвН', 'Huquqiy Yordam': 'Правовая помощь', 'Umumiy': 'Общее' },
  en: { all: 'All', 'Murakkab Holatlar': 'Complex Cases', 'SanQvaN Maslahatlari': 'SanQvaN Advice', 'Huquqiy Yordam': 'Legal Help', 'Umumiy': 'General' },
  kk: { all: 'Барлығы', 'Murakkab Holatlar': 'Күрделі жағдайлар', 'SanQvaN Maslahatlari': 'СанҚвН кеңестері', 'Huquqiy Yordam': 'Заңды көмек', 'Umumiy': 'Жалпы' },
};

const CATEGORY_COLORS: Record<string, string> = {
  'Murakkab Holatlar': 'bg-red-50 text-red-700 border-red-200',
  'SanQvaN Maslahatlari': 'bg-orange-50 text-orange-700 border-orange-200',
  'Huquqiy Yordam': 'bg-blue-50 text-blue-700 border-blue-200',
  'Umumiy': 'bg-slate-50 text-slate-700 border-slate-200',
};

type SortMode = 'new' | 'top' | 'hot';
type TabMode = 'all' | 'trending' | 'unanswered' | 'saved';

function timeAgo(date: Date, lang: LK): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (lang === 'ru') {
    if (mins < 2) return 'только что';
    if (mins < 60) return `${mins} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    return `${days} д назад`;
  }
  if (lang === 'en') {
    if (mins < 2) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }
  if (mins < 2) return 'hozirgina';
  if (mins < 60) return `${mins} daqiqa oldin`;
  if (hours < 24) return `${hours} soat oldin`;
  return `${days} kun oldin`;
}

export default function ForumPage() {
  const { user, userProfile, userRole } = useAuth();
  const { lang } = useLanguage();
  const tx = L[lang as LK] ?? L.uz;
  const catLabels = CAT_LABELS[lang as LK] ?? CAT_LABELS.uz;

  const [activeCategory, setActiveCategory] = useState('all');
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('new');
  const [tab, setTab] = useState<TabMode>('all');
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [followedThreads, setFollowedThreads] = useState<Set<string>>(new Set());

  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newCategory, setNewCategory] = useState('Umumiy');
  const [newTags, setNewTags] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  const [showRulesPanel, setShowRulesPanel] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoadingPosts(true);
    try {
      const data = await getForumPosts(activeCategory === 'all' ? undefined : activeCategory);
      setPosts(data);
    } catch {
      // silently fail — use empty state
    } finally {
      setLoadingPosts(false);
    }
  }

  useEffect(() => { loadPosts(); }, [activeCategory]);

  const filtered = useMemo(() => {
    let list = [...posts];
    if (tab === 'saved') list = list.filter(p => savedPosts.has(p.id));
    if (tab === 'unanswered') list = list.filter(p => (p.replies ?? 0) === 0);
    if (tab === 'trending') list = list.filter(p => (p.views ?? 0) > 20 || (p.replies ?? 0) > 3);
    const q = search.toLowerCase();
    if (q) list = list.filter(p => p.title.toLowerCase().includes(q) || p.body?.toLowerCase().includes(q));
    if (sort === 'top') list.sort((a, b) => (b.replies ?? 0) - (a.replies ?? 0));
    else if (sort === 'hot') list.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    else list.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
    return list;
  }, [posts, search, tab, sort, savedPosts]);

  const stats = useMemo(() => ({
    total: posts.length,
    today: posts.filter(p => {
      return p.createdAt && new Date().toDateString() === new Date(p.createdAt).toDateString();
    }).length,
    unanswered: posts.filter(p => (p.replies ?? 0) === 0).length,
  }), [posts]);

  async function handleCreate() {
    if (!newTitle.trim() || !newBody.trim()) { toast.error(tx.requiredFields); return; }
    if (!user) return;
    setSubmitting(true);
    try {
      await createForumPost({
        title: newTitle.trim(),
        body: newBody.trim(),
        category: newCategory,
        authorId: isAnonymous ? 'anonymous' : user.uid,
        authorName: isAnonymous ? 'Anonim' : (userProfile?.displayName ?? user.email ?? 'User'),
        authorRole: (userRole ?? 'doctor') as UserRole,
        replies: 0,
        views: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast.success(tx.createSuccess);
      setShowNewModal(false);
      setNewTitle(''); setNewBody(''); setNewTags(''); setIsAnonymous(false);
      loadPosts();
    } catch {
      toast.error(tx.createError);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOpenPost(post: ForumPost) {
    setSelectedPost(post);
    setReplies([]);
    setLoadingReplies(true);
    setShowReplies(true);
    try {
      await incrementForumViews(post.id);
      const data = await getForumReplies(post.id);
      setReplies(data);
    } catch { /* ignore */ } finally {
      setLoadingReplies(false);
    }
    setTimeout(() => replyRef.current?.focus(), 300);
  }

  async function handleSendReply() {
    if (!replyText.trim() || !user || !selectedPost) return;
    setSendingReply(true);
    try {
      await createForumReply({
        postId: selectedPost.id,
        body: replyText.trim(),
        authorId: user.uid,
        authorName: userProfile?.displayName ?? user.email ?? 'User',
        authorRole: (userRole ?? 'doctor') as UserRole,
        createdAt: new Date().toISOString(),
      });
      toast.success(tx.replySuccess);
      setReplyText('');
      const data = await getForumReplies(selectedPost.id);
      setReplies(data);
    } catch {
      toast.error(tx.replyError);
    } finally {
      setSendingReply(false);
    }
  }

  async function handleDelete(postId: string) {
    try {
      await deleteForumPost(postId);
      toast.success(tx.deleteSuccess);
      if (selectedPost?.id === postId) setSelectedPost(null);
      loadPosts();
    } catch {
      toast.error(tx.deleteError);
    } finally {
      setDeleteConfirmId(null);
    }
  }

  function toggleSave(id: string) {
    setSavedPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast.info(tx.unsavedMsg); }
      else { next.add(id); toast.success(tx.savedMsg); }
      return next;
    });
  }

  function toggleLike(id: string) {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleFollow(id: string) {
    setFollowedThreads(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else { next.add(id); toast.success(tx.subscribeSuccess); }
      return next;
    });
  }

  function handleShare(title: string) {
    navigator.clipboard.writeText(title);
    toast.success(tx.shareCopied);
  }

  const TABS: { key: TabMode; label: string; count?: number }[] = [
    { key: 'all', label: tx.allCategories, count: posts.length },
    { key: 'trending', label: tx.trending },
    { key: 'unanswered', label: tx.unanswered, count: stats.unanswered },
    { key: 'saved', label: tx.saved, count: savedPosts.size },
  ];

  return (
    <div className="max-w-6xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-600" />{tx.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{tx.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowRulesPanel(v => !v)}>
            <Hash className="w-3.5 h-3.5 mr-1" />{tx.rules}
          </Button>
          <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowNewModal(true)}>
            <Plus className="w-4 h-4" />{tx.newPost}
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: tx.totalPosts, value: posts.length, icon: MessageSquare, color: 'text-indigo-600 bg-indigo-50' },
          { label: tx.todayPosts, value: stats.today, icon: Clock, color: 'text-green-600 bg-green-50' },
          { label: tx.unanswered, value: stats.unanswered, icon: AlertCircle, color: 'text-orange-600 bg-orange-50' },
          { label: tx.experts, value: 12, icon: Award, color: 'text-purple-600 bg-purple-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-3 p-3 rounded-xl border bg-white">
            <div className={`p-2 rounded-lg ${color}`}><Icon className="w-4 h-4" /></div>
            <div><p className="text-lg font-bold leading-none">{value}</p><p className="text-xs text-muted-foreground mt-0.5">{label}</p></div>
          </div>
        ))}
      </div>

      {/* Rules panel */}
      {showRulesPanel && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-amber-800 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />{tx.rules}</p>
              <button onClick={() => setShowRulesPanel(false)} className="text-amber-600 hover:text-amber-800"><X className="w-4 h-4" /></button>
            </div>
            <ul className="space-y-1">
              {tx.rulesText.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                  <span className="font-bold mt-0.5">{i + 1}.</span>{r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-5">
        {/* Left: categories sidebar */}
        <div className="hidden lg:flex flex-col w-48 shrink-0 gap-1">
          {CATS.map(({ id, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${activeCategory === id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <Icon className={`w-4 h-4 ${activeCategory === id ? 'text-white' : color}`} />
              {catLabels[id]}
            </button>
          ))}
        </div>

        {/* Right: main content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Tabs + search + sort */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
              {TABS.map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${tab === key ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  {label}
                  {count !== undefined && <span className={`rounded-full px-1.5 text-xs font-bold ${tab === key ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{count}</span>}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={tx.searchPlaceholder} className="pl-9" />
                {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
              </div>
              <select value={sort} onChange={e => setSort(e.target.value as SortMode)} className="h-10 rounded-md border border-input px-2 text-sm bg-background">
                <option value="new">{tx.sortNew}</option>
                <option value="top">{tx.sortTop}</option>
                <option value="hot">{tx.sortHot}</option>
              </select>
            </div>
          </div>

          {/* Post list / detail */}
          {selectedPost ? (
            <div className="space-y-4">
              <button onClick={() => setSelectedPost(null)} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                <ArrowLeft className="w-4 h-4" />{tx.allCategories}
              </button>
              <Card>
                <CardContent className="p-5 space-y-4">
                  {/* Post header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {selectedPost.pinned && <Pin className="w-4 h-4 text-indigo-500" />}
                        <Badge className={`text-xs ${CATEGORY_COLORS[selectedPost.category] ?? 'bg-slate-100 text-slate-600'}`}>{catLabels[selectedPost.category] ?? selectedPost.category}</Badge>
                      </div>
                      <h2 className="text-lg font-bold text-slate-800">{selectedPost.title}</h2>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><UserCircle2 className="w-3.5 h-3.5" />{selectedPost.authorName}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{selectedPost.createdAt ? timeAgo(new Date(selectedPost.createdAt), lang as LK) : ''}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{selectedPost.views ?? 0} {tx.views}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => toggleSave(selectedPost.id)} className="p-1.5 rounded-lg hover:bg-slate-100">
                        {savedPosts.has(selectedPost.id) ? <BookmarkCheck className="w-4 h-4 text-indigo-500" /> : <Bookmark className="w-4 h-4 text-slate-400" />}
                      </button>
                      <button onClick={() => toggleFollow(selectedPost.id)} className="p-1.5 rounded-lg hover:bg-slate-100">
                        {followedThreads.has(selectedPost.id) ? <BellOff className="w-4 h-4 text-indigo-500" /> : <Bell className="w-4 h-4 text-slate-400" />}
                      </button>
                      <button onClick={() => handleShare(selectedPost.title)} className="p-1.5 rounded-lg hover:bg-slate-100">
                        <Share2 className="w-4 h-4 text-slate-400" />
                      </button>
                      {(user?.uid === selectedPost.authorId || userRole === 'admin') && (
                        <button onClick={() => setDeleteConfirmId(selectedPost.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedPost.body}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleLike(selectedPost.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${likedPosts.has(selectedPost.id) ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-indigo-300 text-slate-600'}`}>
                      <ThumbsUp className="w-3.5 h-3.5" />{tx.like}
                    </button>
                  </div>

                  {/* Replies */}
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <button onClick={() => setShowReplies(v => !v)} className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <MessageSquare className="w-4 h-4 text-indigo-500" />
                      {replies.length} {tx.replies}
                      <ChevronDown className={`w-4 h-4 transition-transform ${showReplies ? 'rotate-180' : ''}`} />
                    </button>
                    {showReplies && (
                      <>
                        {loadingReplies ? (
                          <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
                        ) : replies.length === 0 ? (
                          <div className="text-center py-8 border border-dashed rounded-xl">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                            <p className="text-sm text-slate-500">{tx.noReplies}</p>
                            <p className="text-xs text-slate-400">{tx.beFirst}</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {replies.map((r) => (
                              <div key={r.id} className="flex gap-3 p-3 rounded-lg bg-slate-50">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                  <UserCircle2 className="w-5 h-5 text-indigo-500" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-semibold text-slate-700">{r.authorName}</span>
                                    {r.authorRole === 'doctor' && <Badge className="text-xs bg-blue-100 text-blue-700 py-0">{tx.expert}</Badge>}
                                    <span className="text-xs text-slate-400">{r.createdAt ? timeAgo(new Date(r.createdAt), lang as LK) : ''}</span>
                                  </div>
                                  <p className="text-sm text-slate-700">{r.body}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Reply input */}
                        <div className="flex gap-2 pt-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <UserCircle2 className="w-5 h-5 text-slate-400" />
                          </div>
                          <div className="flex-1 flex gap-2">
                            <Textarea
                              ref={replyRef}
                              rows={2}
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              placeholder={tx.replyPlaceholder}
                              className="resize-none text-sm"
                              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSendReply(); }}
                            />
                            <Button onClick={handleSendReply} disabled={!replyText.trim() || sendingReply} size="sm" className="shrink-0 self-end bg-indigo-600 hover:bg-indigo-700">
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : loadingPosts ? (
            <div className="space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 border border-dashed rounded-xl">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-200" />
              <p className="font-medium text-slate-700">{tx.noResults}</p>
              <p className="text-xs text-slate-400 mt-1">{tx.noResultsHint}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((post) => (
                <Card key={post.id} className={`hover:shadow-sm transition-all cursor-pointer ${post.pinned ? 'border-indigo-200 bg-indigo-50/30' : ''}`} onClick={() => handleOpenPost(post)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <UserCircle2 className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {post.pinned && <Pin className="w-3.5 h-3.5 text-indigo-500" />}
                          <Badge className={`text-xs ${CATEGORY_COLORS[post.category] ?? 'bg-slate-100 text-slate-600'}`}>{catLabels[post.category] ?? post.category}</Badge>
                          {(post.replies ?? 0) === 0 && <Badge className="text-xs bg-amber-50 text-amber-700 border-amber-200">·</Badge>}
                        </div>
                        <h3 className="font-semibold text-slate-800 line-clamp-1">{post.title}</h3>
                        <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{post.body}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><UserCircle2 className="w-3 h-3" />{post.authorName}</span>
                          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{post.replies ?? 0} {tx.replies}</span>
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views ?? 0}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.createdAt ? timeAgo(new Date(post.createdAt), lang as LK) : ''}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={() => toggleSave(post.id)} className="p-1.5 rounded-lg hover:bg-slate-100">
                          {savedPosts.has(post.id) ? <BookmarkCheck className="w-4 h-4 text-indigo-500" /> : <Bookmark className="w-4 h-4 text-slate-300" />}
                        </button>
                        <button onClick={() => handleShare(post.title)} className="p-1.5 rounded-lg hover:bg-slate-100">
                          <Share2 className="w-4 h-4 text-slate-300" />
                        </button>
                        {(user?.uid === post.authorId || userRole === 'admin') && (
                          <button onClick={() => setDeleteConfirmId(post.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New post modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-lg">{tx.newPost}</h2>
              <button onClick={() => setShowNewModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{tx.titleLabel}</label>
                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder={tx.titleLabel} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{tx.categoryLabel}</label>
                <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full h-10 rounded-md border border-input px-3 text-sm bg-background">
                  {CATS.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{catLabels[c.id]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{tx.bodyLabel}</label>
                <Textarea value={newBody} onChange={e => setNewBody(e.target.value)} rows={5} placeholder={tx.bodyLabel} className="resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{tx.tagLabel}</label>
                <Input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="kardiologiya, davolash..." />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="rounded" />
                {tx.anonymous}
              </label>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t">
              <Button variant="outline" onClick={() => setShowNewModal(false)}>{tx.cancel}</Button>
              <Button onClick={handleCreate} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700">
                {submitting ? tx.submitting : tx.submit}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <p className="font-semibold text-slate-800">{tx.deleteConfirm}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>{tx.cancel}</Button>
              <Button variant="destructive" onClick={() => handleDelete(deleteConfirmId)}>{tx.deletePost}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
