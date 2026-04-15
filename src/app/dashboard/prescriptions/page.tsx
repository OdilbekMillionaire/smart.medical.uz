'use client';

import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Pill, FileSignature, Clock, Plus, Trash2, Printer,
  CheckCircle2, Search, AlertCircle, Copy, Share2,
  ChevronDown, ChevronUp, X, Stethoscope, User,
  Calendar, ShieldAlert, Activity, FileText, QrCode,
} from 'lucide-react';

type LK = 'uz' | 'uz_cyrillic' | 'ru' | 'en' | 'kk';

const L: Record<LK, {
  title: string; subtitle: string; newBtn: string; confirmBtn: string;
  printBtn: string; copyBtn: string; shareBtn: string; resetBtn: string;
  patientLabel: string; diagnosisLabel: string; drugsLabel: string;
  drugName: string; dosage: string; frequency: string; duration: string;
  doctorNote: string; addRow: string; validityLabel: string;
  historyTitle: string; hoursAgo: string; daysAgo: string;
  successTitle: string; successDesc: string; qrBtn: string;
  requiredError: string; savedSuccess: string; copiedMsg: string;
  interactionTitle: string; interactionDesc: string;
  validityDays: { label: string; days: number }[];
  statusActive: string; statusExpired: string; statusUsed: string;
  searchPlaceholder: string; icdPlaceholder: string;
  emptyHistory: string; rxNumber: string; issuedOn: string;
  validUntil: string; prescribedBy: string; allergyWarning: string;
  allergyPlaceholder: string; drugPlaceholder: string; dosagePlaceholder: string;
  frequencyPlaceholder: string; durationPlaceholder: string; noteRequired: string;
}> = {
  uz: {
    title: "E-Retsept", subtitle: "Elektron retseptlar bazasi va yozish",
    newBtn: "Yangi retsept", confirmBtn: "Tasdiqlash va saqlash",
    printBtn: "Chop etish", copyBtn: "Nusxa ko'chirish", shareBtn: "Ulashish", resetBtn: "Yangi retsept",
    patientLabel: "Bemor ismi yoki JSHSHIR", diagnosisLabel: "Tashxis (ICD-10)",
    drugsLabel: "Dorilar ro'yxati", drugName: "Dori nomi", dosage: "Dozasi",
    frequency: "Qabul chastotasi", duration: "Davomiylik", doctorNote: "Shifokor ko'rsatmasi (ixtiyoriy)",
    addRow: "Yangi qator qo'shish", validityLabel: "Retsept amal qilish muddati",
    historyTitle: "Oxirgi retseptlar", hoursAgo: "soat oldin", daysAgo: "kun oldin",
    successTitle: "Retsept yaratildi!", successDesc: "Bemor elektron xabarnoma oldi. Dorixonada bemor ID orqali olishi mumkin.",
    qrBtn: "QR kod", requiredError: "Iltimos, dori nomini kiriting", savedSuccess: "Retsept saqlandi",
    copiedMsg: "Nusxa ko'chirildi", interactionTitle: "Dori o'zaro ta'siri",
    interactionDesc: "Muvofiqligi tekshirilmoqda...",
    validityDays: [{ label: "3 kun", days: 3 }, { label: "7 kun", days: 7 }, { label: "14 kun", days: 14 }, { label: "30 kun", days: 30 }],
    statusActive: "Faol", statusExpired: "Muddati o'tgan", statusUsed: "Ishlatilgan",
    searchPlaceholder: "Ismi, telefon yoki JSHSHIR...",
    icdPlaceholder: "Masalan: J03.9 - O'tkir tonzillit",
    emptyHistory: "Retsept tarixi yo'q", rxNumber: "Retsept raqami",
    issuedOn: "Berilgan sana", validUntil: "Amal qilish muddati",
    prescribedBy: "Yozgan shifokor", allergyWarning: "Allergiya ogohlantirishlari",
    allergyPlaceholder: "Allergiyalarni kiriting...", drugPlaceholder: "Masalan: Amoksitsillin 500mg",
    dosagePlaceholder: "Masalan: 1 kapsula", frequencyPlaceholder: "Kuniga 3 marta",
    durationPlaceholder: "7 kun", noteRequired: "Majburiy",
  },
  uz_cyrillic: {
    title: "Э-Рецепт", subtitle: "Электрон рецептлар базаси ва ёзиш",
    newBtn: "Янги рецепт", confirmBtn: "Тасдиқлаш ва сақлаш",
    printBtn: "Чоп этиш", copyBtn: "Нусха кўчириш", shareBtn: "Улашиш", resetBtn: "Янги рецепт",
    patientLabel: "Бемор исми ёки ЖШШИР", diagnosisLabel: "Ташхис (ICD-10)",
    drugsLabel: "Дорилар рўйхати", drugName: "Дори номи", dosage: "Дозаси",
    frequency: "Қабул частотаси", duration: "Давомийлик", doctorNote: "Шифокор кўрсатмаси (ихтиёрий)",
    addRow: "Янги қатор қўшиш", validityLabel: "Рецепт амал қилиш муддати",
    historyTitle: "Охирги рецептлар", hoursAgo: "соат олдин", daysAgo: "кун олдин",
    successTitle: "Рецепт яратилди!", successDesc: "Бемор электрон хабарнома олди. Дорихонада бемор ID орқали олиши мумкин.",
    qrBtn: "QR код", requiredError: "Илтимос, дори номини киритинг", savedSuccess: "Рецепт сақланди",
    copiedMsg: "Нусха кўчирилди", interactionTitle: "Дори ўзаро таъсири",
    interactionDesc: "Мувофиқлиги текширилмоқда...",
    validityDays: [{ label: "3 кун", days: 3 }, { label: "7 кун", days: 7 }, { label: "14 кун", days: 14 }, { label: "30 кун", days: 30 }],
    statusActive: "Фаол", statusExpired: "Муддати ўтган", statusUsed: "Ишлатилган",
    searchPlaceholder: "Исми, телефон ёки ЖШШИР...",
    icdPlaceholder: "Масалан: J03.9 - Ўткир тонзиллит",
    emptyHistory: "Рецепт тарихи йўқ", rxNumber: "Рецепт рақами",
    issuedOn: "Берилган сана", validUntil: "Амал қилиш муддати",
    prescribedBy: "Ёзган шифокор", allergyWarning: "Аллергия огоҳлантиришлари",
    allergyPlaceholder: "Аллергияларни киритинг...", drugPlaceholder: "Масалан: Амоксицилин 500мг",
    dosagePlaceholder: "Масалан: 1 капсула", frequencyPlaceholder: "Кунига 3 марта",
    durationPlaceholder: "7 кун", noteRequired: "Мажбурий",
  },
  ru: {
    title: "Э-Рецепт", subtitle: "База электронных рецептов и выписка",
    newBtn: "Новый рецепт", confirmBtn: "Подтвердить и сохранить",
    printBtn: "Печать", copyBtn: "Копировать", shareBtn: "Поделиться", resetBtn: "Новый рецепт",
    patientLabel: "Имя пациента или ПИНФЛ", diagnosisLabel: "Диагноз (МКБ-10)",
    drugsLabel: "Список препаратов", drugName: "Название препарата", dosage: "Доза",
    frequency: "Частота приёма", duration: "Длительность", doctorNote: "Примечания врача (необязательно)",
    addRow: "Добавить препарат", validityLabel: "Срок действия рецепта",
    historyTitle: "Последние рецепты", hoursAgo: "ч. назад", daysAgo: "дн. назад",
    successTitle: "Рецепт создан!", successDesc: "Пациент получил уведомление. Препараты можно получить в аптеке по ID пациента.",
    qrBtn: "QR-код", requiredError: "Укажите название препарата", savedSuccess: "Рецепт сохранён",
    copiedMsg: "Скопировано", interactionTitle: "Взаимодействие препаратов",
    interactionDesc: "Проверка совместимости...",
    validityDays: [{ label: "3 дня", days: 3 }, { label: "7 дней", days: 7 }, { label: "14 дней", days: 14 }, { label: "30 дней", days: 30 }],
    statusActive: "Активный", statusExpired: "Истёк", statusUsed: "Использован",
    searchPlaceholder: "Имя, телефон или ПИНФЛ...",
    icdPlaceholder: "Напр.: J03.9 - Острый тонзиллит",
    emptyHistory: "Нет истории рецептов", rxNumber: "Номер рецепта",
    issuedOn: "Дата выписки", validUntil: "Действителен до",
    prescribedBy: "Выписал врач", allergyWarning: "Предупреждения об аллергии",
    allergyPlaceholder: "Введите аллергии...", drugPlaceholder: "Напр.: Амоксициллин 500мг",
    dosagePlaceholder: "Напр.: 1 капсула", frequencyPlaceholder: "3 раза в день",
    durationPlaceholder: "7 дней", noteRequired: "Обязательно",
  },
  en: {
    title: "E-Prescription", subtitle: "Electronic prescription management and issuance",
    newBtn: "New prescription", confirmBtn: "Confirm & save",
    printBtn: "Print", copyBtn: "Copy", shareBtn: "Share", resetBtn: "New prescription",
    patientLabel: "Patient name or ID", diagnosisLabel: "Diagnosis (ICD-10)",
    drugsLabel: "Medication list", drugName: "Drug name", dosage: "Dose",
    frequency: "Frequency", duration: "Duration", doctorNote: "Doctor's notes (optional)",
    addRow: "Add medication", validityLabel: "Prescription validity",
    historyTitle: "Recent prescriptions", hoursAgo: "hrs ago", daysAgo: "days ago",
    successTitle: "Prescription created!", successDesc: "Patient has been notified. Medications can be collected from the pharmacy using patient ID.",
    qrBtn: "QR code", requiredError: "Please enter drug name", savedSuccess: "Prescription saved",
    copiedMsg: "Copied to clipboard", interactionTitle: "Drug interactions",
    interactionDesc: "Checking compatibility...",
    validityDays: [{ label: "3 days", days: 3 }, { label: "7 days", days: 7 }, { label: "14 days", days: 14 }, { label: "30 days", days: 30 }],
    statusActive: "Active", statusExpired: "Expired", statusUsed: "Used",
    searchPlaceholder: "Name, phone or ID...",
    icdPlaceholder: "E.g.: J03.9 - Acute tonsillitis",
    emptyHistory: "No prescription history", rxNumber: "Rx number",
    issuedOn: "Issued on", validUntil: "Valid until",
    prescribedBy: "Prescribed by", allergyWarning: "Allergy warnings",
    allergyPlaceholder: "Enter known allergies...", drugPlaceholder: "E.g.: Amoxicillin 500mg",
    dosagePlaceholder: "E.g.: 1 capsule", frequencyPlaceholder: "3 times daily",
    durationPlaceholder: "7 days", noteRequired: "Required",
  },
  kk: {
    title: "Э-Рецепт", subtitle: "Электрондық рецепт базасы және жазу",
    newBtn: "Жаңа рецепт", confirmBtn: "Растау және сақтау",
    printBtn: "Басып шығару", copyBtn: "Көшіру", shareBtn: "Бөлісу", resetBtn: "Жаңа рецепт",
    patientLabel: "Науқас аты немесе ЖСШТ", diagnosisLabel: "Диагноз (ICD-10)",
    drugsLabel: "Дәрілер тізімі", drugName: "Дәрі аты", dosage: "Дозасы",
    frequency: "Қабылдау жиілігі", duration: "Ұзақтығы", doctorNote: "Дәрігер жазбасы (міндетті емес)",
    addRow: "Жаңа жол қосу", validityLabel: "Рецепт жарамдылық мерзімі",
    historyTitle: "Соңғы рецепттер", hoursAgo: "сағ. бұрын", daysAgo: "күн бұрын",
    successTitle: "Рецепт жасалды!", successDesc: "Науқас хабарландыру алды. Дәрілерді дәріхана науқас ID арқылы береді.",
    qrBtn: "QR код", requiredError: "Дәрі атын енгізіңіз", savedSuccess: "Рецепт сақталды",
    copiedMsg: "Көшірілді", interactionTitle: "Дәрілер өзара әсері",
    interactionDesc: "Үйлесімділік тексерілуде...",
    validityDays: [{ label: "3 күн", days: 3 }, { label: "7 күн", days: 7 }, { label: "14 күн", days: 14 }, { label: "30 күн", days: 30 }],
    statusActive: "Белсенді", statusExpired: "Мерзімі өткен", statusUsed: "Пайдаланылған",
    searchPlaceholder: "Аты, телефон немесе ЖСШТ...",
    icdPlaceholder: "Мыс.: J03.9 - Жедел тонзиллит",
    emptyHistory: "Рецепт тарихы жоқ", rxNumber: "Рецепт нөмірі",
    issuedOn: "Берілген күн", validUntil: "Жарамды",
    prescribedBy: "Жазған дәрігер", allergyWarning: "Аллергия ескертулері",
    allergyPlaceholder: "Аллергияларды енгізіңіз...", drugPlaceholder: "Мыс.: Амоксициллин 500мг",
    dosagePlaceholder: "Мыс.: 1 капсула", frequencyPlaceholder: "Күніне 3 рет",
    durationPlaceholder: "7 күн", noteRequired: "Міндетті",
  },
};

interface Drug {
  id: string; name: string; dosage: string; frequency: string; duration: string;
}

const MOCK_HISTORY = [
  { id: 'RX-2024-001', patient: 'Azimov Jahongir', diagnosis: 'J03.9', drugs: ['Amoksitsillin 500mg', 'Ibuprofen 400mg'], time: '2 soat', status: 'active' },
  { id: 'RX-2024-002', patient: 'Toshmatova Dilnoza', diagnosis: 'K29.7', drugs: ['Omeprazol 20mg', 'Metronidazol 500mg', 'De-Nol'], time: '5 soat', status: 'used' },
  { id: 'RX-2024-003', patient: 'Karimov Behruz', diagnosis: 'I10', drugs: ['Enalapril 10mg', 'Amlodipil 5mg'], time: '1 kun', status: 'active' },
];

export default function PrescriptionsPage() {
  const { lang } = useLanguage();
  const { userProfile } = useAuth();
  const tx = L[lang as LK] ?? L.uz;

  const [drugs, setDrugs] = useState<Drug[]>([{ id: '1', name: '', dosage: '', frequency: '', duration: '' }]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [rxId, setRxId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [doctorNote, setDoctorNote] = useState('');
  const [validity, setValidity] = useState(7);
  const [allergies, setAllergies] = useState('');
  const [showInteraction, setShowInteraction] = useState(false);
  const [expandedRx, setExpandedRx] = useState<string | null>(null);

  const addDrug = () => setDrugs([...drugs, { id: Math.random().toString(), name: '', dosage: '', frequency: '', duration: '' }]);
  const removeDrug = (id: string) => { if (drugs.length > 1) setDrugs(drugs.filter((d) => d.id !== id)); };
  const updateDrug = (id: string, field: keyof Drug, value: string) => setDrugs(drugs.map((d) => d.id === id ? { ...d, [field]: value } : d));

  const handleSubmit = useCallback(() => {
    if (drugs.some((d) => !d.name.trim())) { toast.error(tx.requiredError); return; }
    const id = `RX-${Date.now().toString().slice(-8)}`;
    setRxId(id);
    toast.success(tx.savedSuccess);
    setIsSubmitted(true);
  }, [drugs, tx]);

  const handleReset = () => {
    setDrugs([{ id: '1', name: '', dosage: '', frequency: '', duration: '' }]);
    setPatientSearch(''); setDiagnosis(''); setDoctorNote('');
    setAllergies(''); setValidity(7); setIsSubmitted(false); setRxId('');
  };

  const validUntilDate = new Date(Date.now() + validity * 86400000).toLocaleDateString('ru-RU');
  const doctorName = userProfile?.displayName ?? 'Dr. Unknown';

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Pill className="w-6 h-6 text-emerald-600" />{tx.title}
          </h1>
          <p className="text-sm text-muted-foreground">{tx.subtitle}</p>
        </div>
        {!isSubmitted && (
          <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <FileSignature className="w-4 h-4" />{tx.confirmBtn}
          </Button>
        )}
      </div>

      {isSubmitted ? (
        /* Success state */
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-emerald-800">{tx.successTitle}</h2>
                <p className="text-emerald-600 max-w-md mt-1 text-sm">{tx.successDesc}</p>
              </div>
              <div className="bg-white rounded-xl border border-emerald-100 p-4 w-full max-w-md text-left space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">{tx.rxNumber}</span><span className="font-mono font-bold text-emerald-700">{rxId}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">{tx.issuedOn}</span><span>{new Date().toLocaleDateString('ru-RU')}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">{tx.validUntil}</span><span className="text-orange-600 font-medium">{validUntilDate}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">{tx.prescribedBy}</span><span>{doctorName}</span></div>
              </div>
              <div className="flex gap-3 flex-wrap justify-center">
                <Button variant="outline" className="gap-1.5 bg-white" onClick={() => window.print()}><Printer className="w-4 h-4" />{tx.printBtn}</Button>
                <Button variant="outline" className="gap-1.5 bg-white" onClick={() => { navigator.clipboard.writeText(rxId); toast.success(tx.copiedMsg); }}><Copy className="w-4 h-4" />{tx.copyBtn}</Button>
                <Button variant="outline" className="gap-1.5 bg-white"><QrCode className="w-4 h-4" />{tx.qrBtn}</Button>
                <Button variant="outline" className="gap-1.5 bg-white"><Share2 className="w-4 h-4" />{tx.shareBtn}</Button>
                <Button onClick={handleReset} className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"><Plus className="w-4 h-4" />{tx.resetBtn}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-5">
            {/* Patient + Diagnosis */}
            <Card>
              <CardHeader className="bg-slate-50 border-b pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />{tx.patientLabel}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} placeholder={tx.searchPlaceholder} className="pl-9" />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder={tx.icdPlaceholder} className="pl-9" />
                  </div>
                </div>
                {/* Allergies warning */}
                <div className="sm:col-span-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-orange-700 mb-1">
                    <ShieldAlert className="w-3.5 h-3.5" />{tx.allergyWarning}
                  </div>
                  <Input value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder={tx.allergyPlaceholder} className="border-orange-200 focus:border-orange-400" />
                </div>
              </CardContent>
            </Card>

            {/* Drug list */}
            <Card>
              <CardHeader className="bg-slate-50 border-b pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Pill className="w-4 h-4 text-emerald-600" />{tx.drugsLabel}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowInteraction(!showInteraction)} className="gap-1 text-xs text-orange-600 hover:bg-orange-50">
                    <Activity className="w-3.5 h-3.5" />{tx.interactionTitle}
                    {showInteraction ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </Button>
                </div>
              </CardHeader>
              {showInteraction && (
                <div className="px-4 py-2 bg-orange-50 border-b border-orange-100 flex items-center gap-2 text-xs text-orange-700">
                  <AlertCircle className="w-3.5 h-3.5" />{tx.interactionDesc}
                </div>
              )}
              <CardContent className="pt-4 space-y-3">
                {/* Column headers */}
                <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-slate-400 px-1">
                  <span className="col-span-4">{tx.drugName} <span className="text-red-500">*</span></span>
                  <span className="col-span-2">{tx.dosage}</span>
                  <span className="col-span-3">{tx.frequency}</span>
                  <span className="col-span-2">{tx.duration}</span>
                  <span className="col-span-1"></span>
                </div>
                {drugs.map((drug, index) => (
                  <div key={drug.id} className="grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-12 sm:col-span-12 hidden sm:flex items-center text-xs text-slate-400 font-mono -mb-1">{index + 1}.</span>
                    <div className="col-span-12 sm:col-span-4">
                      <Input value={drug.name} onChange={(e) => updateDrug(drug.id, 'name', e.target.value)} placeholder={tx.drugPlaceholder} />
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      <Input value={drug.dosage} onChange={(e) => updateDrug(drug.id, 'dosage', e.target.value)} placeholder={tx.dosagePlaceholder} />
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                      <Input value={drug.frequency} onChange={(e) => updateDrug(drug.id, 'frequency', e.target.value)} placeholder={tx.frequencyPlaceholder} />
                    </div>
                    <div className="col-span-10 sm:col-span-2">
                      <Input value={drug.duration} onChange={(e) => updateDrug(drug.id, 'duration', e.target.value)} placeholder={tx.durationPlaceholder} />
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex justify-end">
                      <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500 h-9 w-9" onClick={() => removeDrug(drug.id)} disabled={drugs.length === 1}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addDrug} className="w-full border-dashed text-emerald-700 bg-emerald-50 hover:bg-emerald-100 gap-1.5">
                  <Plus className="w-3.5 h-3.5" />{tx.addRow}
                </Button>
              </CardContent>
            </Card>

            {/* Notes + Validity */}
            <Card>
              <CardContent className="pt-4 grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1.5 block">{tx.doctorNote}</label>
                  <Input value={doctorNote} onChange={(e) => setDoctorNote(e.target.value)} placeholder="..." />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1.5 block flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />{tx.validityLabel}
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {tx.validityDays.map(({ label, days }) => (
                      <button
                        key={days}
                        onClick={() => setValidity(days)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${validity === days ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 text-slate-600 hover:border-emerald-300'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">{tx.validUntil}: <span className="font-medium text-orange-600">{validUntilDate}</span></p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* History sidebar */}
          <div className="space-y-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />{tx.historyTitle}
            </h2>
            {MOCK_HISTORY.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">{tx.emptyHistory}</div>
            ) : (
              MOCK_HISTORY.map((rx) => (
                <Card key={rx.id} className="hover:border-emerald-200 transition-colors cursor-pointer" onClick={() => setExpandedRx(expandedRx === rx.id ? null : rx.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm text-slate-800">{rx.patient}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{rx.id}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={`text-xs ${rx.status === 'active' ? 'bg-green-100 text-green-700' : rx.status === 'used' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                          {rx.status === 'active' ? tx.statusActive : rx.status === 'used' ? tx.statusUsed : tx.statusExpired}
                        </Badge>
                        <span className="text-xs text-slate-400 flex items-center gap-0.5"><Clock className="w-3 h-3" />{rx.time}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {rx.drugs.slice(0, expandedRx === rx.id ? undefined : 2).map((d) => (
                        <span key={d} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border">{d}</span>
                      ))}
                      {rx.drugs.length > 2 && expandedRx !== rx.id && (
                        <span className="text-xs text-slate-400">+{rx.drugs.length - 2}</span>
                      )}
                    </div>
                    {expandedRx === rx.id && (
                      <div className="mt-2 pt-2 border-t text-xs text-slate-500 flex items-center gap-3">
                        <span>{tx.diagnosisLabel}: <span className="font-mono text-slate-700">{rx.diagnosis}</span></span>
                        <Button variant="ghost" size="sm" className="ml-auto h-6 px-2 text-xs" onClick={(e) => { e.stopPropagation(); toast.info(tx.printBtn); }}>
                          <Printer className="w-3 h-3 mr-1" />{tx.printBtn}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-slate-500" onClick={() => toast.info('...')}>
              <X className="w-3.5 h-3.5" />Barchasi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
