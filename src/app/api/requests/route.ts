import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { generateForTask, REQUEST_CLASSIFICATION_PROMPT, REPLY_DRAFT_PROMPT } from '@/lib/vertex-ai';
import { isApiError, parseJson, requireApiUser } from '@/lib/api-auth';
import { compactObject, createServerNotification, notifyAdmins, writeAuditLog } from '@/lib/server-events';
import { z } from 'zod';
import type { Request } from '@/types';

const CreateRequestSchema = z.object({
  subject: z.string().trim().min(1).max(250),
  body: z.string().trim().min(1).max(50000),
  toClinicId: z.string().trim().min(1).max(128).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const db = getAdminDb();

    let snapshot;
    if (auth.role === 'admin') {
      snapshot = await db.collection('requests').orderBy('createdAt', 'desc').get();
    } else if (auth.role === 'clinic') {
      snapshot = await db
        .collection('requests')
        .where('toClinicId', '==', auth.uid)
        .get();
    } else {
      snapshot = await db
        .collection('requests')
        .where('fromUserId', '==', auth.uid)
        .get();
    }

    const requests = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as Request))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return NextResponse.json({ requests });
  } catch (err: unknown) {
    console.error('[requests GET error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const db = getAdminDb();

    const body = await parseJson(req, CreateRequestSchema);
    if (body instanceof NextResponse) return body;

    // ── Feature 2: AI Classification (Gemini 2.5 Flash) ──────────────────
    let aiClassification: string | undefined;
    let aiDraftReply: string | undefined;
    try {
      const classificationText = await generateForTask(
        'classify',
        REQUEST_CLASSIFICATION_PROMPT,
        `Mavzu: ${body.subject}\n\nMatn: ${body.body}`
      );
      const parsed = JSON.parse(classificationText) as {
        type: string;
        urgency: string;
        department: string;
        summary: string;
      };
      aiClassification = `[${parsed.type}] ${parsed.urgency === 'high' ? '🔴 Yuqori' : parsed.urgency === 'medium' ? "🟡 O'rta" : '🟢 Past'} ustuvorlik — ${parsed.department} — ${parsed.summary}`;
    } catch {
      // AI classification failed — fall back to keyword-based
      const text = `${body.subject} ${body.body}`.toLowerCase();
      const cat = text.includes('shikoyat') || text.includes('ariza') ? 'shikoyat'
        : text.includes('litsenziya') || text.includes('ruxsat') ? 'yuridik'
        : text.includes('dori') || text.includes('davolash') ? 'tibbiy'
        : "ma'muriy";
      aiClassification = `[${cat}] Avtomatik tasnif`;
    }

    // ── Feature 2: AI Draft Reply (Gemini 2.5 Flash) ─────────────────────
    try {
      aiDraftReply = await generateForTask(
        'draft',
        REPLY_DRAFT_PROMPT,
        `So'rov mavzusi: ${body.subject}\n\nSo'rov matni: ${body.body}\n\nUshbu so'rovga rasmiy javob xatini tuzing.`,
        { temperature: 0.3 }
      );
    } catch {
      aiDraftReply = `Hurmatli murojaat egasi, murojaatingiz qabul qilindi va ko'rib chiqilmoqda. Yaqin kunlarda javob beramiz. Hurmat bilan, ma'muriyat.`;
    }

    const now = new Date().toISOString();
    const data = compactObject({
      fromUserId: auth.uid,
      toClinicId: body.toClinicId,
      toAdminId: body.toClinicId ? undefined : 'admin',
      subject: body.subject,
      body: body.body,
      aiClassification,
      draftReplyId: aiDraftReply,
      status: 'received',
      createdAt: now,
    }) as Omit<Request, 'id'>;

    const ref = await db.collection('requests').add(data);
    const created = { id: ref.id, ...data };
    await writeAuditLog(auth, 'request_created', 'request', ref.id, body.subject);
    if (body.toClinicId) {
      await createServerNotification({
        userId: body.toClinicId,
        type: 'new_request',
        title: "Yangi murojaat keldi",
        body: body.subject,
        link: `/dashboard/requests/${ref.id}`,
      });
    } else {
      await notifyAdmins({
        type: 'new_request',
        title: "Yangi murojaat keldi",
        body: body.subject,
        link: `/dashboard/requests/${ref.id}`,
      });
    }
    return NextResponse.json(created);
  } catch (err: unknown) {
    console.error('[requests POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
