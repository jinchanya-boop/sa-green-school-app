import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Fetching all students...");
  const { data: students, error: fetchError } = await supabase
    .from('students')
    .select('profile_id, national_id, student_number')
    .not('profile_id', 'is', null);

  if (fetchError) {
    console.error("Error fetching students:", fetchError);
    return;
  }

  console.log(`Found ${students.length} students with accounts. Updating passwords to sa1234...`);
  
  let success = 0;
  let failed = 0;

  for (const st of students) {
    const { error } = await supabase.auth.admin.updateUserById(st.profile_id, {
      password: "sa1234"
    });

    if (error) {
      console.error(`Failed to update ${st.national_id}:`, error.message);
      failed++;
    } else {
      success++;
    }
  }

  console.log(`Done! Successfully updated ${success} students to use sa1234. Failed: ${failed}`);
}

run();
