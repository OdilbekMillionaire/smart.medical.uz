'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Bug, Zap, Shield, RefreshCw } from 'lucide-react';

interface ChangelogEntry {
  version: string;
  date: string;
  tag: 'yangi' | 'yaxshilash' | 'tuzatish' | 'xavfsizlik';
  changes: string[];
}

const TAG_META: Record<ChangelogEntry['tag'], { label: string; color: string; icon: React.ReactNode }> = {
  yangi:       { label: 'Yangi',        color: 'bg-green-100 text-green-700',  icon: <Sparkles className="w-3 h-3" /> },
  yaxshilash:  { label: 'Yaxshilash',   color: 'bg-blue-100 text-blue-700',    icon: <Zap className="w-3 h-3" /> },
  tuzatish:    { label: 'Tuzatish',     color: 'bg-orange-100 text-orange-700', icon: <Bug className="w-3 h-3" /> },
  xavfsizlik:  { label: 'Xavfsizlik',   color: 'bg-red-100 text-red-700',      icon: <Shield className="w-3 h-3" /> },
};

const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.5.0',
    date: '2026-04-06',
    tag: 'yangi',
    changes: [
      'Emlash ro\'yxati moduli qo\'shildi — bemorlar va klinikalar uchun',
      'Navbat jadvali: haftalik grid ko\'rinish va ro\'yxat ko\'rinish',
      'Moliya hisoboti: daromad/xarajat, 6 oylik trend grafigi, CSV eksport',
      'Yordam markazi: qidiruv, maqolalar, video darsliklar',
      'E\'lonlar taxtasi: muhimlik darajalari, pin qilish, muddat',
      'Voqealar taqvimi: tur bo\'yicha filtrlash, bugungi voqealar',
      'Shikoyatlar boshqaruvi: kategoriya, ustuvorlik, hal qilish oqimi',
      'Ichki xabarlar tizimi: inbox, yuborilgan, yangi xabar',
    ],
  },
  {
    version: '2.4.0',
    date: '2026-04-03',
    tag: 'yangi',
    changes: [
      'Xodimlar boshqaruvi moduli: CRUD, holat boshqaruvi',
      'Inventar kuzatuv: dori-darmonlar, jihozlar, sarflanadigan materiallar',
      'Yo\'llanmalar: bemorni boshqa klinikaga yo\'llash tizimi',
      'Jihozlar ro\'yxati: kafolat muddati, xizmat ko\'rsatish tarixi',
      'Mobil moslashuv: barcha sahifalar va landing page',
      'Global qidiruv kengaytirildi',
    ],
  },
  {
    version: '2.3.0',
    date: '2026-03-28',
    tag: 'yangi',
    changes: [
      'Audit jurnali: barcha harakatlar kuzatuvi',
      'QR tibbiy karta: bemor ma\'lumotlarini QR kod orqali ulashish',
      'Uchrashuvlar: bronlash, tasdiqlash, bekor qilish oqimi',
      'Mijozlar baholashuvi: 5 yulduz reyting, izohlar',
    ],
  },
  {
    version: '2.2.0',
    date: '2026-03-20',
    tag: 'yangi',
    changes: [
      'Anti-tekshiruv moduli: to\'liq tekshiruv checklisti va risk baholash',
      'Inspektor simulyatsiyasi: 3 ta stsenariy (rejalashtirilgan, shikoyat, kutilmagan)',
      'ERP klinika tizimi: bemorlar, tashriflar, jadval, tozalash jurnali',
      'ERP analitika: vizit trendi, top tashxislar, grafik ko\'rinish',
    ],
  },
  {
    version: '2.1.0',
    date: '2026-03-14',
    tag: 'yangi',
    changes: [
      'Muddatlar (compliance) moduli: litsenziya, sertifikat, shartnoma kuzatuvi',
      'Avtomatik email eslatmalar: 30/14/7 kun oldin',
      'Murojaatlar tizimi: AI klassifikatsiya, draft javob, holat kuzatuv',
      'Hujjatlar boshqaruvi: 8 ta shablon, AI drafting, admin ko\'rib chiqish',
    ],
  },
  {
    version: '2.0.0',
    date: '2026-03-07',
    tag: 'yangi',
    changes: [
      'AI Maslahatchi: Gemini 1.5 Pro bilan tibbiy-yuridik maslahat',
      'RAG tizimi: O\'zbekiston qonunlari va tibbiy standartlar asosida javoblar',
      '5 tilli interfeys: O\'zbekcha, Ruscha, Inglizcha, Kirilcha, Qozog\'cha',
      'Telemeditsina: video maslahat oynasi (WebRTC)',
      'E-Retsept: raqamli retsept yaratish va uzatish',
    ],
  },
  {
    version: '1.5.0',
    date: '2026-02-28',
    tag: 'yaxshilash',
    changes: [
      'Kasbiy forum: post, izoh, like tizimi',
      'Kadrlar markazi: ish e\'lonlari va arizalar',
      'Tibbiyot yangiliklari lenti',
      'CME akademiyasi: onlayn kurslar va sertifikatlar',
      'Xarita: klinikalarni joylashuv bo\'yicha ko\'rish',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-02-14',
    tag: 'yangi',
    changes: [
      'Platforma asosi: Next.js 14 + TypeScript + Tailwind',
      'Firebase autentifikatsiya: email/parol va Google OAuth',
      'Ko\'p rollik tizim: Admin, Klinika, Shifokor, Bemor',
      'Barcha dashboard va sidebar navigatsiyasi',
      'Profil to\'ldirish oqimlari barcha rollar uchun',
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><RefreshCw className="w-6 h-6 text-slate-600" />Yangilanishlar Tarixi</h1>
        <p className="text-sm text-muted-foreground mt-1">Platforma versiyalari va o&apos;zgarishlar ro&apos;yxati</p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[88px] top-0 bottom-0 w-px bg-slate-200 hidden sm:block" />

        <div className="space-y-8">
          {CHANGELOG.map((entry) => {
            const tm = TAG_META[entry.tag];
            return (
              <div key={entry.version} className="sm:flex gap-6">
                {/* Date + version */}
                <div className="sm:w-20 shrink-0 mb-3 sm:mb-0 text-right">
                  <p className="text-xs text-slate-400">{entry.date}</p>
                  <p className="text-sm font-bold text-slate-800">v{entry.version}</p>
                </div>

                {/* Dot */}
                <div className="hidden sm:flex items-start justify-center w-4 shrink-0 mt-1">
                  <div className="w-3 h-3 rounded-full bg-white border-2 border-slate-400 relative z-10" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <Card className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 font-medium ${tm.color}`}>
                          {tm.icon}{tm.label}
                        </span>
                        <span className="text-sm font-semibold text-slate-700">Versiya {entry.version}</span>
                      </div>
                      <ul className="space-y-1.5">
                        {entry.changes.map((change, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="text-slate-300 mt-0.5 shrink-0">•</span>
                            {change}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-slate-500">Keyingi versiya: <strong>v2.6.0</strong> — Module 1 (AI RAG) to&apos;liq integratsiyasi</p>
          <p className="text-xs text-slate-400 mt-1">Rejalashtirilgan: 2026-04-15</p>
        </CardContent>
      </Card>
    </div>
  );
}
