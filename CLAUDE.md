# CLAUDE.md — Smart Medical Association Platform
# OXFORDER MChJ | CEO: Odilbek Iriskulov | ceo@oxforder.uz
# Client: Tibbiyot Tashkilotlari Assotsiatsiyasi | Muxitdinov Saloxiddin Zuxritdin o'g'li
# Contract: 120,000,000 so'm (3 stages) | Maintenance: 1,800,000 so'm/month
# Deadline: 6 weeks from 03.04.2026 → 15.05.2026
# GCP Project ID: seismic-envoy-486214-b5
# Last updated: 2026-04-12

---

## ✅ CURRENT TASK — COMPLETE PLATFORM BUILD (Modules 2-6)

> Week 1 foundation is complete and working: auth, profiles, dashboards, Firebase.
> Module 1 (AI knowledge base / RAG) will be connected later — skip it for now.
> Your job: build ALL remaining platform features — Modules 2, 3, 4, 5, and 6 — completely.
> Work through every step in order. Do not stop until everything is done and compiles cleanly.

---

## WHAT IS ALREADY BUILT — DO NOT REBUILD
- Next.js 14 + TypeScript + Tailwind + shadcn/ui
- Firebase Auth (email/password + Google OAuth)
- Firestore schema and all collections
- All role dashboards (Admin, Clinic, Doctor, Patient) with sidebars
- Auth context, middleware, route protection
- All onboarding/profile forms

---

## MODULE 2 — DOCUMENT MANAGEMENT + AI DRAFTING

### What it does
Users create, manage, and get AI-drafted legal/medical documents. Admins review and approve them.

### Step 2.1 — Document template library

Create `src/data/templates.ts` with these document templates:

```typescript
export const DOCUMENT_TEMPLATES = [
  {
    id: "labor_contract",
    title: "Mehnat shartnomasi",
    category: "mehnat",
    description: "Xodim bilan mehnat shartnomasi",
    fields: ["employee_name", "position", "salary", "start_date", "duration"],
    content: `MEHNAT SHARTNOMASI\n\nBir tomondan [employer_name] nomidan [authorized_person], ikkinchi tomondan [employee_name] o'rtasida ushbu mehnat shartnomasi tuzildi...`
  },
  {
    id: "service_contract",
    title: "Xizmat shartnomasi",
    category: "shartnoma",
    description: "Xizmat ko'rsatish shartnomasi",
    fields: ["service_type", "provider_name", "client_name", "amount", "duration"],
    content: `XIZMAT KO'RSATISH SHARTNOMASI\n\n...`
  },
  {
    id: "order_qualification",
    title: "Malaka oshirish buyrug'i",
    category: "buyruq",
    description: "Xodimni malaka oshirishga yuborish buyrug'i",
    fields: ["employee_name", "position", "institution", "start_date", "end_date"],
    content: `BUYRUQ\n\n[clinic_name] rahbariyati buyruq qiladi:\n[employee_name] ([position]) [institution] da malaka oshirish kursiga yuborilsin...`
  },
  {
    id: "order_dismissal",
    title: "Ishdan bo'shatish buyrug'i",
    category: "buyruq",
    description: "Xodimni ishdan bo'shatish buyrug'i",
    fields: ["employee_name", "position", "date", "reason"],
    content: `BUYRUQ\n\n[employee_name] ([position]) [date] dan boshlab [reason] asosida ishdan ozod qilinsin...`
  },
  {
    id: "sterilization_contract",
    title: "Sterilizatsiya shartnomasi",
    category: "shartnoma",
    description: "Sterilizatsiya xizmatlari shartnomasi",
    fields: ["provider_name", "clinic_name", "amount", "frequency", "start_date"],
    content: `STERILIZATSIYA XIZMATLARI SHARTNOMASI\n\n...`
  },
  {
    id: "meeting_protocol",
    title: "Yig'ilish bayonnomasi",
    category: "bayonnoma",
    description: "Klinika yig'ilishi bayonnomasi",
    fields: ["date", "attendees", "agenda", "decisions"],
    content: `YIG'ILISH BAYONNOMASI\n\nSana: [date]\nIshtirokchilar: [attendees]\nKun tartibi: [agenda]\n\nQarorlar:\n[decisions]`
  },
  {
    id: "complaint_response",
    title: "Shikoyatga javob xati",
    category: "xat",
    description: "Bemor shikoyatiga rasmiy javob",
    fields: ["complainant_name", "complaint_date", "complaint_subject", "response_text"],
    content: `JAVOB XATI\n\nHurmatli [complainant_name],\n[complaint_date] sanasida kelib tushgan [complaint_subject] bo'yicha shikoyatingizga munosabatan bildiriramizki...`
  },
  {
    id: "referral_letter",
    title: "Yo'llanma xat",
    category: "xat",
    description: "Bemorni boshqa muassasaga yo'llash",
    fields: ["patient_name", "dob", "diagnosis", "destination_clinic", "doctor_name"],
    content: `YO'LLANMA\n\nBemor: [patient_name], tug'ilgan: [dob]\nTashxis: [diagnosis]\n[destination_clinic] ga konsultatsiya uchun yo'llanadi...`
  },
];
```

### Step 2.2 — Document API routes

**`src/app/api/documents/create/route.ts`**
- POST: authenticated users create document from template
- Body: { templateId, title, fields: Record<string, string>, clinicId? }
- Generates document content by replacing template placeholders with field values
- Also calls Gemini (stub for now — returns placeholder): "AI tomonidan tayyorlangan hujjat varianti"
- Saves to Firestore `documents` collection with status: "draft"
- Returns: { docId, content }

**`src/app/api/documents/[docId]/route.ts`**
- GET: fetch single document (owner or admin only)
- PUT: update document content or status
- DELETE: delete document (owner or admin only)

**`src/app/api/documents/review/route.ts`**
- POST: admin approves or rejects document
- Body: { docId, action: "approve"|"reject", note?: string }
- Updates status in Firestore + sets reviewedBy + reviewNote

**`src/app/api/documents/list/route.ts`**
- GET: returns documents for current user (or all pending docs for admin)
- Query params: ?status=pending_review&role=admin

### Step 2.3 — Document UI pages

**`src/app/(clinic)/hujjatlar/page.tsx`** and **`src/app/(user)/hujjatlarim/page.tsx`**

Build a full document management page:
- Top: "Yangi hujjat yaratish" button → opens modal
- Document creation modal:
  - Step 1: Choose template from grid (8 template cards with category badges)
  - Step 2: Fill in template fields (dynamic form based on template.fields)
  - Step 3: Preview generated document content (editable textarea)
  - Step 4: "Saqlash" (saves as draft) or "Ko'rib chiqishga yuborish" (saves + submits for review)
- Documents list table: title, type, status badge (draft/pending/approved/rejected), date, actions
- Status badges: draft=gray, pending_review=yellow, approved=green, rejected=red
- Actions: View, Edit (if draft), Submit for Review (if draft), Download (if approved)
- Filter tabs: Barchasi | Qoralamalar | Ko'rib chiqishda | Tasdiqlangan | Rad etilgan

**`src/app/(admin)/hujjatlar/page.tsx`**

Admin document review page:
- Two tabs: "Kutilayotganlar" (pending) | "Barcha hujjatlar"
- Pending documents list: document title, owner name, clinic, submitted date, "Ko'rib chiqish" button
- Review modal: shows full document content + AI opinion placeholder + approve/reject buttons + note textarea
- Approved/rejected shows reviewer name + note + date

**`src/app/(clinic)/hujjatlar/[docId]/page.tsx`**
- Full document view page
- Shows: title, status, content, AI opinion, review note if any
- Edit button (if draft), Submit for Review button (if draft)
- Print button

---

## MODULE 3 — REQUEST/LETTER AUTOMATION

### What it does
Clinics and admins have an inbox. Incoming requests are AI-classified and routed. AI drafts replies.

### Step 3.1 — Request API routes

**`src/app/api/requests/create/route.ts`**
- POST: any authenticated user creates a request
- Body: { subject, body, toClinicId?, toAdminId? }
- AI classification (stub): assigns category from ["yuridik", "tibbiy", "ma'muriy", "shikoyat", "taklif"]
- AI urgency (stub): assigns "yuqori"|"o'rta"|"past" based on keywords
- Saves to Firestore requests collection

**`src/app/api/requests/[requestId]/route.ts`**
- GET: fetch request + generate AI draft reply (stub returns placeholder reply)
- PUT: update status, assign to person, save edited reply

**`src/app/api/requests/list/route.ts`**
- GET: returns requests for current clinic or all requests for admin
- Filter by status, category, urgency

### Step 3.2 — Request UI pages

**`src/app/(clinic)/murojaatlar/page.tsx`** and **`src/app/(admin)/murojaatlar/page.tsx`**

Build a full inbox UI:
- Left panel: request list with search + filter (by status, category, urgency)
- Each request row: subject, from, category badge, urgency dot (red/yellow/green), date, status
- Right panel (or modal on mobile): selected request full view
  - Shows: subject, full body, sender info, AI classification badge, urgency badge
  - AI Draft Reply section: shows auto-generated reply with edit button
  - Action buttons: "Qabul qilish" (mark in_review), "Javob berish" (opens reply textarea), "Yopish"
  - Status flow: received → in_review → replied → closed
- Top: "Yangi murojaat" button → opens compose modal
  - Fields: recipient (select clinic or admin), subject, body
  - Send button

**`src/app/(user)/murojaatlar/page.tsx`**
- Simpler version: user can compose and send requests, see their sent requests + status

---

## MODULE 4 — COMPLIANCE MONITORING

### What it does
Tracks expiry dates for licenses, certifications, contracts, protocols. Sends reminders. Auto-generates draft documents when deadlines approach.

### Step 4.1 — Compliance API routes

**`src/app/api/compliance/create/route.ts`**
- POST: create a compliance item (clinic or admin)
- Body: { clinicId, type, title, dueDate, notes? }

**`src/app/api/compliance/list/route.ts`**
- GET: returns compliance items for clinic or all clinics (admin)
- Auto-calculates daysRemaining and urgency on fetch

**`src/app/api/compliance/check/route.ts`**
- POST: runs compliance check — updates statuses, flags overdue items
- Called by a cron job (also callable manually by admin)
- For items due within 7 days: status = "kritik"
- For items due within 30 days: status = "upcoming"
- For overdue items: status = "overdue"

**`src/app/api/compliance/draft/route.ts`**
- POST: auto-generates a draft document for a compliance item
- Maps compliance type to document template:
  - license → generates license renewal request letter
  - certification → generates malaka oshirish buyrug'i
  - contract → generates contract renewal draft
  - protocol → generates meeting protocol for protocol review

### Step 4.2 — Compliance UI pages

**`src/app/(clinic)/muddatlar/page.tsx`**

Build a full compliance dashboard:
- Summary cards at top:
  - 🔴 Muddati o'tgan (overdue count)
  - 🟡 7 kun ichida (due within 7 days)
  - 🟠 30 kun ichida (due within 30 days)
  - 🟢 Jami faol (total active)
- Compliance items table: title, type badge, due date, days remaining, status badge, actions
- Status color coding: overdue=red, ≤7 days=orange, ≤30 days=yellow, ok=green
- Actions per item: "Hujjat yaratish" (auto-generates draft document), "Bajarildi" (marks done), "Tahrirlash"
- "Yangi muddat qo'shish" button → modal form: title, type select, due date picker, notes
- Filter: All | Overdue | Kritik | Upcoming | Done

**`src/app/(admin)/muddatlar/page.tsx`**

Admin sees ALL clinics' compliance:
- Same layout but includes clinic name column
- Top filter: select specific clinic or "Barchasi"
- Export to CSV button
- "Tekshiruv o'tkazish" button → calls /api/compliance/check → refreshes data

---

## MODULE 5 — CLINIC ERP

### What it does
Full clinic management: patients, visits, diagnoses, prescriptions, procedures, schedules, cleaning logs, analytics.

### Step 5.1 — ERP API routes

**`src/app/api/erp/patients/route.ts`**
- GET: list all patients for a clinic (with search by name/phone)
- POST: register new patient visit

**`src/app/api/erp/patients/[patientId]/route.ts`**
- GET: full patient history (all visits, diagnoses, prescriptions)
- PUT: update patient info

**`src/app/api/erp/visits/route.ts`**
- GET: visits for a clinic filtered by date range
- POST: create new visit record
- Body: { patientId, clinicId, visitDate, diagnosis, prescriptions[], procedures[], assignedDoctorId, nextVisit? }

**`src/app/api/erp/visits/[visitId]/route.ts`**
- GET, PUT: fetch or update a visit record

**`src/app/api/erp/schedule/route.ts`**
- GET: today's procedure schedule for a clinic
- POST: add procedure to schedule
- Body: { visitId, patientId, procedureType, scheduledAt, assignedTo, repeatInterval? }

**`src/app/api/erp/cleaning/route.ts`**
- GET: cleaning logs for a clinic (today or date range)
- POST: log a cleaning task completion
- Body: { clinicId, task, completedBy, completedAt, notes? }

**`src/app/api/erp/analytics/route.ts`**
- GET: analytics data for a clinic
- Returns: { dailyVisits[], topDiagnoses[], topPrescriptions[], monthlyTrend[], doctorStats[] }
- Date range filter via query params

### Step 5.2 — ERP UI pages

**`src/app/(clinic)/erp/page.tsx`** — ERP Dashboard

Top tabs: Bemorlar | Vizitlar | Jadval | Tozalash | Analitika

**Tab 1 — Bemorlar (Patients)**
- Search bar (search by name or phone)
- Patients table: name, phone, last visit date, visit count, actions
- "Yangi bemor" button → quick-add form (name, phone, DOB)
- Click patient → patient detail modal: full visit history, diagnoses, prescriptions timeline

**Tab 2 — Vizitlar (Visits)**
- Date picker to filter by day
- Today's visits list: patient name, doctor, diagnosis summary, procedures, time
- "Yangi vizit" button → visit form:
  - Patient search/select (searchable dropdown)
  - Assigned doctor (select from clinic's doctors)
  - Visit date + time
  - Diagnosis (textarea)
  - Prescriptions (add multiple: drug name + dosage + frequency + duration)
  - Procedures (add multiple: procedure name + assigned to + date/time)
  - Next visit date (optional)
- Each visit card: patient name, diagnosis, prescriptions count, procedures count, doctor

**Tab 3 — Jadval (Schedule)**
- Calendar view of today's procedures
- Each slot: patient name, procedure type, assigned staff, time, status (pending/done)
- Mark as done button per procedure
- "Protsedura qo'shish" button

**Tab 4 — Tozalash (Cleaning logs)**
- Cleaning tasks list with checkboxes:
  - Operatsiya xonasi tozalash
  - Kutish zali tozalash
  - Sterilizatsiya
  - Chiqindilarni olib chiqish
  - Asbob-uskunalarni dezinfeksiya
- Each task: checkbox (mark done), responsible person, time completed, notes
- "Tozalash jadvali" — shows which tasks are done today vs pending

**Tab 5 — Analitika (Analytics)**
- Date range picker (default: last 30 days)
- Stat cards: total visits, unique patients, top diagnosis, busiest day
- Charts using recharts library:
  - Line chart: daily visits trend
  - Bar chart: top 5 diagnoses
  - Pie chart: procedure types distribution
  - Bar chart: visits by doctor
- Export to CSV button

---

## MODULE 6 — ANTI-INSPECTION MODULE

### What it does
Helps clinics prepare for government inspections: checklists, risk scoring, simulation, remediation documents.

### Step 6.1 — Inspection data

Create `src/data/inspection-checklists.ts`:

```typescript
export const CHECKLISTS = {
  sanitation: {
    title: "Sanitariya talablari",
    items: [
      { id: "s1", label: "Xonalar tozalik jurnali to'ldirilganmi?", riskLevel: "high" },
      { id: "s2", label: "Sterilizatsiya protokollari mavjudmi?", riskLevel: "high" },
      { id: "s3", label: "Tibbiy chiqindilar utilizatsiya shartnomasi bormi?", riskLevel: "high" },
      { id: "s4", label: "Dezinfeksiya vositalari sertifikatlari mavjudmi?", riskLevel: "medium" },
      { id: "s5", label: "Suv ta'minoti sifat ko'rsatkichlari normalmi?", riskLevel: "medium" },
      { id: "s6", label: "Shamollatish tizimi ishlayaptimi?", riskLevel: "medium" },
      { id: "s7", label: "Sanitariya tugunlari tozalik holatda?", riskLevel: "low" },
    ]
  },
  licensing: {
    title: "Litsenziya va ruxsatnomalar",
    items: [
      { id: "l1", label: "Tibbiy faoliyat litsenziyasi amal qilyaptimi?", riskLevel: "high" },
      { id: "l2", label: "Litsenziyada ko'rsatilgan xizmat turlari mos keladi?", riskLevel: "high" },
      { id: "l3", label: "Yangi xizmatlar uchun qo'shimcha ruxsatnoma olinganmi?", riskLevel: "high" },
      { id: "l4", label: "Davlat ro'yxatidan o'tish guvohnomasi mavjudmi?", riskLevel: "medium" },
      { id: "l5", label: "Litsenziya ko'zga ko'rinadigan joyda osib qo'yilganmi?", riskLevel: "low" },
    ]
  },
  documentation: {
    title: "Tibbiy hujjatlar",
    items: [
      { id: "d1", label: "Bemor tibbiy kartalari to'g'ri yuritilganmi?", riskLevel: "high" },
      { id: "d2", label: "Davolash standartlari protokollari mavjudmi?", riskLevel: "high" },
      { id: "d3", label: "Retsept daftarlari tartibda?", riskLevel: "high" },
      { id: "d4", label: "Tibbiy asboblar texnik pasportlari bormi?", riskLevel: "medium" },
      { id: "d5", label: "Bemor rozilik shakllari imzolangan?", riskLevel: "medium" },
      { id: "d6", label: "Narxlar ro'yxati ko'zga ko'rinadigan joyda?", riskLevel: "low" },
    ]
  },
  staff: {
    title: "Xodimlar hujjatlari",
    items: [
      { id: "st1", label: "Barcha shifokorlar tibbiy diplomiga ega?", riskLevel: "high" },
      { id: "st2", label: "Malaka toifalari amal qilyaptimi?", riskLevel: "high" },
      { id: "st3", label: "Malaka oshirish sertifikatlari joriy?", riskLevel: "high" },
      { id: "st4", label: "Sanitariya daftarchalari mavjud?", riskLevel: "high" },
      { id: "st5", label: "Mehnat shartnomalari rasmiylashtirilgan?", riskLevel: "medium" },
      { id: "st6", label: "Mas'uliyat sug'urtasi mavjud?", riskLevel: "medium" },
    ]
  }
};

export const RISK_WEIGHTS = { high: 3, medium: 2, low: 1 };
```

### Step 6.2 — Inspection API routes

**`src/app/api/inspection/assess/route.ts`**
- POST: save checklist assessment results + calculate risk score
- Body: { clinicId, checklistType, items: { id, status: "pass"|"fail"|"warning" }[] }
- Algorithm:
  - For each failed item: add riskWeight to total risk score
  - overallRisk: score > 10 → "high", score > 5 → "medium", else → "low"
- Saves to inspection_records collection
- Returns: { recordId, overallRisk, score, recommendations[] }

**`src/app/api/inspection/records/route.ts`**
- GET: inspection history for a clinic

**`src/app/api/inspection/simulate/route.ts`**
- POST: run an inspector scenario simulation
- Body: { clinicId, scenarioType: "routine"|"complaint-based"|"surprise" }
- Returns a realistic simulation: list of inspector questions + what they check
- Each scenario type focuses on different checklist areas

### Step 6.3 — Inspection UI pages

**`src/app/(clinic)/anti-tekshiruv/page.tsx`**

Top tabs: Tekshiruv | Simulyatsiya | Tarix | Hisobot

**Tab 1 — Tekshiruv (Checklist Assessment)**
- 4 checklist category cards: Sanitariya | Litsenziya | Hujjatlar | Xodimlar
- Click category → opens full checklist
- Each checklist item: label, risk badge (yuqori/o'rta/past), 3-button select (✅ O'tdi | ⚠️ Ogohlantirish | ❌ Muvaffaqiyatsiz)
- Progress bar showing completion %
- "Baholash" button at bottom → submits, shows risk score
- Risk score display: large number + color (green/yellow/red) + overall risk label
- Failed items list with remediation suggestions
- "Hujjat yaratish" button per failed item → auto-generates fix document

**Tab 2 — Simulyatsiya (Inspector Simulation)**
- 3 scenario cards: 
  - 📋 Rejalashtirilgan tekshiruv (Routine)
  - 📝 Shikoyat asosida (Complaint-based)
  - ⚡ Kutilmagan tekshiruv (Surprise)
- Click scenario → start simulation
- Simulation shows: step-by-step inspector flow
  - "Inspektor kiradi va dastlab so'raydi: ..."
  - User marks each step as ready/not ready
  - At end: readiness score + what to fix

**Tab 3 — Tarix (History)**
- Table of past assessments: date, checklist type, overall risk, score, actions
- Click row → view full assessment details

**Tab 4 — Hisobot (Report)**
- Generate PDF report button (uses browser print for now)
- Shows: clinic name, date, all 4 checklist results, risk scores, recommendations
- Print-friendly layout

**`src/app/(admin)/tekshiruv/page.tsx`**
- Admin sees all clinics' inspection records
- Filter by clinic, risk level, date
- Summary: how many clinics are high/medium/low risk

---

## SHARED COMPONENTS TO BUILD

### `src/components/shared/StatusBadge.tsx`
Reusable badge for all status types across the platform.

### `src/components/shared/DataTable.tsx`
Reusable table with: sorting, filtering, pagination, export to CSV.

### `src/components/shared/FileUpload.tsx`
Reusable file upload with drag-and-drop, progress bar, file type validation.

### `src/components/shared/ConfirmDialog.tsx`
Reusable confirmation dialog for destructive actions.

### `src/components/shared/EmptyState.tsx`
Reusable empty state component with icon, title, description, action button.

### `src/components/shared/PageHeader.tsx`
Reusable page header with title, description, and action buttons slot.

---

## ADMIN SUPER DASHBOARD

Update `src/app/(admin)/dashboard/page.tsx` to show real platform-wide stats:

- Total clinics registered
- Total users (doctors + patients)
- Documents pending review (with quick-access link)
- Overdue compliance items across all clinics
- High-risk inspection records
- Recent requests awaiting response
- Platform activity chart (last 30 days): new registrations, documents created, requests submitted
- Quick action buttons: Review documents | Check compliance | View inspections

---

## PROFILE PAGES

Build complete profile pages for all roles:

**`src/app/(user)/profil/page.tsx`** — Doctor/Patient profile
- Shows all profile fields with edit button
- For Doctor: document uploads section (re-upload expired docs)
- Profile completion progress bar
- Account settings: change password, notification preferences

**`src/app/(clinic)/profil/page.tsx`** — Clinic profile  
- All clinic fields editable
- Document uploads: license + sanitary cert with expiry dates
- Shows current license expiry with warning if <30 days

**`src/app/(admin)/sozlamalar/page.tsx`** — Admin settings
- Platform stats overview
- Manage admin accounts (view existing admins)
- System health: Firestore connection status

---

## NAVIGATION UPDATES

Update ALL sidebars to link to the new pages:

**Admin sidebar:**
- /dashboard → Bosh sahifa
- /klinikalar → Klinikalar (list of all clinics)
- /foydalanuvchilar → Foydalanuvchilar
- /hujjatlar → Hujjatlar (pending reviews)
- /murojaatlar → Murojaatlar
- /muddatlar → Muddatlar
- /tekshiruv → Tekshiruv
- /sozlamalar → Sozlamalar

**Clinic sidebar:**
- /dashboard → Bosh sahifa
- /hujjatlar → Hujjatlarim
- /murojaatlar → Murojaatlar
- /muddatlar → Muddatlar
- /erp → ERP Tizim
- /anti-tekshiruv → Anti-Tekshiruv
- /profil → Profil

**User sidebar:**
- /dashboard → Bosh sahifa
- /hujjatlarim → Hujjatlarim
- /murojaatlar → Murojaatlar
- /profil → Profil

---

## ADMIN — ALL CLINICS PAGE

**`src/app/(admin)/klinikalar/page.tsx`**
- Table of all registered clinics: name, region, license expiry, staff count, status, actions
- Search by name, filter by region
- Click clinic → clinic detail view:
  - All clinic profile info
  - Their compliance items
  - Their inspection records
  - Their documents
  - Their requests

**`src/app/(admin)/foydalanuvchilar/page.tsx`**
- Tabs: Shifokorlar | Bemorlar
- Table with profile info, registration date, profile completion
- View profile button

---

## INSTALL ADDITIONAL DEPENDENCIES

```bash
npm install recharts
npm install @types/recharts
npm install react-day-picker
npm install date-fns
```

---

## QUALITY REQUIREMENTS

- Every API route validates auth token server-side — no exceptions
- Role-based access enforced on every route (clinic sees only own data, admin sees all)
- **5-LANGUAGE RULE (NON-NEGOTIABLE): Every UI string — labels, buttons, placeholders, tooltips, error messages, empty states, section headers, model descriptions, toasts — must be available in ALL 5 languages: `uz` (Uzbek Latin), `uz_cyrillic` (Uzbek Cyrillic), `ru` (Russian), `en` (English), `kk` (Kazakh). No fallbacks, no uz_cyrillic→uz shortcuts. Use `useLanguage()` hook or add keys to the page-local language object. Never hardcode strings or ternary-chain only 2–3 languages.**
- Every data-fetching page shows skeleton loader while loading
- Every form has Zod validation with Uzbek error messages
- Every destructive action (delete, reject) shows confirmation dialog
- All tables support sorting and filtering
- Mobile responsive — sidebar collapses on mobile
- Empty states for all list pages
- Toast notifications (sonner) for all success and error states
- No `any` TypeScript types anywhere
- All dates displayed in Uzbek format using date-fns

---

## AI STUBS (for Modules 2 & 3)

Since Module 1 (RAG) will be connected later, build stubs for AI features:

For document drafting → return this placeholder:
```
"AI yordamchi hujjat tahlili: Ushbu hujjat [template_title] shabloni asosida tayyorlangan. 
Hujjat O'zbekiston qonunchiligiga mos keladi. Huquqiy ekspert tomonidan ko'rib chiqilishi tavsiya etiladi."
```

For request AI classification → classify by keywords:
- Contains "shikoyat" or "ariza" → category: "shikoyat"
- Contains "litsenziya" or "ruxsat" → category: "yuridik"
- Contains "dori" or "davolash" → category: "tibbiy"
- Default → category: "ma'muriy"

For request draft reply → return:
```
"Hurmatli [sender_name], murojaatingiz qabul qilindi va ko'rib chiqilmoqda. 
Yaqin kunlarda javob beramiz. Hurmat bilan, [clinic_name] ma'muriyati."
```

These stubs will be replaced with real Gemini calls when Module 1 is connected.

---

## WHEN DONE, REPORT:

1. List every new page and API route created
2. Confirm `npm run dev` runs cleanly with no TypeScript errors
3. Screenshot each module's main page
4. List any issues or blockers encountered
5. Confirm all 5 modules are fully navigable in the browser

Do not stop until all modules are complete and the app compiles cleanly.


---

---

## 🏗️ PERMANENT PROJECT MEMORY
## (Do not modify this section — it applies to all 6 weeks)

---

## 🎯 PROJECT OVERVIEW

AI-powered administrative platform for the Association of Private Clinics of Uzbekistan.
Multi-role SaaS. Uzbek/Russian/English multilingual.

- No ERI/ECP digital signature
- No OneID integration
- No SSV Ministry API (fallback: CSV import/export)
- Auth: Email/password + Google OAuth (Firebase Auth)
- All IP belongs 100% to client from day one
- Contract signed 03.04.2026 | First payment 30,000,000 so'm received

---

## 👥 ACCOUNT TYPES & ROLES

### ADMIN (max 3 — seed script only, NOT self-registerable)
- Full access to all data, all clinics, all users, all documents, all stats
- Approves/rejects documents, manages compliance platform-wide

### CLINIC (unlimited — self-register)
Required profile: clinic name, license number + expiry, address, region/district, specialties, staff counts, contact person, phone, license PDF + sanitary cert PDF
Access: all 6 modules, own data only — cannot see other clinics

### DOCTOR (self-register as USER subtype)
Required profile: full name, specialization, category (1st/2nd/highest), diploma number, institution, cert expiry, linked clinic (optional), phone, diploma + cert + license PDFs
Access: AI advisor, document drafting, own library

### PATIENT (self-register as USER subtype)
Required profile: full name, DOB, gender, phone, blood type (opt), conditions (opt), allergies (opt)
Access: AI advisor, own library

---

## 🏗️ TECH STACK

| Layer         | Technology                 | Notes                                      |
|---------------|----------------------------|--------------------------------------------|
| Frontend      | Next.js 14 (App Router)    | TypeScript, Tailwind CSS                   |
| Backend       | Next.js API Routes         | Serverless                                 |
| Database      | Firebase Firestore         | Real-time, NoSQL                           |
| Auth          | Firebase Authentication    | Google OAuth + email/password              |
| File Storage  | Firebase Storage           | PDFs, credential uploads                   |
| AI / RAG      | Google AI Studio + Gemini  | API key: Google AI Studio (Paid Tier 1)    |
| Vector Search | Vertex AI Vector Search    | RAG over client PDFs                       |
| OCR           | Google Document AI         | Scanned PDFs — covered by GCP credits      |
| Deployment    | Cloud Run (GCP)            | Covered by GCP credits                     |
| Email         | Resend                     | Deadline reminders, notifications          |
| Styling       | Tailwind CSS + shadcn/ui   |                                            |

### Available Gemini Models (via GOOGLE_AI_API_KEY, Paid Tier 1)

| Model ID              | Display Name            | RPM   | Best For                                |
|-----------------------|-------------------------|-------|-----------------------------------------|
| gemini-2.5-flash      | Gemini 2.5 Flash        | 1,000 | AI chat (fast), classification, drafting |
| gemini-2.5-pro        | Gemini 2.5 Pro          | 150   | Deep analysis, compliance, remediation  |
| gemini-2.0-flash      | Gemini 2 Flash          | 2,000 | AI chat (balanced), everyday tasks      |
| gemini-3-flash        | Gemini 3 Flash          | 1,000 | Next-gen fast model                     |
| gemini-3.1-pro        | Gemini 3.1 Pro          | 25    | Most capable, complex reasoning         |
| gemini-2.0-flash-lite | Gemini 2 Flash Lite     | 4,000 | Ultra-fast lightweight tasks            |
| gemini-2.5-flash-lite | Gemini 2.5 Flash Lite   | —     | Light flash variant                     |
| text-embedding-004    | Text Embedding           | —     | RAG embeddings                          |
| imagen-4-fast         | Imagen 4 Fast Generate  | 10    | Image generation (fast)                 |
| imagen-4              | Imagen 4 Generate       | 3     | Image generation (quality)              |
| gemini-2.5-flash-tts  | Gemini 2.5 Flash TTS    | 10    | Text-to-speech                          |
| gemini-2.5-pro-tts    | Gemini 2.5 Pro TTS      | 10    | Text-to-speech (quality)                |
| veo-3                 | Veo 3 Generate          | 1     | Video generation                        |
| lyria-3-pro           | Lyria 3 Pro             | 1     | Music generation                        |

### AI Feature → Model Mapping

| Feature                      | Model Used        | API Route                        |
|------------------------------|-------------------|----------------------------------|
| AI Chat (fast mode)          | gemini-2.5-flash  | /api/ai-chat                     |
| AI Chat (balanced mode)      | gemini-2.0-flash  | /api/ai-chat                     |
| AI Chat (deep mode)          | gemini-2.5-pro    | /api/ai-chat                     |
| AI Document Drafting         | gemini-2.5-flash  | /api/documents (POST, useAI)     |
| AI Request Classification    | gemini-2.5-flash  | /api/requests (POST)             |
| AI Request Reply Drafting    | gemini-2.5-flash  | /api/requests (POST)             |
| AI Visit Summary             | gemini-2.5-pro    | /api/erp/ai-summary              |
| AI Compliance Advisor        | gemini-2.5-pro    | /api/compliance/ai-advice        |
| AI Inspection Remediation    | gemini-2.5-pro    | /api/inspection/remediate        |
| AI Inspection Recommendations| gemini-2.0-flash  | /api/inspection (POST)           |

---

## 📁 PROJECT STRUCTURE

```
src/
├── app/
│   ├── (auth)/                   # login, register, onboarding
│   ├── (admin)/                  # admin dashboard + all modules
│   ├── (clinic)/                 # clinic dashboard + modules
│   ├── (user)/                   # doctor/patient dashboard
│   └── api/
│       ├── auth/
│       ├── ai/query/             # Module 1: RAG
│       ├── ai/draft/             # Module 2 & 3: drafting
│       ├── documents/            # Module 2
│       ├── requests/             # Module 3
│       ├── compliance/           # Module 4
│       ├── clinic-erp/           # Module 5
│       └── inspection/           # Module 6
├── components/
│   ├── ui/                       # shadcn/ui
│   ├── admin/
│   ├── clinic/
│   ├── user/
│   └── shared/
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   └── useRequireAuth.ts
├── lib/
│   ├── firebase.ts
│   ├── firebase-admin.ts
│   ├── firestore.ts
│   ├── vertex-ai.ts
│   ├── rag.ts
│   ├── auth.ts
│   └── notifications.ts
├── types/
│   └── index.ts
└── middleware.ts
```

---

## 🔑 ENVIRONMENT VARIABLES (.env.local)

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_ADMIN_SDK_KEY=
GOOGLE_CLOUD_PROJECT_ID=seismic-envoy-486214-b5
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_INDEX_ENDPOINT=
DOCUMENT_AI_PROCESSOR_ID=
RESEND_API_KEY=
```

---

## 📦 FIRESTORE COLLECTIONS SCHEMA

```
users/{uid}
  role: 'admin'|'clinic'|'doctor'|'patient'
  email, displayName, createdAt, profileComplete: boolean

clinics/{clinicId}
  name, licenseNumber, licenseExpiry, address, region, district
  specialties[], doctorCount, nurseCount, adminCount
  contactPerson, phone, email
  documents: { license: url, sanCert: url }
  createdAt, updatedAt

doctors/{uid}
  fullName, specialization, category
  diplomaNumber, institution, certExpiry
  linkedClinicId?, phone
  documents: { diploma: url, certificate: url, license: url }

patients/{uid}
  fullName, dob, gender, phone, email
  bloodType?, conditions?[], allergies?[]

documents/{docId}
  ownerId, ownerType, clinicId?, title, type
  status: 'draft'|'pending_review'|'approved'|'rejected'
  content, storageUrl?, createdAt, updatedAt
  reviewedBy?, reviewNote?

compliance/{itemId}
  clinicId, type: 'license'|'certification'|'contract'|'protocol'
  title, dueDate
  status: 'upcoming'|'overdue'|'done'
  reminderSent, autoDraftDocId?

requests/{requestId}
  fromUserId, toClinicId?, toAdminId?
  subject, body, aiClassification?, assignedTo?
  status: 'received'|'in_review'|'replied'|'closed'
  draftReplyId?, createdAt

erp_records/{recordId}
  clinicId, patientId, visitDate, diagnosis
  prescriptions[], procedures[], nextVisit?
  assignedDoctorId
  cleaningLogs: [{ task, completedAt, completedBy }]

inspection_records/{id}
  clinicId, checklistType: 'sanitation'|'licensing'|'documentation'|'staff'
  items: [{ label, status: 'pass'|'fail'|'warning', riskLevel: 'high'|'medium'|'low' }]
  overallRisk: 'high'|'medium'|'low'
  recommendations[], generatedDocIds[], createdAt

rag_queries/{queryId}
  userId, userRole, question, answer, sources[], createdAt
```

---

## 🤖 MODULE SPECS

### MODULE 1 — AI Legal-Medical Advisor
RAG over client-supplied PDFs (Uzbek law, SanQvaN, ShNQ, QMQ, UzMSt, SSV orders, WHO, clinical protocols)
Pipeline: upload → OCR (Document AI if scanned) → chunk 512 tokens/50 overlap → embed → Vertex AI Vector Search
Query: question → embed → top-k search → Gemini 1.5 Pro + context → answer with source citations
All 4 roles can query. Store history in rag_queries.

### MODULE 2 — Document Management + AI Drafting
Template library in Firestore + Storage. AI drafts from template + user context + uploaded PDFs.
Review flow: AI opinion inline → Admin human review. Status: draft→pending_review→approved/rejected.

### MODULE 3 — Request/Letter Automation
Inbox per Clinic + Admin. Gemini classifies type + urgency → routes to department → AI draft reply → staff edits + sends.
Status: received→in_review→replied→closed

### MODULE 4 — Compliance Monitoring
Tracks license/cert/contract/protocol expiries. Cloud Scheduler daily cron.
Flags at 30/14/7 days. Auto-generates draft docs. Notifies clinic manager by email.
Admin sees all clinics' compliance.

### MODULE 5 — Clinic ERP
Patient visits: diagnosis, prescriptions, procedures, scheduling, cleaning logs.
Analytics: visit trends, top diagnoses, medication usage.
SSV integration DEFERRED — fallback: CSV import/export.

### MODULE 6 — Anti-Inspection Module
Checklists: sanitation, licensing, documentation, staff credentials.
Auto risk scoring (high/medium/low). Inspector scenario simulation.
Output: risk report + action list + auto-drafted fix documents.

---

## 📋 BUILD SEQUENCE

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1 | Foundation | Auth, profiles, dashboards, Firebase setup |
| 2 | Module 1 | RAG pipeline, PDF ingestion, AI query UI |
| 3 | Modules 2 & 3 | Document drafting, request automation |
| 4 | Module 4 | Compliance tracking, cron, email alerts |
| 5 | Modules 5 & 6 | ERP, anti-inspection |
| 6 | Delivery | Integration testing, deployment, training |

MVP (triggers 2nd payment of 40,000,000 so'm) = Modules 1 + 2 + 3 complete.
Full delivery (triggers 3rd payment of 50,000,000 so'm) = All 6 modules + training.

---

## ⚠️ KNOWN RISKS

1. SSV API — no public docs. Clarify before Week 5. Fallback: CSV.
2. Scanned PDFs — need Document AI OCR. Test Week 2.
3. Uzbek AI quality — test Gemini 1.5 Pro in Uzbek early Week 2.
4. Module 5 scope — heaviest module. ERP analytics can slip to Phase 1.5 if needed.
5. Client PDFs — must arrive within 5 days of signing or Week 2 is blocked.

---

## 🚫 OUT OF SCOPE — DO NOT BUILD

ERI/ECP signature, OneID, mobile app, payments, interactive map, reputation analysis,
smart recruitment, Legal Shield, ministry auto-submit, patient flow ML, Knowledge Bank.

---

## 💡 CLAUDE CODE RULES — APPLY EVERY SESSION

1. Read this entire file before writing any code
2. Stick to the Firestore schema — no new collections or ad-hoc fields
3. Zero `any` TypeScript types
4. All Gemini calls → `/lib/vertex-ai.ts` only
5. All Firestore calls → `/lib/firestore.ts` only
6. Validate role server-side on every API route — never trust client claims
7. State the module number before building each feature
8. One module per session — do not mix
9. When context gets long → stop, new session, re-read CLAUDE.md first
10. Every UI string must exist in all 5 languages: uz, uz_cyrillic, ru, en, kk — no shortcuts or fallbacks
