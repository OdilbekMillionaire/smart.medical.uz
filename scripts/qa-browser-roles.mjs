import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const BASE_URL = process.env.QA_BASE_URL ?? 'http://localhost:3000';
const RUN_ID = `browser_qa_${Date.now()}`;
const PASSWORD = `QA-${Date.now()}-Password!`;
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
  if (!value) throw new Error(`${name} is required for browser role QA`);
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

async function assertPreviewReachable() {
  try {
    await fetch(new URL('/login', BASE_URL), { redirect: 'manual' });
  } catch {
    throw new Error(`Cannot reach ${BASE_URL}. Run npm run build && npm run preview first.`);
  }
}

async function createQaUsers(auth, db) {
  const users = {};
  for (const role of roles) {
    const email = `${RUN_ID}_${role}@example.com`;
    const displayName = `Browser QA ${role}`;
    const created = await auth.createUser({
      email,
      password: PASSWORD,
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
        clinicName: 'Browser QA Clinic',
        licenseNumber: `BQA-${RUN_ID}`,
        licenseExpiry: '2027-01-01',
        address: 'QA address',
        region: 'Toshkent shahri',
        district: 'QA',
        specialties: ['Terapiya'],
        phone: '+998901234567',
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
        diplomaNumber: `BQA-${RUN_ID}`,
        institution: 'QA Medical',
        certExpiry: '2027-01-01',
        phone: '+998901234567',
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
        profileComplete: true,
        createdAt: now,
        updatedAt: now,
        qaRunId: RUN_ID,
      });
    }
    users[role] = { uid: created.uid, email };
  }
  return users;
}

async function cleanup(auth, db, users) {
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
}

async function importPlaywright() {
  try {
    return await import('playwright');
  } catch {
    throw new Error('Playwright is required. Run this script with: npx -p playwright node scripts/qa-browser-roles.mjs');
  }
}

async function main() {
  await assertPreviewReachable();
  initAdmin();
  const auth = getAuth();
  const db = getFirestore();
  const users = await createQaUsers(auth, db);
  let browser;

  try {
    const { chromium } = await importPlaywright();
    browser = await chromium.launch({ headless: true });

    for (const role of roles) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(new URL('/login', BASE_URL).toString(), { waitUntil: 'domcontentloaded' });
      await page.fill('#email', users[role].email);
      await page.fill('#password', PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');
      const path = new URL(page.url()).pathname;
      if (path !== '/dashboard') {
        throw new Error(`${role} login ended at ${page.url()}`);
      }
      await context.close();
      console.log(`OK ${role} browser login reached /dashboard`);
    }

    console.log(`Browser role QA passed for ${roles.length} roles with run ${RUN_ID}.`);
  } finally {
    if (browser) await browser.close();
    await cleanup(auth, db, users);
  }
}

main().catch((err) => {
  console.error('Browser role QA failed:', err);
  process.exit(1);
});
