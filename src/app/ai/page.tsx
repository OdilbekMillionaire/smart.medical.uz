'use client';

import {
  FormEvent, KeyboardEvent, useEffect, useRef, useState, useCallback,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Bot, User, Send, Plus, Search, RotateCcw, Square, Paperclip,
  ChevronDown, Shield, Users, ClipboardCheck, Award, FileText, Heart,
  Zap, MessageSquare, Settings, Stethoscope, FlaskConical,
  ArrowLeft, Phone, Loader2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = 'user' | 'assistant';
type Mode = 'fast' | 'balanced' | 'deep';
type FormatKey = 'formal' | 'concise' | 'detailed' | 'risk';

interface Message { role: Role; content: string; }
interface Conversation { id: string; title: string; messages: Message[]; mode: Mode; }

// ─── Language data ────────────────────────────────────────────────────────────
const L = {
  uz: {
    platformBack: '← Smart Medical',
    aiName: 'AI Maslahatchi',
    aiSub: 'Tibbiy AI Platforma',
    newChat: 'Yangi Suhbat',
    searchConvs: 'Suhbatlarni qidirish...',
    searchMsgs: 'Xabarlarni qidirish...',
    recent: "SO'NGGI",
    templates: 'TIBBIY SHABLONLAR',
    draftsLabel: 'QORALAMA HUJJATLAR',
    book: 'Bepul Konsultatsiya',
    fast: 'Fast', fastDesc: 'Tezkor javoblar',
    balanced: 'Balanced', balancedDesc: "Ko'p hollarda eng yaxshi",
    deep: 'Deep Think', deepDesc: 'Murakkab tahlil',
    format: 'Format',
    responseStyle: 'JAVOB USLUBI',
    formal: 'Rasmiy', formalDesc: 'Professional tibbiy yozuv',
    concise: 'Qisqa', conciseDesc: "To'g'ri, qisqa javoblar",
    detailed: 'Batafsil', detailedDesc: 'Chuqur tahlil',
    risk: 'Xavf Baholash', riskDesc: 'Xavf darajasi va choralar',
    heroTitle: 'AI Tibbiy Maslahatchi',
    heroSub: "O'zbekiston xususiy klinikaları uchun AI-powered platforma. SanQvaN, litsenziyalash va tibbiy savollarga darhol javob oling.",
    placeholder: "Savol yozing... (Enter — yuborish, Shift+Enter — yangi qator)",
    send: 'Yuborish', stop: "To'xtatish",
    addCtx: "Klinika kontekstini qo'shing",
    ctxPlaceholder: "Klinika nomi, viloyat, litsenziya holati... (ixtiyoriy)",
    aiLabel: 'AI Maslahatchi',
    suggested: [
      { q: 'Klinika litsenziyasini yangilash uchun qanday hujjatlar kerak?', icon: 'shield' },
      { q: "SanQvaN me'yorlariga ko'ra dezinfeksiya tartibotlari qanday?", icon: 'flask' },
      { q: "Shifokor malaka toifasini ko'tarish bosqichlari qanday?", icon: 'award' },
      { q: 'Tekshiruv vaqtida inspektor qanday savollar beradi?', icon: 'search' },
      { q: 'Bemor shikoyatiga qanday javob berish kerak?', icon: 'msg' },
    ],
    tpls: [
      { icon: Shield, label: 'Litsenziya Tahlili', p: "Klinikamning tibbiy faoliyat litsenziyasi talablarini va uni yangilash uchun zarur qadamlarni batafsil ko'rsating." },
      { icon: Users, label: 'Xodimlar Hujjatlari', p: "Klinikadagi tibbiy xodimlarning barcha hujjatlariga qo'yiladigan qonuniy talablarni tushuntiring." },
      { icon: ClipboardCheck, label: 'SanQvaN Muvofiqlik', p: "SanQvaN sanitariya me'yorlari bo'yicha klinikaning muvofiqligini ta'minlash uchun asosiy talablarni ko'rsating." },
      { icon: Search, label: 'Tekshiruvga Tayyorlik', p: "Davlat tibbiyot tekshiruviga tayyorlanish bo'yicha to'liq chek-list va maslahatlar bering." },
      { icon: Award, label: 'Malaka Tahlili', p: "Tibbiy xodimlarning malaka toifalari, ularni oshirish tartibi va muddatlari haqida batafsil ma'lumot bering." },
      { icon: FileText, label: 'Xizmat Shartnomasi', p: "Tibbiy xizmatlar ko'rsatish shartnomasi uchun asosiy bandlar va qonuniy talablarni tayyorlab bering." },
      { icon: Heart, label: 'Bemor Rozilik Shakli', p: "Bemor roziligi shakli uchun O'zbekiston qonunchiligidagi barcha majburiy talablarni ko'rsating." },
      { icon: Zap, label: 'Sterilizatsiya Protokoli', p: "Tibbiy asbob-uskunalar sterilizatsiyasi uchun SanQvaN bo'yicha protokol va majburiy hujjatlarni tushuntiring." },
      { icon: MessageSquare, label: 'Shikoyatga Javob', p: "Bemor yoki uning vakili tomonidan kelgan shikoyatga rasmiy va professional javob yozishda yordam bering." },
      { icon: Settings, label: 'Jihozlar Sertifikati', p: "Tibbiy jihozlar sertifikatsiyasi, texnik pasport va xizmat ko'rsatish shartnomasi talablarini tushuntiring." },
    ],
    drafts: ['Mehnat Shartnomasi', 'Litsenziya Yangilash', "Malaka Oshirish Buyrug'i", 'Sterilizatsiya Shart.', "Yo'llanma Xat"],
    modelRec: 'Tavsiya etiladi',
    noConvs: "Suhbat yo'q",
    instantInsights: "Tezkor tibbiy ma'lumotlar",
    dragDrop: 'Fayllarni sudrab tashlash mumkin',
    thinking: 'Fikrlayapti',
  },
  ru: {
    platformBack: '← Smart Medical',
    aiName: 'ИИ Советник',
    aiSub: 'Медицинская AI Платформа',
    newChat: 'Новый чат',
    searchConvs: 'Поиск разговоров...',
    searchMsgs: 'Поиск сообщений...',
    recent: 'НЕДАВНИЕ',
    templates: 'МЕДИЦИНСКИЕ ШАБЛОНЫ',
    book: 'Бесплатная консультация',
    fast: 'Быстро', fastDesc: 'Быстрые ответы',
    balanced: 'Balanced', balancedDesc: 'Лучший выбор для большинства',
    deep: 'Глубокий', deepDesc: 'Сложный анализ',
    format: 'Формат',
    responseStyle: 'СТИЛЬ ОТВЕТА',
    formal: 'Официальный', formalDesc: 'Профессиональный медицинский текст',
    concise: 'Краткий', conciseDesc: 'Чёткие, прямые ответы',
    detailed: 'Детальный', detailedDesc: 'Глубокий анализ',
    risk: 'Анализ Рисков', riskDesc: 'Уровень риска и меры',
    heroTitle: 'ИИ Медицинский Советник',
    heroSub: 'AI-платформа для частных клиник Узбекистана. Мгновенные ответы на медицинские вопросы и вопросы соответствия.',
    placeholder: 'Напишите вопрос... (Enter — отправить, Shift+Enter — новая строка)',
    send: 'Отправить', stop: 'Остановить',
    addCtx: 'Добавить контекст клиники',
    ctxPlaceholder: 'Название клиники, область, статус лицензии... (необязательно)',
    aiLabel: 'ИИ Советник',
    suggested: [
      { q: 'Какие документы нужны для продления лицензии клиники?', icon: 'shield' },
      { q: 'Каковы требования СанПиН к дезинфекции?', icon: 'flask' },
      { q: 'Как повысить квалификационную категорию врача?', icon: 'award' },
      { q: 'Какие вопросы задаёт инспектор при проверке?', icon: 'search' },
      { q: 'Как правильно ответить на жалобу пациента?', icon: 'msg' },
    ],
    tpls: [
      { icon: Shield, label: 'Анализ Лицензии', p: 'Проанализируйте требования к медицинской лицензии моей клиники и укажите необходимые шаги для её продления.' },
      { icon: Users, label: 'Документы Персонала', p: 'Объясните все юридические требования к документам медицинского персонала клиники.' },
      { icon: ClipboardCheck, label: 'Соответствие СанПиН', p: 'Укажите основные требования СанПиН для обеспечения соответствия деятельности клиники.' },
      { icon: Search, label: 'Подготовка к Проверке', p: 'Составьте полный чеклист и рекомендации по подготовке к государственной медицинской проверке.' },
      { icon: Award, label: 'Анализ Квалификации', p: 'Предоставьте подробную информацию о квалификационных категориях и порядке их повышения.' },
      { icon: FileText, label: 'Договор Услуг', p: 'Подготовьте основные пункты и правовые требования договора на оказание медицинских услуг.' },
      { icon: Heart, label: 'Согласие Пациента', p: 'Укажите все обязательные требования к форме согласия пациента по законодательству Узбекистана.' },
      { icon: Zap, label: 'Протокол Стерилизации', p: 'Объясните протокол стерилизации медоборудования согласно СанПиН и необходимые документы.' },
      { icon: MessageSquare, label: 'Ответ на Жалобу', p: 'Помогите составить официальный и профессиональный ответ на жалобу пациента или его представителя.' },
      { icon: Settings, label: 'Сертификация Оборудования', p: 'Объясните требования к сертификации медоборудования, техническому паспорту и договору обслуживания.' },
    ],
    drafts: ['Трудовой Договор', 'Продление Лицензии', 'Приказ о Квалификации', 'Договор Стерилизации', 'Направление'],
    modelRec: 'Рекомендуется',
    noConvs: 'Нет разговоров',
    draftsLabel: 'ЧЕРНОВИКИ',
    instantInsights: 'Мгновенные медицинские инсайты',
    dragDrop: 'Поддерживается перетаскивание файлов',
    thinking: 'Думает',
  },
  en: {
    platformBack: '← Smart Medical',
    aiName: 'AI Advisor',
    aiSub: 'Medical AI Platform',
    newChat: 'New Chat',
    searchConvs: 'Search conversations...',
    searchMsgs: 'Search messages...',
    recent: 'RECENT',
    templates: 'MEDICAL TEMPLATES',
    book: 'Free Consultation',
    fast: 'Fast', fastDesc: 'Quick answers',
    balanced: 'Balanced', balancedDesc: 'Best for most',
    deep: 'Deep Think', deepDesc: 'Complex analysis',
    format: 'Format',
    responseStyle: 'RESPONSE STYLE',
    formal: 'Formal', formalDesc: 'Professional medical writing',
    concise: 'Concise', conciseDesc: 'Short, direct answers',
    detailed: 'Detailed', detailedDesc: 'In-depth analysis',
    risk: 'Risk Assessment', riskDesc: 'Risk level and measures',
    heroTitle: 'AI Medical Advisor',
    heroSub: 'AI-powered platform for private clinics in Uzbekistan. Get instant answers on SanQvaN, licensing, and medical compliance.',
    placeholder: 'Ask a question... (Enter to send, Shift+Enter for new line)',
    send: 'Send', stop: 'Stop',
    addCtx: 'Add clinic context',
    ctxPlaceholder: 'Clinic name, region, license status... (optional)',
    aiLabel: 'AI Advisor',
    suggested: [
      { q: 'What documents are needed to renew a clinic license?', icon: 'shield' },
      { q: 'What are the SanQvaN disinfection requirements?', icon: 'flask' },
      { q: "How do I upgrade a doctor's qualification category?", icon: 'award' },
      { q: 'What questions does an inspector ask during an audit?', icon: 'search' },
      { q: 'How should I respond to a patient complaint?', icon: 'msg' },
    ],
    tpls: [
      { icon: Shield, label: 'License Analysis', p: "Analyze my clinic's medical license requirements and detail the steps needed for renewal." },
      { icon: Users, label: 'Staff Documentation', p: 'Explain all legal requirements for medical staff documentation in the clinic.' },
      { icon: ClipboardCheck, label: 'SanQvaN Compliance', p: 'List the key SanQvaN sanitary norms required to ensure clinic compliance.' },
      { icon: Search, label: 'Inspection Preparation', p: 'Provide a complete checklist and guidance for preparing for a government medical inspection.' },
      { icon: Award, label: 'Credential Analysis', p: 'Provide detailed information on medical staff qualification categories and how to upgrade them.' },
      { icon: FileText, label: 'Service Contract', p: 'Prepare the key clauses and legal requirements for a medical services contract.' },
      { icon: Heart, label: 'Patient Consent Form', p: 'List all mandatory requirements for patient consent forms under Uzbekistan law.' },
      { icon: Zap, label: 'Sterilization Protocol', p: 'Explain the sterilization protocol for medical equipment per SanQvaN and required documentation.' },
      { icon: MessageSquare, label: 'Complaint Response', p: "Help compose an official and professional response to a patient's or representative's complaint." },
      { icon: Settings, label: 'Equipment Certificate', p: 'Explain the requirements for medical equipment certification, technical passports, and service contracts.' },
    ],
    drafts: ['Labor Contract', 'License Renewal', 'Qualification Order', 'Sterilization Contract', 'Referral Letter'],
    modelRec: 'Recommended',
    noConvs: 'No conversations',
    draftsLabel: 'DRAFT DOCUMENTS',
    instantInsights: 'Instant medical insights',
    dragDrop: 'Drag & drop files supported',
    thinking: 'Thinking',
  },
  uz_cyrillic: {
    platformBack: '← Smart Medical',
    aiName: 'АИ Маслаҳатчи',
    aiSub: 'Тиббий АИ Платформа',
    newChat: 'Янги Суҳбат',
    searchConvs: 'Суҳбатларни қидириш...',
    searchMsgs: 'Хабарларни қидириш...',
    recent: 'СЎНГГИлАР',
    templates: 'ТИББИЙ ШАБЛОНЛАР',
    draftsLabel: 'ҚОРАЛАМА ҲУЖЖАТЛАР',
    book: 'Бепул Консультация',
    fast: 'Fast', fastDesc: 'Тезкор жавоблар',
    balanced: 'Balanced', balancedDesc: 'Кўп ҳолларда энг яхши',
    deep: 'Deep Think', deepDesc: 'Мураккаб таҳлил',
    format: 'Формат',
    responseStyle: 'ЖАВОБ УСЛУБИ',
    formal: 'Расмий', formalDesc: 'Профессионал тиббий ёзув',
    concise: 'Қисқа', conciseDesc: 'Тўғри, қисқа жавоблар',
    detailed: 'Батафсил', detailedDesc: 'Чуқур таҳлил',
    risk: 'Хавф Баҳолаш', riskDesc: 'Хавф даражаси ва чоралар',
    heroTitle: 'АИ Тиббий Маслаҳатчи',
    heroSub: 'Ўзбекистон хусусий клиникалари учун АИ-платформа. СанҚвН, лицензиялаш ва тиббий саволларга дарҳол жавоб олинг.',
    placeholder: 'Савол ёзинг... (Enter — юбориш, Shift+Enter — янги қатор)',
    send: 'Юбориш', stop: 'Тўхтатиш',
    addCtx: 'Клиника контекстини қўшинг',
    ctxPlaceholder: 'Клиника номи, вилоят, лицензия ҳолати... (ихтиёрий)',
    aiLabel: 'АИ Маслаҳатчи',
    suggested: [
      { q: 'Клиника лицензиясини янгилаш учун қандай ҳужжатлар керак?', icon: 'shield' },
      { q: 'СанҚвН меъёрларига кўра дезинфекция тартиботлари қандай?', icon: 'flask' },
      { q: 'Шифокор малака тоифасини кўтариш босқичлари қандай?', icon: 'award' },
      { q: 'Текширув вақтида инспектор қандай саволлар беради?', icon: 'search' },
      { q: 'Бемор шикоятига қандай жавоб бериш керак?', icon: 'msg' },
    ],
    tpls: [
      { icon: Shield, label: 'Лицензия Таҳлили', p: 'Клиникамнинг тиббий фаолият лицензияси талабларини ва уни янгилаш учун зарур қадамларни батафсил кўрсатинг.' },
      { icon: Users, label: 'Ходимлар Ҳужжатлари', p: 'Клинисадаги тиббий ходимларнинг барча ҳужжатларига қўйиладиган қонуний талабларни тушунтиринг.' },
      { icon: ClipboardCheck, label: 'СанҚвН Мувофиқлик', p: 'СанҚвН санитария меъёрлари бўйича клинисанинг мувофиқлигини таъминлаш учун асосий талабларни кўрсатинг.' },
      { icon: Search, label: 'Текширувга Тайёрлик', p: 'Давлат тиббиёт текширувига тайёрланиш бўйича тўлиқ чек-лист ва маслаҳатлар беринг.' },
      { icon: Award, label: 'Малака Таҳлили', p: 'Тиббий ходимларнинг малака тоифалари, уларни ошириш тартиби ва муддатлари ҳақида батафсил маълумот беринг.' },
      { icon: FileText, label: 'Хизмат Шартномаси', p: 'Тиббий хизматлар кўрсатиш шартномаси учун асосий бандлар ва қонуний талабларни тайёрлаб беринг.' },
      { icon: Heart, label: 'Бемор Розилик Шакли', p: 'Бемор розилиги шакли учун Ўзбекистон қонунчилигидаги барча мажбурий талабларни кўрсатинг.' },
      { icon: Zap, label: 'Стерилизация Протоколи', p: 'Тиббий асбоб-ускуналар стерилизацияси учун СанҚвН бўйича протокол ва мажбурий ҳужжатларни тушунтиринг.' },
      { icon: MessageSquare, label: 'Шикоятга Жавоб', p: 'Бемор ёки унинг вакили томонидан келган шикоятга расмий ва профессионал жавоб ёзишда ёрдам беринг.' },
      { icon: Settings, label: 'Жиҳозлар Сертификати', p: 'Тиббий жиҳозлар сертификацияси, техник паспорт ва хизмат кўрсатиш шартномаси талабларини тушунтиринг.' },
    ],
    drafts: ['Меҳнат Шартномаси', 'Лицензия Янгилаш', 'Малака Ошириш Буйруғи', 'Стерилизация Шарт.', 'Йўлланма Хат'],
    modelRec: 'Тавсия этилади',
    noConvs: 'Суҳбат йўқ',
    instantInsights: 'Тезкор тиббий маълумотлар',
    dragDrop: 'Файлларни судраб ташлаш мумкин',
    thinking: 'Фикрлаяпти',
  },
  kk: {
    platformBack: '← Smart Medical',
    aiName: 'ЖИ Кеңесші',
    aiSub: 'Медициналық ЖИ Платформасы',
    newChat: 'Жаңа Сөйлесу',
    searchConvs: 'Сөйлесулерді іздеу...',
    searchMsgs: 'Хабарларды іздеу...',
    recent: 'СОҢҒЫЛАР',
    templates: 'МЕДИЦИНАЛЫҚ ҮЛГІЛЕР',
    draftsLabel: 'ЖОБА ҚҰЖАТТАР',
    book: 'Тегін Кеңес',
    fast: 'Fast', fastDesc: 'Жылдам жауаптар',
    balanced: 'Balanced', balancedDesc: 'Көп жағдайда үздік',
    deep: 'Deep Think', deepDesc: 'Күрделі талдау',
    format: 'Формат',
    responseStyle: 'ЖАУАП СТИЛІ',
    formal: 'Ресми', formalDesc: 'Кәсіби медициналық жазба',
    concise: 'Қысқаша', conciseDesc: 'Нақты, қысқа жауаптар',
    detailed: 'Толық', detailedDesc: 'Тереңдетілген талдау',
    risk: 'Тәуекел Бағалау', riskDesc: 'Тәуекел деңгейі мен шаралар',
    heroTitle: 'ЖИ Медициналық Кеңесші',
    heroSub: 'Өзбекстанның жеке клиникалары үшін ЖИ-платформа. СанҚвН, лицензиялау және медициналық сұрақтарға жылдам жауап алыңыз.',
    placeholder: 'Сұрақ жазыңыз... (Enter — жіберу, Shift+Enter — жаңа жол)',
    send: 'Жіберу', stop: 'Тоқтату',
    addCtx: 'Клиника контекстін қосыңыз',
    ctxPlaceholder: 'Клиника атауы, облыс, лицензия мәртебесі... (міндетті емес)',
    aiLabel: 'ЖИ Кеңесші',
    suggested: [
      { q: 'Клиника лицензиясын жаңарту үшін қандай құжаттар қажет?', icon: 'shield' },
      { q: 'СанҚвН нормалары бойынша дезинфекция тәртібі қандай?', icon: 'flask' },
      { q: 'Дәрігердің біліктілік санатын қалай жоғарылатуға болады?', icon: 'award' },
      { q: 'Тексеру кезінде инспектор қандай сұрақтар қояды?', icon: 'search' },
      { q: 'Пациент шағымына қалай жауап беру керек?', icon: 'msg' },
    ],
    tpls: [
      { icon: Shield, label: 'Лицензия Талдауы', p: 'Клиникамның медициналық қызмет лицензиясының талаптарын және оны жаңарту үшін қажетті қадамдарды толық көрсетіңіз.' },
      { icon: Users, label: 'Қызметкерлер Құжаттары', p: 'Клиникадағы медицина қызметкерлерінің барлық құжаттарына қойылатын заңдық талаптарды түсіндіріңіз.' },
      { icon: ClipboardCheck, label: 'СанҚвН Сәйкестілік', p: 'Клиника қызметінің сәйкестілігін қамтамасыз ету үшін СанҚвН санитарлық нормаларының негізгі талаптарын көрсетіңіз.' },
      { icon: Search, label: 'Тексеруге Дайындық', p: 'Мемлекеттік медициналық тексеруге дайындалу бойынша толық тізім мен кеңестер беріңіз.' },
      { icon: Award, label: 'Біліктілік Талдауы', p: 'Медицина қызметкерлерінің біліктілік санаттары, оларды арттыру тәртібі мен мерзімдері туралы толық мәлімет беріңіз.' },
      { icon: FileText, label: 'Қызмет Шарты', p: 'Медициналық қызметтер көрсету шарты үшін негізгі тармақтар мен заңдық талаптарды дайындаңыз.' },
      { icon: Heart, label: 'Пациент Келісім Нысаны', p: 'Өзбекстан заңнамасы бойынша пациент келісім нысанына қойылатын барлық міндетті талаптарды көрсетіңіз.' },
      { icon: Zap, label: 'Стерилизация Хаттамасы', p: 'Медициналық жабдықты стерилизациялаудың СанҚвН бойынша хаттамасы мен міндетті құжаттарды түсіндіріңіз.' },
      { icon: MessageSquare, label: 'Шағымға Жауап', p: 'Пациенттің немесе оның өкілінің шағымына ресми және кәсіби жауап жазуға көмектесіңіз.' },
      { icon: Settings, label: 'Жабдықтар Сертификаты', p: 'Медициналық жабдықтарды сертификаттау, техникалық паспорт және қызмет көрсету шарты талаптарын түсіндіріңіз.' },
    ],
    drafts: ['Еңбек Шарты', 'Лицензия Жаңарту', 'Біліктілік Бұйрығы', 'Стерилизация Шарт.', 'Жолдама Хат'],
    modelRec: 'Ұсынылады',
    noConvs: 'Сөйлесу жоқ',
    instantInsights: 'Жылдам медициналық түсініктер',
    dragDrop: 'Файлдарды сүйреп апару қолдау көрсетіледі',
    thinking: 'Ойлануда',
  },
} as const;

type LangKey = keyof typeof L;

// ─── Models (UI — cosmetic selection, all route to Gemini backend) ───────────
const MODELS_DESC: Record<string, Record<LangKey, string>> = {
  'claude-opus-4-6': {
    uz: "Anthropic ning eng yaxshi flagship modeli. 1M token kontekst. Murakkab ko'p bosqichli fikrlash, agentli rejalashtirish va katta kod bazalari bilan ishlash uchun beqiyos",
    uz_cyrillic: "Anthropic нинг энг яхши flagship модели. 1M токен контекст. Мураккаб кўп босқичли фикрлаш, агентли режалаштириш ва катта код базалари билан ишлаш учун беқиёс",
    ru: "Флагманская модель Anthropic. 1M токенов контекст. Непревзойдённая для сложных многошаговых рассуждений, агентного планирования и работы с большими кодовыми базами",
    en: "Anthropic's current flagship. 1M token context. Unmatched for complex multi-step reasoning, agentic planning, and large-codebase refactoring",
    kk: "Anthropic флагманы. 1M токен контекст. Күрделі көп қадамды пайымдау, агенттік жоспарлау және үлкен кодтық базалармен жұмыс үшін теңдессіз",
  },
  'claude-sonnet-4-6': {
    uz: "Sanoatning ishchi oti — Opus tezligiga yaqin intellekt va tezroq chiqish. Kompyuter boshqaruvi imkoniyatlari bilan ko'plab vazifalarni bajarish uchun eng yaxshi tanlov",
    uz_cyrillic: "Саноатнинг ишчи оти — Opus тезлигига яқин интеллект ва тезроқ чиқиш. Компьютер бошқаруви имкониятлари билан кўплаб вазифаларни бажариш учун энг яхши танлов",
    ru: "«Рабочая лошадь» индустрии — интеллект близкий к Opus при значительно большей скорости. Лучший выбор для большинства задач с высококачественным управлением компьютером",
    en: "The industry workhorse — near-Opus intelligence with significantly faster output and high-fidelity computer-use capabilities. Best all-round choice for most tasks",
    kk: "Индустрияның «жұмыс аты» — Opus-қа жақын интеллект, бірақ айтарлықтай жоғары жылдамдық. Компьютерді басқару мүмкіндіктерімен көп тапсырмалар үшін үздік таңдау",
  },
  'gemini-3.1-pro': {
    uz: "Inson afzalliklarida lider (LMArena). Matn, audio va video bo'yicha keng kontekst va mahalliy multimodal fikrlash. Google ning eng kuchli modeli",
    uz_cyrillic: "Инсон афзалликларида лидер (LMArena). Матн, аудио ва видео бўйича кенг контекст ва маҳаллий мультимодал фикрлаш. Google нинг энг кучли модели",
    ru: "Лидер человеческих предпочтений (LMArena). Огромный контекст и нативное мультимодальное мышление через текст, аудио и видео. Самая мощная модель Google",
    en: "Current leader in human preference (LMArena). Massive context window with native multimodal reasoning across text, audio, and video. Google's most powerful model",
    kk: "Адам таңдаулары бойынша көшбасшы (LMArena). Мәтін, аудио және бейне арқылы нативті мультимодалды пайымдау. Google-дің ең қуатты моделі",
  },
  'gemini-3.1-flash-lite': {
    uz: "2026 yil martida chiqarilgan tezlik ustuvor model. Real vaqtli agentli ish jarayonlari va xarajat samarali ko'lamlilik uchun optimallashtirilgan",
    uz_cyrillic: "2026 йил мартида чиқарилган тезлик устувор модел. Реал вақтли агентли иш жараёнлари ва харажат самарали кўламлилик учун оптималлаштирилган",
    ru: "Модель «скорость прежде всего», выпущенная в марте 2026. Оптимизирована для агентных рабочих процессов в реальном времени и экономичного масштабирования",
    en: "The speed-first model released March 2026, optimized for real-time agentic workflows and cost-effective scalability at the highest throughput",
    kk: "2026 жылы наурызда шыққан жылдамдық үшін оңтайландырылған модель. Нақты уақытты агенттік жұмыс процестері мен үнемді масштабтауға арналған",
  },
  'gpt-5.4': {
    uz: "OpenAI ning asosiy flagship modeli. Yagona fikrlash tizimi vazifalarni samaradorlik va 'fikrlash' rejimlari o'rtasida dinamik ravishda yo'naltiradi",
    uz_cyrillic: "OpenAI нинг асосий flagship модели. Ягона фикрлаш тизими вазифаларни самарадорлик ва 'фикрлаш' режимлари ўртасида динамик равишда йўналтиради",
    ru: "Главный флагман OpenAI. Единая система рассуждений динамически маршрутизирует задачи между режимами эффективности и «мышления»",
    en: "OpenAI's premier flagship using a unified reasoning system that dynamically routes tasks between efficiency and deep thinking modes",
    kk: "OpenAI-дің негізгі флагманы. Бірыңғай пайымдау жүйесі тапсырмаларды тиімділік пен «ойлау» режимдері арасында динамикалық түрде бағыттайды",
  },
  'llama-4-scout': {
    uz: "2026 yildagi etakchi ochiq manbali model. Rekord darajadagi 10 million token kontekst oynasi bilan ultra uzun hujjatlar va to'liq kod repolarini qamrab oladi",
    uz_cyrillic: "2026 йилдаги етакчи очиқ манбали модел. Рекорд даражадаги 10 миллион токен контекст ойнаси билан ультра узун ҳужжатлар ва тўлиқ код реполарини қамраб олади",
    ru: "Ведущая модель с открытым кодом 2026 года. Рекордное окно контекста в 10 миллионов токенов охватывает сверхдлинные документы и целые репозитории кода",
    en: "The leading open-weights model of 2026, notable for its record-breaking 10 million token context window — covering entire codebases and ultra-long documents",
    kk: "2026 жылдың жетекші ашық кодты моделі. Рекордтық 10 миллион токен контекст терезесі өте ұзын құжаттар мен толық кодтық репозиторийлерді қамтиды",
  },
  'mistral-small-4': {
    uz: "Kodlash va agentli asboblardan foydalanishda frontier samaradorlikka erishgan ixcham korporativ model. Yuqori samarali va tejamkor",
    uz_cyrillic: "Кодлаш ва агентли асбоблардан фойдаланишда frontier самарадорликка эришган ихчам корпоратив модел. Юқори самарали ва тежамкор",
    ru: "Компактная корпоративная модель, достигающая производительности frontier в кодировании и агентном использовании инструментов. Высокоэффективная и экономичная",
    en: "A compact enterprise-grade model that matches frontier performance in coding and agentic tool-use while remaining highly efficient and cost-effective",
    kk: "Кодтауда және агенттік құралдарды пайдалануда frontier деңгейіне жеткен ықшам корпоративтік модель. Жоғары тиімді және үнемді",
  },
};

const MODELS = [
  { id: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro', provider: 'Google', dot: 'bg-blue-600', rec: true },
  { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', provider: 'Anthropic', dot: 'bg-violet-600', rec: false },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', provider: 'Anthropic', dot: 'bg-violet-400', rec: false },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', provider: 'Google', dot: 'bg-blue-400', rec: false },
  { id: 'gpt-5.4', label: 'GPT-5.4', provider: 'OpenAI', dot: 'bg-emerald-500', rec: false },
  { id: 'llama-4-scout', label: 'Llama 4 Scout', provider: 'Meta', dot: 'bg-rose-500', rec: false },
  { id: 'mistral-small-4', label: 'Mistral Small 4', provider: 'Mistral AI', dot: 'bg-orange-500', rec: false },
];

const DRAFT_CHARS = [4234, 3891, 2567, 5120, 1893];

// ─── Format → API value map ───────────────────────────────────────────────────
const FORMAT_API: Record<FormatKey, string> = {
  formal: 'medical', concise: 'summary', detailed: 'default', risk: 'risk',
};

// ─── Mode → API value map ─────────────────────────────────────────────────────
const MODE_API: Record<Mode, string> = {
  fast: 'fast', balanced: 'balanced', deep: 'deep',
};

// ─── Icon map for suggested questions ────────────────────────────────────────
function SuggestIcon({ type }: { type: string }) {
  const cls = "h-4 w-4";
  if (type === 'shield') return <Shield className={cls} />;
  if (type === 'flask') return <FlaskConical className={cls} />;
  if (type === 'award') return <Award className={cls} />;
  if (type === 'search') return <Search className={cls} />;
  return <MessageSquare className={cls} />;
}

const SUGGEST_COLORS = [
  'text-orange-500 bg-orange-50 dark:bg-orange-950/30',
  'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30',
  'text-violet-500 bg-violet-50 dark:bg-violet-950/30',
  'text-teal-500 bg-teal-50 dark:bg-teal-950/30',
  'text-rose-500 bg-rose-50 dark:bg-rose-950/30',
];

// ─── Markdown renderer ────────────────────────────────────────────────────────
function MdText({ text }: { text: string }) {
  return (
    <div className="space-y-1.5 text-[13px] leading-relaxed">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <p key={i} className="font-bold text-sm mt-2.5">{line.slice(4)}</p>;
        if (line.startsWith('## ')) return <p key={i} className="font-bold mt-2.5">{line.slice(3)}</p>;
        if (/^\*\*(.+)\*\*$/.test(line)) return <p key={i} className="font-semibold">{line.slice(2,-2)}</p>;
        if (line.startsWith('- ') || line.startsWith('• ')) return (
          <div key={i} className="flex gap-2 items-start">
            <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-current shrink-0 opacity-50" />
            <span>{line.slice(2)}</span>
          </div>
        );
        if (line.trim() === '') return <div key={i} className="h-1.5" />;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AIStandalonePage() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLanguage();
  const router = useRouter();

  // Language texts
  const lk: LangKey = lang === 'uz_cyrillic' ? 'uz_cyrillic' : lang === 'ru' ? 'ru' : lang === 'en' ? 'en' : lang === 'kk' ? 'kk' : 'uz';
  const tx = L[lk];

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchConv, setSearchConv] = useState('');

  // Settings
  const [mode, setMode] = useState<Mode>('balanced');
  const [format, setFormat] = useState<FormatKey>('formal');
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [context, setContext] = useState('');
  const [ctxOpen, setCtxOpen] = useState(false);

  // UI state
  const [formatOpen, setFormatOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [searchMsg, setSearchMsg] = useState('');

  // Chat
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const formatRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeId) ?? null;
  const messages = activeConv?.messages ?? [];

  // Filter messages by search
  const displayMessages = searchMsg
    ? messages.filter((m) => m.content.toLowerCase().includes(searchMsg.toLowerCase()))
    : messages;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // Close dropdowns on outside click
  useEffect(() => {
    function h(e: MouseEvent) {
      if (formatRef.current && !formatRef.current.contains(e.target as Node)) setFormatOpen(false);
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setModelOpen(false);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  function newChat() {
    if (loading) { abortRef.current?.abort(); setLoading(false); }
    setActiveId(null); setInput(''); setError(null); setSearchMsg('');
  }

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null); setInput(''); setLoading(true);

    let cid = activeId;
    if (!cid) {
      cid = crypto.randomUUID();
      const title = trimmed.slice(0, 48) + (trimmed.length > 48 ? '...' : '');
      setConversations((prev) => [{ id: cid!, title, messages: [], mode }, ...prev]);
      setActiveId(cid);
    }

    const userMsg: Message = { role: 'user', content: trimmed };
    setConversations((prev) => prev.map((c) =>
      c.id === cid ? { ...c, messages: [...c.messages, userMsg, { role: 'assistant', content: '' }] } : c
    ));

    const reqMsgs: Message[] = [...messages, userMsg];
    abortRef.current = new AbortController();

    try {
      // Only pass real Gemini model IDs to the backend. Cosmetic picks
      // (Claude/GPT/DeepSeek/Llama) fall through to the mode default.
      const realGeminiIds = new Set([
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
      ]);
      const apiModel = realGeminiIds.has(selectedModel.id) ? selectedModel.id : undefined;

      const idToken = user ? await user.getIdToken() : '';
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({
          messages: reqMsgs,
          mode: MODE_API[mode],
          model: apiModel,
          format: FORMAT_API[format],
          context: context.trim() || undefined,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? `Error ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const p = line.slice(6);
          if (p === '[DONE]') continue;
          try {
            const j = JSON.parse(p) as { delta?: string; model?: string };
            if (j.model) continue; // informational frame
            if (!j.delta) continue;
            full += j.delta;
            setConversations((prev) => prev.map((c) => {
              if (c.id !== cid) return c;
              const ms = [...c.messages];
              ms[ms.length - 1] = { role: 'assistant', content: full };
              return { ...c, messages: ms };
            }));
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Xato yuz berdi.');
      setConversations((prev) => prev.map((c) =>
        c.id === cid ? { ...c, messages: c.messages.slice(0, -1) } : c
      ));
    } finally {
      setLoading(false); abortRef.current = null;
    }
  }, [activeId, loading, messages, mode, format, context, selectedModel]);

  function handleSubmit(e: FormEvent) { e.preventDefault(); sendMessage(input); }
  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  }

  const filteredConvs = conversations.filter((c) =>
    !searchConv || c.title.toLowerCase().includes(searchConv.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const FORMATS: { key: FormatKey; label: string; desc: string }[] = [
    { key: 'formal', label: tx.formal, desc: tx.formalDesc },
    { key: 'concise', label: tx.concise, desc: tx.conciseDesc },
    { key: 'detailed', label: tx.detailed, desc: tx.detailedDesc },
    { key: 'risk', label: tx.risk, desc: tx.riskDesc },
  ];

  const curFmt = FORMATS.find((f) => f.key === format)!;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 overflow-hidden">

      {/* ── Left Sidebar ──────────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 bg-slate-900 flex flex-col border-r border-slate-800/60 hidden lg:flex">

        {/* Platform back link */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-800/60">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-medium mb-3 group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            {tx.platformBack}
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shrink-0">
              <Bot className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-none">{tx.aiName}</p>
              <p className="text-[10px] text-cyan-400 font-semibold tracking-wide mt-0.5">{tx.aiSub}</p>
            </div>
          </div>
        </div>

        {/* New Chat */}
        <div className="px-3 pt-3 pb-2">
          <button
            onClick={newChat}
            className="w-full flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 px-3 py-2 text-sm font-semibold text-white transition-all"
          >
            <Plus className="h-4 w-4" />{tx.newChat}
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              value={searchConv}
              onChange={(e) => setSearchConv(e.target.value)}
              placeholder={tx.searchConvs}
              className="w-full bg-white/5 border border-white/8 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-cyan-500/40 transition-colors"
            />
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto space-y-1 px-2 pb-3">

          {/* Recent conversations */}
          {filteredConvs.length > 0 && (
            <div className="mb-1">
              <p className="px-2 py-1.5 text-[10px] font-bold tracking-[0.14em] text-slate-600">{tx.recent}</p>
              {filteredConvs.slice(0, 7).map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setActiveId(c.id); setSearchMsg(''); }}
                  className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-all group ${
                    activeId === c.id ? 'bg-white/12 text-white' : 'text-slate-400 hover:bg-white/7 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="h-3 w-3 shrink-0 opacity-50" />
                  <span className="text-xs truncate">{c.title}</span>
                </button>
              ))}
            </div>
          )}

          {/* Medical Templates */}
          <div>
            <p className="px-2 py-1.5 text-[10px] font-bold tracking-[0.14em] text-slate-600">{tx.templates}</p>
            {tx.tpls.map((tpl) => (
              <button
                key={tpl.label}
                onClick={() => sendMessage(tpl.p)}
                className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-all group"
              >
                <tpl.icon className="h-3.5 w-3.5 shrink-0 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors truncate">{tpl.label}</span>
              </button>
            ))}
          </div>

          {/* Draft Documents */}
          <div className="mt-1">
            <p className="px-2 py-1.5 text-[10px] font-bold tracking-[0.14em] text-slate-600">
              {tx.draftsLabel}
            </p>
            {tx.drafts.map((title: string, i: number) => (
              <button
                key={i}
                className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-white/7 transition-all group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-slate-600 group-hover:text-slate-400" />
                  <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors truncate">{title}</span>
                </div>
                <span className="text-[10px] text-slate-700 shrink-0 ml-1">{(DRAFT_CHARS[i] / 1000).toFixed(1)}k</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800/60 px-3 py-3 space-y-2 shrink-0">
          <div className="flex items-center gap-2 text-slate-600 text-xs">
            <Phone className="h-3 w-3 shrink-0" />
            <span>+998 90 825 08 78</span>
          </div>
          <button className="w-full rounded-lg bg-gradient-to-r from-cyan-600 to-emerald-600 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity">
            {tx.book}
          </button>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">

        {/* ── Top Bar ──────────────────────────────────────────────────────── */}
        <div className="h-12 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 gap-3 shrink-0 bg-white dark:bg-slate-900">
          {/* Mode pills */}
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-full p-0.5">
            {([
              { id: 'fast' as Mode, label: tx.fast, emoji: '⚡', cls: 'bg-orange-500' },
              { id: 'balanced' as Mode, label: tx.balanced, emoji: '⚖️', cls: 'bg-cyan-600' },
              { id: 'deep' as Mode, label: tx.deep, emoji: '🧠', cls: 'bg-violet-600' },
            ]).map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                  mode === m.id
                    ? `${m.cls} text-white shadow-sm`
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Format dropdown */}
            <div ref={formatRef} className="relative">
              <button
                onClick={() => { setFormatOpen((v) => !v); setModelOpen(false); }}
                className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {tx.format} <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>
              {formatOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl z-50 overflow-hidden">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">{tx.responseStyle}</p>
                  </div>
                  {FORMATS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => { setFormat(f.key); setFormatOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        format === f.key ? 'border-cyan-500 bg-cyan-500' : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {format === f.key && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <p className={`text-xs font-semibold ${format === f.key ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-700 dark:text-slate-200'}`}>
                          {f.label}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{f.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Message search */}
            {messages.length > 0 && (
              <div className="relative hidden sm:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  value={searchMsg}
                  onChange={(e) => setSearchMsg(e.target.value)}
                  placeholder={tx.searchMsgs}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-cyan-400 w-44 placeholder:text-slate-400 transition-colors"
                />
              </div>
            )}

            {/* Model selector */}
            <div ref={modelRef} className="relative">
              <button
                onClick={() => { setModelOpen((v) => !v); setFormatOpen(false); }}
                className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <span className={`h-2 w-2 rounded-full shrink-0 ${selectedModel.dot}`} />
                <span className="hidden sm:inline">{selectedModel.label}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>
              {modelOpen && (
                <div className="absolute right-0 top-full mt-1 w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
                  {MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setSelectedModel(m); setModelOpen(false); }}
                      className="w-full flex items-start gap-3 px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left border-b border-slate-50 dark:border-slate-750 last:border-0"
                    >
                      <div className={`h-7 w-7 rounded-lg ${m.dot} flex items-center justify-center shrink-0 mt-0.5`}>
                        <span className="text-[10px] font-black text-white">{m.provider[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${selectedModel.id === m.id ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-800 dark:text-slate-100'}`}>
                            {m.label}
                          </span>
                          {m.rec && (
                            <span className="text-[9px] font-bold uppercase tracking-wide bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400 px-1.5 py-0.5 rounded-full">
                              {tx.modelRec}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
                          {MODELS_DESC[m.id]?.[lk] ?? ''}
                        </p>
                      </div>
                      {selectedModel.id === m.id && (
                        <span className="text-cyan-500 text-sm font-bold shrink-0 mt-0.5">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {messages.length > 0 && (
              <button onClick={newChat} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Chat Area ─────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {displayMessages.length === 0 && !loading ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center min-h-full px-6 py-10 text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-xl shadow-cyan-500/20 mb-5">
                <Stethoscope className="h-8 w-8 text-white" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {tx.instantInsights} &nbsp;·&nbsp;
                </span>
                <span className={`h-2 w-2 rounded-full ${selectedModel.dot}`} />
                <span className="text-[10px] font-bold text-slate-400">{selectedModel.label}</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{tx.heroTitle}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-8">{tx.heroSub}</p>

              {/* Mode cards */}
              <div className="flex flex-wrap gap-3 justify-center mb-8">
                {[
                  { emoji: '⚡', label: tx.fast, desc: tx.fastDesc, cls: 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20', id: 'fast' as Mode },
                  { emoji: '⚖️', label: tx.balanced, desc: tx.balancedDesc, cls: 'border-cyan-200 bg-cyan-50 dark:border-cyan-900 dark:bg-cyan-950/20', id: 'balanced' as Mode },
                  { emoji: '🧠', label: tx.deep, desc: tx.deepDesc, cls: 'border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/20', id: 'deep' as Mode },
                ].map((card) => (
                  <button
                    key={card.id}
                    onClick={() => setMode(card.id)}
                    className={`rounded-xl border px-4 py-3 text-center transition-all hover:shadow-sm ${card.cls} ${mode === card.id ? 'ring-2 ring-offset-1 ring-cyan-400' : ''}`}
                  >
                    <div className="text-xl mb-1">{card.emoji}</div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">{card.label}:&nbsp;{card.desc}</div>
                  </button>
                ))}
              </div>

              {/* Suggested questions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl w-full">
                {tx.suggested.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s.q)}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-left hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all group"
                  >
                    <span className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${SUGGEST_COLORS[i % 5]}`}>
                      <SuggestIcon type={s.icon} />
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-300 leading-snug text-left">{s.q}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {displayMessages.map((msg, i) => (
                <div key={`${msg.role}-${i}`} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-sm mt-1">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-slate-900 dark:bg-slate-700 text-white rounded-tr-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-tl-sm'
                  }`}>
                    {msg.role === 'assistant' && (
                      <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mb-2 flex items-center gap-1.5">
                        {tx.aiLabel}
                        <span className="opacity-40">·</span>
                        <span className={`h-1.5 w-1.5 rounded-full ${selectedModel.dot}`} />
                        <span className="opacity-60 normal-case tracking-normal">{selectedModel.label}</span>
                      </p>
                    )}
                    {msg.content
                      ? <MdText text={msg.content} />
                      : (
                        <div className="flex items-center gap-1 py-1">
                          <span className="h-2 w-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:0ms]" />
                          <span className="h-2 w-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:150ms]" />
                          <span className="h-2 w-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:300ms]" />
                        </div>
                      )
                    }
                  </div>
                  {msg.role === 'user' && (
                    <div className="h-8 w-8 shrink-0 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center mt-1">
                      <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* ── Input Area ────────────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-4">
          {/* Context toggle */}
          <button
            onClick={() => setCtxOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mb-2"
          >
            <Plus className={`h-3 w-3 transition-transform ${ctxOpen ? 'rotate-45' : ''}`} />
            {tx.addCtx}
            <ChevronDown className={`h-3 w-3 transition-transform ${ctxOpen ? 'rotate-180' : ''}`} />
          </button>
          {ctxOpen && (
            <input
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={tx.ctxPlaceholder}
              className="w-full mb-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-cyan-400 placeholder:text-slate-400 transition-colors"
            />
          )}

          {/* Format tabs */}
          <div className="flex gap-1 mb-2.5">
            {FORMATS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFormat(f.key)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all ${
                  format === f.key
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-3 py-2 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Textarea */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus-within:border-cyan-400 dark:focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-400/15 transition-all">
            <form onSubmit={handleSubmit}>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={tx.placeholder}
                disabled={loading}
                className="border-0 shadow-none focus-visible:ring-0 resize-none min-h-[72px] max-h-[160px] text-sm px-4 pt-3 pb-1 dark:bg-transparent dark:text-slate-100 placeholder:text-slate-400"
              />
              <div className="flex items-center justify-between px-3 pb-2.5 pt-1 gap-3">
                <div className="flex items-center gap-2">
                  <button type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <span className="text-[11px] text-slate-400 hidden sm:block">
                    {tx.dragDrop}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Format indicator */}
                  <span className="text-[11px] font-semibold border border-slate-200 dark:border-slate-700 rounded-full px-2 py-0.5 text-slate-500 dark:text-slate-400 hidden sm:inline">
                    {curFmt.label}
                  </span>
                  {/* Mode indicator */}
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full hidden sm:inline ${
                    mode === 'fast' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' :
                    mode === 'balanced' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400' :
                    'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400'
                  }`}>
                    {mode === 'fast' ? `⚡ ${tx.fast}` : mode === 'balanced' ? `⚖️ ${tx.balanced}` : `🧠 ${tx.deep}`}
                  </span>
                  {loading && (
                    <Button type="button" size="sm" variant="outline" onClick={() => { abortRef.current?.abort(); setLoading(false); }} className="h-7 px-2 text-xs gap-1">
                      <Square className="h-3 w-3 fill-current" />
                      {tx.stop}
                    </Button>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!input.trim() || loading}
                    className="h-8 px-4 gap-1.5 text-sm bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 text-white border-0 shadow-sm disabled:opacity-40 font-semibold"
                  >
                    {loading
                      ? <><span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />{tx.thinking}</>
                      : <><Send className="h-3.5 w-3.5" />{tx.send}</>
                    }
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
