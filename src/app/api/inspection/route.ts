import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { generateText, INSPECTION_PROMPT } from '@/lib/vertex-ai';
import { isApiError, parseJson, requireApiUser, requireRole } from '@/lib/api-auth';
import { createServerNotification, writeAuditLog } from '@/lib/server-events';
import { z } from 'zod';
import type { InspectionRecord, InspectionItem } from '@/types';

const InspectionItemSchema = z.object({
  label: z.string().trim().min(1).max(1000),
  status: z.enum(['pass', 'fail', 'warning']),
  riskLevel: z.enum(['high', 'medium', 'low']),
});

const CreateInspectionSchema = z.object({
  clinicId: z.string().trim().min(1).max(128).optional(),
  checklistType: z.enum(['sanitation', 'licensing', 'documentation', 'staff']),
  items: z.array(InspectionItemSchema).min(1).max(100),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic']);
    if (roleError) return roleError;
    const db = getAdminDb();

    let snapshot;
    if (auth.role === 'admin') {
      snapshot = await db.collection('inspection_records').orderBy('createdAt', 'desc').get();
    } else {
      snapshot = await db
        .collection('inspection_records')
        .where('clinicId', '==', auth.uid)
        .get();
    }

    const records = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as InspectionRecord))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return NextResponse.json({ records });
  } catch (err: unknown) {
    console.error('[inspection GET error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic']);
    if (roleError) return roleError;
    const db = getAdminDb();

    const body = await parseJson(req, CreateInspectionSchema);
    if (body instanceof NextResponse) return body;

    // Compute overall risk
    const highCount = body.items.filter((i) => i.status === 'fail' && i.riskLevel === 'high').length;
    const medCount = body.items.filter((i) => i.status === 'fail' && i.riskLevel === 'medium').length;
    const overallRisk: InspectionRecord['overallRisk'] =
      highCount > 0 ? 'high' : medCount > 0 ? 'medium' : 'low';

    // AI recommendations
    let recommendations: string[] = [];
    try {
      const failedItems = body.items.filter((i) => i.status !== 'pass');
      if (failedItems.length > 0) {
        const prompt = `Tekshiruv turi: ${body.checklistType}
Muammoli bandlar:
${failedItems.map((i) => `- ${i.label} (${i.status}, ${i.riskLevel} xavf)`).join('\n')}

Ushbu muammolar uchun aniq tavsiyalar bering.`;
        const recsText = await generateText(INSPECTION_PROMPT, prompt);
        recommendations = recsText.split('\n').filter((l) => l.trim().length > 0);
      }
    } catch {
      recommendations = ['Tizim xatosi tufayli tavsiyalar yuklanmadi'];
    }

    const clinicId = auth.role === 'admin' && body.clinicId ? body.clinicId : auth.uid;
    const data: Omit<InspectionRecord, 'id'> = {
      clinicId,
      checklistType: body.checklistType,
      items: body.items as InspectionItem[],
      overallRisk,
      recommendations,
      generatedDocIds: [],
      createdAt: new Date().toISOString(),
    };

    const ref = await db.collection('inspection_records').add(data);
    await writeAuditLog(auth, 'inspection_created', 'inspection', ref.id, `${body.checklistType}:${overallRisk}`);
    if (overallRisk === 'high' || overallRisk === 'medium') {
      await createServerNotification({
        userId: clinicId,
        type: 'compliance_due',
        title: 'Tekshiruvda xavf aniqlandi',
        body: `${body.checklistType} - ${overallRisk}`,
        link: '/dashboard/inspection',
      });
    }
    return NextResponse.json({ id: ref.id, ...data });
  } catch (err: unknown) {
    console.error('[inspection POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
