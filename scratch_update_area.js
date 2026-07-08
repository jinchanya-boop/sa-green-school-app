const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  await supabase.from("evaluation_criteria").delete().eq("module", "area");
  const newCriteria = [
    { module: "area", name: "ไม่มีขยะในบริเวณพื้นที่", description: "สะอาดเรียบร้อย 100% ไม่มีเศษขยะ ใบไม้แห้ง ตกค้างหรือน้ำขัง", max_score: 3, sort_order: 1 },
    { module: "area", name: "นักเรียนทุกคนมีส่วนร่วม", description: "นักเรียนในกลุ่มเวรมาพร้อมเพรียงกัน สามัคคี แบ่งงานชัดเจน", max_score: 3, sort_order: 2 },
    { module: "area", name: "เก็บรักษาอุปกรณ์เป็นระเบียบ", description: "อุปกรณ์ทุกชิ้นทำความสะอาด และจัดวางเรียงประเภทเรียบร้อย", max_score: 3, sort_order: 3 },
    { module: "area", name: "ลงพื้นที่เป็นประจำวัน", description: "ปฏิบัติหน้าที่ตรงเวลา สม่ำเสมอครบถ้วน ทั้งรอบเช้าและรอบเย็น", max_score: 3, sort_order: 4 },
  ];
  const { error } = await supabase.from("evaluation_criteria").insert(newCriteria);
  if (error) console.error(error);
  else console.log("Success");
}
run();
