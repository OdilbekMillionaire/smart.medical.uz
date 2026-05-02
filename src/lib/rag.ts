import { VertexAI, type Tool } from '@google-cloud/vertexai';
import type { AiSource } from '@/components/shared/SourcesList';

let _vertex: VertexAI | null = null;

function getVertex(): VertexAI {
  if (_vertex) return _vertex;

  const project = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.VERTEX_AI_LOCATION ?? 'europe-west1';
  if (!project) throw new Error('GOOGLE_CLOUD_PROJECT_ID is not set');

  const rawKey = process.env.VERTEX_AI_SERVICE_ACCOUNT_KEY;
  let credentials: object | undefined;
  if (rawKey) {
    try {
      credentials = JSON.parse(rawKey) as object;
    } catch {
      credentials = JSON.parse(Buffer.from(rawKey, 'base64').toString('utf-8')) as object;
    }
  }

  _vertex = new VertexAI({
    project,
    location,
    ...(credentials
      ? { googleAuthOptions: { credentials, scopes: ['https://www.googleapis.com/auth/cloud-platform'] } }
      : {}),
  });

  return _vertex;
}

export type CorpusType = 'hr' | 'legal' | 'general';

function getCorpusName(type: CorpusType): string {
  const val =
    type === 'hr' ? process.env.VERTEX_AI_RAG_CORPUS_HR : process.env.VERTEX_AI_RAG_CORPUS_LEGAL;
  if (!val) throw new Error(`RAG corpus env var not set for type: ${type}`);
  return val;
}

const SYSTEM_PROMPTS: Record<CorpusType, string> = {
  general: `Siz "AI Tibbiy Maslahatchi" — O'zbekiston xususiy klinikalariga xizmat ko'rsatuvchi mutaxassis AI yordamchisiz.

Bilim bazangiz: SanQvaN sanitariya normalari, SSV buyruqlari, tibbiy litsenziyalash qoidalari, mehnat qonunchiligi, klinik protokollar va tibbiy standartlar.

Qoidalar:
1. Avval bilim bazasidan tegishli ma'lumotlarni qidiring va ular asosida javob bering
2. Hujjat raqamlarini (SanQvaN №..., SSV buyrug'i №...) aniq keltiring
3. Klinik belgilar hayot uchun xavfli bo'lsa: "103 ga qo'ng'iroq qiling" deying
4. Dori dozalari, laboratoriya ko'rsatkichlari yoki normativ havolalarni to'qimang
5. Yakuniy qaror mutaxassis shifokor yoki yuristga tegishli ekanini eslatib o'ting
6. Foydalanuvchi qaysi tilda yozsa, o'sha tilda (o'zbek, rus, ingliz) javob bering`,

  hr: `Siz O'zbekiston mehnat qonunchiligi va tibbiy muassasalar kadrlar boshqaruvi bo'yicha mutaxassis AI yordamchisiz.
Savollarga faqat taqdim etilgan hujjatlar (Mehnat kodeksi, SSV buyruqlari, malaka talablari) asosida javob bering.
Javoblarni aniq, amaliy va o'zbek tilida yozing. Agar hujjatlarda ma'lumot bo'lmasa, buni aniq aytib o'ting.`,

  legal: `Siz O'zbekiston tibbiyot muassasalari litsenziyalash, SanQvaN sanitariya normalari, QMQ, ShNQ va SSV qoidalari bo'yicha mutaxassis AI yordamchisiz.
Savollarga faqat taqdim etilgan hujjatlar asosida javob bering.
Javoblarni aniq, amaliy va o'zbek tilida yozing. Agar hujjatlarda ma'lumot bo'lmasa, buni aniq aytib o'ting.`,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractSources(chunks: any[]): AiSource[] {
  const seen = new Set<string>();
  const sources: AiSource[] = [];

  for (const chunk of chunks) {
    if (chunk?.retrievedContext) {
      const uri: string = chunk.retrievedContext.uri ?? '';
      const raw: string = chunk.retrievedContext.title ?? uri.split('/').pop() ?? 'Hujjat';
      const title = raw.replace(/\.pdf$/i, '');
      const key = uri || title;
      if (!seen.has(key)) { seen.add(key); sources.push({ type: 'rag', title, uri }); }
    } else if (chunk?.web) {
      const uri: string = chunk.web.uri ?? '';
      const title: string = chunk.web.title ?? new URL(uri).hostname;
      if (!seen.has(uri)) { seen.add(uri); sources.push({ type: 'web', title, uri }); }
    }
  }

  return sources;
}

export async function streamRAGResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  corpusType: CorpusType,
  modelId?: string,
  extraContext?: string,
): Promise<ReadableStream<Uint8Array>> {
  const vertex = getVertex();
  const corpusName = getCorpusName(corpusType);
  const basePrompt = SYSTEM_PROMPTS[corpusType];
  const systemPrompt = extraContext
    ? `${basePrompt}\n\nKlinika konteksti: ${extraContext}`
    : basePrompt;

  const tools: Tool[] = [
    {
      retrieval: {
        vertexRagStore: {
          ragResources: [{ ragCorpus: corpusName }],
          similarityTopK: 5,
        },
      },
    },
  ];

  const model = vertex.preview.getGenerativeModel({
    model: modelId ?? 'gemini-2.5-pro',
    systemInstruction: systemPrompt,
    generationConfig: { maxOutputTokens: 4096, temperature: 0.4 },
    tools,
  });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1].content;
  const chat = model.startChat({ history });
  const streamResult = await chat.sendMessageStream(lastMessage);

  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let lastMeta: any = null;

      try {
        for await (const chunk of streamResult.stream) {
          const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: text })}\n\n`));
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const meta = (chunk as any).candidates?.[0]?.groundingMetadata;
          if (meta) lastMeta = meta;
        }

        // Final response may have complete grounding metadata
        try {
          const finalResp = await streamResult.response;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const meta = (finalResp as any).candidates?.[0]?.groundingMetadata;
          if (meta) lastMeta = meta;
        } catch { /* ignore */ }

        if (lastMeta?.groundingChunks?.length) {
          const sources = extractSources(lastMeta.groundingChunks);
          if (sources.length > 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ sources })}\n\n`));
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}
