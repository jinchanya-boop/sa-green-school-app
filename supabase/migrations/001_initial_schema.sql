-- ============================================================
-- Sa Green School Management System
-- Database Schema — Version 2.0.0
-- Complete Production-Ready Migration
-- 
-- Run Order: Execute this entire file in Supabase SQL Editor
-- Target: PostgreSQL 15+ (Supabase)
-- ============================================================

-- ============================================================
-- 0. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- Full-text trigram search
CREATE EXTENSION IF NOT EXISTS "unaccent";   -- Accent-insensitive search

-- ============================================================
-- 1. CUSTOM TYPES / ENUMS
-- ============================================================

-- User roles in the system
CREATE TYPE user_role AS ENUM (
  'administrator',        -- Full system access
  'director',             -- View all reports
  'deputy_director',      -- Approve announcements, view dashboard
  'building_supervisor',  -- Approve classroom eval, view building reports
  'grade_supervisor',     -- Approve water bottle, view grade reports
  'homeroom_teacher',     -- Record water bottle, approve area eval
  'student_council',      -- Evaluate classrooms, upload photos
  'class_representative', -- Evaluate responsible areas, upload photos
  'student',              -- View achievements and ranking
  'guest'                 -- View public announcements only
);

-- Lifecycle state of all evaluation records
CREATE TYPE evaluation_status AS ENUM (
  'draft',        -- Saved but not submitted
  'submitted',    -- Awaiting approval
  'approved',     -- Approved by supervisor
  'rejected',     -- Rejected, needs revision
  'acknowledged'  -- Acknowledged (water bottle records)
);

-- Score grade levels based on percentage
CREATE TYPE score_grade AS ENUM (
  'gold',    -- >= 90%
  'silver',  -- >= 80%
  'bronze',  -- >= 70%
  'pass',    -- >= 60%
  'fail'     -- < 60%
);

-- Notification delivery channels
CREATE TYPE notification_channel AS ENUM (
  'in_app',  -- Bell icon inside the application
  'line',    -- LINE Messaging API
  'email',   -- Email via Supabase/SMTP
  'push'     -- Web Push Notification
);

-- Notification event categories
CREATE TYPE notification_event AS ENUM (
  'evaluation_submitted',
  'evaluation_approved',
  'evaluation_rejected',
  'evaluation_acknowledged',
  'ranking_changed',
  'certificate_issued',
  'certificate_revoked',
  'water_bottle_submitted',
  'water_bottle_acknowledged',
  'announcement',
  'system_alert'
);

-- Room/space types in the building
CREATE TYPE room_type AS ENUM (
  'classroom',  -- Regular homeroom
  'lab',        -- Science/computer lab
  'office',     -- Admin/teacher office
  'library',    -- Library
  'gym',        -- Gymnasium
  'canteen',    -- Canteen / cafeteria
  'common'      -- Common area / corridor
);

-- Module identifiers for shared tables (photos, criteria)
CREATE TYPE eval_module AS ENUM (
  'area',       -- Responsible area evaluation (Module A)
  'classroom'   -- Classroom cleanliness (Module B)
);

-- Gender (for student records)
CREATE TYPE gender AS ENUM ('male', 'female', 'other');

-- Certificate type
CREATE TYPE certificate_type AS ENUM (
  'semester_achievement',  -- End of semester grade
  'special_award',         -- Special recognition
  'participation'          -- Participation certificate
);

-- ============================================================
-- 2. ACADEMIC STRUCTURE TABLES
-- ============================================================

-- 2.1 Academic Years (ปีการศึกษา)
CREATE TABLE academic_years (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  year         INTEGER      NOT NULL UNIQUE,   -- Thai Buddhist Era e.g. 2567
  year_ce      INTEGER      NOT NULL,           -- Common Era e.g. 2024
  label        TEXT         GENERATED ALWAYS AS ('ปีการศึกษา ' || year::TEXT) STORED,
  is_active    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT year_range CHECK (year BETWEEN 2560 AND 2590)
);
COMMENT ON TABLE academic_years IS 'ปีการศึกษา (Buddhist Era)';

-- 2.2 Semesters (ภาคเรียน)
CREATE TABLE semesters (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  academic_year_id UUID        NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  semester         TEXT        NOT NULL CHECK (semester IN ('1', '2')),
  label            TEXT        GENERATED ALWAYS AS ('ภาคเรียนที่ ' || semester) STORED,
  start_date       DATE        NOT NULL,
  end_date         DATE        NOT NULL,
  is_active        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT semesters_unique        UNIQUE (academic_year_id, semester),
  CONSTRAINT semester_date_order     CHECK (end_date > start_date)
);
COMMENT ON TABLE semesters IS 'ภาคเรียน';

-- ============================================================
-- 3. SCHOOL PHYSICAL STRUCTURE
-- ============================================================

-- 3.1 Buildings (อาคาร)
CREATE TABLE buildings (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT         NOT NULL,
  name_en      TEXT,
  code         TEXT         NOT NULL UNIQUE,     -- Short code e.g. 'B1', 'B2'
  description  TEXT,
  image_url    TEXT,                              -- Building photo
  total_floors INTEGER      NOT NULL DEFAULT 1 CHECK (total_floors > 0),
  supervisor_id UUID,                             -- FK added after profiles
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order   INTEGER      NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE buildings IS 'อาคารเรียน';

-- 3.2 Floors (ชั้น)
CREATE TABLE floors (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  building_id    UUID        NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  floor_number   INTEGER     NOT NULL CHECK (floor_number > 0),
  name           TEXT        NOT NULL,  -- e.g. 'ชั้น 1'
  description    TEXT,
  UNIQUE (building_id, floor_number)
);
COMMENT ON TABLE floors IS 'ชั้นในอาคาร';

-- 3.3 Rooms (ห้อง)
CREATE TABLE rooms (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  floor_id     UUID        NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  building_id  UUID        NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  room_number  TEXT        NOT NULL,    -- e.g. '101', '205A'
  name         TEXT        NOT NULL,    -- e.g. 'ห้อง 101'
  type         room_type   NOT NULL DEFAULT 'classroom',
  capacity     INTEGER     DEFAULT 40,
  description  TEXT,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  UNIQUE (building_id, room_number)
);
COMMENT ON TABLE rooms IS 'ห้องเรียน/ห้องต่างๆ ในอาคาร';

-- 3.4 Homerooms (ห้องประจำชั้น)
-- Links an academic class to a physical room for a given year
CREATE TABLE homerooms (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  academic_year_id UUID        NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  room_id          UUID        REFERENCES rooms(id) ON DELETE SET NULL,
  grade_level      INTEGER     NOT NULL CHECK (grade_level BETWEEN 1 AND 6),
  class_number     INTEGER     NOT NULL CHECK (class_number > 0),
  class_name       TEXT        NOT NULL,  -- e.g. 'ม.1/1', computed by trigger
  student_count    INTEGER     NOT NULL DEFAULT 0 CHECK (student_count >= 0),
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (academic_year_id, class_name)
);
COMMENT ON TABLE homerooms IS 'ห้องประจำชั้น';

-- ============================================================
-- 4. USER PROFILES & ROLES
-- ============================================================

-- 4.1 Profiles — extends auth.users
CREATE TABLE profiles (
  id             UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email          TEXT        NOT NULL,
  full_name      TEXT        NOT NULL,
  full_name_en   TEXT,
  nickname       TEXT,
  avatar_url     TEXT,
  phone          TEXT,
  employee_id    TEXT        UNIQUE,               -- Staff ID / teacher code
  role           user_role   NOT NULL DEFAULT 'guest',
  -- Scope assignments (depends on role)
  homeroom_id    UUID        REFERENCES homerooms(id) ON DELETE SET NULL,
  building_id    UUID        REFERENCES buildings(id) ON DELETE SET NULL,
  grade_level    INTEGER     CHECK (grade_level BETWEEN 1 AND 6),
  -- External integrations
  line_user_id   TEXT,                             -- LINE userId for notifications
  line_notify_token TEXT,                          -- LINE Notify personal token
  push_token     TEXT,                             -- Web Push subscription JSON
  -- Status
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  last_seen_at   TIMESTAMPTZ,
  -- Timestamps
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE profiles IS 'โปรไฟล์ผู้ใช้งาน (ต่อจาก auth.users)';

-- 4.2 Add supervisor FK on buildings (after profiles exists)
ALTER TABLE buildings
  ADD CONSTRAINT buildings_supervisor_fk
  FOREIGN KEY (supervisor_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 4.3 Homeroom Teachers — many homerooms can have many teachers
CREATE TABLE homeroom_teachers (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  homeroom_id  UUID        NOT NULL REFERENCES homerooms(id) ON DELETE CASCADE,
  teacher_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_primary   BOOLEAN     NOT NULL DEFAULT FALSE,  -- Primary homeroom teacher
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (homeroom_id, teacher_id)
);
COMMENT ON TABLE homeroom_teachers IS 'ครูประจำชั้น (เชื่อมครูกับห้องประจำชั้น)';

-- 4.4 Grade Supervisors — which supervisor manages which grade level
CREATE TABLE grade_supervisors (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  supervisor_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  grade_level    INTEGER     NOT NULL CHECK (grade_level BETWEEN 1 AND 6),
  academic_year_id UUID      NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  assigned_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (supervisor_id, grade_level, academic_year_id)
);
COMMENT ON TABLE grade_supervisors IS 'หัวหน้าระดับชั้น';

-- ============================================================
-- 5. STUDENTS
-- ============================================================

CREATE TABLE students (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  homeroom_id    UUID        NOT NULL REFERENCES homerooms(id) ON DELETE RESTRICT,
  student_number TEXT,                              -- รหัสนักเรียน
  national_id    TEXT,                              -- เลขบัตรประชาชน (optional, sensitive)
  prefix         TEXT        CHECK (prefix IN ('เด็กชาย', 'เด็กหญิง', 'นาย', 'นางสาว')),
  first_name     TEXT        NOT NULL,
  last_name      TEXT        NOT NULL,
  full_name      TEXT        GENERATED ALWAYS AS (prefix || ' ' || first_name || ' ' || last_name) STORED,
  nickname       TEXT,
  gender         gender,
  date_of_birth  DATE,
  parent_name    TEXT,                              -- ชื่อผู้ปกครอง
  parent_phone   TEXT,
  address        TEXT,
  -- Status
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  left_at        DATE,                              -- Date student left school
  left_reason    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE students IS 'ข้อมูลนักเรียน';

-- ============================================================
-- 6. RESPONSIBLE AREAS (Module A)
-- ============================================================

-- 6.1 Evaluation Criteria (shared by Module A and B)
CREATE TABLE evaluation_criteria (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  module       eval_module  NOT NULL,
  name         TEXT         NOT NULL,
  description  TEXT,
  max_score    NUMERIC(5,2) NOT NULL DEFAULT 10 CHECK (max_score > 0),
  weight       NUMERIC(5,4) NOT NULL DEFAULT 1.0 CHECK (weight > 0),  -- For weighted scoring
  sort_order   INTEGER      NOT NULL DEFAULT 1,
  is_required  BOOLEAN      NOT NULL DEFAULT TRUE,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_by   UUID         REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE evaluation_criteria IS 'เกณฑ์การประเมิน (ใช้ร่วมกันระหว่างโมดูล A และ B)';

-- 6.2 Responsible Areas (พื้นที่รับผิดชอบ)
CREATE TABLE responsible_areas (
  id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 TEXT        NOT NULL,
  description          TEXT,
  homeroom_id          UUID        NOT NULL REFERENCES homerooms(id) ON DELETE CASCADE,
  building_id          UUID        NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  floor_id             UUID        REFERENCES floors(id) ON DELETE SET NULL,
  location_description TEXT,                           -- Detailed location text
  qr_code_data         TEXT,                           -- QR code for area identification
  image_url            TEXT,                           -- Reference photo of area
  is_active            BOOLEAN     NOT NULL DEFAULT TRUE,
  created_by           UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE responsible_areas IS 'พื้นที่รับผิดชอบของแต่ละห้องเรียน';

-- 6.3 Area Evaluations (บันทึกการประเมินพื้นที่)
CREATE TABLE area_evaluations (
  id                    UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  responsible_area_id   UUID              NOT NULL REFERENCES responsible_areas(id) ON DELETE RESTRICT,
  semester_id           UUID              NOT NULL REFERENCES semesters(id) ON DELETE RESTRICT,
  evaluator_id          UUID              NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  approver_id           UUID              REFERENCES profiles(id) ON DELETE SET NULL,
  -- Score fields
  status                evaluation_status NOT NULL DEFAULT 'draft',
  total_score           NUMERIC(6,2)      NOT NULL DEFAULT 0 CHECK (total_score >= 0),
  max_score             NUMERIC(6,2)      NOT NULL DEFAULT 0 CHECK (max_score >= 0),
  percentage            NUMERIC(5,2)      NOT NULL DEFAULT 0 CHECK (percentage BETWEEN 0 AND 100),
  grade                 score_grade,
  -- Notes
  evaluator_notes       TEXT,
  approver_notes        TEXT,
  rejection_reason      TEXT,
  -- Timestamps
  evaluated_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  submitted_at          TIMESTAMPTZ,
  approved_at           TIMESTAMPTZ,
  rejected_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE area_evaluations IS 'บันทึกการประเมินพื้นที่รับผิดชอบ (โมดูล A)';

-- 6.4 Area Evaluation Line Items
CREATE TABLE area_evaluation_items (
  id                   UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_evaluation_id   UUID         NOT NULL REFERENCES area_evaluations(id) ON DELETE CASCADE,
  criteria_id          UUID         NOT NULL REFERENCES evaluation_criteria(id) ON DELETE RESTRICT,
  score                NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (score >= 0),
  max_score            NUMERIC(5,2) NOT NULL DEFAULT 10 CHECK (max_score > 0),
  notes                TEXT,
  UNIQUE (area_evaluation_id, criteria_id)
);
COMMENT ON TABLE area_evaluation_items IS 'รายการคะแนนแต่ละเกณฑ์ของการประเมินพื้นที่';

-- ============================================================
-- 7. CLASSROOM CLEANLINESS (Module B)
-- ============================================================

-- 7.1 Classroom Evaluations
CREATE TABLE classroom_evaluations (
  id               UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id          UUID              NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  homeroom_id      UUID              REFERENCES homerooms(id) ON DELETE SET NULL,
  semester_id      UUID              NOT NULL REFERENCES semesters(id) ON DELETE RESTRICT,
  evaluator_id     UUID              NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  approver_id      UUID              REFERENCES profiles(id) ON DELETE SET NULL,
  -- Week/round tracking
  eval_week        INTEGER           CHECK (eval_week BETWEEN 1 AND 52),
  eval_round       INTEGER           NOT NULL DEFAULT 1 CHECK (eval_round > 0),
  -- Score fields
  status           evaluation_status NOT NULL DEFAULT 'draft',
  total_score      NUMERIC(6,2)      NOT NULL DEFAULT 0 CHECK (total_score >= 0),
  max_score        NUMERIC(6,2)      NOT NULL DEFAULT 0 CHECK (max_score >= 0),
  percentage       NUMERIC(5,2)      NOT NULL DEFAULT 0 CHECK (percentage BETWEEN 0 AND 100),
  grade            score_grade,
  -- Notes
  evaluator_notes  TEXT,
  approver_notes   TEXT,
  rejection_reason TEXT,
  -- Timestamps
  evaluated_at     TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  submitted_at     TIMESTAMPTZ,
  approved_at      TIMESTAMPTZ,
  rejected_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE classroom_evaluations IS 'บันทึกการประเมินความสะอาดห้องเรียน (โมดูล B)';

-- 7.2 Classroom Evaluation Line Items
CREATE TABLE classroom_evaluation_items (
  id                      UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_evaluation_id UUID         NOT NULL REFERENCES classroom_evaluations(id) ON DELETE CASCADE,
  criteria_id             UUID         NOT NULL REFERENCES evaluation_criteria(id) ON DELETE RESTRICT,
  score                   NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (score >= 0),
  max_score               NUMERIC(5,2) NOT NULL DEFAULT 10 CHECK (max_score > 0),
  notes                   TEXT,
  UNIQUE (classroom_evaluation_id, criteria_id)
);
COMMENT ON TABLE classroom_evaluation_items IS 'รายการคะแนนแต่ละเกณฑ์ของการประเมินห้องเรียน';

-- ============================================================
-- 8. EVALUATION PHOTOS (Shared)
-- ============================================================

CREATE TABLE evaluation_photos (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Polymorphic: can belong to area OR classroom evaluation
  evaluation_id   UUID         NOT NULL,
  evaluation_type eval_module  NOT NULL,
  -- Storage
  storage_path    TEXT         NOT NULL,
  public_url      TEXT         NOT NULL,
  thumbnail_url   TEXT,                          -- Generated thumbnail
  file_name       TEXT,
  file_size       BIGINT       CHECK (file_size > 0),
  mime_type       TEXT         DEFAULT 'image/jpeg',
  -- Metadata
  caption         TEXT,
  sort_order      INTEGER      NOT NULL DEFAULT 0,
  uploaded_by     UUID         NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE evaluation_photos IS 'รูปภาพประกอบการประเมิน (ใช้ร่วมกัน)';

-- ============================================================
-- 9. WATER BOTTLE TRACKING (Module C)
-- ============================================================

-- 9.1 Daily Water Bottle Check Records
CREATE TABLE water_bottle_records (
  id                    UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  homeroom_id           UUID              NOT NULL REFERENCES homerooms(id) ON DELETE RESTRICT,
  semester_id           UUID              NOT NULL REFERENCES semesters(id) ON DELETE RESTRICT,
  teacher_id            UUID              NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  acknowledger_id       UUID              REFERENCES profiles(id) ON DELETE SET NULL,
  -- Date and period
  check_date            DATE              NOT NULL,
  check_period          TEXT              DEFAULT 'morning' CHECK (check_period IN ('morning', 'afternoon', 'all_day')),
  -- Counts
  total_students        INTEGER           NOT NULL DEFAULT 0 CHECK (total_students >= 0),
  students_present      INTEGER           NOT NULL DEFAULT 0 CHECK (students_present >= 0),
  students_with_bottle  INTEGER           NOT NULL DEFAULT 0 CHECK (students_with_bottle >= 0),
  students_absent       INTEGER           GENERATED ALWAYS AS (total_students - students_present) STORED,
  -- Derived metrics
  percentage            NUMERIC(5,2)      NOT NULL DEFAULT 0 CHECK (percentage BETWEEN 0 AND 100),
  grade                 score_grade,
  -- Workflow
  status                evaluation_status NOT NULL DEFAULT 'draft',
  teacher_notes         TEXT,
  acknowledger_notes    TEXT,
  -- Timestamps
  submitted_at          TIMESTAMPTZ,
  acknowledged_at       TIMESTAMPTZ,
  created_at            TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  -- One check per class per day (can be overridden by period)
  UNIQUE (homeroom_id, check_date, check_period),
  CONSTRAINT students_with_bottle_max CHECK (students_with_bottle <= students_present),
  CONSTRAINT students_present_max     CHECK (students_present <= total_students)
);
COMMENT ON TABLE water_bottle_records IS 'บันทึกการตรวจขวดน้ำส่วนตัว (โมดูล C)';

-- 9.2 Individual Student Water Bottle Status per check
CREATE TABLE student_water_bottle_statuses (
  id                     UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  water_bottle_record_id UUID        NOT NULL REFERENCES water_bottle_records(id) ON DELETE CASCADE,
  student_id             UUID        NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  has_bottle             BOOLEAN     NOT NULL DEFAULT FALSE,
  is_absent              BOOLEAN     NOT NULL DEFAULT FALSE,
  notes                  TEXT,
  UNIQUE (water_bottle_record_id, student_id)
);
COMMENT ON TABLE student_water_bottle_statuses IS 'สถานะขวดน้ำของนักเรียนรายคน';

-- ============================================================
-- 10. CERTIFICATES (Module F)
-- ============================================================

-- 10.1 Certificate Templates
CREATE TABLE certificate_templates (
  id           UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT              NOT NULL,
  description  TEXT,
  grade        score_grade       NOT NULL,
  type         certificate_type  NOT NULL DEFAULT 'semester_achievement',
  -- Template content
  template_html TEXT,                            -- HTML template (for rendering)
  background_url TEXT,                           -- Background image
  logo_url     TEXT,
  -- Validity
  is_active    BOOLEAN           NOT NULL DEFAULT TRUE,
  created_by   UUID              REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE certificate_templates IS 'เทมเพลตเกียรติบัตร';

-- 10.2 Issued Certificates
CREATE TABLE certificates (
  id              UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- What this cert is for
  homeroom_id     UUID             NOT NULL REFERENCES homerooms(id) ON DELETE RESTRICT,
  semester_id     UUID             NOT NULL REFERENCES semesters(id) ON DELETE RESTRICT,
  template_id     UUID             REFERENCES certificate_templates(id) ON DELETE SET NULL,
  type            certificate_type NOT NULL DEFAULT 'semester_achievement',
  -- Score snapshot at time of issue
  grade           score_grade      NOT NULL,
  area_score      NUMERIC(5,2),
  classroom_score NUMERIC(5,2),
  water_score     NUMERIC(5,2),
  total_score     NUMERIC(5,2)     NOT NULL,
  -- Issue info
  issued_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  issued_by       UUID             NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  -- Verification
  certificate_no  TEXT             NOT NULL UNIQUE,  -- e.g. 'SA-2567-1-001'
  qr_code_data    TEXT             NOT NULL,
  verify_url      TEXT,
  -- File
  pdf_url         TEXT,
  pdf_generated_at TIMESTAMPTZ,
  -- Revocation
  is_revoked      BOOLEAN          NOT NULL DEFAULT FALSE,
  revoked_at      TIMESTAMPTZ,
  revoked_by      UUID             REFERENCES profiles(id) ON DELETE SET NULL,
  revoke_reason   TEXT,
  created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE certificates IS 'เกียรติบัตรที่ออกให้แก่ห้องเรียน';

-- ============================================================
-- 11. NOTIFICATIONS (Module G)
-- ============================================================

-- 11.1 Notifications
CREATE TABLE notifications (
  id            UUID                 PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id  UUID                 NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_id     UUID                 REFERENCES profiles(id) ON DELETE SET NULL,
  -- Content
  title         TEXT                 NOT NULL,
  body          TEXT                 NOT NULL,
  icon          TEXT,                              -- emoji or icon name
  action_url    TEXT,                              -- Deep link URL
  -- Categorization
  event         notification_event   NOT NULL DEFAULT 'system_alert',
  channel       notification_channel NOT NULL DEFAULT 'in_app',
  -- Related entity (polymorphic)
  entity_type   TEXT,                              -- e.g. 'area_evaluation'
  entity_id     UUID,                              -- e.g. evaluation UUID
  -- Status
  is_read       BOOLEAN              NOT NULL DEFAULT FALSE,
  read_at       TIMESTAMPTZ,
  is_delivered  BOOLEAN              NOT NULL DEFAULT FALSE,
  delivered_at  TIMESTAMPTZ,
  -- Extra data
  metadata      JSONB,
  created_at    TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE notifications IS 'การแจ้งเตือนในระบบ';

-- 11.2 Notification Preferences (per user, per event, per channel)
CREATE TABLE notification_preferences (
  id           UUID                 PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID                 NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event        notification_event   NOT NULL,
  channel      notification_channel NOT NULL,
  is_enabled   BOOLEAN              NOT NULL DEFAULT TRUE,
  updated_at   TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, event, channel)
);
COMMENT ON TABLE notification_preferences IS 'การตั้งค่าการแจ้งเตือนของผู้ใช้';

-- 11.3 Announcements (public-facing)
CREATE TABLE announcements (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT        NOT NULL,
  body          TEXT        NOT NULL,
  image_url     TEXT,
  is_published  BOOLEAN     NOT NULL DEFAULT FALSE,
  published_at  TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  author_id     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by   UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE announcements IS 'ประกาศโรงเรียน (สาธารณะ)';

-- ============================================================
-- 12. AUDIT LOG
-- ============================================================

CREATE TABLE audit_logs (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Who did it
  user_id      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  user_email   TEXT,                              -- Snapshot at time of action
  user_role    user_role,                         -- Snapshot at time of action
  -- What happened
  action       TEXT        NOT NULL,              -- 'INSERT', 'UPDATE', 'DELETE', 'LOGIN', etc.
  entity_type  TEXT        NOT NULL,              -- Table name e.g. 'area_evaluations'
  entity_id    UUID,                              -- PK of affected record
  -- Change data
  old_values   JSONB,
  new_values   JSONB,
  changed_fields TEXT[],                          -- Which columns changed
  -- Request context
  ip_address   INET,
  user_agent   TEXT,
  request_id   TEXT,                              -- Correlation ID
  -- Result
  success      BOOLEAN     NOT NULL DEFAULT TRUE,
  error_message TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE audit_logs IS 'บันทึกการตรวจสอบระบบ (Audit Trail)';

-- ============================================================
-- 13. SYSTEM SETTINGS
-- ============================================================

CREATE TABLE system_settings (
  key          TEXT         PRIMARY KEY,
  value        JSONB        NOT NULL,
  description  TEXT,
  category     TEXT         NOT NULL DEFAULT 'general',  -- group settings
  is_public    BOOLEAN      NOT NULL DEFAULT FALSE,       -- visible without auth
  updated_by   UUID         REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE system_settings IS 'การตั้งค่าระบบ';

-- ============================================================
-- 14. SCORING & RANKING SNAPSHOTS
-- ============================================================

-- Semester score summaries per homeroom (updated by trigger or cron)
CREATE TABLE homeroom_semester_scores (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  homeroom_id       UUID         NOT NULL REFERENCES homerooms(id) ON DELETE CASCADE,
  semester_id       UUID         NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
  -- Component scores
  area_score        NUMERIC(5,2) DEFAULT 0 CHECK (area_score BETWEEN 0 AND 100),
  area_evals_count  INTEGER      DEFAULT 0,
  classroom_score   NUMERIC(5,2) DEFAULT 0 CHECK (classroom_score BETWEEN 0 AND 100),
  classroom_evals_count INTEGER  DEFAULT 0,
  water_score       NUMERIC(5,2) DEFAULT 0 CHECK (water_score BETWEEN 0 AND 100),
  water_checks_count INTEGER     DEFAULT 0,
  -- Weighted combined score
  total_score       NUMERIC(5,2) DEFAULT 0 CHECK (total_score BETWEEN 0 AND 100),
  grade             score_grade,
  -- Ranking
  rank_in_school    INTEGER,
  rank_in_building  INTEGER,
  rank_in_grade     INTEGER,
  -- Trend
  prev_total_score  NUMERIC(5,2),
  score_change      NUMERIC(5,2) GENERATED ALWAYS AS (total_score - COALESCE(prev_total_score, total_score)) STORED,
  -- Snapshot time
  calculated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (homeroom_id, semester_id)
);
COMMENT ON TABLE homeroom_semester_scores IS 'คะแนนสรุปรายภาคเรียนของแต่ละห้อง (ใช้สำหรับ Dashboard และการจัดอันดับ)';

-- ============================================================
-- 15. INDEXES
-- ============================================================

-- Profiles
CREATE INDEX idx_profiles_role           ON profiles(role);
CREATE INDEX idx_profiles_homeroom       ON profiles(homeroom_id) WHERE homeroom_id IS NOT NULL;
CREATE INDEX idx_profiles_building       ON profiles(building_id) WHERE building_id IS NOT NULL;
CREATE INDEX idx_profiles_email          ON profiles(email);
CREATE INDEX idx_profiles_active         ON profiles(is_active) WHERE is_active = TRUE;

-- Students
CREATE INDEX idx_students_homeroom       ON students(homeroom_id);
CREATE INDEX idx_students_profile        ON students(profile_id) WHERE profile_id IS NOT NULL;
CREATE INDEX idx_students_active         ON students(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_students_number         ON students(student_number) WHERE student_number IS NOT NULL;
CREATE INDEX idx_students_name_trgm      ON students USING GIN (full_name gin_trgm_ops);

-- Buildings & Rooms
CREATE INDEX idx_floors_building         ON floors(building_id);
CREATE INDEX idx_rooms_floor             ON rooms(floor_id);
CREATE INDEX idx_rooms_building          ON rooms(building_id);
CREATE INDEX idx_rooms_type              ON rooms(type);
CREATE INDEX idx_homerooms_year          ON homerooms(academic_year_id);
CREATE INDEX idx_homerooms_grade         ON homerooms(grade_level);

-- Area Evaluations
CREATE INDEX idx_area_eval_area          ON area_evaluations(responsible_area_id);
CREATE INDEX idx_area_eval_semester      ON area_evaluations(semester_id);
CREATE INDEX idx_area_eval_evaluator     ON area_evaluations(evaluator_id);
CREATE INDEX idx_area_eval_approver      ON area_evaluations(approver_id) WHERE approver_id IS NOT NULL;
CREATE INDEX idx_area_eval_status        ON area_evaluations(status);
CREATE INDEX idx_area_eval_grade         ON area_evaluations(grade) WHERE grade IS NOT NULL;
CREATE INDEX idx_area_eval_created       ON area_evaluations(created_at DESC);

-- Classroom Evaluations
CREATE INDEX idx_class_eval_room         ON classroom_evaluations(room_id);
CREATE INDEX idx_class_eval_homeroom     ON classroom_evaluations(homeroom_id) WHERE homeroom_id IS NOT NULL;
CREATE INDEX idx_class_eval_semester     ON classroom_evaluations(semester_id);
CREATE INDEX idx_class_eval_evaluator    ON classroom_evaluations(evaluator_id);
CREATE INDEX idx_class_eval_approver     ON classroom_evaluations(approver_id) WHERE approver_id IS NOT NULL;
CREATE INDEX idx_class_eval_status       ON classroom_evaluations(status);
CREATE INDEX idx_class_eval_created      ON classroom_evaluations(created_at DESC);

-- Water Bottle
CREATE INDEX idx_water_homeroom          ON water_bottle_records(homeroom_id);
CREATE INDEX idx_water_semester          ON water_bottle_records(semester_id);
CREATE INDEX idx_water_teacher           ON water_bottle_records(teacher_id);
CREATE INDEX idx_water_date              ON water_bottle_records(check_date DESC);
CREATE INDEX idx_water_status            ON water_bottle_records(status);

-- Photos
CREATE INDEX idx_photos_eval             ON evaluation_photos(evaluation_id, evaluation_type);
CREATE INDEX idx_photos_uploader         ON evaluation_photos(uploaded_by);

-- Certificates
CREATE INDEX idx_certs_homeroom          ON certificates(homeroom_id);
CREATE INDEX idx_certs_semester          ON certificates(semester_id);
CREATE INDEX idx_certs_grade             ON certificates(grade);
CREATE INDEX idx_certs_no                ON certificates(certificate_no);

-- Notifications
CREATE INDEX idx_notif_recipient         ON notifications(recipient_id);
CREATE INDEX idx_notif_unread            ON notifications(recipient_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notif_event             ON notifications(event);
CREATE INDEX idx_notif_created           ON notifications(created_at DESC);
CREATE INDEX idx_notif_entity            ON notifications(entity_type, entity_id) WHERE entity_id IS NOT NULL;

-- Audit Logs
CREATE INDEX idx_audit_user              ON audit_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_entity            ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action            ON audit_logs(action);
CREATE INDEX idx_audit_created           ON audit_logs(created_at DESC);

-- Scores
CREATE INDEX idx_scores_semester         ON homeroom_semester_scores(semester_id);
CREATE INDEX idx_scores_total            ON homeroom_semester_scores(total_score DESC);
CREATE INDEX idx_scores_rank             ON homeroom_semester_scores(rank_in_school);

-- Responsible Areas
CREATE INDEX idx_resp_area_homeroom      ON responsible_areas(homeroom_id);
CREATE INDEX idx_resp_area_building      ON responsible_areas(building_id);

-- Homeroom Teachers
CREATE INDEX idx_hr_teacher_id           ON homeroom_teachers(teacher_id);
CREATE INDEX idx_hr_homeroom_id          ON homeroom_teachers(homeroom_id);

-- ============================================================
-- 16. FUNCTIONS & TRIGGERS
-- ============================================================

-- 16.1 Updated_at auto-update trigger
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_academic_years_updated_at    BEFORE UPDATE ON academic_years    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_buildings_updated_at         BEFORE UPDATE ON buildings         FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_homerooms_updated_at         BEFORE UPDATE ON homerooms         FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_profiles_updated_at          BEFORE UPDATE ON profiles          FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_students_updated_at          BEFORE UPDATE ON students          FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_criteria_updated_at          BEFORE UPDATE ON evaluation_criteria FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_resp_areas_updated_at        BEFORE UPDATE ON responsible_areas FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_area_evals_updated_at        BEFORE UPDATE ON area_evaluations  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_class_evals_updated_at       BEFORE UPDATE ON classroom_evaluations FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_water_updated_at             BEFORE UPDATE ON water_bottle_records FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_cert_templates_updated_at    BEFORE UPDATE ON certificate_templates FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_announcements_updated_at     BEFORE UPDATE ON announcements     FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_settings_updated_at          BEFORE UPDATE ON system_settings   FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- 16.2 Auto-create profile on Google/Email signup
CREATE OR REPLACE FUNCTION fn_handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(COALESCE(NEW.email, 'user'), '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    'guest'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION fn_handle_new_user();

-- 16.3 Calculate grade from percentage
CREATE OR REPLACE FUNCTION fn_calc_grade(p_percent NUMERIC)
RETURNS score_grade LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  v_gold   INTEGER;
  v_silver INTEGER;
  v_bronze INTEGER;
  v_pass   INTEGER;
BEGIN
  -- Read from settings or use defaults
  SELECT
    COALESCE((value->>'gold')::INTEGER, 90),
    COALESCE((value->>'silver')::INTEGER, 80),
    COALESCE((value->>'bronze')::INTEGER, 70),
    COALESCE((value->>'pass')::INTEGER, 60)
  INTO v_gold, v_silver, v_bronze, v_pass
  FROM system_settings WHERE key = 'grade_thresholds';

  IF v_gold IS NULL THEN
    v_gold := 90; v_silver := 80; v_bronze := 70; v_pass := 60;
  END IF;

  IF p_percent >= v_gold   THEN RETURN 'gold';
  ELSIF p_percent >= v_silver THEN RETURN 'silver';
  ELSIF p_percent >= v_bronze THEN RETURN 'bronze';
  ELSIF p_percent >= v_pass   THEN RETURN 'pass';
  ELSE RETURN 'fail';
  END IF;
END;
$$;

-- 16.4 Auto-calculate grade on evaluation update
CREATE OR REPLACE FUNCTION fn_update_eval_grade()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.max_score > 0 THEN
    NEW.percentage := ROUND((NEW.total_score / NEW.max_score) * 100, 2);
  ELSE
    NEW.percentage := 0;
  END IF;
  NEW.grade := fn_calc_grade(NEW.percentage);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_area_eval_grade
  BEFORE INSERT OR UPDATE OF total_score, max_score ON area_evaluations
  FOR EACH ROW EXECUTE FUNCTION fn_update_eval_grade();

CREATE TRIGGER trg_class_eval_grade
  BEFORE INSERT OR UPDATE OF total_score, max_score ON classroom_evaluations
  FOR EACH ROW EXECUTE FUNCTION fn_update_eval_grade();

-- 16.5 Auto-calculate water bottle grade
CREATE OR REPLACE FUNCTION fn_update_water_grade()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.students_present > 0 THEN
    NEW.percentage := ROUND((NEW.students_with_bottle::NUMERIC / NEW.students_present) * 100, 2);
  ELSE
    NEW.percentage := 0;
  END IF;
  NEW.grade := fn_calc_grade(NEW.percentage);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_water_grade
  BEFORE INSERT OR UPDATE OF students_with_bottle, students_present ON water_bottle_records
  FOR EACH ROW EXECUTE FUNCTION fn_update_water_grade();

-- 16.6 Auto-update evaluation timestamps on status change
CREATE OR REPLACE FUNCTION fn_eval_status_timestamps()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'submitted' AND OLD.status = 'draft' THEN
    NEW.submitted_at := NOW();
  ELSIF NEW.status = 'approved' AND OLD.status = 'submitted' THEN
    NEW.approved_at := NOW();
  ELSIF NEW.status = 'rejected' THEN
    NEW.rejected_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_area_eval_status_timestamps
  BEFORE UPDATE OF status ON area_evaluations
  FOR EACH ROW EXECUTE FUNCTION fn_eval_status_timestamps();

CREATE TRIGGER trg_class_eval_status_timestamps
  BEFORE UPDATE OF status ON classroom_evaluations
  FOR EACH ROW EXECUTE FUNCTION fn_eval_status_timestamps();

-- 16.7 Water bottle status timestamps
CREATE OR REPLACE FUNCTION fn_water_status_timestamps()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'submitted' AND (OLD.status IS NULL OR OLD.status = 'draft') THEN
    NEW.submitted_at := NOW();
  ELSIF NEW.status = 'acknowledged' THEN
    NEW.acknowledged_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_water_status_timestamps
  BEFORE UPDATE OF status ON water_bottle_records
  FOR EACH ROW EXECUTE FUNCTION fn_water_status_timestamps();

-- 16.8 Audit log helper function (call from application code)
CREATE OR REPLACE FUNCTION fn_write_audit_log(
  p_user_id     UUID,
  p_user_email  TEXT,
  p_user_role   user_role,
  p_action      TEXT,
  p_entity_type TEXT,
  p_entity_id   UUID        DEFAULT NULL,
  p_old_values  JSONB       DEFAULT NULL,
  p_new_values  JSONB       DEFAULT NULL,
  p_ip          INET        DEFAULT NULL,
  p_user_agent  TEXT        DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id, user_email, user_role,
    action, entity_type, entity_id,
    old_values, new_values,
    ip_address, user_agent
  ) VALUES (
    p_user_id, p_user_email, p_user_role,
    p_action, p_entity_type, p_entity_id,
    p_old_values, p_new_values,
    p_ip, p_user_agent
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- 16.9 Helper: get calling user's role
CREATE OR REPLACE FUNCTION fn_get_my_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- 16.10 Helper: is current user an administrator
CREATE OR REPLACE FUNCTION fn_is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'administrator' AND is_active = TRUE
  );
$$;

-- 16.11 Helper: is current user a director or above
CREATE OR REPLACE FUNCTION fn_is_director_or_above()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('administrator', 'director', 'deputy_director')
      AND is_active = TRUE
  );
$$;

-- 16.12 Helper: get current user's homeroom ID
CREATE OR REPLACE FUNCTION fn_my_homeroom()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT homeroom_id FROM profiles WHERE id = auth.uid();
$$;

-- 16.13 Helper: get current user's building ID
CREATE OR REPLACE FUNCTION fn_my_building()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT building_id FROM profiles WHERE id = auth.uid();
$$;

-- 16.14 Generate certificate number
CREATE OR REPLACE FUNCTION fn_generate_certificate_no(
  p_semester_id UUID
)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  v_year    INTEGER;
  v_sem     TEXT;
  v_count   INTEGER;
BEGIN
  SELECT ay.year, s.semester
  INTO v_year, v_sem
  FROM semesters s
  JOIN academic_years ay ON ay.id = s.academic_year_id
  WHERE s.id = p_semester_id;

  SELECT COUNT(*) + 1 INTO v_count
  FROM certificates c
  JOIN semesters s ON s.id = c.semester_id
  JOIN academic_years ay ON ay.id = s.academic_year_id
  WHERE ay.year = v_year AND s.semester = v_sem;

  RETURN 'SA-' || v_year::TEXT || '-' || v_sem || '-' || LPAD(v_count::TEXT, 3, '0');
END;
$$;

-- ============================================================
-- 17. VIEWS
-- ============================================================

-- 17.1 Active semester details
CREATE OR REPLACE VIEW v_active_semester AS
SELECT
  s.id,
  s.semester,
  s.label         AS semester_label,
  s.start_date,
  s.end_date,
  ay.id           AS academic_year_id,
  ay.year         AS academic_year,
  ay.year_ce,
  ay.label        AS academic_year_label
FROM semesters s
JOIN academic_years ay ON ay.id = s.academic_year_id
WHERE s.is_active = TRUE
LIMIT 1;

-- 17.2 Homeroom summary with teacher and room info
CREATE OR REPLACE VIEW v_homerooms_full AS
SELECT
  h.id,
  h.class_name,
  h.grade_level,
  h.class_number,
  h.student_count,
  h.is_active,
  h.academic_year_id,
  ay.year                AS academic_year,
  r.id                   AS room_id,
  r.room_number,
  r.name                 AS room_name,
  b.id                   AS building_id,
  b.name                 AS building_name,
  b.code                 AS building_code,
  f.floor_number,
  -- Primary teacher
  (SELECT p.full_name
   FROM homeroom_teachers ht
   JOIN profiles p ON p.id = ht.teacher_id
   WHERE ht.homeroom_id = h.id AND ht.is_primary = TRUE
   LIMIT 1) AS primary_teacher_name
FROM homerooms h
JOIN academic_years ay ON ay.id = h.academic_year_id
LEFT JOIN rooms r ON r.id = h.room_id
LEFT JOIN buildings b ON b.id = r.building_id
LEFT JOIN floors f ON f.id = r.floor_id;

-- 17.3 Area evaluation summary with joins
CREATE OR REPLACE VIEW v_area_evaluations_full AS
SELECT
  ae.id,
  ae.status,
  ae.total_score,
  ae.max_score,
  ae.percentage,
  ae.grade,
  ae.evaluator_notes,
  ae.approver_notes,
  ae.evaluated_at,
  ae.submitted_at,
  ae.approved_at,
  ae.created_at,
  -- Area
  ra.id               AS area_id,
  ra.name             AS area_name,
  ra.location_description,
  -- Homeroom
  h.id                AS homeroom_id,
  h.class_name,
  h.grade_level,
  -- Building
  b.id                AS building_id,
  b.name              AS building_name,
  -- Semester
  s.id                AS semester_id,
  s.semester,
  ay.year             AS academic_year,
  -- Evaluator
  ev.full_name        AS evaluator_name,
  ev.role             AS evaluator_role,
  -- Approver
  ap.full_name        AS approver_name
FROM area_evaluations ae
JOIN responsible_areas ra ON ra.id = ae.responsible_area_id
JOIN homerooms h          ON h.id  = ra.homeroom_id
LEFT JOIN buildings b     ON b.id  = ra.building_id
JOIN semesters s          ON s.id  = ae.semester_id
JOIN academic_years ay    ON ay.id = s.academic_year_id
JOIN profiles ev          ON ev.id = ae.evaluator_id
LEFT JOIN profiles ap     ON ap.id = ae.approver_id;

-- 17.4 Classroom evaluation summary
CREATE OR REPLACE VIEW v_classroom_evaluations_full AS
SELECT
  ce.id,
  ce.status,
  ce.total_score,
  ce.max_score,
  ce.percentage,
  ce.grade,
  ce.eval_week,
  ce.eval_round,
  ce.evaluator_notes,
  ce.approver_notes,
  ce.evaluated_at,
  ce.submitted_at,
  ce.approved_at,
  ce.created_at,
  -- Room
  r.id                AS room_id,
  r.room_number,
  r.name              AS room_name,
  -- Building
  b.id                AS building_id,
  b.name              AS building_name,
  b.code              AS building_code,
  -- Floor
  fl.floor_number,
  -- Homeroom
  h.id                AS homeroom_id,
  h.class_name,
  h.grade_level,
  -- Semester
  s.id                AS semester_id,
  s.semester,
  ay.year             AS academic_year,
  -- Evaluator
  ev.full_name        AS evaluator_name,
  -- Approver
  ap.full_name        AS approver_name
FROM classroom_evaluations ce
JOIN rooms r              ON r.id  = ce.room_id
JOIN buildings b          ON b.id  = r.building_id
JOIN floors fl            ON fl.id = r.floor_id
LEFT JOIN homerooms h     ON h.id  = ce.homeroom_id
JOIN semesters s          ON s.id  = ce.semester_id
JOIN academic_years ay    ON ay.id = s.academic_year_id
JOIN profiles ev          ON ev.id = ce.evaluator_id
LEFT JOIN profiles ap     ON ap.id = ce.approver_id;

-- 17.5 Water bottle records full view
CREATE OR REPLACE VIEW v_water_bottle_full AS
SELECT
  wb.id,
  wb.check_date,
  wb.check_period,
  wb.status,
  wb.total_students,
  wb.students_present,
  wb.students_with_bottle,
  wb.students_absent,
  wb.percentage,
  wb.grade,
  wb.teacher_notes,
  wb.acknowledger_notes,
  wb.submitted_at,
  wb.acknowledged_at,
  wb.created_at,
  -- Homeroom
  h.id                AS homeroom_id,
  h.class_name,
  h.grade_level,
  -- Building (via room)
  b.name              AS building_name,
  -- Semester
  s.id                AS semester_id,
  s.semester,
  ay.year             AS academic_year,
  -- Teacher
  t.full_name         AS teacher_name,
  -- Acknowledger
  ack.full_name       AS acknowledger_name
FROM water_bottle_records wb
JOIN homerooms h          ON h.id  = wb.homeroom_id
LEFT JOIN rooms r         ON r.id  = h.room_id
LEFT JOIN buildings b     ON b.id  = r.building_id
JOIN semesters s          ON s.id  = wb.semester_id
JOIN academic_years ay    ON ay.id = s.academic_year_id
JOIN profiles t           ON t.id  = wb.teacher_id
LEFT JOIN profiles ack    ON ack.id = wb.acknowledger_id;

-- 17.6 Pending approvals summary (for dashboard)
CREATE OR REPLACE VIEW v_pending_approvals AS
SELECT
  'area_evaluation'   AS type,
  ae.id,
  h.class_name,
  b.name              AS building_name,
  ra.name             AS subject,
  ae.submitted_at     AS action_at,
  ev.full_name        AS submitted_by
FROM area_evaluations ae
JOIN responsible_areas ra ON ra.id = ae.responsible_area_id
JOIN homerooms h           ON h.id  = ra.homeroom_id
LEFT JOIN buildings b      ON b.id  = ra.building_id
JOIN profiles ev           ON ev.id = ae.evaluator_id
WHERE ae.status = 'submitted'

UNION ALL

SELECT
  'classroom_evaluation' AS type,
  ce.id,
  h.class_name,
  b.name              AS building_name,
  r.name              AS subject,
  ce.submitted_at     AS action_at,
  ev.full_name        AS submitted_by
FROM classroom_evaluations ce
JOIN rooms r           ON r.id  = ce.room_id
JOIN buildings b       ON b.id  = r.building_id
LEFT JOIN homerooms h  ON h.id  = ce.homeroom_id
JOIN profiles ev       ON ev.id = ce.evaluator_id
WHERE ce.status = 'submitted'

UNION ALL

SELECT
  'water_bottle'      AS type,
  wb.id,
  h.class_name,
  b.name              AS building_name,
  'ขวดน้ำส่วนตัว ' || wb.check_date::TEXT AS subject,
  wb.submitted_at     AS action_at,
  t.full_name         AS submitted_by
FROM water_bottle_records wb
JOIN homerooms h       ON h.id  = wb.homeroom_id
LEFT JOIN rooms r      ON r.id  = h.room_id
LEFT JOIN buildings b  ON b.id  = r.building_id
JOIN profiles t        ON t.id  = wb.teacher_id
WHERE wb.status = 'submitted';

-- ============================================================
-- 18. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE academic_years              ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE homerooms                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE homeroom_teachers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_supervisors           ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE students                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_criteria         ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsible_areas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_evaluations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_evaluation_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_evaluations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_evaluation_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_photos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_bottle_records        ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_water_bottle_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates                ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications               ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences    ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements               ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE homeroom_semester_scores    ENABLE ROW LEVEL SECURITY;

-- ── ACADEMIC YEARS ───────────────────────────────────────────
CREATE POLICY "rls_academic_years_read"
  ON academic_years FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "rls_academic_years_write"
  ON academic_years FOR ALL USING (fn_is_admin());

-- ── SEMESTERS ────────────────────────────────────────────────
CREATE POLICY "rls_semesters_read"
  ON semesters FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "rls_semesters_write"
  ON semesters FOR ALL USING (fn_is_admin());

-- ── BUILDINGS ────────────────────────────────────────────────
CREATE POLICY "rls_buildings_read"
  ON buildings FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "rls_buildings_write"
  ON buildings FOR ALL USING (fn_is_admin());

-- ── FLOORS ──────────────────────────────────────────────────
CREATE POLICY "rls_floors_read"
  ON floors FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "rls_floors_write"
  ON floors FOR ALL USING (fn_is_admin());

-- ── ROOMS ───────────────────────────────────────────────────
CREATE POLICY "rls_rooms_read"
  ON rooms FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "rls_rooms_write"
  ON rooms FOR ALL USING (fn_is_admin());

-- ── HOMEROOMS ────────────────────────────────────────────────
CREATE POLICY "rls_homerooms_read"
  ON homerooms FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "rls_homerooms_write"
  ON homerooms FOR ALL USING (fn_is_admin());

-- ── HOMEROOM TEACHERS ────────────────────────────────────────
CREATE POLICY "rls_hr_teachers_read"
  ON homeroom_teachers FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "rls_hr_teachers_write"
  ON homeroom_teachers FOR ALL USING (fn_is_admin());

-- ── GRADE SUPERVISORS ────────────────────────────────────────
CREATE POLICY "rls_grade_supervisors_read"
  ON grade_supervisors FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "rls_grade_supervisors_write"
  ON grade_supervisors FOR ALL USING (fn_is_admin());

-- ── PROFILES ─────────────────────────────────────────────────
-- All authenticated users can read profiles (needed for display names)
CREATE POLICY "rls_profiles_read_all"
  ON profiles FOR SELECT TO authenticated USING (TRUE);

-- Users can update only their own profile
CREATE POLICY "rls_profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Only admins can insert/delete profiles
CREATE POLICY "rls_profiles_insert"
  ON profiles FOR INSERT WITH CHECK (id = auth.uid() OR fn_is_admin());

CREATE POLICY "rls_profiles_delete"
  ON profiles FOR DELETE USING (fn_is_admin());

-- ── STUDENTS ─────────────────────────────────────────────────
CREATE POLICY "rls_students_read"
  ON students FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "rls_students_insert"
  ON students FOR INSERT
  WITH CHECK (
    fn_get_my_role() IN ('homeroom_teacher', 'administrator')
  );

CREATE POLICY "rls_students_update"
  ON students FOR UPDATE
  USING (
    -- Homeroom teacher can update students in their homeroom
    (fn_get_my_role() = 'homeroom_teacher' AND homeroom_id = fn_my_homeroom())
    OR fn_is_admin()
  );

CREATE POLICY "rls_students_delete"
  ON students FOR DELETE USING (fn_is_admin());

-- ── EVALUATION CRITERIA ──────────────────────────────────────
CREATE POLICY "rls_criteria_read"
  ON evaluation_criteria FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "rls_criteria_write"
  ON evaluation_criteria FOR ALL USING (fn_is_admin());

-- ── RESPONSIBLE AREAS ────────────────────────────────────────
CREATE POLICY "rls_resp_areas_read"
  ON responsible_areas FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "rls_resp_areas_insert"
  ON responsible_areas FOR INSERT
  WITH CHECK (fn_is_admin());

CREATE POLICY "rls_resp_areas_update"
  ON responsible_areas FOR UPDATE
  USING (fn_is_admin());

CREATE POLICY "rls_resp_areas_delete"
  ON responsible_areas FOR DELETE USING (fn_is_admin());

-- ── AREA EVALUATIONS ─────────────────────────────────────────
-- Everyone authenticated can read
CREATE POLICY "rls_area_eval_read"
  ON area_evaluations FOR SELECT TO authenticated USING (TRUE);

-- Only class representatives and admins can create
CREATE POLICY "rls_area_eval_insert"
  ON area_evaluations FOR INSERT
  WITH CHECK (
    fn_get_my_role() IN ('class_representative', 'administrator')
  );

-- Evaluator can edit own draft; approver can update status; admin can do all
CREATE POLICY "rls_area_eval_update"
  ON area_evaluations FOR UPDATE
  USING (
    (evaluator_id = auth.uid() AND status IN ('draft', 'rejected'))
    OR (approver_id = auth.uid() AND status = 'submitted')
    OR fn_get_my_role() IN ('homeroom_teacher', 'administrator')
  );

CREATE POLICY "rls_area_eval_delete"
  ON area_evaluations FOR DELETE
  USING (
    (evaluator_id = auth.uid() AND status = 'draft')
    OR fn_is_admin()
  );

-- ── AREA EVALUATION ITEMS ────────────────────────────────────
CREATE POLICY "rls_area_items_read"
  ON area_evaluation_items FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "rls_area_items_write"
  ON area_evaluation_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM area_evaluations ae
      WHERE ae.id = area_evaluation_id
        AND (ae.evaluator_id = auth.uid() OR fn_is_admin())
    )
  );

-- ── CLASSROOM EVALUATIONS ────────────────────────────────────
CREATE POLICY "rls_class_eval_read"
  ON classroom_evaluations FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "rls_class_eval_insert"
  ON classroom_evaluations FOR INSERT
  WITH CHECK (
    fn_get_my_role() IN ('student_council', 'administrator')
  );

CREATE POLICY "rls_class_eval_update"
  ON classroom_evaluations FOR UPDATE
  USING (
    (evaluator_id = auth.uid() AND status IN ('draft', 'rejected'))
    OR (approver_id = auth.uid() AND status = 'submitted')
    OR fn_get_my_role() IN ('building_supervisor', 'administrator')
  );

CREATE POLICY "rls_class_eval_delete"
  ON classroom_evaluations FOR DELETE
  USING (
    (evaluator_id = auth.uid() AND status = 'draft')
    OR fn_is_admin()
  );

-- ── CLASSROOM EVALUATION ITEMS ───────────────────────────────
CREATE POLICY "rls_class_items_read"
  ON classroom_evaluation_items FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "rls_class_items_write"
  ON classroom_evaluation_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM classroom_evaluations ce
      WHERE ce.id = classroom_evaluation_id
        AND (ce.evaluator_id = auth.uid() OR fn_is_admin())
    )
  );

-- ── EVALUATION PHOTOS ────────────────────────────────────────
CREATE POLICY "rls_photos_read"
  ON evaluation_photos FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "rls_photos_insert"
  ON evaluation_photos FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "rls_photos_delete"
  ON evaluation_photos FOR DELETE
  USING (uploaded_by = auth.uid() OR fn_is_admin());

-- ── WATER BOTTLE RECORDS ─────────────────────────────────────
CREATE POLICY "rls_water_read"
  ON water_bottle_records FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "rls_water_insert"
  ON water_bottle_records FOR INSERT
  WITH CHECK (
    fn_get_my_role() IN ('homeroom_teacher', 'administrator')
    AND (
      fn_get_my_role() = 'administrator'
      OR homeroom_id = fn_my_homeroom()
    )
  );

CREATE POLICY "rls_water_update"
  ON water_bottle_records FOR UPDATE
  USING (
    (teacher_id = auth.uid() AND status IN ('draft', 'rejected'))
    OR (acknowledger_id = auth.uid() AND status = 'submitted')
    OR fn_get_my_role() IN ('grade_supervisor', 'administrator')
  );

CREATE POLICY "rls_water_delete"
  ON water_bottle_records FOR DELETE
  USING (
    (teacher_id = auth.uid() AND status = 'draft')
    OR fn_is_admin()
  );

-- ── STUDENT WATER BOTTLE STATUSES ────────────────────────────
CREATE POLICY "rls_water_statuses_read"
  ON student_water_bottle_statuses FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "rls_water_statuses_write"
  ON student_water_bottle_statuses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM water_bottle_records wb
      WHERE wb.id = water_bottle_record_id
        AND (wb.teacher_id = auth.uid() OR fn_is_admin())
    )
  );

-- ── CERTIFICATE TEMPLATES ────────────────────────────────────
CREATE POLICY "rls_cert_templates_read"
  ON certificate_templates FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "rls_cert_templates_write"
  ON certificate_templates FOR ALL USING (fn_is_admin());

-- ── CERTIFICATES ─────────────────────────────────────────────
CREATE POLICY "rls_certs_read"
  ON certificates FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "rls_certs_write"
  ON certificates FOR ALL
  USING (fn_is_director_or_above());

-- ── NOTIFICATIONS ────────────────────────────────────────────
-- Users can only see their own notifications
CREATE POLICY "rls_notif_own_read"
  ON notifications FOR SELECT
  USING (recipient_id = auth.uid() OR fn_is_admin());

-- System (service role) inserts notifications
CREATE POLICY "rls_notif_insert"
  ON notifications FOR INSERT
  WITH CHECK (TRUE);  -- Controlled by service role from Edge Functions

-- Users can mark their own as read
CREATE POLICY "rls_notif_update_own"
  ON notifications FOR UPDATE
  USING (recipient_id = auth.uid() OR fn_is_admin());

-- Users can delete their own notifications
CREATE POLICY "rls_notif_delete_own"
  ON notifications FOR DELETE
  USING (recipient_id = auth.uid() OR fn_is_admin());

-- ── NOTIFICATION PREFERENCES ─────────────────────────────────
CREATE POLICY "rls_notif_prefs_own"
  ON notification_preferences FOR ALL
  USING (user_id = auth.uid() OR fn_is_admin());

-- ── ANNOUNCEMENTS ────────────────────────────────────────────
-- Published announcements visible to all, drafts only to directors+
CREATE POLICY "rls_announcements_read"
  ON announcements FOR SELECT
  USING (is_published = TRUE OR fn_is_director_or_above());

CREATE POLICY "rls_announcements_write"
  ON announcements FOR ALL
  USING (fn_is_director_or_above());

-- ── AUDIT LOGS ───────────────────────────────────────────────
CREATE POLICY "rls_audit_read"
  ON audit_logs FOR SELECT USING (fn_is_admin());

CREATE POLICY "rls_audit_insert"
  ON audit_logs FOR INSERT WITH CHECK (TRUE);  -- server-side only

-- ── SYSTEM SETTINGS ──────────────────────────────────────────
-- Public settings visible to all; others only to authenticated
CREATE POLICY "rls_settings_read"
  ON system_settings FOR SELECT
  USING (is_public = TRUE OR (auth.uid() IS NOT NULL));

CREATE POLICY "rls_settings_write"
  ON system_settings FOR ALL USING (fn_is_admin());

-- ── HOMEROOM SEMESTER SCORES ─────────────────────────────────
CREATE POLICY "rls_scores_read"
  ON homeroom_semester_scores FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "rls_scores_write"
  ON homeroom_semester_scores FOR ALL USING (fn_is_admin());

-- ============================================================
-- 19. STORAGE BUCKET POLICIES
-- ============================================================
-- Run separately or uncomment:

-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES
--   ('evaluation-photos', 'evaluation-photos', true, 10485760,  -- 10 MB
--    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
--   ('certificates',      'certificates',      true, 52428800,  -- 50 MB
--    ARRAY['application/pdf']),
--   ('avatars',           'avatars',            true, 2097152,   -- 2 MB
--    ARRAY['image/jpeg', 'image/png', 'image/webp']),
--   ('announcements',     'announcements',      true, 10485760,
--    ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Storage RLS: evaluation-photos
-- CREATE POLICY "storage_eval_photos_read"   ON storage.objects FOR SELECT USING (bucket_id = 'evaluation-photos');
-- CREATE POLICY "storage_eval_photos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'evaluation-photos' AND auth.uid() IS NOT NULL);
-- CREATE POLICY "storage_eval_photos_delete" ON storage.objects FOR DELETE USING (bucket_id = 'evaluation-photos' AND owner = auth.uid()::TEXT);

-- Storage RLS: avatars
-- CREATE POLICY "storage_avatars_read"   ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "storage_avatars_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
-- CREATE POLICY "storage_avatars_delete" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND owner = auth.uid()::TEXT);

-- ============================================================
-- 20. SEED DATA
-- ============================================================

-- 20.1 System Settings
INSERT INTO system_settings (key, value, description, category, is_public) VALUES
  ('school_name',             '"โรงเรียนสา"',                         'ชื่อโรงเรียน',                      'school',        true),
  ('school_name_en',          '"Sa School"',                          'School name (English)',               'school',        true),
  ('school_address',          '"อำเภอเวียงสา จังหวัดน่าน 55110"',     'ที่อยู่โรงเรียน',                    'school',        true),
  ('school_phone',            '"054-000000"',                         'เบอร์โทรศัพท์โรงเรียน',              'school',        true),
  ('school_email',            '"info@saschool.ac.th"',                'อีเมลโรงเรียน',                       'school',        true),
  ('school_website',          '"https://saschool.ac.th"',             'เว็บไซต์โรงเรียน',                   'school',        true),
  ('school_logo_url',         'null',                                  'URL โลโก้โรงเรียน',                  'school',        true),
  ('grade_thresholds',        '{"gold": 90, "silver": 80, "bronze": 70, "pass": 60}',
                                                                       'เกณฑ์คะแนนระดับ (ใช้กับทุกโมดูล)',   'scoring',       false),
  ('water_bottle_thresholds', '{"gold": 90, "silver": 80, "bronze": 70, "pass": 60}',
                                                                       'เกณฑ์คะแนนขวดน้ำ',                   'scoring',       false),
  ('score_weights',           '{"area": 0.33, "classroom": 0.33, "water": 0.34}',
                                                                       'น้ำหนักคะแนนแต่ละด้าน',               'scoring',       false),
  ('notification_enabled',    'true',                                  'เปิดใช้การแจ้งเตือนในระบบ',          'notifications', false),
  ('line_notification_enabled','false',                                'เปิดใช้ LINE Notification',           'notifications', false),
  ('email_notification_enabled','true',                                'เปิดใช้ Email Notification',          'notifications', false),
  ('ai_enabled',              'true',                                  'เปิดใช้ AI Analytics',                'ai',            false),
  ('ai_provider',             '"gemini"',                              'AI Provider: gemini | openai',        'ai',            false),
  ('max_photo_size_mb',       '10',                                    'ขนาดสูงสุดของรูปภาพ (MB)',            'uploads',       false),
  ('academic_year_start_month','5',                                    'เดือนเริ่มต้นปีการศึกษา (ไทย = 5)',  'academic',      false)
ON CONFLICT (key) DO NOTHING;

-- 20.2 Academic Year 2567
INSERT INTO academic_years (year, year_ce, is_active)
VALUES (2567, 2024, TRUE)
ON CONFLICT (year) DO NOTHING;

-- 20.3 Semesters 2567
INSERT INTO semesters (academic_year_id, semester, start_date, end_date, is_active)
SELECT id, '1', '2024-05-16', '2024-09-30', TRUE
FROM academic_years WHERE year = 2567
ON CONFLICT (academic_year_id, semester) DO NOTHING;

INSERT INTO semesters (academic_year_id, semester, start_date, end_date, is_active)
SELECT id, '2', '2024-11-01', '2025-03-31', FALSE
FROM academic_years WHERE year = 2567
ON CONFLICT (academic_year_id, semester) DO NOTHING;

-- 20.4 Buildings
INSERT INTO buildings (name, code, description, total_floors, sort_order) VALUES
  ('อาคาร 1',   'B1',   'อาคารเรียนหลัก ชั้น ม.1-ม.2',            4, 1),
  ('อาคาร 2',   'B2',   'อาคารเรียน ชั้น ม.3-ม.4',                3, 2),
  ('อาคาร 3',   'B3',   'อาคารเรียน ชั้น ม.5-ม.6',                3, 3),
  ('อาคาร 4',   'B4',   'อาคารปฏิบัติการวิทยาศาสตร์และคอมพิวเตอร์', 2, 4),
  ('โรงอาหาร',  'CAFE', 'โรงอาหาร',                                1, 5),
  ('อาคารพลศึกษา','GYM','อาคารพลศึกษาและหอประชุม',                 1, 6)
ON CONFLICT (code) DO NOTHING;

-- 20.5 Floors
DO $$
DECLARE
  b RECORD;
BEGIN
  FOR b IN SELECT id, code, total_floors FROM buildings WHERE code IN ('B1','B2','B3','B4') LOOP
    FOR i IN 1..b.total_floors LOOP
      INSERT INTO floors (building_id, floor_number, name)
      VALUES (b.id, i, 'ชั้น ' || i)
      ON CONFLICT (building_id, floor_number) DO NOTHING;
    END LOOP;
  END LOOP;
  -- Single-floor buildings
  INSERT INTO floors (building_id, floor_number, name)
  SELECT id, 1, 'ชั้น 1' FROM buildings WHERE code IN ('CAFE','GYM')
  ON CONFLICT (building_id, floor_number) DO NOTHING;
END;
$$;

-- 20.6 Rooms (Classrooms B1)
DO $$
DECLARE
  v_b1 UUID;
  v_f1 UUID;
  v_f2 UUID;
  v_f3 UUID;
  v_f4 UUID;
BEGIN
  SELECT id INTO v_b1 FROM buildings WHERE code = 'B1';
  SELECT id INTO v_f1 FROM floors WHERE building_id = v_b1 AND floor_number = 1;
  SELECT id INTO v_f2 FROM floors WHERE building_id = v_b1 AND floor_number = 2;
  SELECT id INTO v_f3 FROM floors WHERE building_id = v_b1 AND floor_number = 3;
  SELECT id INTO v_f4 FROM floors WHERE building_id = v_b1 AND floor_number = 4;
  -- Floor 1: ม.1
  INSERT INTO rooms (floor_id, building_id, room_number, name, type, capacity) VALUES
    (v_f1, v_b1, '101', 'ห้อง 101 (ม.1/1)', 'classroom', 40),
    (v_f1, v_b1, '102', 'ห้อง 102 (ม.1/2)', 'classroom', 40),
    (v_f1, v_b1, '103', 'ห้อง 103 (ม.1/3)', 'classroom', 40),
    (v_f1, v_b1, '104', 'ห้อง 104 (ม.1/4)', 'classroom', 40),
    (v_f1, v_b1, '105', 'ห้อง 105 (ม.1/5)', 'classroom', 40)
  ON CONFLICT (building_id, room_number) DO NOTHING;
  -- Floor 2: ม.2
  INSERT INTO rooms (floor_id, building_id, room_number, name, type, capacity) VALUES
    (v_f2, v_b1, '201', 'ห้อง 201 (ม.2/1)', 'classroom', 40),
    (v_f2, v_b1, '202', 'ห้อง 202 (ม.2/2)', 'classroom', 40),
    (v_f2, v_b1, '203', 'ห้อง 203 (ม.2/3)', 'classroom', 40),
    (v_f2, v_b1, '204', 'ห้อง 204 (ม.2/4)', 'classroom', 40),
    (v_f2, v_b1, '205', 'ห้อง 205 (ม.2/5)', 'classroom', 40)
  ON CONFLICT (building_id, room_number) DO NOTHING;
END;
$$;

DO $$
DECLARE
  v_b2 UUID;
  v_f1 UUID;
  v_f2 UUID;
  v_f3 UUID;
BEGIN
  SELECT id INTO v_b2 FROM buildings WHERE code = 'B2';
  SELECT id INTO v_f1 FROM floors WHERE building_id = v_b2 AND floor_number = 1;
  SELECT id INTO v_f2 FROM floors WHERE building_id = v_b2 AND floor_number = 2;
  SELECT id INTO v_f3 FROM floors WHERE building_id = v_b2 AND floor_number = 3;
  -- Floor 1: ม.3
  INSERT INTO rooms (floor_id, building_id, room_number, name, type, capacity) VALUES
    (v_f1, v_b2, '301', 'ห้อง 301 (ม.3/1)', 'classroom', 40),
    (v_f1, v_b2, '302', 'ห้อง 302 (ม.3/2)', 'classroom', 40),
    (v_f1, v_b2, '303', 'ห้อง 303 (ม.3/3)', 'classroom', 40),
    (v_f1, v_b2, '304', 'ห้อง 304 (ม.3/4)', 'classroom', 40),
    (v_f1, v_b2, '305', 'ห้อง 305 (ม.3/5)', 'classroom', 40)
  ON CONFLICT (building_id, room_number) DO NOTHING;
  -- Floor 2: ม.4
  INSERT INTO rooms (floor_id, building_id, room_number, name, type, capacity) VALUES
    (v_f2, v_b2, '401', 'ห้อง 401 (ม.4/1)', 'classroom', 40),
    (v_f2, v_b2, '402', 'ห้อง 402 (ม.4/2)', 'classroom', 40),
    (v_f2, v_b2, '403', 'ห้อง 403 (ม.4/3)', 'classroom', 40),
    (v_f2, v_b2, '404', 'ห้อง 404 (ม.4/4)', 'classroom', 40),
    (v_f2, v_b2, '405', 'ห้อง 405 (ม.4/5)', 'classroom', 40)
  ON CONFLICT (building_id, room_number) DO NOTHING;
END;
$$;

DO $$
DECLARE
  v_b3 UUID;
  v_f1 UUID;
  v_f2 UUID;
  v_f3 UUID;
BEGIN
  SELECT id INTO v_b3 FROM buildings WHERE code = 'B3';
  SELECT id INTO v_f1 FROM floors WHERE building_id = v_b3 AND floor_number = 1;
  SELECT id INTO v_f2 FROM floors WHERE building_id = v_b3 AND floor_number = 2;
  SELECT id INTO v_f3 FROM floors WHERE building_id = v_b3 AND floor_number = 3;
  -- Floor 1: ม.5
  INSERT INTO rooms (floor_id, building_id, room_number, name, type, capacity) VALUES
    (v_f1, v_b3, '501', 'ห้อง 501 (ม.5/1)', 'classroom', 40),
    (v_f1, v_b3, '502', 'ห้อง 502 (ม.5/2)', 'classroom', 40),
    (v_f1, v_b3, '503', 'ห้อง 503 (ม.5/3)', 'classroom', 40),
    (v_f1, v_b3, '504', 'ห้อง 504 (ม.5/4)', 'classroom', 40),
    (v_f1, v_b3, '505', 'ห้อง 505 (ม.5/5)', 'classroom', 40)
  ON CONFLICT (building_id, room_number) DO NOTHING;
  -- Floor 2: ม.6
  INSERT INTO rooms (floor_id, building_id, room_number, name, type, capacity) VALUES
    (v_f2, v_b3, '601', 'ห้อง 601 (ม.6/1)', 'classroom', 40),
    (v_f2, v_b3, '602', 'ห้อง 602 (ม.6/2)', 'classroom', 40),
    (v_f2, v_b3, '603', 'ห้อง 603 (ม.6/3)', 'classroom', 40),
    (v_f2, v_b3, '604', 'ห้อง 604 (ม.6/4)', 'classroom', 40),
    (v_f2, v_b3, '605', 'ห้อง 605 (ม.6/5)', 'classroom', 40)
  ON CONFLICT (building_id, room_number) DO NOTHING;
END;
$$;

-- 20.7 Homerooms (30 classes: ม.1–ม.6, 5 sections each)
DO $$
DECLARE
  v_year_id UUID;
  v_room_id UUID;
  v_grade   INTEGER;
  v_class   INTEGER;
  v_room_no TEXT;
BEGIN
  SELECT id INTO v_year_id FROM academic_years WHERE year = 2567;

  FOR v_grade IN 1..6 LOOP
    FOR v_class IN 1..5 LOOP
      v_room_no := (v_grade * 100 + v_class)::TEXT;

      SELECT r.id INTO v_room_id
      FROM rooms r WHERE r.room_number = v_room_no
      LIMIT 1;

      INSERT INTO homerooms (
        academic_year_id,
        room_id,
        grade_level,
        class_number,
        class_name,
        student_count,
        is_active
      )
      VALUES (
        v_year_id,
        v_room_id,
        v_grade,
        v_class,
        'ม.' || v_grade || '/' || v_class,
        35 + (RANDOM() * 5)::INTEGER,  -- 35-40 students
        TRUE
      )
      ON CONFLICT (academic_year_id, class_name) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;

-- 20.8 Evaluation Criteria (Module A — Area)
INSERT INTO evaluation_criteria (module, name, description, max_score, weight, sort_order) VALUES
  ('area', 'ความสะอาด',          'พื้นที่สะอาด ไม่มีขยะ เศษใบไม้ หรือสิ่งสกปรก',                                     10, 1.0, 1),
  ('area', 'การจัดระเบียบ',       'วัสดุอุปกรณ์จัดวางเป็นระเบียบ เข้าถึงง่าย',                                       10, 1.0, 2),
  ('area', 'การดูแลรักษา',        'ดูแลรักษาอย่างสม่ำเสมอ ไม่ชำรุดเสียหาย',                                          10, 1.0, 3),
  ('area', 'ความปลอดภัย',         'สภาพพื้นที่ปลอดภัย ไม่มีสิ่งกีดขวางหรืออันตราย',                                   10, 1.0, 4),
  ('area', 'สภาพแวดล้อม',         'มีการตกแต่งด้วยต้นไม้ ป้ายสิ่งแวดล้อม หรือสิ่งตกแต่งที่เหมาะสม',                 10, 1.0, 5),
  ('area', 'ความต่อเนื่อง',        'มีการดูแลอย่างต่อเนื่อง มีหลักฐาน/บันทึกการดูแล',                                  10, 1.0, 6)
ON CONFLICT DO NOTHING;

-- 20.9 Evaluation Criteria (Module B — Classroom)
INSERT INTO evaluation_criteria (module, name, description, max_score, weight, sort_order) VALUES
  ('classroom', 'พื้นห้องเรียน',        'พื้นสะอาด กวาด/ถูเรียบร้อย ไม่มีฝุ่น ขยะ',                                   10, 1.0, 1),
  ('classroom', 'โต๊ะและเก้าอี้',       'โต๊ะเก้าอี้สะอาด จัดเรียงตรง ไม่มีรอยเขียน',                                 10, 1.0, 2),
  ('classroom', 'กระดานและอุปกรณ์',    'กระดานสะอาด มีชอล์กและแปรงลบกระดานครบ',                                        10, 1.0, 3),
  ('classroom', 'หน้าต่างและประตู',     'กระจก หน้าต่าง และประตูสะอาด ไม่มีคราบ',                                       10, 1.0, 4),
  ('classroom', 'ถังขยะและการแยกขยะ',  'มีถังขยะครบถ้วน แยกประเภทถูกต้อง ไม่ล้น',                                      10, 1.0, 5),
  ('classroom', 'การตกแต่งห้องเรียน',   'มีป้ายนิเทศ สวัสดี คำขวัญ สิ่งตกแต่งตามฤดูกาล สวยงาม',                       10, 1.0, 6),
  ('classroom', 'ฝ้าและผนัง',          'ฝ้าเพดานและผนังสะอาด ไม่มีคราบ ไม่ชำรุด',                                      10, 1.0, 7),
  ('classroom', 'มุมสิ่งแวดล้อม',       'มีมุมสิ่งแวดล้อม ต้นไม้ หรือแหล่งเรียนรู้ภายในห้อง',                          10, 1.0, 8)
ON CONFLICT DO NOTHING;

-- 20.10 Responsible Areas (sample — one per homeroom, per building floor corridor)
DO $$
DECLARE
  v_hr RECORD;
  v_building_id UUID;
  v_floor_id UUID;
BEGIN
  FOR v_hr IN
    SELECT h.id AS homeroom_id, h.class_name, h.grade_level,
           r.building_id, r.floor_id
    FROM homerooms h
    LEFT JOIN rooms r ON r.id = h.room_id
    WHERE h.academic_year_id = (SELECT id FROM academic_years WHERE year = 2567)
  LOOP
    v_building_id := COALESCE(v_hr.building_id, (SELECT id FROM buildings WHERE code = 'B1'));
    v_floor_id    := v_hr.floor_id;

    INSERT INTO responsible_areas (
      name, description, homeroom_id, building_id, floor_id, location_description, is_active
    )
    VALUES (
      'พื้นที่รับผิดชอบ ' || v_hr.class_name,
      'บริเวณทางเดิน หน้าห้องเรียน และพื้นที่โดยรอบ ของ ' || v_hr.class_name,
      v_hr.homeroom_id,
      v_building_id,
      v_floor_id,
      'บริเวณหน้าห้อง และระเบียง ชั้น ' || COALESCE((SELECT floor_number::TEXT FROM floors WHERE id = v_floor_id), '?'),
      TRUE
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- 20.11 Certificate Templates
INSERT INTO certificate_templates (name, description, grade, type, is_active) VALUES
  ('เกียรติบัตรระดับทอง',      'เกียรติบัตรสำหรับห้องเรียนที่ได้คะแนนระดับทอง (≥ 90%)',     'gold',   'semester_achievement', TRUE),
  ('เกียรติบัตรระดับเงิน',      'เกียรติบัตรสำหรับห้องเรียนที่ได้คะแนนระดับเงิน (≥ 80%)',     'silver', 'semester_achievement', TRUE),
  ('เกียรติบัตรระดับทองแดง',    'เกียรติบัตรสำหรับห้องเรียนที่ได้คะแนนระดับทองแดง (≥ 70%)',   'bronze', 'semester_achievement', TRUE),
  ('เกียรติบัตรรางวัลพิเศษ',    'เกียรติบัตรสำหรับผู้ที่ได้รับรางวัลพิเศษด้านสิ่งแวดล้อม',   'gold',   'special_award',        TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- END OF MIGRATION
-- ============================================================
