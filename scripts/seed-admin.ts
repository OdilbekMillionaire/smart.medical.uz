/**
 * One-time admin seed script.
 * Run: npx ts-node --project tsconfig.node.json scripts/seed-admin.ts
 *
 * Requirements: FIREBASE_ADMIN_SDK_KEY must be set in your env (not .env.local).
 * Example: FIREBASE_ADMIN_SDK_KEY='{"type":"service_account",...}' npx ts-node scripts/seed-admin.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const ADMIN_EMAIL = 'admin@smartmedical.uz';
const ADMIN_PASSWORD = 'Admin@2026!';

async function main() {
  const serviceAccountKey = process.env.FIREBASE_ADMIN_SDK_KEY;
  if (!serviceAccountKey) {
    console.error('ERROR: FIREBASE_ADMIN_SDK_KEY env var not set');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(serviceAccountKey);

  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
  }

  const auth = getAuth();
  const db = getFirestore();

  let uid: string;

  try {
    const existing = await auth.getUserByEmail(ADMIN_EMAIL);
    uid = existing.uid;
    console.log(`Admin user already exists: ${uid}`);
  } catch {
    const created = await auth.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: 'Admin',
      emailVerified: true,
    });
    uid = created.uid;
    console.log(`Admin user created: ${uid}`);
  }

  await db.doc(`users/${uid}`).set(
    {
      uid,
      email: ADMIN_EMAIL,
      displayName: 'Admin',
      role: 'admin',
      profileComplete: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  await auth.setCustomUserClaims(uid, { role: 'admin' });

  console.log('Admin Firestore doc written successfully.');
  console.log('Admin custom claim written successfully.');
  console.log(`\nCredentials:\n  Email: ${ADMIN_EMAIL}\n  Password: ${ADMIN_PASSWORD}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
