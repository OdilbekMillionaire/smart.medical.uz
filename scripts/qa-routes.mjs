const BASE_URL = process.env.QA_BASE_URL ?? 'http://localhost:3000';

const routes = [
  { role: 'public', path: '/' },
  { role: 'public', path: '/login' },
  { role: 'public', path: '/register' },
  { role: 'public', path: '/api/health', allowStatuses: [200, 503] },
  { role: 'onboarding', path: '/onboarding/clinic' },
  { role: 'onboarding', path: '/onboarding/doctor' },
  { role: 'onboarding', path: '/onboarding/patient' },
  { role: 'admin', path: '/dashboard' },
  { role: 'admin', path: '/dashboard/users' },
  { role: 'admin', path: '/dashboard/clinics' },
  { role: 'admin', path: '/dashboard/audit' },
  { role: 'admin', path: '/dashboard/announcements' },
  { role: 'hub', path: '/dashboard/document-center' },
  { role: 'hub', path: '/dashboard/cases' },
  { role: 'hub', path: '/dashboard/compliance-center' },
  { role: 'hub', path: '/dashboard/schedule' },
  { role: 'hub', path: '/dashboard/clinic-operations' },
  { role: 'hub', path: '/dashboard/knowledge-base' },
  { role: 'clinic', path: '/dashboard/erp' },
  { role: 'clinic', path: '/dashboard/erp/new' },
  { role: 'clinic', path: '/dashboard/staff' },
  { role: 'clinic', path: '/dashboard/inventory' },
  { role: 'clinic', path: '/dashboard/equipment' },
  { role: 'clinic', path: '/dashboard/compliance' },
  { role: 'clinic', path: '/dashboard/appointments' },
  { role: 'clinic', path: '/dashboard/shifts' },
  { role: 'doctor', path: '/dashboard/documents' },
  { role: 'doctor', path: '/dashboard/forum' },
  { role: 'doctor', path: '/dashboard/jobs' },
  { role: 'doctor', path: '/dashboard/messages' },
  { role: 'patient', path: '/dashboard/appointments' },
  { role: 'patient', path: '/dashboard/surveys' },
  { role: 'patient', path: '/dashboard/vaccinations' },
  { role: 'patient', path: '/dashboard/forum' },
  { role: 'shared', path: '/dashboard/profile' },
  { role: 'shared', path: '/dashboard/notifications' },
  { role: 'shared', path: '/dashboard/reports' },
];

const requiredHeaders = [
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
];

async function assertServerReachable() {
  try {
    await fetch(new URL('/api/health', BASE_URL), { redirect: 'manual' });
  } catch {
    console.error(`Cannot reach ${BASE_URL}. Start the app first, for example: npm run dev -- -p 3000`);
    process.exit(1);
  }
}

async function probe(route) {
  const url = new URL(route.path, BASE_URL);
  const res = await fetch(url, { redirect: 'manual' });
  const ok = route.allowStatuses?.includes(res.status) ?? res.status < 500;
  return {
    ...route,
    status: res.status,
    ok,
    contentType: res.headers.get('content-type') ?? '',
    headers: Object.fromEntries(requiredHeaders.map((key) => [key, res.headers.get(key)])),
  };
}

const results = [];
await assertServerReachable();

for (const route of routes) {
  try {
    results.push(await probe(route));
  } catch (err) {
    results.push({ ...route, status: 0, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}

const failed = results.filter((result) => !result.ok);
const missingHeaders = results
  .filter((result) => result.path === '/')
  .flatMap((result) => requiredHeaders.filter((header) => !result.headers?.[header]));

for (const result of results) {
  const status = result.ok ? 'OK' : 'FAIL';
  console.log(`${status} ${result.role.padEnd(10)} ${String(result.status).padEnd(3)} ${result.path}`);
}

if (missingHeaders.length > 0) {
  console.error(`Missing security headers on /: ${missingHeaders.join(', ')}`);
}

if (failed.length > 0 || missingHeaders.length > 0) {
  process.exit(1);
}

console.log(`Route QA passed for ${results.length} routes.`);
