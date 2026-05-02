import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isApiError, requireApiUser } from '@/lib/api-auth';
import { streamRAGResponse } from '@/lib/rag';
import type { AiSource } from '@/components/shared/SourcesList';

export const runtime = 'nodejs';

const Schema = z.object({
  messages: z
    .array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1).max(20000),
    }))
    .min(1)
    .max(50),
  corpusType: z.enum(['hr', 'legal']),
  useWebSearch: z.boolean().optional(),
  mode: z.enum(['fast', 'balanced', 'deep']).optional(),
});

const MODE_MODELS: Record<string, string> = {
  fast: 'gemini-2.5-flash',
  balanced: 'gemini-2.5-flash',
  deep: 'gemini-2.5-pro',
};

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
};

const SYSTEM_PROMPTS = {
  hr: `Siz O'zbekiston mehnat qonunchiligi va tibbiy muassasalar kadrlar boshqaruvi bo'yicha mutaxassis AI yordamchisiz.
Savollarga O'zbekiston Mehnat kodeksi, SSV buyruqlari va malaka talablariga asoslanib javob bering.
Javoblarni aniq, amaliy va o'zbek tilida yozing. Agar aniq ma'lumot bo'lmasa, buni aytib o'ting.`,

  legal: `Siz O'zbekiston tibbiyot muassasalari litsenziyalash, SanQvaN sanitariya normalari, QMQ, ShNQ va SSV qoidalari bo'yicha mutaxassis AI yordamchisiz.
Savollarga O'zbekiston qonunchiligi va normativ hujjatlarga asoslanib javob bering.
Javoblarni aniq, amaliy va o'zbek tilida yozing. Agar aniq ma'lumot bo'lmasa, buni aytib o'ting.`,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractWebSources(chunks: any[]): AiSource[] {
  const seen = new Set<string>();
  const sources: AiSource[] = [];
  for (const c of chunks) {
    if (c?.web?.uri && !seen.has(c.web.uri)) {
      seen.add(c.web.uri);
      sources.push({ type: 'web', title: c.web.title ?? c.web.uri, uri: c.web.uri });
    }
  }
  return sources;
}

const WEB_SEARCH_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];

async function streamWebSearch(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  corpusType: 'hr' | 'legal',
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is not configured');

  const genAI = new GoogleGenerativeAI(apiKey);
  const encoder = new TextEncoder();
  const systemPrompt = SYSTEM_PROMPTS[corpusType];

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: m.content }],
  }));

  // Try models in order — 503 overload errors fall through to next
  let result;
  let usedModel = WEB_SEARCH_MODELS[0];
  for (const modelId of WEB_SEARCH_MODELS) {
    try {
      const wsModel = genAI.getGenerativeModel({
        model: modelId,
        systemInstruction: systemPrompt,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: [{ googleSearch: {} } as any],
        generationConfig: { maxOutputTokens: 4096, temperature: 0.4 },
      });
      result = await wsModel.generateContentStream({ contents });
      usedModel = modelId;
      break;
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (modelId !== WEB_SEARCH_MODELS[WEB_SEARCH_MODELS.length - 1] &&
          (msg.includes('503') || msg.includes('overload') || msg.includes('unavailable'))) {
        console.warn(`[ai-rag] ${modelId} 503, trying next`);
        continue;
      }
      throw err;
    }
  }
  if (!result) throw new Error('All web search models failed');

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ model: `${usedModel} (web)` })}\n\n`));
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: text })}\n\n`));
        }
        try {
          const final = await result.response;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const chunks = (final as any).candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
          const sources = extractWebSources(chunks);
          if (sources.length) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ sources })}\n\n`));
        } catch { /* no grounding metadata */ }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (isApiError(auth)) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const { messages, corpusType, useWebSearch, mode } = parsed.data;
  const modelId = MODE_MODELS[mode ?? 'deep'];

  try {
    // When web search is requested: use Google AI Studio (supports googleSearch tool natively).
    // Vertex AI cannot combine vertexRagStore + googleSearch simultaneously.
    if (useWebSearch) {
      const stream = await streamWebSearch(messages, corpusType);
      return new Response(stream, { headers: SSE_HEADERS });
    }

    // Default: answer from RAG corpus documents via Vertex AI
    const stream = await streamRAGResponse(messages, corpusType, modelId);
    return new Response(stream, { headers: SSE_HEADERS });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'RAG query failed';
    console.error('[ai-rag]', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
