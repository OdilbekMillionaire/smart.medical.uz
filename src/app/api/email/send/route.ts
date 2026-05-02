import { NextRequest, NextResponse } from 'next/server';
import { isApiError, parseJson, requireApiUser, requireRole } from '@/lib/api-auth';
import { z } from 'zod';

const SendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email()).min(1).max(50)]),
  subject: z.string().trim().min(1).max(300),
  html: z.string().min(1).max(100000),
});

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (isApiError(auth)) return auth;
  const roleError = requireRole(auth, ['admin']);
  if (roleError) return roleError;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 503 });
  }

  const body = await parseJson(req, SendEmailSchema);
  if (body instanceof NextResponse) return body;
  const { to, subject, html } = body;

  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Smart Medical <${fromEmail}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: 'Email failed', detail: err }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
