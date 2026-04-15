import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { getAdminDb } from '@/lib/firebase-admin';
import { generateForTask, DOCUMENT_DRAFT_PROMPT } from '@/lib/vertex-ai';
import type { Document, UserRole } from '@/types';

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
      snapshot = await db.collection('documents').orderBy('createdAt', 'desc').get();
    } else {
      snapshot = await db
        .collection('documents')
        .where('ownerId', '==', decoded.uid)
        .orderBy('createdAt', 'desc')
        .get();
    }

    const documents = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Document));
    return NextResponse.json({ documents });
  } catch (err: unknown) {
    console.error('[documents GET error]', err);
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
      title: string;
      type: string;
      ownerType: string;
      clinicId?: string;
      content: string;
      templateId?: string;
      fields?: Record<string, string>;
      useAI?: boolean;
    };
    const now = new Date().toISOString();

    // ── AI Document Drafting (Feature 1) ─────────────────────────────────
    // If useAI flag is set, call Gemini 2.5 Flash to draft a professional document
    let aiContent = body.content;
    let aiOpinion: string | undefined;
    if (body.useAI && body.templateId) {
      try {
        const fieldsSummary = body.fields
          ? Object.entries(body.fields).map(([k, v]) => `${k}: ${v}`).join('\n')
          : '';
        const prompt = `Hujjat turi: ${body.title}
Shablon ID: ${body.templateId}
Maydonlar:
${fieldsSummary}

Mavjud matn:
${body.content}

Ushbu ma'lumotlar asosida to'liq professional rasmiy hujjat matnini yarating.
Hujjat O'zbekiston qonunchiligiga mos bo'lishi kerak.`;

        aiContent = await generateForTask('draft', DOCUMENT_DRAFT_PROMPT, prompt, {
          temperature: 0.3,
          maxTokens: 8192,
        });

        aiOpinion = `AI yordamchi tahlili (Gemini 2.5 Flash): Ushbu hujjat "${body.title}" shabloni asosida AI tomonidan tayyorlangan. O'zbekiston qonunchiligiga muvofiq tuzilgan. Huquqiy ekspert tomonidan ko'rib chiqilishi tavsiya etiladi.`;
      } catch (aiErr) {
        console.error('[AI draft error]', aiErr);
        aiOpinion = 'AI hujjat tayyorlashda xatolik yuz berdi. Qo\'lda tahrirlang.';
      }
    }

    const data: Omit<Document, 'id'> = {
      title: body.title,
      type: body.type,
      ownerType: body.ownerType,
      clinicId: body.clinicId,
      content: aiContent,
      ownerId: decoded.uid,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      reviewNote: aiOpinion,
    };

    const ref = await db.collection('documents').add(data);
    return NextResponse.json({ id: ref.id, ...data });
  } catch (err: unknown) {
    console.error('[documents POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
