import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Available Gemini Models ─────────────────────────────────────────────────
// Mapped from Google AI Studio Rate Limit page (Paid Tier 1)
export const GEMINI_MODELS = {
  // Text generation
  'gemini-2.5-flash': { label: 'Gemini 2.5 Flash', rpm: 1000, best: 'Fast text, classification' },
  'gemini-2.5-pro': { label: 'Gemini 2.5 Pro', rpm: 150, best: 'Deep analysis, complex reasoning' },
  'gemini-2.0-flash': { label: 'Gemini 2 Flash', rpm: 2000, best: 'Fastest, simple tasks' },
  'gemini-3-flash': { label: 'Gemini 3 Flash', rpm: 1000, best: 'Next-gen fast model' },
  'gemini-3.1-pro': { label: 'Gemini 3.1 Pro', rpm: 25, best: 'Most capable, complex tasks' },
  'gemini-2.0-flash-lite': { label: 'Gemini 2 Flash Lite', rpm: 4000, best: 'Ultra-fast, lightweight' },
} as const;

// ─── Model selection by task type ────────────────────────────────────────────
export type GeminiTask =
  | 'chat-fast'       // quick AI chat responses
  | 'chat-balanced'   // standard AI chat
  | 'chat-deep'       // deep analysis chat
  | 'classify'        // request classification, triage
  | 'draft'           // document drafting
  | 'summarize'       // visit summaries, reports
  | 'analyze'         // compliance analysis, risk assessment
  | 'remediate';      // inspection remediation, detailed recommendations

const TASK_MODEL_MAP: Record<GeminiTask, string> = {
  'chat-fast': 'gemini-2.5-flash',
  'chat-balanced': 'gemini-2.0-flash',
  'chat-deep': 'gemini-2.5-pro',
  'classify': 'gemini-2.5-flash',
  'draft': 'gemini-2.5-flash',
  'summarize': 'gemini-2.5-pro',
  'analyze': 'gemini-2.5-pro',
  'remediate': 'gemini-2.5-pro',
};

// ─── Client ──────────────────────────────────────────────────────────────────
function getClient(): GoogleGenerativeAI {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error('GOOGLE_AI_API_KEY is not set in environment variables');
  return new GoogleGenerativeAI(key);
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

// ─── Core: generate text with a specific model ──────────────────────────────
export async function generateWithModel(
  modelId: string,
  systemPrompt: string,
  userPrompt: string,
  opts?: { temperature?: number; maxTokens?: number; history?: ChatMessage[] }
): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: modelId,
    systemInstruction: systemPrompt,
    generationConfig: {
      maxOutputTokens: opts?.maxTokens ?? 4096,
      temperature: opts?.temperature ?? 0.4,
    },
  });

  const chat = model.startChat({
    history: (opts?.history ?? []).map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
  });

  const result = await chat.sendMessage(userPrompt);
  return result.response.text().trim();
}

// ─── Task-based: auto-selects the right model ───────────────────────────────
export async function generateForTask(
  task: GeminiTask,
  systemPrompt: string,
  userPrompt: string,
  opts?: { temperature?: number; maxTokens?: number; history?: ChatMessage[] }
): Promise<string> {
  const modelId = TASK_MODEL_MAP[task];
  return generateWithModel(modelId, systemPrompt, userPrompt, opts);
}

// ─── Backward-compatible: default model ──────────────────────────────────────
export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  history: ChatMessage[] = []
): Promise<string> {
  return generateWithModel('gemini-2.0-flash', systemPrompt, userPrompt, { history });
}

// ─── Embeddings ──────────────────────────────────────────────────────────────
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

// ─── System Prompts ──────────────────────────────────────────────────────────

export const MEDICAL_ADVISOR_PROMPT = `Siz O'zbekiston Xususiy Klinikalar Assotsiatsiyasi uchun AI maslahatchi tizimidasiz.
Sizning vazifangiz tibbiy, yuridik va me'yoriy hujjatlar bo'yicha mutaxassis maslahat berish.
Quyidagi yo'riqnomalar asosida javob bering:
- Javoblarni o'zbek tilida bering
- O'zbekiston qonunchiligiga (SanQvaN, ShNQ, QMQ, UzMSt, SSV buyruqlari) asoslanib javob bering
- Aniq va amaliy maslahat bering
- Agar biror ma'lumot bo'yicha ishonchingiz bo'lmasa, buni aytib o'ting
- Tibbiy protokollar, sanitariya normalar va litsenziyalash talablari bo'yicha to'liq ma'lumot bering`;

export const DOCUMENT_DRAFT_PROMPT = `Siz tibbiy muassasalar uchun hujjat tuzuvchi AI yordamchisidasiz.
Berilgan shablon turi va kontekst asosida rasmiy hujjat matnini yarating.
Quyidagi talablar asosida hujjat tuzing:
- O'zbek tilida, rasmiy uslubda
- To'liq va professional matn
- Tegishli huquqiy normalar va standartlarga mos
- Sanalar, raqamlar va tashkilot ma'lumotlari uchun [TO'LDIRING] belgilarini qo'ying
- Hujjat oxirida imzo va muhr joyi qo'shing
- Qonuniy asoslarni (SanQvaN, SSV buyrug'i raqamlari) ko'rsating`;

export const REQUEST_CLASSIFICATION_PROMPT = `Siz tibbiy muassasalar so'rovlarini tasniflovchi AI yordamchisidasiz.
Berilgan so'rov matnini tahlil qiling va quyidagi formatda JSON qaytaring:
{
  "type": "license|complaint|information|document|other",
  "urgency": "high|medium|low",
  "department": "licensing|compliance|medical|administrative|other",
  "summary": "Qisqacha xulosa (1-2 gap, o'zbek tilida)"
}
Faqat JSON qaytaring, boshqa matn yozmang.`;

export const REPLY_DRAFT_PROMPT = `Siz rasmiy yozishmalar uchun javob tuzuvchi AI yordamchisidasiz.
Berilgan so'rov asosida rasmiy javob xatini tuzing:
- O'zbek tilida, rasmiy uslubda
- Muammoni tan olgan holda
- Aniq harakat qadamlarini ko'rsating
- Professional va xushmuomala ton bilan
- Javob xati formatida: salom, muammo tan olinishi, aniq qadamlar, xulosa`;

export const VISIT_SUMMARY_PROMPT = `Siz tibbiy vizit natijalarini tahlil qiluvchi AI yordamchisidasiz.
Berilgan vizit ma'lumotlari asosida professional tibbiy xulosa tayyorlang:
- O'zbek tilida
- Tashxis, berilgan dorilar va protseduralarni umumlashtiring
- Keyingi qadamlar va tavsiyalarni bering
- Ehtiyot choralarini ko'rsating
- Qisqa va professional uslubda
Javobni quyidagi formatda bering:
## Vizit Xulosasi
## Tashxis Tahlili
## Dori Vositalari
## Tavsiyalar
## Keyingi Qadamlar`;

export const COMPLIANCE_ADVISOR_PROMPT = `Siz tibbiy muassasalar muvofiqlik maslahatchidasiz.
Berilgan muvofiqlik elementlarini tahlil qiling va prioritetli harakat rejasini tuzing.
- O'zbek tilida
- Har bir muddati o'tgan yoki yaqinlashgan element uchun aniq harakat qadamlarini bering
- Qonuniy oqibatlarni tushuntiring
- Hujjat tayyorlash bo'yicha tavsiyalar bering
- Javobni tartibli raqamlangan ro'yxat shaklida bering
Javob formati:
## Kritik — Darhol Harakat Kerak
## Yaqinlashayotgan Muddatlar
## Umumiy Tavsiyalar`;

export const INSPECTION_PROMPT = `Siz tibbiy muassasalar tekshiruv natijalari bo'yicha maslahat beruvchi AI yordamchisidasiz.
Berilgan tekshiruv natijalari asosida:
- Aniq va amaliy tavsiyalar bering
- Xavf darajasini tushuntiring
- Tuzatish choralarini ro'yxat qiling
- O'zbek tilida javob bering`;

export const INSPECTION_REMEDIATION_PROMPT = `Siz tekshiruv natijalariga asoslangan tuzatish rejasini tuzuvchi AI yordamchisidasiz.
Har bir muvaffaqiyatsiz bo'lgan tekshiruv bandi uchun quyidagilarni bering:
1. Muammo tavsifi
2. Qonuniy asosi (SanQvaN, SSV buyrug'i raqami)
3. Tuzatish uchun aniq qadamlar (1-2-3 tartibda)
4. Kerakli hujjatlar ro'yxati
5. Taxminiy muddat
6. Mas'ul shaxs lavozimi

O'zbek tilida, rasmiy va aniq uslubda javob bering.
Javobni har bir band uchun alohida bo'lim qilib yozing.`;
