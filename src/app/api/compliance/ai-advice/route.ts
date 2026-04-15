import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { generateForTask, COMPLIANCE_ADVISOR_PROMPT } from '@/lib/vertex-ai';
import type { ComplianceItem, UserRole } from '@/types';

// ── Feature 4: AI Compliance Smart Advisor ───────────────────────────────────
// Model: Gemini 2.5 Pro (complex analysis)
// Analyzes all compliance items for a clinic and generates a prioritized
// action plan with specific regulatory references and deadlines.

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const role = decoded.role as UserRole;
    const db = getAdminDb();

    const body = await req.json() as { clinicId?: string };
    const targetClinicId = role === 'admin' && body.clinicId ? body.clinicId : decoded.uid;

    // Fetch all compliance items for this clinic
    const snapshot = await db
      .collection('compliance')
      .where('clinicId', '==', targetClinicId)
      .orderBy('dueDate', 'asc')
      .get();

    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ComplianceItem));

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
