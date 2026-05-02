import { NextResponse } from 'next/server';

const REQUIRED_SERVER_ENV = [
  'FIREBASE_ADMIN_SDK_KEY',
  'GOOGLE_CLOUD_PROJECT_ID',
  'GOOGLE_AI_API_KEY',
];

const REQUIRED_PUBLIC_ENV = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

function allPresent(keys: string[]) {
  return keys.every((key) => Boolean(process.env[key]?.trim()));
}

export async function GET() {
  const checks = {
    serverConfig: allPresent(REQUIRED_SERVER_ENV),
    publicFirebaseConfig: allPresent(REQUIRED_PUBLIC_ENV),
    trialModeDisabled: process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_DISABLE_TRIAL_MODE === 'true'
      : true,
  };
  const ok = Object.values(checks).every(Boolean);

  return NextResponse.json(
    {
      ok,
      service: 'smart-medical-association',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 }
  );
}
