import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log("Starting password reset...");
  
  // 1. Get all users
  const { data: usersData, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (authError) {
    console.error("Error fetching users:", authError);
    return;
  }
  
  const users = usersData.users;
  let resetCount = 0;
  
  for (const user of users) {
    // If it's a student (e.g. 5 digits or starts with sa), we don't reset.
    // Wait, let's just check the profiles table!
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (profile && profile.role !== 'student' && profile.role !== 'guest') {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: '1234sa' }
      );
      if (!updateError) {
        resetCount++;
        console.log(`Reset password for ${user.email} (Role: ${profile.role})`);
      } else {
        console.error(`Failed for ${user.email}:`, updateError.message);
      }
    }
  }

  console.log(`Successfully reset passwords for ${resetCount} teachers/admins to '1234'.`);
}

main().catch(console.error);
