import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  const { data: homerooms } = await supabase.from('homerooms').select('*');
  console.log("Homerooms:", homerooms?.map(h => h.class_name));

  if (!homerooms || homerooms.length === 0) return;

  const m11 = homerooms.find(h => h.class_name === 'ม.1/1');
  if (m11) {
    const mockStudents = [
      { homeroom_id: m11.id, student_number: 1, first_name: 'ด.ช.สมชาย', last_name: 'เรียนดี', gender: 'male' },
      { homeroom_id: m11.id, student_number: 2, first_name: 'ด.ญ.สมหญิง', last_name: 'รักเรียน', gender: 'female' },
      { homeroom_id: m11.id, student_number: 3, first_name: 'ด.ช.มานะ', last_name: 'อดทน', gender: 'male' },
      { homeroom_id: m11.id, student_number: 4, first_name: 'ด.ญ.มานี', last_name: 'มีชัย', gender: 'female' },
      { homeroom_id: m11.id, student_number: 5, first_name: 'ด.ช.ปิติ', last_name: 'รักโลก', gender: 'male' },
    ];
    
    // check if exists
    const { data: existing } = await supabase.from('students').select('*').eq('homeroom_id', m11.id);
    if (existing && existing.length > 0) {
      console.log(`Found ${existing.length} students in ม.1/1`);
    } else {
      const { error } = await supabase.from('students').insert(mockStudents);
      if (error) console.error("Error inserting students:", error);
      else console.log("Successfully added 5 students to ม.1/1");
    }
  }

  const m12 = homerooms.find(h => h.class_name === 'ห้อง 102 (ม.1/2)' || h.class_name === 'ม.1/2');
  if (m12) {
    const mockStudents2 = [
      { homeroom_id: m12.id, student_number: 1, first_name: 'ด.ช.สุดหล่อ', last_name: 'สะอาด', gender: 'male' },
      { homeroom_id: m12.id, student_number: 2, first_name: 'ด.ญ.สวยงาม', last_name: 'เรียบร้อย', gender: 'female' },
    ];
    const { data: existing2 } = await supabase.from('students').select('*').eq('homeroom_id', m12.id);
    if (!existing2 || existing2.length === 0) {
      const { error } = await supabase.from('students').insert(mockStudents2);
      if (error) console.error("Error inserting students to m1/2:", error);
      else console.log("Successfully added 2 students to ม.1/2");
    }
  }
}

run();
