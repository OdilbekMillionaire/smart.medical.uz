import { initializeApp, getApps, cert } from 'firebase-admin/app';
import type { App, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccountKey = process.env.FIREBASE_ADMIN_SDK_KEY;
  if (!serviceAccountKey) {
    throw new Error('FIREBASE_ADMIN_SDK_KEY environment variable is not set');
  }

  // Support both raw JSON and base64-encoded JSON (some deployment platforms encode it)
  let serviceAccount: ServiceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountKey);
  } catch {
    const decoded = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
    serviceAccount = JSON.parse(decoded);
  }
  const serviceAccountProjectId = (serviceAccount as ServiceAccount & { project_id?: string }).project_id ?? serviceAccount.projectId;

  adminApp = initializeApp({
    credential: cert(serviceAccount),
    projectId:
      serviceAccountProjectId ??
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
      process.env.GOOGLE_CLOUD_PROJECT_ID,
  });

  return adminApp;
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
