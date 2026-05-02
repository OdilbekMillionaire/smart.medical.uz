import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isApiError, requireApiUser, requireRole } from '@/lib/api-auth';
import type { ERPRecord } from '@/types';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (isApiError(auth)) return auth;
  const roleErr = requireRole(auth, ['clinic', 'admin']);
  if (roleErr) return roleErr;

  const db = getAdminDb();
  const clinicId = auth.role === 'admin'
    ? (req.nextUrl.searchParams.get('clinicId') ?? auth.uid)
    : auth.uid;

  // Default: last 30 days
  const endDate = req.nextUrl.searchParams.get('end') ?? new Date().toISOString().slice(0, 10);
  const startDefault = new Date();
  startDefault.setDate(startDefault.getDate() - 29);
  const startDate = req.nextUrl.searchParams.get('start') ?? startDefault.toISOString().slice(0, 10);

  try {
    const snap = await db
      .collection('erp_records')
      .where('clinicId', '==', clinicId)
      .where('visitDate', '>=', startDate)
      .where('visitDate', '<=', endDate)
      .get();

    const records = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ERPRecord));

    // Daily visits trend
    const dailyMap: Record<string, number> = {};
    const diagnosisMap: Record<string, number> = {};
    const doctorMap: Record<string, number> = {};
    const uniquePatients = new Set<string>();

    for (const r of records) {
      const day = r.visitDate.slice(0, 10);
      dailyMap[day] = (dailyMap[day] ?? 0) + 1;
      uniquePatients.add(r.patientId);
      if (r.assignedDoctorId) doctorMap[r.assignedDoctorId] = (doctorMap[r.assignedDoctorId] ?? 0) + 1;

      // Count first word of diagnosis as category
      const diag = r.diagnosis.split(/[\s,\.]/)[0].trim();
      if (diag) diagnosisMap[diag] = (diagnosisMap[diag] ?? 0) + 1;
    }

    // Fill all days in range
    const dailyVisits: { date: string; visits: number }[] = [];
    const cursor = new Date(startDate);
    const end = new Date(endDate);
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10);
      dailyVisits.push({ date: key, visits: dailyMap[key] ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    const topDiagnoses = Object.entries(diagnosisMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const doctorStats = Object.entries(doctorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([doctorId, visits]) => ({ doctorId, visits }));

    const busiestEntry = dailyVisits.reduce(
      (max, d) => (d.visits > max.visits ? d : max),
      { date: '', visits: 0 }
    );

    return NextResponse.json({
      totalVisits: records.length,
      uniquePatients: uniquePatients.size,
      dailyVisits,
      topDiagnoses,
      doctorStats,
      busiestDay: busiestEntry.date,
      busiestDayCount: busiestEntry.visits,
      startDate,
      endDate,
    });
  } catch (err) {
    console.error('[erp/analytics GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
