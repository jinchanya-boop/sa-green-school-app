require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const xlsx = require('xlsx');

async function importTeachers() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  console.log('Reading teacher69.xlsx...');
  const wb = xlsx.readFile('teacher69.xlsx');
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  console.log(`Found ${data.length} records in Excel.`);
  let successCount = 0;
  let failCount = 0;

  for (const row of data) {
    const fullName = row.name || row['ชื่อ-นามสกุล'] || '';
    const username = row.username || '';
    const password = row.password ? String(row.password) : '123456';
    const position = row.position || '';

    if (!fullName || !username) {
      console.log(`Skipping invalid row: ${JSON.stringify(row)}`);
      failCount++;
      continue;
    }

    // Generate email from username
    const email = `${username}@sa.ac.th`;
    const role = position.includes('ครู') || position.includes('teacher') ? 'homeroom_teacher' : 'guest';

    // 1. Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`User ${username} already exists, skipping.`);
      } else {
        console.error(`Failed to create ${fullName}:`, authError.message);
        failCount++;
      }
      continue;
    }

    // Note: The profiles table might be automatically populated by a database trigger 
    // when a user is created in auth.users. But let's make sure it has the correct role.
    if (authUser?.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          role: role
        })
        .eq('id', authUser.user.id);

      if (profileError) {
         console.error(`Failed to update profile for ${fullName}:`, profileError.message);
      }
    }

    console.log(`Successfully added teacher: ${fullName} (${username})`);
    successCount++;
  }

  console.log(`\nImport complete! Added ${successCount} teachers. Failed: ${failCount}`);
}

importTeachers();
