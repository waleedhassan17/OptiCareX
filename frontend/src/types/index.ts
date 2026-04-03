// ------------------------------------------------------------------ //
// Enums (const objects for erasableSyntaxOnly compatibility)           //
// ------------------------------------------------------------------ //

export const UserRole = {
  SuperAdmin: 'super_admin',
  OrgAdmin: 'org_admin',
  Technician: 'technician',
  Clinician: 'clinician',
  Coordinator: 'coordinator',
  Patient: 'patient',
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export type CaseStatus =
  | 'draft'
  | 'submitted'
  | 'inference_running'
  | 'inference_complete'
  | 'needs_review'
  | 'confirmed'
  | 'referral_created'
  | 'followup_scheduled'
  | 'closed'

export const ImageQuality = {
  Good: 'good',
  Acceptable: 'acceptable',
  Poor: 'poor',
  Rejected: 'rejected',
} as const
export type ImageQuality = (typeof ImageQuality)[keyof typeof ImageQuality]

export const InferenceStatus = {
  Pending: 'pending',
  Running: 'running',
  Completed: 'completed',
  Failed: 'failed',
} as const
export type InferenceStatus = (typeof InferenceStatus)[keyof typeof InferenceStatus]

export const ReferralStatus = {
  Pending: 'pending',
  Accepted: 'accepted',
  Declined: 'declined',
  Completed: 'completed',
} as const
export type ReferralStatus = (typeof ReferralStatus)[keyof typeof ReferralStatus]

export const TaskStatus = {
  Open: 'open',
  InProgress: 'in_progress',
  Completed: 'completed',
  Cancelled: 'cancelled',
} as const
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus]

export const Severity = {
  Normal: 'normal',
  Mild: 'mild',
  Moderate: 'moderate',
  Severe: 'severe',
  Critical: 'critical',
} as const
export type Severity = (typeof Severity)[keyof typeof Severity]

export const Laterality = {
  Left: 'left',
  Right: 'right',
  Both: 'both',
} as const
export type Laterality = (typeof Laterality)[keyof typeof Laterality]

export const EyeSide = {
  OD: 'OD',
  OS: 'OS',
} as const
export type EyeSide = (typeof EyeSide)[keyof typeof EyeSide]

// ------------------------------------------------------------------ //
// Core Models                                                         //
// ------------------------------------------------------------------ //

export interface Organization {
  id: string
  name: string
  slug: string
  logoUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Site {
  id: string
  orgId: string
  name: string
  address?: string
  isActive: boolean
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  orgId: string
  siteId?: string
  phone?: string
  avatarUrl?: string
  isActive: boolean
  createdAt: string
}

export interface Device {
  id: string
  orgId: string
  siteId: string
  name: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  isActive: boolean
}

export interface ReferralDestination {
  id: string
  orgId: string
  name: string
  address?: string
  contactEmail?: string
  contactPhone?: string
}

export interface Protocol {
  id: string
  orgId: string
  name: string
  description?: string
  steps: string[]
  isActive: boolean
}

// ------------------------------------------------------------------ //
// Case & Clinical                                                     //
// ------------------------------------------------------------------ //

export interface Patient {
  id: string
  orgId: string
  externalId?: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender?: string
  email?: string
  phone?: string
}

export interface Case {
  id: string
  orgId: string
  patientId: string
  patient?: Patient
  status: CaseStatus
  laterality: Laterality
  chiefComplaint?: string
  notes?: string
  createdById: string
  assignedClinicianId?: string
  siteId?: string
  createdAt: string
  updatedAt: string
}

export interface CaseImage {
  id: string
  caseId: string
  eyeSide: EyeSide
  imageUrl: string
  thumbnailUrl?: string
  quality?: ImageQuality
  capturedAt?: string
  deviceId?: string
  metadata?: Record<string, unknown>
}

export interface InferenceResult {
  id: string
  caseId: string
  imageId: string
  status: InferenceStatus
  modelName?: string
  modelVersion?: string
  predictions: Record<string, unknown>
  confidenceScore?: number
  heatmapUrl?: string
  processedAt?: string
  errorMessage?: string
}

export interface ClinicalReview {
  id: string
  caseId: string
  clinicianId: string
  clinician?: User
  diagnosis?: string
  severity?: Severity
  notes?: string
  agreesWithAi?: boolean
  reviewedAt: string
}

export interface Task {
  id: string
  orgId: string
  caseId?: string
  assigneeId?: string
  title: string
  description?: string
  status: TaskStatus
  dueDate?: string
  createdAt: string
}

export interface Referral {
  id: string
  caseId: string
  destinationId: string
  destination?: ReferralDestination
  status: ReferralStatus
  reason?: string
  urgency?: Severity
  referredById: string
  createdAt: string
}

export interface FollowUp {
  id: string
  caseId: string
  patientId: string
  scheduledDate: string
  completedDate?: string
  notes?: string
  createdById: string
}

// ------------------------------------------------------------------ //
// Platform                                                            //
// ------------------------------------------------------------------ //

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  isRead: boolean
  link?: string
  createdAt: string
}

export interface AuditLog {
  id: string
  userId?: string
  orgId?: string
  method: string
  endpoint: string
  statusCode: number
  ipAddress?: string
  createdAt: string
}

export interface Plan {
  id: string
  name: string
  maxUsers: number
  maxCasesPerMonth: number
  features: string[]
  priceMonthly: number
  priceAnnual: number
  isActive: boolean
}

export interface UsageMetrics {
  orgId: string
  period: string
  totalCases: number
  totalInferences: number
  totalReviews: number
  totalReferrals: number
  activeUsers: number
  storageUsedMb: number
}

// ------------------------------------------------------------------ //
// API helpers                                                         //
// ------------------------------------------------------------------ //

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ApiError {
  detail?: string
  message?: string
  errors?: Record<string, string[]>
}
