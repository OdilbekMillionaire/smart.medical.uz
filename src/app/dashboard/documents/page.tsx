'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Folder, FileText, UploadCloud, Search, FileSignature, FileKey,
  X, FolderOpen, Download, AlertCircle, Plus, Grid3x3,
  List, Star, StarOff, Trash2, Eye, Share2, Clock, CheckCircle2,
  FileSpreadsheet, File, ChevronRight, Home,
} from 'lucide-react';

type LK = 'uz' | 'uz_cyrillic' | 'ru' | 'en' | 'kk';

const L: Record<LK, {
  title: string; subtitle: string; uploadBtn: string; newFolderBtn: string;
  searchPlaceholder: string; allFiles: string; recent: string;
  starred: string; shared: string; trash: string; allTypes: string;
  pdfType: string; docType: string; xlsType: string; imgType: string;
  sortNew: string; sortOld: string; sortName: string; sortSize: string;
  gridView: string; listView: string; downloadBtn: string; shareBtn: string;
  previewBtn: string; deleteBtn: string; starBtn: string; unstarBtn: string;
  starredMsg: string; unstarredMsg: string; deletedMsg: string; sharedMsg: string;
  uploadTitle: string; uploadDesc: string; uploadHint: string; uploadDone: string;
  emptyTitle: string; emptyDesc: string; folderEmpty: string;
  results: string; totalSize: string; fileCount: string;
  backBtn: string; createFolderTitle: string; folderNameLabel: string;
  cancelBtn: string; createBtn: string;
  folders: { name: string; desc: string }[];
}> = {
  uz: {
    title: "Hujjatlar Kutubxonasi", subtitle: "hujjat saqlangan",
    uploadBtn: "Yuklash", newFolderBtn: "Yangi papka",
    searchPlaceholder: "Hujjat nomi bo'yicha qidirish...",
    allFiles: "Barcha fayllar", recent: "Yaqinda", starred: "Tanlangan",
    shared: "Ulashilgan", trash: "Axlat", allTypes: "Barcha turlar",
    pdfType: "PDF", docType: "Word", xlsType: "Excel", imgType: "Rasm",
    sortNew: "Yangi birinchi", sortOld: "Eski birinchi", sortName: "Nomi bo'yicha", sortSize: "Hajmi bo'yicha",
    gridView: "Panjara", listView: "Ro'yxat",
    downloadBtn: "Yuklab olish", shareBtn: "Ulashish", previewBtn: "Ko'rish",
    deleteBtn: "O'chirish", starBtn: "Tanlash", unstarBtn: "Bekor",
    starredMsg: "Tanlanganlarga qo'shildi", unstarredMsg: "Tanlanganlardan olib tashlandi",
    deletedMsg: "Hujjat o'chirildi", sharedMsg: "Havola nusxalandi",
    uploadTitle: "Faylni yuklash", uploadDesc: "Fayl sürüklang yoki bosing",
    uploadHint: "PDF, DOC, XLS, JPG qo'llab-quvvatlanadi. Max 50 MB",
    uploadDone: "Fayl muvaffaqiyatli yuklandi",
    emptyTitle: "Hujjatlar yo'q", emptyDesc: "Hali hech qanday hujjat yuklanmagan",
    folderEmpty: "Bu papka bo'sh",
    results: "ta fayl", totalSize: "Jami hajm", fileCount: "Fayllar",
    backBtn: "Ortga", createFolderTitle: "Yangi papka yaratish", folderNameLabel: "Papka nomi",
    cancelBtn: "Bekor", createBtn: "Yaratish",
    folders: [
      { name: "Litsenziya hujjatlari", desc: "Faoliyat litsenziyalari va ruxsatnomalar" },
      { name: "SSV me'yoriy hujjatlar", desc: "Sog'liqni saqlash vazirligi buyruqlari" },
      { name: "Xodimlar hujjatlari", desc: "Diplom, sertifikat, mehnat shartnomalari" },
      { name: "Tibbiy standartlar", desc: "Davolash protokollari va standartlar" },
      { name: "Moliyaviy hujjatlar", desc: "Shartnomalar, hisob-fakturalar" },
    ],
  },
  uz_cyrillic: {
    title: "Ҳужжатлар Кутубхонаси", subtitle: "ҳужжат сақланган",
    uploadBtn: "Юклаш", newFolderBtn: "Янги папка",
    searchPlaceholder: "Ҳужжат номи бўйича қидириш...",
    allFiles: "Барча файллар", recent: "Яқинда", starred: "Танланган",
    shared: "Улашилган", trash: "Ахлат", allTypes: "Барча турлар",
    pdfType: "PDF", docType: "Word", xlsType: "Excel", imgType: "Расм",
    sortNew: "Янги биринчи", sortOld: "Эски биринчи", sortName: "Номи бўйича", sortSize: "Ҳажми бўйича",
    gridView: "Панжара", listView: "Рўйхат",
    downloadBtn: "Юклаб олиш", shareBtn: "Улашиш", previewBtn: "Кўриш",
    deleteBtn: "Ўчириш", starBtn: "Танлаш", unstarBtn: "Бекор",
    starredMsg: "Танланганларга қўшилди", unstarredMsg: "Танланганлардан олиб ташланди",
    deletedMsg: "Ҳужжат ўчирилди", sharedMsg: "Ҳавола нусхаланди",
    uploadTitle: "Файлни юклаш", uploadDesc: "Файл сурьклинг ёки босинг",
    uploadHint: "PDF, DOC, XLS, JPG қўллаб-қувватланади. Макс 50 МБ",
    uploadDone: "Файл муваффақиятли юкланди",
    emptyTitle: "Ҳужжатлар йўқ", emptyDesc: "Ҳали ҳеч қандай ҳужжат юкланмаган",
    folderEmpty: "Бу папка бўш",
    results: "та файл", totalSize: "Жами ҳажм", fileCount: "Файллар",
    backBtn: "Ортга", createFolderTitle: "Янги папка яратиш", folderNameLabel: "Папка номи",
    cancelBtn: "Бекор", createBtn: "Яратиш",
    folders: [
      { name: "Лицензия ҳужжатлари", desc: "Фаолият лицензиялари ва рухсатномалар" },
      { name: "ССВ меъёрий ҳужжатлар", desc: "Соғлиқни сақлаш вазирлиги буйруқлари" },
      { name: "Ходимлар ҳужжатлари", desc: "Диплом, сертификат, меҳнат шартномалари" },
      { name: "Тиббий стандартлар", desc: "Даволаш протоколлари ва стандартлар" },
      { name: "Молиявий ҳужжатлар", desc: "Шартномалар, ҳисоб-фактуралар" },
    ],
  },
  ru: {
    title: "Библиотека документов", subtitle: "документов сохранено",
    uploadBtn: "Загрузить", newFolderBtn: "Новая папка",
    searchPlaceholder: "Поиск по названию документа...",
    allFiles: "Все файлы", recent: "Недавние", starred: "Избранное",
    shared: "Общие", trash: "Корзина", allTypes: "Все типы",
    pdfType: "PDF", docType: "Word", xlsType: "Excel", imgType: "Изображение",
    sortNew: "Сначала новые", sortOld: "Сначала старые", sortName: "По названию", sortSize: "По размеру",
    gridView: "Сетка", listView: "Список",
    downloadBtn: "Скачать", shareBtn: "Поделиться", previewBtn: "Просмотр",
    deleteBtn: "Удалить", starBtn: "В избранное", unstarBtn: "Убрать",
    starredMsg: "Добавлено в избранное", unstarredMsg: "Удалено из избранного",
    deletedMsg: "Документ удалён", sharedMsg: "Ссылка скопирована",
    uploadTitle: "Загрузить файл", uploadDesc: "Перетащите файл или нажмите",
    uploadHint: "Поддерживаются PDF, DOC, XLS, JPG. Макс 50 МБ",
    uploadDone: "Файл успешно загружен",
    emptyTitle: "Нет документов", emptyDesc: "Документы ещё не загружены",
    folderEmpty: "Папка пуста",
    results: "файлов", totalSize: "Общий размер", fileCount: "Файлов",
    backBtn: "Назад", createFolderTitle: "Создать папку", folderNameLabel: "Название папки",
    cancelBtn: "Отмена", createBtn: "Создать",
    folders: [
      { name: "Лицензионные документы", desc: "Лицензии на деятельность и разрешения" },
      { name: "Нормативные акты МЗ", desc: "Приказы Министерства здравоохранения" },
      { name: "Документы персонала", desc: "Дипломы, сертификаты, трудовые договоры" },
      { name: "Медицинские стандарты", desc: "Клинические протоколы и стандарты лечения" },
      { name: "Финансовые документы", desc: "Договоры, счета-фактуры" },
    ],
  },
  en: {
    title: "Document Library", subtitle: "documents stored",
    uploadBtn: "Upload", newFolderBtn: "New folder",
    searchPlaceholder: "Search by document name...",
    allFiles: "All files", recent: "Recent", starred: "Starred",
    shared: "Shared", trash: "Trash", allTypes: "All types",
    pdfType: "PDF", docType: "Word", xlsType: "Excel", imgType: "Image",
    sortNew: "Newest first", sortOld: "Oldest first", sortName: "By name", sortSize: "By size",
    gridView: "Grid", listView: "List",
    downloadBtn: "Download", shareBtn: "Share", previewBtn: "Preview",
    deleteBtn: "Delete", starBtn: "Star", unstarBtn: "Unstar",
    starredMsg: "Added to starred", unstarredMsg: "Removed from starred",
    deletedMsg: "Document deleted", sharedMsg: "Link copied",
    uploadTitle: "Upload file", uploadDesc: "Drag and drop or click to browse",
    uploadHint: "Supports PDF, DOC, XLS, JPG. Max 50 MB",
    uploadDone: "File uploaded successfully",
    emptyTitle: "No documents", emptyDesc: "No documents have been uploaded yet",
    folderEmpty: "This folder is empty",
    results: "files", totalSize: "Total size", fileCount: "Files",
    backBtn: "Back", createFolderTitle: "Create folder", folderNameLabel: "Folder name",
    cancelBtn: "Cancel", createBtn: "Create",
    folders: [
      { name: "License documents", desc: "Operating licenses and permits" },
      { name: "Ministry regulations", desc: "Ministry of Health orders and regulations" },
      { name: "Staff documents", desc: "Diplomas, certificates, employment contracts" },
      { name: "Medical standards", desc: "Treatment protocols and clinical standards" },
      { name: "Financial documents", desc: "Contracts, invoices" },
    ],
  },
  kk: {
    title: "Құжаттар Кітапханасы", subtitle: "құжат сақталған",
    uploadBtn: "Жүктеу", newFolderBtn: "Жаңа қалта",
    searchPlaceholder: "Құжат аты бойынша іздеу...",
    allFiles: "Барлық файлдар", recent: "Жақында", starred: "Таңдаулы",
    shared: "Бөлісілген", trash: "Қоқыс", allTypes: "Барлық түрлер",
    pdfType: "PDF", docType: "Word", xlsType: "Excel", imgType: "Сурет",
    sortNew: "Жаңасы бірінші", sortOld: "Ескісі бірінші", sortName: "Аты бойынша", sortSize: "Мөлшері бойынша",
    gridView: "Тор", listView: "Тізім",
    downloadBtn: "Жүктеп алу", shareBtn: "Бөлісу", previewBtn: "Қарау",
    deleteBtn: "Жою", starBtn: "Таңдау", unstarBtn: "Болдырмау",
    starredMsg: "Таңдаулыларға қосылды", unstarredMsg: "Таңдаулылардан жойылды",
    deletedMsg: "Құжат жойылды", sharedMsg: "Сілтеме көшірілді",
    uploadTitle: "Файл жүктеу", uploadDesc: "Файлды сүйреп тастаңыз немесе басыңыз",
    uploadHint: "PDF, DOC, XLS, JPG қолданылады. Макс 50 МБ",
    uploadDone: "Файл сәтті жүктелді",
    emptyTitle: "Құжаттар жоқ", emptyDesc: "Әлі ешқандай құжат жүктелмеген",
    folderEmpty: "Бұл қалта бос",
    results: "файл", totalSize: "Жалпы мөлшер", fileCount: "Файлдар",
    backBtn: "Артқа", createFolderTitle: "Жаңа қалта жасау", folderNameLabel: "Қалта аты",
    cancelBtn: "Болдырмау", createBtn: "Жасау",
    folders: [
      { name: "Лицензия құжаттары", desc: "Қызмет лицензиялары мен рұқсаттар" },
      { name: "ДСМ нормативтік құжаттары", desc: "Денсаулық сақтау министрлігі бұйрықтары" },
      { name: "Қызметкерлер құжаттары", desc: "Диплом, сертификат, еңбек шарттары" },
      { name: "Медициналық стандарттар", desc: "Емдеу хаттамалары мен стандарттар" },
      { name: "Қаржылық құжаттар", desc: "Шарттар, шот-фактуралар" },
    ],
  },
};

interface DocFile {
  id: string; name: string; size: string; date: string; type: 'pdf' | 'doc' | 'xls' | 'img'; folderId: string;
}

const FOLDERS_DATA = [
  { id: '1', count: 12 }, { id: '2', count: 45 }, { id: '3', count: 8 }, { id: '4', count: 156 }, { id: '5', count: 7 },
];

const DOCUMENTS: DocFile[] = [
  { id: '1', name: "SSV-102: Tibbiy standartlar (2025).pdf", size: '2.4 MB', date: '12.10.2026', type: 'pdf', folderId: '2' },
  { id: '2', name: "SanQvaN qoidalari to'plami.doc", size: '1.1 MB', date: '05.09.2026', type: 'doc', folderId: '1' },
  { id: '3', name: "Yangi ishchi xodim blankasi.pdf", size: '450 KB', date: '22.08.2026', type: 'pdf', folderId: '3' },
  { id: '4', name: "Reyting ko'rsatkichlari (Ichki).xlsx", size: '3.8 MB', date: '10.06.2026', type: 'xls', folderId: '4' },
  { id: '5', name: "Litsenziya olish uchun ariza.pdf", size: '800 KB', date: '01.11.2026', type: 'pdf', folderId: '1' },
  { id: '6', name: "Malaka oshirish sertifikati — Dr. Azimov.pdf", size: '1.2 MB', date: '15.10.2026', type: 'pdf', folderId: '3' },
  { id: '7', name: "2026 yil moliyaviy hisobot.xlsx", size: '4.1 MB', date: '30.11.2026', type: 'xls', folderId: '5' },
  { id: '8', name: "Sterilizatsiya shartnomasi.doc", size: '520 KB', date: '08.11.2026', type: 'doc', folderId: '2' },
];

const ICON_MAP = { pdf: <File className="w-5 h-5 text-red-500" />, doc: <FileText className="w-5 h-5 text-blue-500" />, xls: <FileSpreadsheet className="w-5 h-5 text-green-500" />, img: <File className="w-5 h-5 text-purple-500" /> };
const TYPE_COLORS = { pdf: 'bg-red-100 text-red-700', doc: 'bg-blue-100 text-blue-700', xls: 'bg-green-100 text-green-700', img: 'bg-purple-100 text-purple-700' };

type NavTab = 'all' | 'recent' | 'starred' | 'shared';
type SortType = 'new' | 'old' | 'name' | 'size';

export default function DocumentsPage() {
  const { lang } = useLanguage();
  const tx = L[lang as LK] ?? L.uz;

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pdf' | 'doc' | 'xls' | 'img'>('all');
  const [sort, setSort] = useState<SortType>('new');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [navTab, setNavTab] = useState<NavTab>('all');
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState(false);

  const currentFolderName = currentFolderId ? (tx.folders[Number(currentFolderId) - 1]?.name ?? '') : null;

  const filtered = useMemo(() => {
    let docs = DOCUMENTS;
    if (currentFolderId) docs = docs.filter((d) => d.folderId === currentFolderId);
    if (navTab === 'starred') docs = docs.filter((d) => starred.has(d.id));
    if (typeFilter !== 'all') docs = docs.filter((d) => d.type === typeFilter);
    if (search) docs = docs.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));
    docs = [...docs].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'size') return parseFloat(b.size) - parseFloat(a.size);
      if (sort === 'old') return new Date(a.date).getTime() - new Date(b.date).getTime();
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    return docs;
  }, [currentFolderId, navTab, typeFilter, search, sort, starred]);

  function toggleStar(id: string) {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast.info(tx.unstarredMsg); }
      else { next.add(id); toast.success(tx.starredMsg); }
      return next;
    });
  }

  const navTabs: { key: NavTab; label: string }[] = [
    { key: 'all', label: tx.allFiles },
    { key: 'recent', label: tx.recent },
    { key: 'starred', label: `${tx.starred} (${starred.size})` },
    { key: 'shared', label: tx.shared },
  ];

  const folderIcons = [FileSignature, Folder, Folder, FileKey, FileText];
  const folderColors = ['text-amber-500', 'text-blue-500', 'text-emerald-500', 'text-red-500', 'text-purple-500'];
  const folderBgs = ['bg-amber-100', 'bg-blue-100', 'bg-emerald-100', 'bg-red-100', 'bg-purple-100'];

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-amber-500" />{tx.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{DOCUMENTS.length} {tx.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowNewFolder(true)}>
            <Plus className="w-3.5 h-3.5" />{tx.newFolderBtn}
          </Button>
          <Button className="gap-1.5" onClick={() => setShowUpload(true)}>
            <UploadCloud className="w-4 h-4" />{tx.uploadBtn}
          </Button>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {navTabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setNavTab(key); setCurrentFolderId(null); }}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${navTab === key ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Upload modal */}
      {showUpload && (
        <Card className={`border-2 border-dashed transition-colors ${dragOver ? 'border-amber-400 bg-amber-50' : 'border-slate-200'}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); toast.success(tx.uploadDone); setShowUpload(false); }}
        >
          <CardContent className="p-8 text-center">
            <UploadCloud className={`w-12 h-12 mx-auto mb-3 ${dragOver ? 'text-amber-500' : 'text-slate-300'}`} />
            <p className="font-medium text-slate-700">{tx.uploadDesc}</p>
            <p className="text-xs text-slate-400 mt-1">{tx.uploadHint}</p>
            <div className="flex gap-2 justify-center mt-4">
              <Button size="sm" onClick={() => { toast.success(tx.uploadDone); setShowUpload(false); }}>{tx.uploadBtn}</Button>
              <Button variant="outline" size="sm" onClick={() => setShowUpload(false)}>{tx.cancelBtn}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New folder modal */}
      {showNewFolder && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm">{tx.createFolderTitle}</CardTitle></CardHeader>
          <CardContent className="flex gap-2">
            <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder={tx.folderNameLabel} className="flex-1" autoFocus onKeyDown={(e) => { if (e.key === 'Enter' && newFolderName) { toast.success('Papka yaratildi'); setShowNewFolder(false); setNewFolderName(''); } }} />
            <Button size="sm" onClick={() => { if (newFolderName) { toast.success('Papka yaratildi'); setShowNewFolder(false); setNewFolderName(''); } }}>{tx.createBtn}</Button>
            <Button variant="outline" size="sm" onClick={() => setShowNewFolder(false)}>{tx.cancelBtn}</Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar — folders */}
        {!currentFolderId && (
          <div className="lg:w-64 shrink-0 space-y-2">
            {FOLDERS_DATA.map((f, i) => {
              const Icon = folderIcons[i];
              return (
                <button
                  key={f.id}
                  onClick={() => setCurrentFolderId(f.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left group"
                >
                  <div className={`w-9 h-9 rounded-lg ${folderBgs[i]} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4.5 h-4.5 ${folderColors[i]}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate group-hover:text-slate-900">{tx.folders[i]?.name ?? ''}</p>
                    <p className="text-xs text-slate-400">{f.count} {tx.results}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 space-y-4">
          {/* Breadcrumb + filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {currentFolderId && (
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1 sm:mb-0">
                <button onClick={() => setCurrentFolderId(null)} className="hover:text-amber-600 flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" />{tx.backBtn}
                </button>
                <ChevronRight className="w-3 h-3" />
                <span className="font-medium text-slate-700">{currentFolderName}</span>
              </div>
            )}
            <div className="flex gap-2 flex-1 ml-auto">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tx.searchPlaceholder} className="pl-9 text-sm" />
                {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
              </div>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} className="h-10 rounded-md border border-input px-2 text-sm bg-background">
                <option value="all">{tx.allTypes}</option>
                <option value="pdf">{tx.pdfType}</option>
                <option value="doc">{tx.docType}</option>
                <option value="xls">{tx.xlsType}</option>
                <option value="img">{tx.imgType}</option>
              </select>
              <select value={sort} onChange={(e) => setSort(e.target.value as SortType)} className="h-10 rounded-md border border-input px-2 text-sm bg-background hidden sm:block">
                <option value="new">{tx.sortNew}</option>
                <option value="old">{tx.sortOld}</option>
                <option value="name">{tx.sortName}</option>
                <option value="size">{tx.sortSize}</option>
              </select>
              <div className="flex border rounded-md overflow-hidden">
                <button onClick={() => setViewMode('list')} className={`px-2.5 py-2 ${viewMode === 'list' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}><List className="w-4 h-4 text-slate-500" /></button>
                <button onClick={() => setViewMode('grid')} className={`px-2.5 py-2 ${viewMode === 'grid' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}><Grid3x3 className="w-4 h-4 text-slate-500" /></button>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400">{filtered.length} {tx.results}</p>

          {/* Files */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-slate-200" />
              <p className="font-medium text-slate-700">{currentFolderId ? tx.folderEmpty : tx.emptyTitle}</p>
              <p className="text-sm text-slate-400 mt-1">{tx.emptyDesc}</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-1.5">
              {filtered.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all group">
                  <div className="shrink-0">{ICON_MAP[doc.type]}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className={`text-xs py-0 ${TYPE_COLORS[doc.type]}`}>{doc.type.toUpperCase()}</Badge>
                      <span className="text-xs text-slate-400">{doc.size}</span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-400 flex items-center gap-0.5"><Clock className="w-3 h-3" />{doc.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => toggleStar(doc.id)} className="p-1.5 rounded-lg hover:bg-yellow-50 text-slate-400 hover:text-yellow-500">
                      {starred.has(doc.id) ? <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> : <StarOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => toast.info(tx.previewBtn)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-500"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => toast.success(tx.downloadBtn)} className="p-1.5 rounded-lg hover:bg-green-50 text-slate-400 hover:text-green-500"><Download className="w-4 h-4" /></button>
                    <button onClick={() => { navigator.clipboard.writeText(doc.name); toast.success(tx.sharedMsg); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Share2 className="w-4 h-4" /></button>
                    <button onClick={() => toast.error(tx.deletedMsg)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <div className={`w-12 h-12 rounded-xl ${TYPE_COLORS[doc.type].split(' ')[0]} flex items-center justify-center`}>
                      {ICON_MAP[doc.type]}
                    </div>
                    <p className="text-xs font-medium text-slate-700 truncate w-full">{doc.name.replace(/\.[^.]+$/, '')}</p>
                    <div className="flex items-center gap-1">
                      <Badge className={`text-[10px] py-0 ${TYPE_COLORS[doc.type]}`}>{doc.type.toUpperCase()}</Badge>
                      <span className="text-[10px] text-slate-400">{doc.size}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => toast.success(tx.downloadBtn)} className="p-1 text-slate-400 hover:text-green-500"><Download className="w-3.5 h-3.5" /></button>
                      <button onClick={() => toggleStar(doc.id)} className="p-1 text-slate-400 hover:text-yellow-500">
                        {starred.has(doc.id) ? <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /> : <StarOff className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => toast.error(tx.deletedMsg)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-100">
        <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" />{filtered.length} {tx.results}</span>
        <span className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-yellow-400" />{tx.starred}: {starred.size}</span>
      </div>
    </div>
  );
}
