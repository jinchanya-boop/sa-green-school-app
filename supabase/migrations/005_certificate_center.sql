-- Certificate Center Schema

CREATE TABLE cert_center_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    background_url TEXT NOT NULL,
    layout_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE cert_center_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_number TEXT UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id),
    template_id UUID NOT NULL REFERENCES cert_center_templates(id),
    award_type TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    semester TEXT NOT NULL,
    qr_code_data TEXT NOT NULL,
    pdf_url TEXT,
    issued_by UUID NOT NULL REFERENCES profiles(id),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE cert_center_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_number TEXT UNIQUE NOT NULL,
    academic_year TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Used')),
    issued_at TIMESTAMP WITH TIME ZONE,
    issued_by UUID REFERENCES profiles(id),
    student_id UUID REFERENCES students(id),
    certificate_id UUID REFERENCES cert_center_certificates(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE cert_center_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    certificate_number TEXT,
    student_id UUID,
    issued_by UUID REFERENCES profiles(id),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE cert_center_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cert_center_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cert_center_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cert_center_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated users to read templates" ON cert_center_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admins to manage templates" ON cert_center_templates FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'administrator'));

CREATE POLICY "Allow all authenticated users to read certificates" ON cert_center_certificates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow teachers to insert certificates" ON cert_center_certificates FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('administrator', 'director', 'deputy_director', 'homeroom_teacher', 'grade_supervisor')));

CREATE POLICY "Allow authorized to read cert numbers" ON cert_center_numbers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('administrator', 'director', 'deputy_director', 'homeroom_teacher', 'grade_supervisor')));
CREATE POLICY "Allow admins to manage cert numbers" ON cert_center_numbers FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'administrator'));
CREATE POLICY "Allow teachers to update cert numbers to used" ON cert_center_numbers FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('administrator', 'director', 'deputy_director', 'homeroom_teacher', 'grade_supervisor')));

CREATE POLICY "Allow all to insert logs" ON cert_center_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow all to read logs" ON cert_center_logs FOR SELECT TO authenticated USING (true);
