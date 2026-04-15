import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { generateText, REPLY_DRAFT_PROMPT } from '@/lib/vertex-ai';
import type { Request, UserRole } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const db = getAdminDb();
    const snap = await db.collection('requests').doc(params.id).get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const request = { id: snap.id, ...snap.data() } as Request;
    const role = decoded.role as UserRole;
    if (role !== 'admin' && request.fromUserId !== decoded.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(request);
  } catch (err: unknown) {
    console.error('[request GET error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const role = decoded.role as UserRole;
    const db = getAdminDb();

    const snap = await db.collection('requests').doc(params.id).get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = snap.data() as Request;

    // Only admin can update status/reply
    if (role !== 'admin' && existing.fromUserId !== decoded.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json() as Partial<Request> & { generateDraftReply?: boolean };

    let draftReply: string | undefined;
    if (body.generateDraftReply) {
      try {
        draftReply = await generateText(
          REPLY_DRAFT_PROMPT,
          `Mavzu: ${existing.subject}\n\nMatn: ${existing.body}`
        );
      } catch {
        // silent
      }
    }

    const updates: Partial<Request> = { ...body };
    delete (updates as Record<string, unknown>).generateDraftReply;
    if (draftReply) (updates as Record<string, unknown>).draftReply = draftReply;

    await db.collection('requests').doc(params.id).update(updates as Record<string, unknown>);
    const merged = Object.assign({}, existing, updates, { id: params.id, draftReply });
    return NextResponse.json(merged);
  } catch (err: unknown) {
    console.error('[request PATCH error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
