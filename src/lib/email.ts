/**
 * Email utility using Resend.
 * All email sending goes through Next.js API routes (server-side only).
 * Client components call /api/email/send — never call Resend directly from the browser.
 */

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
}

// ─── Send via API route ───────────────────────────────────────────────────────

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const res = await fetch('/api/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error ?? 'Email send failed');
  }
}

// ─── Template builders ────────────────────────────────────────────────────────

export function buildComplianceReminderEmail(data: {
  clinicName: string;
  itemTitle: string;
  dueDate: string;
  daysLeft: number;
}): EmailPayload {
  return {
    to: '', // filled in by caller
    subject: `⚠️ Muddat eslatmasi: ${data.itemTitle} — ${data.daysLeft} kun qoldi`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:8px">
        <h2 style="color:#0f172a;margin-bottom:8px">Muddat eslatmasi</h2>
        <p style="color:#475569;margin-bottom:16px">Hurmatli <strong>${data.clinicName}</strong> ma'muriyati,</p>
        <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:6px;padding:16px;margin-bottom:16px">
          <p style="color:#92400e;font-weight:600;margin:0">${data.itemTitle}</p>
          <p style="color:#92400e;margin:4px 0 0">Muddat: <strong>${data.dueDate}</strong> — <strong>${data.daysLeft} kun qoldi</strong></p>
        </div>
        <p style="color:#475569">Platformaga kiring va zarur hujjatlarni tayyorlang.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://smartmedical.uz'}/dashboard/compliance"
           style="display:inline-block;margin-top:16px;background:#0f172a;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
          Muddatlarni ko'rish
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">Smart Medical Association Platform</p>
      </div>
    `,
  };
}

export function buildDocumentStatusEmail(data: {
  ownerName: string;
  documentTitle: string;
  status: 'approved' | 'rejected';
  note?: string;
}): EmailPayload {
  const isApproved = data.status === 'approved';
  return {
    to: '',
    subject: `${isApproved ? '✅' : '❌'} Hujjat ${isApproved ? 'tasdiqlandi' : 'rad etildi'}: ${data.documentTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:8px">
        <h2 style="color:${isApproved ? '#065f46' : '#991b1b'};margin-bottom:8px">
          Hujjat ${isApproved ? 'tasdiqlandi' : 'rad etildi'}
        </h2>
        <p style="color:#475569">Hurmatli <strong>${data.ownerName}</strong>,</p>
        <p style="color:#475569">«<strong>${data.documentTitle}</strong>» hujjatingiz ${isApproved ? 'tasdiqlandi' : 'rad etildi'}.</p>
        ${data.note ? `<div style="background:#f8fafc;border-left:4px solid #94a3b8;padding:12px 16px;margin:16px 0;color:#475569"><strong>Izoh:</strong> ${data.note}</div>` : ''}
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://smartmedical.uz'}/dashboard/documents"
           style="display:inline-block;margin-top:16px;background:#0f172a;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
          Hujjatlarni ko'rish
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">Smart Medical Association Platform</p>
      </div>
    `,
  };
}

export function buildNewRequestEmail(data: {
  recipientName: string;
  senderName: string;
  subject: string;
}): EmailPayload {
  return {
    to: '',
    subject: `📬 Yangi murojaat: ${data.subject}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:8px">
        <h2 style="color:#0f172a;margin-bottom:8px">Yangi murojaat keldi</h2>
        <p style="color:#475569">Hurmatli <strong>${data.recipientName}</strong>,</p>
        <p style="color:#475569"><strong>${data.senderName}</strong> tomonidan yangi murojaat yuborildi:</p>
        <div style="background:#f1f5f9;border-radius:6px;padding:14px;margin:16px 0;color:#334155;font-weight:600">${data.subject}</div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://smartmedical.uz'}/dashboard/requests"
           style="display:inline-block;margin-top:8px;background:#0f172a;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">
          Murojaatni ko'rish
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">Smart Medical Association Platform</p>
      </div>
    `,
  };
}
