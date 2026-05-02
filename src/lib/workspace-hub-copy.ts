import type { Language } from '@/contexts/LanguageContext';

export type WorkspaceHubId =
  | 'schedule'
  | 'clinicOperations'
  | 'complianceCenter'
  | 'documentCenter'
  | 'cases'
  | 'knowledgeBase';

type WorkspaceCopy = {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  metrics: Array<{ label: string; value: string; detail: string }>;
  workflowTitle: string;
  workflow: string[];
  relatedTitle: string;
  quickTitle: string;
};

type WorkspaceCopyBundle = {
  common: {
    overview: string;
    workflow: string;
    connected: string;
    open: string;
    startHere: string;
    related: string;
  };
  hubs: Record<WorkspaceHubId, WorkspaceCopy>;
};

export const WORKSPACE_HUB_COPY: Record<Language, WorkspaceCopyBundle> = {
  ru: {
    common: {
      overview: 'Обзор',
      workflow: 'Рабочий процесс',
      connected: 'Связанные разделы',
      open: 'Открыть',
      startHere: 'Начать здесь',
      related: 'Связанные рабочие области',
    },
    hubs: {
      schedule: {
        eyebrow: 'Рабочая область',
        title: 'Расписание',
        description: 'Единый центр расписания клиники: приемы, календарное планирование и смены персонала без перегрузки меню.',
        highlights: ['Сегодняшние приемы', 'Календарь клиники', 'Смены персонала'],
        metrics: [
          { label: 'Фокус', value: '3', detail: 'ключевых раздела' },
          { label: 'Роль клиники', value: 'операции', detail: 'день, неделя, смены' },
          { label: 'Роль врача', value: 'приемы', detail: 'личная загрузка' },
        ],
        workflowTitle: 'Как использовать',
        workflow: ['Проверьте приемы на сегодня.', 'Сверьте календарь клиники и события.', 'Закройте смены и покрытие персонала.'],
        relatedTitle: 'Что рядом',
        quickTitle: 'Быстрые действия',
      },
      clinicOperations: {
        eyebrow: 'Рабочая область',
        title: 'Операции клиники',
        description: 'Операционный центр клиники: ERP, персонал, склад, оборудование и финансы собраны в один понятный контур.',
        highlights: ['ERP и визиты', 'Персонал и ресурсы', 'Финансы и отчеты'],
        metrics: [
          { label: 'Операции', value: '5', detail: 'управленческих модулей' },
          { label: 'Ресурсы', value: 'единый', detail: 'склад и оборудование' },
          { label: 'Контроль', value: 'ежедневный', detail: 'персонал и финансы' },
        ],
        workflowTitle: 'Как использовать',
        workflow: ['Откройте ERP для клинической активности.', 'Проверьте персонал, склад и оборудование.', 'Сверьте финансы и операционные отчеты.'],
        relatedTitle: 'Что рядом',
        quickTitle: 'Быстрые действия',
      },
      complianceCenter: {
        eyebrow: 'Рабочая область',
        title: 'Центр соответствия',
        description: 'Контроль лицензий, дедлайнов, проверок и аудита, чтобы клиника заранее видела регуляторные риски.',
        highlights: ['Дедлайны', 'Проверки', 'Лицензирование'],
        metrics: [
          { label: 'Контроль', value: '4', detail: 'надзорных раздела' },
          { label: 'Риски', value: 'раньше', detail: 'до проверки' },
          { label: 'След', value: 'аудит', detail: 'история действий' },
        ],
        workflowTitle: 'Как использовать',
        workflow: ['Проверьте просроченные и близкие дедлайны.', 'Откройте подготовку к проверкам.', 'Сверьте лицензии и журнал аудита.'],
        relatedTitle: 'Что рядом',
        quickTitle: 'Быстрые действия',
      },
      documentCenter: {
        eyebrow: 'Рабочая область',
        title: 'Центр документов',
        description: 'Документы, создание, шаблоны, согласование, отчеты и экспорт в одном зрелом рабочем пространстве.',
        highlights: ['Шаблоны', 'Согласование', 'Экспорт'],
        metrics: [
          { label: 'Документы', value: 'единый', detail: 'список и создание' },
          { label: 'Отчеты', value: 'готовы', detail: 'для руководства' },
          { label: 'Вывод', value: 'экспорт', detail: 'данные и файлы' },
        ],
        workflowTitle: 'Как использовать',
        workflow: ['Создайте новый документ из шаблона.', 'Проверьте статусы и согласование.', 'Подготовьте отчет или экспорт.'],
        relatedTitle: 'Что рядом',
        quickTitle: 'Быстрые действия',
      },
      cases: {
        eyebrow: 'Рабочая область',
        title: 'Кейсы и обращения',
        description: 'Единый центр обращений, жалоб, направлений и коммуникации, чтобы задачи не терялись между страницами.',
        highlights: ['Обращения', 'Жалобы', 'Направления'],
        metrics: [
          { label: 'Потоки', value: '4', detail: 'типа кейсов' },
          { label: 'Ответы', value: 'быстрее', detail: 'через единый центр' },
          { label: 'Связь', value: 'рядом', detail: 'сообщения и статусы' },
        ],
        workflowTitle: 'Как использовать',
        workflow: ['Разберите входящие обращения.', 'Проверьте жалобы и ответственных.', 'Передайте направления и продолжите переписку.'],
        relatedTitle: 'Что рядом',
        quickTitle: 'Быстрые действия',
      },
      knowledgeBase: {
        eyebrow: 'Рабочая область',
        title: 'База знаний',
        description: 'Обучение, руководства, формуляр, новости, форум и карьерные возможности для врачей и клиник.',
        highlights: ['Обучение', 'Руководства', 'Сообщество'],
        metrics: [
          { label: 'Материалы', value: '6', detail: 'источников знаний' },
          { label: 'Врачи', value: 'фокус', detail: 'развитие и практика' },
          { label: 'Клиники', value: 'команда', detail: 'знания и найм' },
        ],
        workflowTitle: 'Как использовать',
        workflow: ['Откройте обучение или руководства.', 'Проверьте формуляр и новости.', 'Перейдите в форум или вакансии.'],
        relatedTitle: 'Что рядом',
        quickTitle: 'Быстрые действия',
      },
    },
  },
  en: {
    common: {
      overview: 'Overview',
      workflow: 'Workflow',
      connected: 'Connected',
      open: 'Open',
      startHere: 'Start here',
      related: 'Related workspaces',
    },
    hubs: {
      schedule: {
        eyebrow: 'Workspace',
        title: 'Schedule',
        description: 'One schedule center for appointments, calendar planning, and staff shifts without overwhelming the sidebar.',
        highlights: ['Today appointments', 'Clinic calendar', 'Staff shifts'],
        metrics: [
          { label: 'Focus', value: '3', detail: 'core areas' },
          { label: 'Clinic role', value: 'ops', detail: 'day, week, shifts' },
          { label: 'Doctor role', value: 'visits', detail: 'personal workload' },
        ],
        workflowTitle: 'How to use it',
        workflow: ['Check today appointments.', 'Review clinic calendar and events.', 'Close staff shift coverage.'],
        relatedTitle: 'Nearby work',
        quickTitle: 'Quick actions',
      },
      clinicOperations: {
        eyebrow: 'Workspace',
        title: 'Clinic Operations',
        description: 'Clinic operations hub for ERP, staff, inventory, equipment, and finance.',
        highlights: ['ERP and visits', 'Staff and resources', 'Finance and reports'],
        metrics: [
          { label: 'Operations', value: '5', detail: 'management modules' },
          { label: 'Resources', value: 'unified', detail: 'stock and equipment' },
          { label: 'Control', value: 'daily', detail: 'staff and finance' },
        ],
        workflowTitle: 'How to use it',
        workflow: ['Open ERP for clinical activity.', 'Review staff, inventory, and equipment.', 'Check finance and operating reports.'],
        relatedTitle: 'Nearby work',
        quickTitle: 'Quick actions',
      },
      complianceCenter: {
        eyebrow: 'Workspace',
        title: 'Compliance Center',
        description: 'Control licenses, deadlines, inspections, and audit so the clinic sees regulatory risk early.',
        highlights: ['Deadlines', 'Inspections', 'Licensing'],
        metrics: [
          { label: 'Control', value: '4', detail: 'oversight areas' },
          { label: 'Risk', value: 'early', detail: 'before inspection' },
          { label: 'Trace', value: 'audit', detail: 'action history' },
        ],
        workflowTitle: 'How to use it',
        workflow: ['Check overdue and upcoming deadlines.', 'Open inspection readiness.', 'Review licensing and audit history.'],
        relatedTitle: 'Nearby work',
        quickTitle: 'Quick actions',
      },
      documentCenter: {
        eyebrow: 'Workspace',
        title: 'Document Center',
        description: 'Documents, creation, templates, review, reports, and exports in one mature workspace.',
        highlights: ['Templates', 'Review', 'Export'],
        metrics: [
          { label: 'Documents', value: 'unified', detail: 'list and creation' },
          { label: 'Reports', value: 'ready', detail: 'for management' },
          { label: 'Output', value: 'export', detail: 'data and files' },
        ],
        workflowTitle: 'How to use it',
        workflow: ['Create a document from a template.', 'Review statuses and approvals.', 'Prepare a report or export.'],
        relatedTitle: 'Nearby work',
        quickTitle: 'Quick actions',
      },
      cases: {
        eyebrow: 'Workspace',
        title: 'Cases & Requests',
        description: 'One hub for requests, complaints, referrals, and communication so work does not get lost across pages.',
        highlights: ['Requests', 'Complaints', 'Referrals'],
        metrics: [
          { label: 'Flows', value: '4', detail: 'case types' },
          { label: 'Replies', value: 'faster', detail: 'from one center' },
          { label: 'Contact', value: 'nearby', detail: 'messages and statuses' },
        ],
        workflowTitle: 'How to use it',
        workflow: ['Triage incoming requests.', 'Review complaints and owners.', 'Send referrals and continue messaging.'],
        relatedTitle: 'Nearby work',
        quickTitle: 'Quick actions',
      },
      knowledgeBase: {
        eyebrow: 'Workspace',
        title: 'Knowledge Base',
        description: 'Learning, guidelines, formulary, news, forum, and career opportunities for doctors and clinics.',
        highlights: ['Learning', 'Guidelines', 'Community'],
        metrics: [
          { label: 'Material', value: '6', detail: 'knowledge sources' },
          { label: 'Doctors', value: 'focus', detail: 'growth and practice' },
          { label: 'Clinics', value: 'team', detail: 'knowledge and hiring' },
        ],
        workflowTitle: 'How to use it',
        workflow: ['Open learning or guidelines.', 'Check formulary and news.', 'Move into forum or jobs.'],
        relatedTitle: 'Nearby work',
        quickTitle: 'Quick actions',
      },
    },
  },
  uz: {
    common: {
      overview: 'Umumiy ko‘rinish',
      workflow: 'Ish jarayoni',
      connected: 'Bog‘langan',
      open: 'Ochish',
      startHere: 'Shu yerdan boshlang',
      related: 'Bog‘langan ish maydonlari',
    },
    hubs: {
      schedule: {
        eyebrow: 'Ish maydoni',
        title: 'Jadval',
        description: 'Qabul, klinika taqvimi va xodimlar smenalarini bitta tartibli markazda boshqaring.',
        highlights: ['Bugungi qabullar', 'Klinika taqvimi', 'Xodimlar smenasi'],
        metrics: [
          { label: 'Fokus', value: '3', detail: 'asosiy bo‘lim' },
          { label: 'Klinika', value: 'jarayon', detail: 'kun, hafta, smena' },
          { label: 'Shifokor', value: 'qabul', detail: 'shaxsiy yuklama' },
        ],
        workflowTitle: 'Qanday ishlatiladi',
        workflow: ['Bugungi qabullarni tekshiring.', 'Klinika taqvimi va tadbirlarni ko‘ring.', 'Smena va qamrovni rejalang.'],
        relatedTitle: 'Yaqin ishlar',
        quickTitle: 'Tezkor amallar',
      },
      clinicOperations: {
        eyebrow: 'Ish maydoni',
        title: 'Klinika operatsiyalari',
        description: 'ERP, xodimlar, ombor, jihozlar va moliyani bitta operatsion markazga jamlaydi.',
        highlights: ['ERP va tashriflar', 'Xodimlar va resurslar', 'Moliya va hisobotlar'],
        metrics: [
          { label: 'Operatsiyalar', value: '5', detail: 'boshqaruv moduli' },
          { label: 'Resurslar', value: 'bir joyda', detail: 'ombor va jihoz' },
          { label: 'Nazorat', value: 'kunlik', detail: 'xodim va moliya' },
        ],
        workflowTitle: 'Qanday ishlatiladi',
        workflow: ['Klinik faoliyat uchun ERPni oching.', 'Xodimlar, ombor va jihozlarni ko‘ring.', 'Moliya va hisobotlarni tekshiring.'],
        relatedTitle: 'Yaqin ishlar',
        quickTitle: 'Tezkor amallar',
      },
      complianceCenter: {
        eyebrow: 'Ish maydoni',
        title: 'Muvofiqlik markazi',
        description: 'Litsenziya, muddatlar, tekshiruvlar va auditni bitta joyda nazorat qiling.',
        highlights: ['Muddatlar', 'Tekshiruvlar', 'Litsenziyalash'],
        metrics: [
          { label: 'Nazorat', value: '4', detail: 'asosiy bo‘lim' },
          { label: 'Xavf', value: 'oldindan', detail: 'tekshiruvdan avval' },
          { label: 'Iz', value: 'audit', detail: 'amallar tarixi' },
        ],
        workflowTitle: 'Qanday ishlatiladi',
        workflow: ['Kechikkan va yaqin muddatlarni tekshiring.', 'Tekshiruvga tayyorgarlikni oching.', 'Litsenziya va audit jurnalini ko‘ring.'],
        relatedTitle: 'Yaqin ishlar',
        quickTitle: 'Tezkor amallar',
      },
      documentCenter: {
        eyebrow: 'Ish maydoni',
        title: 'Hujjatlar markazi',
        description: 'Hujjatlar, yaratish, shablonlar, ko‘rib chiqish, hisobot va eksport uchun yagona maydon.',
        highlights: ['Shablonlar', 'Ko‘rib chiqish', 'Eksport'],
        metrics: [
          { label: 'Hujjatlar', value: 'yagona', detail: 'ro‘yxat va yaratish' },
          { label: 'Hisobot', value: 'tayyor', detail: 'rahbariyat uchun' },
          { label: 'Natija', value: 'eksport', detail: 'ma’lumot va fayl' },
        ],
        workflowTitle: 'Qanday ishlatiladi',
        workflow: ['Shablondan yangi hujjat yarating.', 'Status va tasdiqlarni tekshiring.', 'Hisobot yoki eksport tayyorlang.'],
        relatedTitle: 'Yaqin ishlar',
        quickTitle: 'Tezkor amallar',
      },
      cases: {
        eyebrow: 'Ish maydoni',
        title: 'Ishlar va murojaatlar',
        description: 'Murojaat, shikoyat, yo‘llanma va xabarlarni bitta markazda tartibga soladi.',
        highlights: ['Murojaatlar', 'Shikoyatlar', 'Yo‘llanmalar'],
        metrics: [
          { label: 'Oqimlar', value: '4', detail: 'ish turi' },
          { label: 'Javoblar', value: 'tezroq', detail: 'bitta markazdan' },
          { label: 'Aloqa', value: 'yonma-yon', detail: 'xabar va status' },
        ],
        workflowTitle: 'Qanday ishlatiladi',
        workflow: ['Yangi murojaatlarni saralang.', 'Shikoyatlar va mas’ullarni ko‘ring.', 'Yo‘llanma yuboring va yozishmani davom ettiring.'],
        relatedTitle: 'Yaqin ishlar',
        quickTitle: 'Tezkor amallar',
      },
      knowledgeBase: {
        eyebrow: 'Ish maydoni',
        title: 'Bilim bazasi',
        description: 'Ta’lim, klinik qo‘llanmalar, formulary, yangiliklar, forum va ish imkoniyatlari.',
        highlights: ['Ta’lim', 'Qo‘llanmalar', 'Hamjamiyat'],
        metrics: [
          { label: 'Materiallar', value: '6', detail: 'bilim manbasi' },
          { label: 'Shifokorlar', value: 'fokus', detail: 'rivojlanish va amaliyot' },
          { label: 'Klinikalar', value: 'jamoa', detail: 'bilim va yollash' },
        ],
        workflowTitle: 'Qanday ishlatiladi',
        workflow: ['Ta’lim yoki qo‘llanmalarni oching.', 'Formulary va yangiliklarni tekshiring.', 'Forum yoki ish bo‘limiga o‘ting.'],
        relatedTitle: 'Yaqin ishlar',
        quickTitle: 'Tezkor amallar',
      },
    },
  },
  uz_cyrillic: {
    common: {
      overview: 'Умумий кўриниш',
      workflow: 'Иш жараёни',
      connected: 'Боғланган',
      open: 'Очиш',
      startHere: 'Шу ердан бошланг',
      related: 'Боғланган иш майдонлари',
    },
    hubs: {
      schedule: {
        eyebrow: 'Иш майдони',
        title: 'Жадвал',
        description: 'Қабул, клиника тақвими ва ходимлар сменаларини битта тартибли марказда бошқаринг.',
        highlights: ['Бугунги қабуллар', 'Клиника тақвими', 'Ходимлар сменаси'],
        metrics: [
          { label: 'Фокус', value: '3', detail: 'асосий бўлим' },
          { label: 'Клиника', value: 'жараён', detail: 'кун, ҳафта, смена' },
          { label: 'Шифокор', value: 'қабул', detail: 'шахсий юклама' },
        ],
        workflowTitle: 'Қандай ишлатилади',
        workflow: ['Бугунги қабулларни текширинг.', 'Клиника тақвими ва тадбирларни кўринг.', 'Смена ва қамровни режаланг.'],
        relatedTitle: 'Яқин ишлар',
        quickTitle: 'Тезкор амаллар',
      },
      clinicOperations: {
        eyebrow: 'Иш майдони',
        title: 'Клиника операциялари',
        description: 'ERP, ходимлар, омбор, жиҳозлар ва молияни битта операцион марказга жамлайди.',
        highlights: ['ERP ва ташрифлар', 'Ходимлар ва ресурслар', 'Молия ва ҳисоботлар'],
        metrics: [
          { label: 'Операциялар', value: '5', detail: 'бошқарув модули' },
          { label: 'Ресурслар', value: 'бир жойда', detail: 'омбор ва жиҳоз' },
          { label: 'Назорат', value: 'кунлик', detail: 'ходим ва молия' },
        ],
        workflowTitle: 'Қандай ишлатилади',
        workflow: ['Клиник фаолият учун ERPни очинг.', 'Ходимлар, омбор ва жиҳозларни кўринг.', 'Молия ва ҳисоботларни текширинг.'],
        relatedTitle: 'Яқин ишлар',
        quickTitle: 'Тезкор амаллар',
      },
      complianceCenter: {
        eyebrow: 'Иш майдони',
        title: 'Мувофиқлик маркази',
        description: 'Лицензия, муддатлар, текширувлар ва аудитни битта жойда назорат қилинг.',
        highlights: ['Муддатлар', 'Текширувлар', 'Лицензиялаш'],
        metrics: [
          { label: 'Назорат', value: '4', detail: 'асосий бўлим' },
          { label: 'Хавф', value: 'олдиндан', detail: 'текширувдан аввал' },
          { label: 'Из', value: 'аудит', detail: 'амаллар тарихи' },
        ],
        workflowTitle: 'Қандай ишлатилади',
        workflow: ['Кечиккан ва яқин муддатларни текширинг.', 'Текширувга тайёргарликни очинг.', 'Лицензия ва аудит журналини кўринг.'],
        relatedTitle: 'Яқин ишлар',
        quickTitle: 'Тезкор амаллар',
      },
      documentCenter: {
        eyebrow: 'Иш майдони',
        title: 'Ҳужжатлар маркази',
        description: 'Ҳужжатлар, яратиш, шаблонлар, кўриб чиқиш, ҳисобот ва экспорт учун ягона майдон.',
        highlights: ['Шаблонлар', 'Кўриб чиқиш', 'Экспорт'],
        metrics: [
          { label: 'Ҳужжатлар', value: 'ягона', detail: 'рўйхат ва яратиш' },
          { label: 'Ҳисобот', value: 'тайёр', detail: 'раҳбарият учун' },
          { label: 'Натижа', value: 'экспорт', detail: 'маълумот ва файл' },
        ],
        workflowTitle: 'Қандай ишлатилади',
        workflow: ['Шаблондан янги ҳужжат яратинг.', 'Статус ва тасдиқларни текширинг.', 'Ҳисобот ёки экспорт тайёрланг.'],
        relatedTitle: 'Яқин ишлар',
        quickTitle: 'Тезкор амаллар',
      },
      cases: {
        eyebrow: 'Иш майдони',
        title: 'Ишлар ва мурожаатлар',
        description: 'Мурожаат, шикоят, йўлланма ва хабарларни битта марказда тартибга солади.',
        highlights: ['Мурожаатлар', 'Шикоятлар', 'Йўлланмалар'],
        metrics: [
          { label: 'Оқимлар', value: '4', detail: 'иш тури' },
          { label: 'Жавоблар', value: 'тезроқ', detail: 'битта марказдан' },
          { label: 'Алоқа', value: 'ёнма-ён', detail: 'хабар ва статус' },
        ],
        workflowTitle: 'Қандай ишлатилади',
        workflow: ['Янги мурожаатларни сараланг.', 'Шикоятлар ва масъулларни кўринг.', 'Йўлланма юборинг ва ёзишмани давом эттиринг.'],
        relatedTitle: 'Яқин ишлар',
        quickTitle: 'Тезкор амаллар',
      },
      knowledgeBase: {
        eyebrow: 'Иш майдони',
        title: 'Билим базаси',
        description: 'Таълим, клиник қўлланмалар, формуляр, янгиликлар, форум ва иш имкониятлари.',
        highlights: ['Таълим', 'Қўлланмалар', 'Ҳамжамият'],
        metrics: [
          { label: 'Материаллар', value: '6', detail: 'билим манбаси' },
          { label: 'Шифокорлар', value: 'фокус', detail: 'ривожланиш ва амалиёт' },
          { label: 'Клиникалар', value: 'жамоа', detail: 'билим ва ёллаш' },
        ],
        workflowTitle: 'Қандай ишлатилади',
        workflow: ['Таълим ёки қўлланмаларни очинг.', 'Формуляр ва янгиликларни текширинг.', 'Форум ёки иш бўлимига ўтинг.'],
        relatedTitle: 'Яқин ишлар',
        quickTitle: 'Тезкор амаллар',
      },
    },
  },
  kk: {
    common: {
      overview: 'Ulıwma kórinis',
      workflow: 'Jumıs barısı',
      connected: 'Baylanısqan',
      open: 'Ashıw',
      startHere: 'Usı jerden baslań',
      related: 'Baylanısqan jumıs orınları',
    },
    hubs: {
      schedule: {
        eyebrow: 'Jumıs ornı',
        title: 'Keste',
        description: 'Qabıllawlar, klinika kalendarı hám xızmetkerler smenasın bir tártipli orında basqarıń.',
        highlights: ['Búgingi qabıllawlar', 'Klinika kalendarı', 'Xızmetker smenaları'],
        metrics: [
          { label: 'Fokus', value: '3', detail: 'negizgi bólim' },
          { label: 'Klinika', value: 'operaciya', detail: 'kún, hápte, smena' },
          { label: 'Dáriger', value: 'qabıllaw', detail: 'jeke júkleme' },
        ],
        workflowTitle: 'Qalay paydalanadı',
        workflow: ['Búgingi qabıllawlardı tekseriń.', 'Klinika kalendarı hám waqıyalardı kóriń.', 'Smena hám qamtıwdı jobalań.'],
        relatedTitle: 'Jaqın jumıslar',
        quickTitle: 'Tez ámeller',
      },
      clinicOperations: {
        eyebrow: 'Jumıs ornı',
        title: 'Klinika operaciyaları',
        description: 'ERP, xızmetkerler, sklad, úskeneler hám qarjını bir operaciyalıq orınǵa jıynaydı.',
        highlights: ['ERP hám barıwlar', 'Xızmetkerler hám resurslar', 'Qarjı hám esabatlar'],
        metrics: [
          { label: 'Operaciyalar', value: '5', detail: 'basqarıw moduli' },
          { label: 'Resurslar', value: 'bir orında', detail: 'sklad hám úskene' },
          { label: 'Qadaǵalaw', value: 'kúnlik', detail: 'xızmetker hám qarjı' },
        ],
        workflowTitle: 'Qalay paydalanadı',
        workflow: ['Klinikalıq iskerlik ushın ERPdi ashıń.', 'Xızmetker, sklad hám úskenelerdi kóriń.', 'Qarjı hám esabatlardı tekseriń.'],
        relatedTitle: 'Jaqın jumıslar',
        quickTitle: 'Tez ámeller',
      },
      complianceCenter: {
        eyebrow: 'Jumıs ornı',
        title: 'Sáykeslik orayı',
        description: 'Licenziya, múddetler, tekseriwler hám auditti bir orında qadaǵalań.',
        highlights: ['Múddetler', 'Tekseriwler', 'Licenziyalaw'],
        metrics: [
          { label: 'Qadaǵalaw', value: '4', detail: 'negizgi bólim' },
          { label: 'Qáwip', value: 'erte', detail: 'tekseriwden aldın' },
          { label: 'Iz', value: 'audit', detail: 'ámeller tariyxı' },
        ],
        workflowTitle: 'Qalay paydalanadı',
        workflow: ['Keshikken hám jaqın múddetlerdi tekseriń.', 'Tekseriwge tayarlıqtı ashıń.', 'Licenziya hám audit jurnalın kóriń.'],
        relatedTitle: 'Jaqın jumıslar',
        quickTitle: 'Tez ámeller',
      },
      documentCenter: {
        eyebrow: 'Jumıs ornı',
        title: 'Hújjetler orayı',
        description: 'Hújjetler, jaratıw, shablonlar, qarap shıǵıw, esabat hám eksport ushın bir maydan.',
        highlights: ['Shablonlar', 'Qarap shıǵıw', 'Eksport'],
        metrics: [
          { label: 'Hújjetler', value: 'birlesken', detail: 'dizim hám jaratıw' },
          { label: 'Esabat', value: 'tayın', detail: 'basqarıw ushın' },
          { label: 'Nátiyje', value: 'eksport', detail: 'maǵlıwmat hám fayl' },
        ],
        workflowTitle: 'Qalay paydalanadı',
        workflow: ['Shablonnan jańa hújjet jaratıń.', 'Status hám maqullawlardı tekseriń.', 'Esabat yamasa eksport tayarlań.'],
        relatedTitle: 'Jaqın jumıslar',
        quickTitle: 'Tez ámeller',
      },
      cases: {
        eyebrow: 'Jumıs ornı',
        title: 'Isler hám múrájáátlar',
        description: 'Múrájáát, shaǵım, jollanba hám xabarlardı bir orında tártipke keltiredi.',
        highlights: ['Múrájáátlar', 'Shaǵımlar', 'Jollanbalar'],
        metrics: [
          { label: 'Aǵımlar', value: '4', detail: 'is túri' },
          { label: 'Juwaplar', value: 'tezirek', detail: 'bir oraydan' },
          { label: 'Baylanıs', value: 'jaqın', detail: 'xabar hám status' },
        ],
        workflowTitle: 'Qalay paydalanadı',
        workflow: ['Jańa múrájáátlardı saralań.', 'Shaǵımlar hám juwaplılardı kóriń.', 'Jollanba jiberip, jazıswdı dawam etiń.'],
        relatedTitle: 'Jaqın jumıslar',
        quickTitle: 'Tez ámeller',
      },
      knowledgeBase: {
        eyebrow: 'Jumıs ornı',
        title: 'Bilim bazası',
        description: 'Tálim, klinikalıq qollanmalar, formular, jańalıqlar, forum hám jumıs múmkinshilikleri.',
        highlights: ['Tálim', 'Qollanmalar', 'Jámiýet'],
        metrics: [
          { label: 'Materiallar', value: '6', detail: 'bilim deregi' },
          { label: 'Dárigerler', value: 'fokus', detail: 'rawajlanıw hám ámeliyat' },
          { label: 'Klinikalar', value: 'komanda', detail: 'bilim hám jumısqa alıw' },
        ],
        workflowTitle: 'Qalay paydalanadı',
        workflow: ['Tálim yamasa qollanmalardı ashıń.', 'Formular hám jańalıqlardı tekseriń.', 'Forum yamasa jumıs bólimine ótiń.'],
        relatedTitle: 'Jaqın jumıslar',
        quickTitle: 'Tez ámeller',
      },
    },
  },
};

export function getWorkspaceCopy(lang: Language) {
  return WORKSPACE_HUB_COPY[lang] ?? WORKSPACE_HUB_COPY.ru;
}
