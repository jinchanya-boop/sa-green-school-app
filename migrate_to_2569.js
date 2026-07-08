require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function migrateTo2569() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Get Academic Year 2569 and 2567
  const { data: years } = await supabase.from('academic_years').select('id, year');
  const year2569 = years.find(y => y.year === 2569);
  const year2567 = years.find(y => y.year === 2567);

  if (!year2569 || !year2567) {
    console.error('Could not find both 2567 and 2569 academic years');
    return;
  }

  // 2. Fetch all homerooms
  const { data: homerooms } = await supabase.from('homerooms').select('*');
  const hr2569 = homerooms.filter(h => h.academic_year_id === year2569.id);
  const hr2567 = homerooms.filter(h => h.academic_year_id === year2567.id);

  console.log(`Found ${hr2567.length} homerooms in 2567, and ${hr2569.length} homerooms in 2569.`);

  const hr2569Map = {};
  hr2569.forEach(h => {
    hr2569Map[h.class_name] = h.id;
  });

  // 3. Process each 2567 homeroom
  for (const h2567 of hr2567) {
    if (hr2569Map[h2567.class_name]) {
      // 2569 already has this class name!
      // Move any students from the 2567 room to the 2569 room
      const targetId = hr2569Map[h2567.class_name];
      
      const { data: students, error: studentErr } = await supabase
        .from('students')
        .update({ homeroom_id: targetId })
        .eq('homeroom_id', h2567.id)
        .select();
        
      if (!studentErr && students.length > 0) {
         console.log(`Moved ${students.length} students in ${h2567.class_name} to 2569.`);
      }

      // Move homeroom_teachers if any
      await supabase.from('homeroom_teachers').update({ homeroom_id: targetId }).eq('homeroom_id', h2567.id);

      // Delete the 2567 homeroom
      await supabase.from('homerooms').delete().eq('id', h2567.id);
      console.log(`Deleted duplicate 2567 homeroom: ${h2567.class_name}`);
      
    } else {
      // 2569 does not have this class name. Just move this homeroom to 2569.
      const { error } = await supabase
        .from('homerooms')
        .update({ academic_year_id: year2569.id })
        .eq('id', h2567.id);
        
      if (!error) {
        console.log(`Updated homeroom ${h2567.class_name} to be in 2569.`);
      } else {
        console.error(`Error updating ${h2567.class_name}:`, error.message);
      }
    }
  }

  console.log('Migration complete. All homerooms and students are now in year 2569.');
}

migrateTo2569();
