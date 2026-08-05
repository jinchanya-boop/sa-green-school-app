const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const adminAuthClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetPasswords() {
  console.log("กำลังดึงรายชื่อผู้ใช้งานทั้งหมด...");
  let allUsers = [];
  let page = 1;
  let hasMore = true;

  // ดึงรายชื่อ users ทั้งหมด (รองรับกรณีมีเยอะๆ จะดึงมาทีละหน้า)
  while (hasMore) {
    const { data, error } = await adminAuthClient.auth.admin.listUsers({
      page: page,
      perPage: 1000
    });

    if (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
      return;
    }

    allUsers = [...allUsers, ...data.users];
    
    if (data.users.length < 1000) {
      hasMore = false;
    } else {
      page++;
    }
  }

  // กรองเอาเฉพาะอีเมลของนักเรียน (ที่ลงท้ายด้วย @sa.ac.th)
  // หากมีครูใช้อีเมลนี้ด้วย จะโดนเปลี่ยนรหัสด้วย ถ้าต้องการเจาะจงเฉพาะนักเรียน ให้ตรวจสอบเงื่อนไขเพิ่มเติม
  const students = allUsers.filter(user => user.email && user.email.endsWith('@sa.ac.th'));
  
  console.log(`พบผู้ใช้งานนักเรียนทั้งหมด ${students.length} คน (ที่ลงท้ายด้วย @sa.ac.th)`);
  console.log("กำลังเริ่มเปลี่ยนรหัสผ่านเป็น sa1234...");

  let successCount = 0;
  let errorCount = 0;

  for (const student of students) {
    const { error } = await adminAuthClient.auth.admin.updateUserById(
      student.id,
      { password: 'sa1234' }
    );

    if (error) {
      console.error(`เปลี่ยนรหัสผ่านไม่สำเร็จสำหรับ ${student.email}:`, error.message);
      errorCount++;
    } else {
      console.log(`✅ อัพเดทรหัสผ่านสำเร็จ: ${student.email}`);
      successCount++;
    }
  }

  console.log("===============================");
  console.log(`เสร็จสิ้น! อัพเดทสำเร็จ: ${successCount} คน, ล้มเหลว: ${errorCount} คน`);
}

resetPasswords();
