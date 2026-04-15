import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { generateForTask, VISIT_SUMMARY_PROMPT } from '@/lib/vertex-ai';

// ── Feature 3: AI Patient Visit Summary Generator ────────────────────────────
// Model: Gemini 2.5 Pro (detailed medical analysis)
// Generates a professional medical visit summary from diagnosis, prescriptions,
// and procedures. Used by clinic ERP after recording a patient visit.

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    await getAdminAuth().verifyIdToken(token);

    const body = await req.json() as {
      patientName: string;
      patientAge?: string;
      visitDate: string;
      diagnosis: string;
      prescriptions: string[];
      procedures: string[];
      doctorName?: string;
      nextVisit?: string;
      notes?: string;
    };

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
