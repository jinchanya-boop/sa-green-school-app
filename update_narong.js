require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: profile } = await supabase.from('profiles').select('*').like('full_name', '%ณรงค์ สมศักดิ์%').single();
  console.log('Profile:', profile);

  if (!profile) return;

  const { data: bldg } = await supabase.from('buildings').select('*').eq('name', 'อาคาร 5').single();
  const { data: hr } = await supabase.from('homerooms').select('*').eq('class_name', 'ม.4/2').single();

  console.log('Building:', bldg);
  console.log('Homeroom:', hr);

  if (bldg && hr) {
    const { error } = await supabase.from('profiles').update({
      building_id: bldg.id,
      homeroom_id: hr.id,
      grade_level: 4
    }).eq('id', profile.id);
    console.log('Update profile error:', error);

    const { error: hrError } = await supabase.from('homeroom_teachers').upsert({
      homeroom_id: hr.id,
      teacher_id: profile.id,
      is_primary: true
    }, { onConflict: 'homeroom_id, teacher_id' });
    console.log('Upsert homeroom_teacher error:', hrError);
  }
}
run();
