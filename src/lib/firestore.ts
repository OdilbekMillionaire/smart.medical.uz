import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  onSnapshot,
  limit,
  increment,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import type {
  BaseUser,
  ClinicUser,
  DoctorUser,
  PatientUser,
  Document,
  ComplianceItem,
  Request,
  ERPRecord,
  InspectionRecord,
  RAGQuery,
  UserRole,
  ForumPost,
  ForumReply,
  JobListing,
  JobApplication,
  AppNotification,
  AuditLog,
  Appointment,
  Survey,
  StaffMember,
  InventoryItem,
  Referral,
  Complaint,
  Message,
  Equipment,
  ClinicEvent,
  Announcement,
  VaccinationRecord,
  Shift,
} from '@/types';

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getUser(
  uid: string
): Promise<BaseUser | ClinicUser | DoctorUser | PatientUser | null> {
  const snap = await getDoc(doc(getFirebaseDb(), 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as BaseUser | ClinicUser | DoctorUser | PatientUser;
}

export async function createUser(
  uid: string,
  data: Partial<BaseUser | ClinicUser | DoctorUser | PatientUser>
): Promise<void> {
  await setDoc(doc(getFirebaseDb(), 'users', uid), data);
}

export async function updateUser(
  uid: string,
  data: Partial<BaseUser | ClinicUser | DoctorUser | PatientUser>
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'users', uid), data as Record<string, unknown>);
}

export async function getUsersByRole(
  role: UserRole
): Promise<(BaseUser | ClinicUser | DoctorUser | PatientUser)[]> {
  const q = query(collection(getFirebaseDb(), 'users'), where('role', '==', role));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as BaseUser | ClinicUser | DoctorUser | PatientUser);
}

export async function getAllUsers(): Promise<(BaseUser | ClinicUser | DoctorUser | PatientUser)[]> {
  const snap = await getDocs(collection(getFirebaseDb(), 'users'));
  return snap.docs.map((d) => d.data() as BaseUser | ClinicUser | DoctorUser | PatientUser);
}

// ─── Clinics ─────────────────────────────────────────────────────────────────

export async function getClinic(id: string): Promise<ClinicUser | null> {
  const snap = await getDoc(doc(getFirebaseDb(), 'clinics', id));
  if (!snap.exists()) return null;
  return snap.data() as ClinicUser;
}

export async function getAllClinics(): Promise<ClinicUser[]> {
  const snap = await getDocs(collection(getFirebaseDb(), 'clinics'));
  return snap.docs.map((d) => d.data() as ClinicUser);
}

export async function updateClinic(id: string, data: Partial<ClinicUser>): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'clinics', id), data as Record<string, unknown>);
}

// ─── Documents ───────────────────────────────────────────────────────────────

export async function getDocumentById(id: string): Promise<Document | null> {
  const snap = await getDoc(doc(getFirebaseDb(), 'documents', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Document;
}

export async function getDocumentsByOwner(ownerId: string): Promise<Document[]> {
  const q = query(collection(getFirebaseDb(), 'documents'), where('ownerId', '==', ownerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Document))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getPendingDocuments(): Promise<Document[]> {
  const q = query(
    collection(getFirebaseDb(), 'documents'),
    where('status', '==', 'pending_review')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Document));
}

export async function getAllDocuments(): Promise<Document[]> {
  const q = query(collection(getFirebaseDb(), 'documents'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Document));
}

export async function createDocument(data: Omit<Document, 'id'>): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), 'documents'), data);
  return ref.id;
}

export async function updateDocument(id: string, data: Partial<Document>): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'documents', id), data as Record<string, unknown>);
}

export async function deleteDocument(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), 'documents', id));
}

// ─── Compliance ───────────────────────────────────────────────────────────────

export async function getComplianceByClinic(clinicId: string): Promise<ComplianceItem[]> {
  const q = query(collection(getFirebaseDb(), 'compliance'), where('clinicId', '==', clinicId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ComplianceItem))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export async function getAllCompliance(): Promise<ComplianceItem[]> {
  const q = query(collection(getFirebaseDb(), 'compliance'), orderBy('dueDate', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ComplianceItem));
}

export async function getOverdueCompliance(): Promise<ComplianceItem[]> {
  const q = query(collection(getFirebaseDb(), 'compliance'), where('status', '==', 'overdue'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ComplianceItem));
}

export async function createComplianceItem(data: Omit<ComplianceItem, 'id'>): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), 'compliance'), data);
  return ref.id;
}

export async function updateComplianceItem(id: string, data: Partial<ComplianceItem>): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'compliance', id), data as Record<string, unknown>);
}

export async function deleteComplianceItem(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), 'compliance', id));
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export async function getRequestById(id: string): Promise<Request | null> {
  const snap = await getDoc(doc(getFirebaseDb(), 'requests', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Request;
}

export async function getRequestsByUser(userId: string): Promise<Request[]> {
  const q = query(collection(getFirebaseDb(), 'requests'), where('fromUserId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Request))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getRequestsByClinic(clinicId: string): Promise<Request[]> {
  const q = query(collection(getFirebaseDb(), 'requests'), where('toClinicId', '==', clinicId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Request))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAllRequests(): Promise<Request[]> {
  const q = query(collection(getFirebaseDb(), 'requests'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Request));
}

export async function createRequest(data: Omit<Request, 'id'>): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), 'requests'), data);
  return ref.id;
}

export async function updateRequest(id: string, data: Partial<Request>): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'requests', id), data as Record<string, unknown>);
}

// ─── ERP Records ─────────────────────────────────────────────────────────────

export async function getERPRecord(id: string): Promise<ERPRecord | null> {
  const snap = await getDoc(doc(getFirebaseDb(), 'erp_records', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ERPRecord;
}

export async function getERPByClinic(clinicId: string): Promise<ERPRecord[]> {
  const q = query(collection(getFirebaseDb(), 'erp_records'), where('clinicId', '==', clinicId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ERPRecord))
    .sort((a, b) => b.visitDate.localeCompare(a.visitDate));
}

export async function createERPRecord(data: Omit<ERPRecord, 'id'>): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), 'erp_records'), data);
  return ref.id;
}

export async function updateERPRecord(id: string, data: Partial<ERPRecord>): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'erp_records', id), data as Record<string, unknown>);
}

export async function deleteERPRecord(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), 'erp_records', id));
}

// ─── Inspection Records ───────────────────────────────────────────────────────

export async function getInspectionByClinic(clinicId: string): Promise<InspectionRecord[]> {
  const q = query(collection(getFirebaseDb(), 'inspection_records'), where('clinicId', '==', clinicId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as InspectionRecord))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAllInspections(): Promise<InspectionRecord[]> {
  const q = query(collection(getFirebaseDb(), 'inspection_records'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as InspectionRecord));
}

export async function createInspectionRecord(data: Omit<InspectionRecord, 'id'>): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), 'inspection_records'), data);
  return ref.id;
}

// ─── RAG Queries ──────────────────────────────────────────────────────────────

export async function saveRAGQuery(data: Omit<RAGQuery, 'id'>): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), 'rag_queries'), data);
  return ref.id;
}

export async function getRAGQueryHistory(userId: string): Promise<RAGQuery[]> {
  const q = query(collection(getFirebaseDb(), 'rag_queries'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as RAGQuery))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ─── Forum ────────────────────────────────────────────────────────────────────

export async function getForumPosts(category?: string): Promise<ForumPost[]> {
  const db = getFirebaseDb();
  const q = category && category !== 'all'
    ? query(collection(db, 'forum_posts'), where('category', '==', category))
    : query(collection(db, 'forum_posts'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ForumPost))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createForumPost(data: Omit<ForumPost, 'id'>): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), 'forum_posts'), data);
  return ref.id;
}

export async function deleteForumPost(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), 'forum_posts', id));
}

export async function incrementForumViews(id: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'forum_posts', id), { views: increment(1) });
}

export async function getForumReplies(postId: string): Promise<ForumReply[]> {
  const q = query(collection(getFirebaseDb(), 'forum_replies'), where('postId', '==', postId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ForumReply))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function createForumReply(data: Omit<ForumReply, 'id'>): Promise<string> {
  const db = getFirebaseDb();
  const ref = await addDoc(collection(db, 'forum_replies'), data);
  // increment reply count on post
  await updateDoc(doc(db, 'forum_posts', data.postId), { replies: increment(1) });
  return ref.id;
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export async function getJobListings(region?: string): Promise<JobListing[]> {
  const db = getFirebaseDb();
  const q = region
    ? query(collection(db, 'job_listings'), where('status', '==', 'active'), where('region', '==', region))
    : query(collection(db, 'job_listings'), where('status', '==', 'active'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobListing))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getJobsByClinic(clinicId: string): Promise<JobListing[]> {
  const q = query(collection(getFirebaseDb(), 'job_listings'), where('clinicId', '==', clinicId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobListing))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createJobListing(data: Omit<JobListing, 'id'>): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), 'job_listings'), data);
  return ref.id;
}

export async function updateJobListing(id: string, data: Partial<JobListing>): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'job_listings', id), data as Record<string, unknown>);
}

export async function applyToJob(data: Omit<JobApplication, 'id'>): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), 'job_applications'), data);
  return ref.id;
}

export async function getJobApplications(jobId: string): Promise<JobApplication[]> {
  const q = query(collection(getFirebaseDb(), 'job_applications'), where('jobId', '==', jobId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobApplication));
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  const q = query(
    collection(getFirebaseDb(), 'notifications'),
    where('userId', '==', userId),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function subscribeToNotifications(
  userId: string,
  callback: (notifications: AppNotification[]) => void
): Unsubscribe {
  const q = query(
    collection(getFirebaseDb(), 'notifications'),
    where('userId', '==', userId),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    const sorted = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as AppNotification))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    callback(sorted);
  });
}

export async function createNotification(data: Omit<AppNotification, 'id'>): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), 'notifications'), data);
  return ref.id;
}

export async function markNotificationRead(id: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'notifications', id), { read: true });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const q = query(
    collection(getFirebaseDb(), 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { read: true })));
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export async function logAuditEvent(data: Omit<AuditLog, 'id'>): Promise<void> {
  await addDoc(collection(getFirebaseDb(), 'audit_logs'), data);
}

export async function getAuditLogs(limit_n = 100): Promise<AuditLog[]> {
  const q = query(
    collection(getFirebaseDb(), 'audit_logs'),
    orderBy('createdAt', 'desc'),
    limit(limit_n)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog));
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export async function createAppointment(data: Omit<Appointment, 'id'>): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), 'appointments'), data);
  return ref.id;
}

export async function getAppointmentsByClinic(clinicId: string): Promise<Appointment[]> {
  const q = query(collection(getFirebaseDb(), 'appointments'), where('clinicId', '==', clinicId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Appointment))
    .sort((a, b) => (a.date + a.time) > (b.date + b.time) ? -1 : 1);
}

export async function getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
  const q = query(collection(getFirebaseDb(), 'appointments'), where('patientId', '==', patientId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Appointment))
    .sort((a, b) => (a.date + a.time) > (b.date + b.time) ? -1 : 1);
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: Appointment['status'],
  notes?: string
): Promise<void> {
  const updates: Record<string, string> = { status, updatedAt: new Date().toISOString() };
  if (notes !== undefined) updates.notes = notes;
  await updateDoc(doc(getFirebaseDb(), 'appointments', appointmentId), updates);
}

export async function deleteAppointment(appointmentId: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), 'appointments', appointmentId));
}

// ─── Patient Satisfaction Surveys ─────────────────────────────────────────────

export async function createSurvey(data: Omit<Survey, 'id'>): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), 'surveys'), data);
  return ref.id;
}

export async function getSurveysByClinic(clinicId: string): Promise<Survey[]> {
  const q = query(collection(getFirebaseDb(), 'surveys'), where('clinicId', '==', clinicId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Survey))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getSurveysByPatient(patientId: string): Promise<Survey[]> {
  const q = query(collection(getFirebaseDb(), 'surveys'), where('patientId', '==', patientId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Survey))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAllSurveys(): Promise<Survey[]> {
  const snap = await getDocs(collection(getFirebaseDb(), 'surveys'));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Survey))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ─── Staff Management ─────────────────────────────────────────────────────────

export async function getStaff(clinicId: string): Promise<StaffMember[]> {
  const q = query(collection(getFirebaseDb(), 'staff'), where('clinicId', '==', clinicId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StaffMember))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export async function createStaffMember(data: Omit<StaffMember, 'id'>): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), 'staff'), data);
  return ref.id;
}

export async function updateStaffMember(id: string, data: Partial<StaffMember>): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'staff', id), data as Record<string, unknown>);
}

export async function deleteStaffMember(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), 'staff', id));
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export async function getInventory(clinicId: string): Promise<InventoryItem[]> {
  const q = query(collection(getFirebaseDb(), 'inventory'), where('clinicId', '==', clinicId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryItem))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function createInventoryItem(data: Omit<InventoryItem, 'id'>): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), 'inventory'), data);
  return ref.id;
}

export async function updateInventoryItem(id: string, data: Partial<InventoryItem>): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'inventory', id), data as Record<string, unknown>);
}

export async function deleteInventoryItem(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), 'inventory', id));
}

// ─── Referrals ────────────────────────────────────────────────────────────────

export async function getReferralsByClinic(clinicId: string): Promise<Referral[]> {
  const q = query(collection(getFirebaseDb(), 'referrals'), where('fromClinicId', '==', clinicId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Referral))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createReferral(data: Omit<Referral, 'id'>): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), 'referrals'), data);
  return ref.id;
}

export async function updateReferralStatus(id: string, status: Referral['status']): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'referrals', id), { status });
}

// ─── Complaints ───────────────────────────────────────────────────────────────

export async function getComplaintsByClinic(clinicId: string): Promise<Complaint[]> {
  const q = query(collection(getFirebaseDb(), 'complaints'), where('clinicId', '==', clinicId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Complaint))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAllComplaints(): Promise<Complaint[]> {
  const snap = await getDocs(collection(getFirebaseDb(), 'complaints'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Complaint))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createComplaint(data: Omit<Complaint, 'id'>): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), 'complaints'), data);
  return ref.id;
}

export async function updateComplaintStatus(id: string, status: Complaint['status'], resolution?: string): Promise<void> {
  const updates: Record<string, string> = { status };
  if (resolution) { updates.resolution = resolution; updates.resolvedAt = new Date().toISOString(); }
  await updateDoc(doc(getFirebaseDb(), 'complaints', id), updates);
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function getMessagesByUser(userId: string): Promise<Message[]> {
  const q = query(collection(getFirebaseDb(), 'messages'), where('toUserId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getSentMessagesByUser(userId: string): Promise<Message[]> {
  const q = query(collection(getFirebaseDb(), 'messages'), where('fromUserId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function sendMessage(data: Omit<Message, 'id'>): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), 'messages'), data);
  return ref.id;
}

export async function markMessageRead(id: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'messages', id), { read: true });
}

// ─── Equipment ────────────────────────────────────────────────────────────────

export async function getEquipment(clinicId: string): Promise<Equipment[]> {
  const q = query(collection(getFirebaseDb(), 'equipment'), where('clinicId', '==', clinicId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Equipment))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function createEquipment(data: Omit<Equipment, 'id'>): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), 'equipment'), data);
  return ref.id;
}

export async function updateEquipment(id: string, data: Partial<Equipment>): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'equipment', id), data as Record<string, unknown>);
}

export async function deleteEquipment(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), 'equipment', id));
}

// ─── Clinic Events / Calendar ─────────────────────────────────────────────────

export async function getEventsByClinic(clinicId: string): Promise<ClinicEvent[]> {
  const q = query(collection(getFirebaseDb(), 'clinic_events'), where('clinicId', '==', clinicId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClinicEvent))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getAllEvents(): Promise<ClinicEvent[]> {
  const snap = await getDocs(collection(getFirebaseDb(), 'clinic_events'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClinicEvent))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function createEvent(data: Omit<ClinicEvent, 'id'>): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), 'clinic_events'), data);
  return ref.id;
}

export async function deleteEvent(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), 'clinic_events', id));
}

// ─── Announcements ────────────────────────────────────────────────────────────

export async function getAnnouncementsByClinic(clinicId: string): Promise<Announcement[]> {
  const q = query(collection(getFirebaseDb(), 'announcements'), where('clinicId', '==', clinicId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAllAnnouncements(): Promise<Announcement[]> {
  const snap = await getDocs(collection(getFirebaseDb(), 'announcements'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createAnnouncement(data: Omit<Announcement, 'id'>): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), 'announcements'), data);
  return ref.id;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), 'announcements', id));
}

// ─── Vaccinations ─────────────────────────────────────────────────────────────

export async function getVaccinationsByPatient(patientId: string): Promise<VaccinationRecord[]> {
  const q = query(collection(getFirebaseDb(), 'vaccinations'), where('patientId', '==', patientId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as VaccinationRecord))
    .sort((a, b) => b.dateGiven.localeCompare(a.dateGiven));
}

export async function getVaccinationsByClinic(clinicId: string): Promise<VaccinationRecord[]> {
  const q = query(collection(getFirebaseDb(), 'vaccinations'), where('clinicId', '==', clinicId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as VaccinationRecord))
    .sort((a, b) => b.dateGiven.localeCompare(a.dateGiven));
}

export async function createVaccination(data: Omit<VaccinationRecord, 'id'>): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), 'vaccinations'), data);
  return ref.id;
}

// ─── Shifts ───────────────────────────────────────────────────────────────────

export async function getShiftsByClinic(clinicId: string): Promise<Shift[]> {
  const q = query(collection(getFirebaseDb(), 'shifts'), where('clinicId', '==', clinicId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shift))
    .sort((a, b) => (a.date + a.startTime) > (b.date + b.startTime) ? -1 : 1);
}

export async function createShift(data: Omit<Shift, 'id'>): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), 'shifts'), data);
  return ref.id;
}

export async function deleteShift(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), 'shifts', id));
}

// Re-export serverTimestamp for convenience
export { serverTimestamp };
