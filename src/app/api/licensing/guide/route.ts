import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateForTask, type ChatMessage } from '@/lib/vertex-ai';
import { LICENSING_SYSTEM_PROMPT } from '@/data/licensing-knowledge';
import { isApiError, parseJson, requireApiUser } from '@/lib/api-auth';

const LicensingSchema = z.object({
  question: z.string().trim().min(1).max(20000),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string().max(20000),
  })).max(50).optional(),
  generateDoc: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;

    const body = await parseJson(req, LicensingSchema);
    if (body instanceof NextResponse) return body;

    const { question, history = [], generateDoc = false } = body;

    const roleContext =
      auth.role === 'clinic'
        ? '\n[Foydalanuvchi roli: Klinika/Tibbiy muassasa. Muassasa litsenziyasi va klinika boshqaruvi bo\'yicha javob bering.]'
        : auth.role === 'doctor'
        ? '\n[Foydalanuvchi roli: Shifokor. Mutaxassislik sertifikati, malaka oshirish va klinikada ishlash talablari bo\'yicha javob bering.]'
        : auth.role === 'admin'
        ? '\n[Foydalanuvchi roli: Platforma administratori. To\'liq va texnik ma\'lumot bering.]'
        : '\n[Foydalanuvchi roli: Bemor/umumiy foydalanuvchi. Tibbiy xizmatlar va huquqlar haqida tushuntirib bering.]';

    const systemPrompt = LICENSING_SYSTEM_PROMPT + roleContext +
      (generateDoc ? '\n[MUHIM: Foydalanuvchi hujjat yaratishni so\'ramoqda. Hujjatni to\'liq, professional tarzda yozing. Boshida "HUJJAT:" deb belgilang.]' : '');

    const answer = await generateForTask('analyze', systemPrompt, question, {
      history: history as ChatMessage[],
      temperature: 0.3,
      maxTokens: 8192,
    });

    const isDocument = generateDoc || answer.startsWith('HUJJAT:') || answer.includes('ARIZA\n') || answer.includes('BUYRUQ\n');

    return NextResponse.json({ answer, isDocument, role: auth.role });
  } catch (err: unknown) {
    console.error('[Licensing guide error]', err);
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
