// ============================================================
// Sa Green School — Database Backup Script
// วันที่: 21 สิงหาคม 2569
// READ-ONLY: ไม่มีการแก้ไข ลบ หรือเปลี่ยนแปลงข้อมูลใดๆ
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BACKUP_DIR = "D:\\jinchanya\\ระบบงานสิ่งแวดล้อมสา\\sa-green-school-backup\\2569-08-21_backup\\database";

const TABLES = [
  "academic_years",
  "semesters",
  "buildings",
  "floors",
  "rooms",
  "homerooms",
  "profiles",
  "homeroom_teachers",
  "grade_supervisors",
  "students",
  "evaluation_criteria",
  "responsible_areas",
  "area_evaluations",
  "area_evaluation_items",
  "classroom_evaluations",
  "classroom_evaluation_items",
  "evaluation_photos",
  "water_bottle_records",
  "student_water_bottle_statuses",
  "certificate_templates",
  "certificates",
  "cert_center_templates",
  "cert_center_certificates",
  "cert_center_numbers",
  "cert_center_logs",
  "notifications",
  "notification_preferences",
  "announcements",
  "audit_logs",
  "system_settings",
  "homeroom_semester_scores",
];

// Convert JSON array to CSV
function jsonToCSV(data) {
  if (!data || data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return "";
        const str = typeof val === "object" ? JSON.stringify(val) : String(val);
        // Escape quotes and wrap in quotes if contains comma/newline
        if (str.includes(",") || str.includes("\n") || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

// Fetch ALL rows from a table (paginate in batches of 1000)
async function fetchAllRows(tableName) {
  const allRows = [];
  let from = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error, count } = await supabase
      .from(tableName)
      .select("*", { count: "exact" })
      .range(from, from + batchSize - 1);

    if (error) {
      throw new Error(`Error fetching ${tableName}: ${error.message}`);
    }

    if (data && data.length > 0) {
      allRows.push(...data);
      from += batchSize;
      hasMore = data.length === batchSize;
    } else {
      hasMore = false;
    }
  }

  return allRows;
}

async function backupTable(tableName, summary) {
  process.stdout.write(`  ⏳ ${tableName}... `);

  try {
    const rows = await fetchAllRows(tableName);
    const count = rows.length;

    // Save JSON
    const jsonPath = join(BACKUP_DIR, `${tableName}.json`);
    writeFileSync(jsonPath, JSON.stringify(rows, null, 2), "utf8");

    // Save CSV
    const csvPath = join(BACKUP_DIR, `${tableName}.csv`);
    writeFileSync(csvPath, jsonToCSV(rows), "utf8");

    summary[tableName] = { count, status: "success" };
    console.log(`✅ ${count} records`);
    return count;
  } catch (err) {
    summary[tableName] = { count: 0, status: "error", error: err.message };
    console.log(`❌ ERROR: ${err.message}`);
    return 0;
  }
}

// Try to get auth users list (email only — no passwords)
async function backupAuthUsers(summary) {
  process.stdout.write(`  ⏳ auth.users (email only)... `);
  try {
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw new Error(error.message);

    const safeUsers = (data?.users || []).map((u) => ({
      id: u.id,
      email: u.email,
      email_confirmed_at: u.email_confirmed_at,
      created_at: u.created_at,
      updated_at: u.updated_at,
      last_sign_in_at: u.last_sign_in_at,
      role: u.role,
      user_metadata: u.user_metadata,
      // NOTE: password_hash is NOT available — Supabase does not expose it
    }));

    const count = safeUsers.length;
    writeFileSync(join(BACKUP_DIR, "auth_users_metadata.json"), JSON.stringify(safeUsers, null, 2), "utf8");
    summary["auth.users (metadata only)"] = { count, status: "success", note: "Password hash NOT available — Supabase restriction" };
    console.log(`✅ ${count} users (email/metadata only — NO password hash)`);
    return count;
  } catch (err) {
    summary["auth.users (metadata only)"] = { count: 0, status: "error", error: err.message };
    console.log(`❌ ERROR: ${err.message}`);
    return 0;
  }
}

async function main() {
  const startTime = new Date();
  console.log("============================================================");
  console.log("  Sa Green School — Database Backup");
  console.log(`  Started: ${startTime.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}`);
  console.log("  Mode: READ-ONLY (ไม่มีการแก้ไขข้อมูล)");
  console.log("============================================================\n");

  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const summary = {};
  let totalRecords = 0;

  // Backup all tables
  console.log("📊 กำลัง Backup ตารางข้อมูล...\n");
  for (const table of TABLES) {
    const count = await backupTable(table, summary);
    totalRecords += count;
  }

  // Backup auth.users metadata
  console.log("\n🔐 กำลัง Backup Auth User Metadata...\n");
  await backupAuthUsers(summary);

  const endTime = new Date();
  const durationMs = endTime - startTime;

  // Write summary
  const summaryData = {
    backup_timestamp: startTime.toISOString(),
    backup_completed_at: endTime.toISOString(),
    duration_seconds: Math.round(durationMs / 1000),
    supabase_project_id: SUPABASE_URL.match(/https:\/\/([^.]+)\./)?.[1] || "unknown",
    total_tables: TABLES.length,
    total_records: totalRecords,
    tables: summary,
    notes: [
      "Password hashes of auth.users are NOT available — Supabase does not expose them",
      "This is a READ-ONLY backup — no data was modified",
    ],
  };

  writeFileSync(join(BACKUP_DIR, "_summary.json"), JSON.stringify(summaryData, null, 2), "utf8");

  console.log("\n============================================================");
  console.log(`  ✅ Database Backup สมบูรณ์`);
  console.log(`  📁 Location: ${BACKUP_DIR}`);
  console.log(`  📊 ตาราง: ${TABLES.length} tables`);
  console.log(`  📈 Total Records: ${totalRecords.toLocaleString()}`);
  console.log(`  ⏱️  ใช้เวลา: ${Math.round(durationMs / 1000)} seconds`);
  console.log("============================================================\n");

  // Print table summary
  console.log("📋 สรุปรายตาราง:");
  for (const [table, info] of Object.entries(summary)) {
    const icon = info.status === "success" ? "✅" : "❌";
    const note = info.note ? ` ⚠️ ${info.note}` : "";
    console.log(`  ${icon} ${table}: ${info.count} records${note}`);
  }
}

main().catch((err) => {
  console.error("\n❌ Backup failed:", err);
  process.exit(1);
});
