import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wskvhtpkzfgcyzpjhcmj.supabase.co',
  'sb_secret_YlZ6k49fkMIUu4dyOPDpmA_9hIP69k-' 
);

async function cleanDuplicates() {
  let allStudents = [];
  let from = 0;
  const step = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('id')
      .range(from, from + step - 1);

    if (error) break;
    if (!data || data.length === 0) break;
    allStudents = [...allStudents, ...data];
    if (data.length < step) break;
    from += step;
  }

  const map = new Map();
  const idsToDelete = [];

  for (const s of allStudents) {
    const key = `${s.first_name}-${s.last_name}-${s.homeroom_id}`;
    if (map.has(key)) {
      idsToDelete.push(s.id);
    } else {
      map.set(key, s.id);
    }
  }

  console.log(`Duplicates to delete: ${idsToDelete.length}`);
  let successCount = 0;

  for (const oldId of idsToDelete) {
    // 1. Delete water bottle statuses for the duplicate
    await supabase.from('student_water_bottle_statuses').delete().eq('student_id', oldId);
    
    // 2. Delete area evaluations for the duplicate (if any)
    await supabase.from('area_evaluation_results').delete().eq('evaluator_id', oldId);
    await supabase.from('area_evaluation_results').delete().eq('student_id', oldId);
    
    // 3. Delete student evaluations (if any)
    await supabase.from('student_evaluations').delete().eq('student_id', oldId);

    // 4. Finally, delete the student
    const { error } = await supabase.from('students').delete().eq('id', oldId);
      
    if (error) {
      console.error(`Failed to delete duplicate ${oldId}:`, error.message);
    } else {
      successCount++;
    }
  }

  console.log(`Successfully deleted ${successCount} duplicate students.`);
}

cleanDuplicates();
