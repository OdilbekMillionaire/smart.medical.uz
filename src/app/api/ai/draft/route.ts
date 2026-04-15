import { NextRequest, NextResponse } from 'next/server';
import { generateForTask, DOCUMENT_DRAFT_PROMPT, REPLY_DRAFT_PROMPT } from '@/lib/vertex-ai';
import { getAdminAuth } from '@/lib/firebase-admin';

// ── Feature 1: AI Document/Reply Drafting ─────────────────────────────────────
// Upgraded to use Gemini 2.5 Flash via generateForTask('draft')
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    await getAdminAuth().verifyIdToken(token);

    const body = await req.json() as {
      mode: 'document' | 'reply';
      documentType?: string;
      context?: string;
      requestBody?: string;
    };

    const { mode, documentType, context, requestBody } = body;

    let prompt: string;
    let systemPrompt: string;

    if (mode === 'reply') {
      systemPrompt = REPLY_DRAFT_PROMPT;
      prompt = `So'rov matni:\n${requestBody ?? ''}\n\nIltimos, ushbu so'rovga rasmiy javob xatini tuzing.`;
    } else {
      systemPrompt = DOCUMENT_DRAFT_PROMPT;
      prompt = `Hujjat turi: ${documentType ?? 'Umumiy hujjat'}\nKontekst: ${context ?? ''}\n\nIltimos, ushbu hujjatni to'liq va professional ravishda tuzing.`;
    }

    const content = await generateForTask('draft', systemPrompt, prompt, {
      temperature: 0.3,
      maxTokens: 8192,
    });
    return NextResponse.json({ content, model: 'gemini-2.5-flash' });
  } catch (err: unknown) {
    console.error('[AI draft error]', err);
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
