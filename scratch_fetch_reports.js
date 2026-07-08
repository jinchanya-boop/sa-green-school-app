const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: activeSemester } = await supabase.from('semesters').select('*').eq('is_active', true).single();
  if (!activeSemester) return console.log("No active semester");

  // Fetch approved classroom evals
  const { data: classroomEvals } = await supabase
    .from('v_classroom_evaluations_full')
    .select('*')
    .eq('status', 'approved')
    .eq('semester_id', activeSemester.id);
  
  // Fetch approved area evals
  const { data: areaEvals } = await supabase
    .from('v_area_evaluations_full')
    .select('*')
    .eq('status', 'approved')
    .eq('semester_id', activeSemester.id);

  console.log("Classroom Evals:", classroomEvals?.length);
  console.log("Area Evals:", areaEvals?.length);

  // Grouping logic ...
}
run();
