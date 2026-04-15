'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getVaccinationsByPatient, getVaccinationsByClinic, createVaccination } from '@/lib/firestore';
import type { VaccinationRecord, PatientUser } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ShieldCheck, Plus, Calendar, AlertTriangle, CheckCircle2,
  Syringe, Search, Download, Printer, Filter, Clock, X,
  FileText, ChevronDown, Info, TrendingUp, Users, Activity,
} from 'lucide-react';

type LK = 'uz' | 'uz_cyrillic' | 'ru' | 'en' | 'kk';

const L: Record<LK, {
  title: string; subtitle: string; addBtn: string;
  total: string; overdue: string; upcoming: string; completed: string;
  statsTitle: string; filterAll: string; filterOverdue: string;
  filterUpcoming: string; filterCompleted: string;
  searchPlaceholder: string; doseLabel: string; givenLabel: string;
  nextLabel: string; overdueTag: string; upcomingTag: string;
  completedTag: string; doctorLabel: string; batchLabel: string;
  notesLabel: string; patientLabel: string; vaccineLabel: string;
  doseNumLabel: string; givenDateLabel: string; nextDateLabel: string;
  saveBtn: string; cancelBtn: string; savingBtn: string;
  emptyTitle: string; emptyDesc: string; requiredError: string;
  saveSuccess: string; loadError: string; saveError: string;
  overdueAlert: string; printBtn: string; exportBtn: string;
  whoTitle: string; whoDesc: string; scheduleBtn: string;
  certBtn: string; daysLeft: string; daysOverdue: string;
  formTitle: string; vaccineTypes: string[];
  noRecords: string; sortNew: string; sortOld: string;
  optional: string; loading: string;
}> = {
  uz: {
    title: "Emlash Ro'yxati", subtitle: "emlash yozuvi", addBtn: "Emlash qo'shish",
    total: "Jami emlash", overdue: "Muddati o'tgan", upcoming: "30 kun ichida", completed: "Bajarilgan",
    statsTitle: "Umumiy holat", filterAll: "Barchasi", filterOverdue: "Muddati o'tgan",
    filterUpcoming: "Yaqinlashmoqda", filterCompleted: "Bajarilgan",
    searchPlaceholder: "Vaktsina yoki bemor nomi...", doseLabel: "Doza", givenLabel: "Berildi",
    nextLabel: "Keyingi", overdueTag: "Muddati o'tgan", upcomingTag: "Yaqin",
    completedTag: "Bajarilgan", doctorLabel: "Emlagan shifokor", batchLabel: "Seriya raqami",
    notesLabel: "Izoh", patientLabel: "Bemor ismi *", vaccineLabel: "Vaktsina nomi *",
    doseNumLabel: "Doza raqami", givenDateLabel: "Berilgan sana *", nextDateLabel: "Keyingi doza sanasi",
    saveBtn: "Saqlash", cancelBtn: "Bekor", savingBtn: "Saqlanmoqda...",
    emptyTitle: "Emlash yozuvlari yo'q", emptyDesc: "Hozircha hech qanday emlash yozuvi kiritilmagan",
    requiredError: "Vaktsina nomi va berilgan sana majburiy",
    saveSuccess: "Emlash yozuvi qo'shildi", loadError: "Yuklashda xato", saveError: "Saqlashda xato",
    overdueAlert: "ta takroriy emlash muddati o'tib ketgan. Zudlik bilan ko'rib chiqing!",
    printBtn: "Chop etish", exportBtn: "CSV yuklash",
    whoTitle: "JSST tavsiyalari", whoDesc: "Dunyo sog'liqni saqlash tashkiloti milliy emlash jadvali",
    scheduleBtn: "Jadvalga qarang", certBtn: "Sertifikat",
    daysLeft: "kun qoldi", daysOverdue: "kun o'tgan",
    formTitle: "Yangi emlash yozuvi", vaccineTypes: ['Gripp', 'COVID-19', 'Gepatit B', 'Qoqshol', 'Difteriya', "Ko'kyo'tal", 'Qizamiq', 'Parotit', 'Qizilcha', 'Polio', 'BCG', 'Boshqa'],
    noRecords: "Yozuvlar topilmadi", sortNew: "Yangi birinchi", sortOld: "Eski birinchi",
    optional: "ixtiyoriy", loading: "Yuklanmoqda...",
  },
  uz_cyrillic: {
    title: "Эмлаш Рўйхати", subtitle: "эмлаш ёзуви", addBtn: "Эмлаш қўшиш",
    total: "Жами эмлаш", overdue: "Муддати ўтган", upcoming: "30 кун ичида", completed: "Бажарилган",
    statsTitle: "Умумий ҳолат", filterAll: "Барчаси", filterOverdue: "Муддати ўтган",
    filterUpcoming: "Яқинлашмоқда", filterCompleted: "Бажарилган",
    searchPlaceholder: "Вакцина ёки бемор исми...", doseLabel: "Доза", givenLabel: "Берилди",
    nextLabel: "Кейинги", overdueTag: "Муддати ўтган", upcomingTag: "Яқин",
    completedTag: "Бажарилган", doctorLabel: "Эмлаган шифокор", batchLabel: "Серия рақами",
    notesLabel: "Изоҳ", patientLabel: "Бемор исми *", vaccineLabel: "Вакцина номи *",
    doseNumLabel: "Доза рақами", givenDateLabel: "Берилган сана *", nextDateLabel: "Кейинги доза санаси",
    saveBtn: "Сақлаш", cancelBtn: "Бекор", savingBtn: "Сақланмоқда...",
    emptyTitle: "Эмлаш ёзувлари йўқ", emptyDesc: "Ҳозирча ҳеч қандай эмлаш ёзуви киритилмаган",
    requiredError: "Вакцина номи ва берилган сана мажбурий",
    saveSuccess: "Эмлаш ёзуви қўшилди", loadError: "Юклашда хато", saveError: "Сақлашда хато",
    overdueAlert: "та такрорий эмлаш муддати ўтиб кетган. Зудлик билан кўриб чиқинг!",
    printBtn: "Чоп этиш", exportBtn: "CSV юклаш",
    whoTitle: "ЖССТ тавсиялари", whoDesc: "Жаҳон соғлиқни сақлаш ташкилоти миллий эмлаш жадвали",
    scheduleBtn: "Жадвалга қаранг", certBtn: "Сертификат",
    daysLeft: "кун қолди", daysOverdue: "кун ўтган",
    formTitle: "Янги эмлаш ёзуви", vaccineTypes: ['Грипп', 'COVID-19', 'Гепатит Б', 'Қоқшол', 'Дифтерия', 'Кўкйўтал', 'Қизамиқ', 'Паротит', 'Қизилча', 'Полио', 'БЦЖ', 'Бошқа'],
    noRecords: "Ёзувлар топилмади", sortNew: "Янги биринчи", sortOld: "Эски биринчи",
    optional: "ихтиёрий", loading: "Юкланмоқда...",
  },
  ru: {
    title: "Журнал вакцинации", subtitle: "записей вакцинации", addBtn: "Добавить вакцинацию",
    total: "Всего прививок", overdue: "Просрочено", upcoming: "В течение 30 дней", completed: "Выполнено",
    statsTitle: "Общий статус", filterAll: "Все", filterOverdue: "Просрочено",
    filterUpcoming: "Предстоящие", filterCompleted: "Выполнено",
    searchPlaceholder: "Вакцина или имя пациента...", doseLabel: "Доза", givenLabel: "Введено",
    nextLabel: "Следующая", overdueTag: "Просрочено", upcomingTag: "Скоро",
    completedTag: "Выполнено", doctorLabel: "Врач", batchLabel: "Серийный номер",
    notesLabel: "Примечания", patientLabel: "Имя пациента *", vaccineLabel: "Название вакцины *",
    doseNumLabel: "Номер дозы", givenDateLabel: "Дата введения *", nextDateLabel: "Дата следующей дозы",
    saveBtn: "Сохранить", cancelBtn: "Отмена", savingBtn: "Сохранение...",
    emptyTitle: "Нет записей вакцинации", emptyDesc: "Записи о вакцинации ещё не добавлены",
    requiredError: "Название вакцины и дата обязательны",
    saveSuccess: "Запись о вакцинации добавлена", loadError: "Ошибка загрузки", saveError: "Ошибка сохранения",
    overdueAlert: "ревакцинаций просрочено. Требуется немедленное внимание!",
    printBtn: "Печать", exportBtn: "Экспорт CSV",
    whoTitle: "Рекомендации ВОЗ", whoDesc: "Национальный календарь прививок Всемирной организации здравоохранения",
    scheduleBtn: "Открыть календарь", certBtn: "Сертификат",
    daysLeft: "дн. осталось", daysOverdue: "дн. просрочено",
    formTitle: "Новая запись вакцинации", vaccineTypes: ['Грипп', 'COVID-19', 'Гепатит Б', 'Столбняк', 'Дифтерия', 'Коклюш', 'Корь', 'Паротит', 'Краснуха', 'Полиомиелит', 'БЦЖ', 'Другое'],
    noRecords: "Записи не найдены", sortNew: "Сначала новые", sortOld: "Сначала старые",
    optional: "необязательно", loading: "Загрузка...",
  },
  en: {
    title: "Vaccination Records", subtitle: "vaccination records", addBtn: "Add Vaccination",
    total: "Total vaccinations", overdue: "Overdue", upcoming: "Within 30 days", completed: "Completed",
    statsTitle: "Overall status", filterAll: "All", filterOverdue: "Overdue",
    filterUpcoming: "Upcoming", filterCompleted: "Completed",
    searchPlaceholder: "Vaccine or patient name...", doseLabel: "Dose", givenLabel: "Given",
    nextLabel: "Next", overdueTag: "Overdue", upcomingTag: "Upcoming",
    completedTag: "Completed", doctorLabel: "Administered by", batchLabel: "Batch number",
    notesLabel: "Notes", patientLabel: "Patient name *", vaccineLabel: "Vaccine name *",
    doseNumLabel: "Dose number", givenDateLabel: "Date given *", nextDateLabel: "Next dose date",
    saveBtn: "Save", cancelBtn: "Cancel", savingBtn: "Saving...",
    emptyTitle: "No vaccination records", emptyDesc: "No vaccination records have been added yet",
    requiredError: "Vaccine name and date given are required",
    saveSuccess: "Vaccination record added", loadError: "Failed to load records", saveError: "Failed to save",
    overdueAlert: "booster vaccination(s) are overdue. Immediate attention required!",
    printBtn: "Print", exportBtn: "Export CSV",
    whoTitle: "WHO Recommendations", whoDesc: "World Health Organization national immunization schedule",
    scheduleBtn: "View schedule", certBtn: "Certificate",
    daysLeft: "days left", daysOverdue: "days overdue",
    formTitle: "New Vaccination Record", vaccineTypes: ['Influenza', 'COVID-19', 'Hepatitis B', 'Tetanus', 'Diphtheria', 'Pertussis', 'Measles', 'Mumps', 'Rubella', 'Polio', 'BCG', 'Other'],
    noRecords: "No records found", sortNew: "Newest first", sortOld: "Oldest first",
    optional: "optional", loading: "Loading...",
  },
  kk: {
    title: "Егу Журналы", subtitle: "егу жазбасы", addBtn: "Егу қосыу",
    total: "Барлық егулер", overdue: "Мерзімі өткен", upcoming: "30 күн ішінде", completed: "Орындалған",
    statsTitle: "Жалпы жағдай", filterAll: "Барлығы", filterOverdue: "Мерзімі өткен",
    filterUpcoming: "Жақындап келе жатыр", filterCompleted: "Орындалған",
    searchPlaceholder: "Вакцина немесе науқас аты...", doseLabel: "Доза", givenLabel: "Берілді",
    nextLabel: "Келесі", overdueTag: "Мерзімі өткен", upcomingTag: "Жақын",
    completedTag: "Орындалған", doctorLabel: "Егуші дәрігер", batchLabel: "Серия нөмірі",
    notesLabel: "Ескертпе", patientLabel: "Науқас аты *", vaccineLabel: "Вакцина аты *",
    doseNumLabel: "Доза нөмірі", givenDateLabel: "Берілген күн *", nextDateLabel: "Келесі доза күні",
    saveBtn: "Сақтау", cancelBtn: "Болдырмау", savingBtn: "Сақталуда...",
    emptyTitle: "Егу жазбалары жоқ", emptyDesc: "Әлі ешқандай егу жазбасы енгізілмеген",
    requiredError: "Вакцина аты және берілген күн міндетті",
    saveSuccess: "Егу жазбасы қосылды", loadError: "Жүктеуде қате", saveError: "Сақтауда қате",
    overdueAlert: "қайталама егу мерзімі өтіп кетті. Дереу назар аударыңыз!",
    printBtn: "Басып шығару", exportBtn: "CSV жүктеу",
    whoTitle: "ДДҰ ұсыныстары", whoDesc: "Дүниежүзілік денсаулық сақтау ұйымының ұлттық егу кестесі",
    scheduleBtn: "Кестені қарау", certBtn: "Сертификат",
    daysLeft: "күн қалды", daysOverdue: "күн өтті",
    formTitle: "Жаңа егу жазбасы", vaccineTypes: ['Тұмау', 'COVID-19', 'Гепатит Б', 'Сіреспе', 'Дифтерия', 'Қақырық', 'Қызамық', 'Паротит', 'Қызылша', 'Полио', 'БЦЖ', 'Басқа'],
    noRecords: "Жазбалар табылмады", sortNew: "Жаңасы бірінші", sortOld: "Ескісі бірінші",
    optional: "міндетті емес", loading: "Жүктелуде...",
  },
};

const EMPTY_FORM = { vaccineName: '', doseNumber: '1', dateGiven: '', nextDoseDate: '', batchNumber: '', administeredBy: '', notes: '', patientName: '' };
type FilterType = 'all' | 'overdue' | 'upcoming' | 'completed';
type SortType = 'new' | 'old';

export default function VaccinationsPage() {
  const { user, userRole, userProfile } = useAuth();
  const { lang } = useLanguage();
  const tx = L[lang as LK] ?? L.uz;

  const [records, setRecords] = useState<VaccinationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('new');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showWHO, setShowWHO] = useState(false);

  const isClinic = userRole === 'clinic' || userRole === 'admin';
  const patient = userProfile as PatientUser | null;
  const today = new Date().toISOString().split('T')[0];

  async function load() {
    if (!user) return;
    setLoading(true);
    try {
      const data = isClinic
        ? await getVaccinationsByClinic(user.uid)
        : await getVaccinationsByPatient(user.uid);
      setRecords(data);
    } catch { toast.error(tx.loadError); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [user, userRole]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate() {
    if (!user || !form.vaccineName || !form.dateGiven) {
      toast.error(tx.requiredError); return;
    }
    setSaving(true);
    try {
      const patientName = isClinic ? form.patientName : (patient?.fullName ?? userProfile?.displayName ?? '');
      await createVaccination({
        clinicId: isClinic ? user.uid : (userProfile as { linkedClinicId?: string })?.linkedClinicId ?? user.uid,
        patientId: isClinic ? `manual_${Date.now()}` : user.uid,
        patientName,
        vaccineName: form.vaccineName,
        doseNumber: Number(form.doseNumber) || 1,
        dateGiven: form.dateGiven,
        nextDoseDate: form.nextDoseDate || undefined,
        batchNumber: form.batchNumber || undefined,
        administeredBy: form.administeredBy || undefined,
        notes: form.notes || undefined,
        createdAt: new Date().toISOString(),
      });
      toast.success(tx.saveSuccess);
      setShowForm(false); setForm(EMPTY_FORM); await load();
    } catch { toast.error(tx.saveError); }
    finally { setSaving(false); }
  }

  function getDaysRemaining(dateStr: string) {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  }

  const stats = useMemo(() => ({
    total: records.length,
    overdue: records.filter((r) => r.nextDoseDate && r.nextDoseDate < today).length,
    upcoming: records.filter((r) => r.nextDoseDate && r.nextDoseDate >= today && getDaysRemaining(r.nextDoseDate) <= 30).length,
    completed: records.filter((r) => !r.nextDoseDate).length,
  }), [records, today]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    let result = records.filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return r.vaccineName.toLowerCase().includes(q) || (r.patientName ?? '').toLowerCase().includes(q);
    });
    if (filter === 'overdue') result = result.filter((r) => r.nextDoseDate && r.nextDoseDate < today);
    else if (filter === 'upcoming') result = result.filter((r) => r.nextDoseDate && r.nextDoseDate >= today && getDaysRemaining(r.nextDoseDate) <= 30);
    else if (filter === 'completed') result = result.filter((r) => !r.nextDoseDate);
    result = [...result].sort((a, b) => {
      const da = new Date(a.dateGiven).getTime();
      const db = new Date(b.dateGiven).getTime();
      return sort === 'new' ? db - da : da - db;
    });
    return result;
  }, [records, search, filter, sort, today]); // eslint-disable-line react-hooks/exhaustive-deps

  function exportCSV() {
    const header = ['Vaktsina', 'Doza', 'Berilgan sana', 'Keyingi sana', 'Seriya', 'Shifokor', 'Bemor'];
    const rows = records.map((r) => [r.vaccineName, r.doseNumber, r.dateGiven, r.nextDoseDate ?? '', r.batchNumber ?? '', r.administeredBy ?? '', r.patientName]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'vaccinations.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  const filterTabs: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: tx.filterAll, count: records.length },
    { key: 'overdue', label: tx.filterOverdue, count: stats.overdue },
    { key: 'upcoming', label: tx.filterUpcoming, count: stats.upcoming },
    { key: 'completed', label: tx.filterCompleted, count: stats.completed },
  ];

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-green-600" />
            {tx.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{records.length} {tx.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
            <Printer className="w-3.5 h-3.5" />{tx.printBtn}
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
            <Download className="w-3.5 h-3.5" />{tx.exportBtn}
          </Button>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />{tx.addBtn}
          </Button>
        </div>
      </div>

      {/* Overdue alert */}
      {stats.overdue > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <p className="text-sm text-red-700 font-medium">{stats.overdue} {tx.overdueAlert}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: tx.total, value: stats.total, color: 'border-l-blue-400', textColor: 'text-blue-600', icon: Syringe },
          { label: tx.overdue, value: stats.overdue, color: 'border-l-red-400', textColor: 'text-red-600', icon: AlertTriangle },
          { label: tx.upcoming, value: stats.upcoming, color: 'border-l-yellow-400', textColor: 'text-yellow-600', icon: Clock },
          { label: tx.completed, value: stats.completed, color: 'border-l-green-400', textColor: 'text-green-600', icon: CheckCircle2 },
        ].map(({ label, value, color, textColor, icon: Icon }) => (
          <Card key={label} className={`border-l-4 ${color}`}>
            <CardContent className="p-3 flex items-center gap-3">
              <Icon className={`w-5 h-5 ${textColor} shrink-0`} />
              <div>
                <p className={`text-xl font-bold ${textColor}`}>{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* WHO Panel */}
      <Card className="border-blue-100 bg-blue-50/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <Info className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-sm text-blue-900">{tx.whoTitle}</p>
                <p className="text-xs text-blue-600">{tx.whoDesc}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-100" onClick={() => setShowWHO(!showWHO)}>
                <Activity className="w-3.5 h-3.5" />{tx.scheduleBtn}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showWHO ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>
          {showWHO && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { vaccine: 'BCG', schedule: 'Tug\'ilganda', age: '0' },
                { vaccine: 'Gepatit B (1)', schedule: 'Tug\'ilganda', age: '0' },
                { vaccine: 'Gepatit B (2)', schedule: '1 oy', age: '1' },
                { vaccine: 'DTP + Hib + Polio (1)', schedule: '2 oy', age: '2' },
                { vaccine: 'DTP + Hib + Polio (2)', schedule: '3 oy', age: '3' },
                { vaccine: 'DTP + Hib + Polio (3)', schedule: '4 oy', age: '4' },
                { vaccine: 'MMR (Qizamiq, Parotit, Qizilcha)', schedule: '12 oy', age: '12' },
                { vaccine: 'Gripp', schedule: 'Har yil', age: '≥6m' },
              ].map((item) => (
                <div key={item.vaccine} className="flex justify-between items-center py-1.5 px-3 bg-white rounded-lg border border-blue-100 text-xs">
                  <span className="font-medium text-slate-700">{item.vaccine}</span>
                  <span className="text-blue-600">{item.schedule}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add form */}
      {showForm && (
        <Card className="border-green-200 bg-green-50/10">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="w-4 h-4 text-green-600" />{tx.formTitle}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {isClinic && (
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">{tx.patientLabel}</label>
                  <Input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} placeholder="To'liq ism..." />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">{tx.vaccineLabel}</label>
                <select value={form.vaccineName} onChange={(e) => setForm({ ...form, vaccineName: e.target.value })} className="w-full h-10 rounded-md border border-input px-3 text-sm bg-background">
                  <option value="">— tanlang —</option>
                  {tx.vaccineTypes.map((v) => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">{tx.doseNumLabel}</label>
                <Input type="number" min="1" max="10" value={form.doseNumber} onChange={(e) => setForm({ ...form, doseNumber: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">{tx.givenDateLabel}</label>
                <Input type="date" value={form.dateGiven} onChange={(e) => setForm({ ...form, dateGiven: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">{tx.nextDateLabel} <span className="text-slate-400">({tx.optional})</span></label>
                <Input type="date" value={form.nextDoseDate} onChange={(e) => setForm({ ...form, nextDoseDate: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">{tx.batchLabel} <span className="text-slate-400">({tx.optional})</span></label>
                <Input value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} placeholder="Lot #" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">{tx.doctorLabel} <span className="text-slate-400">({tx.optional})</span></label>
                <Input value={form.administeredBy} onChange={(e) => setForm({ ...form, administeredBy: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">{tx.notesLabel} <span className="text-slate-400">({tx.optional})</span></label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Reaksiya, izoh..." />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-green-100">
              <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>{tx.cancelBtn}</Button>
              <Button size="sm" onClick={handleCreate} disabled={saving} className="gap-1.5">
                {saving ? tx.savingBtn : <><CheckCircle2 className="w-4 h-4" />{tx.saveBtn}</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search + Sort + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tx.searchPlaceholder} className="pl-9" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={sort} onChange={(e) => setSort(e.target.value as SortType)} className="h-10 rounded-md border border-input px-2 text-sm bg-background">
            <option value="new">{tx.sortNew}</option>
            <option value="old">{tx.sortOld}</option>
          </select>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {filterTabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              filter === key
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
            <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
              filter === key ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
            }`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
          <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="font-medium text-slate-700">{tx.emptyTitle}</p>
          <p className="text-sm text-slate-400 mt-1">{search ? tx.noRecords : tx.emptyDesc}</p>
          {!search && (
            <Button size="sm" className="mt-4 gap-1.5" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" />{tx.addBtn}
            </Button>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((r) => {
            const isOverdue = !!(r.nextDoseDate && r.nextDoseDate < today);
            const isUpcoming = !!(r.nextDoseDate && r.nextDoseDate >= today && getDaysRemaining(r.nextDoseDate) <= 30);
            const daysNum = r.nextDoseDate ? getDaysRemaining(r.nextDoseDate) : null;
            const expanded = expandedId === r.id;

            return (
              <Card key={r.id} className={`transition-all hover:shadow-sm cursor-pointer ${isOverdue ? 'border-red-200 bg-red-50/30' : isUpcoming ? 'border-yellow-200 bg-yellow-50/20' : ''}`}>
                <CardContent className="p-4">
                  <div
                    className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
                    onClick={() => setExpandedId(expanded ? null : (r.id ?? null))}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-slate-800">{r.vaccineName}</span>
                        <Badge variant="secondary" className="text-xs">{tx.doseLabel} #{r.doseNumber}</Badge>
                        {isOverdue && (
                          <Badge className="bg-red-100 text-red-700 border-red-200 text-xs gap-1">
                            <AlertTriangle className="w-3 h-3" />{tx.overdueTag}
                          </Badge>
                        )}
                        {isUpcoming && !isOverdue && (
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">{tx.upcomingTag}</Badge>
                        )}
                        {!r.nextDoseDate && (
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">{tx.completedTag}</Badge>
                        )}
                      </div>
                      {isClinic && r.patientName && (
                        <p className="text-sm text-slate-600 flex items-center gap-1.5 mb-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />{r.patientName}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />{tx.givenLabel}: {new Date(r.dateGiven).toLocaleDateString('ru-RU')}
                        </span>
                        {r.nextDoseDate && (
                          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : isUpcoming ? 'text-yellow-600 font-medium' : 'text-blue-600'}`}>
                            <Clock className="w-3 h-3" />
                            {tx.nextLabel}: {new Date(r.nextDoseDate).toLocaleDateString('ru-RU')}
                            {daysNum !== null && (
                              <span className="ml-1">
                                ({daysNum < 0 ? `${Math.abs(daysNum)} ${tx.daysOverdue}` : `${daysNum} ${tx.daysLeft}`})
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={(e) => { e.stopPropagation(); }}>
                        <FileText className="w-3 h-3" />{tx.certBtn}
                      </Button>
                      <TrendingUp className={`w-4 h-4 ${isOverdue ? 'text-red-400' : isUpcoming ? 'text-yellow-400' : 'text-green-400'}`} />
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {r.administeredBy && (
                        <div className="bg-slate-50 rounded-lg p-2">
                          <p className="text-slate-400 mb-0.5">{tx.doctorLabel}</p>
                          <p className="font-medium text-slate-700">{r.administeredBy}</p>
                        </div>
                      )}
                      {r.batchNumber && (
                        <div className="bg-slate-50 rounded-lg p-2">
                          <p className="text-slate-400 mb-0.5">{tx.batchLabel}</p>
                          <p className="font-mono font-medium text-slate-700">{r.batchNumber}</p>
                        </div>
                      )}
                      {r.notes && (
                        <div className="bg-slate-50 rounded-lg p-2 col-span-2 sm:col-span-1">
                          <p className="text-slate-400 mb-0.5">{tx.notesLabel}</p>
                          <p className="text-slate-700">{r.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
