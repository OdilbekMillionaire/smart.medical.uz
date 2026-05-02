import { NextRequest, NextResponse } from 'next/server';
import { generateForTask, VISIT_SUMMARY_PROMPT } from '@/lib/vertex-ai';
import { isApiError, parseJson, requireApiUser, requireRole } from '@/lib/api-auth';
import { z } from 'zod';

const VisitSummarySchema = z.object({
  patientName: z.string().trim().min(1).max(200),
  patientAge: z.string().trim().max(40).optional(),
  visitDate: z.string().trim().min(1).max(40),
  diagnosis: z.string().trim().min(1).max(20000),
  prescriptions: z.array(z.string().max(5000)).max(100).default([]),
  procedures: z.array(z.string().max(5000)).max(100).default([]),
  doctorName: z.string().trim().max(200).optional(),
  nextVisit: z.string().trim().max(40).optional(),
  notes: z.string().max(20000).optional(),
});

// ── Feature 3: AI Patient Visit Summary Generator ────────────────────────────
// Model: Gemini 2.5 Pro (detailed medical analysis)
// Generates a professional medical visit summary from diagnosis, prescriptions,
// and procedures. Used by clinic ERP after recording a patient visit.

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic', 'doctor']);
    if (roleError) return roleError;

    const body = await parseJson(req, VisitSummarySchema);
    if (body instanceof NextResponse) return body;

    const prescriptionList = body.prescriptions.length > 0
      ? body.prescriptions.map((p, i) => `${i + 1}. ${p}`).join('\n')
      : 'Dori buyurilmagan';

    const procedureList = body.procedures.length > 0
      ? body.procedures.map((p, i) => `${i + 1}. ${p}`).join('\n')
      : 'Protsedura o\'tkazilmagan';

    const prompt = `Bemor: ${body.patientName}${body.patientAge ? `, yoshi: ${body.patientAge}` : ''}
Vizit sanasi: ${body.visitDate}
Shifokor: ${body.doctorName ?? 'Noma\'lum'}
Tashxis: ${body.diagnosis}

Buyurilgan dori vositalari:
${prescriptionList}

O'tkazilgan protseduralar:
${procedureList}

${body.nextVisit ? `Keyingi vizit: ${body.nextVisit}` : ''}
${body.notes ? `Qo'shimcha izohlar: ${body.notes}` : ''}

Ushbu vizit ma'lumotlari asosida professional tibbiy xulosa tayyorlang.`;

    const summary = await generateForTask('summarize', VISIT_SUMMARY_PROMPT, prompt, {
      temperature: 0.3,
      maxTokens: 4096,
    });

    return NextResponse.json({ summary, model: 'gemini-2.5-pro' });
  } catch (err: unknown) {
    console.error('[erp/ai-summary POST error]', err);
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
