# CLAUDE.md — Smart Medical Association Platform
# OXFORDER MChJ | CEO: Odilbek Iriskulov | ceo@oxforder.uz
# Client: Tibbiyot Tashkilotlari Assotsiatsiyasi | Muxitdinov Saloxiddin Zuxritdin o'g'li
# Contract: 120,000,000 so'm (3 stages) | Maintenance: 1,800,000 so'm/month
# Deadline: 6 weeks from 03.04.2026 → 15.05.2026
# GCP Project ID: seismic-envoy-486214-b5
# Last updated: 2026-04-03

---

## ✅ CURRENT TASK — WEEK 1: FULL FOUNDATION

> This section changes every week. Everything below the horizontal rule is permanent.
> When Week 1 is done, replace this section with Week 2 tasks.

### What to build this week (in order — do not skip steps):

**STEP 1 — Scaffold the project**
```bash
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```
Then install dependencies:
```bash
npm install firebase firebase-admin
npm install @google-cloud/vertexai
npm install react-hook-form zod @hookform/resolvers
npm install @tanstack/react-query
npm install sonner date-fns clsx tailwind-merge
npm install lucide-react @radix-ui/react-icons
npm install next-themes
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label card form select textarea badge avatar dropdown-menu navigation-menu sheet dialog alert-dialog table tabs progress skeleton separator
```
shadcn init: Style=Default, Base color=Slate, CSS variables=Yes

---

**STEP 2 — Environment variables**

Create `.env.local`:
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
Create `.env.example` with same keys, no values. Add `.env.local` to `.gitignore`.

---

**STEP 3 — TypeScript types** (`src/types/index.ts`)

Define these interfaces:
- `UserRole = 'admin' | 'clinic' | 'doctor' | 'patient'`
- `BaseUser` — uid, email, displayName, role, profileComplete, createdAt, photoURL?
- `ClinicUser extends BaseUser` — clinicName, licenseNumber, licenseExpiry, address, region, district, specialties[], doctorCount, nurseCount, adminCount, contactPerson, phone, documents{license, sanCert}
- `DoctorUser extends BaseUser` — fullName, specialization, category('first'|'second'|'highest'), diplomaNumber, institution, certExpiry, linkedClinicId?, phone, documents{diploma, certificate, license}
- `PatientUser extends BaseUser` — fullName, dob, gender, phone, bloodType?, conditions?[], allergies?[]
- `Document` — id, ownerId, ownerType, clinicId?, title, type, status('draft'|'pending_review'|'approved'|'rejected'), content, storageUrl?, createdAt, updatedAt, reviewedBy?, reviewNote?
- `ComplianceItem` — id, clinicId, type('license'|'certification'|'contract'|'protocol'), title, dueDate, status('upcoming'|'overdue'|'done'), reminderSent, autoDraftDocId?
- `Request` — id, fromUserId, toClinicId?, toAdminId?, subject, body, aiClassification?, assignedTo?, status('received'|'in_review'|'replied'|'closed'), draftReplyId?, createdAt
- `ERPRecord` — id, clinicId, patientId, visitDate, diagnosis, prescriptions[], procedures[], nextVisit?, assignedDoctorId, cleaningLogs[{task, completedAt, completedBy}]
- `InspectionRecord` — id, clinicId, checklistType, items[{label, status, riskLevel}], overallRisk, recommendations[], generatedDocIds[], createdAt
- `RAGQuery` — id, userId, userRole, question, answer, sources[], createdAt

No `any` types anywhere. Ever.

---

**STEP 4 — Firebase library files**

`src/lib/firebase.ts` — Firebase client init (auth, db, storage, googleProvider)
`src/lib/firebase-admin.ts` — Admin SDK init using FIREBASE_ADMIN_SDK_KEY env var
`src/lib/firestore.ts` — All DB helpers:
  - getUser(uid), createUser(uid, data), updateUser(uid, data), getUsersByRole(role)
  - getClinic(id), getAllClinics(), updateClinic(id, data)
  - getDocumentsByOwner(ownerId), getPendingDocuments()
  - getComplianceByClinic(clinicId), getOverdueCompliance()
  - getRequestsByClinic(clinicId)
  - getERPByClinic(clinicId)
  - saveRAGQuery(data)
`src/lib/auth.ts` — loginWithEmail, registerWithEmail, loginWithGoogle, logout, onAuthChange, createUserProfile, getUserRole

---

**STEP 5 — Auth context** (`src/contexts/AuthContext.tsx`)

`useAuth()` hook exposing: user, userRole, profileComplete, loading
Reads Firestore on auth state change to get role + profileComplete.

---

**STEP 6 — Root layout** (`src/app/layout.tsx`)

Wrap in AuthProvider. Inter font with cyrillic subset. Sonner Toaster (top-right, richColors).
Metadata: title="Smart Medical Association", lang="uz"

---

**STEP 7 — Route structure**

```
src/app/
├── page.tsx                    ← redirect: no auth→/login, incomplete→/onboarding/[role], else→/dashboard
├── (auth)/
│   ├── layout.tsx              ← centered card layout
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── onboarding/
│       ├── clinic/page.tsx
│       ├── doctor/page.tsx
│       └── patient/page.tsx
├── (admin)/
│   ├── layout.tsx              ← sidebar layout
│   └── dashboard/page.tsx
├── (clinic)/
│   ├── layout.tsx              ← sidebar layout
│   └── dashboard/page.tsx
└── (user)/
    ├── layout.tsx              ← sidebar layout
    └── dashboard/page.tsx
```

---

**STEP 8 — Login page** (full implementation)

- Email + password with zod validation, Uzbek error messages
- Google OAuth button
- Loading states on buttons
- Toast errors via sonner
- Link to register
- On success: role-based redirect

**Register page** (full implementation)

- Email + password form (min 8 chars, confirm password)
- Google OAuth button
- Role selection step — 3 cards: 🏥 Klinika | 👨‍⚕️ Shifokor | 👤 Bemor
- NO admin option (admin is seed-only)
- Creates Firebase Auth user + Firestore doc with role
- Redirects to correct onboarding page

---

**STEP 9 — Onboarding forms** (full implementation, all Uzbek UI)

**Clinic** (3-step with progress bar):
- Step 1: klinika nomi, litsenziya raqami, litsenziya muddati (datepicker), viloyat/tuman (select), to'liq manzil
- Step 2: mutaxassisliklar (multi-select), shifokorlar/hamshiralar/ma'murlar soni, mas'ul shaxs, telefon
- Step 3: litsenziya PDF upload, sanitariya sertifikati PDF upload (Firebase Storage, progress bar)
- On complete: profileComplete=true → clinic dashboard

**Doctor** (2-step):
- Step 1: to'liq ism, mutaxassislik, malaka toifasi (select), diplom raqami, muassasa, sertifikat muddati, klinika (optional searchable select), telefon
- Step 2: diplom/sertifikat/litsenziya PDF uploads
- On complete: profileComplete=true → user dashboard

**Patient** (single step):
- to'liq ism, tug'ilgan sana, jinsi, telefon, qon guruhi (optional), kasalliklar (optional), allergiyalar (optional)
- On complete: profileComplete=true → user dashboard

---

**STEP 10 — Dashboard shells** (all roles, responsive sidebar)

Every dashboard has: collapsible sidebar, top header (avatar + name + role badge + logout), active route highlight, mobile hamburger.

**Admin sidebar:** Bosh sahifa, Klinikalar, Foydalanuvchilar, AI Maslahatchi, Hujjatlar, Murojaatlar, Muddatlar, Tekshiruv, Sozlamalar

**Clinic sidebar:** Bosh sahifa, AI Maslahatchi, Hujjatlarim, Murojaatlar, Muddatlar, ERP Tizim, Anti-Tekshiruv, Profil

**User sidebar:** Bosh sahifa, AI Maslahatchi, Hujjatlarim, Profil

**Dashboard home stat cards** (load from Firestore, show skeletons while loading):
- Admin: total klinikalar, total foydalanuvchilar, kutilayotgan hujjatlar, muddati o'tayotgan elementlar
- Clinic: bugungi bemorlar, kutilayotgan hujjatlar, yaqinlashayotgan muddatlar, oxirgi murojaatlar
- Doctor/Patient: oxirgi AI so'rovlar, mening hujjatlarim, profil to'liqlik (progress bar)

---

**STEP 11 — Middleware** (`src/middleware.ts`)

Protect all routes. Redirect unauthenticated users to /login. Use firebase-token cookie.

---

**STEP 12 — Admin seed script** (`scripts/seed-admin.ts`)

One-time script: creates admin@smartmedical.uz / Admin@2026! in Firebase Auth + Firestore with role='admin', profileComplete=true.

---

### Quality requirements for Week 1:
- All form validation with Zod, all error messages in Uzbek
- Every async operation has try/catch + sonner toast on error
- Every data-loading page shows skeleton while loading
- All UI text in Uzbek
- Mobile responsive — works on phone
- File uploads show progress percentage
- Zero `any` TypeScript types

### When done, report:
1. All files created
2. Any issues
3. What to fill in `.env.local`
4. How to run: `npm run dev`

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
| AI / RAG      | Vertex AI + Gemini 1.5 Pro | GCP: $2,000 (GFS) + $1,000 (GenAI)        |
| Vector Search | Vertex AI Vector Search    | RAG over client PDFs                       |
| OCR           | Google Document AI         | Scanned PDFs — covered by GCP credits      |
| Deployment    | Cloud Run (GCP)            | Covered by GCP credits                     |
| Email         | Resend                     | Deadline reminders, notifications          |
| Styling       | Tailwind CSS + shadcn/ui   |                                            |

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
10. All UI text in Uzbek
