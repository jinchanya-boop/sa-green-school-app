-- ============================================================
-- Sa Green School Management System
-- Module 1 Updates (Responsible Area Evaluation)
-- ============================================================

-- 1. Add photo_category to evaluation_photos
ALTER TABLE evaluation_photos
ADD COLUMN IF NOT EXISTS photo_category TEXT CHECK (photo_category IN ('before', 'after', 'other'));

-- 2. Update Evaluation Criteria for Module A (Area)
-- Remove old area criteria
DELETE FROM evaluation_criteria WHERE module = 'area';

-- Insert new 4 criteria for Module A
INSERT INTO evaluation_criteria (module, name, description, max_score, sort_order) VALUES
('area', 'ไม่มีขยะ', 'No Garbage', 3.0, 1),
('area', 'การมีส่วนร่วมของนักเรียน', 'Student Participation', 3.0, 2),
('area', 'การจัดเก็บอุปกรณ์', 'Equipment Organization', 3.0, 3),
('area', 'การทำความสะอาดประจำวัน', 'Daily Cleaning', 3.0, 4);

-- 3. Create Storage Bucket for Photos
-- This requires Supabase Storage schema to be available. 
-- In the Supabase SQL editor, the `storage.buckets` table exists.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('evaluation-photos', 'evaluation-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage Policies
-- Allow public access to view photos
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'evaluation-photos');

-- Allow authenticated users to upload photos
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'evaluation-photos' AND auth.role() = 'authenticated'
);

-- Allow users to update their own photos
CREATE POLICY "Auth Update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'evaluation-photos' AND auth.uid() = owner
);

-- Allow users to delete their own photos
CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'evaluation-photos' AND auth.uid() = owner
);
