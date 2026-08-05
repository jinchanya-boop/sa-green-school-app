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

  console.log(`Found ${students.length} students with accounts. Updating passwords...`);
  
  let success = 0;
  let failed = 0;

  for (const st of students) {
    // Determine the identifier used as password
    const identifier = st.national_id || st.student_number;
    let newPassword = identifier.length < 6 ? `${identifier}sa` : identifier;

    // Supabase requires minimum 6 characters. If it's still less than 6, append more 'sa' or pad it
    while (newPassword.length < 6) {
      newPassword += 'sa';
    }

    const { error } = await supabase.auth.admin.updateUserById(st.profile_id, {
      password: newPassword
    });

    if (error) {
      console.error(`Failed to update ${st.national_id}:`, error.message);
      failed++;
    } else {
      success++;
    }
  }

  console.log(`Done! Successfully updated ${success} students. Failed: ${failed}`);
}

run();
