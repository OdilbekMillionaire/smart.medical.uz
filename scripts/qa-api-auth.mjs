const BASE_URL = process.env.QA_BASE_URL ?? 'http://localhost:3000';

const protectedCases = [
  ['POST', '/api/ai-chat', { messages: [{ role: 'user', content: 'test' }] }],
  ['POST', '/api/ai/draft', { prompt: 'test' }],
  ['POST', '/api/ai/query', { question: 'test' }],
  ['GET', '/api/announcements'],
  ['POST', '/api/announcements', { title: 't', body: 'b', priority: 'normal', pinned: false }],
  ['DELETE', '/api/announcements', { id: 'x' }],
  ['GET', '/api/appointments'],
  ['POST', '/api/appointments', { clinicId: 'c', clinicName: 'c', patientName: 'p', patientPhone: '1', date: '2026-01-01', time: '09:00', reason: 'r' }],
  ['PATCH', '/api/appointments', { id: 'x', status: 'confirmed' }],
  ['DELETE', '/api/appointments', { id: 'x' }],
  ['GET', '/api/clinic-erp'],
  ['POST', '/api/clinic-erp', { patientId: 'p', visitDate: '2026-01-01', diagnosis: 'd', assignedDoctorId: 'd' }],
  ['PATCH', '/api/clinic-erp', { id: 'x', diagnosis: 'd' }],
  ['DELETE', '/api/clinic-erp', { id: 'x' }],
  ['GET', '/api/complaints'],
  ['POST', '/api/complaints', { clinicId: 'c', clinicName: 'c', patientName: 'p', patientPhone: '1', category: 'service', description: 'd' }],
  ['PATCH', '/api/complaints', { id: 'x', status: 'in_review' }],
  ['GET', '/api/compliance'],
  ['POST', '/api/compliance', { title: 't', type: 'license', dueDate: '2026-01-01' }],
  ['PATCH', '/api/compliance', { id: 'x', status: 'done' }],
  ['DELETE', '/api/compliance', { id: 'x' }],
  ['POST', '/api/compliance/ai-advice', { clinicId: 'c' }],
  ['POST', '/api/compliance/check', {}],
  ['GET', '/api/documents'],
  ['POST', '/api/documents', { title: 't', type: 'note', content: 'body', status: 'draft' }],
  ['GET', '/api/documents/fake-id'],
  ['PATCH', '/api/documents/fake-id', { title: 't' }],
  ['DELETE', '/api/documents/fake-id'],
  ['POST', '/api/email/send', { to: 'test@example.com', subject: 's', html: '<p>x</p>' }],
  ['GET', '/api/equipment'],
  ['POST', '/api/equipment', { name: 'x', type: 'x', serialNumber: 'x', purchaseDate: '2026-01-01', status: 'operational', location: 'x' }],
  ['PATCH', '/api/equipment', { id: 'x', status: 'maintenance' }],
  ['DELETE', '/api/equipment', { id: 'x' }],
  ['POST', '/api/erp/ai-summary', { patientName: 'p', visitDate: '2026-01-01', diagnosis: 'd' }],
  ['GET', '/api/events'],
  ['POST', '/api/events', { title: 't', type: 'meeting', date: '2026-01-01' }],
  ['DELETE', '/api/events', { id: 'x' }],
  ['GET', '/api/forum'],
  ['POST', '/api/forum', { title: 't', body: 'b', category: 'General' }],
  ['PATCH', '/api/forum', { id: 'x', action: 'view' }],
  ['DELETE', '/api/forum', { id: 'x' }],
  ['GET', '/api/forum/replies?postId=x'],
  ['POST', '/api/forum/replies', { postId: 'x', body: 'b' }],
  ['GET', '/api/inspection'],
  ['POST', '/api/inspection', { checklistType: 'sanitation' }],
  ['POST', '/api/inspection/remediate', { inspectionId: 'x' }],
  ['GET', '/api/inventory'],
  ['POST', '/api/inventory', { name: 'x', category: 'x', unit: 'pcs', quantity: 1, minQuantity: 1, expiryDate: '2026-01-01' }],
  ['PATCH', '/api/inventory', { id: 'x', quantity: 2 }],
  ['DELETE', '/api/inventory', { id: 'x' }],
  ['GET', '/api/jobs'],
  ['POST', '/api/jobs', { title: 't', clinicName: 'c', location: 'l', region: 'r' }],
  ['POST', '/api/jobs/applications', { jobId: 'x', applicantName: 'a' }],
  ['POST', '/api/licensing/guide', { question: 'test' }],
  ['GET', '/api/messages'],
  ['POST', '/api/messages', { toUserId: 'x', subject: 's', body: 'b' }],
  ['PATCH', '/api/messages', { id: 'x' }],
  ['PATCH', '/api/notifications', { all: true }],
  ['POST', '/api/onboarding', { role: 'patient', fullName: 'Test User', dob: '2000-01-01', gender: 'x', phone: '+998901234567' }],
  ['POST', '/api/profile', { displayName: 'Test', role: 'patient' }],
  ['PATCH', '/api/profile', { displayName: 'Test' }],
  ['GET', '/api/referrals'],
  ['POST', '/api/referrals', { toClinicId: 'c', patientName: 'p', reason: 'r', priority: 'normal' }],
  ['PATCH', '/api/referrals', { id: 'x', status: 'accepted' }],
  ['GET', '/api/requests'],
  ['POST', '/api/requests', { subject: 's', body: 'b' }],
  ['GET', '/api/requests/fake-id'],
  ['PATCH', '/api/requests/fake-id', { status: 'closed' }],
  ['GET', '/api/shifts'],
  ['POST', '/api/shifts', { staffName: 's', role: 'r', date: '2026-01-01', startTime: '09:00', endTime: '17:00' }],
  ['DELETE', '/api/shifts', { id: 'x' }],
  ['GET', '/api/staff'],
  ['POST', '/api/staff', { fullName: 'x', role: 'Doctor', phone: '1', hireDate: '2026-01-01', status: 'active' }],
  ['PATCH', '/api/staff', { id: 'x', status: 'leave' }],
  ['DELETE', '/api/staff', { id: 'x' }],
  ['GET', '/api/surveys'],
  ['POST', '/api/surveys', { ratings: { overall: 5, staff: 5, cleanliness: 5, speed: 5 }, wouldRecommend: true }],
  ['GET', '/api/vaccinations'],
  ['POST', '/api/vaccinations', { vaccineName: 'x', doseNumber: 1, dateGiven: '2026-01-01' }],
];

const publicCases = [
  ['GET', '/api/health', undefined, [200, 503]],
  ['GET', '/api/news', undefined, [200]],
];

async function assertServerReachable() {
  try {
    await fetch(new URL('/api/health', BASE_URL), { redirect: 'manual' });
  } catch {
    console.error(`Cannot reach ${BASE_URL}. Start the app first, for example: npm run dev -- -p 3000`);
    process.exit(1);
  }
}

async function request(method, path, body) {
  const res = await fetch(new URL(path, BASE_URL), {
    method,
    redirect: 'manual',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return res.status;
}

const results = [];

await assertServerReachable();

for (const [method, path, body] of protectedCases) {
  try {
    const status = await request(method, path, body);
    const ok = status === 401 || status === 403;
    results.push({ group: 'protected', method, path, status, ok });
  } catch (err) {
    results.push({ group: 'protected', method, path, status: 0, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}

for (const [method, path, body, allowedStatuses] of publicCases) {
  try {
    const status = await request(method, path, body);
    const ok = allowedStatuses.includes(status);
    results.push({ group: 'public', method, path, status, ok });
  } catch (err) {
    results.push({ group: 'public', method, path, status: 0, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}

const failures = results.filter((result) => !result.ok);
for (const result of results) {
  const label = result.ok ? 'OK' : 'FAIL';
  console.log(`${label} ${result.group.padEnd(9)} ${result.method.padEnd(6)} ${String(result.status).padEnd(3)} ${result.path}`);
}

if (failures.length > 0) {
  console.error(`API auth QA failed for ${failures.length} case(s).`);
  process.exit(1);
}

console.log(`API auth QA passed for ${results.length} cases.`);
