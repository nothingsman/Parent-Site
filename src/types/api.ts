// Standard response envelope
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    requestId?: string;
    timestamp?: string;
  };
}

// Paginated list wrapper
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

// Typed error class
export class ApiError extends Error {
  constructor(
    public readonly errorCode: string,
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Well-known error codes
export const API_ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

// Request/response shapes for endpoints not covered by existing types
export interface CompleteInvitationRequest {
  uid: string;
  token: string;
  new_password: string;
  invitation_verification_token: string;
}

export interface OtpRequest {
  phone_number: string;
}

export interface InvitationOtpRequest {
  uid: string;
  token: string;
}

export interface InvitationOtpVerifyRequest {
  uid: string;
  token: string;
  otp_code: string;
}

export interface PasswordLoginRequest {
  phone_number: string;
  password: string;
}

export interface JwtLoginResponse {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  parentId: string;
  parentName: string;
}

export interface ParentMeResponse {
  id: string;
  user: string;
  organizations: string[];
  branches: string[];
  secondary_phone_number: string;
  occupation: string;
  work_address: string;
  relationship_notes: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  organization_ids: string[];
  branch_ids: string[];
  user_details: {
    id: string;
    name: string;
    father_name?: string;
    grandfather_name?: string;
    phone_number: string;
    email?: string | null;
    address?: string;
    role?: string;
    verified_at?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  organization_details: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  branch_details: Array<{
    id: string;
    name: string;
    organization: string;
    status: string;
  }>;
  student_details: Array<{
    id: string;
    first_name: string;
    last_name: string;
    roll_no: string;
    branch: string;
    organization: string;
    relationship_type: string;
    is_primary_contact: boolean;
  }>;
}

export interface UserMeResponse {
  id: string;
  name: string;
  phone_number?: string;
  email?: string | null;
}

export interface ParentStudent {
  id: string;
  first_name: string;
  last_name: string;
  section_name: string;
  current_section: string | null;
  grade_name: string;
  branch: string;
  branch_name: string;
}

export interface BranchIdentityResponse {
  branch_id: string;
  branch_name: string;
  school_id: string;
  school_name: string;
  logo?: string;
}

export interface SectionTeacherAssignment {
  id: string;
  section_name: string;
  academic_year_name: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  grade_name: string;
  teacher_id: string;
  teacher_name: string;
  teacher_employee_id: string;
  teacher_specialization: string;
}

export interface RefreshRequest {
  // Refresh token is sent via HttpOnly cookie; no body field needed
}

export interface RefreshResponse {
  access: string;
}

export interface LogAbsenceRequest {
  date: string;           // ISO 8601 date string, e.g. "2025-06-03"
  reason?: string;
  note?: string;
}

export interface SendMessageRequest {
  text: string;
}

export interface AttendanceReasonEntry {
  id: string;
  attendance: string;
  reason_category: string;
  reason_category_display?: string;
  note: string;
  parent_confirmed: boolean;
  confirmed_at?: string | null;
  confirmed_by_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceRecordEntry {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  statusDisplay: string;
  remarks: string;
  needsReason: boolean;
  studentName: string;
  studentRollNo: string;
  sectionName: string;
  gradeName: string;
  academicYearName: string;
  branchName: string;
  recordedByName: string | null;
  reason: AttendanceReasonEntry | null;
}

export interface AttendanceSummaryEntry {
  id: string;
  student: string;
  studentName: string;
  academicYear: string;
  academicYearName: string;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalExcused: number;
  totalSchoolDays: number;
  attendanceRate: number;
  lastUpdated: string;
}

export interface AttendanceSummaryMetrics {
  termAttendance: number;
  daysPresent: number;
  totalDays: number;
  absences: number;
  lates: number;
  excused: number;
  pendingReasons: number;
  unexcusedAbsences: number;
  policyStanding: 'On Track' | 'Watch' | 'Action Needed';
}

export interface AttendanceResponse {
  summary: AttendanceSummaryMetrics;
  records: AttendanceRecordEntry[];
  reasons: AttendanceReasonEntry[];
}

export interface StudentInsightDetail {
  id: string;
  student: string;
  category: string;
  category_display: string;
  risk_band: string;
  risk_band_display: string;
  title: string;
  message: string;
  confidence_label: string;
  recommended_actions: string[];
  safety_status: string;
  safety_status_display: string;
  delivery_status: string;
  created_at: string;
  delivered_at: string | null;
}

export interface GradesResponse {
  subjects: import('./child').Subject[];
  overallAvg: number;
}

export interface MediaFileResponse {
  id: string;
  key: string;
  bucket: string;
  file_name: string;
  content_type: string;
  size: number | null;
  etag: string | null;
  status: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  download_url: string | null;
}

export interface CalendarDocumentResponse {
  id: string;
  organization: string;
  branch: string;
  academic_year: string | null;
  media_file: string | null;
  file_name: string | null;
  created_at: string;
  updated_at: string;
}
