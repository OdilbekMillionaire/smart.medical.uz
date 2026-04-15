'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Video, Calendar, Phone, Users, Maximize2, Minimize2, X,
  Clock, Copy, Link2, MessageSquare, Shield, Mic, MicOff,
  VideoOff, Settings, Star, CheckCircle2, Plus, Search,
} from 'lucide-react';

type LK = 'uz' | 'uz_cyrillic' | 'ru' | 'en' | 'kk';

const L: Record<LK, {
  title: string; subtitle: string; newMeetingBtn: string; joinBtn: string;
  pendingTitle: string; historyTitle: string; quickCallTitle: string; quickCallDesc: string;
  callBtn: string; liveLabel: string; minimizeBtn: string; maximizeBtn: string;
  endBtn: string; copyLinkBtn: string; linkCopied: string; patientLabel: string;
  todayLabel: string; durationLabel: string; statusScheduled: string;
  statusCompleted: string; statusMissed: string; statsTitle: string;
  totalCalls: string; avgDuration: string; rating: string; upcoming: string;
  joinRoomBtn: string; roomPlaceholder: string; securityNote: string;
  noScheduled: string; featureTitle: string; featureDesc: string;
  features: { icon: string; title: string; desc: string }[];
}> = {
  uz: {
    title: "Telemeditsina va Konsultatsiya", subtitle: "Bemorlar bilan masofaviy, xavfsiz video aloqa",
    newMeetingBtn: "Yangi uchrashuv", joinBtn: "Qo'shilish", pendingTitle: "Rejalashtirilgan konsultatsiyalar",
    historyTitle: "Konsultatsiya tarixi", quickCallTitle: "Tezkor chaqiruv",
    quickCallDesc: "Navbatdan tashqari uchrashuv uchun bemorni chaqirish",
    callBtn: "Chaqiruv yuborish", liveLabel: "JONLI", minimizeBtn: "Kichraytirish",
    maximizeBtn: "Kattalashtirish", endBtn: "Tugatish", copyLinkBtn: "Havolani nusxalash",
    linkCopied: "Havola nusxalandi!", patientLabel: "Bemor", todayLabel: "Bugun",
    durationLabel: "Davomiylik", statusScheduled: "Rejalashtirilgan",
    statusCompleted: "Yakunlandi", statusMissed: "O'tkazib yuborilgan",
    statsTitle: "Statistika", totalCalls: "Jami qo'ng'iroqlar", avgDuration: "O'rtacha davomiylik",
    rating: "Reyting", upcoming: "Yaqin", joinRoomBtn: "Xonaga qo'shilish",
    roomPlaceholder: "Xona kodi...", securityNote: "Barcha sessiyalar shifrlangan va xavfsiz",
    noScheduled: "Rejalashtirilgan konsultatsiyalar yo'q",
    featureTitle: "Platformamiz imkoniyatlari",
    featureDesc: "Tibbiy video konsultatsiya uchun zamonaviy yechim",
    features: [
      { icon: "🔒", title: "End-to-end shifrlash", desc: "Barcha sessiyalar to'liq himoyalangan" },
      { icon: "📱", title: "Qurilmadan mustaqil", desc: "Telefon, planshet, kompyuter" },
      { icon: "⚡", title: "HD sifat", desc: "720p va undan yuqori sifatda video" },
      { icon: "📋", title: "Avtomatik yozuv", desc: "Konsultatsiya xulosasi avtomatik saqlanadi" },
    ],
  },
  uz_cyrillic: {
    title: "Телемедицина ва Консультация", subtitle: "Беморлар билан масофавий, хавфсиз видео алоқа",
    newMeetingBtn: "Янги учрашув", joinBtn: "Қўшилиш", pendingTitle: "Режалаштирилган консультациялар",
    historyTitle: "Консультация тарихи", quickCallTitle: "Тезкор чақирув",
    quickCallDesc: "Навбатдан ташқари учрашув учун беморни чақириш",
    callBtn: "Чақирув юбориш", liveLabel: "ЖОНЛИ", minimizeBtn: "Кичрайтириш",
    maximizeBtn: "Катталаштириш", endBtn: "Тугатиш", copyLinkBtn: "Ҳаволани нусхалаш",
    linkCopied: "Ҳавола нусхаланди!", patientLabel: "Бемор", todayLabel: "Бугун",
    durationLabel: "Давомийлик", statusScheduled: "Режалаштирилган",
    statusCompleted: "Якунланди", statusMissed: "Ўтказиб юборилган",
    statsTitle: "Статистика", totalCalls: "Жами қўнғироқлар", avgDuration: "Ўртача давомийлик",
    rating: "Рейтинг", upcoming: "Яқин", joinRoomBtn: "Хонага қўшилиш",
    roomPlaceholder: "Хона коди...", securityNote: "Барча сессиялар шифрланган ва хавфсиз",
    noScheduled: "Режалаштирилган консультациялар йўқ",
    featureTitle: "Платформамиз имкониятлари",
    featureDesc: "Тиббий видео консультация учун замонавий ечим",
    features: [
      { icon: "🔒", title: "End-to-end шифрлаш", desc: "Барча сессиялар тўлиқ ҳимояланган" },
      { icon: "📱", title: "Қурилмадан мустақил", desc: "Телефон, планшет, компьютер" },
      { icon: "⚡", title: "HD сифат", desc: "720p ва ундан юқори сифатда видео" },
      { icon: "📋", title: "Автоматик ёзув", desc: "Консультация хулосаси автоматик сақланади" },
    ],
  },
  ru: {
    title: "Телемедицина и консультации", subtitle: "Безопасная видеосвязь с пациентами на расстоянии",
    newMeetingBtn: "Новая встреча", joinBtn: "Подключиться", pendingTitle: "Запланированные консультации",
    historyTitle: "История консультаций", quickCallTitle: "Быстрый звонок",
    quickCallDesc: "Вызов пациента вне очереди для внеплановой консультации",
    callBtn: "Позвонить", liveLabel: "В ЭФИРЕ", minimizeBtn: "Свернуть",
    maximizeBtn: "Развернуть", endBtn: "Завершить", copyLinkBtn: "Копировать ссылку",
    linkCopied: "Ссылка скопирована!", patientLabel: "Пациент", todayLabel: "Сегодня",
    durationLabel: "Длительность", statusScheduled: "Запланировано",
    statusCompleted: "Завершено", statusMissed: "Пропущено",
    statsTitle: "Статистика", totalCalls: "Всего звонков", avgDuration: "Среднее время", rating: "Рейтинг",
    upcoming: "Ближайшие", joinRoomBtn: "Войти в комнату",
    roomPlaceholder: "Код комнаты...", securityNote: "Все сессии зашифрованы и безопасны",
    noScheduled: "Нет запланированных консультаций",
    featureTitle: "Возможности платформы",
    featureDesc: "Современное решение для медицинских видеоконсультаций",
    features: [
      { icon: "🔒", title: "Сквозное шифрование", desc: "Все сессии полностью защищены" },
      { icon: "📱", title: "Кроссплатформенность", desc: "Телефон, планшет, компьютер" },
      { icon: "⚡", title: "HD качество", desc: "Видео 720p и выше" },
      { icon: "📋", title: "Автозапись", desc: "Итоги консультации сохраняются автоматически" },
    ],
  },
  en: {
    title: "Telemedicine & Consultation", subtitle: "Secure remote video consultations with patients",
    newMeetingBtn: "New meeting", joinBtn: "Join", pendingTitle: "Scheduled consultations",
    historyTitle: "Consultation history", quickCallTitle: "Quick call",
    quickCallDesc: "Call a patient outside of schedule for an impromptu consultation",
    callBtn: "Call patient", liveLabel: "LIVE", minimizeBtn: "Minimize",
    maximizeBtn: "Maximize", endBtn: "End call", copyLinkBtn: "Copy link",
    linkCopied: "Link copied!", patientLabel: "Patient", todayLabel: "Today",
    durationLabel: "Duration", statusScheduled: "Scheduled",
    statusCompleted: "Completed", statusMissed: "Missed",
    statsTitle: "Statistics", totalCalls: "Total calls", avgDuration: "Avg duration", rating: "Rating",
    upcoming: "Upcoming", joinRoomBtn: "Join room",
    roomPlaceholder: "Room code...", securityNote: "All sessions are encrypted and secure",
    noScheduled: "No scheduled consultations",
    featureTitle: "Platform features",
    featureDesc: "A modern solution for medical video consultations",
    features: [
      { icon: "🔒", title: "End-to-end encryption", desc: "All sessions are fully protected" },
      { icon: "📱", title: "Any device", desc: "Phone, tablet, computer" },
      { icon: "⚡", title: "HD quality", desc: "Video at 720p and above" },
      { icon: "📋", title: "Auto summary", desc: "Consultation notes saved automatically" },
    ],
  },
  kk: {
    title: "Телемедицина және Кеңес", subtitle: "Науқастармен қашықтан қауіпсіз бейнебайланыс",
    newMeetingBtn: "Жаңа кездесу", joinBtn: "Қосылу", pendingTitle: "Жоспарланған кеңестер",
    historyTitle: "Кеңес тарихы", quickCallTitle: "Жылдам қоңырау",
    quickCallDesc: "Кезектен тыс кеңес үшін науқасты шақыру",
    callBtn: "Қоңырау жіберу", liveLabel: "ТІКЕЛЕЙ", minimizeBtn: "Кішірейту",
    maximizeBtn: "Үлкейту", endBtn: "Аяқтау", copyLinkBtn: "Сілтемені көшіру",
    linkCopied: "Сілтеме көшірілді!", patientLabel: "Науқас", todayLabel: "Бүгін",
    durationLabel: "Ұзақтығы", statusScheduled: "Жоспарланған",
    statusCompleted: "Аяқталды", statusMissed: "Өткізіп алынды",
    statsTitle: "Статистика", totalCalls: "Барлық қоңыраулар", avgDuration: "Орташа ұзақтық", rating: "Рейтинг",
    upcoming: "Жақын", joinRoomBtn: "Бөлмеге кіру",
    roomPlaceholder: "Бөлме коды...", securityNote: "Барлық сессиялар шифрланған және қауіпсіз",
    noScheduled: "Жоспарланған кеңестер жоқ",
    featureTitle: "Платформа мүмкіндіктері",
    featureDesc: "Медициналық бейне кеңестерге арналған заманауи шешім",
    features: [
      { icon: "🔒", title: "Ұшыра-ұшыра шифрлау", desc: "Барлық сессиялар толық қорғалған" },
      { icon: "📱", title: "Кез келген құрылғы", desc: "Телефон, планшет, компьютер" },
      { icon: "⚡", title: "HD сапа", desc: "720p және одан жоғары бейне" },
      { icon: "📋", title: "Авто жазба", desc: "Кеңес қорытындысы автоматты сақталады" },
    ],
  },
};

const SCHEDULED_CONSULTATIONS = [
  { id: 1, patient: 'Azimov Jahongir', time: '14:00', duration: '30 min', type: 'video', status: 'scheduled', room: 'sma-patient-2049' },
  { id: 2, patient: 'Toshmatova Dilnoza', time: '15:30', duration: '20 min', type: 'video', status: 'scheduled', room: 'sma-patient-2050' },
];
const HISTORY_CONSULTATIONS = [
  { id: 3, patient: 'Karimov Behruz', time: 'Kecha 11:00', duration: '45 min', type: 'video', status: 'completed', rating: 5 },
  { id: 4, patient: 'Yusupova Malika', time: 'Kecha 16:00', duration: '—', type: 'video', status: 'missed' },
  { id: 5, patient: 'Raxmatullayev Otabek', time: '2 kun oldin', duration: '25 min', type: 'video', status: 'completed', rating: 4 },
];

export default function TelemedicinePage() {
  const { lang } = useLanguage();
  const { user, userProfile } = useAuth();
  const tx = L[lang as LK] ?? L.uz;

  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [roomInput, setRoomInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const startMeeting = (roomName?: string) => {
    const room = roomName || `sma-consult-${Math.random().toString(36).substring(7)}`;
    setActiveRoom(room);
    setIsMinimized(false);
  };

  const endMeeting = () => { setActiveRoom(null); setIsMinimized(false); };

  const copyRoomLink = () => {
    if (!activeRoom) return;
    navigator.clipboard.writeText(`https://meet.jit.si/${activeRoom}`);
    toast.success(tx.linkCopied);
  };

  const userInfoParam = userProfile?.displayName || user?.displayName
    ? `userInfo.displayName="${encodeURIComponent((userProfile?.displayName || user?.displayName) as string)}"`
    : '';
  const jitsiUrlProps = ['config.disableDeepLinking=true', 'config.prejoinPageEnabled=false', userInfoParam].filter(Boolean).join('&');

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="w-6 h-6 text-blue-600" />{tx.title}
          </h1>
          <p className="text-sm text-muted-foreground">{tx.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Input value={roomInput} onChange={(e) => setRoomInput(e.target.value)} placeholder={tx.roomPlaceholder} className="w-36 h-9 text-sm" />
            <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={() => { if (roomInput) startMeeting(roomInput); }}>
              <Link2 className="w-3.5 h-3.5" />{tx.joinRoomBtn}
            </Button>
          </div>
          <Button onClick={() => startMeeting()} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Video className="w-4 h-4" />{tx.newMeetingBtn}
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: tx.totalCalls, value: '142', icon: <Video className="w-4 h-4 text-blue-500" />, bg: 'bg-blue-50' },
          { label: tx.avgDuration, value: '28 min', icon: <Clock className="w-4 h-4 text-purple-500" />, bg: 'bg-purple-50' },
          { label: tx.rating, value: '4.8 ★', icon: <Star className="w-4 h-4 text-yellow-500" />, bg: 'bg-yellow-50' },
          { label: tx.upcoming, value: '2', icon: <Calendar className="w-4 h-4 text-green-500" />, bg: 'bg-green-50' },
        ].map(({ label, value, icon, bg }) => (
          <Card key={label} className={`${bg} border-0`}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="shrink-0">{icon}</div>
              <div>
                <p className="text-lg font-bold text-slate-800">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="md:col-span-2 space-y-5">
          {/* Scheduled */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />{tx.pendingTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {SCHEDULED_CONSULTATIONS.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">{tx.noScheduled}</div>
              ) : (
                SCHEDULED_CONSULTATIONS.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-4 border rounded-xl bg-blue-50/30 border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{c.patient}</p>
                        <p className="text-sm text-slate-500 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" />{tx.todayLabel}, {c.time}
                          <span className="text-slate-300">·</span>
                          {c.duration}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">{tx.statusScheduled}</Badge>
                      <Button onClick={() => startMeeting(c.room)} size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5">
                        <Video className="w-3.5 h-3.5" />{tx.joinBtn}
                      </Button>
                    </div>
                  </div>
                ))
              )}
              <Button variant="outline" size="sm" className="w-full gap-1.5 text-slate-500 border-dashed">
                <Plus className="w-3.5 h-3.5" />Yangi uchrashuv rejalashtirish
              </Button>
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-400" />{tx.historyTitle}
                </CardTitle>
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {HISTORY_CONSULTATIONS.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{c.patient}</p>
                      <p className="text-xs text-slate-400">{c.time} · {c.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.status === 'completed' && <Badge className="bg-green-100 text-green-700 text-xs">{tx.statusCompleted}</Badge>}
                    {c.status === 'missed' && <Badge className="bg-red-100 text-red-700 text-xs">{tx.statusMissed}</Badge>}
                    {c.status === 'completed' && 'rating' in c && (
                      <span className="text-xs text-yellow-500">{'★'.repeat(c.rating as number)}</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick call */}
          <Card className="bg-slate-900 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-400" />{tx.quickCallTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-400">{tx.quickCallDesc}</p>
              <Button onClick={() => startMeeting()} className="w-full bg-green-500 hover:bg-green-600 gap-2">
                <Video className="w-4 h-4" />{tx.callBtn}
              </Button>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                <Shield className="w-3.5 h-3.5 text-green-400" />{tx.securityNote}
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{tx.featureTitle}</CardTitle>
              <p className="text-xs text-slate-400">{tx.featureDesc}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {tx.features.map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <span className="text-lg shrink-0">{f.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{f.title}</p>
                    <p className="text-xs text-slate-400">{f.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Video Call Overlay */}
      {activeRoom && (
        <div className={`transition-all duration-300 z-50 overflow-hidden shadow-2xl bg-black flex flex-col ${
          isMinimized ? 'fixed bottom-4 right-4 w-96 h-64 rounded-xl border border-slate-700' : 'fixed inset-0'
        }`}>
          {/* Header bar */}
          <div className="bg-slate-900 text-slate-200 px-4 py-2 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold tracking-wider">{tx.liveLabel}</span>
              <span className="text-xs text-slate-400 font-mono ml-2">{activeRoom}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:bg-slate-700" onClick={() => { copyRoomLink(); }}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:bg-slate-700" onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? <MicOff className="h-3.5 w-3.5 text-red-400" /> : <Mic className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:bg-slate-700" onClick={() => setIsVideoOff(!isVideoOff)}>
                {isVideoOff ? <VideoOff className="h-3.5 w-3.5 text-red-400" /> : <Video className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:bg-slate-700">
                <Settings className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:bg-slate-700" onClick={() => setIsMinimized(!isMinimized)}>
                {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:bg-red-600 hover:text-white" onClick={endMeeting}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Jitsi iframe */}
          <div className="flex-1 w-full bg-black">
            <iframe
              src={`https://meet.jit.si/${activeRoom}?${jitsiUrlProps}`}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-full border-0"
              title="Telemedicine Video Call"
            />
          </div>

          {/* Bottom bar */}
          {!isMinimized && (
            <div className="bg-slate-900 px-4 py-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />{tx.securityNote}
              </div>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 gap-1.5 h-8 text-xs" onClick={endMeeting}>
                <Phone className="w-3.5 h-3.5" />{tx.endBtn}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
