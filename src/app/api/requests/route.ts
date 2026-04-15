import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { generateForTask, REQUEST_CLASSIFICATION_PROMPT, REPLY_DRAFT_PROMPT } from '@/lib/vertex-ai';
import type { Request, UserRole } from '@/types';

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
      snapshot = await db.collection('requests').orderBy('createdAt', 'desc').get();
    } else {
      snapshot = await db
        .collection('requests')
        .where('fromUserId', '==', decoded.uid)
        .orderBy('createdAt', 'desc')
        .get();
    }

    const requests = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Request));
    return NextResponse.json({ requests });
  } catch (err: unknown) {
    console.error('[requests GET error]', err);
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

    const body = await req.json() as { subject: string; body: string; toClinicId?: string };

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
    const data: Omit<Request, 'id'> = {
      fromUserId: decoded.uid,
      toClinicId: body.toClinicId,
      toAdminId: body.toClinicId ? undefined : 'admin',
      subject: body.subject,
      body: body.body,
      aiClassification,
      draftReplyId: aiDraftReply,
      status: 'received',
      createdAt: now,
    };

    const ref = await db.collection('requests').add(data);
    return NextResponse.json({ id: ref.id, ...data });
  } catch (err: unknown) {
    console.error('[requests POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
