import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
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

  const serviceAccount = JSON.parse(serviceAccountKey);

  adminApp = initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  });

  return adminApp;
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
