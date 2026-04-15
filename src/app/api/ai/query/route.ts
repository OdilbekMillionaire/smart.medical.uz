import { NextRequest, NextResponse } from 'next/server';
import { generateText, MEDICAL_ADVISOR_PROMPT, type ChatMessage } from '@/lib/vertex-ai';
import { getAdminAuth } from '@/lib/firebase-admin';
import { saveRAGQuery } from '@/lib/firestore';
import type { UserRole } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);

    const body = await req.json() as {
      question: string;
      history?: ChatMessage[];
    };

    const { question, history = [] } = body;
    if (!question?.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const answer = await generateText(MEDICAL_ADVISOR_PROMPT, question, history);

    // Save to history (non-blocking)
    saveRAGQuery({
      userId: decoded.uid,
      userRole: (decoded.role as UserRole) ?? 'patient',
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
