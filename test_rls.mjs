import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkTableRLS(tableName) {
  // We try to insert an empty object.
  // If RLS is enabled and we have no policy, it fails with code '42501' (new row violates row-level security policy)
  // If RLS is disabled, it will either succeed or fail with a constraint error (e.g., '23502' not null violation).
  const { error } = await supabase.from(tableName).insert({}).select();
  
  if (!error) {
    return "RLS Disabled (Insert Succeeded)";
  }
  
  if (error.code === '42501') {
    return "RLS Enabled (Blocked by Policy)";
  }
  
  if (error.code === '23502' || error.code === '23503' || error.code === '22P02') {
    // Constraint violations mean the query reached the table, so RLS didn't block it!
    return `RLS Disabled (Constraint Error: ${error.message})`;
  }
  
  return `Unknown (${error.code}: ${error.message})`;
}

async function run() {
  const tables = [
  'area_evaluation_items', 'floors', 'certificates', 'homeroom_teachers',
  'evaluation_photos', 'homeroom_semester_scores', 'classroom_evaluations',
  'area_evaluations', 'profiles', 'semesters', 'student_water_bottle_statuses',
  'notification_preferences', 'registration_codes', 'grade_supervisors',
  'announcements', 'students', 'academic_years', 'classroom_evaluation_items',
  'evaluation_criteria', 'system_settings', 'buildings', 'cert_center_templates',
  'responsible_areas', 'homerooms', 'cert_center_issued', 'certificate_templates',
  'notifications', 'audit_logs', 'rooms', 'water_bottle_records'
  ];
  
  for (const table of tables) {
    const status = await checkTableRLS(table);
    if (!status.includes("RLS Enabled")) {
      console.log(`Table ${table}: ${status}`);
    }
  }
}

run();
