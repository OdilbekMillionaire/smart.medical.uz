'use client';

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import type { Language } from '@/contexts/LanguageContext';
import {
  Bot, FileText, MessageSquare, Database, ShieldCheck,
  CheckCircle, ArrowRight, Menu, X, Star, TrendingUp, Users,
  Building2, Zap, Lock, Globe, ChevronDown, Stethoscope,
  Shield, Server, Eye, RefreshCw, ClipboardCheck, ChevronLeft, ChevronRight,
  Clock, DollarSign, AlertTriangle, BarChart3, Layers, Phone, Mail, MapPin,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

type MarketingFeature = {
  title: string;
  desc: string;
  badge: string;
};

type PlanCopy = {
  name: string;
  desc: string;
  features: string[];
};

type LandingMarketingCopy = {
  features: MarketingFeature[];
  securityFeatures: MarketingFeature[];
  comparison: Array<{ before: string; after: string }>;
  plans: PlanCopy[];
};

const LANDING_MARKETING_COPY: Record<Language, LandingMarketingCopy> = {
  ru: {
    features: [
      { title: 'Операционная панель клиники', desc: 'Приемы, календарь, смены, персонал, оборудование и ресурсы собраны в одном рабочем пространстве для руководителя клиники.', badge: 'Operations' },
      { title: 'Compliance Center', desc: 'Лицензии, дедлайны, проверки и AI-рекомендации помогают клинике заранее видеть регуляторные риски.', badge: 'Risk control' },
      { title: 'Document Center', desc: 'Шаблоны договоров, приказов, протоколов и направлений создаются на нужном языке и уходят на согласование.', badge: 'AI drafting' },
      { title: 'Cases & Requests', desc: 'Обращения, жалобы и направления превращаются в единый поток задач с ответственными и статусами.', badge: 'Workflow' },
      { title: 'Портал врача', desc: 'Врачи получают документы, сообщения, направления, знания, форум и карьерные возможности без лишних модулей клиники.', badge: 'Doctor portal' },
      { title: 'Портал пациента', desc: 'Пациенты видят записи, сообщения, вакцинации, QR-карту и профиль в отдельном простом кабинете.', badge: 'Patient portal' },
      { title: 'AI-советник', desc: 'Gemini помогает с медицинско-правовыми вопросами, черновиками ответов, визитами и подготовкой к проверкам.', badge: 'Gemini' },
      { title: 'Многоязычная работа', desc: 'Русский по умолчанию, плюс узбекская латиница, кириллица, английский и каракалпакский для команд и пациентов.', badge: '5 languages' },
      { title: 'Безопасный доступ по ролям', desc: 'Админ, клиника, врач и пациент видят разные рабочие области, маршруты и данные.', badge: 'RBAC' },
    ],
    securityFeatures: [
      { title: 'Шифрование AES-256', desc: 'Данные защищены при передаче и хранении.', badge: 'Security' },
      { title: 'Ежедневные резервные копии', desc: 'Автоматические backup-процессы помогают защитить операционные данные.', badge: 'Backup' },
      { title: 'Журнал аудита', desc: 'Ключевые действия пользователей фиксируются для контроля и расследований.', badge: 'Audit' },
      { title: 'Доступ по ролям', desc: 'Каждая роль получает только нужные страницы и допустимые данные.', badge: 'RBAC' },
      { title: 'Firebase и Google Cloud', desc: 'Платформа опирается на управляемую облачную инфраструктуру.', badge: 'Cloud' },
      { title: 'Мониторинг состояния', desc: 'Health endpoints и QA-проверки помогают видеть деградацию до запуска.', badge: 'Ops' },
    ],
    comparison: [
      { before: 'Дедлайны лицензий и сертификатов отслеживаются вручную', after: 'Compliance Center показывает сроки, риски и нужные действия' },
      { before: 'Документы, жалобы и направления живут в разных папках', after: 'Cases и Document Center собирают все в понятные рабочие потоки' },
      { before: 'Администратор, врач и пациент видят одинаковую перегруженную систему', after: 'Каждая роль получает свой кабинет, навигацию и задачи' },
      { before: 'Подготовка к проверке занимает дни и зависит от памяти сотрудников', after: 'AI и чек-листы показывают готовность клиники заранее' },
      { before: 'Руководитель клиники не видит операционную картину целиком', after: 'Дашборд показывает приемы, ресурсы, персонал и compliance-риски' },
      { before: 'Команда вручную собирает отчеты и ответы', after: 'AI помогает готовить черновики, сводки и документы быстрее' },
    ],
    plans: [
      {
        name: 'Starter',
        desc: 'Для небольшой клиники, которая хочет начать с документов и контроля сроков.',
        features: ['1 кабинет клиники', 'AI-советник до 100 запросов в месяц', 'Document Center', 'Compliance deadlines', 'Requests модуль', 'Email-поддержка'],
      },
      {
        name: 'Professional',
        desc: 'Для растущей клиники, которой нужен полноценный операционный контур.',
        features: ['Все роли и рабочие пространства', 'AI-советник без лимита', 'ERP, персонал, ресурсы и смены', 'Compliance Center и Inspection', 'Cases, сообщения и портал врача', 'Приоритетная поддержка'],
      },
      {
        name: 'Enterprise',
        desc: 'Для сети клиник или ассоциации с расширенными требованиями.',
        features: ['Неограниченные клиники и пользователи', 'Расширенные настройки ролей', 'API и интеграции', 'SLA и отдельная среда', 'Персональный менеджер', 'Обучение команды'],
      },
    ],
  },
  en: {
    features: [
      { title: 'Clinic Operations Workspace', desc: 'Appointments, calendar, shifts, staff, equipment, and resources live in one operating workspace for clinic teams.', badge: 'Operations' },
      { title: 'Compliance Center', desc: 'Licenses, deadlines, inspections, and AI advice help clinics see regulatory risk before it becomes a problem.', badge: 'Risk control' },
      { title: 'Document Center', desc: 'Contracts, orders, protocols, and referral templates are generated in the selected language and routed for review.', badge: 'AI drafting' },
      { title: 'Cases & Requests', desc: 'Requests, complaints, and referrals become one trackable workflow with owners and statuses.', badge: 'Workflow' },
      { title: 'Doctor Portal', desc: 'Doctors get documents, messages, referrals, knowledge, forum access, and career tools without clinic-management noise.', badge: 'Doctor portal' },
      { title: 'Patient Portal', desc: 'Patients see appointments, messages, vaccinations, QR card, and profile in a simple dedicated portal.', badge: 'Patient portal' },
      { title: 'AI Advisor', desc: 'Gemini helps with medical-legal questions, draft replies, visit summaries, and inspection readiness.', badge: 'Gemini' },
      { title: 'Multilingual Workflows', desc: 'Russian by default, plus Uzbek Latin, Uzbek Cyrillic, English, and Karakalpak for teams and patients.', badge: '5 languages' },
      { title: 'Role-Based Access', desc: 'Admin, clinic, doctor, and patient accounts each receive the right workspace, routes, and data.', badge: 'RBAC' },
    ],
    securityFeatures: [
      { title: 'AES-256 encryption', desc: 'Data is protected in transit and at rest.', badge: 'Security' },
      { title: 'Daily backups', desc: 'Automated backups help protect operating data.', badge: 'Backup' },
      { title: 'Audit log', desc: 'Key user actions are recorded for control and investigation.', badge: 'Audit' },
      { title: 'Role-based access', desc: 'Each role receives only the pages and data it should use.', badge: 'RBAC' },
      { title: 'Firebase and Google Cloud', desc: 'The platform is built on managed cloud infrastructure.', badge: 'Cloud' },
      { title: 'Health monitoring', desc: 'Health endpoints and QA checks surface degraded services before launch.', badge: 'Ops' },
    ],
    comparison: [
      { before: 'License and certificate deadlines are tracked manually', after: 'Compliance Center shows deadlines, risks, and required actions' },
      { before: 'Documents, complaints, and referrals live in separate folders', after: 'Cases and Document Center turn them into clear workflows' },
      { before: 'Admins, doctors, and patients see the same overloaded app', after: 'Each role gets its own dashboard, navigation, and tasks' },
      { before: 'Inspection readiness depends on memory and manual checklists', after: 'AI and checklists show clinic readiness in advance' },
      { before: 'Clinic leaders lack one view of daily operations', after: 'Dashboards show visits, resources, staff, and compliance risk' },
      { before: 'Teams manually prepare reports and replies', after: 'AI helps draft documents, summaries, and responses faster' },
    ],
    plans: [
      {
        name: 'Starter',
        desc: 'For a small clinic starting with documents and deadline control.',
        features: ['1 clinic workspace', 'AI Advisor up to 100 requests/month', 'Document Center', 'Compliance deadlines', 'Requests module', 'Email support'],
      },
      {
        name: 'Professional',
        desc: 'For a growing clinic that needs a complete operations system.',
        features: ['All roles and workspaces', 'Unlimited AI Advisor', 'ERP, staff, resources, and shifts', 'Compliance Center and Inspection', 'Cases, messages, and doctor portal', 'Priority support'],
      },
      {
        name: 'Enterprise',
        desc: 'For clinic networks or associations with advanced requirements.',
        features: ['Unlimited clinics and users', 'Advanced role configuration', 'API and integrations', 'SLA and dedicated environment', 'Dedicated manager', 'Team training'],
      },
    ],
  },
  uz: {
    features: [
      { title: 'Klinika operatsion paneli', desc: 'Qabul, kalendar, smenalar, xodimlar, uskunalar va resurslar klinika jamoasi uchun bitta ish maydonida.', badge: 'Operations' },
      { title: 'Compliance Center', desc: 'Litsenziyalar, muddatlar, tekshiruvlar va AI tavsiyalar klinikaga xavflarni oldindan ko‘rishga yordam beradi.', badge: 'Risk control' },
      { title: 'Document Center', desc: 'Shartnoma, buyruq, bayonnoma va yo‘llanma shablonlari tanlangan tilda yaratiladi va ko‘rib chiqishga yuboriladi.', badge: 'AI drafting' },
      { title: 'Cases & Requests', desc: 'Murojaat, shikoyat va yo‘llanmalar mas’ul shaxs va statuslar bilan yagona ish oqimiga aylanadi.', badge: 'Workflow' },
      { title: 'Shifokor portali', desc: 'Shifokorlar hujjat, xabar, yo‘llanma, bilim bazasi, forum va ish imkoniyatlarini ortiqcha modullarsiz ko‘radi.', badge: 'Doctor portal' },
      { title: 'Bemor portali', desc: 'Bemorlar qabul, xabarlar, emlashlar, QR karta va profilni sodda alohida kabinetda ko‘radi.', badge: 'Patient portal' },
      { title: 'AI maslahatchi', desc: 'Gemini tibbiy-huquqiy savollar, javob qoralamalari, tashrif xulosalari va tekshiruv tayyorgarligida yordam beradi.', badge: 'Gemini' },
      { title: 'Ko‘p tilli ish jarayoni', desc: 'Rus tili standart, shuningdek o‘zbek lotin, o‘zbek kirill, ingliz va qoraqalpoq tillari qo‘llab-quvvatlanadi.', badge: '5 languages' },
      { title: 'Rolga asoslangan kirish', desc: 'Admin, klinika, shifokor va bemor o‘ziga mos ish maydoni, yo‘nalish va ma’lumotlarni ko‘radi.', badge: 'RBAC' },
    ],
    securityFeatures: [
      { title: 'AES-256 shifrlash', desc: 'Ma’lumotlar uzatishda va saqlashda himoyalanadi.', badge: 'Security' },
      { title: 'Kunlik zaxira', desc: 'Avtomatik backup operatsion ma’lumotlarni himoya qilishga yordam beradi.', badge: 'Backup' },
      { title: 'Audit jurnali', desc: 'Muhim foydalanuvchi amallari nazorat uchun qayd etiladi.', badge: 'Audit' },
      { title: 'Rolga asoslangan kirish', desc: 'Har bir rol faqat o‘ziga kerakli sahifa va ma’lumotlarni oladi.', badge: 'RBAC' },
      { title: 'Firebase va Google Cloud', desc: 'Platforma boshqariladigan bulut infratuzilmasiga tayangan.', badge: 'Cloud' },
      { title: 'Holat monitoringi', desc: 'Health endpointlar va QA tekshiruvlar muammolarni ishga tushirishdan oldin ko‘rsatadi.', badge: 'Ops' },
    ],
    comparison: [
      { before: 'Litsenziya va sertifikat muddatlari qo‘lda kuzatiladi', after: 'Compliance Center muddat, xavf va kerakli harakatlarni ko‘rsatadi' },
      { before: 'Hujjatlar, shikoyatlar va yo‘llanmalar alohida papkalarda', after: 'Cases va Document Center ularni aniq ish oqimiga aylantiradi' },
      { before: 'Admin, shifokor va bemor bir xil og‘ir tizimni ko‘radi', after: 'Har bir rol o‘z dashboardi, navigatsiyasi va vazifalarini oladi' },
      { before: 'Tekshiruvga tayyorgarlik xotira va qo‘lda checklistga bog‘liq', after: 'AI va checklistlar klinika tayyorgarligini oldindan ko‘rsatadi' },
      { before: 'Klinika rahbari kunlik operatsiyani to‘liq ko‘rmaydi', after: 'Dashboard qabul, resurs, xodim va compliance xavfini ko‘rsatadi' },
      { before: 'Jamoa hisobot va javoblarni qo‘lda tayyorlaydi', after: 'AI hujjat, xulosa va javob qoralamalarini tezlashtiradi' },
    ],
    plans: [
      {
        name: 'Starter',
        desc: 'Hujjat va muddat nazoratidan boshlaydigan kichik klinika uchun.',
        features: ['1 klinika ish maydoni', 'AI maslahatchi oyiga 100 so‘rovgacha', 'Document Center', 'Compliance muddatlari', 'Requests moduli', 'Email qo‘llab-quvvatlash'],
      },
      {
        name: 'Professional',
        desc: 'To‘liq operatsion tizim kerak bo‘lgan o‘sayotgan klinika uchun.',
        features: ['Barcha rollar va ish maydonlari', 'Cheksiz AI maslahatchi', 'ERP, xodimlar, resurslar va smenalar', 'Compliance Center va Inspection', 'Cases, xabarlar va shifokor portali', 'Ustuvor qo‘llab-quvvatlash'],
      },
      {
        name: 'Enterprise',
        desc: 'Klinika tarmoqlari yoki assotsiatsiyalar uchun.',
        features: ['Cheksiz klinika va foydalanuvchi', 'Kengaytirilgan rol sozlamalari', 'API va integratsiyalar', 'SLA va alohida muhit', 'Shaxsiy menejer', 'Jamoani o‘qitish'],
      },
    ],
  },
  uz_cyrillic: {
    features: [
      { title: 'Клиника операцион панели', desc: 'Қабул, календарь, сменалар, ходимлар, ускуналар ва ресурслар клиника жамоаси учун битта иш майдонида.', badge: 'Operations' },
      { title: 'Compliance Center', desc: 'Лицензиялар, муддатлар, текширувлар ва AI тавсиялар клиникага хавфларни олдиндан кўришга ёрдам беради.', badge: 'Risk control' },
      { title: 'Document Center', desc: 'Шартнома, буйруқ, баённома ва йўлланма шаблонлари танланган тилда яратилади ва кўриб чиқишга юборилади.', badge: 'AI drafting' },
      { title: 'Cases & Requests', desc: 'Мурожаат, шикоят ва йўлланмалар масъул шахс ва статуслар билан ягона иш оқимига айланади.', badge: 'Workflow' },
      { title: 'Шифокор портали', desc: 'Шифокорлар ҳужжат, хабар, йўлланма, билим базаси, форум ва иш имкониятларини ортиқча модулларсиз кўради.', badge: 'Doctor portal' },
      { title: 'Бемор портали', desc: 'Беморлар қабул, хабарлар, эмлашлар, QR карта ва профилни содда алоҳида кабинетда кўради.', badge: 'Patient portal' },
      { title: 'AI маслаҳатчи', desc: 'Gemini тиббий-ҳуқуқий саволлар, жавоб қораламалари, ташриф хулосалари ва текширув тайёргарлигида ёрдам беради.', badge: 'Gemini' },
      { title: 'Кўп тилли иш жараёни', desc: 'Рус тили стандарт, шунингдек ўзбек лотин, ўзбек кирилл, инглиз ва қорақалпоқ тиллари қўллаб-қувватланади.', badge: '5 languages' },
      { title: 'Ролга асосланган кириш', desc: 'Админ, клиника, шифокор ва бемор ўзига мос иш майдони, йўналиш ва маълумотларни кўради.', badge: 'RBAC' },
    ],
    securityFeatures: [
      { title: 'AES-256 шифрлаш', desc: 'Маълумотлар узатишда ва сақлашда ҳимояланади.', badge: 'Security' },
      { title: 'Кунлик захира', desc: 'Автоматик backup операцион маълумотларни ҳимоя қилишга ёрдам беради.', badge: 'Backup' },
      { title: 'Аудит журнали', desc: 'Муҳим фойдаланувчи амаллари назорат учун қайд этилади.', badge: 'Audit' },
      { title: 'Ролга асосланган кириш', desc: 'Ҳар бир рол фақат ўзига керакли саҳифа ва маълумотларни олади.', badge: 'RBAC' },
      { title: 'Firebase ва Google Cloud', desc: 'Платформа бошқариладиган булут инфратузилмасига таянган.', badge: 'Cloud' },
      { title: 'Ҳолат мониторинги', desc: 'Health endpointлар ва QA текширувлар муаммоларни ишга туширишдан олдин кўрсатади.', badge: 'Ops' },
    ],
    comparison: [
      { before: 'Лицензия ва сертификат муддатлари қўлда кузатилади', after: 'Compliance Center муддат, хавф ва керакли ҳаракатларни кўрсатади' },
      { before: 'Ҳужжатлар, шикоятлар ва йўлланмалар алоҳида папкаларда', after: 'Cases ва Document Center уларни аниқ иш оқимига айлантиради' },
      { before: 'Админ, шифокор ва бемор бир хил оғир тизимни кўради', after: 'Ҳар бир рол ўз dashboardи, навигацияси ва вазифаларини олади' },
      { before: 'Текширувга тайёргарлик хотира ва қўлда checklistга боғлиқ', after: 'AI ва checklistлар клиника тайёргарлигини олдиндан кўрсатади' },
      { before: 'Клиника раҳбари кунлик операцияни тўлиқ кўрмайди', after: 'Dashboard қабул, ресурс, ходим ва compliance хавфини кўрсатади' },
      { before: 'Жамоа ҳисобот ва жавобларни қўлда тайёрлайди', after: 'AI ҳужжат, хулоса ва жавоб қораламаларини тезлаштиради' },
    ],
    plans: [
      {
        name: 'Starter',
        desc: 'Ҳужжат ва муддат назоратидан бошлайдиган кичик клиника учун.',
        features: ['1 клиника иш майдони', 'AI маслаҳатчи ойига 100 сўровгача', 'Document Center', 'Compliance муддатлари', 'Requests модули', 'Email қўллаб-қувватлаш'],
      },
      {
        name: 'Professional',
        desc: 'Тўлиқ операцион тизим керак бўлган ўсаётган клиника учун.',
        features: ['Барча роллар ва иш майдонлари', 'Чексиз AI маслаҳатчи', 'ERP, ходимлар, ресурслар ва сменалар', 'Compliance Center ва Inspection', 'Cases, хабарлар ва шифокор портали', 'Устувор қўллаб-қувватлаш'],
      },
      {
        name: 'Enterprise',
        desc: 'Клиника тармоқлари ёки ассоциациялар учун.',
        features: ['Чексиз клиника ва фойдаланувчи', 'Кенгайтирилган рол созламалари', 'API ва интеграциялар', 'SLA ва алоҳида муҳит', 'Шахсий менежер', 'Жамоани ўқитиш'],
      },
    ],
  },
  kk: {
    features: [
      { title: 'Klinika operaciyalıq paneli', desc: 'Qabıl, kalendar, smenalar, xızmetkerler, úskeneler hám resurslar klinika komandası ushın bir jumıs maydanında.', badge: 'Operations' },
      { title: 'Compliance Center', desc: 'Licenziyalar, múddetler, tekseriwler hám AI usınıslar klinikaǵa qáwiplerdi aldınan kóriwge járdem beredi.', badge: 'Risk control' },
      { title: 'Document Center', desc: 'Shártnama, buyrıq, bayannama hám jollanba shablonları tańlanǵan tilde jaratılıp, kórip shıǵıwǵa jiberiledi.', badge: 'AI drafting' },
      { title: 'Cases & Requests', desc: 'Múrájatlar, shaǵımlar hám jollanbalar juwapker shaxs hám statuslar menen bir jumıs aǵımına aylanadı.', badge: 'Workflow' },
      { title: 'Shıpaker portalı', desc: 'Shıpakerler hújjet, xabar, jollanba, bilim bazası, forum hám jumıs múmkinshiliklerin artıqsha modullarsız kóredi.', badge: 'Doctor portal' },
      { title: 'Pacient portalı', desc: 'Pacientler qabıl, xabarlar, vakcinaciyalar, QR karta hám profildi ápiwayı kabinetten kóredi.', badge: 'Patient portal' },
      { title: 'AI keńesshi', desc: 'Gemini medicinalıq-huqıqıy sorawlar, juwap qaralamaları, vizit juwmaqları hám tekseriwge tayarlıqta járdem beredi.', badge: 'Gemini' },
      { title: 'Kóp tilli jumıs', desc: 'Rus tili standart, sonıń menen birge ózbek latin, ózbek kirill, ingliz hám qaraqalpaq tilleri qollanıladı.', badge: '5 languages' },
      { title: 'Rolge baylanıslı kiriw', desc: 'Admin, klinika, shıpaker hám pacient ózine tiyisli jumıs maydanı, marshrut hám maǵlıwmatlardı kóredi.', badge: 'RBAC' },
    ],
    securityFeatures: [
      { title: 'AES-256 shifrlaw', desc: 'Maǵlıwmatlar uzatıwda hám saqlawda qorǵaladı.', badge: 'Security' },
      { title: 'Kúnlik backup', desc: 'Avtomatik backup operaciyalıq maǵlıwmatlardı qorǵawǵa járdem beredi.', badge: 'Backup' },
      { title: 'Audit jurnalı', desc: 'Áhmiyetli paydalanıwshı háreketleri baqlaw ushın jazıladı.', badge: 'Audit' },
      { title: 'Rolge baylanıslı kiriw', desc: 'Hár bir rol tek ózine kerekli betler hám maǵlıwmatlardı aladı.', badge: 'RBAC' },
      { title: 'Firebase hám Google Cloud', desc: 'Platforma basqarılatuǵın cloud infrastrukturasına súyenedi.', badge: 'Cloud' },
      { title: 'Jaǵday monitoringi', desc: 'Health endpointler hám QA tekseriwler mashqalalardı iske túsiriwden aldın kórsetedi.', badge: 'Ops' },
    ],
    comparison: [
      { before: 'Licenziya hám sertifikat múddetleri qol menen baqlanadı', after: 'Compliance Center múddet, qáwip hám kerekli háreketlerdi kórsetedi' },
      { before: 'Hújjetler, shaǵımlar hám jollanbalar bólek papkalarda', after: 'Cases hám Document Center olardı anıq jumıs aǵımına aylandıradı' },
      { before: 'Admin, shıpaker hám pacient birdey awır sistemanı kóredi', after: 'Hár bir rol óz dashboardı, navigaciyası hám wazıypaların aladı' },
      { before: 'Tekseriwge tayarlıq yad hám qol checklistke baylanıslı', after: 'AI hám checklistler klinika tayarlıǵın aldınan kórsetedi' },
      { before: 'Klinika basshısı kúnlik operaciyanı tolıq kórmeydi', after: 'Dashboard qabıl, resurs, xızmetker hám compliance qáwipin kórsetedi' },
      { before: 'Komanda esabat hám juwaplardı qol menen tayarlaydı', after: 'AI hújjet, juwmaq hám juwap qaralamaların tezletedi' },
    ],
    plans: [
      {
        name: 'Starter',
        desc: 'Hújjet hám múddet baqlawdan baslaytuǵın kishi klinika ushın.',
        features: ['1 klinika jumıs maydanı', 'AI keńesshi ayına 100 sorawǵa shekem', 'Document Center', 'Compliance múddetleri', 'Requests moduli', 'Email qollap-quwatlaw'],
      },
      {
        name: 'Professional',
        desc: 'Tolıq operaciyalıq sistema kerek bolǵan ósip atırǵan klinika ushın.',
        features: ['Barlıq roller hám jumıs maydanları', 'Sheksiz AI keńesshi', 'ERP, xızmetkerler, resurslar hám smenalar', 'Compliance Center hám Inspection', 'Cases, xabarlar hám shıpaker portalı', 'Ústin qollap-quwatlaw'],
      },
      {
        name: 'Enterprise',
        desc: 'Klinika tarmaqları yaki associaciyalar ushın.',
        features: ['Sheksiz klinika hám paydalanıwshı', 'Keńeytilgen rol sazlamaları', 'API hám integraciyalar', 'SLA hám bólek orta', 'Jeke menedjer', 'Komandanı oqıtıw'],
      },
    ],
  },
};

function getMarketingCopy(lang: Language) {
  return LANDING_MARKETING_COPY[lang] ?? LANDING_MARKETING_COPY.ru;
}

function SplineViewer({ src }: { src: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 600);
    return () => clearTimeout(t);
  }, []);
  if (!mounted) return null;
  return (
    <iframe
      src={src}
      frameBorder="0"
      width="100%"
      height="100%"
      style={{ border: 'none', background: 'transparent', display: 'block' }}
      allow="autoplay"
      title="3D Animation"
    />
  );
}

// ─── Testimonials data (multilingual, stored in component) ────────────────────
const TESTIMONIALS = [
  { name: 'Dr. Azimova Nilufar', role: 'Tibbiyot markazi direktori, Toshkent', avatar: 'A', color: 'from-cyan-500 to-blue-500', rating: 5, lang: 'UZ', quote: "AI Maslahatchi xususiyati hayotimizni o'zgartirdi. SanQvaN talablari bo'yicha savol tug'ilsa, 30 soniyada javob olamiz. Anti-tekshiruv modulida tekshiruvdan muammosiz o'tdik." },
  { name: 'Иванов Константин', role: 'Главный врач, Ташкент', avatar: 'И', color: 'from-violet-500 to-purple-500', rating: 5, lang: 'RU', quote: "Модуль Anti-Inspection помог нам пройти плановую проверку без единого замечания. Все чеклисты заполнены, документация в порядке. Рекомендую коллегам." },
  { name: 'Dr. Sarah Mitchell', role: 'International Healthcare Consultant, Tashkent', avatar: 'S', color: 'from-teal-500 to-green-500', rating: 5, lang: 'EN', quote: "Impressive platform. The AI compliance module and inspection checklists are genuinely useful for Uzbekistan's regulatory environment. Highly recommend for any clinic." },
  { name: 'Раҳимов Баҳодир', role: 'Кардиология маркази директори, Тошкент', avatar: 'Р', color: 'from-red-500 to-rose-500', rating: 5, lang: 'ЎЗ', quote: "Муддат назорати модули туфайли лицензия янгиланишини эсдан чиқармадик. Тизим ўзи эслатма юборади ва ҳужжатни автоматик тайёрлайди. Жуда фойдали." },
  { name: 'Toshmatov Bekzod', role: 'Stomatologiya klinikasi egasi, Samarqand', avatar: 'T', color: 'from-emerald-500 to-teal-500', rating: 5, lang: 'UZ', quote: "Hujjat boshqaruvi modulida mehnat shartnomalari va buyruqlarni avval 2 soat yozardim. Endi 5 daqiqa. AI qolgan narsalarni to'ldiradi. Ajoyib tizim!" },
  { name: 'Петрова Ольга', role: 'Медицинский директор, Дерматология+, Ташкент', avatar: 'П', color: 'from-amber-500 to-orange-500', rating: 5, lang: 'RU', quote: "AI-советник отвечает на вопросы по СанПиН на трёх языках. Это значительно упростило работу юридического отдела. Экономим 30+ часов ежемесячно." },
  { name: 'James Thornton', role: 'Medical Operations Manager, Tashkent', avatar: 'J', color: 'from-sky-500 to-cyan-500', rating: 5, lang: 'EN', quote: "The ERP module handles everything from patient visits to cleaning logs. The analytics dashboard gives real insight into clinic performance. Excellent product." },
  { name: 'Мирзаева Дилноза', role: 'Педиатрия кликаси, Самарқанд', avatar: 'М', color: 'from-lime-500 to-green-500', rating: 5, lang: 'ЎЗ', quote: "Беморлар билан мурожаатлар бошқаруви жуда осонлашди. Шикоятлар тизим орқали қабул қилиниб, AI дарҳол тавсия беради. Ишимиз 3 баробар тезлашди." },
  { name: 'Yusupova Mohira', role: 'Ona va bola klinikasi, Farg\'ona', avatar: 'Y', color: 'from-rose-500 to-pink-500', rating: 5, lang: 'UZ', quote: "ERP tizimi orqali barcha bemor tashriflarini raqamli yuritamiz. Retsept, tashxis, protseduralar — hammasi bir joyda. Juda qulay va ishonchli platforma." },
  { name: 'Смирнов Алексей', role: 'Управляющий сетью клиник', avatar: 'С', color: 'from-indigo-500 to-blue-500', rating: 5, lang: 'RU', quote: "Управляю 5 клиниками с одной панели. Дедлайны, лицензии, жалобы — всё отслеживается автоматически. Сэкономили более 40 часов в месяц на административной работе." },
  { name: 'Dr. Emily Chen', role: 'Telemedicine Specialist, Tashkent International', avatar: 'E', color: 'from-fuchsia-500 to-pink-500', rating: 5, lang: 'EN', quote: "The telemedicine module works seamlessly. Patients connect via video, records update automatically. The AI document drafting for referrals is a huge time-saver." },
  { name: 'Дәуітов Болат', role: 'Nókis qalalıq awruwxana basshısı', avatar: 'Д', color: 'from-orange-500 to-amber-500', rating: 5, lang: 'QQ', quote: "Platforma qaraqalpaq tilinde jumıs isleydi. Hújjet dúziw hám tekseriúge tayarlıq boyınsha barlıq múmkinshilikleri bar. Júdá qolaylı sistema." },
  { name: 'Dr. Qodirov Mansur', role: 'Klinika bosh shifokori, Namangan', avatar: 'K', color: 'from-purple-500 to-violet-500', rating: 5, lang: 'UZ', quote: "Anti-tekshiruv simulyatsiyasi juda foydali. Har bir checklists bo'yicha tayyorgarligimizni tekshirib, kamchiliklarni oldindan bartaraf etdik. Tekshiruvdan a'lo o'tdik." },
  { name: 'Назарова Феруза', role: 'Тиббиёт мажмуаси директори, Андижон', avatar: 'Н', color: 'from-blue-500 to-indigo-500', rating: 5, lang: 'ЎЗ', quote: "ЭРП тизими иш юритишни бутунлай ўзгартирди. Беморлардан тортиб тозалаш журналигача бари рақамли. Бир ой ичида ўзини оқлади." },
  { name: 'Айтмуратова Гүлнара', role: 'Ana hám bala salamatlıǵı orayı, Nókis', avatar: 'А', color: 'from-cyan-500 to-teal-500', rating: 5, lang: 'QQ', quote: "AI Keńesshi bizin barlıq nızamıy sawwawlarımızǵa jawap beredi. Tekseriúlerge tayarlıq waqtımız 3 ese qısqardı. Usınıw etemen." },
];

// ─── FAQ data (multilingual, stored in component) ─────────────────────────────
type FaqItem = { q: string; a: string };
type FaqData = Record<string, Record<string, FaqItem[]>>;

const FAQ_DATA: FaqData = {
  uz: {
    general: [
      { q: "Platforma o'zbek tilida ishlaydi?", a: "Ha, platforma 5 tilda ishlaydi: O'zbek (lotin), O'zbek (kiril), Rus, Ingliz va Qoraqalpoq. AI Maslahatchi ham barcha tillarda javob beradi." },
      { q: "Kimlar foydalana oladi?", a: "Admin, klinika rahbari, shifokor va bemorlar. Har biri uchun alohida panel, alohida ruxsatnomalar mavjud." },
      { q: "Yangi xususiyatlar qachon qo'shiladi?", a: "Har oyda yangilanishlar chiqariladi. Professional va Enterprise mijozlar yangi xususiyatlarni birinchilar sifatida oladilar." },
    ],
    technical: [
      { q: "Qaysi qurilmalarda ishlaydi?", a: "Barcha zamonaviy brauzerlar (Chrome, Firefox, Safari, Edge). Planshет va telefonda ham ishlaydi." },
      { q: "Internet bo'lmasa ishlaydi?", a: "Asosiy ma'lumotlar kesh saqlanadi, lekin to'liq funksionallik uchun internet ulanishi talab etiladi." },
      { q: "Ma'lumotlarni import qilish mumkinmi?", a: "Ha, CSV va Excel formatida mavjud ma'lumotlarni import qilish imkoniyati mavjud." },
    ],
    pricing: [
      { q: "Sinov muddati qancha?", a: "Har qanday rejada 14 kunlik bepul sinov davri mavjud. To'lov ma'lumotlari talab qilinmaydi." },
      { q: "To'lov usullari qanday?", a: "Karta, bank o'tkazmasi va korporativ hisob-faktura orqali to'lov qabul qilinadi." },
      { q: "Bekor qilish mumkinmi?", a: "Ha, istalgan vaqtda obunani bekor qilish mumkin. Qolgan muddat uchun to'lov qaytariladi." },
    ],
    security: [
      { q: "Ma'lumotlarim xavfsizmi?", a: "Barcha ma'lumotlar Google Cloud Platform va Firebase infratuzilmasida AES-256 bilan shifrlangan holda saqlanadi." },
      { q: "Zaxira nusxalar olinadimi?", a: "Ha, har kuni avtomatik zaxira nusxalar olinadi va 30 kun davomida saqlanadi." },
      { q: "Kim mening ma'lumotlarimni ko'ra oladi?", a: "Faqat siz va belgilagan xodimlaringiz. Texnik xodimlar ham maxfiylik qasamyodi ostida ishlaydi." },
    ],
    ai: [
      { q: "AI Maslahatchi qanday ishlaydi?", a: "Google Gemini 2.0 Flash modeli O'zbekiston tibbiy-huquqiy bazasi asosida ishlaydi: SanQvaN, SSV buyruqlari, UzMSt standartlari." },
      { q: "AI javoblari to'g'rimi?", a: "AI javoblari tavsiya xaracterida. Muhim yuridik va tibbiy qarorlarda mutaxassis bilan maslahat qilish tavsiya etiladi." },
      { q: "AI qanday hujjat tuza oladi?", a: "8 ta hujjat shabloni mavjud: mehnat shartnomasi, buyruq, bayonnoma, yo'llanma va boshqalar. AI maydonlarni avtomatik to'ldiradi." },
    ],
    support: [
      { q: "Texnik yordam qanday?", a: "Starter rejada email orqali. Professional rejada ustuvor yordam. Enterprise rejada shaxsiy menejer va 24/7 yordam." },
      { q: "O'quv materiallari bormi?", a: "Ha, video darslar, foydalanuvchi qo'llanmasi va keng FAQ bazasi mavjud." },
      { q: "Onsite o'qitish bormi?", a: "Enterprise rejasida xodimlarni o'qitish uchun onsite treninglar tashkil qilinadi." },
    ],
  },
  ru: {
    general: [
      { q: "На каких языках работает платформа?", a: "Платформа работает на 5 языках: узбекском (латиница), узбекском (кириллица), русском, английском и каракалпакском." },
      { q: "Кто может пользоваться платформой?", a: "Администраторы, руководители клиник, врачи и пациенты — каждый со своей панелью и правами доступа." },
      { q: "Когда появляются новые функции?", a: "Обновления выходят ежемесячно. Клиенты Professional и Enterprise получают новые функции первыми." },
    ],
    technical: [
      { q: "На каких устройствах работает?", a: "Все современные браузеры (Chrome, Firefox, Safari, Edge). Полностью адаптировано для планшетов и смартфонов." },
      { q: "Работает без интернета?", a: "Основные данные кешируются, но полная функциональность требует подключения к интернету." },
      { q: "Можно ли импортировать данные?", a: "Да, поддерживается импорт существующих данных в форматах CSV и Excel." },
    ],
    pricing: [
      { q: "Сколько длится пробный период?", a: "14 дней бесплатно для любого тарифа. Карта не нужна." },
      { q: "Как оплатить?", a: "Принимаем оплату картой, банковским переводом и корпоративным счётом." },
      { q: "Можно отменить подписку?", a: "Да, в любой момент. Остаток за неиспользованный период возвращается." },
    ],
    security: [
      { q: "Данные в безопасности?", a: "Все данные хранятся в инфраструктуре GCP/Firebase и шифруются по стандарту AES-256." },
      { q: "Делаются резервные копии?", a: "Да, автоматически каждый день. Хранятся 30 дней." },
      { q: "Кто видит мои данные?", a: "Только вы и назначенные сотрудники. Технический персонал работает под соглашением о конфиденциальности." },
    ],
    ai: [
      { q: "Как работает AI-советник?", a: "Модель Gemini 2.0 Flash обучена на узбекской медико-правовой базе: СанПиН, приказы МЗ, стандарты UzMSt." },
      { q: "Насколько точны ответы AI?", a: "Ответы носят рекомендательный характер. Для юридических и медицинских решений советуем привлекать специалиста." },
      { q: "Какие документы может создать AI?", a: "8 шаблонов: трудовой договор, приказы, протоколы, направления и др. AI заполняет поля автоматически." },
    ],
    support: [
      { q: "Как получить техническую поддержку?", a: "Starter — email. Professional — приоритетная поддержка. Enterprise — персональный менеджер + 24/7." },
      { q: "Есть ли обучающие материалы?", a: "Да: видеоуроки, руководство пользователя и обширная база FAQ." },
      { q: "Есть ли очное обучение?", a: "Для Enterprise организуем onsite-тренинги для сотрудников." },
    ],
  },
  en: {
    general: [
      { q: "What languages does the platform support?", a: "The platform works in 5 languages: Uzbek (Latin), Uzbek (Cyrillic), Russian, English, and Karakalpak." },
      { q: "Who can use the platform?", a: "Admins, clinic managers, doctors and patients — each with their own dashboard and permissions." },
      { q: "How often are new features added?", a: "Updates are released monthly. Professional and Enterprise clients get new features first." },
    ],
    technical: [
      { q: "What devices are supported?", a: "All modern browsers (Chrome, Firefox, Safari, Edge). Fully responsive for tablets and smartphones." },
      { q: "Does it work offline?", a: "Core data is cached, but full functionality requires an internet connection." },
      { q: "Can I import existing data?", a: "Yes, import of existing data in CSV and Excel formats is supported." },
    ],
    pricing: [
      { q: "How long is the free trial?", a: "14 days free for any plan. No credit card required." },
      { q: "How can I pay?", a: "We accept card payments, bank transfers, and corporate invoicing." },
      { q: "Can I cancel my subscription?", a: "Yes, at any time. Unused period is refunded." },
    ],
    security: [
      { q: "Is my data secure?", a: "All data is stored in GCP/Firebase infrastructure and encrypted using AES-256." },
      { q: "Are backups made?", a: "Yes, automatically every day. Stored for 30 days." },
      { q: "Who can see my data?", a: "Only you and designated staff. Technical personnel work under confidentiality agreements." },
    ],
    ai: [
      { q: "How does the AI advisor work?", a: "Gemini 2.0 Flash is trained on Uzbekistan's medical-legal knowledge base: SanQvaN, MoH orders, UzMSt standards." },
      { q: "How accurate are AI answers?", a: "Answers are advisory in nature. For legal and medical decisions, we recommend consulting a specialist." },
      { q: "What documents can AI draft?", a: "8 templates: employment contracts, orders, protocols, referrals and more. AI fills fields automatically." },
    ],
    support: [
      { q: "How do I get technical support?", a: "Starter — email. Professional — priority support. Enterprise — dedicated manager + 24/7." },
      { q: "Are there training materials?", a: "Yes: video tutorials, user guide, and an extensive FAQ database." },
      { q: "Is there onsite training?", a: "Enterprise plan includes onsite staff training sessions." },
    ],
  },
};

// Fallback to 'uz' for kk and uz_cyrillic
const getFaqData = (language: string): Record<string, FaqItem[]> => {
  return FAQ_DATA[language] ?? FAQ_DATA['uz'];
};

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const loggedIn = !loading && !!user;

  const navLinks: [string, string][] = [
    [t.landing.features.title, '#features'],
    [t.landing.pricing.sectionLabel, '#pricing'],
    [t.landing.faq.sectionLabel, '#faq'],
    [t.landing.footer.contact, '#contact'],
  ];

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-100' : 'bg-white/80 backdrop-blur-sm'}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="SMA Logo" width={32} height={32} className="rounded-md" />
            <span className="font-bold text-slate-900 text-lg">Smart Medical</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(([label, href]) => (
              <a key={href} href={href} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">{label}</a>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher variant="compact" direction="down" />
            {loggedIn ? (
              <Link href="/dashboard" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors flex items-center gap-2">
                {t.landing.goToDashboard}<ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">{t.nav.login}</Link>
                <Link href="/register" className="rounded-lg bg-gradient-to-r from-cyan-600 to-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-all shadow-sm">{t.landing.getStarted}</Link>
              </>
            )}
          </div>
          <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden bg-white border-b shadow-lg px-4 pb-4 space-y-3">
          {navLinks.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)} className="block text-sm font-medium text-slate-700 py-1">{label}</a>
          ))}
          <div className="flex gap-2 pt-2"><LanguageSwitcher variant="compact" direction="down" /></div>
          <div className="flex gap-3 pt-1">
            {loggedIn ? (
              <Link href="/dashboard" className="flex-1 text-center bg-slate-900 text-white rounded-lg py-2 text-sm font-medium">{t.landing.goToDashboard}</Link>
            ) : (
              <>
                <Link href="/login" className="flex-1 text-center border rounded-lg py-2 text-sm font-medium">{t.nav.login}</Link>
                <Link href="/register" className="flex-1 text-center bg-slate-900 text-white rounded-lg py-2 text-sm font-medium">{t.landing.getStarted}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

// ─── Hero — dark split layout, cyber mannequin right, text left ──────────────
function Hero() {
  const { t } = useLanguage();
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#07111f] pt-16">

      {/* Full-background Spline — fills the entire canvas */}
      <div className="absolute inset-0 z-0">
        <ErrorBoundary fallback={<div className="absolute inset-0 bg-[#07111f]" />}>
          <SplineViewer src="https://my.spline.design/cybermannequin-3be7LYzIdWSh5iPgvK7ogact/" />
        </ErrorBoundary>

        {/* Very subtle left-side veil — only enough to keep text readable */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to right, rgba(7,17,31,0.60) 0%, rgba(7,17,31,0.35) 35%, rgba(7,17,31,0.08) 60%, transparent 100%)',
          }}
        />

        {/* Thin bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-20 pointer-events-none bg-gradient-to-t from-[#07111f] to-transparent" />

        {/* Hide "Built with Spline" badge */}
        <div
          className="absolute bottom-0 right-0 h-12 w-48 z-20 pointer-events-none"
          style={{ background: 'linear-gradient(to left, rgba(7,17,31,0.95) 0%, transparent 100%)' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-lg lg:max-w-xl">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 backdrop-blur-md px-3 sm:px-4 py-1.5 mb-6 sm:mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-semibold text-cyan-300">{t.landing.badge}</span>
          </div>

          {/* Headline — with subtle text shadow so it pops over the animation */}
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-tight mb-5 sm:mb-6"
            style={{ textShadow: '0 2px 24px rgba(0,0,0,0.55)' }}
          >
            {t.landing.heroTitle}{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              {t.landing.heroTitleHighlight}
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-md mb-8 sm:mb-10"
            style={{ textShadow: '0 1px 12px rgba(0,0,0,0.6)' }}
          >
            {t.landing.heroSubtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-10 sm:mb-14">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-7 py-3.5 text-sm sm:text-base font-bold text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/60 hover:-translate-y-0.5 transition-all duration-200"
            >
              {t.landing.getStarted}<ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 backdrop-blur-md px-7 py-3.5 text-sm sm:text-base font-semibold text-white hover:bg-white/20 hover:border-white/40 transition-all duration-200"
            >
              {t.landing.watchDemo}
            </a>
          </div>

          {/* Social proof */}
          <div className="inline-flex items-center gap-3 border border-white/15 bg-black/25 backdrop-blur-md rounded-xl px-4 py-3">
            <div className="flex -space-x-2 shrink-0">
              {['A','B','K','S','M'].map((l) => (
                <div key={l} className="h-8 w-8 rounded-full border-2 border-[#07111f] bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shadow">
                  {l}
                </div>
              ))}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-0.5 mb-0.5">
                {[1,2,3,4,5].map((i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-xs text-slate-200 font-medium">{t.landing.socialProof}</p>
            </div>
          </div>

        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-400 z-10">
        <span className="text-xs font-medium uppercase tracking-widest">{t.landing.scrollHint}</span>
        <ChevronDown className="h-5 w-5 animate-bounce text-cyan-400" />
      </div>
    </section>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function Stats() {
  const { t } = useLanguage();
  const stats = [
    { value: '500+', label: t.landing.stats.clinics, icon: <Building2 className="h-5 w-5" /> },
    { value: '12,000+', label: t.landing.stats.documents, icon: <FileText className="h-5 w-5" /> },
    { value: '98%', label: t.landing.stats.satisfaction, icon: <TrendingUp className="h-5 w-5" /> },
    { value: '24/7', label: t.landing.stats.ai, icon: <Bot className="h-5 w-5" /> },
  ];
  return (
    <section className="border-y border-slate-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.label} className={`flex flex-col items-center py-10 px-6 ${i < stats.length - 1 ? 'border-r border-slate-100' : ''}`}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-600 to-emerald-600 text-white shadow-sm">{s.icon}</div>
              <p className="text-3xl font-extrabold text-slate-900">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500 text-center">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
function Features() {
  const { t, lang } = useLanguage();
  const icons = [
    <Database key="operations" className="h-6 w-6" />,
    <ShieldCheck key="compliance" className="h-6 w-6" />,
    <FileText key="documents" className="h-6 w-6" />,
    <MessageSquare key="cases" className="h-6 w-6" />,
    <Stethoscope key="doctor" className="h-6 w-6" />,
    <Users key="patient" className="h-6 w-6" />,
    <Bot key="ai" className="h-6 w-6" />,
    <Globe key="language" className="h-6 w-6" />,
    <Lock key="roles" className="h-6 w-6" />,
  ];
  const colors = ['bg-cyan-600', 'bg-rose-600', 'bg-teal-600', 'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-indigo-600', 'bg-amber-600', 'bg-slate-800'];
  const features = getMarketingCopy(lang).features.map((feature, index) => ({
    ...feature,
    icon: icons[index],
    color: colors[index],
  }));
  return (
    <section id="features" className="py-14 sm:py-24 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-16">
          <p className="text-sm font-semibold text-cyan-600 uppercase tracking-wider mb-3">{t.landing.features.sectionLabel}</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">{t.landing.features.sectionTitle}</h2>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">{t.landing.features.sectionDesc}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="group rounded-2xl bg-white p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className={`rounded-xl ${f.color} p-3 text-white shadow-sm`}>{f.icon}</div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">{f.badge}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const { t } = useLanguage();
  const steps = [
    { step: '01', title: t.landing.howItWorks.step1Title, desc: t.landing.howItWorks.step1Desc },
    { step: '02', title: t.landing.howItWorks.step2Title, desc: t.landing.howItWorks.step2Desc },
    { step: '03', title: t.landing.howItWorks.step3Title, desc: t.landing.howItWorks.step3Desc },
  ];
  const trusts = [
    { icon: <Lock className="h-5 w-5" />, title: t.landing.howItWorks.trust1Title, desc: t.landing.howItWorks.trust1Desc },
    { icon: <Globe className="h-5 w-5" />, title: t.landing.howItWorks.trust2Title, desc: t.landing.howItWorks.trust2Desc },
    { icon: <Users className="h-5 w-5" />, title: t.landing.howItWorks.trust3Title, desc: t.landing.howItWorks.trust3Desc },
  ];
  return (
    <section id="how-it-works" className="py-14 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-16">
          <p className="text-sm font-semibold text-cyan-600 uppercase tracking-wider mb-3">{t.landing.howItWorks.sectionLabel}</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">{t.landing.howItWorks.title}</h2>
        </div>
        <div className="relative">
          <div className="absolute top-12 left-1/2 -translate-x-1/2 hidden lg:block w-2/3 h-0.5 bg-gradient-to-r from-cyan-200 via-emerald-200 to-slate-200" />
          <div className="grid lg:grid-cols-3 gap-10 relative">
            {steps.map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-cyan-600 to-emerald-600 shadow-xl mb-6">
                  <span className="text-2xl font-extrabold text-white">{s.step}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{s.title}</h3>
                <p className="text-slate-500 leading-relaxed max-w-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-20 grid sm:grid-cols-3 gap-6">
          {trusts.map((b) => (
            <div key={b.title} className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">{b.icon}</div>
              <div>
                <p className="font-semibold text-slate-900">{b.title}</p>
                <p className="text-sm text-slate-500 mt-1">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Security Section (NEW) ────────────────────────────────────────────────────
function SecuritySection() {
  const { t, lang } = useLanguage();
  const icons = [
    <Shield key="encryption" className="h-6 w-6 text-cyan-600" />,
    <RefreshCw key="backup" className="h-6 w-6 text-emerald-600" />,
    <ClipboardCheck key="audit" className="h-6 w-6 text-blue-600" />,
    <Eye key="roles" className="h-6 w-6 text-violet-600" />,
    { icon: <Server className="h-6 w-6 text-rose-600" />, title: 'GCP Infratuzilma', desc: 'Google Cloud — dunyo miqyosida 99.99% uptime kafolati' },
    { icon: <Lock className="h-6 w-6 text-amber-600" />, title: '24/7 Monitoring', desc: 'Real-vaqtda tizim holati nazorati va ogohlantirish' },
  ];
  const features = getMarketingCopy(lang).securityFeatures.map((feature, index) => {
    const iconCandidate = icons[index] as { icon?: ReactNode } | ReactNode;
    let icon: ReactNode = iconCandidate as ReactNode;
    if (typeof iconCandidate === 'object' && iconCandidate !== null && 'icon' in iconCandidate) {
      icon = (iconCandidate as { icon?: ReactNode }).icon;
    }
    return {
      ...feature,
      icon,
    };
  });

  return (
    <section className="py-14 sm:py-24 bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-16">
          <p className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">{t.landing.security.sectionLabel}</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">{t.landing.security.title}</h2>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">{t.landing.security.subtitle}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 hover:border-slate-600 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-slate-700/50">{f.icon}</div>
                <h3 className="font-bold text-white">{f.title}</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
          {['Firebase Certified', 'GCP Compliant', 'SSL/TLS', 'GDPR Ready', 'ISO 27001'].map((b) => (
            <div key={b} className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-4 py-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-slate-300">{b}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials Carousel (15 reviews) ──────────────────────────────────────
function Testimonials() {
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = TESTIMONIALS.length;

  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);

  useEffect(() => {
    if (isPaused) return;
    intervalRef.current = setInterval(next, 4500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPaused, next]);

  const visible = [
    TESTIMONIALS[(current + total - 1) % total],
    TESTIMONIALS[current],
    TESTIMONIALS[(current + 1) % total],
  ];

  return (
    <section className="py-14 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-16">
          <p className="text-sm font-semibold text-cyan-600 uppercase tracking-wider mb-3">{t.landing.testimonials.sectionLabel}</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">{t.landing.testimonials.title}</h2>
          <p className="mt-3 text-slate-500">{t.landing.testimonials.subtitle}</p>
        </div>

        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 overflow-hidden">
            {visible.map((testimonial, idx) => (
              <div
                key={`${testimonial.name}-${idx}`}
                className={`rounded-2xl border p-6 transition-all duration-500 ${idx === 1 ? 'border-cyan-200 bg-gradient-to-br from-cyan-50 to-white shadow-md scale-[1.02]' : 'border-slate-100 bg-white shadow-sm'}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex">
                    {Array.from({ length: testimonial.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500">{testimonial.lang}</span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm`}>{testimonial.avatar}</div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{testimonial.name}</p>
                    <p className="text-xs text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 mt-10">
            <button onClick={prev} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors shadow-sm" aria-label={t.landing.testimonials.prev}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)} className={`rounded-full transition-all duration-300 ${i === current ? 'bg-cyan-600 w-6 h-2' : 'bg-slate-200 w-2 h-2 hover:bg-slate-300'}`} />
              ))}
            </div>
            <button onClick={next} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors shadow-sm" aria-label={t.landing.testimonials.next}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-3">{current + 1} / {total} {t.landing.testimonials.review}</p>
        </div>
      </div>
    </section>
  );
}

// ─── Comparison Section (NEW) ──────────────────────────────────────────────────
function Comparison() {
  const { t, lang } = useLanguage();
  const items = getMarketingCopy(lang).comparison;
  /*
  const oldItems = [
    { before: "Qog'oz hujjatlar — yo'qolish xavfi", after: "Bulut asosida xavfsiz saqlash" },
    { before: "Muddatlarni qo'lda kuzatish", after: "Avtomatik eslatma va nazorat" },
    { before: "Tekshiruvga tayyorgarlik — haftalik ish", after: "Har doim tayyor, real-vaqt AI baholash" },
    { before: "Hujjat tuzish — 2-3 soat", after: "AI yordamida 5 daqiqada" },
    { before: "Bemor ma'lumotlari tarqoq", after: "Yagona ERP tizimida barcha ma'lumot" },
    { before: "Hisobotlar Excel-da qo'lda", after: "Bir tugma — avtomatik analitika" },
  ];
  */
  return (
    <section className="py-14 sm:py-24 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-16">
          <p className="text-sm font-semibold text-cyan-600 uppercase tracking-wider mb-3">{t.landing.comparison.sectionLabel}</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">{t.landing.comparison.title}</h2>
          <p className="mt-4 text-lg text-slate-500">{t.landing.comparison.subtitle}</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-8">
          <div className="rounded-2xl border-2 border-red-100 bg-red-50/50 p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-red-100">
              <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="font-bold text-red-800 text-lg">{t.landing.comparison.beforeTitle}</h3>
            </div>
            <ul className="space-y-3">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <X className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-red-700">{item.before}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-emerald-100">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="font-bold text-emerald-800 text-lg">{t.landing.comparison.afterTitle}</h3>
            </div>
            <ul className="space-y-3">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-emerald-700">{item.after}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Pricing (enhanced with monthly/yearly toggle) ────────────────────────────
function Pricing() {
  const { t, lang } = useLanguage();
  const [yearly, setYearly] = useState(false);
  const planCopy = getMarketingCopy(lang).plans;

  const plans = [
    {
      name: planCopy[0].name,
      priceMonthly: '590,000',
      priceYearly: '4,920,000',
      desc: planCopy[0].desc,
      features: planCopy[0].features,
      cta: t.landing.pricing.getStarted, highlighted: false,
    },
    {
      name: planCopy[1].name,
      priceMonthly: '1,290,000',
      priceYearly: '10,750,000',
      desc: planCopy[1].desc,
      features: planCopy[1].features,
      cta: t.landing.pricing.mostPopular, highlighted: true,
    },
    {
      name: planCopy[2].name,
      priceMonthly: t.landing.pricing.contact,
      priceYearly: t.landing.pricing.contact,
      desc: planCopy[2].desc,
      features: planCopy[2].features,
      cta: t.landing.pricing.contact, highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="py-14 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-cyan-600 uppercase tracking-wider mb-3">{t.landing.pricing.sectionLabel}</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">{t.landing.pricing.sectionTitle}</h2>
          <p className="mt-4 text-slate-500">{t.landing.pricing.trialNote}</p>

          {/* Monthly/Yearly toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm font-medium ${!yearly ? 'text-slate-900' : 'text-slate-400'}`}>{t.landing.pricing.billingMonthly}</span>
            <button
              onClick={() => setYearly(!yearly)}
              className={`relative h-7 w-14 rounded-full transition-colors duration-300 ${yearly ? 'bg-cyan-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${yearly ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium ${yearly ? 'text-slate-900' : 'text-slate-400'}`}>{t.landing.pricing.billingYearly}</span>
            {yearly && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">{t.landing.pricing.yearlyDiscount}</span>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {plans.map((p) => (
            <div key={p.name} className={`relative rounded-2xl p-8 transition-all ${p.highlighted ? 'bg-slate-900 shadow-2xl shadow-slate-900/25 ring-2 ring-cyan-500 scale-105' : 'border border-slate-200 bg-white shadow-sm'}`}>
              {p.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-1 text-xs font-bold text-white shadow-lg">{t.landing.pricing.recommended}</span>
                </div>
              )}
              <div className="mb-6">
                <p className={`font-semibold ${p.highlighted ? 'text-cyan-400' : 'text-slate-500'}`}>{p.name}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className={`text-3xl font-extrabold ${p.highlighted ? 'text-white' : 'text-slate-900'}`}>
                    {yearly ? p.priceYearly : p.priceMonthly}
                  </span>
                  {p.name !== 'Enterprise' && (
                    <span className={`text-sm ${p.highlighted ? 'text-slate-400' : 'text-slate-500'}`}>
                      {yearly ? t.landing.pricing.perYear : t.landing.pricing.perMonth} / so&apos;m
                    </span>
                  )}
                </div>
                <p className={`mt-1 text-sm ${p.highlighted ? 'text-slate-400' : 'text-slate-500'}`}>{p.desc}</p>
              </div>
              <ul className="space-y-3 mb-8">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <CheckCircle className={`h-4 w-4 shrink-0 mt-0.5 ${p.highlighted ? 'text-cyan-400' : 'text-emerald-500'}`} />
                    <span className={`text-sm ${p.highlighted ? 'text-slate-300' : 'text-slate-600'}`}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={p.name === 'Enterprise' ? '#contact' : '/register'}
                className={`block w-full rounded-xl py-3 text-center text-sm font-bold transition-all ${p.highlighted ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:opacity-90 shadow-lg shadow-cyan-500/25' : 'border border-slate-200 text-slate-900 hover:bg-slate-50'}`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── ROI Stats Section (NEW) ──────────────────────────────────────────────────
function ROIStats() {
  const { t } = useLanguage();
  const metrics = [
    { value: '45+', label: t.landing.roi.timeSaved, icon: <Clock className="h-7 w-7" />, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { value: '30%', label: t.landing.roi.costReduced, icon: <DollarSign className="h-7 w-7" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { value: '90%', label: t.landing.roi.errorReduced, icon: <AlertTriangle className="h-7 w-7" />, color: 'text-amber-600', bg: 'bg-amber-50' },
    { value: '2×', label: t.landing.roi.satisfaction, icon: <BarChart3 className="h-7 w-7" />, color: 'text-violet-600', bg: 'bg-violet-50' },
  ];
  return (
    <section className="py-14 sm:py-24 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-16">
          <p className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">{t.landing.roi.sectionLabel}</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">{t.landing.roi.title}</h2>
          <p className="mt-4 text-lg text-slate-400 max-w-xl mx-auto">{t.landing.roi.subtitle}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-8 text-center hover:border-slate-600 transition-colors">
              <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl ${m.bg} ${m.color} mb-4 mx-auto`}>{m.icon}</div>
              <p className="text-4xl font-extrabold text-white mb-2">{m.value}</p>
              <p className="text-sm text-slate-400">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Integrations Section (NEW) ───────────────────────────────────────────────
function Integrations() {
  const { t } = useLanguage();
  const techs = [
    { name: 'Google Cloud', icon: '☁️', desc: 'Infrastructure' },
    { name: 'Firebase', icon: '🔥', desc: 'Database & Auth' },
    { name: 'Gemini 2.0', icon: '🤖', desc: 'AI / LLM' },
    { name: 'Vertex AI', icon: '🧠', desc: 'Vector Search' },
    { name: 'Next.js 14', icon: '▲', desc: 'Frontend' },
    { name: 'OpenStreetMap', icon: '🗺️', desc: 'Maps' },
    { name: 'Resend', icon: '📧', desc: 'Email' },
    { name: 'Jitsi Meet', icon: '🎥', desc: 'Video Calls' },
  ];
  return (
    <section className="py-14 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-16">
          <p className="text-sm font-semibold text-cyan-600 uppercase tracking-wider mb-3">{t.landing.integrations.sectionLabel}</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">{t.landing.integrations.title}</h2>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">{t.landing.integrations.subtitle}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {techs.map((tech) => (
            <div key={tech.name} className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-6 hover:border-cyan-200 hover:bg-cyan-50/30 hover:shadow-md transition-all cursor-default">
              <span className="text-4xl">{tech.icon}</span>
              <div className="text-center">
                <p className="font-bold text-slate-900 text-sm">{tech.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{tech.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Partners Section (NEW) ───────────────────────────────────────────────────
function Partners() {
  const { t } = useLanguage();
  const orgs = [
    { name: "O'zbekiston Sog'liqni\nSaqlash Vazirligi", short: 'SSV' },
    { name: "Tibbiyot Tashkilotlari\nAssotsiatsiyasi", short: 'TTA' },
    { name: "O'zbekiston Xususiy\nKlinikalar Ittifoqi", short: 'XKI' },
    { name: "Toshkent Tibbiyot\nAkademiyasi", short: 'TMA' },
    { name: "Respublika Ixtisoslashtirilgan\nTibbiyot Markazi", short: 'RITM' },
    { name: "Milliy Onkologiya\nMarkazi", short: 'MOM' },
  ];
  return (
    <section className="py-20 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-cyan-600 uppercase tracking-wider mb-3">{t.landing.partners.sectionLabel}</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t.landing.partners.title}</h2>
          <p className="mt-3 text-slate-500">{t.landing.partners.subtitle}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {orgs.map((org) => (
            <div key={org.short} className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm mb-3 shadow-sm">{org.short}</div>
              <p className="text-xs text-slate-600 text-center leading-tight whitespace-pre-line">{org.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ (categorized) ────────────────────────────────────────────────────────
function FAQ() {
  const [activeCategory, setActiveCategory] = useState('general');
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const { t, lang } = useLanguage();

  const categoryKeys = ['general', 'technical', 'pricing', 'security', 'ai', 'support'] as const;
  const categoryLabels: Record<string, string> = {
    general: t.landing.faq.categories.general,
    technical: t.landing.faq.categories.technical,
    pricing: t.landing.faq.categories.pricing,
    security: t.landing.faq.categories.security,
    ai: t.landing.faq.categories.ai,
    support: t.landing.faq.categories.support,
  };

  const faqData = getFaqData(lang);
  const items = faqData[activeCategory] ?? [];

  return (
    <section id="faq" className="py-14 sm:py-24 bg-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-cyan-600 uppercase tracking-wider mb-3">{t.landing.faq.sectionLabel}</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">{t.landing.faq.title}</h2>
          <p className="mt-3 text-slate-500">{t.landing.faq.subtitle}</p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categoryKeys.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setOpenIdx(null); }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${activeCategory === cat ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <button
                className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
              >
                <span className="font-semibold text-slate-900 pr-4">{item.q}</span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${openIdx === i ? 'rotate-180' : ''}`} />
              </button>
              {openIdx === i && (
                <div className="px-5 pb-5">
                  <p className="text-slate-600 leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Demo / Trial CTA (NEW) ───────────────────────────────────────────────────
function DemoCTA() {
  const { t } = useLanguage();
  return (
    <section className="py-20 bg-gradient-to-br from-cyan-600 to-emerald-600 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm font-semibold text-cyan-100 uppercase tracking-wider mb-4">{t.landing.demo.sectionLabel}</p>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">{t.landing.demo.title}</h2>
        <p className="text-xl text-cyan-100 mb-8">{t.landing.demo.subtitle}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-cyan-700 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
            {t.landing.demo.tryFree}<ArrowRight className="h-5 w-5" />
          </Link>
          <a href="#contact" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/60 px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-all duration-200">
            {t.landing.demo.requestDemo}
          </a>
        </div>
        <p className="mt-4 text-sm text-cyan-100/80 flex items-center justify-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {t.landing.demo.noCreditCard}
        </p>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTA() {
  const { t } = useLanguage();
  return (
    <section id="contact" className="py-14 sm:py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-1/2 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 shadow-lg shadow-cyan-500/25">
          <Zap className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">{t.landing.cta.ctaTitle}</h2>
        <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">{t.landing.cta.ctaDesc}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 transition-all duration-200">
            {t.landing.cta.button}<ArrowRight className="h-5 w-5" />
          </Link>
          <a href="mailto:info@smartmedical.uz" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 px-8 py-4 text-base font-semibold text-slate-300 hover:border-slate-400 hover:text-white transition-all duration-200">
            {t.landing.cta.contactEmail}
          </a>
        </div>
        <p className="mt-6 text-sm text-slate-500">info@smartmedical.uz{' '}|{' '}+998 71 200 00 00</p>
      </div>
    </section>
  );
}

// ─── Footer (production-level, client branding) ───────────────────────────────
function Footer() {
  const { t } = useLanguage();

  const platformLinks = [
    [t.nav.aiAdvisor, '#features'],
    [t.nav.documents, '#features'],
    [t.nav.erp, '#features'],
    [t.nav.inspection, '#features'],
    ['Telemeditsina', '#features'],
    ['E-Retsept', '#features'],
  ];
  const legalLinks = [
    [t.landing.footer.terms, '#'],
    [t.landing.footer.privacy, '#'],
    [t.landing.footer.cookies, '#'],
  ];
  const companyLinks = [
    [t.landing.footer.about, '#'],
    [t.landing.footer.pricing, '#pricing'],
    [t.landing.footer.news, '#'],
    [t.landing.footer.contact, '#contact'],
  ];

  return (
    <footer className="bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Image src="/logo.png" alt="SMA Logo" width={36} height={36} className="rounded-md shadow-sm bg-white p-0.5" />
              <span className="font-bold text-white text-lg">Smart Medical</span>
            </div>
            <p className="text-sm leading-relaxed mb-5">{t.landing.footer.tagline}</p>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.landing.footer.association}</p>
              <p className="text-xs text-slate-500">{t.landing.footer.director}</p>
            </div>
            <div className="mt-5 space-y-2 text-sm">
              <a href="tel:+998712000000" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <Phone className="h-4 w-4 shrink-0" />{t.landing.footer.phone}
              </a>
              <a href="mailto:info@smartmedical.uz" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <Mail className="h-4 w-4 shrink-0" />{t.landing.footer.email}
              </a>
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="h-4 w-4 shrink-0" />{t.landing.footer.address}
              </div>
            </div>
          </div>

          {/* Platform links */}
          <div>
            <p className="font-semibold text-white mb-4">{t.landing.footer.platform}</p>
            <ul className="space-y-2.5 text-sm">
              {platformLinks.map(([label, href]) => (
                <li key={label}><a href={href} className="hover:text-white transition-colors">{label}</a></li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <p className="font-semibold text-white mb-4">{t.landing.footer.company}</p>
            <ul className="space-y-2.5 text-sm">
              {companyLinks.map(([label, href]) => (
                <li key={label}><a href={href} className="hover:text-white transition-colors">{label}</a></li>
              ))}
            </ul>
            <div className="mt-6">
              <p className="text-xs text-slate-500 mb-1.5">{t.landing.footer.workHours}</p>
              <p className="text-xs text-slate-500">{t.landing.footer.techPlatform}</p>
            </div>
          </div>

          {/* Legal + security */}
          <div>
            <p className="font-semibold text-white mb-4">{t.landing.footer.legal}</p>
            <ul className="space-y-2.5 text-sm mb-6">
              {legalLinks.map(([label, href]) => (
                <li key={label}><a href={href} className="hover:text-white transition-colors">{label}</a></li>
              ))}
            </ul>
            <p className="text-xs font-medium text-slate-500 mb-3">{t.landing.footer.security}</p>
            <div className="flex gap-2 flex-wrap">
              {['Firebase', 'GCP', 'SSL', 'AES-256'].map((b) => (
                <span key={b} className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-500 font-medium">{b}</span>
              ))}
            </div>
            <div className="mt-6">
              <p className="text-xs font-medium text-slate-500 mb-3">{t.landing.footer.followUs}</p>
              <div className="flex gap-3">
                {['Telegram', 'Instagram', 'LinkedIn'].map((s) => (
                  <a key={s} href="#" className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-500 hover:text-white hover:border-slate-500 transition-colors">{s}</a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-600">&copy; 2026 {t.landing.footer.association}. {t.landing.footer.rights}</p>
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-slate-700" />
            <p className="text-xs text-slate-600">{t.landing.footer.techPlatform} — Next.js 14 + Firebase + Gemini AI</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Root page ────────────────────────────────────────────────────────────────
export default function RootPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <SecuritySection />
      <Testimonials />
      <Comparison />
      <Pricing />
      <ROIStats />
      <Integrations />
      <Partners />
      <FAQ />
      <DemoCTA />
      <CTA />
      <Footer />
    </main>
  );
}
