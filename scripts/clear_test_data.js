require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function clearTestData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🗑️ กำลังลบข้อมูลทดสอบในระบบ...');

  try {
    // ลบข้อมูลการตรวจแก้วน้ำ
    console.log('- ลบข้อมูลตรวจแก้วน้ำ...');
    const { error: waterError } = await supabase.from('water_bottle_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (waterError) throw waterError;

    // ลบข้อมูลประเมินพื้นที่
    console.log('- ลบข้อมูลประเมินพื้นที่รับผิดชอบ...');
    const { error: areaError } = await supabase.from('area_evaluations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (areaError) throw areaError;

    // ลบข้อมูลประเมินห้องเรียน
    console.log('- ลบข้อมูลประเมินความสะอาดห้องเรียน...');
    const { error: classError } = await supabase.from('classroom_evaluations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (classError) throw classError;

    // ลบข้อมูลคะแนนสรุปรวม (Rankings)
    console.log('- ล้างข้อมูลกระดานจัดอันดับ...');
    const { error: scoreError } = await supabase.from('homeroom_semester_scores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (scoreError) throw scoreError;

    console.log('✅ ลบข้อมูลทดสอบเรียบร้อยแล้ว! ระบบพร้อมสำหรับการใช้งานจริงครับ');
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  }
}

clearTestData();
