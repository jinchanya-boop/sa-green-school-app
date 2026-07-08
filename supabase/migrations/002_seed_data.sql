-- ============================================================
-- Sa Green School Management System
-- Mock Data Seeding (Master Data)
-- Run this AFTER 001_initial_schema.sql
-- ============================================================

-- 1. Academic Years
INSERT INTO academic_years (year, year_ce, is_active) VALUES
(2567, 2024, true);

-- 2. Semesters
INSERT INTO semesters (academic_year_id, semester, start_date, end_date, is_active)
SELECT id, '1', '2024-05-16', '2024-10-15', true
FROM academic_years WHERE year = 2567;

-- 3. Buildings
INSERT INTO buildings (name, name_en, code, total_floors, sort_order) VALUES
('อาคาร 1 (เฉลิมพระเกียรติ)', 'Building 1', 'B1', 4, 1),
('อาคาร 2 (วิทยาศาสตร์)', 'Science Building', 'B2', 4, 2),
('อาคาร 3 (ศิลปะและดนตรี)', 'Art & Music Building', 'B3', 3, 3);

-- 4. Floors
INSERT INTO floors (building_id, floor_number, name)
SELECT id, 1, 'ชั้น 1' FROM buildings WHERE code = 'B1';
INSERT INTO floors (building_id, floor_number, name)
SELECT id, 2, 'ชั้น 2' FROM buildings WHERE code = 'B1';

-- 5. Rooms
INSERT INTO rooms (building_id, floor_id, room_number, name, type)
SELECT b.id, f.id, '111', 'ห้อง 111', 'classroom' 
FROM buildings b JOIN floors f ON b.id = f.building_id 
WHERE b.code = 'B1' AND f.floor_number = 1;

INSERT INTO rooms (building_id, floor_id, room_number, name, type)
SELECT b.id, f.id, '121', 'ห้อง 121', 'classroom' 
FROM buildings b JOIN floors f ON b.id = f.building_id 
WHERE b.code = 'B1' AND f.floor_number = 2;

-- 6. Homerooms
INSERT INTO homerooms (academic_year_id, grade_level, class_number, class_name)
SELECT id, 1, 1, 'ม.1/1' FROM academic_years WHERE year = 2567;

INSERT INTO homerooms (academic_year_id, grade_level, class_number, class_name)
SELECT id, 4, 1, 'ม.4/1' FROM academic_years WHERE year = 2567;

-- Link homerooms to rooms
UPDATE homerooms SET room_id = (SELECT id FROM rooms WHERE room_number = '111' LIMIT 1) WHERE class_name = 'ม.1/1';
UPDATE homerooms SET room_id = (SELECT id FROM rooms WHERE room_number = '121' LIMIT 1) WHERE class_name = 'ม.4/1';

-- 7. Students (Mock)
INSERT INTO students (homeroom_id, student_number, first_name, last_name, gender)
SELECT id, 1, 'สมชาย', 'ใจดี', 'male' FROM homerooms WHERE class_name = 'ม.1/1';
INSERT INTO students (homeroom_id, student_number, first_name, last_name, gender)
SELECT id, 2, 'สมหญิง', 'รักษ์โลก', 'female' FROM homerooms WHERE class_name = 'ม.1/1';

-- 8. Evaluation Criteria (Module A - Area)
INSERT INTO evaluation_criteria (module, name, description, max_score, sort_order) VALUES
('area', 'ความสะอาดของพื้น', 'ไม่มีขยะ ฝุ่น และคราบสกปรก', 10.0, 1),
('area', 'การจัดเก็บขยะ', 'ถังขยะมีการแยกประเภทและไม่ล้นถัง', 5.0, 2),
('area', 'ความเป็นระเบียบ', 'สิ่งของถูกจัดเก็บเป็นระเบียบเรียบร้อย', 5.0, 3);

-- 9. Evaluation Criteria (Module B - Classroom)
INSERT INTO evaluation_criteria (module, name, description, max_score, sort_order) VALUES
('classroom', 'กระดานและหน้าชั้นเรียน', 'กระดานสะอาด แปรงและชอล์ก/ปากกาจัดเป็นระเบียบ', 5.0, 1),
('classroom', 'โต๊ะเก้าอี้นักเรียน', 'จัดเป็นแถวตรง ไม่มีขยะใต้โต๊ะ', 10.0, 2),
('classroom', 'บริเวณรอบห้องและระเบียง', 'สะอาด ไม่มีหยากไย่ หน้าต่างสะอาด', 5.0, 3);
