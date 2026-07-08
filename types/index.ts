// Central TypeScript types for Sa Green School Management System (v2.0 Schema)

export type UserRole =
  | "administrator"
  | "director"
  | "deputy_director"
  | "building_supervisor"
  | "grade_supervisor"
  | "homeroom_teacher"
  | "student_council"
  | "class_representative"
  | "student"
  | "guest";

export type EvaluationStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "acknowledged";

export type ScoreGrade = "gold" | "silver" | "bronze" | "pass" | "fail";

export type NotificationChannel = "in_app" | "line" | "email" | "push";

export type NotificationEvent = 
  | "evaluation_submitted"
  | "evaluation_approved"
  | "evaluation_rejected"
  | "evaluation_acknowledged"
  | "ranking_changed"
  | "certificate_issued"
  | "certificate_revoked"
  | "water_bottle_submitted"
  | "water_bottle_acknowledged"
  | "announcement"
  | "system_alert";

export type RoomType = "classroom" | "lab" | "office" | "library" | "gym" | "canteen" | "common";

export type EvalModule = "area" | "classroom";

export type Gender = "male" | "female" | "other";

export type CertificateType = "semester_achievement" | "special_award" | "participation";

export type Semester = "1" | "2";

// ── Academic Structure ─────────────────────────────────────────

export interface AcademicYear {
  id: string;
  year: number; // e.g. 2567 (Buddhist calendar)
  year_ce: number; // e.g. 2024
  label?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SemesterRecord {
  id: string;
  academic_year_id: string;
  semester: Semester;
  label?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface Building {
  id: string;
  name: string;
  name_en?: string;
  code: string;
  description?: string;
  image_url?: string;
  total_floors: number;
  supervisor_id?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Floor {
  id: string;
  building_id: string;
  floor_number: number;
  name: string;
  description?: string;
}

export interface Room {
  id: string;
  floor_id: string;
  building_id: string;
  room_number: string;
  name: string;
  type: RoomType;
  capacity: number;
  description?: string;
  is_active: boolean;
}

export interface Homeroom {
  id: string;
  academic_year_id: string;
  room_id?: string;
  grade_level: number; // 1-6 (ม.1-ม.6)
  class_number: number;
  class_name: string; // e.g. "ม.1/1"
  student_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── User / Profile ─────────────────────────────────────────────

export interface Profile {
  id: string; // matches auth.users.id
  email: string;
  full_name: string;
  full_name_en?: string;
  nickname?: string;
  avatar_url?: string;
  phone?: string;
  employee_id?: string;
  role: UserRole;
  homeroom_id?: string;
  building_id?: string;
  grade_level?: number;
  line_user_id?: string;
  line_notify_token?: string;
  push_token?: string;
  is_active: boolean;
  last_seen_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  profile_id?: string;
  homeroom_id: string;
  student_number?: string;
  national_id?: string;
  prefix?: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  nickname?: string;
  gender?: Gender;
  date_of_birth?: string;
  parent_name?: string;
  parent_phone?: string;
  address?: string;
  is_active: boolean;
  left_at?: string;
  left_reason?: string;
  created_at: string;
  updated_at: string;
}

// ── Module A & B: Shared Criteria ──────────────────────────────

export interface EvaluationCriteria {
  id: string;
  module: EvalModule;
  name: string;
  description?: string;
  max_score: number;
  weight: number;
  sort_order: number;
  is_required: boolean;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EvaluationPhoto {
  id: string;
  evaluation_id: string;
  evaluation_type: EvalModule;
  storage_path: string;
  public_url: string;
  thumbnail_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  caption?: string;
  sort_order: number;
  uploaded_by: string;
  created_at: string;
}

// ── Module A: Responsible Area Evaluation ──────────────────────

export interface ResponsibleArea {
  id: string;
  name: string;
  description?: string;
  homeroom_id: string;
  building_id: string;
  floor_id?: string;
  location_description?: string;
  qr_code_data?: string;
  image_url?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AreaEvaluation {
  id: string;
  responsible_area_id: string;
  semester_id: string;
  evaluator_id: string; // class representative
  approver_id?: string; // homeroom teacher
  status: EvaluationStatus;
  total_score: number;
  max_score: number;
  percentage: number;
  grade: ScoreGrade;
  evaluator_notes?: string;
  approver_notes?: string;
  rejection_reason?: string;
  evaluated_at: string;
  submitted_at?: string;
  approved_at?: string;
  rejected_at?: string;
  created_at: string;
  updated_at: string;
  
  // View/Joins
  responsible_area?: ResponsibleArea;
  evaluator?: Profile;
  approver?: Profile;
  photos?: EvaluationPhoto[];
  items?: AreaEvaluationItem[];
}

export interface AreaEvaluationItem {
  id: string;
  area_evaluation_id: string;
  criteria_id: string;
  score: number;
  max_score: number;
  notes?: string;
}

// ── Module B: Classroom Cleanliness ───────────────────────────

export interface ClassroomEvaluation {
  id: string;
  room_id: string;
  homeroom_id?: string;
  semester_id: string;
  evaluator_id: string; // student council
  approver_id?: string; // building supervisor
  eval_week?: number;
  eval_round: number;
  status: EvaluationStatus;
  total_score: number;
  max_score: number;
  percentage: number;
  grade: ScoreGrade;
  evaluator_notes?: string;
  approver_notes?: string;
  rejection_reason?: string;
  evaluated_at: string;
  submitted_at?: string;
  approved_at?: string;
  rejected_at?: string;
  created_at: string;
  updated_at: string;

  // View/Joins
  room?: Room;
  evaluator?: Profile;
  approver?: Profile;
  photos?: EvaluationPhoto[];
  items?: ClassroomEvaluationItem[];
}

export interface ClassroomEvaluationItem {
  id: string;
  classroom_evaluation_id: string;
  criteria_id: string;
  score: number;
  max_score: number;
  notes?: string;
}

// ── Module C: Water Bottle Tracking ───────────────────────────

export interface WaterBottleRecord {
  id: string;
  homeroom_id: string;
  semester_id: string;
  teacher_id: string; 
  acknowledger_id?: string;
  check_date: string;
  check_period: "morning" | "afternoon" | "all_day";
  total_students: number;
  students_present: number;
  students_with_bottle: number;
  students_absent?: number;
  percentage: number;
  grade: ScoreGrade;
  status: EvaluationStatus;
  teacher_notes?: string;
  acknowledger_notes?: string;
  submitted_at?: string;
  acknowledged_at?: string;
  created_at: string;
  updated_at: string;

  // Joins
  homeroom?: Homeroom;
  teacher?: Profile;
}

export interface StudentWaterBottleStatus {
  id: string;
  water_bottle_record_id: string;
  student_id: string;
  has_bottle: boolean;
  is_absent: boolean;
  notes?: string;
}

// ── Module D: Dashboard & Scores ──────────────────────────────

export interface HomeroomSemesterScore {
  id: string;
  homeroom_id: string;
  semester_id: string;
  area_score: number;
  area_evals_count: number;
  classroom_score: number;
  classroom_evals_count: number;
  water_score: number;
  water_checks_count: number;
  total_score: number;
  grade: ScoreGrade;
  rank_in_school?: number;
  rank_in_building?: number;
  rank_in_grade?: number;
  prev_total_score?: number;
  score_change?: number;
  calculated_at: string;
}

// ── Module F: Certificates ────────────────────────────────────

export interface Certificate {
  id: string;
  homeroom_id: string;
  semester_id: string;
  template_id?: string;
  type: CertificateType;
  grade: ScoreGrade;
  area_score?: number;
  classroom_score?: number;
  water_score?: number;
  total_score: number;
  issued_at: string;
  issued_by: string;
  certificate_no: string;
  qr_code_data: string;
  verify_url?: string;
  pdf_url?: string;
  pdf_generated_at?: string;
  is_revoked: boolean;
  revoked_at?: string;
  revoked_by?: string;
  revoke_reason?: string;
  created_at: string;
}

// ── Module G: Notifications ───────────────────────────────────

export interface AppNotification {
  id: string;
  recipient_id: string;
  sender_id?: string;
  title: string;
  body: string;
  icon?: string;
  action_url?: string;
  event: NotificationEvent;
  channel: NotificationChannel;
  entity_type?: string;
  entity_id?: string;
  is_read: boolean;
  read_at?: string;
  is_delivered: boolean;
  delivered_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ── Audit Log ─────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  user_role?: UserRole;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  changed_fields?: string[];
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  success: boolean;
  error_message?: string;
  created_at: string;
  
  // joins
  user?: Profile;
}

// ── Shared / Utility ──────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export type Theme = "light" | "dark" | "system";
