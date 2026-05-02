import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { isApiError, parseJson, requireApiUser } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { compactObject, createServerNotification, writeAuditLog } from '@/lib/server-events';
import type { ForumPost, ForumReply } from '@/types';

const CreateReplySchema = z.object({
  postId: z.string().trim().min(1).max(128),
  body: z.string().trim().min(1).max(30000),
  authorName: z.string().trim().min(1).max(160).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;

    const postId = req.nextUrl.searchParams.get('postId')?.trim();
    if (!postId) return NextResponse.json({ error: 'postId is required' }, { status: 400 });

    const snapshot = await getAdminDb().collection('forum_replies').where('postId', '==', postId).get();
    const replies = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as ForumReply))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    return NextResponse.json({ replies });
  } catch (err) {
    console.error('[forum replies GET error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;

    const body = await parseJson(req, CreateReplySchema);
    if (body instanceof NextResponse) return body;

    const db = getAdminDb();
    const postRef = db.collection('forum_posts').doc(body.postId);
    const postSnap = await postRef.get();
    if (!postSnap.exists) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    const post = { id: postSnap.id, ...postSnap.data() } as ForumPost;

    const now = new Date().toISOString();
    const data = compactObject({
      postId: body.postId,
      body: body.body,
      authorId: auth.uid,
      authorName: body.authorName ?? auth.email ?? 'User',
      authorRole: auth.role,
      createdAt: now,
    }) as Omit<ForumReply, 'id'>;

    const replyRef = db.collection('forum_replies').doc();
    const batch = db.batch();
    batch.set(replyRef, data);
    batch.update(postRef, { replies: FieldValue.increment(1), updatedAt: now });
    await batch.commit();

    await writeAuditLog(auth, 'forum_reply_created', 'forum_reply', replyRef.id, post.title);
    if (post.authorId !== 'anonymous' && post.authorId !== auth.uid) {
      await createServerNotification({
        userId: post.authorId,
        type: 'forum_reply',
        title: 'Forumda yangi javob',
        body: post.title,
        link: '/dashboard/forum',
      });
    }

    return NextResponse.json({ id: replyRef.id, ...data });
  } catch (err) {
    console.error('[forum replies POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
