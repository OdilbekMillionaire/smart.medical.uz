import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isApiError, parseJson, requireApiUser } from '@/lib/api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { compactObject, createServerNotification, writeAuditLog } from '@/lib/server-events';
import type { JobApplication, JobListing, UserRole } from '@/types';

const USER_ROLES: UserRole[] = ['admin', 'clinic', 'doctor', 'patient'];

const CreateApplicationSchema = z.object({
  jobId: z.string().trim().min(1).max(128),
  applicantName: z.string().trim().min(1).max(200),
  message: z.string().trim().max(30000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser(req);
    if (isApiError(auth)) return auth;

    const body = await parseJson(req, CreateApplicationSchema);
    if (body instanceof NextResponse) return body;

    const db = getAdminDb();
    const jobSnap = await db.collection('job_listings').doc(body.jobId).get();
    if (!jobSnap.exists) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    const job = { id: jobSnap.id, ...jobSnap.data() } as JobListing;
    if (job.status !== 'active') return NextResponse.json({ error: 'Job is not active' }, { status: 409 });

    const duplicate = await db
      .collection('job_applications')
      .where('jobId', '==', body.jobId)
      .where('applicantId', '==', auth.uid)
      .limit(1)
      .get();
    if (!duplicate.empty) return NextResponse.json({ error: 'Already applied' }, { status: 409 });

    const data = compactObject({
      jobId: body.jobId,
      applicantId: auth.uid,
      applicantName: body.applicantName,
      applicantRole: USER_ROLES.includes(auth.role) ? auth.role : 'patient',
      message: body.message ?? '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    }) as Omit<JobApplication, 'id'>;

    const ref = await db.collection('job_applications').add(data);
    await writeAuditLog(auth, 'job_application_created', 'job_application', ref.id, job.title);
    await createServerNotification({
      userId: job.clinicId,
      type: 'job_application',
      title: 'Yangi ish arizasi',
      body: job.title,
      link: '/dashboard/jobs',
    });

    return NextResponse.json({ id: ref.id, ...data });
  } catch (err) {
    console.error('[jobs applications POST error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
