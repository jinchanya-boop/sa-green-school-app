require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: profiles } = await supabase.from('profiles').select('id, full_name, role, building_id, grade_level, homeroom_id');
  console.log('Profiles:', profiles.find(p => p.full_name && p.full_name.includes('ณรงค์')));
  console.log('All names:', profiles.map(p => p.full_name).filter(Boolean));
}
run();
