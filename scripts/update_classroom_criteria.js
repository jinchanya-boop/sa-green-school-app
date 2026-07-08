require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function updateClassroomCriteria() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🗑️ กำลังลบเกณฑ์การประเมินห้องเรียนแบบเก่า...');
  const { error: delError } = await supabase.from('evaluation_criteria').delete().eq('module', 'classroom');
  
  if (delError) {
    console.error('❌ เกิดข้อผิดพลาดในการลบ:', delError);
    return;
  }

  console.log('✨ กำลังเพิ่มเกณฑ์การประเมินห้องเรียนแบบใหม่ (10 ข้อ)...');
  const newCriteria = [
    { module: 'classroom', name: 'การจัดวางรองเท้าหน้าชั้นเรียน', description: 'การจัดวางรองเท้าหน้าชั้นเรียนอย่างเป็นระเบียบเรียบร้อย', max_score: 3, sort_order: 1 },
    { module: 'classroom', name: 'ความสะอาดของพื้นห้อง', description: 'ความสะอาดของพื้นห้องและทางเดินหน้าห้องเรียน', max_score: 3, sort_order: 2 },
    { module: 'classroom', name: 'การจัดโต๊ะเก้าอี้', description: 'การจัดโต๊ะ/เก้าอี้/โต๊ะครูเป็นระเบียบเรียบร้อย', max_score: 3, sort_order: 3 },
    { module: 'classroom', name: 'ความสะอาดของผนังและเพดาน', description: 'ความสะอาดของผนัง/ฝ้าเพดาน/การกำจัดหยากไย่', max_score: 3, sort_order: 4 },
    { module: 'classroom', name: 'ความสะอาดของกระดาน', description: 'ความสะอาดของกระดาน', max_score: 3, sort_order: 5 },
    { module: 'classroom', name: 'การทิ้งและแยกขยะ', description: 'การทิ้งขยะ(แยกขยะ)และเก็บอุปกรณ์ทำความสะอาด', max_score: 3, sort_order: 6 },
    { module: 'classroom', name: 'ที่วางโทรศัพท์', description: 'ที่วางโทรศัพท์อยู่ในสภาพดีและใช้งานได้', max_score: 3, sort_order: 7 },
    { module: 'classroom', name: 'ป้ายนิเทศ', description: 'มีป้ายนิเทศที่เหมาะสมหรือทันเหตุการณ์', max_score: 3, sort_order: 8 },
    { module: 'classroom', name: 'การเก็บรักษาเครื่องใช้ไฟฟ้า', description: 'การเก็บรักษาอุปกรณ์และเครื่องใช้ไฟฟ้าในห้องเรียน (TV/สายHDML/รีโมทTV)', max_score: 3, sort_order: 9 },
    { module: 'classroom', name: 'การปิดเครื่องใช้ไฟฟ้า', description: 'ปิดไฟ ปิดพัดลม เครื่องใช้ไฟฟ้าหลังใช้งาน', max_score: 3, sort_order: 10 }
  ];

  const { error: insError } = await supabase.from('evaluation_criteria').insert(newCriteria);

  if (insError) {
    console.error('❌ เกิดข้อผิดพลาดในการเพิ่มเกณฑ์ใหม่:', insError);
  } else {
    console.log('✅ อัปเดตเกณฑ์การประเมินสำเร็จ!');
  }
}

updateClassroomCriteria();
