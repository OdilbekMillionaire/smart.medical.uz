export interface DocumentTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  fields: string[];
  content: string;
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'labor_contract',
    title: 'Mehnat shartnomasi',
    category: 'mehnat',
    description: 'Xodim bilan mehnat shartnomasi',
    fields: ['employer_name', 'authorized_person', 'employee_name', 'position', 'salary', 'start_date', 'duration'],
    content: `MEHNAT SHARTNOMASI

Bir tomondan [employer_name] nomidan [authorized_person], ikkinchi tomondan [employee_name] o'rtasida ushbu mehnat shartnomasi tuzildi.

Lavozim: [position]
Ish haqi: [salary]
Ish boshlash sanasi: [start_date]
Shartnoma muddati: [duration]

Tomonlar ushbu shartnoma shartlariga rioya qilish majburiyatini oladilar.

Ish beruvchi: __________________
Xodim: __________________`,
  },
  {
    id: 'service_contract',
    title: 'Xizmat shartnomasi',
    category: 'shartnoma',
    description: "Xizmat ko'rsatish shartnomasi",
    fields: ['service_type', 'provider_name', 'client_name', 'amount', 'duration'],
    content: `XIZMAT KO'RSATISH SHARTNOMASI

[provider_name] va [client_name] o'rtasida [service_type] xizmatlarini ko'rsatish bo'yicha ushbu shartnoma tuzildi.

Shartnoma qiymati: [amount]
Muddati: [duration]

Tomonlar xizmatlarni sifatli va belgilangan muddatlarda bajarishga kelishib oldilar.`,
  },
  {
    id: 'order_qualification',
    title: "Malaka oshirish buyrug'i",
    category: 'buyruq',
    description: "Xodimni malaka oshirishga yuborish buyrug'i",
    fields: ['clinic_name', 'employee_name', 'position', 'institution', 'start_date', 'end_date'],
    content: `BUYRUQ

[clinic_name] rahbariyati buyruq qiladi:

[employee_name] ([position]) [institution] da [start_date] dan [end_date] gacha malaka oshirish kursiga yuborilsin.

Nazorat mas'ul shaxs zimmasiga yuklatilsin.

Rahbar: __________________`,
  },
  {
    id: 'order_dismissal',
    title: "Ishdan bo'shatish buyrug'i",
    category: 'buyruq',
    description: "Xodimni ishdan bo'shatish buyrug'i",
    fields: ['employee_name', 'position', 'date', 'reason'],
    content: `BUYRUQ

[employee_name] ([position]) [date] dan boshlab [reason] asosida egallab turgan lavozimidan ozod qilinsin.

Buxgalteriya bo'limi yakuniy hisob-kitobni amalga oshirsin.

Rahbar: __________________`,
  },
  {
    id: 'sterilization_contract',
    title: 'Sterilizatsiya shartnomasi',
    category: 'shartnoma',
    description: 'Sterilizatsiya xizmatlari shartnomasi',
    fields: ['provider_name', 'clinic_name', 'amount', 'frequency', 'start_date'],
    content: `STERILIZATSIYA XIZMATLARI SHARTNOMASI

[provider_name] [clinic_name] uchun sterilizatsiya xizmatlarini ko'rsatishni o'z zimmasiga oladi.

Xizmat davriyligi: [frequency]
Boshlanish sanasi: [start_date]
Shartnoma qiymati: [amount]

Tomonlar sanitariya qoidalari va amaldagi me'yorlarga rioya qiladi.`,
  },
  {
    id: 'meeting_protocol',
    title: "Yig'ilish bayonnomasi",
    category: 'bayonnoma',
    description: "Klinika yig'ilishi bayonnomasi",
    fields: ['date', 'attendees', 'agenda', 'decisions'],
    content: `YIG'ILISH BAYONNOMASI

Sana: [date]
Ishtirokchilar: [attendees]
Kun tartibi: [agenda]

Qarorlar:
[decisions]`,
  },
  {
    id: 'complaint_response',
    title: 'Shikoyatga javob xati',
    category: 'xat',
    description: 'Bemor shikoyatiga rasmiy javob',
    fields: ['complainant_name', 'complaint_date', 'complaint_subject', 'response_text'],
    content: `JAVOB XATI

Hurmatli [complainant_name],

[complaint_date] sanasida kelib tushgan [complaint_subject] bo'yicha shikoyatingiz ko'rib chiqildi.

[response_text]

Hurmat bilan,
Klinika ma'muriyati`,
  },
  {
    id: 'referral_letter',
    title: "Yo'llanma xat",
    category: 'xat',
    description: "Bemorni boshqa muassasaga yo'llash",
    fields: ['patient_name', 'dob', 'diagnosis', 'destination_clinic', 'doctor_name'],
    content: `YO'LLANMA

Bemor: [patient_name]
Tug'ilgan sana: [dob]
Tashxis: [diagnosis]

[destination_clinic] ga konsultatsiya uchun yo'llanadi.

Yo'llovchi shifokor: [doctor_name]
Imzo: __________________`,
  },
];

export function fillTemplate(template: DocumentTemplate, fields: Record<string, string>): string {
  return template.content.replace(/\[([a-zA-Z0-9_]+)\]/g, (_, key: string) => fields[key] ?? `[${key}]`);
}

export function getDocumentTemplate(templateId: string): DocumentTemplate | undefined {
  return DOCUMENT_TEMPLATES.find((template) => template.id === templateId);
}
