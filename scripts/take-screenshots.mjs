import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';

const BASE = 'http://localhost:3000';
const PASS = process.argv[2] ?? 'before'; // node take-screenshots.mjs before|after

const ROLE_PAGES = {
  admin: [
    '/dashboard', '/dashboard/clinics', '/dashboard/users', '/dashboard/statistics',
    '/dashboard/document-center', '/dashboard/documents', '/dashboard/cases',
    '/dashboard/requests', '/dashboard/complaints', '/dashboard/referrals',
    '/dashboard/compliance-center', '/dashboard/audit', '/dashboard/compliance',
    '/dashboard/inspection', '/dashboard/litsenziya', '/dashboard/messages',
    '/dashboard/announcements', '/dashboard/forum', '/dashboard/notifications',
    '/dashboard/surveys', '/dashboard/reports', '/dashboard/exports',
    '/dashboard/search', '/dashboard/news', '/dashboard/jobs',
    '/dashboard/settings', '/dashboard/changelog', '/dashboard/profile',
  ],
  clinic: [
    '/dashboard', '/dashboard/schedule', '/dashboard/appointments', '/dashboard/calendar',
    '/dashboard/shifts', '/dashboard/clinic-operations', '/dashboard/erp',
    '/dashboard/staff', '/dashboard/inventory', '/dashboard/equipment',
    '/dashboard/compliance-center', '/dashboard/compliance', '/dashboard/inspection',
    '/dashboard/litsenziya', '/dashboard/document-center', '/dashboard/documents',
    '/dashboard/cases', '/dashboard/requests', '/dashboard/complaints',
    '/dashboard/referrals', '/dashboard/messages', '/dashboard/announcements',
    '/dashboard/notifications', '/dashboard/surveys', '/dashboard/forum',
    '/dashboard/knowledge-base', '/dashboard/guidelines', '/dashboard/formulary',
    '/dashboard/finance', '/dashboard/reports', '/dashboard/exports',
    '/dashboard/news', '/dashboard/profile', '/dashboard/help',
  ],
  doctor: [
    '/dashboard', '/dashboard/document-center', '/dashboard/documents',
    '/dashboard/cases', '/dashboard/referrals', '/dashboard/messages',
    '/dashboard/schedule', '/dashboard/appointments', '/dashboard/prescriptions',
    '/dashboard/telemedicine', '/dashboard/knowledge-base', '/dashboard/guidelines',
    '/dashboard/formulary', '/dashboard/education', '/dashboard/news',
    '/dashboard/search', '/dashboard/forum', '/dashboard/jobs',
    '/dashboard/profile', '/dashboard/notifications', '/dashboard/litsenziya',
    '/dashboard/help', '/dashboard/onboarding',
  ],
  patient: [
    '/dashboard', '/dashboard/schedule', '/dashboard/appointments',
    '/dashboard/vaccinations', '/dashboard/qr-card', '/dashboard/prescriptions',
    '/dashboard/telemedicine', '/dashboard/cases', '/dashboard/messages',
    '/dashboard/forum', '/dashboard/notifications', '/dashboard/knowledge-base',
    '/dashboard/formulary', '/dashboard/guidelines', '/dashboard/news',
    '/dashboard/search', '/dashboard/profile', '/dashboard/help',
    '/dashboard/surveys', '/dashboard/onboarding',
  ],
};

const browser = await chromium.launch({ headless: true });

for (const [role, pages] of Object.entries(ROLE_PAGES)) {
  const outDir = `screenshots/${PASS}/${role}`;
  await mkdir(outDir, { recursive: true });

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate((r) => localStorage.setItem('trial_role', r), role);

  for (const route of pages) {
    try {
      await page.goto(`${BASE}${route}`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1200);
      const slug = route === '/dashboard' ? 'dashboard' : route.replace('/dashboard/', '').replace(/\//g, '-');
      await page.screenshot({ path: `${outDir}/${slug}.png`, fullPage: true });
      console.log(`  ✓ ${role}/${slug}`);
    } catch (e) {
      console.log(`  ✗ ${role}${route}: ${e.message}`);
    }
  }

  await context.close();
  console.log(`\n✓ ${role} done (${pages.length} pages)\n`);
}

await browser.close();
console.log(`Done. Screenshots saved to ./screenshots/${PASS}/`);
