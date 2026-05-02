import { NextRequest, NextResponse } from 'next/server';
import { generateForTask, INSPECTION_REMEDIATION_PROMPT } from '@/lib/vertex-ai';
import { isApiError, parseJson, requireApiUser, requireRole } from '@/lib/api-auth';
import { z } from 'zod';

const RemediationSchema = z.object({
  checklistType: z.string().trim().min(1).max(80),
  clinicName: z.string().trim().max(200).optional(),
  failedItems: z.array(z.object({
    label: z.string().trim().min(1).max(1000),
    status: z.enum(['pass', 'fail', 'warning']),
    riskLevel: z.enum(['high', 'medium', 'low']),
  })).max(100),
});

// ── Feature 5: AI Inspection Remediation Guide ──────────────────────────────
// Model: Gemini 2.5 Pro (complex analysis + regulatory knowledge)
// Takes failed inspection items and generates a detailed remediation plan
// with specific regulatory citations, step-by-step actions, required
// documents, estimated timelines, and responsible persons.

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic']);
    if (roleError) return roleError;

    const body = await parseJson(req, RemediationSchema);
    if (body instanceof NextResponse) return body;

    if (!body.failedItems || body.failedItems.length === 0) {
      return NextResponse.json({
        remediation: "Barcha bandlar muvaffaqiyatli o'tdi. Tuzatish kerak emas.",
        model: 'gemini-2.5-pro',
      });
    }

    const prompt = `Klinika: ${body.clinicName ?? 'Nomi ko\'rsatilmagan'}
Tekshiruv turi: ${body.checklistType}

Muvaffaqiyatsiz bo'lgan bandlar (${body.failedItems.length} ta):
${body.failedItems.map((item, i) => `
${i + 1}. "${item.label}"
   Holati: ${item.status === 'fail' ? 'Muvaffaqiyatsiz' : 'Ogohlantirish'}
   Xavf darajasi: ${item.riskLevel === 'high' ? 'YUQORI' : item.riskLevel === 'medium' ? "O'RTA" : 'PAST'}
`).join('')}

Har bir band uchun batafsil tuzatish rejasini tuzing.
Har bir band uchun alohida bo'lim yarating.`;

    const remediation = await generateForTask('remediate', INSPECTION_REMEDIATION_PROMPT, prompt, {
      temperature: 0.25,
      maxTokens: 8192,
    });

    return NextResponse.json({
      remediation,
      plan: remediation,
      model: 'gemini-2.5-pro',
      itemCount: body.failedItems.length,
    });
  } catch (err: unknown) {
    console.error('[inspection/remediate POST error]', err);
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
