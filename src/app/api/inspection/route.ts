import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { generateText, INSPECTION_PROMPT } from '@/lib/vertex-ai';
import type { InspectionRecord, InspectionItem, UserRole } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const role = decoded.role as UserRole;
    const db = getAdminDb();

    let snapshot;
    if (role === 'admin') {
      snapshot = await db.collection('inspection_records').orderBy('createdAt', 'desc').get();
    } else {
      snapshot = await db
        .collection('inspection_records')
        .where('clinicId', '==', decoded.uid)
        .orderBy('createdAt', 'desc')
        .get();
    }

    const records = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as InspectionRecord));
    return NextResponse.json({ records });
  } catch (err: unknown) {
    console.error('[inspection GET error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const db = getAdminDb();

    const body = await req.json() as {
      checklistType: InspectionRecord['checklistType'];
      items: InspectionItem[];
    };

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

    const data: Omit<InspectionRecord, 'id'> = {
      clinicId: decoded.uid,
      checklistType: body.checklistType,
      items: body.items,
      overallRisk,
      recommendations,
      generatedDocIds: [],
      createdAt: new Date().toISOString(),
    };

    const ref = await db.collection('inspection_records').add(data);
    return NextResponse.json({ id: ref.id, ...data });
  } catch (err: unknown) {
    console.error('[inspection POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
