import { NextRequest, NextResponse } from 'next/server';
import { generateText, MEDICAL_ADVISOR_PROMPT, type ChatMessage } from '@/lib/vertex-ai';
import { getAdminDb } from '@/lib/firebase-admin';
import { isApiError, parseJson, requireApiUser } from '@/lib/api-auth';
import { z } from 'zod';

const QuerySchema = z.object({
  question: z.string().trim().min(1).max(20000),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string().max(20000),
  })).max(50).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;

    const body = await parseJson(req, QuerySchema);
    if (body instanceof NextResponse) return body;

    const { question, history = [] } = body;

    const answer = await generateText(MEDICAL_ADVISOR_PROMPT, question, history as ChatMessage[]);

    // Save to history (non-blocking)
    getAdminDb().collection('rag_queries').add({
      userId: auth.uid,
      userRole: auth.role,
      question,
      answer,
      sources: [],
      createdAt: new Date().toISOString(),
    }).catch(console.error);

    return NextResponse.json({ answer, sources: [] });
  } catch (err: unknown) {
    console.error('[AI query error]', err);
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
