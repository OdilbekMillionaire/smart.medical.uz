'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2, Circle, ChevronRight, Rocket, Building2, FileText, Clock,
  ShieldCheck, Database, Users, Bot, Star, Award,
  Lock, SkipForward, Info, Sparkles, CheckCheck,
  BookOpen, MessageSquare, Lightbulb, Trophy,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

type LK = 'uz' | 'uz_cyrillic' | 'ru' | 'en' | 'kk';

const L: Record<LK, {
  title: string; subtitle: string; welcome: string; progress: string;
  completed: string; total: string; percent: string; steps: string;
  tips: string; allDone: string; allDoneMsg: string; goTo: string;
  markDone: string; markUndone: string; skip: string; locked: string;
  lockedMsg: string; optional: string; required: string; beginner: string;
  intermediate: string; advanced: string; estimatedTime: string;
  minutes: string; xpEarned: string; levelUp: string; streak: string;
  days: string; nextStep: string; resetProgress: string; resetConfirm: string;
  cancel: string; confirm: string; shareProgress: string; shared: string;
  milestone25: string; milestone50: string; milestone75: string; milestone100: string;
  roleLabel: string; clinic: string; doctor: string; patient: string; admin: string;
  sections: { setup: string; features: string; advanced: string };
  stepTitles: Record<string, string>;
  stepDescs: Record<string, string>;
  tipTitles: string[];
  tipBodies: string[];
  features: string[];
  featureDescs: string[];
}> = {
  uz: {
    title: "Boshlash",
    subtitle: "Platforma imkoniyatlarini to'liq o'rganish yo'llanmasi",
    welcome: "Xush kelibsiz!",
    progress: "Boshlash jarayoni",
    completed: "Bajarildi",
    total: "Jami",
    percent: "% bajarildi",
    steps: "bosqich",
    tips: "Foydali maslahatlar",
    allDone: "Siz tayyor!",
    allDoneMsg: "Barcha boshlash bosqichlari bajarildi. Platformadan to'liq foydalanishingiz mumkin.",
    goTo: "O'tish",
    markDone: "Bajarildi deb belgilash",
    markUndone: "Bajarilmagan deb belgilash",
    skip: "O'tkazib yuborish",
    locked: "Qulflangan",
    lockedMsg: "Bu bosqichni ochish uchun avvalgi bosqichni bajaring",
    optional: "Ixtiyoriy",
    required: "Majburiy",
    beginner: "Boshlang'ich",
    intermediate: "O'rta",
    advanced: "Ilg'or",
    estimatedTime: "Taxminiy vaqt",
    minutes: "daqiqa",
    xpEarned: "XP to'plandi",
    levelUp: "Daraja oshdi!",
    streak: "Ketma-ket kun",
    days: "kun",
    nextStep: "Keyingi bosqich",
    resetProgress: "Jarayonni boshlash",
    resetConfirm: "Barcha jarayonni qayta boshlashni tasdiqlaysizmi?",
    cancel: "Bekor qilish",
    confirm: "Tasdiqlash",
    shareProgress: "Ulashish",
    shared: "Ulashildi!",
    milestone25: "25% — Zo'r boshladingiz! 🎯",
    milestone50: "50% — Yarmidasiz! Davom eting! 💪",
    milestone75: "75% — Deyarli yetib keldingiz! 🚀",
    milestone100: "100% — Ajoyib! Siz mutaxassis bo'ldingiz! 🏆",
    roleLabel: "Rolingiz",
    clinic: "Klinika",
    doctor: "Shifokor",
    patient: "Bemor",
    admin: "Admin",
    sections: { setup: "Sozlash", features: "Asosiy imkoniyatlar", advanced: "Ilg'or sozlamalar" },
    stepTitles: {
      profile: "Profilni to'ldirish",
      ai: "AI Maslahatchi bilan tanishing",
      documents: "Birinchi hujjat yarating",
      compliance: "Muddatlarni sozlang",
      erp: "ERP tizimini o'rganing",
      inspection: "Tekshiruv tayyorgarligi",
      staff: "Xodimlarni qo'shing",
      clinics: "Klinikalarni ko'rib chiqing",
      forum: "Forumda faol bo'ling",
      survey: "Birinchi baholash yozing",
      guidelines: "Klinik ko'rsatmalar",
    },
    stepDescs: {
      profile: "Barcha majburiy maydonlarni to'ldiring va hujjatlarni yuklang",
      ai: "Tibbiy-yuridik savol bering va AI imkoniyatlarini ko'ring",
      documents: "8 ta shablon ichidan birini tanlab hujjat tayyorlang",
      compliance: "Litsenziya va sertifikat muddatlarini qo'shing, eslatmalar oling",
      erp: "Birinchi bemor tashrifini kiriting va analitikani ko'ring",
      inspection: "Sanitariya va litsenziya cheklistini to'ldiring",
      staff: "Klinika xodimlarini tizimga kiriting",
      clinics: "Ro'yxatga olingan klinikalar va foydalanuvchilarni ko'ring",
      forum: "Hamkasblar bilan tajriba almashing",
      survey: "Klinika sifatini baholang",
      guidelines: "Klinik ko'rsatmalar va protokollar bilan tanishing",
    },
    tipTitles: [
      "AI savollarini aniq yozing",
      "Hujjatlarni vaqtida yuboring",
      "Muddatlarni oldindan sozlang",
      "Tekshiruvga tayyorgarlik",
    ],
    tipBodies: [
      "Savol qanchalik aniq bo'lsa, AI javobi shunchalik yaxshi bo'ladi. Kasallik, holat va kontekstni ko'rsating.",
      "Admin ko'rib chiqishi 1-2 ish kuni davomida. Shoshilinch hujjatlar uchun murojaat bo'limi orqali xabar bering.",
      "Litsenziya muddatini 60 kun oldindan qo'ying — 30, 14 va 7 kun oldin avtomatik eslatma olasiz.",
      "Anti-tekshiruv modulidagi simulyatsiya rejimida mashq qiling — inspektor savollariga tayyorlanasiz.",
    ],
    features: ["AI Maslahatchi", "Hujjatlar", "Muddatlar", "ERP Tizim", "Anti-tekshiruv", "Forum"],
    featureDescs: ["Tibbiy-yuridik savollar", "Shablon va qoralamalar", "Eslatmalar tizimi", "Bemor boshqaruvi", "Risk baholash", "Tajriba almashuv"],
  },
  uz_cyrillic: {
    title: "Бошлаш",
    subtitle: "Платформа имкониятларини тўлиқ ўрганиш йўлланмаси",
    welcome: "Хуш келибсиз!",
    progress: "Бошлаш жараёни",
    completed: "Бажарилди",
    total: "Жами",
    percent: "% бажарилди",
    steps: "босқич",
    tips: "Фойдали маслаҳатлар",
    allDone: "Сиз тайёр!",
    allDoneMsg: "Барча бошлаш босқичлари бажарилди. Платформадан тўлиқ фойдаланишингиз мумкин.",
    goTo: "Ўтиш",
    markDone: "Бажарилди деб белгилаш",
    markUndone: "Бажарилмаган деб белгилаш",
    skip: "Ўтказиб юбориш",
    locked: "Қулфланган",
    lockedMsg: "Бу босқични очиш учун аввалги босқични бажаринг",
    optional: "Ихтиёрий",
    required: "Мажбурий",
    beginner: "Бошланғич",
    intermediate: "Ўрта",
    advanced: "Илғор",
    estimatedTime: "Тахминий вақт",
    minutes: "дақиқа",
    xpEarned: "XP тўпланди",
    levelUp: "Даража ошди!",
    streak: "Кетма-кет кун",
    days: "кун",
    nextStep: "Кейинги босқич",
    resetProgress: "Жараённи бошлаш",
    resetConfirm: "Барча жараённи қайта бошлашни тасдиқлайсизми?",
    cancel: "Бекор қилиш",
    confirm: "Тасдиқлаш",
    shareProgress: "Улашиш",
    shared: "Улашилди!",
    milestone25: "25% — Зўр бошладингиз! 🎯",
    milestone50: "50% — Ярмидасиз! Давом этинг! 💪",
    milestone75: "75% — Деярли етиб келдингиз! 🚀",
    milestone100: "100% — Ажойиб! Сиз мутахассис бўлдингиз! 🏆",
    roleLabel: "Ролингиз",
    clinic: "Клиника",
    doctor: "Шифокор",
    patient: "Бемор",
    admin: "Админ",
    sections: { setup: "Созлаш", features: "Асосий имкониятлар", advanced: "Илғор созламалар" },
    stepTitles: {
      profile: "Профилни тўлдириш",
      ai: "AI Маслаҳатчи билан танишинг",
      documents: "Биринчи ҳужжат яратинг",
      compliance: "Муддатларни созланг",
      erp: "ERP тизимини ўрганинг",
      inspection: "Текшируш тайёргарлиги",
      staff: "Ходимларни қўшинг",
      clinics: "Клиникаларни кўриб чиқинг",
      forum: "Форумда фаол бўлинг",
      survey: "Биринчи баҳолаш ёзинг",
      guidelines: "Клиник кўрсатмалар",
    },
    stepDescs: {
      profile: "Барча мажбурий майдонларни тўлдиринг ва ҳужжатларни юкланг",
      ai: "Тиббий-ҳуқуқий савол беринг ва AI имкониятларини кўринг",
      documents: "8 та шаблон ичидан бирини танлаб ҳужжат тайёрланг",
      compliance: "Лицензия ва сертификат муддатларини қўшинг, эслатмалар олинг",
      erp: "Биринчи бемор ташрифини киритинг ва аналитикани кўринг",
      inspection: "Санитария ва лицензия чеклистини тўлдиринг",
      staff: "Клиника ходимларини тизимга киритинг",
      clinics: "Рўйхатга олинган клиникалар ва фойдаланувчиларни кўринг",
      forum: "Ҳамкасблар билан тажриба алмашинг",
      survey: "Клиника сифатини баҳоланг",
      guidelines: "Клиник кўрсатмалар ва протоколлар билан танишинг",
    },
    tipTitles: [
      "AI саволларини аниқ ёзинг",
      "Ҳужжатларни вақтида юборинг",
      "Муддатларни олдиндан созланг",
      "Текширишга тайёрgarлик",
    ],
    tipBodies: [
      "Савол қанчалик аниқ бўлса, AI жавоби шунчалик яхши бўлади.",
      "Админ кўриб чиқиши 1-2 иш куни давомида.",
      "Лицензия муддатини 60 кун олдиндан қўйинг — 30, 14 ва 7 кун олдин автоматик эслатма оласиз.",
      "Анти-текшируш модулидаги симуляция режимида машқ қилинг.",
    ],
    features: ["AI Маслаҳатчи", "Ҳужжатлар", "Муддатлар", "ERP Тизим", "Анти-текшируш", "Форум"],
    featureDescs: ["Тиббий-ҳуқуқий саволлар", "Шаблон ва қоралмалар", "Эслатмалар тизими", "Бемор бошқаруви", "Риск баҳолаш", "Тажриба алмашув"],
  },
  ru: {
    title: "Начало работы",
    subtitle: "Руководство по полному изучению возможностей платформы",
    welcome: "Добро пожаловать!",
    progress: "Прогресс освоения",
    completed: "Выполнено",
    total: "Всего",
    percent: "% выполнено",
    steps: "шагов",
    tips: "Полезные советы",
    allDone: "Вы готовы!",
    allDoneMsg: "Все шаги начального освоения завершены. Вы можете полноценно пользоваться платформой.",
    goTo: "Перейти",
    markDone: "Отметить как выполненное",
    markUndone: "Отметить как невыполненное",
    skip: "Пропустить",
    locked: "Заблокировано",
    lockedMsg: "Чтобы разблокировать этот шаг, выполните предыдущий",
    optional: "Необязательно",
    required: "Обязательно",
    beginner: "Начальный",
    intermediate: "Средний",
    advanced: "Продвинутый",
    estimatedTime: "Примерное время",
    minutes: "мин",
    xpEarned: "XP получено",
    levelUp: "Уровень повышен!",
    streak: "Дней подряд",
    days: "дней",
    nextStep: "Следующий шаг",
    resetProgress: "Начать заново",
    resetConfirm: "Вы уверены, что хотите начать процесс заново?",
    cancel: "Отмена",
    confirm: "Подтвердить",
    shareProgress: "Поделиться",
    shared: "Поделились!",
    milestone25: "25% — Отличное начало! 🎯",
    milestone50: "50% — Половина позади! Продолжайте! 💪",
    milestone75: "75% — Почти у цели! 🚀",
    milestone100: "100% — Великолепно! Вы стали экспертом! 🏆",
    roleLabel: "Ваша роль",
    clinic: "Клиника",
    doctor: "Врач",
    patient: "Пациент",
    admin: "Администратор",
    sections: { setup: "Настройка", features: "Основные функции", advanced: "Расширенные настройки" },
    stepTitles: {
      profile: "Заполнение профиля",
      ai: "Знакомство с ИИ-консультантом",
      documents: "Создание первого документа",
      compliance: "Настройка дедлайнов",
      erp: "Изучение ERP-системы",
      inspection: "Подготовка к проверке",
      staff: "Добавление персонала",
      clinics: "Просмотр клиник",
      forum: "Активность на форуме",
      survey: "Написание первого отзыва",
      guidelines: "Клинические рекомендации",
    },
    stepDescs: {
      profile: "Заполните все обязательные поля и загрузите документы",
      ai: "Задайте медицинско-юридический вопрос и оцените возможности ИИ",
      documents: "Выберите шаблон из 8 доступных и подготовьте документ",
      compliance: "Добавьте сроки действия лицензий и сертификатов, получайте напоминания",
      erp: "Введите первый визит пациента и ознакомьтесь с аналитикой",
      inspection: "Заполните чек-лист по санитарии и лицензированию",
      staff: "Добавьте сотрудников клиники в систему",
      clinics: "Просмотрите зарегистрированные клиники и пользователей",
      forum: "Обменивайтесь опытом с коллегами",
      survey: "Оцените качество клиники",
      guidelines: "Ознакомьтесь с клиническими рекомендациями и протоколами",
    },
    tipTitles: [
      "Формулируйте вопросы ИИ чётко",
      "Отправляйте документы вовремя",
      "Настраивайте дедлайны заранее",
      "Готовьтесь к проверкам",
    ],
    tipBodies: [
      "Чем точнее вопрос, тем лучше ответ ИИ. Указывайте заболевание, состояние и контекст.",
      "Рассмотрение администратором занимает 1-2 рабочих дня. Для срочных документов сообщите через раздел обращений.",
      "Добавьте срок лицензии за 60 дней — за 30, 14 и 7 дней придут автоматические напоминания.",
      "Практикуйтесь в режиме симуляции модуля антипроверки — готовьтесь к вопросам инспекторов.",
    ],
    features: ["ИИ-консультант", "Документы", "Дедлайны", "ERP-система", "Антипроверка", "Форум"],
    featureDescs: ["Медицинско-юридические вопросы", "Шаблоны и черновики", "Система напоминаний", "Управление пациентами", "Оценка рисков", "Обмен опытом"],
  },
  en: {
    title: "Getting Started",
    subtitle: "A guide to fully exploring the platform's capabilities",
    welcome: "Welcome!",
    progress: "Onboarding progress",
    completed: "Completed",
    total: "Total",
    percent: "% complete",
    steps: "steps",
    tips: "Helpful tips",
    allDone: "You're all set!",
    allDoneMsg: "All onboarding steps are complete. You can now use the platform to its full potential.",
    goTo: "Go to",
    markDone: "Mark as done",
    markUndone: "Mark as incomplete",
    skip: "Skip",
    locked: "Locked",
    lockedMsg: "Complete the previous step to unlock this one",
    optional: "Optional",
    required: "Required",
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    estimatedTime: "Estimated time",
    minutes: "min",
    xpEarned: "XP earned",
    levelUp: "Level up!",
    streak: "Day streak",
    days: "days",
    nextStep: "Next step",
    resetProgress: "Reset progress",
    resetConfirm: "Are you sure you want to reset all progress?",
    cancel: "Cancel",
    confirm: "Confirm",
    shareProgress: "Share",
    shared: "Shared!",
    milestone25: "25% — Great start! 🎯",
    milestone50: "50% — Halfway there! Keep going! 💪",
    milestone75: "75% — Almost there! 🚀",
    milestone100: "100% — Amazing! You're now an expert! 🏆",
    roleLabel: "Your role",
    clinic: "Clinic",
    doctor: "Doctor",
    patient: "Patient",
    admin: "Admin",
    sections: { setup: "Setup", features: "Key features", advanced: "Advanced settings" },
    stepTitles: {
      profile: "Complete your profile",
      ai: "Meet the AI Advisor",
      documents: "Create your first document",
      compliance: "Set up deadlines",
      erp: "Explore the ERP system",
      inspection: "Inspection preparation",
      staff: "Add staff members",
      clinics: "Review clinics",
      forum: "Be active on the forum",
      survey: "Write your first review",
      guidelines: "Clinical guidelines",
    },
    stepDescs: {
      profile: "Fill in all required fields and upload documents",
      ai: "Ask a medical-legal question and see AI capabilities",
      documents: "Choose one of 8 templates and prepare a document",
      compliance: "Add license and certificate expiry dates, receive reminders",
      erp: "Enter the first patient visit and view analytics",
      inspection: "Fill in the sanitation and licensing checklist",
      staff: "Add clinic staff members to the system",
      clinics: "View registered clinics and users",
      forum: "Exchange experience with colleagues",
      survey: "Rate clinic quality",
      guidelines: "Explore clinical guidelines and protocols",
    },
    tipTitles: [
      "Write clear AI prompts",
      "Submit documents on time",
      "Set up deadlines early",
      "Prepare for inspections",
    ],
    tipBodies: [
      "The clearer the question, the better the AI answer. Specify the condition, status and context.",
      "Admin review takes 1-2 business days. For urgent documents, use the requests section.",
      "Add a license deadline 60 days in advance — you'll get automatic reminders at 30, 14 and 7 days.",
      "Practice in the simulation mode of the anti-inspection module — get ready for inspector questions.",
    ],
    features: ["AI Advisor", "Documents", "Deadlines", "ERP System", "Anti-Inspection", "Forum"],
    featureDescs: ["Medical-legal questions", "Templates & drafts", "Reminder system", "Patient management", "Risk assessment", "Knowledge sharing"],
  },
  kk: {
    title: "Бастау",
    subtitle: "Платформаның мүмкіндіктерін толық зерттеу жетекшісі",
    welcome: "Қош келдіңіз!",
    progress: "Оқу прогресі",
    completed: "Аяқталды",
    total: "Барлығы",
    percent: "% аяқталды",
    steps: "қадам",
    tips: "Пайдалы кеңестер",
    allDone: "Сіз дайынсыз!",
    allDoneMsg: "Барлық бастапқы қадамдар аяқталды. Платформаны толық пайдалана аласыз.",
    goTo: "Өту",
    markDone: "Аяқталды деп белгілеу",
    markUndone: "Аяқталмаған деп белгілеу",
    skip: "Өткізіп жіберу",
    locked: "Бұғатталған",
    lockedMsg: "Бұл қадамды ашу үшін алдыңғы қадамды орындаңыз",
    optional: "Міндетті емес",
    required: "Міндетті",
    beginner: "Бастапқы",
    intermediate: "Орташа",
    advanced: "Жетілдірілген",
    estimatedTime: "Болжамды уақыт",
    minutes: "мин",
    xpEarned: "XP жиналды",
    levelUp: "Деңгей өсті!",
    streak: "Қатарынан күн",
    days: "күн",
    nextStep: "Келесі қадам",
    resetProgress: "Процесті қайта бастау",
    resetConfirm: "Барлық процесті қайта бастауды растайсыз ба?",
    cancel: "Болдырмау",
    confirm: "Растау",
    shareProgress: "Бөлісу",
    shared: "Бөлісілді!",
    milestone25: "25% — Керемет бастама! 🎯",
    milestone50: "50% — Жартысында! Жалғастырыңыз! 💪",
    milestone75: "75% — Дерлік жеттіңіз! 🚀",
    milestone100: "100% — Тамаша! Сіз маман болдыңыз! 🏆",
    roleLabel: "Рөліңіз",
    clinic: "Клиника",
    doctor: "Дәрігер",
    patient: "Пациент",
    admin: "Әкімші",
    sections: { setup: "Баптау", features: "Негізгі мүмкіндіктер", advanced: "Кеңейтілген баптаулар" },
    stepTitles: {
      profile: "Профильді толтыру",
      ai: "AI Кеңесшімен танысу",
      documents: "Бірінші құжат жасау",
      compliance: "Мерзімдерді баптау",
      erp: "ERP жүйесін зерттеу",
      inspection: "Тексерімге дайындық",
      staff: "Қызметкерлерді қосу",
      clinics: "Клиникаларды қарау",
      forum: "Форумда белсенді болу",
      survey: "Бірінші пікір жазу",
      guidelines: "Клиникалық нұсқаулар",
    },
    stepDescs: {
      profile: "Барлық міндетті өрістерді толтырып, құжаттарды жүктеңіз",
      ai: "Медициналық-заңдық сұрақ қойып, AI мүмкіндіктерін көріңіз",
      documents: "8 үлгіден бірін таңдап, құжат дайындаңыз",
      compliance: "Лицензия мен куәлік мерзімдерін қосыңыз, еске салулар алыңыз",
      erp: "Бірінші пациент барысын енгізіп, аналитиканы қараңыз",
      inspection: "Санитария мен лицензия тексеру тізімін толтырыңыз",
      staff: "Клиника қызметкерлерін жүйеге енгізіңіз",
      clinics: "Тіркелген клиникалар мен пайдаланушыларды қараңыз",
      forum: "Әріптестермен тәжірибе алмасыңыз",
      survey: "Клиника сапасын бағалаңыз",
      guidelines: "Клиникалық нұсқаулар мен хаттамалармен танысыңыз",
    },
    tipTitles: [
      "AI сұрақтарын нақты жазыңыз",
      "Құжаттарды уақытында жіберіңіз",
      "Мерзімдерді алдын ала баптаңыз",
      "Тексерімге дайындалыңыз",
    ],
    tipBodies: [
      "Сұрақ неғұрлым нақты болса, AI жауабы соғұрлым жақсы болады.",
      "Әкімші қарауы 1-2 жұмыс күн ішінде жүреді.",
      "Лицензия мерзімін 60 күн бұрын қосыңыз — 30, 14 және 7 күн бұрын автоматты еске салу аласыз.",
      "Тексерімге қарсы модулінің симуляция режимінде жаттығыңыз.",
    ],
    features: ["AI Кеңесші", "Құжаттар", "Мерзімдер", "ERP Жүйесі", "Тексерімге қарсы", "Форум"],
    featureDescs: ["Медициналық-заңдық сұрақтар", "Үлгілер мен жобалар", "Еске салу жүйесі", "Пациент басқаруы", "Тәуекел бағалауы", "Тәжірибе алмасу"],
  },
};

interface StepDef {
  id: string;
  href: string;
  iconId: string;
  role: ('clinic' | 'doctor' | 'patient' | 'admin')[];
  required: boolean;
  time: number;
  xp: number;
  section: 'setup' | 'features' | 'advanced';
}

const STEP_DEFS: StepDef[] = [
  { id: 'profile', href: '/dashboard/profile', iconId: 'users', role: ['clinic', 'doctor', 'patient', 'admin'], required: true, time: 10, xp: 50, section: 'setup' },
  { id: 'ai', href: '/dashboard/ai', iconId: 'bot', role: ['clinic', 'doctor', 'patient'], required: true, time: 5, xp: 30, section: 'setup' },
  { id: 'documents', href: '/dashboard/documents', iconId: 'file', role: ['clinic', 'doctor'], required: true, time: 8, xp: 40, section: 'features' },
  { id: 'compliance', href: '/dashboard/compliance', iconId: 'clock', role: ['clinic'], required: true, time: 5, xp: 30, section: 'features' },
  { id: 'erp', href: '/dashboard/erp', iconId: 'database', role: ['clinic'], required: false, time: 15, xp: 60, section: 'features' },
  { id: 'inspection', href: '/dashboard/inspection', iconId: 'shield', role: ['clinic'], required: false, time: 20, xp: 70, section: 'advanced' },
  { id: 'staff', href: '/dashboard/staff', iconId: 'users', role: ['clinic'], required: false, time: 10, xp: 40, section: 'advanced' },
  { id: 'clinics', href: '/dashboard/clinics', iconId: 'building', role: ['admin'], required: true, time: 5, xp: 30, section: 'setup' },
  { id: 'forum', href: '/dashboard/forum', iconId: 'message', role: ['clinic', 'doctor', 'patient'], required: false, time: 5, xp: 20, section: 'advanced' },
  { id: 'guidelines', href: '/dashboard/guidelines', iconId: 'book', role: ['clinic', 'doctor', 'patient'], required: false, time: 5, xp: 20, section: 'advanced' },
];

const ICON_COMP: Record<string, React.ElementType> = {
  users: Users, bot: Bot, file: FileText, clock: Clock, database: Database,
  shield: ShieldCheck, building: Building2, message: MessageSquare, book: BookOpen,
};

const SECTION_COLORS: Record<string, string> = {
  setup: 'bg-blue-50 text-blue-700 border-blue-200',
  features: 'bg-green-50 text-green-700 border-green-200',
  advanced: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function OnboardingPage() {
  const { userRole } = useAuth();
  const { lang } = useLanguage();
  const tx = L[lang as LK] ?? L.uz;

  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [showReset, setShowReset] = useState(false);
  const [activeSection, setActiveSection] = useState<'setup' | 'features' | 'advanced'>('setup');

  const steps = useMemo(() =>
    STEP_DEFS.filter(s => !userRole || s.role.includes(userRole as StepDef['role'][0])),
    [userRole]
  );

  const sectionSteps = useMemo(() =>
    steps.filter(s => s.section === activeSection),
    [steps, activeSection]
  );

  const doneCount = completed.size;
  const totalCount = steps.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const totalXp = steps.filter(s => completed.has(s.id)).reduce((acc, s) => acc + s.xp, 0);

  const milestone = pct >= 100 ? tx.milestone100 : pct >= 75 ? tx.milestone75 : pct >= 50 ? tx.milestone50 : pct >= 25 ? tx.milestone25 : null;

  function toggleStep(id: string) {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else { next.add(id); toast.success(`+${steps.find(s => s.id === id)?.xp ?? 0} ${tx.xpEarned}`); }
      return next;
    });
  }

  function skipStep(id: string) {
    setSkipped(prev => new Set(Array.from(prev).concat(id)));
  }

  function resetAll() {
    setCompleted(new Set());
    setSkipped(new Set());
    setShowReset(false);
    toast.success(tx.resetProgress);
  }

  const roleLabel = userRole === 'clinic' ? tx.clinic : userRole === 'doctor' ? tx.doctor : userRole === 'patient' ? tx.patient : tx.admin;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Hero */}
      <div className="relative py-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">{tx.welcome}</h1>
          <p className="text-white/80 mt-1 mb-6 text-sm">{tx.subtitle}</p>

          {/* Progress ring area */}
          <div className="flex items-center justify-center gap-8 mb-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{pct}%</p>
              <p className="text-white/70 text-xs">{tx.progress}</p>
            </div>
            <div className="h-10 w-px bg-white/30" />
            <div className="text-center">
              <p className="text-3xl font-bold">{totalXp}</p>
              <p className="text-white/70 text-xs">XP</p>
            </div>
            <div className="h-10 w-px bg-white/30" />
            <div className="text-center">
              <p className="text-3xl font-bold">{doneCount}/{totalCount}</p>
              <p className="text-white/70 text-xs">{tx.steps}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="max-w-sm mx-auto px-6">
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Role badge */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge className="bg-white/20 text-white border-white/30 text-xs">
              {tx.roleLabel}: {roleLabel}
            </Badge>
          </div>
        </div>
      </div>

      {/* Milestone banner */}
      {milestone && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <Trophy className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm font-semibold text-amber-800">{milestone}</p>
        </div>
      )}

      {/* Feature chips */}
      <div className="grid grid-cols-3 gap-2">
        {tx.features.map((f, i) => (
          <div key={f} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-white">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">{f}</p>
              <p className="text-xs text-slate-400 truncate hidden sm:block">{tx.featureDescs[i]}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(['setup', 'features', 'advanced'] as const).map(sec => {
          const secSteps = steps.filter(s => s.section === sec);
          const secDone = secSteps.filter(s => completed.has(s.id)).length;
          return (
            <button
              key={sec}
              onClick={() => setActiveSection(sec)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeSection === sec ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {tx.sections[sec]}
              <span className={`rounded-full px-1.5 text-xs font-bold ${activeSection === sec ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{secDone}/{secSteps.length}</span>
            </button>
          );
        })}
      </div>

      {/* Steps list */}
      <div className="space-y-2.5">
        {sectionSteps.map((step, idx) => {
          const done = completed.has(step.id);
          const isSkipped = skipped.has(step.id);
          const Icon = ICON_COMP[step.iconId] ?? Users;
          const prevStepDone = idx === 0 || completed.has(sectionSteps[idx - 1]?.id ?? '');
          const isLocked = step.required && !prevStepDone && idx > 0;

          return (
            <Card key={step.id} className={`transition-all ${done ? 'border-green-200 bg-green-50/30' : isSkipped ? 'opacity-50' : isLocked ? 'opacity-60' : 'hover:shadow-sm'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => !isLocked && toggleStep(step.id)}
                    className="shrink-0"
                    title={done ? tx.markUndone : tx.markDone}
                  >
                    {done
                      ? <CheckCircle2 className="w-6 h-6 text-green-500" />
                      : isLocked
                      ? <Lock className="w-6 h-6 text-slate-300" />
                      : <Circle className="w-6 h-6 text-slate-300 hover:text-indigo-400 transition-colors" />
                    }
                  </button>

                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${done ? 'bg-green-100 text-green-600' : isLocked ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-semibold text-sm ${done ? 'line-through text-slate-400' : isLocked ? 'text-slate-400' : 'text-slate-800'}`}>
                        {tx.stepTitles[step.id] ?? step.id}
                      </p>
                      {!step.required && <Badge className={`text-xs py-0 ${SECTION_COLORS[step.section]}`}>{tx.optional}</Badge>}
                      {step.required && !done && <Badge className="text-xs py-0 bg-red-50 text-red-700 border-red-200">{tx.required}</Badge>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{tx.stepDescs[step.id]}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-slate-400"><Clock className="w-3 h-3" />{step.time} {tx.minutes}</span>
                      <span className="flex items-center gap-1 text-xs text-amber-600"><Star className="w-3 h-3" />+{step.xp} XP</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!done && !isLocked && !step.required && !isSkipped && (
                      <button onClick={() => skipStep(step.id)} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded hover:bg-slate-100">
                        <SkipForward className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <Link href={step.href}>
                      <Button
                        size="sm"
                        variant={done ? 'outline' : 'default'}
                        className={`h-8 gap-1 text-xs shrink-0 ${done ? '' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        disabled={isLocked}
                      >
                        {tx.goTo}
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {isLocked && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                    <Info className="w-3.5 h-3.5" />{tx.lockedMsg}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tips */}
      <div>
        <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />{tx.tips}
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {tx.tipTitles.map((title, i) => (
            <div key={i} className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-sm font-semibold text-amber-800 mb-1">{title}</p>
              <p className="text-xs text-amber-700 leading-relaxed">{tx.tipBodies[i]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
        <button
          onClick={() => setShowReset(true)}
          className="text-xs text-slate-400 hover:text-slate-600 underline-offset-2 hover:underline"
        >
          {tx.resetProgress}
        </button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => { navigator.clipboard.writeText(`${pct}% ${tx.progress}`); toast.success(tx.shared); }}
        >
          <Award className="w-3.5 h-3.5" />{tx.shareProgress} ({pct}%)
        </Button>
      </div>

      {/* Completion card */}
      {pct === 100 && (
        <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 overflow-hidden">
          <CardContent className="p-6 text-center relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <Trophy className="w-48 h-48" />
            </div>
            <div className="relative">
              <CheckCheck className="w-10 h-10 mx-auto mb-2 opacity-90" />
              <h3 className="font-bold text-xl">{tx.allDone}</h3>
              <p className="text-green-100 text-sm mt-1">{tx.allDoneMsg}</p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Badge className="bg-white/20 text-white border-white/30">+{totalXp} XP {tx.xpEarned}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reset confirm modal */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <p className="font-semibold text-slate-800">{tx.resetConfirm}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReset(false)}>{tx.cancel}</Button>
              <Button variant="destructive" onClick={resetAll}>{tx.confirm}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
