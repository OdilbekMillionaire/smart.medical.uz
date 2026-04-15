/**
 * POST /api/compliance/check
 * Scans all active compliance items, updates statuses, and sends
 * email reminders for items due within 7 days that haven't been notified yet.
 *
 * Can be called by a cron job (GCP Cloud Scheduler → Secret header) or
 * manually by an admin from the compliance dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://smartmedical.uz';

// Allow Cloud Scheduler to call this without a user token
const CRON_SECRET = process.env.CRON_SECRET;

async function sendReminderEmail(to: string, clinicName: string, title: string, dueDate: string, daysLeft: number) {
  if (!RESEND_API_KEY) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Smart Medical <${FROM_EMAIL}>`,
      to: [to],
      subject: `⚠️ Muddat eslatmasi: ${title} — ${daysLeft} kun qoldi`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:8px">
          <h2 style="color:#0f172a;margin-bottom:8px">Muddat eslatmasi</h2>
          <p style="color:#475569;margin-bottom:16px">Hurmatli <strong>${clinicName}</strong> ma'muriyati,</p>
          <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:6px;padding:16px;margin-bottom:16px">
            <p style="color:#92400e;font-weight:600;margin:0">${title}</p>
            <p style="color:#92400e;margin:4px 0 0">Muddat: <strong>${dueDate}</strong> — <strong>${daysLeft} kun qoldi</strong></p>
          </div>
          <p style="color:#475569">Platformaga kiring va zarur hujjatlarni tayyorlang.</p>
          <a href="${APP_URL}/dashboard/compliance"
             style="display:inline-block;margin-top:16px;background:#0f172a;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
            Muddatlarni ko'rish
          </a>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px">Smart Medical Association Platform</p>
        </div>
      `,
    }),
  });
}

export async function POST(req: NextRequest) {
  // Auth: either a user Bearer token (admin) OR the cron secret header
  const authHeader = req.headers.get('authorization');
  const cronHeader = req.headers.get('x-cron-secret');

  let isAuthorized = false;
  if (CRON_SECRET && cronHeader === CRON_SECRET) {
    isAuthorized = true;
  } else if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = await getAdminAuth().verifyIdToken(authHeader.slice(7));
      if ((decoded.role as string) === 'admin') isAuthorized = true;
    } catch {
      // fall through
    }
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getAdminDb();
  const now = new Date();

  // Fetch all non-done compliance items
  const snap = await db.collection('compliance').where('status', '!=', 'done').get();

  let updated = 0;
  let reminded = 0;
  const errors: string[] = [];

  for (const docSnap of snap.docs) {
    const item = docSnap.data();
    const dueDate = new Date(item.dueDate as string);
    const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / 86_400_000);

    // Compute new status
    let newStatus: string;
    if (dueDate < now) {
      newStatus = 'overdue';
    } else if (daysLeft <= 7) {
      newStatus = 'kritik';
    } else {
      newStatus = 'upcoming';
    }

    const updates: Record<string, unknown> = {};
    if (newStatus !== item.status) {
      updates.status = newStatus;
      updated++;
    }

    // Send reminder if due within 7 days and not yet sent
    if (daysLeft <= 7 && daysLeft >= 0 && !item.reminderSent) {
      try {
        // Get clinic email from users collection
        const clinicId = item.clinicId as string;
        const userDoc = await db.collection('users').doc(clinicId).get();
        const userData = userDoc.data();
        const email = userData?.email as string | undefined;
        const clinicName = (userData?.clinicName ?? userData?.displayName ?? 'Klinika') as string;

        if (email) {
          await sendReminderEmail(
            email,
            clinicName,
            item.title as string,
            item.dueDate as string,
            daysLeft
          );
          updates.reminderSent = true;
          reminded++;
        }
      } catch (e) {
        errors.push(`${docSnap.id}: ${e instanceof Error ? e.message : 'email error'}`);
      }
    }

    if (Object.keys(updates).length > 0) {
      await docSnap.ref.update(updates);
    }
  }

  return NextResponse.json({
    success: true,
    checked: snap.size,
    updated,
    reminded,
    ...(errors.length > 0 && { errors }),
  });
}
