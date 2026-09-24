// Script to verify water bottle rankings for Senior (ม.ปลาย) level
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

console.log("=== ตรวจสอบ Rankings แชมป์แก้วน้ำ ม.ปลาย (Senior) ===\n");

// 1. Get active semester
const { data: semester, error: semErr } = await supabase
  .from("semesters")
  .select("*")
  .eq("is_active", true)
  .single();

if (semErr || !semester) {
  console.log("ไม่พบ semester ที่ active:", semErr?.message);
  process.exit(1);
}
console.log("Active Semester:", semester.id, JSON.stringify(semester), "\n");

// 2. Get Senior homerooms (grade_level 4,5,6)
const { data: homerooms, error: hrErr } = await supabase
  .from("homerooms")
  .select("id, class_name, grade_level, class_number, rooms(buildings(name))")
  .eq("is_active", true)
  .in("grade_level", [4, 5, 6])
  .order("grade_level")
  .order("class_number");

if (hrErr) {
  console.log("ไม่สามารถดึง homerooms:", hrErr.message);
  process.exit(1);
}
console.log("Senior Homerooms (ม.4-6):", homerooms.length, "ห้อง");
homerooms.forEach(hr => console.log(" -", hr.class_name, "grade_level:", hr.grade_level, "id:", hr.id));

// 3. Get water bottle records for active semester (approved only)
const { data: waterRecords, error: wrErr } = await supabase
  .from("water_bottle_records")
  .select("id, homeroom_id, check_date, percentage, status")
  .eq("status", "approved")
  .eq("semester_id", semester.id);

if (wrErr) {
  console.log("ไม่สามารถดึง water records:", wrErr.message);
  process.exit(1);
}
console.log("\nWater Bottle Records (approved, semester):", waterRecords.length, "รายการ");

// 4. Calculate rankings
const hrMap = new Map();
waterRecords.forEach(r => {
  const hrId = r.homeroom_id;
  if (hrId) {
    if (!hrMap.has(hrId)) hrMap.set(hrId, []);
    hrMap.get(hrId).push(r);
  }
});

const rankingsData = homerooms.map(hr => {
  const recs = hrMap.get(hr.id) || [];
  const totalChecks = recs.length;
  const avgPercentage = totalChecks > 0
    ? recs.reduce((sum, r) => sum + (r.percentage || 0), 0) / totalChecks
    : 0;
  return {
    id: hr.id,
    class: hr.class_name,
    grade_level: hr.grade_level,
    totalChecks,
    avgPercentage: Math.round(avgPercentage * 10) / 10,
  };
});

// Only with data, sorted by avgPercentage DESC
const withData = rankingsData.filter(r => r.totalChecks > 0);
withData.sort((a, b) => b.avgPercentage - a.avgPercentage);
const ranked = withData.map((data, index) => ({ ...data, rank: index + 1 }));

console.log("\n=== ผลการจัดอันดับ แชมป์แก้วน้ำ ม.ปลาย ===");
ranked.forEach(r => {
  const medal = r.rank === 1 ? "[1st]" : r.rank === 2 ? "[2nd]" : r.rank === 3 ? "[3rd]" : `[#${r.rank}]`;
  console.log(medal, r.class, "| เฉลี่ย:", r.avgPercentage.toFixed(1) + "%", "| จำนวน:", r.totalChecks, "ครั้ง");
});

// 5. Homerooms with NO data
const noData = homerooms.filter(hr => !hrMap.has(hr.id) || hrMap.get(hr.id).length === 0);
if (noData.length > 0) {
  console.log("\nห้องที่ไม่มีข้อมูล (ไม่แสดงในอันดับ):");
  noData.forEach(hr => console.log(" -", hr.class_name));
}

// 6. Details of top 3
console.log("\n=== รายละเอียด Top 3 ===");
for (const r of ranked.slice(0, 3)) {
  const recs = hrMap.get(r.id) || [];
  console.log("\nอันดับ", r.rank, r.class, "(เฉลี่ย", r.avgPercentage.toFixed(1) + "%)");
  recs.forEach(rec => console.log("  วันที่:", rec.check_date, "| ผล:", rec.percentage + "%"));
}
