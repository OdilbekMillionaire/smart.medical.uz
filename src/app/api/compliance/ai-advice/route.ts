import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { generateForTask, COMPLIANCE_ADVISOR_PROMPT } from '@/lib/vertex-ai';
import { isApiError, parseJson, requireApiUser, requireRole } from '@/lib/api-auth';
import { z } from 'zod';
import type { ComplianceItem } from '@/types';

const AdviceSchema = z.object({
  clinicId: z.string().trim().min(1).max(128).optional(),
});

// ── Feature 4: AI Compliance Smart Advisor ───────────────────────────────────
// Model: Gemini 2.5 Pro (complex analysis)
// Analyzes all compliance items for a clinic and generates a prioritized
// action plan with specific regulatory references and deadlines.

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic']);
    if (roleError) return roleError;
    const db = getAdminDb();

    const body = await parseJson(req, AdviceSchema);
    if (body instanceof NextResponse) return body;
    const targetClinicId = auth.role === 'admin' && body.clinicId ? body.clinicId : auth.uid;

    // Fetch all compliance items for this clinic
    const snapshot = await db
      .collection('compliance')
      .where('clinicId', '==', targetClinicId)
      .get();

    const items = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as ComplianceItem))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    if (items.length === 0) {
      return NextResponse.json({
        advice: "Hozircha muvofiqlik elementlari topilmadi. Yangi muddat qo'shing.",
        model: 'gemini-2.5-pro',
        itemCount: 0,
      });
    }

    // Compute days remaining for each item
    const now = new Date();
    const itemsWithDays = items
      .filter((item) => item.status !== 'done')
      .map((item) => {
        const due = new Date(item.dueDate);
        const diffMs = due.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return { ...item, daysRemaining };
      });

    const overdueItems = itemsWithDays.filter((i) => i.daysRemaining < 0);
    const criticalItems = itemsWithDays.filter((i) => i.daysRemaining >= 0 && i.daysRemaining <= 7);
    const upcomingItems = itemsWithDays.filter((i) => i.daysRemaining > 7 && i.daysRemaining <= 30);
    const okItems = itemsWithDays.filter((i) => i.daysRemaining > 30);

    const prompt = `Klinika muvofiqlik holati:

MUDDATI O'TGAN (${overdueItems.length} ta):
${overdueItems.map((i) => `- ${i.title} (${i.type}) — ${Math.abs(i.daysRemaining)} kun kechikkan`).join('\n') || 'Yo\'q'}

KRITIK — 7 KUN ICHIDA (${criticalItems.length} ta):
${criticalItems.map((i) => `- ${i.title} (${i.type}) — ${i.daysRemaining} kun qoldi`).join('\n') || 'Yo\'q'}

YAQINLASHAYOTGAN — 30 KUN ICHIDA (${upcomingItems.length} ta):
${upcomingItems.map((i) => `- ${i.title} (${i.type}) — ${i.daysRemaining} kun qoldi`).join('\n') || 'Yo\'q'}

NORMAL (${okItems.length} ta):
${okItems.map((i) => `- ${i.title} (${i.type}) — ${i.daysRemaining} kun qoldi`).join('\n') || 'Yo\'q'}

Ushbu muvofiqlik holatini tahlil qiling va prioritetli harakat rejasini tuzing.`;

    const advice = await generateForTask('analyze', COMPLIANCE_ADVISOR_PROMPT, prompt, {
      temperature: 0.3,
      maxTokens: 4096,
    });

    return NextResponse.json({
      advice,
      model: 'gemini-2.5-pro',
      itemCount: items.length,
      stats: {
        overdue: overdueItems.length,
        critical: criticalItems.length,
        upcoming: upcomingItems.length,
        ok: okItems.length,
      },
    });
  } catch (err: unknown) {
    console.error('[compliance/ai-advice POST error]', err);
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
