import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isApiError, parseJson, requireApiUser, requireRole } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { compactObject, writeAuditLog } from '@/lib/server-events';
import type { JobListing } from '@/types';

const CreateJobSchema = z.object({
  title: z.string().trim().min(1).max(250),
  clinicName: z.string().trim().min(1).max(250),
  location: z.string().trim().min(1).max(250),
  region: z.string().trim().min(1).max(120),
  salary: z.string().trim().max(160).optional(),
  description: z.string().trim().max(30000).optional(),
  requirements: z.string().trim().max(30000).optional(),
  badges: z.array(z.string().trim().min(1).max(80)).max(12).optional(),
  expiresAt: z.string().trim().max(40).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;

    const region = req.nextUrl.searchParams.get('region')?.trim();
    let query: FirebaseFirestore.Query = getAdminDb()
      .collection('job_listings')
      .where('status', '==', 'active');
    if (region) query = query.where('region', '==', region);

    const snapshot = await query.get();
    const now = new Date().toISOString();
    const jobs = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as JobListing))
      .filter((job) => !job.expiresAt || job.expiresAt > now)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json({ jobs });
  } catch (err) {
    console.error('[jobs GET error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;
    const roleError = requireRole(auth, ['admin', 'clinic']);
    if (roleError) return roleError;

    const body = await parseJson(req, CreateJobSchema);
    if (body instanceof NextResponse) return body;

    const data = compactObject({
      title: body.title,
      clinicId: auth.uid,
      clinicName: body.clinicName,
      location: body.location,
      region: body.region,
      salary: body.salary || 'Kelishilgan holda',
      description: body.description ?? '',
      requirements: body.requirements ?? '',
      badges: body.badges ?? [],
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: body.expiresAt,
    }) as Omit<JobListing, 'id'>;

    const ref = await getAdminDb().collection('job_listings').add(data);
    await writeAuditLog(auth, 'job_listing_created', 'job_listing', ref.id, data.title);
    return NextResponse.json({ id: ref.id, ...data });
  } catch (err) {
    console.error('[jobs POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
