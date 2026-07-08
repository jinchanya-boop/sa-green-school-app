-- 1. Add students_leave to water_bottle_records
ALTER TABLE water_bottle_records 
ADD COLUMN students_leave INTEGER NOT NULL DEFAULT 0 CHECK (students_leave >= 0);

-- 2. Add is_leave to student_water_bottle_statuses
ALTER TABLE student_water_bottle_statuses
ADD COLUMN is_leave BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Update the view v_water_bottle_full to include students_leave
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
  wb.students_leave,
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
JOIN profiles t           ON t.id  = wb.teacher_id
LEFT JOIN profiles ack    ON ack.id = wb.acknowledger_id
JOIN semesters s          ON s.id  = wb.semester_id
JOIN academic_years ay    ON ay.id = s.academic_year_id;
