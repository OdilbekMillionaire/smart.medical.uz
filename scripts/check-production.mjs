import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const ENV_FILES = ['.env.local', '.env.production', '.env'];

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const content = readFileSync(path, 'utf8');
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
        return [key, value];
      })
  );
}

const fileEnv = ENV_FILES.reduce(
  (acc, filename) => ({ ...acc, ...parseEnvFile(resolve(ROOT, filename)) }),
  {}
);
const env = { ...fileEnv, ...process.env };

const requiredPublic = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const requiredServer = [
  'FIREBASE_ADMIN_SDK_KEY',
  'GOOGLE_CLOUD_PROJECT_ID',
  'GOOGLE_AI_API_KEY',
];

const optionalButExpected = [
  'NEXT_PUBLIC_APP_URL',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'CRON_SECRET',
  'NEWS_API_KEY',
];

const errors = [];
const warnings = [];

function hasValue(key) {
  return typeof env[key] === 'string' && env[key].trim().length > 0;
}

for (const key of [...requiredPublic, ...requiredServer]) {
  if (!hasValue(key)) errors.push(`Missing required env: ${key}`);
}

for (const key of optionalButExpected) {
  if (!hasValue(key)) warnings.push(`Optional production env not set: ${key}`);
}

if (env.NEXT_PUBLIC_DISABLE_TRIAL_MODE !== 'true') {
  warnings.push('Set NEXT_PUBLIC_DISABLE_TRIAL_MODE=true in production.');
}

for (const filename of ['firebase.json', 'firestore.rules', 'firestore.indexes.json']) {
  if (!existsSync(resolve(ROOT, filename))) errors.push(`Missing Firebase deploy file: ${filename}`);
}

if (existsSync(resolve(ROOT, 'firestore.rules'))) {
  const rules = readFileSync(resolve(ROOT, 'firestore.rules'), 'utf8');
  if (!rules.includes('match /{document=**}') || !rules.includes('allow read, write: if false')) {
    errors.push('firestore.rules must keep a deny-all catch-all rule.');
  }
  const unsafeWriteRules = rules
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), index: index + 1 }))
    .filter(({ line }) => /^allow .*write|^allow .*create|^allow .*update|^allow .*delete/.test(line))
    .filter(({ line }) => !line.includes('if false'));
  if (unsafeWriteRules.length > 0) {
    warnings.push(
      `Review non-false Firestore write rules: ${unsafeWriteRules
        .map(({ index }) => `line ${index}`)
        .join(', ')}`
    );
  }
}

if (existsSync(resolve(ROOT, 'firestore.indexes.json'))) {
  try {
    const indexes = JSON.parse(readFileSync(resolve(ROOT, 'firestore.indexes.json'), 'utf8'));
    if (!Array.isArray(indexes.indexes) || indexes.indexes.length === 0) {
      warnings.push('firestore.indexes.json has no composite indexes.');
    }
  } catch {
    errors.push('firestore.indexes.json is not valid JSON.');
  }
}

for (const warning of warnings) console.warn(`WARN: ${warning}`);

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}

console.log('Production preflight passed.');
