'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Settings, Globe, Palette, Bell, User, Lock,
  Sun, Moon, Monitor, Check, Eye, EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { getAuth } from 'firebase/auth';

const T = {
  uz: {
    title: 'Sozlamalar',
    subtitle: 'Profil, ko\'rinish va xabarnoma sozlamalari',
    language: 'Til',
    languageDesc: 'Interfeys tilini tanlang',
    appearance: 'Ko\'rinish',
    appearanceDesc: 'Mavzu va rang sxemasini tanlang',
    notifications: 'Xabarnomalar',
    notificationsDesc: 'Qaysi xabarnomalarni olishni tanlang',
    profile: 'Profil',
    profileDesc: 'Ko\'rsatiladigan ism va parolni o\'zgartirish',
    displayName: 'Ko\'rsatiladigan ism',
    displayNamePlaceholder: 'Ismingizni kiriting',
    saveDisplayName: 'Ismni saqlash',
    changePassword: 'Parolni o\'zgartirish',
    currentPassword: 'Joriy parol',
    newPassword: 'Yangi parol',
    confirmPassword: 'Parolni tasdiqlang',
    updatePassword: 'Parolni yangilash',
    light: 'Yorug\'',
    dark: 'Qorong\'u',
    system: 'Tizim',
    notifEmail: 'Email xabarnomalar',
    notifEmailDesc: 'Muddatlar va yangilanishlar haqida emaillar',
    notifBrowser: 'Brauzer bildirimshnomalar',
    notifBrowserDesc: 'Tezkor bildirishnomalar',
    notifDeadlines: 'Muddatlar eslatmalari',
    notifDeadlinesDesc: '7 va 30 kunlik muddatlar haqida',
    notifRequests: 'Yangi murojaatlar',
    notifRequestsDesc: 'Yangi so\'rovlar kelib tushganda',
    saved: 'Saqlandi',
    passwordUpdated: 'Parol yangilandi',
    passwordMismatch: 'Yangi parollar mos kelmayapti',
    passwordTooShort: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
    wrongPassword: 'Joriy parol noto\'g\'ri',
    error: 'Xato yuz berdi',
  },
  ru: {
    title: 'Настройки',
    subtitle: 'Профиль, внешний вид и уведомления',
    language: 'Язык',
    languageDesc: 'Выберите язык интерфейса',
    appearance: 'Внешний вид',
    appearanceDesc: 'Выберите тему и цветовую схему',
    notifications: 'Уведомления',
    notificationsDesc: 'Выберите какие уведомления получать',
    profile: 'Профиль',
    profileDesc: 'Изменить отображаемое имя и пароль',
    displayName: 'Отображаемое имя',
    displayNamePlaceholder: 'Введите ваше имя',
    saveDisplayName: 'Сохранить имя',
    changePassword: 'Изменить пароль',
    currentPassword: 'Текущий пароль',
    newPassword: 'Новый пароль',
    confirmPassword: 'Подтвердите пароль',
    updatePassword: 'Обновить пароль',
    light: 'Светлая',
    dark: 'Тёмная',
    system: 'Системная',
    notifEmail: 'Email уведомления',
    notifEmailDesc: 'Письма о дедлайнах и обновлениях',
    notifBrowser: 'Браузерные уведомления',
    notifBrowserDesc: 'Мгновенные уведомления',
    notifDeadlines: 'Напоминания о сроках',
    notifDeadlinesDesc: 'За 7 и 30 дней до дедлайна',
    notifRequests: 'Новые обращения',
    notifRequestsDesc: 'При поступлении новых запросов',
    saved: 'Сохранено',
    passwordUpdated: 'Пароль обновлён',
    passwordMismatch: 'Пароли не совпадают',
    passwordTooShort: 'Пароль должен быть не менее 6 символов',
    wrongPassword: 'Неверный текущий пароль',
    error: 'Произошла ошибка',
  },
  en: {
    title: 'Settings',
    subtitle: 'Profile, appearance and notification preferences',
    language: 'Language',
    languageDesc: 'Select the interface language',
    appearance: 'Appearance',
    appearanceDesc: 'Choose your theme and color scheme',
    notifications: 'Notifications',
    notificationsDesc: 'Choose which notifications to receive',
    profile: 'Profile',
    profileDesc: 'Update your display name and password',
    displayName: 'Display name',
    displayNamePlaceholder: 'Enter your name',
    saveDisplayName: 'Save name',
    changePassword: 'Change password',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    updatePassword: 'Update password',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    notifEmail: 'Email notifications',
    notifEmailDesc: 'Emails about deadlines and updates',
    notifBrowser: 'Browser notifications',
    notifBrowserDesc: 'Instant push notifications',
    notifDeadlines: 'Deadline reminders',
    notifDeadlinesDesc: '7 and 30-day deadline alerts',
    notifRequests: 'New requests',
    notifRequestsDesc: 'When new requests arrive',
    saved: 'Saved',
    passwordUpdated: 'Password updated',
    passwordMismatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 6 characters',
    wrongPassword: 'Current password is incorrect',
    error: 'An error occurred',
  },
  kk: {
    title: 'Parametrler',
    subtitle: 'Profil, kórinisi hám xabarlamalar',
    language: 'Til',
    languageDesc: 'Interfeys tilini tanlań',
    appearance: 'Kórinisi',
    appearanceDesc: 'Temaný hám reń sxemasın tanlań',
    notifications: 'Xabarlamalar',
    notificationsDesc: 'Qanday xabarlamalar alıwdı tanlań',
    profile: 'Profil',
    profileDesc: 'Atıńızdı hám paroldi ózgertińiz',
    displayName: 'Kórsatiletugın at',
    displayNamePlaceholder: 'Atıńızdı kiriting',
    saveDisplayName: 'Attı saqlań',
    changePassword: 'Paroldi ózgertińiz',
    currentPassword: 'Ǵárezetdegi parol',
    newPassword: 'Jańa parol',
    confirmPassword: 'Paroldi tastıyıqlań',
    updatePassword: 'Paroldi jańalaw',
    light: 'Járıq',
    dark: 'Qará',
    system: 'Sistema',
    notifEmail: 'Email xabarlamalar',
    notifEmailDesc: 'Muwametler hám jańalanıwlar',
    notifBrowser: 'Brauzer xabarlamalar',
    notifBrowserDesc: 'Tez xabarlamalar',
    notifDeadlines: 'Muwumet eslatpalari',
    notifDeadlinesDesc: '7 hám 30 kúnlik eslatpalar',
    notifRequests: 'Jańa múrájáatler',
    notifRequestsDesc: 'Jańa soraw kelgende',
    saved: 'Saqlandi',
    passwordUpdated: 'Parol jańalandi',
    passwordMismatch: 'Paroller sáykes kelmeyde',
    passwordTooShort: 'Parol kamida 6 belgeden ibarat bolıwı kerek',
    wrongPassword: 'Ǵárezetdegi parol nátuwrı',
    error: 'Qátelik júz berdi',
  },
  uz_cyrillic: {
    title: 'Созламалар',
    subtitle: 'Профил, кўриниш ва хабарнома созламалари',
    language: 'Тил',
    languageDesc: 'Интерфейс тилини танланг',
    appearance: 'Кўриниш',
    appearanceDesc: 'Мавзу ва ранг схемасини танланг',
    notifications: 'Хабарномалар',
    notificationsDesc: 'Қайси хабарномаларни олишни танланг',
    profile: 'Профил',
    profileDesc: 'Кўрсатиладиган исм ва паролни ўзгартириш',
    displayName: 'Кўрсатиладиган исм',
    displayNamePlaceholder: 'Исмингизни киритинг',
    saveDisplayName: 'Исмни сақлаш',
    changePassword: 'Паролни ўзгартириш',
    currentPassword: 'Жорий парол',
    newPassword: 'Янги парол',
    confirmPassword: 'Паролни тасдиқланг',
    updatePassword: 'Паролни янгилаш',
    light: 'Ёруғ',
    dark: 'Қоронғу',
    system: 'Тизим',
    notifEmail: 'Email хабарномалар',
    notifEmailDesc: 'Муддатлар ва янгиланишлар ҳақида имейллар',
    notifBrowser: 'Браузер билдиришномалар',
    notifBrowserDesc: 'Тезкор билдиришномалар',
    notifDeadlines: 'Муддатлар эслатмалари',
    notifDeadlinesDesc: '7 ва 30 кунлик муддатлар ҳақида',
    notifRequests: 'Янги мурожаатлар',
    notifRequestsDesc: 'Янги сўровлар келиб тушганда',
    saved: 'Сақланди',
    passwordUpdated: 'Парол янгиланди',
    passwordMismatch: 'Янги паролллар мос келмаяпти',
    passwordTooShort: 'Парол камида 6 та белгидан иборат бўлиши керак',
    wrongPassword: 'Жорий парол нотўғри',
    error: 'Хато юз берди',
  },
} as const;

type Lang = keyof typeof T;
type Theme = 'light' | 'dark' | 'system';

const LANG_OPTIONS: { value: string; label: string; native: string }[] = [
  { value: 'uz',          label: "O'zbek (Lotin)",   native: "O'zbek" },
  { value: 'uz_cyrillic', label: 'Ozbek (Kirill)',    native: 'Ўзбек' },
  { value: 'ru',          label: 'Русский',           native: 'Русский' },
  { value: 'en',          label: 'English',           native: 'English' },
  { value: 'kk',          label: 'Qazaq',             native: 'Қазақ' },
];

interface NotifPrefs {
  email: boolean;
  browser: boolean;
  deadlines: boolean;
  requests: boolean;
}

function SectionCard({ icon, title, desc, children }: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500">{desc}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${enabled ? 'bg-slate-900' : 'bg-slate-200'}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { lang: rawLang, setLang } = useLanguage();
  const lang = (rawLang as Lang) in T ? (rawLang as Lang) : 'uz';
  const t = T[lang];

  // Theme — default to light
  const [theme, setTheme] = useState<Theme>('light');

  // Display name
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [savingName, setSavingName] = useState(false);

  // Password
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  // Notifications
  const [notifs, setNotifs] = useState<NotifPrefs>({
    email: true,
    browser: false,
    deadlines: true,
    requests: true,
  });

  // Load persisted prefs — default to 'light' if nothing saved
  useEffect(() => {
    const saved = localStorage.getItem('sma_theme') as Theme | null;
    setTheme((saved === 'dark' || saved === 'system') ? saved : 'light');
    const savedNotifs = localStorage.getItem('sma_notifs');
    if (savedNotifs) {
      try { setNotifs(JSON.parse(savedNotifs)); } catch { /* ignore */ }
    }
    if (user?.displayName) setDisplayName(user.displayName);
  }, [user]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    localStorage.setItem('sma_theme', theme);
  }, [theme]);

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setSavingName(true);
    try {
      const auth = getAuth();
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: displayName.trim() });
      }
      toast.success(t.saved);
    } catch {
      toast.error(t.error);
    } finally {
      setSavingName(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPw !== confirmPw) { toast.error(t.passwordMismatch); return; }
    if (newPw.length < 6) { toast.error(t.passwordTooShort); return; }
    setSavingPw(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) throw new Error('no user');
      const credential = EmailAuthProvider.credential(currentUser.email, currentPw);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPw);
      toast.success(t.passwordUpdated);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        toast.error(t.wrongPassword);
      } else {
        toast.error(t.error);
      }
    } finally {
      setSavingPw(false);
    }
  };

  const toggleNotif = (key: keyof NotifPrefs) => {
    const next = { ...notifs, [key]: !notifs[key] };
    setNotifs(next);
    localStorage.setItem('sma_notifs', JSON.stringify(next));
    toast.success(t.saved);
  };

  const NOTIF_ITEMS: { key: keyof NotifPrefs; label: string; desc: string }[] = [
    { key: 'email',     label: t.notifEmail,     desc: t.notifEmailDesc },
    { key: 'browser',   label: t.notifBrowser,   desc: t.notifBrowserDesc },
    { key: 'deadlines', label: t.notifDeadlines, desc: t.notifDeadlinesDesc },
    { key: 'requests',  label: t.notifRequests,  desc: t.notifRequestsDesc },
  ];

  const THEMES: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light',  label: t.light,  icon: <Sun className="h-4 w-4" /> },
    { value: 'dark',   label: t.dark,   icon: <Moon className="h-4 w-4" /> },
    { value: 'system', label: t.system, icon: <Monitor className="h-4 w-4" /> },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
          <Settings className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t.title}</h1>
          <p className="text-sm text-slate-500">{t.subtitle}</p>
        </div>
      </div>

      {/* Language */}
      <SectionCard icon={<Globe className="h-4 w-4 text-indigo-600" />} title={t.language} desc={t.languageDesc}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {LANG_OPTIONS.map((opt) => {
            const isActive = rawLang === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => { setLang(opt.value as Lang); toast.success(t.saved); }}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="text-lg leading-none">{
                  opt.value === 'uz' ? '🇺🇿' :
                  opt.value === 'uz_cyrillic' ? '🇺🇿' :
                  opt.value === 'ru' ? '🇷🇺' :
                  opt.value === 'en' ? '🇬🇧' : '🇰🇿'
                }</span>
                <div>
                  <p className="text-xs font-semibold">{opt.native}</p>
                  <p className={`text-[10px] ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>{opt.label}</p>
                </div>
                {isActive && <Check className="h-3.5 w-3.5 ml-auto shrink-0" />}
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Appearance */}
      <SectionCard icon={<Palette className="h-4 w-4 text-pink-600" />} title={t.appearance} desc={t.appearanceDesc}>
        <div className="flex gap-2">
          {THEMES.map((th) => {
            const isActive = theme === th.value;
            return (
              <button
                key={th.value}
                onClick={() => setTheme(th.value)}
                className={`flex-1 flex flex-col items-center gap-2 rounded-lg border py-3 px-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {th.icon}
                <span>{th.label}</span>
                {isActive && <Check className="h-3 w-3" />}
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard icon={<Bell className="h-4 w-4 text-orange-500" />} title={t.notifications} desc={t.notificationsDesc}>
        <div className="space-y-4">
          {NOTIF_ITEMS.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <Toggle enabled={notifs[item.key]} onToggle={() => toggleNotif(item.key)} />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Profile — display name */}
      <SectionCard icon={<User className="h-4 w-4 text-blue-600" />} title={t.profile} desc={t.profileDesc}>
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t.displayName}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t.displayNamePlaceholder}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <button
                onClick={handleSaveName}
                disabled={savingName || !displayName.trim()}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                {savingName ? '...' : t.saveDisplayName}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* Change password */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-3">{t.changePassword}</p>
            <div className="space-y-2.5">
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder={t.currentPassword}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder={t.newPassword}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder={t.confirmPassword}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <button
                onClick={handleUpdatePassword}
                disabled={savingPw || !currentPw || !newPw || !confirmPw}
                className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <Lock className="h-3.5 w-3.5" />
                {savingPw ? '...' : t.updatePassword}
              </button>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
