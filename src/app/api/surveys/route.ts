import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isApiError, parseJson, requireApiUser } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { compactObject, writeAuditLog } from '@/lib/server-events';
import type { BaseUser, Survey } from '@/types';

const RatingSchema = z.number().int().min(1).max(5);

const CreateSurveySchema = z.object({
  clinicId: z.string().trim().min(1).max(128).optional(),
  visitDate: z.string().trim().max(40).optional(),
  ratings: z.object({
    overall: RatingSchema,
    staff: RatingSchema,
    cleanliness: RatingSchema,
    speed: RatingSchema,
  }),
  comment: z.string().trim().max(10000).optional(),
  wouldRecommend: z.boolean(),
});

function userLabel(user: Partial<BaseUser> | undefined, fallback: string) {
  return user?.displayName || user?.email || fallback;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;

    const db = getAdminDb();
    let snapshot: FirebaseFirestore.QuerySnapshot;
    if (auth.role === 'admin') {
      snapshot = await db.collection('surveys').get();
    } else if (auth.role === 'clinic') {
      snapshot = await db.collection('surveys').where('clinicId', '==', auth.uid).get();
    } else {
      snapshot = await db.collection('surveys').where('patientId', '==', auth.uid).get();
    }

    const surveys = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Survey))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json({ surveys });
  } catch (err) {
    console.error('[surveys GET error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;

    const body = await parseJson(req, CreateSurveySchema);
    if (body instanceof NextResponse) return body;

    const userSnap = await getAdminDb().collection('users').doc(auth.uid).get();
    const userData = userSnap.data() as (Partial<BaseUser> & { linkedClinicId?: string; fullName?: string }) | undefined;
    const clinicId = auth.role === 'clinic'
      ? auth.uid
      : body.clinicId ?? userData?.linkedClinicId ?? auth.uid;
    const patientName = userData?.fullName ?? userLabel(userData, auth.email ?? 'User');

    const data = compactObject({
      clinicId,
      patientId: auth.uid,
      patientName,
      visitDate: body.visitDate,
      ratings: body.ratings,
      comment: body.comment ?? '',
      wouldRecommend: body.wouldRecommend,
      createdAt: new Date().toISOString(),
    }) as Omit<Survey, 'id'>;

    const ref = await getAdminDb().collection('surveys').add(data);
    await writeAuditLog(auth, 'survey_created', 'survey', ref.id, `${data.ratings.overall}/5`);
    return NextResponse.json({ id: ref.id, ...data });
  } catch (err) {
    console.error('[surveys POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
