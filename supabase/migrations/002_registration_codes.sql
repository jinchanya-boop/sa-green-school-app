-- Create registration_codes table
CREATE TABLE public.registration_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  role_to_grant user_role NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.registration_codes IS 'รหัสสำหรับการสมัครสมาชิกด้วยตัวเอง เพื่อให้ได้รับสิทธิ์ตามที่กำหนด';

-- Insert default codes
INSERT INTO public.registration_codes (code, role_to_grant) VALUES
('CLASSREP2026', 'class_representative'),
('COUNCIL2026', 'student_council');

-- Enable RLS
ALTER TABLE public.registration_codes ENABLE ROW LEVEL SECURITY;

-- Allow reading active codes for everyone (so we can validate them on the client if needed, though we will do it via RPC for security, let's keep it restricted)
-- Actually, we don't want people guessing codes by listing them. No read policies for anon/authenticated!
CREATE POLICY "Admin can manage registration codes" 
  ON public.registration_codes FOR ALL 
  USING (fn_is_admin());

-- Create RPC to use a registration code
CREATE OR REPLACE FUNCTION fn_use_registration_code(p_code TEXT, p_room_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
  v_homeroom_id UUID;
  v_user_id UUID;
BEGIN
  -- 1. Get the current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Verify the code
  SELECT role_to_grant INTO v_role
  FROM registration_codes
  WHERE code = p_code AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or inactive registration code';
  END IF;

  -- 3. If class_rep, find the homeroom_id from room_id
  IF v_role = 'class_representative' AND p_room_id IS NOT NULL THEN
    SELECT id INTO v_homeroom_id
    FROM homerooms
    WHERE room_id = p_room_id;
  END IF;

  -- 4. Update the profile
  UPDATE profiles
  SET 
    role = v_role,
    homeroom_id = COALESCE(v_homeroom_id, homeroom_id)
  WHERE id = v_user_id;

  RETURN TRUE;
END;
$$;
