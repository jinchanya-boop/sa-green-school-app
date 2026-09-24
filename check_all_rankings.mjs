// ตรวจสอบ Rankings ทุกประเภท ทุกระดับชั้น
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// =================== FETCH DATA ===================
const { data: semester } = await supabase
  .from("semesters").select("*").eq("is_active", true).single();
console.log("Semester:", semester?.id, "\n");

const [
  { data: homerooms },
  { data: waterRecords },
  { data: areaRecords },
  { data: classRecords },
  { data: responsibleAreas },
] = await Promise.all([
  supabase.from("homerooms").select("id, class_name, grade_level, class_number").eq("is_active", true).order("grade_level").order("class_number"),
  supabase.from("water_bottle_records").select("id, homeroom_id, check_date, percentage, status").eq("status", "approved").eq("semester_id", semester.id),
  supabase.from("area_evaluations").select("id, responsible_area_id, evaluated_at, percentage, status").eq("status", "approved").eq("semester_id", semester.id),
  supabase.from("classroom_evaluations").select("id, homeroom_id, evaluated_at, percentage, status").eq("status", "approved").eq("semester_id", semester.id),
  supabase.from("responsible_areas").select("id, homeroom_id"),
]);

// Map area evaluations homeroom_id
const areaMap = new Map((responsibleAreas ?? []).map(ra => [ra.id, ra.homeroom_id]));
const areaRecordsWithHrId = (areaRecords ?? []).map(r => ({
  ...r,
  homeroom_id: areaMap.get(r.responsible_area_id) || null,
}));

console.log("Raw data counts:");
console.log("  homerooms:", homerooms?.length);
console.log("  waterRecords:", waterRecords?.length);
console.log("  areaRecords:", areaRecords?.length, "-> mapped:", areaRecordsWithHrId.filter(r => r.homeroom_id).length, "have homeroom_id");
console.log("  classRecords:", classRecords?.length);
console.log("  responsibleAreas:", responsibleAreas?.length);

// =================== PROCESS RANKINGS ===================
function processRankings(records, dateField, homerooms, gradeGroup) {
  const grades = gradeGroup === "junior" ? [1,2,3] : [4,5,6];
  const filteredHr = homerooms.filter(hr => grades.includes(hr.grade_level));

  const hrMap = new Map();
  records.forEach(r => {
    const hrId = r.homeroom_id;
    if (hrId) {
      if (!hrMap.has(hrId)) hrMap.set(hrId, []);
      hrMap.get(hrId).push(r);
    }
  });

  const rankingsData = filteredHr.map(hr => {
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

  const withData = rankingsData.filter(r => r.totalChecks > 0);
  withData.sort((a, b) => b.avgPercentage - a.avgPercentage); // current logic (no tie-break)
  return withData.map((d, i) => ({ ...d, rank: i + 1 }));
}

function processRankingsTieBreak(records, dateField, homerooms, gradeGroup) {
  const grades = gradeGroup === "junior" ? [1,2,3] : [4,5,6];
  const filteredHr = homerooms.filter(hr => grades.includes(hr.grade_level));

  const hrMap = new Map();
  records.forEach(r => {
    const hrId = r.homeroom_id;
    if (hrId) {
      if (!hrMap.has(hrId)) hrMap.set(hrId, []);
      hrMap.get(hrId).push(r);
    }
  });

  const rankingsData = filteredHr.map(hr => {
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

  const withData = rankingsData.filter(r => r.totalChecks > 0);
  withData.sort((a, b) => {
    const diff = b.avgPercentage - a.avgPercentage;
    if (diff !== 0) return diff;
    return b.totalChecks - a.totalChecks; // tie-break: more checks = higher rank
  });
  return withData.map((d, i) => ({ ...d, rank: i + 1 }));
}

// =================== PRINT RESULTS ===================
function printRanking(label, current, fixed) {
  console.log(`\n========================================`);
  console.log(`${label}`);
  console.log(`========================================`);

  // Check if tie-break changes anything in top 3
  let changed = false;
  for (let i = 0; i < 3; i++) {
    if ((current[i]?.class || "") !== (fixed[i]?.class || "")) {
      changed = true;
      break;
    }
  }

  if (changed) {
    console.log("*** อันดับเปลี่ยนหลังจากแก้ Tie-Break! ***");
    console.log("\n[ปัจจุบัน (ผิด)]         [ควรเป็น (ถูก)]");
    for (let i = 0; i < Math.max(current.length, fixed.length); i++) {
      const c = current[i];
      const f = fixed[i];
      const same = c?.class === f?.class;
      const arrow = same ? "  " : "!=";
      console.log(
        `  ${(c ? `#${c.rank} ${c.class} ${c.avgPercentage}% (${c.totalChecks}ครั้ง)` : "-").padEnd(30)} ${arrow}  ${f ? `#${f.rank} ${f.class} ${f.avgPercentage}% (${f.totalChecks}ครั้ง)` : "-"}`
      );
    }
  } else {
    console.log("OK - อันดับ Top 3 ถูกต้อง (Tie-break ไม่เปลี่ยนผล)");
    current.slice(0, 5).forEach(r => {
      const medal = r.rank === 1 ? "[1st]" : r.rank === 2 ? "[2nd]" : r.rank === 3 ? "[3rd]" : `[#${r.rank}]`;
      console.log(`  ${medal} ${r.class} | ${r.avgPercentage.toFixed(1)}% | ${r.totalChecks} ครั้ง`);
    });

    // Check for ties in top 3
    const top3 = current.slice(0, 3);
    const hasTie = top3.some((r, i) => i > 0 && r.avgPercentage === top3[i-1].avgPercentage);
    if (hasTie) {
      console.log("  *** มี tie ในคะแนน แต่ tie-break โดยจำนวนครั้งให้ผลเดิม ***");
    }
  }
}

const datasets = [
  { label: "แก้วน้ำ ม.ต้น (Junior)", records: waterRecords, dateField: "check_date", group: "junior" },
  { label: "แก้วน้ำ ม.ปลาย (Senior)", records: waterRecords, dateField: "check_date", group: "senior" },
  { label: "พื้นที่รับผิดชอบ ม.ต้น (Junior)", records: areaRecordsWithHrId, dateField: "evaluated_at", group: "junior" },
  { label: "พื้นที่รับผิดชอบ ม.ปลาย (Senior)", records: areaRecordsWithHrId, dateField: "evaluated_at", group: "senior" },
  { label: "ห้องเรียนสะอาด ม.ต้น (Junior)", records: classRecords, dateField: "evaluated_at", group: "junior" },
  { label: "ห้องเรียนสะอาด ม.ปลาย (Senior)", records: classRecords, dateField: "evaluated_at", group: "senior" },
];

for (const d of datasets) {
  const current = processRankings(d.records, d.dateField, homerooms, d.group);
  const fixed = processRankingsTieBreak(d.records, d.dateField, homerooms, d.group);
  printRanking(d.label, current, fixed);
}

console.log("\n\n=== สรุป ===");
let totalIssues = 0;
for (const d of datasets) {
  const current = processRankings(d.records, d.dateField, homerooms, d.group);
  const fixed = processRankingsTieBreak(d.records, d.dateField, homerooms, d.group);
  let changed = false;
  for (let i = 0; i < 3; i++) {
    if ((current[i]?.class || "") !== (fixed[i]?.class || "")) { changed = true; break; }
  }
  console.log(`${changed ? "CHANGED" : "OK    "} - ${d.label}`);
  if (changed) totalIssues++;
}
console.log(`\nรวม: พบ ${totalIssues} ประเภทที่อันดับเปลี่ยนเมื่อใช้ tie-break ที่ถูกต้อง`);
