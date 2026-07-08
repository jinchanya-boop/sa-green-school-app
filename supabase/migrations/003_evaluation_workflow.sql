-- Migration to support separated Reporting and Evaluation workflow

-- 1. Area Evaluations
ALTER TABLE public.area_evaluations
ADD COLUMN reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ALTER COLUMN evaluator_id DROP NOT NULL;

-- 2. Classroom Evaluations
ALTER TABLE public.classroom_evaluations
ADD COLUMN reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ALTER COLUMN evaluator_id DROP NOT NULL;

-- 3. Views
-- Recreate v_classroom_evaluations_full
DROP VIEW IF EXISTS public.v_classroom_evaluations_full;
CREATE VIEW public.v_classroom_evaluations_full AS
SELECT 
  ce.*,
  r.name AS room_name,
  r.building_id,
  r.floor_id,
  b.name AS building_name,
  f.floor_number AS floor_level,
  hr.class_name AS homeroom_name,
  rep.full_name AS reporter_name,
  ev.full_name AS evaluator_name,
  ap.full_name AS approver_name
FROM classroom_evaluations ce
JOIN rooms r ON ce.room_id = r.id
LEFT JOIN buildings b ON r.building_id = b.id
LEFT JOIN floors f ON r.floor_id = f.id
LEFT JOIN homerooms hr ON ce.homeroom_id = hr.id
LEFT JOIN profiles rep ON ce.reporter_id = rep.id
LEFT JOIN profiles ev ON ce.evaluator_id = ev.id
LEFT JOIN profiles ap ON ce.approver_id = ap.id;

-- Recreate v_area_evaluations_full
DROP VIEW IF EXISTS public.v_area_evaluations_full;
CREATE VIEW public.v_area_evaluations_full AS
SELECT 
  ae.*,
  ra.name AS area_name,
  ra.location_description,
  hr.class_name AS homeroom_name,
  b.name AS building_name,
  f.floor_number AS floor_level,
  rep.full_name AS reporter_name,
  ev.full_name AS evaluator_name,
  ap.full_name AS approver_name
FROM area_evaluations ae
JOIN responsible_areas ra ON ae.responsible_area_id = ra.id
LEFT JOIN homerooms hr ON ra.homeroom_id = hr.id
LEFT JOIN buildings b ON ra.building_id = b.id
LEFT JOIN floors f ON ra.floor_id = f.id
LEFT JOIN profiles rep ON ae.reporter_id = rep.id
LEFT JOIN profiles ev ON ae.evaluator_id = ev.id
LEFT JOIN profiles ap ON ae.approver_id = ap.id;

-- 4. Update Policies for new workflow (if needed)

DROP POLICY IF EXISTS "rls_classroom_evals_insert" ON public.classroom_evaluations;
CREATE POLICY "rls_classroom_evals_insert" 
  ON public.classroom_evaluations FOR INSERT 
  WITH CHECK (
    evaluator_id = auth.uid() OR reporter_id = auth.uid()
  );

DROP POLICY IF EXISTS "rls_area_evals_insert" ON public.area_evaluations;
CREATE POLICY "rls_area_evals_insert" 
  ON public.area_evaluations FOR INSERT 
  WITH CHECK (
    evaluator_id = auth.uid() OR reporter_id = auth.uid()
  );

DROP POLICY IF EXISTS "rls_classroom_evals_update" ON public.classroom_evaluations;
CREATE POLICY "rls_classroom_evals_update" 
  ON public.classroom_evaluations FOR UPDATE 
  USING (
    evaluator_id = auth.uid() OR 
    reporter_id = auth.uid() OR 
    approver_id = auth.uid() OR 
    fn_is_admin() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('student_council', 'building_supervisor', 'grade_supervisor')
  );

DROP POLICY IF EXISTS "rls_area_evals_update" ON public.area_evaluations;
CREATE POLICY "rls_area_evals_update" 
  ON public.area_evaluations FOR UPDATE 
  USING (
    evaluator_id = auth.uid() OR 
    reporter_id = auth.uid() OR 
    approver_id = auth.uid() OR 
    fn_is_admin() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('student_council', 'homeroom_teacher', 'building_supervisor', 'grade_supervisor')
  );
