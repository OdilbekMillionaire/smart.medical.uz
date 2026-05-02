import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { isApiError, parseJson, requireApiUser } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { compactObject, writeAuditLog } from '@/lib/server-events';
import type { ForumPost, UserRole } from '@/types';

const CreatePostSchema = z.object({
  title: z.string().trim().min(1).max(250),
  body: z.string().trim().min(1).max(50000),
  category: z.string().trim().min(1).max(120),
  authorName: z.string().trim().min(1).max(160).optional(),
  anonymous: z.boolean().optional(),
  pinned: z.boolean().optional(),
});

const ViewPostSchema = z.object({
  id: z.string().trim().min(1).max(128),
  action: z.literal('view'),
});

const DeletePostSchema = z.object({
  id: z.string().trim().min(1).max(128),
});

function canManagePost(auth: { uid: string; role: UserRole }, post: ForumPost) {
  return auth.role === 'admin' || post.authorId === auth.uid;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;

    const category = req.nextUrl.searchParams.get('category')?.trim();
    const collection = getAdminDb().collection('forum_posts');
    const snapshot = category && category !== 'all'
      ? await collection.where('category', '==', category).get()
      : await collection.get();

    const posts = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as ForumPost))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json({ posts });
  } catch (err) {
    console.error('[forum GET error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;

    const body = await parseJson(req, CreatePostSchema);
    if (body instanceof NextResponse) return body;

    const now = new Date().toISOString();
    const data = compactObject({
      title: body.title,
      body: body.body,
      category: body.category,
      authorId: body.anonymous ? 'anonymous' : auth.uid,
      authorName: body.anonymous ? 'Anonim' : (body.authorName ?? auth.email ?? 'User'),
      authorRole: auth.role,
      replies: 0,
      views: 0,
      pinned: auth.role === 'admin' ? body.pinned ?? false : false,
      createdAt: now,
      updatedAt: now,
    }) as Omit<ForumPost, 'id'>;

    const ref = await getAdminDb().collection('forum_posts').add(data);
    await writeAuditLog(auth, 'forum_post_created', 'forum_post', ref.id, data.title);
    return NextResponse.json({ id: ref.id, ...data });
  } catch (err) {
    console.error('[forum POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;

    const body = await parseJson(req, ViewPostSchema);
    if (body instanceof NextResponse) return body;

    const ref = getAdminDb().collection('forum_posts').doc(body.id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await ref.update({ views: FieldValue.increment(1), updatedAt: new Date().toISOString() });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[forum PATCH error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;

    const body = await parseJson(req, DeletePostSchema);
    if (body instanceof NextResponse) return body;

    const db = getAdminDb();
    const ref = db.collection('forum_posts').doc(body.id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const post = { id: snap.id, ...snap.data() } as ForumPost;
    if (!canManagePost(auth, post)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const replies = await db.collection('forum_replies').where('postId', '==', body.id).get();
    const batch = db.batch();
    replies.docs.forEach((replyDoc) => batch.delete(replyDoc.ref));
    batch.delete(ref);
    await batch.commit();

    await writeAuditLog(auth, 'forum_post_deleted', 'forum_post', body.id, post.title);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[forum DELETE error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
