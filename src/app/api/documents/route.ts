import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { generateForTask, DOCUMENT_DRAFT_PROMPT } from '@/lib/vertex-ai';
import { isApiError, parseJson, requireApiUser } from '@/lib/api-auth';
import { compactObject, notifyAdmins, writeAuditLog } from '@/lib/server-events';
import { z } from 'zod';
import { fillTemplate, getDocumentTemplate } from '@/data/templates';
import type { Document } from '@/types';

const CreateDocumentSchema = z.object({
  title: z.string().trim().min(1).max(200),
  type: z.string().trim().min(1).max(80),
  ownerType: z.string().trim().min(1).max(40).optional(),
  clinicId: z.string().trim().min(1).max(128).optional(),
  content: z.string().max(100000).default(''),
  templateId: z.string().trim().max(120).optional(),
  fields: z.record(z.string(), z.string().max(5000)).optional(),
  useAI: z.boolean().optional(),
  status: z.enum(['draft', 'pending_review']).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const db = getAdminDb();

    let snapshot;
    if (auth.role === 'admin') {
      snapshot = await db.collection('documents').orderBy('createdAt', 'desc').get();
    } else {
      snapshot = await db
        .collection('documents')
        .where('ownerId', '==', auth.uid)
        .get();
    }

    const documents = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as Document))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return NextResponse.json({ documents });
  } catch (err: unknown) {
    console.error('[documents GET error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const db = getAdminDb();

    const body = await parseJson(req, CreateDocumentSchema);
    if (body instanceof NextResponse) return body;
    const now = new Date().toISOString();

    // ── AI Document Drafting (Feature 1) ─────────────────────────────────
    // If useAI flag is set, call Gemini 2.5 Flash to draft a professional document
    const template = body.templateId ? getDocumentTemplate(body.templateId) : undefined;
    const templateContent = template && body.fields ? fillTemplate(template, body.fields) : '';
    const baseContent = body.content.trim() ? body.content : templateContent;
    let aiContent = baseContent;
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
${baseContent}

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

    const data = compactObject({
      title: body.title,
      type: body.type,
      ownerType: body.ownerType ?? auth.role,
      clinicId: auth.role === 'clinic' ? auth.uid : body.clinicId,
      templateId: body.templateId,
      content: aiContent,
      ownerId: auth.uid,
      status: body.status ?? 'draft',
      createdAt: now,
      updatedAt: now,
      aiOpinion,
    }) as Omit<Document, 'id'>;

    const ref = await db.collection('documents').add(data);
    const created = { id: ref.id, ...data };
    await writeAuditLog(
      auth,
      body.status === 'pending_review' ? 'document_submitted' : 'document_created',
      'document',
      ref.id,
      body.title
    );
    if (body.status === 'pending_review') {
      await notifyAdmins({
        type: 'document_submitted',
        title: "Yangi hujjat ko'rib chiqish uchun yuborildi",
        body: body.title,
        link: `/dashboard/documents/${ref.id}`,
      });
    }
    return NextResponse.json(created);
  } catch (err: unknown) {
    console.error('[documents POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
