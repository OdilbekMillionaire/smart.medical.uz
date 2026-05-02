import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const BASE_URL = process.env.QA_BASE_URL ?? 'http://localhost:3000';
const RUN_ID = `qa_${Date.now()}`;
const roles = ['admin', 'clinic', 'doctor', 'patient'];

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')];
      })
  );
}

const fileEnv = ['.env.local', '.env.production', '.env'].reduce(
  (acc, file) => ({ ...acc, ...parseEnvFile(resolve(process.cwd(), file)) }),
  {}
);
const env = { ...fileEnv, ...process.env };

function requiredEnv(name) {
  const value = env[name];
  if (!value) throw new Error(`${name} is required for Firebase role QA`);
  return value;
}

function parseServiceAccount(value) {
  try {
    return JSON.parse(value);
  } catch {
    return JSON.parse(Buffer.from(value, 'base64').toString('utf8'));
  }
}

function initAdmin() {
  if (getApps().length) return;
  const serviceAccount = parseServiceAccount(requiredEnv('FIREBASE_ADMIN_SDK_KEY'));
  initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || env.GOOGLE_CLOUD_PROJECT_ID,
  });
}

async function exchangeCustomToken(customToken) {
  const apiKey = requiredEnv('NEXT_PUBLIC_FIREBASE_API_KEY');
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`Failed to exchange custom token: ${res.status} ${JSON.stringify(data)}`);
  }
  const data = await res.json();
  return data.idToken;
}

async function api(token, method, path, body, expectedStatuses = [200]) {
  const res = await fetch(new URL(path, BASE_URL), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!expectedStatuses.includes(res.status)) {
    throw new Error(`${method} ${path} expected ${expectedStatuses.join('/')} got ${res.status}: ${text.slice(0, 500)}`);
  }
  return data;
}

async function assertPreviewReachable() {
  try {
    await fetch(new URL('/api/health', BASE_URL), { redirect: 'manual' });
  } catch {
    throw new Error(`Cannot reach ${BASE_URL}. Run npm run build && npm run preview first.`);
  }
}

async function createQaUsers(auth, db) {
  const users = {};
  for (const role of roles) {
    const email = `${RUN_ID}_${role}@example.com`;
    const displayName = `QA ${role}`;
    const created = await auth.createUser({
      email,
      displayName,
      emailVerified: true,
    });
    await auth.setCustomUserClaims(created.uid, { role });
    const now = new Date().toISOString();
    await db.collection('users').doc(created.uid).set({
      uid: created.uid,
      email,
      displayName,
      role,
      profileComplete: true,
      createdAt: now,
      updatedAt: now,
      qaRunId: RUN_ID,
    });
    if (role === 'clinic') {
      await db.collection('clinics').doc(created.uid).set({
        uid: created.uid,
        email,
        displayName,
        role,
        clinicName: 'QA Clinic',
        licenseNumber: `QA-${RUN_ID}`,
        licenseExpiry: '2027-01-01',
        address: 'QA address',
        region: 'Toshkent shahri',
        district: 'QA',
        specialties: ['Terapiya'],
        doctorCount: 1,
        nurseCount: 1,
        adminCount: 1,
        contactPerson: 'QA Contact',
        phone: '+998901234567',
        documents: { license: 'https://example.com/license.pdf', sanCert: 'https://example.com/san.pdf' },
        profileComplete: true,
        createdAt: now,
        updatedAt: now,
        qaRunId: RUN_ID,
      });
    }
    if (role === 'doctor') {
      await db.collection('doctors').doc(created.uid).set({
        uid: created.uid,
        email,
        displayName,
        role,
        fullName: displayName,
        specialization: 'Terapevt',
        category: 'first',
        diplomaNumber: `QA-${RUN_ID}`,
        institution: 'QA Medical',
        certExpiry: '2027-01-01',
        linkedClinicId: null,
        phone: '+998901234567',
        documents: {
          diploma: 'https://example.com/diploma.pdf',
          certificate: 'https://example.com/cert.pdf',
          license: 'https://example.com/license.pdf',
        },
        profileComplete: true,
        createdAt: now,
        updatedAt: now,
        qaRunId: RUN_ID,
      });
    }
    if (role === 'patient') {
      await db.collection('patients').doc(created.uid).set({
        uid: created.uid,
        email,
        displayName,
        role,
        fullName: displayName,
        dob: '1990-01-01',
        gender: 'erkak',
        phone: '+998901234567',
        conditions: [],
        allergies: [],
        profileComplete: true,
        createdAt: now,
        updatedAt: now,
        qaRunId: RUN_ID,
      });
    }
    const customToken = await auth.createCustomToken(created.uid, { role });
    users[role] = {
      uid: created.uid,
      email,
      token: await exchangeCustomToken(customToken),
    };
  }
  return users;
}

async function cleanup(auth, db, users, createdDocs) {
  for (const doc of createdDocs.reverse()) {
    try {
      await db.collection(doc.collection).doc(doc.id).delete();
    } catch {
      // Continue cleanup.
    }
  }
  const qaUserIds = Object.values(users).map((user) => user.uid);
  for (const uid of qaUserIds) {
    await Promise.allSettled([
      db.collection('users').doc(uid).delete(),
      db.collection('clinics').doc(uid).delete(),
      db.collection('doctors').doc(uid).delete(),
      db.collection('patients').doc(uid).delete(),
      auth.deleteUser(uid),
    ]);
  }
  for (const collection of ['audit_logs', 'notifications']) {
    const field = collection === 'audit_logs' ? 'userId' : 'userId';
    for (const uid of qaUserIds) {
      const snap = await db.collection(collection).where(field, '==', uid).get();
      await Promise.allSettled(snap.docs.map((doc) => doc.ref.delete()));
    }
  }
}

function remember(createdDocs, collection, data) {
  if (data?.id) createdDocs.push({ collection, id: data.id });
  return data;
}

function forget(createdDocs, collection, id) {
  const index = createdDocs.findIndex((doc) => doc.collection === collection && doc.id === id);
  if (index >= 0) createdDocs.splice(index, 1);
}

async function main() {
  await assertPreviewReachable();
  initAdmin();
  const auth = getAuth();
  const db = getFirestore();
  const createdDocs = [];
  let users = {};

  try {
    users = await createQaUsers(auth, db);
    const admin = users.admin.token;
    const clinic = users.clinic.token;
    const doctor = users.doctor.token;
    const patient = users.patient.token;

    const checks = [];
    const run = async (label, fn) => {
      await fn();
      checks.push(label);
      console.log(`OK ${label}`);
    };

    await run('admin can read platform collections', async () => {
      await api(admin, 'GET', '/api/documents');
      await api(admin, 'GET', '/api/staff');
      await api(admin, 'GET', '/api/announcements');
      await api(admin, 'GET', '/api/clinic-erp');
    });

    await run('clinic can manage staff', async () => {
      const staff = remember(createdDocs, 'staff', await api(clinic, 'POST', '/api/staff', {
        fullName: 'QA Staff',
        role: 'Shifokor',
        phone: '+998901234567',
        hireDate: '2026-01-01',
        status: 'active',
      }));
      await api(clinic, 'GET', '/api/staff');
      await api(clinic, 'PATCH', '/api/staff', { id: staff.id, status: 'leave' });
      await api(clinic, 'DELETE', '/api/staff', { id: staff.id });
      forget(createdDocs, 'staff', staff.id);
    });

    await run('clinic can manage appointments', async () => {
      const appointment = remember(createdDocs, 'appointments', await api(clinic, 'POST', '/api/appointments', {
        patientName: 'QA Patient',
        patientPhone: '+998901234567',
        date: '2026-06-01',
        time: '09:00',
        reason: 'QA check',
      }));
      await api(clinic, 'PATCH', '/api/appointments', { id: appointment.id, status: 'confirmed' });
      await api(clinic, 'DELETE', '/api/appointments', { id: appointment.id });
      forget(createdDocs, 'appointments', appointment.id);
    });

    await run('doctor can create and delete own forum post', async () => {
      const post = remember(createdDocs, 'forum_posts', await api(doctor, 'POST', '/api/forum', {
        title: 'QA Forum',
        body: 'QA body',
        category: 'Umumiy',
        authorName: 'QA Doctor',
      }));
      await api(doctor, 'GET', '/api/forum');
      await api(doctor, 'DELETE', '/api/forum', { id: post.id });
      forget(createdDocs, 'forum_posts', post.id);
    });

    await run('doctor cannot publish job listing', async () => {
      await api(doctor, 'POST', '/api/jobs', {
        title: 'QA Job',
        clinicName: 'QA Clinic',
        location: 'QA',
        region: 'QA',
      }, [403]);
    });

    await run('patient can create survey and vaccination record', async () => {
      remember(createdDocs, 'surveys', await api(patient, 'POST', '/api/surveys', {
        clinicId: users.clinic.uid,
        ratings: { overall: 5, staff: 5, cleanliness: 5, speed: 5 },
        comment: 'QA survey',
        wouldRecommend: true,
      }));
      remember(createdDocs, 'vaccinations', await api(patient, 'POST', '/api/vaccinations', {
        clinicId: users.clinic.uid,
        vaccineName: 'QA Vaccine',
        doseNumber: 1,
        dateGiven: '2026-06-01',
      }));
      await api(patient, 'GET', '/api/surveys');
      await api(patient, 'GET', '/api/vaccinations');
    });

    await run('patient cannot create appointment as clinic', async () => {
      await api(patient, 'POST', '/api/appointments', {
        clinicId: users.clinic.uid,
        patientName: 'QA Patient',
        date: '2026-06-01',
        time: '09:00',
        reason: 'QA',
      }, [403]);
    });

    await run('doctor can message patient, patient can read', async () => {
      const message = remember(createdDocs, 'messages', await api(doctor, 'POST', '/api/messages', {
        toUserId: users.patient.uid,
        subject: 'QA message',
        body: 'QA body',
      }));
      await api(patient, 'GET', '/api/messages');
      await api(patient, 'PATCH', '/api/messages', { id: message.id });
    });

    await run('doctor can create document', async () => {
      remember(createdDocs, 'documents', await api(doctor, 'POST', '/api/documents', {
        title: 'QA Document',
        type: 'note',
        content: 'QA content',
        status: 'draft',
      }));
      await api(doctor, 'GET', '/api/documents');
    });

    await run('profile update works for patient', async () => {
      await api(patient, 'PATCH', '/api/profile', { displayName: 'QA Patient Updated' });
    });

    console.log(`Firebase role QA passed for ${checks.length} checks with run ${RUN_ID}.`);
  } finally {
    await cleanup(auth, db, users, createdDocs);
  }
}

main().catch((err) => {
  console.error('Firebase role QA failed:', err);
  process.exit(1);
});
