'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot, FileText, Save, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DOCUMENT_TEMPLATES, fillTemplate } from '@/data/templates';
import type { Language } from '@/contexts/LanguageContext';
import type { Document } from '@/types';

type TemplateCopy = {
  title: string;
  description: string;
  content: string;
};

const TEMPLATE_COPY: Record<Language, Record<string, TemplateCopy>> = {
  uz: {
    labor_contract: {
      title: 'Mehnat shartnomasi',
      description: 'Xodim bilan mehnat shartnomasi',
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
    service_contract: {
      title: 'Xizmat shartnomasi',
      description: "Xizmat ko'rsatish shartnomasi",
      content: `XIZMAT KO'RSATISH SHARTNOMASI

[provider_name] va [client_name] o'rtasida [service_type] xizmatlarini ko'rsatish bo'yicha ushbu shartnoma tuzildi.

Shartnoma qiymati: [amount]
Muddati: [duration]

Tomonlar xizmatlarni sifatli va belgilangan muddatlarda bajarishga kelishib oldilar.`,
    },
    order_qualification: {
      title: "Malaka oshirish buyrug'i",
      description: "Xodimni malaka oshirishga yuborish buyrug'i",
      content: `BUYRUQ

[clinic_name] rahbariyati buyruq qiladi:

[employee_name] ([position]) [institution] da [start_date] dan [end_date] gacha malaka oshirish kursiga yuborilsin.

Nazorat mas'ul shaxs zimmasiga yuklatilsin.

Rahbar: __________________`,
    },
    order_dismissal: {
      title: "Ishdan bo'shatish buyrug'i",
      description: "Xodimni ishdan bo'shatish buyrug'i",
      content: `BUYRUQ

[employee_name] ([position]) [date] dan boshlab [reason] asosida egallab turgan lavozimidan ozod qilinsin.

Buxgalteriya bo'limi yakuniy hisob-kitobni amalga oshirsin.

Rahbar: __________________`,
    },
    sterilization_contract: {
      title: 'Sterilizatsiya shartnomasi',
      description: 'Sterilizatsiya xizmatlari shartnomasi',
      content: `STERILIZATSIYA XIZMATLARI SHARTNOMASI

[provider_name] [clinic_name] uchun sterilizatsiya xizmatlarini ko'rsatishni o'z zimmasiga oladi.

Xizmat davriyligi: [frequency]
Boshlanish sanasi: [start_date]
Shartnoma qiymati: [amount]

Tomonlar sanitariya qoidalari va amaldagi me'yorlarga rioya qiladi.`,
    },
    meeting_protocol: {
      title: "Yig'ilish bayonnomasi",
      description: "Klinika yig'ilishi bayonnomasi",
      content: `YIG'ILISH BAYONNOMASI

Sana: [date]
Ishtirokchilar: [attendees]
Kun tartibi: [agenda]

Qarorlar:
[decisions]`,
    },
    complaint_response: {
      title: 'Shikoyatga javob xati',
      description: 'Bemor shikoyatiga rasmiy javob',
      content: `JAVOB XATI

Hurmatli [complainant_name],

[complaint_date] sanasida kelib tushgan [complaint_subject] bo'yicha shikoyatingiz ko'rib chiqildi.

[response_text]

Hurmat bilan,
Klinika ma'muriyati`,
    },
    referral_letter: {
      title: "Yo'llanma xat",
      description: "Bemorni boshqa muassasaga yo'llash",
      content: `YO'LLANMA

Bemor: [patient_name]
Tug'ilgan sana: [dob]
Tashxis: [diagnosis]

[destination_clinic] ga konsultatsiya uchun yo'llanadi.

Yo'llovchi shifokor: [doctor_name]
Imzo: __________________`,
    },
  },
  uz_cyrillic: {
    labor_contract: {
      title: 'Меҳнат шартномаси',
      description: 'Ходим билан меҳнат шартномаси',
      content: `МЕҲНАТ ШАРТНОМАСИ

Бир томондан [employer_name] номидан [authorized_person], иккинчи томондан [employee_name] ўртасида ушбу меҳнат шартномаси тузилди.

Лавозим: [position]
Иш ҳақи: [salary]
Иш бошлаш санаси: [start_date]
Шартнома муддати: [duration]

Томонлар ушбу шартнома шартларига риоя қилиш мажбуриятини оладилар.

Иш берувчи: __________________
Ходим: __________________`,
    },
    service_contract: {
      title: 'Хизмат шартномаси',
      description: 'Хизмат кўрсатиш шартномаси',
      content: `ХИЗМАТ КЎРСАТИШ ШАРТНОМАСИ

[provider_name] ва [client_name] ўртасида [service_type] хизматларини кўрсатиш бўйича ушбу шартнома тузилди.

Шартнома қиймати: [amount]
Муддати: [duration]

Томонлар хизматларни сифатли ва белгиланган муддатларда бажаришга келишиб олдилар.`,
    },
    order_qualification: {
      title: 'Малака ошириш буйруғи',
      description: 'Ходимни малака оширишга юбориш буйруғи',
      content: `БУЙРУҚ

[clinic_name] раҳбарияти буйруқ қилади:

[employee_name] ([position]) [institution] да [start_date] дан [end_date] гача малака ошириш курсига юборилсин.

Назорат масъул шахс зиммасига юклатилсин.

Раҳбар: __________________`,
    },
    order_dismissal: {
      title: 'Ишдан бўшатиш буйруғи',
      description: 'Ходимни ишдан бўшатиш буйруғи',
      content: `БУЙРУҚ

[employee_name] ([position]) [date] дан бошлаб [reason] асосида эгаллаб турган лавозимидан озод қилинсин.

Бухгалтерия бўлими якуний ҳисоб-китобни амалга оширсин.

Раҳбар: __________________`,
    },
    sterilization_contract: {
      title: 'Стерилизация шартномаси',
      description: 'Стерилизация хизматлари шартномаси',
      content: `СТЕРИЛИЗАЦИЯ ХИЗМАТЛАРИ ШАРТНОМАСИ

[provider_name] [clinic_name] учун стерилизация хизматларини кўрсатишни ўз зиммасига олади.

Хизмат даврийлиги: [frequency]
Бошланиш санаси: [start_date]
Шартнома қиймати: [amount]

Томонлар санитария қоидалари ва амалдаги меъёрларга риоя қилади.`,
    },
    meeting_protocol: {
      title: 'Йиғилиш баённомаси',
      description: 'Клиника йиғилиши баённомаси',
      content: `ЙИҒИЛИШ БАЁННОМАСИ

Сана: [date]
Иштирокчилар: [attendees]
Кун тартиби: [agenda]

Қарорлар:
[decisions]`,
    },
    complaint_response: {
      title: 'Шикоятга жавоб хати',
      description: 'Бемор шикоятига расмий жавоб',
      content: `ЖАВОБ ХАТИ

Ҳурматли [complainant_name],

[complaint_date] санасида келиб тушган [complaint_subject] бўйича шикоятингиз кўриб чиқилди.

[response_text]

Ҳурмат билан,
Клиника маъмурияти`,
    },
    referral_letter: {
      title: 'Йўлланма хат',
      description: 'Беморни бошқа муассасага йўллаш',
      content: `ЙЎЛЛАНМА

Бемор: [patient_name]
Туғилган сана: [dob]
Ташхис: [diagnosis]

[destination_clinic] га консультация учун йўлланади.

Йўлловчи шифокор: [doctor_name]
Имзо: __________________`,
    },
  },
  ru: {
    labor_contract: {
      title: 'Трудовой договор',
      description: 'Трудовой договор с сотрудником',
      content: `ТРУДОВОЙ ДОГОВОР

Настоящий трудовой договор заключен между [employer_name] в лице [authorized_person] и [employee_name].

Должность: [position]
Заработная плата: [salary]
Дата начала работы: [start_date]
Срок договора: [duration]

Стороны обязуются соблюдать условия настоящего договора.

Работодатель: __________________
Сотрудник: __________________`,
    },
    service_contract: {
      title: 'Договор оказания услуг',
      description: 'Договор на оказание услуг',
      content: `ДОГОВОР ОКАЗАНИЯ УСЛУГ

[provider_name] и [client_name] заключили настоящий договор на оказание услуг: [service_type].

Стоимость договора: [amount]
Срок: [duration]

Стороны договорились выполнять услуги качественно и в установленные сроки.`,
    },
    order_qualification: {
      title: 'Приказ о повышении квалификации',
      description: 'Приказ о направлении сотрудника на обучение',
      content: `ПРИКАЗ

Руководство [clinic_name] приказывает:

Направить [employee_name] ([position]) в [institution] на курсы повышения квалификации с [start_date] по [end_date].

Контроль возложить на ответственное лицо.

Руководитель: __________________`,
    },
    order_dismissal: {
      title: 'Приказ об увольнении',
      description: 'Приказ об увольнении сотрудника',
      content: `ПРИКАЗ

Освободить [employee_name] ([position]) от занимаемой должности с [date] на основании: [reason].

Бухгалтерии произвести окончательный расчет.

Руководитель: __________________`,
    },
    sterilization_contract: {
      title: 'Договор стерилизации',
      description: 'Договор на услуги стерилизации',
      content: `ДОГОВОР НА УСЛУГИ СТЕРИЛИЗАЦИИ

[provider_name] обязуется оказывать услуги стерилизации для [clinic_name].

Периодичность услуг: [frequency]
Дата начала: [start_date]
Стоимость договора: [amount]

Стороны обязуются соблюдать санитарные правила и действующие нормы.`,
    },
    meeting_protocol: {
      title: 'Протокол совещания',
      description: 'Протокол внутреннего совещания клиники',
      content: `ПРОТОКОЛ СОВЕЩАНИЯ

Дата: [date]
Участники: [attendees]
Повестка дня: [agenda]

Решения:
[decisions]`,
    },
    complaint_response: {
      title: 'Ответ на жалобу',
      description: 'Официальный ответ на жалобу пациента',
      content: `ОТВЕТНОЕ ПИСЬМО

Уважаемый(ая) [complainant_name],

Ваша жалоба от [complaint_date] по вопросу "[complaint_subject]" была рассмотрена.

[response_text]

С уважением,
Администрация клиники`,
    },
    referral_letter: {
      title: 'Направление',
      description: 'Направление пациента в другое учреждение',
      content: `НАПРАВЛЕНИЕ

Пациент: [patient_name]
Дата рождения: [dob]
Диагноз: [diagnosis]

Пациент направляется в [destination_clinic] для консультации.

Направивший врач: [doctor_name]
Подпись: __________________`,
    },
  },
  en: {
    labor_contract: {
      title: 'Employment Contract',
      description: 'Employment contract with a staff member',
      content: `EMPLOYMENT CONTRACT

This employment contract is concluded between [employer_name], represented by [authorized_person], and [employee_name].

Position: [position]
Salary: [salary]
Start date: [start_date]
Contract term: [duration]

The parties agree to comply with the terms of this contract.

Employer: __________________
Employee: __________________`,
    },
    service_contract: {
      title: 'Service Agreement',
      description: 'Agreement for service delivery',
      content: `SERVICE AGREEMENT

[provider_name] and [client_name] conclude this agreement for the provision of [service_type] services.

Contract amount: [amount]
Term: [duration]

The parties agree to provide services with due quality and within the agreed timeline.`,
    },
    order_qualification: {
      title: 'Qualification Training Order',
      description: 'Order to send an employee for training',
      content: `ORDER

The management of [clinic_name] orders:

[employee_name] ([position]) shall be sent to [institution] for qualification training from [start_date] to [end_date].

Supervision shall be assigned to the responsible person.

Director: __________________`,
    },
    order_dismissal: {
      title: 'Dismissal Order',
      description: 'Order to dismiss an employee',
      content: `ORDER

[employee_name] ([position]) shall be released from the current position as of [date] based on: [reason].

The accounting department shall complete the final settlement.

Director: __________________`,
    },
    sterilization_contract: {
      title: 'Sterilization Contract',
      description: 'Contract for sterilization services',
      content: `STERILIZATION SERVICES CONTRACT

[provider_name] undertakes to provide sterilization services for [clinic_name].

Service frequency: [frequency]
Start date: [start_date]
Contract amount: [amount]

The parties agree to comply with sanitary rules and applicable regulations.`,
    },
    meeting_protocol: {
      title: 'Meeting Protocol',
      description: 'Internal clinic meeting protocol',
      content: `MEETING PROTOCOL

Date: [date]
Attendees: [attendees]
Agenda: [agenda]

Decisions:
[decisions]`,
    },
    complaint_response: {
      title: 'Response to Complaint',
      description: 'Official response to a patient complaint',
      content: `RESPONSE LETTER

Dear [complainant_name],

Your complaint dated [complaint_date] regarding "[complaint_subject]" has been reviewed.

[response_text]

Respectfully,
Clinic Administration`,
    },
    referral_letter: {
      title: 'Referral Letter',
      description: 'Referral of a patient to another institution',
      content: `REFERRAL

Patient: [patient_name]
Date of birth: [dob]
Diagnosis: [diagnosis]

The patient is referred to [destination_clinic] for consultation.

Referring doctor: [doctor_name]
Signature: __________________`,
    },
  },
  kk: {
    labor_contract: {
      title: 'Miynet shártnaması',
      description: 'Xızmetker menen miynet shártnaması',
      content: `MIYNET SHÁRTNAMASI

Bul miynet shártnaması [employer_name] atınan [authorized_person] hám [employee_name] arasında dúzildi.

Lawazım: [position]
Ayliq: [salary]
Jumıs baslanıw sánesi: [start_date]
Shártnama múddeti: [duration]

Tárepler usı shártnama shártlerin orınlawǵa mindetleme aladı.

Jumıs beriwshi: __________________
Xızmetker: __________________`,
    },
    service_contract: {
      title: 'Xızmet kórsetiw shártnaması',
      description: 'Xızmet kórsetiw boyınsha shártnama',
      content: `XÍZMET KÓRSETIW SHÁRTNAMASI

[provider_name] hám [client_name] arasında [service_type] xızmetlerin kórsetiw boyınsha usı shártnama dúzildi.

Shártnama bahası: [amount]
Múddeti: [duration]

Tárepler xızmetlerdi sapalı hám belgilengen múddette orınlawǵa kelisti.`,
    },
    order_qualification: {
      title: 'Bilim jetilistiriw buyrıǵı',
      description: 'Xızmetkerdi oqıwǵa jiberiw buyrıǵı',
      content: `BUYRIQ

[clinic_name] basshılıǵı buyradı:

[employee_name] ([position]) [institution] da [start_date] den [end_date] ge shekem bilim jetilistiriw kursına jiberilsin.

Qadaǵalaw juwapker shaxsqa júkletilsin.

Basshı: __________________`,
    },
    order_dismissal: {
      title: 'Jumıstan bosatıw buyrıǵı',
      description: 'Xızmetkerdi jumıstan bosatıw buyrıǵı',
      content: `BUYRIQ

[employee_name] ([position]) [date] den baslap [reason] tiykarında iyelep turǵan lawazımınan bosatılsın.

Buxgalteriya bólimi aqırǵı esap-kitaptı ámelge asırsın.

Basshı: __________________`,
    },
    sterilization_contract: {
      title: 'Sterilizaciya shártnaması',
      description: 'Sterilizaciya xızmetleri shártnaması',
      content: `STERILIZACIYA XÍZMETLERI SHÁRTNAMASI

[provider_name] [clinic_name] ushın sterilizaciya xızmetlerin kórsetiwdi óz moynına aladı.

Xızmet dáwirliligi: [frequency]
Baslanıw sánesi: [start_date]
Shártnama bahası: [amount]

Tárepler sanitariya qaǵıydaları hám ámeldegi normalarǵa ámel etedi.`,
    },
    meeting_protocol: {
      title: 'Jıynalıs bayannaması',
      description: 'Klinika jıynalısı bayannaması',
      content: `JIYNALIS BAYANNAMASI

Sáne: [date]
Qatnasıwshılar: [attendees]
Kún tártibi: [agenda]

Qararlar:
[decisions]`,
    },
    complaint_response: {
      title: 'Shaǵımǵa juwap xatı',
      description: 'Pacient shaǵımına rásmiy juwap',
      content: `JUWAP XATI

Húrmetli [complainant_name],

[complaint_date] sánesinde kelip túskен [complaint_subject] boyınsha shaǵımıńız kórip shıǵıldı.

[response_text]

Húrmet penen,
Klinika administraciyası`,
    },
    referral_letter: {
      title: 'Jollanba xat',
      description: 'Pacientti basqa mákemеге jiberiw',
      content: `JOLLANBA

Pacient: [patient_name]
Tuwılǵan sánesi: [dob]
Diagnoz: [diagnosis]

[destination_clinic] ge konsultaciya ushın jiberiledi.

Jiberiwshi shıpaker: [doctor_name]
Qol: __________________`,
    },
  },
};

const FIELD_LABELS: Record<Language, Record<string, string>> = {
  uz: {
    employer_name: 'Ish beruvchi nomi',
    authorized_person: 'Vakolatli shaxs',
    employee_name: 'Xodim F.I.SH',
    position: 'Lavozim',
    salary: 'Ish haqi',
    start_date: 'Boshlanish sanasi',
    duration: 'Muddat',
    service_type: 'Xizmat turi',
    provider_name: 'Xizmat ko\'rsatuvchi',
    client_name: 'Mijoz nomi',
    amount: 'Summasi',
    clinic_name: 'Klinika nomi',
    institution: 'Muassasa',
    end_date: 'Tugash sanasi',
    date: 'Sana',
    reason: 'Sabab',
    frequency: 'Davriylik',
    attendees: 'Ishtirokchilar',
    agenda: 'Kun tartibi',
    decisions: 'Qarorlar',
    complainant_name: 'Murojaatchi F.I.SH',
    complaint_date: 'Shikoyat sanasi',
    complaint_subject: 'Shikoyat mavzusi',
    response_text: 'Javob matni',
    patient_name: 'Bemor F.I.SH',
    dob: 'Tug\'ilgan sana',
    diagnosis: 'Tashxis',
    destination_clinic: 'Qabul qiluvchi muassasa',
    doctor_name: 'Shifokor F.I.SH',
  },
  uz_cyrillic: {
    employer_name: 'Иш берувчи номи',
    authorized_person: 'Ваколатли шахс',
    employee_name: 'Ходим Ф.И.Ш',
    position: 'Лавозим',
    salary: 'Иш ҳақи',
    start_date: 'Бошланиш санаси',
    duration: 'Муддат',
    service_type: 'Хизмат тури',
    provider_name: 'Хизмат кўрсатувчи',
    client_name: 'Мижоз номи',
    amount: 'Суммаси',
    clinic_name: 'Клиника номи',
    institution: 'Муассаса',
    end_date: 'Тугаш санаси',
    date: 'Сана',
    reason: 'Сабаб',
    frequency: 'Даврийлик',
    attendees: 'Иштирокчилар',
    agenda: 'Кун тартиби',
    decisions: 'Қарорлар',
    complainant_name: 'Мурожаатчи Ф.И.Ш',
    complaint_date: 'Шикоят санаси',
    complaint_subject: 'Шикоят мавзуси',
    response_text: 'Жавоб матни',
    patient_name: 'Бемор Ф.И.Ш',
    dob: 'Туғилган сана',
    diagnosis: 'Ташхис',
    destination_clinic: 'Қабул қилувчи муассаса',
    doctor_name: 'Шифокор Ф.И.Ш',
  },
  ru: {
    employer_name: 'Название работодателя',
    authorized_person: 'Уполномоченное лицо',
    employee_name: 'Ф.И.О. сотрудника',
    position: 'Должность',
    salary: 'Заработная плата',
    start_date: 'Дата начала',
    duration: 'Срок',
    service_type: 'Тип услуги',
    provider_name: 'Поставщик услуг',
    client_name: 'Клиент',
    amount: 'Сумма',
    clinic_name: 'Название клиники',
    institution: 'Учреждение',
    end_date: 'Дата окончания',
    date: 'Дата',
    reason: 'Причина',
    frequency: 'Периодичность',
    attendees: 'Участники',
    agenda: 'Повестка дня',
    decisions: 'Решения',
    complainant_name: 'Ф.И.О. заявителя',
    complaint_date: 'Дата жалобы',
    complaint_subject: 'Тема жалобы',
    response_text: 'Текст ответа',
    patient_name: 'Ф.И.О. пациента',
    dob: 'Дата рождения',
    diagnosis: 'Диагноз',
    destination_clinic: 'Принимающее учреждение',
    doctor_name: 'Ф.И.О. врача',
  },
  en: {
    employer_name: 'Employer name',
    authorized_person: 'Authorized person',
    employee_name: 'Employee full name',
    position: 'Position',
    salary: 'Salary',
    start_date: 'Start date',
    duration: 'Duration',
    service_type: 'Service type',
    provider_name: 'Service provider',
    client_name: 'Client name',
    amount: 'Amount',
    clinic_name: 'Clinic name',
    institution: 'Institution',
    end_date: 'End date',
    date: 'Date',
    reason: 'Reason',
    frequency: 'Frequency',
    attendees: 'Attendees',
    agenda: 'Agenda',
    decisions: 'Decisions',
    complainant_name: 'Complainant full name',
    complaint_date: 'Complaint date',
    complaint_subject: 'Complaint subject',
    response_text: 'Response text',
    patient_name: 'Patient full name',
    dob: 'Date of birth',
    diagnosis: 'Diagnosis',
    destination_clinic: 'Destination institution',
    doctor_name: 'Doctor full name',
  },
  kk: {
    employer_name: 'Jumıs beriwshi atı',
    authorized_person: 'Wákillikli shaxs',
    employee_name: 'Xızmetkerdiń tolıq atı',
    position: 'Lawazım',
    salary: 'Ayliq',
    start_date: 'Baslanıw sánesi',
    duration: 'Múddet',
    service_type: 'Xızmet túri',
    provider_name: 'Xızmet kórsetiwshi',
    client_name: 'Klient atı',
    amount: 'Summa',
    clinic_name: 'Klinika atı',
    institution: 'Mákkeme',
    end_date: 'Tamamlanıw sánesi',
    date: 'Sáne',
    reason: 'Sebep',
    frequency: 'Dáwirlilik',
    attendees: 'Qatnasıwshılar',
    agenda: 'Kún tártibi',
    decisions: 'Qararlar',
    complainant_name: 'Shaǵım beriwshiniń tolıq atı',
    complaint_date: 'Shaǵım sánesi',
    complaint_subject: 'Shaǵım teması',
    response_text: 'Juwap mátini',
    patient_name: 'Pacienttiń tolıq atı',
    dob: 'Tuwılǵan sánesi',
    diagnosis: 'Diagnoz',
    destination_clinic: 'Qabıllawshı mákkeme',
    doctor_name: 'Shıpakerdiń tolıq atı',
  },
};

async function requestJson<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

function fallbackFieldLabel(field: string) {
  return field
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function fieldLabel(field: string, lang: Language) {
  return FIELD_LABELS[lang]?.[field] ?? FIELD_LABELS.ru[field] ?? fallbackFieldLabel(field);
}

function getTemplateCopy(lang: Language, templateId: string): TemplateCopy | undefined {
  return TEMPLATE_COPY[lang]?.[templateId] ?? TEMPLATE_COPY.ru[templateId] ?? TEMPLATE_COPY.uz[templateId];
}

function fillLocalizedTemplate(content: string, fields: Record<string, string>): string {
  return content.replace(/\[([a-zA-Z0-9_]+)\]/g, (_, key: string) => fields[key] ?? `[${key}]`);
}

export default function NewDocumentPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [templateId, setTemplateId] = useState(DOCUMENT_TEMPLATES[0]?.id ?? '');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [title, setTitle] = useState(() => getTemplateCopy(lang, DOCUMENT_TEMPLATES[0]?.id ?? '')?.title ?? DOCUMENT_TEMPLATES[0]?.title ?? '');
  const [content, setContent] = useState(() => {
    const initialTemplate = DOCUMENT_TEMPLATES[0];
    const initialCopy = getTemplateCopy(lang, initialTemplate?.id ?? '');
    return initialCopy ? fillLocalizedTemplate(initialCopy.content, {}) : fillTemplate(initialTemplate, {});
  });
  const [context, setContext] = useState('');
  const [savingStatus, setSavingStatus] = useState<Document['status'] | 'ai' | null>(null);

  const selectedTemplate = useMemo(
    () => DOCUMENT_TEMPLATES.find((template) => template.id === templateId) ?? DOCUMENT_TEMPLATES[0],
    [templateId]
  );
  const selectedTemplateCopy = useMemo(
    () => getTemplateCopy(lang, selectedTemplate.id),
    [lang, selectedTemplate.id]
  );

  function selectTemplate(nextTemplateId: string) {
    const nextTemplate = DOCUMENT_TEMPLATES.find((template) => template.id === nextTemplateId);
    if (!nextTemplate) return;
    const nextCopy = getTemplateCopy(lang, nextTemplate.id);
    setTemplateId(nextTemplate.id);
    setFields({});
    setTitle(nextCopy?.title ?? nextTemplate.title);
    setContent(nextCopy ? fillLocalizedTemplate(nextCopy.content, {}) : fillTemplate(nextTemplate, {}));
  }

  function updateField(field: string, value: string) {
    const nextFields = { ...fields, [field]: value };
    setFields(nextFields);
    setContent(
      selectedTemplateCopy
        ? fillLocalizedTemplate(selectedTemplateCopy.content, nextFields)
        : fillTemplate(selectedTemplate, nextFields)
    );
  }

  async function handleAIDraft() {
    if (!user) return;
    setSavingStatus('ai');
    try {
      const token = await user.getIdToken();
      const data = await requestJson<{ content: string }>('/api/ai/draft', token, {
        method: 'POST',
        body: JSON.stringify({
          mode: 'document',
          documentType: selectedTemplate.id,
          context: `${context}\n\n${content}`.trim(),
        }),
      });
      setContent(data.content);
      toast.success(t.documents.aiDraft);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    } finally {
      setSavingStatus(null);
    }
  }

  async function handleSave(status: 'draft' | 'pending_review') {
    if (!user) return;
    if (!title.trim()) {
      toast.error(t.documents.titleLabel);
      return;
    }
    if (!content.trim()) {
      toast.error(t.documents.contentLabel);
      return;
    }

    setSavingStatus(status);
    try {
      const token = await user.getIdToken();
      const created = await requestJson<Document>('/api/documents', token, {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          type: selectedTemplate.id,
          templateId: selectedTemplate.id,
          fields,
          content: content.trim(),
          status,
        }),
      });
      toast.success(status === 'draft' ? t.common.success : t.documents.submitReview);
      router.push(`/dashboard/documents/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    } finally {
      setSavingStatus(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/documents">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            {t.common.back}
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t.documents.createTitle}</h1>
          <p className="text-sm text-muted-foreground">{t.documents.emptyDesc}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          {DOCUMENT_TEMPLATES.map((template) => {
            const templateCopy = getTemplateCopy(lang, template.id);
            return (
              <button
                key={template.id}
              type="button"
              onClick={() => selectTemplate(template.id)}
              className={`w-full rounded-lg border bg-white p-4 text-left transition-colors ${
                templateId === template.id ? 'border-slate-900 shadow-sm' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="rounded-md bg-slate-100 p-2 text-slate-700">
                  <FileText className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium">{templateCopy?.title ?? template.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{templateCopy?.description ?? template.description}</span>
                </span>
              </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.documents.titleLabel}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t.documents.titleLabel}</Label>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {selectedTemplate.fields.map((field) => (
                  <div key={field} className="space-y-2">
                    <Label>{fieldLabel(field, lang)}</Label>
                    <Input
                      value={fields[field] ?? ''}
                      onChange={(event) => updateField(field, event.target.value)}
                      placeholder={fieldLabel(field, lang)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="h-5 w-5" />
                {t.documents.aiDraft}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder={t.documents.contextPlaceholder}
                value={context}
                onChange={(event) => setContext(event.target.value)}
                className="min-h-[80px]"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAIDraft}
                disabled={savingStatus !== null}
                className="gap-2"
              >
                {savingStatus === 'ai' ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {t.documents.aiDraft}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.documents.contentLabel}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="min-h-[360px] font-mono text-sm"
              />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => handleSave('draft')}
              disabled={savingStatus !== null}
            >
              <Save className="h-4 w-4" />
              {savingStatus === 'draft' ? t.documents.saving : t.common.save}
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={() => handleSave('pending_review')}
              disabled={savingStatus !== null}
            >
              <Send className="h-4 w-4" />
              {savingStatus === 'pending_review' ? t.documents.saving : t.documents.submitReview}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
