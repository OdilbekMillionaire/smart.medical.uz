'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { PatientUser, DoctorUser } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  QrCode, Download, Printer, User, Calendar, Droplets, AlertTriangle,
  Pill, Share2, Shield, Clock, Copy, CheckCircle2, RefreshCw,
  Phone, Mail, Building2, Award,
} from 'lucide-react';

type LK = 'uz' | 'uz_cyrillic' | 'ru' | 'en' | 'kk';

const L: Record<LK, {
  title: string; subtitle: string; qrTitle: string; profileTitle: string;
  downloadBtn: string; printBtn: string; shareBtn: string; copyBtn: string;
  regenerateBtn: string; generating: string; generated: string;
  patientCard: string; doctorCard: string; clinicCard: string;
  dobLabel: string; bloodLabel: string; conditionsLabel: string;
  allergiesLabel: string; specializationLabel: string; categoryLabel: string;
  diplomaLabel: string; certExpiryLabel: string; phoneLabel: string;
  emailLabel: string; completeProfile: string; infoTitle: string;
  infoPoints: string[]; emergencyTag: string; verifiedTag: string;
  copiedMsg: string; sharedMsg: string; expiresLabel: string;
  lastUpdated: string; cardIdLabel: string; noMedicalInfo: string;
}> = {
  uz: {
    title: "QR Tibbiy Karta", subtitle: "Shaxsiy tibbiy ma'lumotlaringiz QR kod shaklida — tez ko'rik uchun",
    qrTitle: "QR Kod", profileTitle: "Profil ma'lumotlari",
    downloadBtn: "Yuklab olish", printBtn: "Chop etish", shareBtn: "Ulashish", copyBtn: "Nusxa",
    regenerateBtn: "Yangilash", generating: "QR kod yaratilmoqda...", generated: "QR kod tayyor",
    patientCard: "Bemor ma'lumotlari", doctorCard: "Shifokor kartasi", clinicCard: "Klinika kartasi",
    dobLabel: "Tug'ilgan", bloodLabel: "Qon guruhi", conditionsLabel: "Surunkali kasalliklar",
    allergiesLabel: "Allergiyalar", specializationLabel: "Mutaxassislik", categoryLabel: "Toifa",
    diplomaLabel: "Diplom raqami", certExpiryLabel: "Sertifikat tugaydi", phoneLabel: "Telefon",
    emailLabel: "E-pochta", completeProfile: "Profilni to'ldirish", infoTitle: "QR karta haqida",
    infoPoints: [
      "QR kodni skanerlaganingizda shifokorlar sizning tibbiy ma'lumotlaringizni ko'rishlari mumkin",
      "Faqat ko'rsatilgan ma'lumotlar saqlanadi — maxfiy ma'lumotlar kiritilmagan",
      "Shoshilinch holatlarda juda foydali — allergiya va qon guruhingizni ko'rsatadi",
      "QR kartani hamyoningizda yoki telefoningizda saqlang",
      "Ma'lumotlar yangilanganida QR kodni qayta yarating",
    ],
    emergencyTag: "Favqulodda holat", verifiedTag: "Tasdiqlangan",
    copiedMsg: "Ma'lumotlar nusxa ko'chirildi", sharedMsg: "Ulashish muvaffaqiyatli",
    expiresLabel: "Amal qilish muddati", lastUpdated: "Yangilangan", cardIdLabel: "Karta ID",
    noMedicalInfo: "Tibbiy ma'lumotlar profilga qo'shilmagan",
  },
  uz_cyrillic: {
    title: "QR Тиббий Карта", subtitle: "Шахсий тиббий маълумотларингиз QR код шаклида — тез кўрик учун",
    qrTitle: "QR Код", profileTitle: "Профил маълумотлари",
    downloadBtn: "Юклаб олиш", printBtn: "Чоп этиш", shareBtn: "Улашиш", copyBtn: "Нусха",
    regenerateBtn: "Янгилаш", generating: "QR код яратилмоқда...", generated: "QR код тайёр",
    patientCard: "Бемор маълумотлари", doctorCard: "Шифокор картаси", clinicCard: "Клиника картаси",
    dobLabel: "Туғилган", bloodLabel: "Қон гуруҳи", conditionsLabel: "Сурункали касалликлар",
    allergiesLabel: "Аллергиялар", specializationLabel: "Мутахассислик", categoryLabel: "Тоифа",
    diplomaLabel: "Диплом рақами", certExpiryLabel: "Сертификат тугайди", phoneLabel: "Телефон",
    emailLabel: "Э-почта", completeProfile: "Профилни тўлдириш", infoTitle: "QR карта ҳақида",
    infoPoints: [
      "QR кодни сканерлаганингизда шифокорлар сизнинг тиббий маълумотларингизни кўришлари мумкин",
      "Фақат кўрсатилган маълумотлар сақланади — махфий маълумотлар киритилмаган",
      "Шошилинч ҳолатларда жуда фойдали — аллергия ва қон гуруҳингизни кўрсатади",
      "QR картани ҳамёнингизда ёки телефонингизда сақланг",
      "Маълумотлар янгиланганида QR кодни қайта яратинг",
    ],
    emergencyTag: "Фавқулодда ҳолат", verifiedTag: "Тасдиқланган",
    copiedMsg: "Маълумотлар нусха кўчирилди", sharedMsg: "Улашиш муваффақиятли",
    expiresLabel: "Амал қилиш муддати", lastUpdated: "Янгиланган", cardIdLabel: "Карта ID",
    noMedicalInfo: "Тиббий маълумотлар профилга қўшилмаган",
  },
  ru: {
    title: "QR Медицинская карта", subtitle: "Ваши медицинские данные в QR-коде — для быстрого доступа",
    qrTitle: "QR-код", profileTitle: "Данные профиля",
    downloadBtn: "Скачать", printBtn: "Печать", shareBtn: "Поделиться", copyBtn: "Копировать",
    regenerateBtn: "Обновить", generating: "Генерация QR-кода...", generated: "QR-код готов",
    patientCard: "Данные пациента", doctorCard: "Карточка врача", clinicCard: "Карточка клиники",
    dobLabel: "Дата рождения", bloodLabel: "Группа крови", conditionsLabel: "Хронические заболевания",
    allergiesLabel: "Аллергии", specializationLabel: "Специализация", categoryLabel: "Категория",
    diplomaLabel: "Номер диплома", certExpiryLabel: "Сертификат до", phoneLabel: "Телефон",
    emailLabel: "Эл. почта", completeProfile: "Заполнить профиль", infoTitle: "О QR-карте",
    infoPoints: [
      "При сканировании QR-кода врачи могут просматривать ваши медицинские данные",
      "Сохраняются только указанные данные — конфиденциальная информация не включается",
      "Незаменима в экстренных ситуациях — показывает аллергии и группу крови",
      "Сохраните QR-карту в кошельке или на телефоне",
      "При обновлении данных перегенерируйте QR-код",
    ],
    emergencyTag: "Экстренный случай", verifiedTag: "Подтверждён",
    copiedMsg: "Данные скопированы", sharedMsg: "Успешно поделились",
    expiresLabel: "Действителен до", lastUpdated: "Обновлён", cardIdLabel: "ID карты",
    noMedicalInfo: "Медицинские данные не добавлены в профиль",
  },
  en: {
    title: "QR Medical Card", subtitle: "Your personal medical data in QR format — for quick access",
    qrTitle: "QR Code", profileTitle: "Profile information",
    downloadBtn: "Download", printBtn: "Print", shareBtn: "Share", copyBtn: "Copy",
    regenerateBtn: "Regenerate", generating: "Generating QR code...", generated: "QR code ready",
    patientCard: "Patient information", doctorCard: "Doctor card", clinicCard: "Clinic card",
    dobLabel: "Date of birth", bloodLabel: "Blood type", conditionsLabel: "Chronic conditions",
    allergiesLabel: "Allergies", specializationLabel: "Specialization", categoryLabel: "Category",
    diplomaLabel: "Diploma number", certExpiryLabel: "Certificate expires", phoneLabel: "Phone",
    emailLabel: "Email", completeProfile: "Complete profile", infoTitle: "About QR card",
    infoPoints: [
      "When scanned, doctors can access your medical information quickly",
      "Only displayed data is stored — sensitive information is not included",
      "Invaluable in emergencies — shows allergies and blood type instantly",
      "Keep the QR card in your wallet or saved on your phone",
      "Regenerate the QR code after updating your profile",
    ],
    emergencyTag: "Emergency", verifiedTag: "Verified",
    copiedMsg: "Data copied to clipboard", sharedMsg: "Shared successfully",
    expiresLabel: "Expires", lastUpdated: "Updated", cardIdLabel: "Card ID",
    noMedicalInfo: "No medical information added to profile",
  },
  kk: {
    title: "QR Медициналық Карта", subtitle: "Жеке медициналық деректеріңіз QR форматта — жылдам қол жеткізу үшін",
    qrTitle: "QR Код", profileTitle: "Профиль деректері",
    downloadBtn: "Жүктеу", printBtn: "Басып шығару", shareBtn: "Бөлісу", copyBtn: "Көшіру",
    regenerateBtn: "Жаңарту", generating: "QR код жасалуда...", generated: "QR код дайын",
    patientCard: "Науқас деректері", doctorCard: "Дәрігер картасы", clinicCard: "Клиника картасы",
    dobLabel: "Туылған күні", bloodLabel: "Қан тобы", conditionsLabel: "Созылмалы аурулар",
    allergiesLabel: "Аллергиялар", specializationLabel: "Мамандық", categoryLabel: "Санат",
    diplomaLabel: "Диплом нөмірі", certExpiryLabel: "Сертификат мерзімі", phoneLabel: "Телефон",
    emailLabel: "Эл. пошта", completeProfile: "Профильді толтыру", infoTitle: "QR карта туралы",
    infoPoints: [
      "QR кодты сканерлегенде дәрігерлер медициналық деректеріңізді қарай алады",
      "Тек көрсетілген деректер сақталады — құпия ақпарат кірмейді",
      "Шұғыл жағдайларда өте пайдалы — аллергия мен қан тобыңызды көрсетеді",
      "QR картаны әмияныңызда немесе телефоныңызда сақтаңыз",
      "Деректер жаңартылғанда QR кодты қайта жасаңыз",
    ],
    emergencyTag: "Шұғыл жағдай", verifiedTag: "Расталған",
    copiedMsg: "Деректер көшірілді", sharedMsg: "Бөлісу сәтті болды",
    expiresLabel: "Жарамды", lastUpdated: "Жаңартылды", cardIdLabel: "Карта ID",
    noMedicalInfo: "Медициналық деректер профильге қосылмаған",
  },
};

export default function QRCardPage() {
  const { user, userProfile, userRole } = useAuth();
  const { lang } = useLanguage();
  const tx = L[lang as LK] ?? L.uz;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [cardId] = useState(() => `SMA-${Date.now().toString(36).toUpperCase()}`);

  const patient = userProfile as PatientUser | null;
  const doctor = userProfile as DoctorUser | null;

  const cardData = userRole === 'patient'
    ? { type: 'patient_card', name: patient?.fullName ?? userProfile?.displayName ?? '', dob: patient?.dob ?? '', gender: patient?.gender ?? '', bloodType: patient?.bloodType ?? '', conditions: patient?.conditions?.join(', ') ?? '', allergies: patient?.allergies?.join(', ') ?? '', phone: patient?.phone ?? '', email: user?.email ?? '', cardId, platform: 'Smart Medical Association' }
    : userRole === 'doctor'
    ? { type: 'doctor_card', name: doctor?.fullName ?? userProfile?.displayName ?? '', specialization: doctor?.specialization ?? '', category: doctor?.category ?? '', diplomaNumber: doctor?.diplomaNumber ?? '', institution: doctor?.institution ?? '', certExpiry: doctor?.certExpiry ?? '', phone: doctor?.phone ?? '', email: user?.email ?? '', cardId, platform: 'Smart Medical Association' }
    : { type: 'user_card', name: userProfile?.displayName ?? '', email: user?.email ?? '', cardId, platform: 'Smart Medical Association' };

  const qrPayload = JSON.stringify(cardData);
  const name = cardData.name || userProfile?.displayName || user?.email || '';

  function generateQR() {
    if (!canvasRef.current) return;
    setQrGenerated(false);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const QRCode = require('qrcode');
    QRCode.toCanvas(canvasRef.current, qrPayload, {
      width: 240, margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }, (err: Error | null) => { if (!err) setQrGenerated(true); });
  }

  useEffect(() => { generateQR(); }, [qrPayload]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `sma-qr-${name.replace(/\s+/g, '-')}.png`;
    a.click();
    toast.success(tx.downloadBtn);
  }

  function handlePrint() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const imgUrl = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>QR — ${name}</title><style>body{font-family:sans-serif;display:flex;justify-content:center;padding:40px;background:#fff}.card{border:2px solid #e2e8f0;border-radius:16px;padding:32px;max-width:340px;text-align:center}.logo{font-size:11px;color:#64748b;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px}h2{margin:0 0 4px;font-size:18px;color:#0f172a}p{margin:2px 0;font-size:12px;color:#475569}img{margin:16px 0}.tag{display:inline-block;background:#f1f5f9;border-radius:4px;padding:2px 8px;font-size:10px;color:#334155;margin:2px}</style></head><body><div class="card"><div class="logo">Smart Medical Association</div><h2>${name}</h2><img src="${imgUrl}" width="200" height="200"/><p style="font-size:10px;color:#94a3b8">QR kodni skanerlang</p><p style="font-size:10px;color:#94a3b8">ID: ${cardId}</p></div></body></html>`);
    win.document.close(); win.focus(); win.print();
  }

  function handleCopy() {
    navigator.clipboard.writeText(qrPayload).then(() => toast.success(tx.copiedMsg));
  }

  const certExpired = userRole === 'doctor' && doctor?.certExpiry && new Date(doctor.certExpiry) < new Date();
  const hasEmergencyInfo = userRole === 'patient' && patient && (patient.bloodType || (patient.allergies && patient.allergies.length > 0));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <QrCode className="w-6 h-6 text-blue-600" />{tx.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{tx.subtitle}</p>
        </div>
        {hasEmergencyInfo && (
          <Badge className="bg-red-100 text-red-700 border-red-200 gap-1.5 py-1 px-3">
            <AlertTriangle className="w-3.5 h-3.5" />{tx.emergencyTag}
          </Badge>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* QR Code card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-600">{tx.qrTitle}</CardTitle>
            {qrGenerated && (
              <Badge className="bg-green-100 text-green-700 text-xs gap-1">
                <CheckCircle2 className="w-3 h-3" />{tx.generated}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-inner relative">
              <canvas ref={canvasRef} className="rounded-lg" />
              {!qrGenerated && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <RefreshCw className="w-4 h-4 animate-spin" />{tx.generating}
                  </div>
                </div>
              )}
            </div>

            <div className="text-center space-y-1">
              <p className="text-xs font-mono text-slate-400">{tx.cardIdLabel}: {cardId}</p>
              <p className="text-xs text-slate-400">{tx.lastUpdated}: {new Date().toLocaleDateString('ru-RU')}</p>
            </div>

            {qrGenerated && (
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleDownload}>
                  <Download className="w-3.5 h-3.5" />{tx.downloadBtn}
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handlePrint}>
                  <Printer className="w-3.5 h-3.5" />{tx.printBtn}
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleCopy}>
                  <Copy className="w-3.5 h-3.5" />{tx.copyBtn}
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => toast.info(tx.shareBtn)}>
                  <Share2 className="w-3.5 h-3.5" />{tx.shareBtn}
                </Button>
              </div>
            )}

            <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs text-slate-400" onClick={generateQR}>
              <RefreshCw className="w-3.5 h-3.5" />{tx.regenerateBtn}
            </Button>
          </CardContent>
        </Card>

        {/* Profile summary */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-600">
              {userRole === 'patient' ? tx.patientCard : userRole === 'doctor' ? tx.doctorCard : tx.clinicCard}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Identity */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0 text-white font-bold text-lg">
                {name.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 truncate">{name}</p>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                  <Mail className="w-3 h-3" />{user?.email}
                </div>
              </div>
            </div>

            {/* Patient info */}
            {userRole === 'patient' && patient && (
              <div className="space-y-2">
                {patient.dob && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{tx.dobLabel}: <span className="font-medium">{patient.dob}</span></span>
                  </div>
                )}
                {patient.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{patient.phone}</span>
                  </div>
                )}
                {patient.bloodType && (
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-red-500 shrink-0" />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">{tx.bloodLabel}:</span>
                      <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg text-sm border border-red-100">{patient.bloodType}</span>
                    </div>
                  </div>
                )}
                {patient.conditions && patient.conditions.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 flex items-center gap-1"><Pill className="w-3 h-3 text-orange-400" />{tx.conditionsLabel}</p>
                    <div className="flex flex-wrap gap-1">
                      {patient.conditions.map((c, i) => (
                        <span key={i} className="bg-orange-50 text-orange-700 text-xs rounded-full px-2 py-0.5 border border-orange-100">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                {patient.allergies && patient.allergies.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{tx.allergiesLabel}</p>
                    <div className="flex flex-wrap gap-1">
                      {patient.allergies.map((a, i) => (
                        <span key={i} className="bg-red-50 text-red-700 text-xs rounded-full px-2 py-0.5 border border-red-100">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
                {!patient.bloodType && !patient.conditions?.length && !patient.allergies?.length && (
                  <div className="text-center py-4 border border-dashed rounded-xl">
                    <p className="text-xs text-slate-400">{tx.noMedicalInfo}</p>
                    <Button variant="link" size="sm" className="text-blue-600 text-xs mt-1" onClick={() => window.location.href = '/dashboard/profile'}>
                      {tx.completeProfile}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Doctor info */}
            {userRole === 'doctor' && doctor && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    { label: tx.specializationLabel, value: doctor.specialization, icon: <Stethoscope className="w-3.5 h-3.5 text-slate-400" /> },
                    { label: tx.categoryLabel, value: doctor.category, icon: <Award className="w-3.5 h-3.5 text-slate-400" /> },
                    { label: tx.diplomaLabel, value: doctor.diplomaNumber, icon: <Shield className="w-3.5 h-3.5 text-slate-400" /> },
                    { label: tx.certExpiryLabel, value: doctor.certExpiry, icon: <Clock className="w-3.5 h-3.5 text-slate-400" /> },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="bg-slate-50 rounded-lg p-2.5">
                      <div className="flex items-center gap-1 text-xs text-slate-400 mb-0.5">{icon}{label}</div>
                      <p className={`font-medium text-sm ${label === tx.certExpiryLabel && certExpired ? 'text-red-600' : 'text-slate-700'}`}>{value || '—'}</p>
                    </div>
                  ))}
                </div>
                {doctor.institution && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-2.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{doctor.institution}</span>
                  </div>
                )}
                {certExpired && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-center gap-2 text-xs text-red-700">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Sertifikat muddati o&apos;tib ketgan — yangilang!
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />{tx.infoTitle}
          </p>
          <ul className="space-y-1.5">
            {tx.infoPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-blue-700">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" />
                {point}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Stethoscope({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.5 8.5C4.5 6 6.5 4 9 4s4.5 2 4.5 4.5v5A6.5 6.5 0 0 1 7 20a6.5 6.5 0 0 1-6.5-6.5" /><circle cx="19" cy="17" r="3" /><path d="M13.5 13.5a6 6 0 0 0 2.5 3.5" /></svg>;
}
