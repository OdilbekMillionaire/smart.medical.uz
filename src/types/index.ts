export type UserRole = 'admin' | 'clinic' | 'doctor' | 'patient';

export interface BaseUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  profileComplete: boolean;
  createdAt: string;
  photoURL?: string;
}

export interface ClinicUser extends BaseUser {
  clinicName: string;
  licenseNumber: string;
  licenseExpiry: string;
  address: string;
  region: string;
  district: string;
  specialties: string[];
  doctorCount: number;
  nurseCount: number;
  adminCount: number;
  contactPerson: string;
  phone: string;
  documents: {
    license: string;
    sanCert: string;
  };
  // Map coordinates — set by clinic in their profile
  lat?: number;
  lng?: number;
  locationPinned?: boolean; // true = exact location set, false = approximate
}

export interface DoctorUser extends BaseUser {
  fullName: string;
  specialization: string;
  category: 'first' | 'second' | 'highest';
  diplomaNumber: string;
  institution: string;
  certExpiry: string;
  linkedClinicId?: string;
  phone: string;
  documents: {
    diploma: string;
    certificate: string;
    license: string;
  };
}

export interface PatientUser extends BaseUser {
  fullName: string;
  dob: string;
  gender: string;
  phone: string;
  bloodType?: string;
  conditions?: string[];
  allergies?: string[];
}

export interface Document {
  id: string;
  ownerId: string;
  ownerType: string;
  clinicId?: string;
  title: string;
  type: string;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected';
  content: string;
  storageUrl?: string;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewNote?: string;
}

export interface ComplianceItem {
  id: string;
  clinicId: string;
  type: 'license' | 'certification' | 'contract' | 'protocol';
  title: string;
  dueDate: string;
  status: 'upcoming' | 'overdue' | 'done';
  reminderSent: boolean;
  autoDraftDocId?: string;
}

export interface Request {
  id: string;
  fromUserId: string;
  toClinicId?: string;
  toAdminId?: string;
  subject: string;
  body: string;
  aiClassification?: string;
  assignedTo?: string;
  status: 'received' | 'in_review' | 'replied' | 'closed';
  draftReplyId?: string;
  createdAt: string;
}

export interface CleaningLog {
  task: string;
  completedAt: string;
  completedBy: string;
}

export interface ERPRecord {
  id: string;
  clinicId: string;
  patientId: string;
  visitDate: string;
  diagnosis: string;
  prescriptions: string[];
  procedures: string[];
  nextVisit?: string;
  assignedDoctorId: string;
  cleaningLogs: CleaningLog[];
}

export interface InspectionItem {
  label: string;
  status: 'pass' | 'fail' | 'warning';
  riskLevel: 'high' | 'medium' | 'low';
}

export interface InspectionRecord {
  id: string;
  clinicId: string;
  checklistType: 'sanitation' | 'licensing' | 'documentation' | 'staff';
  items: InspectionItem[];
  overallRisk: 'high' | 'medium' | 'low';
  recommendations: string[];
  generatedDocIds: string[];
  createdAt: string;
}

export interface RAGQuery {
  id: string;
  userId: string;
  userRole: UserRole;
  question: string;
  answer: string;
  sources: string[];
  createdAt: string;
}

// ─── Forum ────────────────────────────────────────────────────────────────────
export interface ForumPost {
  id: string;
  title: string;
  body: string;
  category: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  replies: number;
  views: number;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
}

export interface ForumReply {
  id: string;
  postId: string;
  body: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  createdAt: string;
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────
export interface JobListing {
  id: string;
  title: string;
  clinicId: string;
  clinicName: string;
  location: string;
  region: string;
  salary: string;
  description: string;
  requirements: string;
  badges: string[];
  status: 'active' | 'closed';
  createdAt: string;
  expiresAt?: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  applicantId: string;
  applicantName: string;
  applicantRole: UserRole;
  message: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  createdAt: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────
export interface AppNotification {
  id: string;
  userId: string;
  type: 'document_approved' | 'document_rejected' | 'new_request' | 'request_replied' | 'compliance_due' | 'job_application' | 'forum_reply';
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────
export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userRole: UserRole;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: string;
  createdAt: string;
}

// ─── Appointment Booking ──────────────────────────────────────────────────────
export interface Appointment {
  id: string;
  clinicId: string;
  clinicName: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId?: string;
  doctorName?: string;
  date: string;       // ISO date: YYYY-MM-DD
  time: string;       // HH:MM
  reason: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'done';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Patient Satisfaction Survey ──────────────────────────────────────────────
export interface Survey {
  id: string;
  clinicId: string;
  patientId: string;
  patientName: string;
  visitDate?: string;
  ratings: {
    overall: number;   // 1-5
    staff: number;
    cleanliness: number;
    speed: number;
  };
  comment: string;
  wouldRecommend: boolean;
  createdAt: string;
}

// ─── Staff Member ─────────────────────────────────────────────────────────────
export interface StaffMember {
  id: string;
  clinicId: string;
  fullName: string;
  role: string;          // e.g. "Shifokor", "Hamshira", "Registrator"
  specialization?: string;
  phone: string;
  email?: string;
  hireDate: string;
  salary?: number;
  status: 'active' | 'leave' | 'dismissed';
  createdAt: string;
}

// ─── Inventory Item ───────────────────────────────────────────────────────────
export interface InventoryItem {
  id: string;
  clinicId: string;
  name: string;
  category: 'medicine' | 'equipment' | 'consumable' | 'reagent';
  unit: string;          // "dona", "ml", "mg", "kg"
  quantity: number;
  minQuantity: number;   // alert threshold
  expiryDate?: string;
  supplier?: string;
  price?: number;
  updatedAt: string;
  createdAt: string;
}

// ─── Referral ─────────────────────────────────────────────────────────────────
export interface Referral {
  id: string;
  fromClinicId: string;
  fromClinicName: string;
  toClinicName: string;
  patientName: string;
  patientDob?: string;
  diagnosis: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  doctorName: string;
  notes?: string;
  status: 'sent' | 'received' | 'completed';
  createdAt: string;
}

// ─── Complaint ────────────────────────────────────────────────────────────────
export interface Complaint {
  id: string;
  clinicId: string;
  complainantName: string;
  complainantPhone?: string;
  subject: string;
  description: string;
  category: 'service' | 'staff' | 'billing' | 'facility' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

// ─── Message ──────────────────────────────────────────────────────────────────
export interface Message {
  id: string;
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  subject: string;
  body: string;
  read: boolean;
  createdAt: string;
}

// ─── Equipment ────────────────────────────────────────────────────────────────
export interface Equipment {
  id: string;
  clinicId: string;
  name: string;
  model: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  lastService?: string;
  nextService?: string;
  status: 'operational' | 'maintenance' | 'broken' | 'decommissioned';
  location: string;
  notes?: string;
  createdAt: string;
}

// ─── Clinic Event / Calendar ──────────────────────────────────────────────────
export interface ClinicEvent {
  id: string;
  clinicId: string;
  title: string;
  description?: string;
  type: 'training' | 'conference' | 'inspection' | 'meeting' | 'other';
  date: string;
  endDate?: string;
  location?: string;
  organizer?: string;
  attendees?: string[];
  createdAt: string;
}

// ─── Announcement ─────────────────────────────────────────────────────────────
export interface Announcement {
  id: string;
  clinicId: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  priority: 'normal' | 'important' | 'urgent';
  pinned: boolean;
  targetRole?: string;   // 'all' | 'doctor' | 'patient'
  createdAt: string;
  expiresAt?: string;
}

// ─── Vaccination Record ───────────────────────────────────────────────────────
export interface VaccinationRecord {
  id: string;
  patientId: string;
  clinicId: string;
  patientName: string;
  vaccineName: string;
  doseNumber: number;
  dateGiven: string;
  nextDoseDate?: string;
  batchNumber?: string;
  administeredBy?: string;
  notes?: string;
  createdAt: string;
}

// ─── Drug Formulary ───────────────────────────────────────────────────────────
export interface DrugTranslation {
  indications: string;
  contraindications: string;
  sideEffects: string;
  mechanism?: string;
  dosageNote?: string;
}

export interface DrugSource {
  label: string;
  url: string;
}

export interface Drug {
  id: string;
  inn: string;
  brandNames: string[];
  category: string;
  atcCode?: string;
  forms: string[];
  dosage: string;
  rx: boolean;
  isEssentialWHO?: boolean;
  pregnancyCategory?: string;
  renalNote?: string;
  hepaticNote?: string;
  imageUrl?: string;
  sources: DrugSource[];
  translations: {
    en: DrugTranslation;
    uz: DrugTranslation;
    ru: DrugTranslation;
    uz_cyrillic?: DrugTranslation;
    kk?: DrugTranslation;
  };
  // For custom drugs added by clinic/doctor
  addedBy?: string;
  addedByName?: string;
  addedByRole?: UserRole;
  clinicId?: string;
  isCustom?: boolean;
  labels?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// ─── Shift ────────────────────────────────────────────────────────────────────
export interface Shift {
  id: string;
  clinicId: string;
  staffId: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  role: string;
  notes?: string;
  createdAt: string;
}
