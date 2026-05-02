import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isApiError, requireApiUser } from '@/lib/api-auth';
import type { AiSource } from '@/components/shared/SourcesList';
import { streamRAGResponse } from '@/lib/rag';

function extractWebSources(chunks: unknown[]): AiSource[] {
  const seen = new Set<string>();
  const sources: AiSource[] = [];
  for (const c of chunks) {
    const chunk = c as { web?: { uri?: string; title?: string } };
    if (chunk?.web?.uri && !seen.has(chunk.web.uri)) {
      seen.add(chunk.web.uri);
      sources.push({ type: 'web', title: chunk.web.title ?? chunk.web.uri, uri: chunk.web.uri });
    }
  }
  return sources;
}

export const runtime = 'nodejs';

// ─── Actual Gemini models ─────────────────────────────────────────────────────
// NOTE: Only include models that are live on our API key. Keep fallbacks ordered
// from most-capable to most-available so we can recover from temporary 4xx/5xx.
const MODE_TO_MODEL = {
  fast: 'gemini-2.5-flash',
  balanced: 'gemini-2.5-flash',
  deep: 'gemini-2.5-pro',
} as const;

// Whitelist of real Gemini model IDs the UI is allowed to select.
// Cosmetic entries in the model picker (Claude/GPT/DeepSeek/Llama) map to a
// safe Gemini default — we don't silently fail.
const REAL_GEMINI_MODELS = new Set([
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
]);

// Models we'll fall back to, in order, if the primary fails.
const FALLBACK_CHAIN = ['gemini-2.5-flash', 'gemini-2.0-flash'];

// ─── Base system prompt ───────────────────────────────────────────────────────
const BASE_PROMPT = `
You are "AI Tibbiy Maslahatchi" — an expert AI assistant for the Smart Medical Association platform, serving private clinics and healthcare organizations in Uzbekistan.

Your expertise covers:
- Uzbekistan healthcare regulations: SanQvaN sanitariya normalari, SSV (Sog'liqni saqlash vazirligi) buyruqlari, tibbiy litsenziyalash
- Medical compliance: inspection checklists, license renewal, staff credential requirements, sterilization protocols
- Clinical documentation: patient records, referral letters, complaints, protocols, meeting minutes
- Staff management: labor contracts, qualification orders, medical employee rights and duties
- Medical education: symptoms, diagnoses, treatments, medications, lab values explained in plain language

Language: Always respond in the same language the user writes in (Uzbek Latin, Uzbek Cyrillic, Russian, Karakalpak, or English).

Rules:
1. Be accurate, clear, and medically/legally responsible
2. Cite specific norm numbers (SanQvaN №..., SSV buyrug'i №...) when you know them
3. If symptoms sound urgent or life-threatening → immediately say "103 ga qo'ng'iroq qiling" or equivalent
4. Never fabricate drug dosages, lab values, or regulatory citations you're not sure about
5. Always note when a licensed clinician or legal expert must make the final decision
6. End every clinical answer with a one-sentence professional-care reminder
`.trim();

const FORMAT_ADDITIONS: Record<string, string> = {
  default: '',
  medical:
    '\n\nOutput format: Provide a structured MEDICAL OPINION with sections: Tahlil | Sabablari | Tavsiyalar | Keyingi qadam. Use clear headings.',
  summary:
    '\n\nOutput format: Provide an EXECUTIVE SUMMARY — 3-5 bullet points maximum, then one paragraph conclusion. Be concise and actionable.',
  risk:
    '\n\nOutput format: Provide a RISK ASSESSMENT with: Xavf darajasi (High/Medium/Low) → Asosiy xavflar (bullet list) → Xavfni kamaytirish choralari → Muddat tavsiyasi.',
};

// ─── Request schema ───────────────────────────────────────────────────────────
const RequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(20000),
      })
    )
    .min(1)
    .max(50),
  mode: z.enum(['fast', 'balanced', 'deep']).default('balanced'),
  model: z.string().optional(),
  format: z.enum(['default', 'medical', 'summary', 'risk']).default('default'),
  context: z.string().max(2000).optional(),
  useWebSearch: z.boolean().optional(),
});

function pickModel(mode: 'fast' | 'balanced' | 'deep', requestedModel?: string): string {
  if (requestedModel && REAL_GEMINI_MODELS.has(requestedModel)) return requestedModel;
  return MODE_TO_MODEL[mode];
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (isApiError(auth)) return auth;

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GOOGLE_AI_API_KEY is not configured.' },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { messages, mode, model: requestedModel, format, context, useWebSearch } = parsed.data;
  const primaryModel = pickModel(mode, requestedModel);

  const systemPrompt =
    BASE_PROMPT +
    FORMAT_ADDITIONS[format] +
    (context ? `\n\nKlinika konteksti: ${context}` : '');

  const temperature = mode === 'fast' ? 0.3 : mode === 'deep' ? 0.65 : 0.45;

  const genAI = new GoogleGenerativeAI(apiKey);
  const encoder = new TextEncoder();

  // ── Web Search grounding path ──────────────────────────────────────────────
  if (useWebSearch) {
    const wsModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ googleSearch: {} } as any],
      generationConfig: { maxOutputTokens: 4096, temperature: 0.4 },
    });

    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: m.content }],
    }));

    try {
      const result = await wsModel.generateContentStream({ contents });
      const readable = new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ model: 'gemini-2.5-flash (web)' })}\n\n`));
            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: text })}\n\n`));
            }
            try {
              const final = await result.response;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const meta = (final as any).candidates?.[0]?.groundingMetadata ?? {};
              const groundingChunks: unknown[] = meta.groundingChunks ?? [];
              const webSearchQueries: string[] = meta.webSearchQueries ?? [];
              let sources = extractWebSources(groundingChunks);
              // Fallback: if Gemini searched but didn't return specific URLs, show queries as search links
              if (!sources.length && webSearchQueries.length) {
                sources = webSearchQueries.map((q) => ({
                  type: 'web' as const,
                  title: q,
                  uri: `https://www.google.com/search?q=${encodeURIComponent(q)}`,
                }));
              }
              if (sources.length) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ sources })}\n\n`));
            } catch { /* no grounding metadata */ }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (err) { controller.error(err); }
        },
      });
      return new Response(readable, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' },
      });
    } catch (err) {
      console.warn('[ai-chat] web search unavailable, falling back to standard mode:', err);
      // fall through to standard chat path below
    }
  }

  // ── RAG path (default when corpus is configured) ──────────────────────────
  if (process.env.VERTEX_AI_RAG_CORPUS_LEGAL) {
    try {
      const ragStream = await streamRAGResponse(messages, 'general', primaryModel, context ?? undefined);
      return new Response(ragStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    } catch (err) {
      console.warn('[ai-chat] RAG failed, falling back to direct Gemini:', err);
    }
  }

  // ── Standard chat path (fallback when RAG unavailable) ─────────────────────
  // Split history from last user message
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: m.content }],
  }));
  const lastMessage = messages[messages.length - 1].content;

  // Build the fallback chain: primary first, then remaining fallbacks.
  const tryOrder = [primaryModel, ...FALLBACK_CHAIN.filter((m) => m !== primaryModel)];

  // Attempt each model until one starts streaming successfully.
  let lastError: unknown = null;
  for (const modelName of tryOrder) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        generationConfig: { maxOutputTokens: 4096, temperature },
      });

      const chat = model.startChat({ history });
      const result = await chat.sendMessageStream(lastMessage);

      const readable = new ReadableStream({
        async start(controller) {
          try {
            // Tell the client which model actually served the request.
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ model: modelName })}\n\n`)
            );
            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ delta: text })}\n\n`)
                );
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    } catch (err) {
      lastError = err;
      console.error(`[ai-chat] model ${modelName} failed:`, err);
      // try next fallback
    }
  }

  const msg =
    lastError instanceof Error ? lastError.message : 'All models failed to respond.';
  return NextResponse.json({ error: msg, triedModels: tryOrder }, { status: 502 });
}
