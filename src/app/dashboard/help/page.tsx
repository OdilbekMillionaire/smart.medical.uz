'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  HelpCircle, Search, Video, MessageSquare, ChevronDown,
  ExternalLink, Zap, FileText, Shield, Database, Clock, ThumbsUp, ThumbsDown,
  X, CheckCircle2, Phone, Mail, Bot, Star, ArrowRight, Bookmark, Copy,
  LifeBuoy, Info, BookOpen,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type LK = 'uz' | 'uz_cyrillic' | 'ru' | 'en' | 'kk';

const L: Record<LK, {
  title: string; subtitle: string; searchPlaceholder: string;
  quickLinks: string; articles: string; videoTutorials: string;
  contact: string; notFound: string; support247: string;
  emailLabel: string; phoneLabel: string; chatLabel: string;
  wasHelpful: string; yes: string; no: string; feedbackThanks: string;
  readMore: string; copyLink: string; linkCopied: string;
  popularArticles: string; allTopics: string; noResults: string;
  noResultsHint: string; minutes: string; guide: string; video: string;
  liveChat: string; ticketLabel: string; submitTicket: string;
  faqTitle: string; contactTitle: string; contactSubtitle: string;
  viewAll: string; bookmarked: string; unbookmarked: string;
  newBadge: string; popularBadge: string; updatedBadge: string;
  status: string; allGood: string; minorIssues: string;
  sections: {
    start: string; documents: string; inspection: string;
    erp: string; compliance: string; ai: string; profile: string;
  };
}> = {
  uz: {
    title: "Yordam Markazi",
    subtitle: "Platformadan foydalanish bo'yicha qo'llanma va darsliklar",
    searchPlaceholder: "Savol yoki mavzu qidiring...",
    quickLinks: "Tezkor havolalar",
    articles: "maqola",
    videoTutorials: "Video Darsliklar",
    contact: "Bog'lanish",
    notFound: "Javob topolmadingizmi?",
    support247: "Texnik yordam jamoamiz 24/7 yordam beradi",
    emailLabel: "Email yordam",
    phoneLabel: "Telefon qo'llab-quvvatlash",
    chatLabel: "Jonli chat",
    wasHelpful: "Bu maqola foydali bo'ldimi?",
    yes: "Ha, foydali",
    no: "Yo'q, to'liqroq kerak",
    feedbackThanks: "Fikringiz uchun rahmat!",
    readMore: "To'liqroq o'qish",
    copyLink: "Havola nusxalash",
    linkCopied: "Havola nusxalandi",
    popularArticles: "Mashhur maqolalar",
    allTopics: "Barcha mavzular",
    noResults: "Natija topilmadi",
    noResultsHint: "Boshqa kalit so'z bilan urinib ko'ring",
    minutes: "daqiqa",
    guide: "Qo'llanma",
    video: "Video",
    liveChat: "Jonli chat",
    ticketLabel: "Ticket yuborish",
    submitTicket: "Muammoni bildirish",
    faqTitle: "Ko'p so'raladigan savollar",
    contactTitle: "Bog'lanish imkoniyatlari",
    contactSubtitle: "Qaysi yo'l bilan murojaat qilishni tanlang",
    viewAll: "Hammasini ko'rish",
    bookmarked: "Saqlandi",
    unbookmarked: "O'chirildi",
    newBadge: "Yangi",
    popularBadge: "Mashhur",
    updatedBadge: "Yangilangan",
    status: "Tizim holati",
    allGood: "Barcha tizimlar ishlayapti",
    minorIssues: "Kichik muammolar",
    sections: {
      start: "Boshlash", documents: "Hujjatlar", inspection: "Anti-tekshiruv",
      erp: "ERP Tizim", compliance: "Muddatlar", ai: "AI Maslahatchi", profile: "Profil",
    },
  },
  uz_cyrillic: {
    title: "Ёрдам Маркази",
    subtitle: "Платформадан фойдаланиш бўйича қўлланма ва дарсликлар",
    searchPlaceholder: "Савол ёки мавзу қидиринг...",
    quickLinks: "Тезкор ҳаволалар",
    articles: "мақола",
    videoTutorials: "Видео Дарсликлар",
    contact: "Боғланиш",
    notFound: "Жавоб топа олмадингизми?",
    support247: "Техник ёрдам жамоамиз 24/7 ёрдам беради",
    emailLabel: "Email ёрдам",
    phoneLabel: "Телефон қўллаб-қувватлаш",
    chatLabel: "Жонли чат",
    wasHelpful: "Бу мақола фойдали бўлдими?",
    yes: "Ҳа, фойдали",
    no: "Йўқ, тўлиқроқ керак",
    feedbackThanks: "Фикрингиз учун раҳмат!",
    readMore: "Тўлиқроқ ўқиш",
    copyLink: "Ҳавола нусхалаш",
    linkCopied: "Ҳавола нусхаланди",
    popularArticles: "Машҳур мақолалар",
    allTopics: "Барча мавзулар",
    noResults: "Натижа топилмади",
    noResultsHint: "Бошқа калит сўз билан уриниб кўринг",
    minutes: "дақиқа",
    guide: "Қўлланма",
    video: "Видео",
    liveChat: "Жонли чат",
    ticketLabel: "Тикет юбориш",
    submitTicket: "Муаммони билдириш",
    faqTitle: "Кўп сўраладиган саволлар",
    contactTitle: "Боғланиш имкониятлари",
    contactSubtitle: "Қайси йўл билан мурожаат қилишни танланг",
    viewAll: "Ҳаммасини кўриш",
    bookmarked: "Сақланди",
    unbookmarked: "Ўчирилди",
    newBadge: "Янги",
    popularBadge: "Машҳур",
    updatedBadge: "Янгиланган",
    status: "Тизим ҳолати",
    allGood: "Барча тизимлар ишлаяпти",
    minorIssues: "Кичик муаммолар",
    sections: {
      start: "Бошлаш", documents: "Ҳужжатлар", inspection: "Анти-текширув",
      erp: "ERP Тизим", compliance: "Муддатлар", ai: "AI Маслаҳатчи", profile: "Профил",
    },
  },
  ru: {
    title: "Центр помощи",
    subtitle: "Руководство и учебные материалы по использованию платформы",
    searchPlaceholder: "Найти вопрос или тему...",
    quickLinks: "Быстрые ссылки",
    articles: "статей",
    videoTutorials: "Видеоуроки",
    contact: "Связаться",
    notFound: "Не нашли ответ?",
    support247: "Наша служба поддержки работает 24/7",
    emailLabel: "Email-поддержка",
    phoneLabel: "Телефонная поддержка",
    chatLabel: "Онлайн-чат",
    wasHelpful: "Эта статья была полезна?",
    yes: "Да, спасибо",
    no: "Нет, нужно подробнее",
    feedbackThanks: "Спасибо за обратную связь!",
    readMore: "Читать полностью",
    copyLink: "Скопировать ссылку",
    linkCopied: "Ссылка скопирована",
    popularArticles: "Популярные статьи",
    allTopics: "Все темы",
    noResults: "Результаты не найдены",
    noResultsHint: "Попробуйте другой запрос",
    minutes: "мин",
    guide: "Руководство",
    video: "Видео",
    liveChat: "Онлайн-чат",
    ticketLabel: "Отправить тикет",
    submitTicket: "Сообщить о проблеме",
    faqTitle: "Часто задаваемые вопросы",
    contactTitle: "Способы связи",
    contactSubtitle: "Выберите удобный способ связи",
    viewAll: "Показать все",
    bookmarked: "Сохранено",
    unbookmarked: "Удалено",
    newBadge: "Новое",
    popularBadge: "Популярное",
    updatedBadge: "Обновлено",
    status: "Статус системы",
    allGood: "Все системы работают",
    minorIssues: "Незначительные проблемы",
    sections: {
      start: "Начало работы", documents: "Документы", inspection: "Антипроверка",
      erp: "ERP Система", compliance: "Дедлайны", ai: "ИИ Консультант", profile: "Профиль",
    },
  },
  en: {
    title: "Help Center",
    subtitle: "Guides and tutorials for using the platform",
    searchPlaceholder: "Search a question or topic...",
    quickLinks: "Quick Links",
    articles: "articles",
    videoTutorials: "Video Tutorials",
    contact: "Contact",
    notFound: "Can't find the answer?",
    support247: "Our support team is available 24/7",
    emailLabel: "Email support",
    phoneLabel: "Phone support",
    chatLabel: "Live chat",
    wasHelpful: "Was this article helpful?",
    yes: "Yes, helpful",
    no: "No, needs more detail",
    feedbackThanks: "Thanks for your feedback!",
    readMore: "Read more",
    copyLink: "Copy link",
    linkCopied: "Link copied",
    popularArticles: "Popular articles",
    allTopics: "All topics",
    noResults: "No results found",
    noResultsHint: "Try a different search term",
    minutes: "min",
    guide: "Guide",
    video: "Video",
    liveChat: "Live chat",
    ticketLabel: "Submit ticket",
    submitTicket: "Report an issue",
    faqTitle: "Frequently Asked Questions",
    contactTitle: "Contact options",
    contactSubtitle: "Choose how you'd like to reach us",
    viewAll: "View all",
    bookmarked: "Saved",
    unbookmarked: "Removed",
    newBadge: "New",
    popularBadge: "Popular",
    updatedBadge: "Updated",
    status: "System status",
    allGood: "All systems operational",
    minorIssues: "Minor issues",
    sections: {
      start: "Getting Started", documents: "Documents", inspection: "Anti-Inspection",
      erp: "ERP System", compliance: "Deadlines", ai: "AI Advisor", profile: "Profile",
    },
  },
  kk: {
    title: "Анықтама Орталығы",
    subtitle: "Платформаны пайдалану бойынша нұсқаулар мен оқулықтар",
    searchPlaceholder: "Сұрақ немесе тақырып іздеңіз...",
    quickLinks: "Жылдам сілтемелер",
    articles: "мақала",
    videoTutorials: "Бейне Оқулықтар",
    contact: "Байланыс",
    notFound: "Жауап таппадыңыз ба?",
    support247: "Қолдау қызметіміз 24/7 жұмыс істейді",
    emailLabel: "Email қолдауы",
    phoneLabel: "Телефон қолдауы",
    chatLabel: "Тікелей чат",
    wasHelpful: "Бұл мақала пайдалы болды ма?",
    yes: "Иә, пайдалы",
    no: "Жоқ, толығырақ керек",
    feedbackThanks: "Пікіріңіз үшін рахмет!",
    readMore: "Толығырақ оқу",
    copyLink: "Сілтемені көшіру",
    linkCopied: "Сілтеме көшірілді",
    popularArticles: "Танымал мақалалар",
    allTopics: "Барлық тақырыптар",
    noResults: "Нәтиже табылмады",
    noResultsHint: "Басқа кілт сөзбен іздеп көріңіз",
    minutes: "мин",
    guide: "Нұсқаулық",
    video: "Бейне",
    liveChat: "Тікелей чат",
    ticketLabel: "Тикет жіберу",
    submitTicket: "Мәселені хабарлау",
    faqTitle: "Жиі қойылатын сұрақтар",
    contactTitle: "Байланыс мүмкіндіктері",
    contactSubtitle: "Хабарласу тәсілін таңдаңыз",
    viewAll: "Барлығын көру",
    bookmarked: "Сақталды",
    unbookmarked: "Жойылды",
    newBadge: "Жаңа",
    popularBadge: "Танымал",
    updatedBadge: "Жаңартылған",
    status: "Жүйе күйі",
    allGood: "Барлық жүйелер жұмыс істеуде",
    minorIssues: "Шағын мәселелер",
    sections: {
      start: "Бастау", documents: "Құжаттар", inspection: "Тексерімге қарсы",
      erp: "ERP Жүйесі", compliance: "Мерзімдер", ai: "AI Кеңесші", profile: "Профиль",
    },
  },
};

// ─── Article content by language ────────────────────────────────────────────
const ARTICLES_BY_LANG: Record<LK, { sections: Array<{ id: string; title: string; color: string; bgColor: string; iconId: string; articles: Array<{ id: string; title: string; content: string; readTime: number; badge: string | null }> }> }> = {
  uz: { sections: [
    { id: 'start', title: 'Boshlash', color: 'text-yellow-500', bgColor: 'bg-yellow-50 border-yellow-200', iconId: 'zap', articles: [
      { id: 'reg', title: "Platformada ro'yxatdan o'tish", content: "Ro'yxatdan o'tish uchun Bosh sahifadan \"Bepul boshlash\" tugmasini bosing. Rolingizni (Klinika, Shifokor yoki Bemor) tanlang va profil ma'lumotlaringizni kiriting. Profil to'ldirilgandan so'ng barcha funksiyalarga kirish mumkin bo'ladi.", readTime: 2, badge: 'popular' },
      { id: 'profile', title: "Profilni to'ldirish", content: "Dashboard → Profil bo'limiga o'ting. Barcha majburiy maydonlarni to'ldiring. Klinikalar uchun: litsenziya ma'lumotlari va sertifikatlarni yuklash majburiy. Shifokorlar uchun: diplom va malaka sertifikati kerak.", readTime: 3, badge: null },
      { id: 'roles', title: "Rol farqlari", content: "Admin: Platforma bo'ylab to'liq nazorat. Klinika: O'z ma'lumotlari, xodimlar, ERP. Shifokor: Hujjatlar, forum, bilimlar. Bemor: AI maslahat, o'z hujjatlari, QR karta.", readTime: 2, badge: null },
    ]},
    { id: 'documents', title: 'Hujjatlar', color: 'text-blue-500', bgColor: 'bg-blue-50 border-blue-200', iconId: 'file', articles: [
      { id: 'create', title: "Hujjat yaratish", content: "Hujjatlar → Yangi hujjat. Shablon tanlang (8 ta shablon mavjud). Maydonlarni to'ldiring — AI avtomatik matn taklif qiladi. Saqlash yoki Ko'rib chiqishga yuborish tugmasini bosing.", readTime: 4, badge: 'popular' },
      { id: 'status', title: "Hujjat holatlari", content: "Qoralama: faqat siz ko'rishingiz mumkin. Ko'rib chiqishda: admin ko'rib chiqmoqda. Tasdiqlangan: rasmiy hujjat. Rad etilgan: tuzatish talab etiladi.", readTime: 2, badge: null },
      { id: 'ai-doc', title: "AI hujjat tayyorlash", content: "Shablon asosida AI avtomatik matn generatsiya qiladi. Bu faqat tavsiya — mutaxassis ko'rib chiqishi tavsiya etiladi. Module 1 ulangandan so'ng RAG asosida yanada aniqroq javoblar beriladi.", readTime: 3, badge: 'new' },
    ]},
    { id: 'inspection', title: 'Anti-tekshiruv', color: 'text-red-500', bgColor: 'bg-red-50 border-red-200', iconId: 'shield', articles: [
      { id: 'check', title: "Tekshiruv tayyorgarligi", content: "4 ta checklist mavjud: Sanitariya, Litsenziya, Hujjatlar, Xodimlar. Har bir punkt uchun O'tdi/Ogohlantirish/Muvaffaqiyatsiz belgilang. Risk bali avtomatik hisoblanadi.", readTime: 5, badge: 'popular' },
      { id: 'sim', title: "Inspektor simulyatsiyasi", content: "3 ta stsenariy: Rejalashtirilgan, Shikoyat asosida, Kutilmagan. Inspektor savollari va tekshiruv tartibini oldindan bilish imkoniyati. Har bir bosqich bo'yicha tayyorgarlik darajangizni belgilang.", readTime: 4, badge: null },
      { id: 'risk', title: "Risk bali nima?", content: "Har bir \"Muvaffaqiyatsiz\" belgilangan punkt uchun xavf darajasiga qarab ballar qo'shiladi (Yuqori=3, O'rta=2, Past=1). 10+ = Yuqori risk, 5-10 = O'rta risk, <5 = Past risk.", readTime: 3, badge: null },
    ]},
    { id: 'erp', title: 'ERP Tizim', color: 'text-green-500', bgColor: 'bg-green-50 border-green-200', iconId: 'database', articles: [
      { id: 'visit', title: "Bemor tashrifini kiritish", content: "ERP → Vizitlar → Yangi vizit. Bemor qidirish/tanlash. Tashxis, retsept va protseduralarni kiriting. Keyingi tashrif sanasini belgilang.", readTime: 4, badge: 'popular' },
      { id: 'analytics', title: "Analitika ko'rsatkichlari", content: "Analitika tabida: kunlik tashriflar, top tashxislar, dorilar statistikasi, shifokor bo'yicha ko'rsatkichlar mavjud. Oxirgi 30 kun standart davr hisoblanadi.", readTime: 3, badge: null },
      { id: 'cleaning', title: "Tozalash jurnali", content: "Har kuni Tozalash tabida vazifalarga belgi qo'ying. Bu ma'lumot inspeksiya tekshiruvida talab qilinadi. Sanitariya raqami bo'yicha hisobot chiqarish mumkin.", readTime: 2, badge: null },
    ]},
    { id: 'compliance', title: 'Muddatlar (Compliance)', color: 'text-orange-500', bgColor: 'bg-orange-50 border-orange-200', iconId: 'clock', articles: [
      { id: 'add', title: "Muddat qo'shish", content: "Muddatlar → Yangi muddat. Tur tanlang (Litsenziya, Sertifikat, Shartnoma, Protokol). Tugash sanasini kiriting. Tizim avtomatik 30/14/7 kun oldin eslatma yuboradi.", readTime: 3, badge: null },
      { id: 'email', title: "Email eslatmalar", content: "Compliance Check API orqali kunlik avtomatik tekshiruv o'tkaziladi. 7 kundan kam qolganda clinic@email.com ga Resend orqali xabar yuboriladi.", readTime: 2, badge: 'updated' },
      { id: 'auto-doc', title: "Hujjat avtomatik yaratish", content: "\"Hujjat yaratish\" tugmasi bosilganda, muddat turiga mos shablon asosida qoralama hujjat yaratiladi (litsenziya → yangilash ariza, sertifikat → buyruq va h.k.).", readTime: 3, badge: null },
    ]},
    { id: 'ai', title: 'AI Maslahatchi', color: 'text-purple-500', bgColor: 'bg-purple-50 border-purple-200', iconId: 'bot', articles: [
      { id: 'chat', title: "AI bilan suhbatlashish", content: "AI Maslahatchi → Chat bo'limiga o'ting. Tibbiy-yuridik savolingizni yozing. AI Gemini 2.5 modeli asosida javob beradi. 3 rejim mavjud: Tez, Muvozanatli, Chuqur tahlil.", readTime: 3, badge: 'popular' },
      { id: 'rag', title: "RAG qidiruvi", content: "Savolingiz bo'yicha platforma bazasidan tegishli hujjatlar izlanadi. Manba ko'rsatilgan javoblar aniqroq va ishonchli. Module 1 to'liq ulanganda yanada kengayadi.", readTime: 4, badge: 'new' },
    ]},
  ]},
  uz_cyrillic: { sections: [
    { id: 'start', title: 'Бошлаш', color: 'text-yellow-500', bgColor: 'bg-yellow-50 border-yellow-200', iconId: 'zap', articles: [
      { id: 'reg', title: "Платформада рўйхатдан ўтиш", content: "Рўйхатдан ўтиш учун Бош саҳифадан \"Бепул бошлаш\" тугмасини босинг. Ролингизни (Клиника, Шифокор ёки Бемор) танланг ва профил маълумотларингизни киритинг.", readTime: 2, badge: 'popular' },
      { id: 'profile', title: "Профилни тўлдириш", content: "Dashboard → Профил бўлимига ўтинг. Барча мажбурий майдонларни тўлдиринг. Клиникалар учун: лицензия маълумотлари ва сертификатларни юклаш мажбурий.", readTime: 3, badge: null },
      { id: 'roles', title: "Рол фарқлари", content: "Админ: Платформа бўйлаб тўлиқ назорат. Клиника: Ўз маълумотлари, ходимлар, ERP. Шифокор: Ҳужжатлар, форум, билимлар. Бемор: AI маслаҳат, ўз ҳужжатлари, QR карта.", readTime: 2, badge: null },
    ]},
    { id: 'documents', title: 'Ҳужжатлар', color: 'text-blue-500', bgColor: 'bg-blue-50 border-blue-200', iconId: 'file', articles: [
      { id: 'create', title: "Ҳужжат яратиш", content: "Ҳужжатлар → Янги ҳужжат. Шаблон танланг (8 та шаблон мавжуд). Майдонларни тўлдиринг — AI автоматик матн таклиф қилади.", readTime: 4, badge: 'popular' },
      { id: 'status', title: "Ҳужжат ҳолатлари", content: "Қоралама: фақат сиз кўришингиз мумкин. Кўриб чиқишда: админ кўриб чиқмоқда. Тасдиқланган: расмий ҳужжат. Рад этилган: тузатиш талаб этилади.", readTime: 2, badge: null },
      { id: 'ai-doc', title: "AI ҳужжат тайёрлаш", content: "Шаблон асосида AI автоматик матн генерация қилади. Бу фақат тавсия — мутахассис кўриб чиқиши тавсия этилади.", readTime: 3, badge: 'new' },
    ]},
    { id: 'inspection', title: 'Анти-текширув', color: 'text-red-500', bgColor: 'bg-red-50 border-red-200', iconId: 'shield', articles: [
      { id: 'check', title: "Текшируш тайёргарлиги", content: "4 та чеклист мавжуд: Санитария, Лицензия, Ҳужжатлар, Ходимлар. Ҳар бир пункт учун Ўтди/Огоҳлантириш/Муваффақиятсиз белгиланг.", readTime: 5, badge: 'popular' },
      { id: 'sim', title: "Инспектор симуляцияси", content: "3 та стсенарий: Режалаштирилган, Шикоят асосида, Кутилмаган. Инспектор саволлари ва текшируш тартибини олдиндан билиш имконияти.", readTime: 4, badge: null },
      { id: 'risk', title: "Риск бали нима?", content: "Ҳар бир \"Муваффақиятсиз\" белгиланган пункт учун хавф даражасига қараб баллар қўшилади (Юқори=3, Ўрта=2, Паст=1). 10+ = Юқори риск.", readTime: 3, badge: null },
    ]},
    { id: 'erp', title: 'ERP Тизим', color: 'text-green-500', bgColor: 'bg-green-50 border-green-200', iconId: 'database', articles: [
      { id: 'visit', title: "Бемор ташрифини киритиш", content: "ERP → Визитлар → Янги визит. Бемор қидириш/танлаш. Ташхис, рецепт ва процедураларни киритинг. Кейинги ташриф санасини белгиланг.", readTime: 4, badge: 'popular' },
      { id: 'analytics', title: "Аналитика кўрсаткичлари", content: "Аналитика табида: кунлик ташрифлар, топ ташхислар, дорилар статистикаси мавжуд.", readTime: 3, badge: null },
      { id: 'cleaning', title: "Тозалаш журнали", content: "Ҳар куни Тозалаш табида вазифаларга белги қўйинг. Бу маълумот инспекция текширувида талаб қилинади.", readTime: 2, badge: null },
    ]},
    { id: 'compliance', title: 'Муддатлар', color: 'text-orange-500', bgColor: 'bg-orange-50 border-orange-200', iconId: 'clock', articles: [
      { id: 'add', title: "Муддат қўшиш", content: "Муддатлар → Янги муддат. Тур танланг (Лицензия, Сертификат, Шартнома, Протокол). Тизим автоматик 30/14/7 кун олдин эслатма юборади.", readTime: 3, badge: null },
      { id: 'email', title: "Email эслатмалар", content: "Compliance Check API орқали кунлик автоматик текшируш ўтказилади. 7 кундан кам қолганда email га хабар юборилади.", readTime: 2, badge: 'updated' },
      { id: 'auto-doc', title: "Ҳужжат автоматик яратиш", content: "\"Ҳужжат яратиш\" тугмаси босилганда, муддат туriga мос шаблон асосида қоралама ҳужжат яратилади.", readTime: 3, badge: null },
    ]},
    { id: 'ai', title: 'AI Маслаҳатчи', color: 'text-purple-500', bgColor: 'bg-purple-50 border-purple-200', iconId: 'bot', articles: [
      { id: 'chat', title: "AI билан суҳбатлашиш", content: "AI Маслаҳатчи → Чат бўлимига ўтинг. Тиббий-ҳуқуқий саволингизни ёзинг. 3 режим мавжуд: Тез, Мувозанатли, Чуқур таҳлил.", readTime: 3, badge: 'popular' },
      { id: 'rag', title: "RAG қидируви", content: "Саволингиз бўйича платформа базасидан тегишли ҳужжатлар изланади. Манба кўрсатилган жавоблар аниқроқ.", readTime: 4, badge: 'new' },
    ]},
  ]},
  ru: { sections: [
    { id: 'start', title: 'Начало работы', color: 'text-yellow-500', bgColor: 'bg-yellow-50 border-yellow-200', iconId: 'zap', articles: [
      { id: 'reg', title: "Регистрация на платформе", content: "Для регистрации нажмите «Начать бесплатно» на главной странице. Выберите свою роль (Клиника, Врач или Пациент) и заполните профиль. После заполнения профиля откроются все функции.", readTime: 2, badge: 'popular' },
      { id: 'profile', title: "Заполнение профиля", content: "Перейдите в Dashboard → Профиль. Заполните все обязательные поля. Для клиник: обязательна загрузка лицензии и сертификатов. Для врачей: требуется диплом и квалификационный сертификат.", readTime: 3, badge: null },
      { id: 'roles', title: "Различия ролей", content: "Администратор: полный контроль над платформой. Клиника: свои данные, персонал, ERP. Врач: документы, форум, знания. Пациент: ИИ-консультация, личные документы, QR-карта.", readTime: 2, badge: null },
    ]},
    { id: 'documents', title: 'Документы', color: 'text-blue-500', bgColor: 'bg-blue-50 border-blue-200', iconId: 'file', articles: [
      { id: 'create', title: "Создание документа", content: "Документы → Новый документ. Выберите шаблон (доступно 8 шаблонов). Заполните поля — ИИ автоматически предложит текст. Нажмите «Сохранить» или «Отправить на проверку».", readTime: 4, badge: 'popular' },
      { id: 'status', title: "Статусы документов", content: "Черновик: видите только вы. На проверке: администратор рассматривает. Одобрен: официальный документ. Отклонён: требуется исправление.", readTime: 2, badge: null },
      { id: 'ai-doc', title: "Подготовка документа с ИИ", content: "На основе шаблона ИИ автоматически генерирует текст. Это только рекомендация — рекомендуется проверка специалистом.", readTime: 3, badge: 'new' },
    ]},
    { id: 'inspection', title: 'Антипроверка', color: 'text-red-500', bgColor: 'bg-red-50 border-red-200', iconId: 'shield', articles: [
      { id: 'check', title: "Подготовка к проверке", content: "Доступно 4 чек-листа: Санитария, Лицензия, Документы, Персонал. Для каждого пункта отметьте Пройдено/Предупреждение/Не пройдено. Оценка риска рассчитывается автоматически.", readTime: 5, badge: 'popular' },
      { id: 'sim', title: "Симуляция инспектора", content: "3 сценария: Плановый, По жалобе, Внезапный. Возможность заранее узнать вопросы и порядок проверки. Отметьте степень готовности по каждому шагу.", readTime: 4, badge: null },
      { id: 'risk', title: "Что такое оценка риска?", content: "За каждый пункт «Не пройдено» добавляются баллы по уровню риска (Высокий=3, Средний=2, Низкий=1). 10+ = Высокий риск, 5-10 = Средний, <5 = Низкий.", readTime: 3, badge: null },
    ]},
    { id: 'erp', title: 'ERP Система', color: 'text-green-500', bgColor: 'bg-green-50 border-green-200', iconId: 'database', articles: [
      { id: 'visit', title: "Запись визита пациента", content: "ERP → Визиты → Новый визит. Найдите/выберите пациента. Введите диагноз, рецепты и процедуры. Укажите дату следующего визита.", readTime: 4, badge: 'popular' },
      { id: 'analytics', title: "Аналитические показатели", content: "Во вкладке Аналитика: ежедневные визиты, топ диагнозы, статистика по препаратам, показатели по врачам. Стандартный период — последние 30 дней.", readTime: 3, badge: null },
      { id: 'cleaning', title: "Журнал уборки", content: "Ежедневно отмечайте задачи во вкладке Уборка. Эти данные требуются при инспекционной проверке.", readTime: 2, badge: null },
    ]},
    { id: 'compliance', title: 'Дедлайны', color: 'text-orange-500', bgColor: 'bg-orange-50 border-orange-200', iconId: 'clock', articles: [
      { id: 'add', title: "Добавление дедлайна", content: "Дедлайны → Новый дедлайн. Выберите тип (Лицензия, Сертификат, Договор, Протокол). Введите дату окончания. Система автоматически отправит напоминание за 30/14/7 дней.", readTime: 3, badge: null },
      { id: 'email', title: "Email-напоминания", content: "Через Compliance Check API проводится ежедневная автоматическая проверка. При менее чем 7 днях до срока на clinic@email.com отправляется уведомление.", readTime: 2, badge: 'updated' },
      { id: 'auto-doc', title: "Автоматическое создание документа", content: "При нажатии «Создать документ» на основе типа дедлайна создаётся черновой документ по соответствующему шаблону.", readTime: 3, badge: null },
    ]},
    { id: 'ai', title: 'ИИ Консультант', color: 'text-purple-500', bgColor: 'bg-purple-50 border-purple-200', iconId: 'bot', articles: [
      { id: 'chat', title: "Общение с ИИ", content: "Перейдите в ИИ Консультант → Чат. Напишите свой медицинско-юридический вопрос. ИИ отвечает на основе модели Gemini 2.5. Доступно 3 режима: Быстрый, Сбалансированный, Глубокий анализ.", readTime: 3, badge: 'popular' },
      { id: 'rag', title: "RAG-поиск", content: "По вашему вопросу выполняется поиск релевантных документов в базе платформы. Ответы с указанием источника точнее и надёжнее.", readTime: 4, badge: 'new' },
    ]},
  ]},
  en: { sections: [
    { id: 'start', title: 'Getting Started', color: 'text-yellow-500', bgColor: 'bg-yellow-50 border-yellow-200', iconId: 'zap', articles: [
      { id: 'reg', title: "Registering on the platform", content: "Click \"Get started free\" on the homepage. Choose your role (Clinic, Doctor or Patient) and fill in your profile details. Once the profile is complete, all features will become accessible.", readTime: 2, badge: 'popular' },
      { id: 'profile', title: "Completing your profile", content: "Go to Dashboard → Profile. Fill in all required fields. For clinics: uploading a license and sanitary certificate is mandatory. For doctors: diploma and qualification certificate are required.", readTime: 3, badge: null },
      { id: 'roles', title: "Role differences", content: "Admin: Full platform control. Clinic: Own data, staff, ERP. Doctor: Documents, forum, knowledge base. Patient: AI consultation, own documents, QR card.", readTime: 2, badge: null },
    ]},
    { id: 'documents', title: 'Documents', color: 'text-blue-500', bgColor: 'bg-blue-50 border-blue-200', iconId: 'file', articles: [
      { id: 'create', title: "Creating a document", content: "Documents → New document. Choose a template (8 available). Fill in the fields — AI will automatically suggest text. Click Save or Submit for review.", readTime: 4, badge: 'popular' },
      { id: 'status', title: "Document statuses", content: "Draft: only you can see it. Under review: admin is reviewing. Approved: official document. Rejected: correction required.", readTime: 2, badge: null },
      { id: 'ai-doc', title: "AI document drafting", content: "AI automatically generates text based on the template. This is a suggestion only — specialist review is recommended. Once Module 1 is connected, RAG-based answers will be even more precise.", readTime: 3, badge: 'new' },
    ]},
    { id: 'inspection', title: 'Anti-Inspection', color: 'text-red-500', bgColor: 'bg-red-50 border-red-200', iconId: 'shield', articles: [
      { id: 'check', title: "Inspection preparation", content: "4 checklists available: Sanitation, License, Documents, Staff. Mark each item as Passed/Warning/Failed. Risk score is calculated automatically.", readTime: 5, badge: 'popular' },
      { id: 'sim', title: "Inspector simulation", content: "3 scenarios: Planned, Complaint-based, Surprise. Advance knowledge of inspector questions and inspection flow. Mark your readiness level for each step.", readTime: 4, badge: null },
      { id: 'risk', title: "What is the risk score?", content: "Points are added for each \"Failed\" item based on risk level (High=3, Medium=2, Low=1). 10+ = High risk, 5-10 = Medium risk, <5 = Low risk.", readTime: 3, badge: null },
    ]},
    { id: 'erp', title: 'ERP System', color: 'text-green-500', bgColor: 'bg-green-50 border-green-200', iconId: 'database', articles: [
      { id: 'visit', title: "Recording a patient visit", content: "ERP → Visits → New visit. Search/select the patient. Enter diagnosis, prescriptions and procedures. Set the next visit date.", readTime: 4, badge: 'popular' },
      { id: 'analytics', title: "Analytics metrics", content: "In the Analytics tab: daily visits, top diagnoses, medication statistics, doctor performance. Default period is the last 30 days.", readTime: 3, badge: null },
      { id: 'cleaning', title: "Cleaning log", content: "Check off tasks in the Cleaning tab daily. This data is required during inspection checks.", readTime: 2, badge: null },
    ]},
    { id: 'compliance', title: 'Deadlines', color: 'text-orange-500', bgColor: 'bg-orange-50 border-orange-200', iconId: 'clock', articles: [
      { id: 'add', title: "Adding a deadline", content: "Deadlines → New deadline. Select type (License, Certificate, Contract, Protocol). Enter the expiry date. The system will automatically send reminders 30/14/7 days in advance.", readTime: 3, badge: null },
      { id: 'email', title: "Email reminders", content: "A daily automatic check is run via the Compliance Check API. When fewer than 7 days remain, a notification is sent to clinic@email.com via Resend.", readTime: 2, badge: 'updated' },
      { id: 'auto-doc', title: "Auto-generating documents", content: "Clicking \"Create document\" generates a draft document based on the deadline type (license → renewal letter, certificate → order, etc.).", readTime: 3, badge: null },
    ]},
    { id: 'ai', title: 'AI Advisor', color: 'text-purple-500', bgColor: 'bg-purple-50 border-purple-200', iconId: 'bot', articles: [
      { id: 'chat', title: "Chatting with the AI", content: "Go to AI Advisor → Chat. Type your medical-legal question. The AI responds using the Gemini 2.5 model. 3 modes available: Fast, Balanced, Deep analysis.", readTime: 3, badge: 'popular' },
      { id: 'rag', title: "RAG search", content: "Relevant documents from the platform database are searched for your question. Answers with cited sources are more accurate and reliable.", readTime: 4, badge: 'new' },
    ]},
  ]},
  kk: { sections: [
    { id: 'start', title: 'Бастау', color: 'text-yellow-500', bgColor: 'bg-yellow-50 border-yellow-200', iconId: 'zap', articles: [
      { id: 'reg', title: "Платформада тіркелу", content: "Тіркелу үшін Басты беттен \"Тегін бастау\" батырмасын басыңыз. Рөлді (Клиника, Дәрігер немесе Пациент) таңдаңыз және профиль деректерін енгізіңіз.", readTime: 2, badge: 'popular' },
      { id: 'profile', title: "Профильді толтыру", content: "Dashboard → Профиль бөліміне өтіңіз. Барлық міндетті өрістерді толтырыңыз. Клиникалар үшін: лицензия және санитарлық куәлік жүктеу міндетті.", readTime: 3, badge: null },
      { id: 'roles', title: "Рөлдер айырмашылығы", content: "Әкімші: Толық платформа бақылауы. Клиника: Өз деректері, қызметкерлер, ERP. Дәрігер: Құжаттар, форум, білімдер. Пациент: AI кеңес, өз құжаттары, QR карта.", readTime: 2, badge: null },
    ]},
    { id: 'documents', title: 'Құжаттар', color: 'text-blue-500', bgColor: 'bg-blue-50 border-blue-200', iconId: 'file', articles: [
      { id: 'create', title: "Құжат жасау", content: "Құжаттар → Жаңа құжат. Үлгіні таңдаңыз (8 үлгі қол жетімді). Өрістерді толтырыңыз — AI автоматты түрде мәтін ұсынады.", readTime: 4, badge: 'popular' },
      { id: 'status', title: "Құжат күйлері", content: "Жоба: тек сіз көресіз. Тексеруде: әкімші қарастыруда. Бекітілген: ресми құжат. Қабылданбаған: түзету қажет.", readTime: 2, badge: null },
      { id: 'ai-doc', title: "AI құжат дайындау", content: "Үлгі негізінде AI автоматты мәтін жасайды. Бұл тек ұсыным — маман тексеруі ұсынылады.", readTime: 3, badge: 'new' },
    ]},
    { id: 'inspection', title: 'Тексерімге қарсы', color: 'text-red-500', bgColor: 'bg-red-50 border-red-200', iconId: 'shield', articles: [
      { id: 'check', title: "Тексерімге дайындық", content: "4 тексеру тізімі: Санитария, Лицензия, Құжаттар, Қызметкерлер. Әр тармақ үшін Өтті/Ескерту/Өтпеді белгіленіз. Тәуекел балы автоматты есептеледі.", readTime: 5, badge: 'popular' },
      { id: 'sim', title: "Инспектор симуляциясы", content: "3 сценарий: Жоспарлы, Шағымға негізделген, Күтпеген. Инспектор сұрақтары мен тексеру тәртібін алдын ала білу мүмкіндігі.", readTime: 4, badge: null },
      { id: 'risk', title: "Тәуекел балы дегеніміз не?", content: "Әр \"Өтпеді\" белгіленген тармақ үшін тәуекел деңгейіне қарай балдар қосылады (Жоғары=3, Орташа=2, Төмен=1).", readTime: 3, badge: null },
    ]},
    { id: 'erp', title: 'ERP Жүйесі', color: 'text-green-500', bgColor: 'bg-green-50 border-green-200', iconId: 'database', articles: [
      { id: 'visit', title: "Пациент барысын тіркеу", content: "ERP → Барулар → Жаңа бару. Пациентті іздеу/таңдау. Диагноз, рецепт және процедуралар енгізіңіз. Келесі бару күнін белгілеңіз.", readTime: 4, badge: 'popular' },
      { id: 'analytics', title: "Аналитика көрсеткіштері", content: "Аналитика қойындысында: күнделікті барулар, үздік диагноздар, дәрілер статистикасы, дәрігер бойынша көрсеткіштер бар.", readTime: 3, badge: null },
      { id: 'cleaning', title: "Тазалық журналы", content: "Күн сайын Тазалық қойындысындағы тапсырмаларға белгі қойыңыз. Бұл деректер тексерімде талап етіледі.", readTime: 2, badge: null },
    ]},
    { id: 'compliance', title: 'Мерзімдер', color: 'text-orange-500', bgColor: 'bg-orange-50 border-orange-200', iconId: 'clock', articles: [
      { id: 'add', title: "Мерзім қосу", content: "Мерзімдер → Жаңа мерзім. Түрді таңдаңыз (Лицензия, Куәлік, Шарт, Хаттама). Жүйе автоматты түрде 30/14/7 күн бұрын еске салу жібереді.", readTime: 3, badge: null },
      { id: 'email', title: "Email еске салулар", content: "Compliance Check API арқылы күнделікті автоматты тексеру өткізіледі. 7 күннен аз қалғанда email-ке хабарлама жіберіледі.", readTime: 2, badge: 'updated' },
      { id: 'auto-doc', title: "Автоматты құжат жасау", content: "\"Құжат жасау\" батырмасы басылғанда мерзім түріне сәйкес шаблон негізінде жоба құжат жасалады.", readTime: 3, badge: null },
    ]},
    { id: 'ai', title: 'AI Кеңесші', color: 'text-purple-500', bgColor: 'bg-purple-50 border-purple-200', iconId: 'bot', articles: [
      { id: 'chat', title: "AI-мен сөйлесу", content: "AI Кеңесші → Чат бөліміне өтіңіз. Медициналық-заңдық сұрағыңызды жазыңыз. 3 режим бар: Жылдам, Теңдестірілген, Терең талдау.", readTime: 3, badge: 'popular' },
      { id: 'rag', title: "RAG іздеуі", content: "Сұрағыңыз бойынша платформа базасынан тиісті құжаттар іздестіріледі. Дереккөзі көрсетілген жауаптар дәлірек.", readTime: 4, badge: 'new' },
    ]},
  ]},
};

const ICON_MAP: Record<string, React.ElementType> = {
  zap: Zap, file: FileText, shield: Shield, database: Database, clock: Clock, bot: Bot,
};

const VIDEOS_BY_LANG: Record<LK, Array<{ title: string; duration: string; views: string }>> = {
  uz: [
    { title: "Platforma boshqaruv paneli", duration: "5:32", views: "1.2k" },
    { title: "AI Maslahatchi bilan ishlash", duration: "8:15", views: "980" },
    { title: "Anti-tekshiruv moduli", duration: "12:40", views: "754" },
    { title: "ERP: Bemor tashriflari", duration: "9:28", views: "631" },
    { title: "Hujjat yaratish va tasdiqlash", duration: "6:50", views: "512" },
    { title: "Muddatlar va eslatmalar", duration: "4:15", views: "448" },
  ],
  uz_cyrillic: [
    { title: "Платформа бошқарув панели", duration: "5:32", views: "1.2k" },
    { title: "AI Маслаҳатчи билан ишлаш", duration: "8:15", views: "980" },
    { title: "Анти-текширув модули", duration: "12:40", views: "754" },
    { title: "ERP: Бемор ташрифлари", duration: "9:28", views: "631" },
    { title: "Ҳужжат яратиш ва тасдиқлаш", duration: "6:50", views: "512" },
    { title: "Муддатлар ва эслатмалар", duration: "4:15", views: "448" },
  ],
  ru: [
    { title: "Панель управления платформой", duration: "5:32", views: "1.2k" },
    { title: "Работа с ИИ-консультантом", duration: "8:15", views: "980" },
    { title: "Модуль антипроверки", duration: "12:40", views: "754" },
    { title: "ERP: Визиты пациентов", duration: "9:28", views: "631" },
    { title: "Создание и утверждение документов", duration: "6:50", views: "512" },
    { title: "Дедлайны и напоминания", duration: "4:15", views: "448" },
  ],
  en: [
    { title: "Platform dashboard overview", duration: "5:32", views: "1.2k" },
    { title: "Working with AI Advisor", duration: "8:15", views: "980" },
    { title: "Anti-inspection module", duration: "12:40", views: "754" },
    { title: "ERP: Patient visits", duration: "9:28", views: "631" },
    { title: "Creating and approving documents", duration: "6:50", views: "512" },
    { title: "Deadlines and reminders", duration: "4:15", views: "448" },
  ],
  kk: [
    { title: "Платформа басқару тақтасы", duration: "5:32", views: "1.2k" },
    { title: "AI Кеңесшімен жұмыс", duration: "8:15", views: "980" },
    { title: "Тексерімге қарсы модуль", duration: "12:40", views: "754" },
    { title: "ERP: Пациент барулары", duration: "9:28", views: "631" },
    { title: "Құжат жасау және бекіту", duration: "6:50", views: "512" },
    { title: "Мерзімдер мен еске салулар", duration: "4:15", views: "448" },
  ],
};

const BADGE_COLORS: Record<string, string> = {
  popular: 'bg-orange-100 text-orange-700',
  new: 'bg-green-100 text-green-700',
  updated: 'bg-blue-100 text-blue-700',
};

export default function HelpPage() {
  const { lang } = useLanguage();
  const tx = L[lang as LK] ?? L.uz;
  const sections = ARTICLES_BY_LANG[lang as LK]?.sections ?? ARTICLES_BY_LANG.uz.sections;
  const videos = VIDEOS_BY_LANG[lang as LK] ?? VIDEOS_BY_LANG.uz;

  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'articles' | 'videos' | 'contact'>('articles');

  function toggleBookmark(id: string) {
    setBookmarked(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast.info(tx.unbookmarked); }
      else { next.add(id); toast.success(tx.bookmarked); }
      return next;
    });
  }

  function handleFeedback(articleId: string) {
    setFeedbackGiven(prev => new Set(Array.from(prev).concat(articleId)));
    toast.success(tx.feedbackThanks);
  }

  const filtered = useMemo(() => {
    return sections.map(s => ({
      ...s,
      articles: s.articles.filter(a =>
        !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase())
      ),
    })).filter(s => s.articles.length > 0);
  }, [sections, search]);

  const totalArticles = sections.reduce((n, s) => n + s.articles.length, 0);
  const popularArticles = sections.flatMap(s => s.articles.filter(a => a.badge === 'popular')).slice(0, 3);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Hero header */}
      <div className="text-center py-10 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100/40 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]" />
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">{tx.title}</h1>
          <p className="text-slate-500 mt-1 mb-6">{tx.subtitle}</p>
          <div className="relative max-w-lg mx-auto px-4">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tx.searchPlaceholder}
              className="pl-10 bg-white shadow-sm border-slate-200 h-11"
            />
            {search && <button onClick={() => setSearch('')} className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
          </div>
          {/* System status */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-600 font-medium">{tx.allGood}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {!search && (
        <div className="flex gap-1 border-b border-slate-200">
          {(['articles', 'videos', 'contact'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {tab === 'articles' && <BookOpen className="w-4 h-4" />}
              {tab === 'videos' && <Video className="w-4 h-4" />}
              {tab === 'contact' && <Phone className="w-4 h-4" />}
              {tab === 'articles' ? tx.allTopics : tab === 'videos' ? tx.videoTutorials : tx.contact}
              {tab === 'articles' && <Badge className="bg-slate-100 text-slate-500 font-normal">{totalArticles}</Badge>}
            </button>
          ))}
        </div>
      )}

      {/* ARTICLES TAB */}
      {(activeTab === 'articles' || search) && (
        <div className="space-y-4">
          {/* Popular articles — only when not searching */}
          {!search && (
            <div>
              <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-orange-500" />{tx.popularArticles}
              </h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {popularArticles.map(a => (
                  <button
                    key={a.id}
                    onClick={() => {
                      const sec = sections.find(s => s.articles.some(art => art.id === a.id));
                      if (sec) { setActiveSection(sec.id); setExpanded(a.id); }
                    }}
                    className="text-left p-4 rounded-xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-sm transition-all group"
                  >
                    <p className="text-sm font-medium text-slate-700 group-hover:text-indigo-700 line-clamp-2">{a.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`text-xs ${BADGE_COLORS[a.badge ?? ''] ?? ''}`}>
                        {a.badge === 'popular' ? tx.popularBadge : a.badge === 'new' ? tx.newBadge : tx.updatedBadge}
                      </Badge>
                      <span className="text-xs text-slate-400">{a.readTime} {tx.minutes}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section accordion */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 border border-dashed rounded-xl">
              <Info className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="font-medium text-slate-700">{tx.noResults}</p>
              <p className="text-xs text-slate-400 mt-1">{tx.noResultsHint}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(section => {
                const Icon = ICON_MAP[section.iconId] ?? HelpCircle;
                const isOpen = activeSection === section.id || !!search;
                return (
                  <div key={section.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
                      onClick={() => setActiveSection(isOpen && !search ? null : section.id)}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${section.bgColor}`}>
                        <Icon className={`w-5 h-5 ${section.color}`} />
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-slate-800">{section.title}</span>
                        <span className="text-xs text-slate-400 ml-2">{section.articles.length} {tx.articles}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-100 divide-y divide-slate-100">
                        {section.articles.map(article => (
                          <div key={article.id}>
                            <button
                              className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left"
                              onClick={() => setExpanded(expanded === article.id ? null : article.id)}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="line-clamp-1">{article.title}</span>
                                {article.badge && (
                                  <Badge className={`text-xs shrink-0 ${BADGE_COLORS[article.badge] ?? ''}`}>
                                    {article.badge === 'popular' ? tx.popularBadge : article.badge === 'new' ? tx.newBadge : tx.updatedBadge}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                <span className="text-xs text-slate-400">{article.readTime} {tx.minutes}</span>
                                <button
                                  onClick={e => { e.stopPropagation(); toggleBookmark(article.id); }}
                                  className="p-1 rounded hover:bg-slate-100"
                                >
                                  <Bookmark className={`w-3.5 h-3.5 ${bookmarked.has(article.id) ? 'fill-indigo-500 text-indigo-500' : 'text-slate-300'}`} />
                                </button>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded === article.id ? 'rotate-180' : ''}`} />
                              </div>
                            </button>
                            {expanded === article.id && (
                              <div className="px-5 pb-5 pt-2 bg-slate-50/50">
                                <p className="text-sm text-slate-600 leading-relaxed">{article.content}</p>
                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">{tx.wasHelpful}</span>
                                    {feedbackGiven.has(article.id) ? (
                                      <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="w-3.5 h-3.5" />{tx.feedbackThanks}</span>
                                    ) : (
                                      <>
                                        <button onClick={() => handleFeedback(article.id)} className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-slate-200 hover:border-green-300 hover:text-green-600 transition-colors">
                                          <ThumbsUp className="w-3 h-3" />{tx.yes}
                                        </button>
                                        <button onClick={() => handleFeedback(article.id)} className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-slate-200 hover:border-red-300 hover:text-red-600 transition-colors">
                                          <ThumbsDown className="w-3 h-3" />{tx.no}
                                        </button>
                                      </>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => { navigator.clipboard.writeText(article.title); toast.success(tx.linkCopied); }}
                                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
                                  >
                                    <Copy className="w-3 h-3" />{tx.copyLink}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIDEOS TAB */}
      {activeTab === 'videos' && !search && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v, i) => (
            <Card key={i} className="cursor-pointer hover:shadow-md transition-all group overflow-hidden">
              <div className="w-full h-32 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center relative">
                <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                  <div className="w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-l-[12px] border-l-purple-600 ml-1" />
                </div>
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">{v.duration}</div>
              </div>
              <CardContent className="p-3">
                <p className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors line-clamp-2">{v.title}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-400">{v.views} {lang === 'ru' ? 'просмотров' : lang === 'en' ? 'views' : 'ko\'rish'}</span>
                  <ExternalLink className="w-3 h-3 text-slate-300" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CONTACT TAB */}
      {activeTab === 'contact' && !search && (
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-slate-700 mb-1">{tx.contactTitle}</h2>
            <p className="text-sm text-slate-500 mb-4">{tx.contactSubtitle}</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Mail, label: tx.emailLabel, value: 'support@oxforder.uz', color: 'text-blue-600 bg-blue-50', action: () => window.open('mailto:support@oxforder.uz') },
              { icon: Phone, label: tx.phoneLabel, value: '+998 71 200 00 00', color: 'text-green-600 bg-green-50', action: () => window.open('tel:+998712000000') },
              { icon: MessageSquare, label: tx.chatLabel, value: '24/7', color: 'text-purple-600 bg-purple-50', action: () => toast.info('Chat') },
            ].map(({ icon: Icon, label, value, color, action }) => (
              <button key={label} onClick={action} className="p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm transition-all text-left group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}><Icon className="w-5 h-5" /></div>
                <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{value}</p>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 mt-2 transition-colors" />
              </button>
            ))}
          </div>
          <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-bold text-lg">{tx.notFound}</h3>
                  <p className="text-blue-100 text-sm mt-0.5">{tx.support247}</p>
                </div>
                <Button className="bg-white text-indigo-700 hover:bg-blue-50 gap-1.5">
                  <LifeBuoy className="w-4 h-4" />{tx.submitTicket}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
