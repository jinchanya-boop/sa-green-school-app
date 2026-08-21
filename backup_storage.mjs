// ============================================================
// Sa Green School — Supabase Storage Backup Script
// วันที่: 21 สิงหาคม 2569
// READ-ONLY: ดาวน์โหลดไฟล์เท่านั้น ไม่ลบหรือแก้ไขอะไร
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { config } from "dotenv";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BACKUP_DIR = "D:\\jinchanya\\ระบบงานสิ่งแวดล้อมสา\\sa-green-school-backup\\2569-08-21_backup\\storage";
const BUCKETS_TO_BACKUP = ["evaluation-photos", "certificates", "avatars", "images", "public"];

// Recursively list all files in a folder
async function listAllFiles(bucket, folder = "") {
  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit: 1000,
    offset: 0,
    sortBy: { column: "name", order: "asc" },
  });

  if (error) return { files: [], error: error.message };

  const files = [];
  for (const item of data || []) {
    if (item.id === null) {
      // It's a folder — recurse
      const subPath = folder ? `${folder}/${item.name}` : item.name;
      const sub = await listAllFiles(bucket, subPath);
      files.push(...sub.files);
    } else {
      // It's a file
      files.push({
        name: item.name,
        id: item.id,
        updated_at: item.updated_at,
        created_at: item.created_at,
        last_accessed_at: item.last_accessed_at,
        metadata: item.metadata,
        path: folder ? `${folder}/${item.name}` : item.name,
      });
    }
  }

  return { files, error: null };
}

async function downloadFile(bucket, filePath, localPath) {
  const { data, error } = await supabase.storage.from(bucket).download(filePath);
  if (error) return { success: false, error: error.message };

  const dir = dirname(localPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const buffer = Buffer.from(await data.arrayBuffer());
  writeFileSync(localPath, buffer);
  return { success: true, size: buffer.length };
}

async function backupBucket(bucketName, manifest) {
  console.log(`\n📦 Bucket: ${bucketName}`);

  // List all files
  console.log(`  ⏳ Listing files...`);
  const { files, error: listError } = await listAllFiles(bucketName);

  if (listError) {
    console.log(`  ❌ Cannot list files: ${listError}`);
    manifest[bucketName] = { status: "error", error: listError, file_count: 0 };
    return;
  }

  if (files.length === 0) {
    console.log(`  ℹ️  No files found (empty bucket or no access)`);
    manifest[bucketName] = { status: "empty", file_count: 0, files: [] };
    return;
  }

  console.log(`  📋 Found ${files.length} files — starting download...`);

  const bucketLocalDir = join(BACKUP_DIR, bucketName);
  if (!existsSync(bucketLocalDir)) mkdirSync(bucketLocalDir, { recursive: true });

  let successCount = 0;
  let failCount = 0;
  let totalBytes = 0;
  const fileManifest = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const localPath = join(bucketLocalDir, file.path);
    process.stdout.write(`  [${i + 1}/${files.length}] ${file.path}... `);

    const result = await downloadFile(bucketName, file.path, localPath);
    if (result.success) {
      successCount++;
      totalBytes += result.size;
      fileManifest.push({
        path: file.path,
        local_path: localPath,
        size_bytes: result.size,
        original_url: `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${file.path}`,
        status: "downloaded",
      });
      console.log(`✅ ${(result.size / 1024).toFixed(1)} KB`);
    } else {
      failCount++;
      fileManifest.push({ path: file.path, status: "error", error: result.error });
      console.log(`❌ ${result.error}`);
    }

    // Small delay to avoid rate limits
    if (i % 10 === 0 && i > 0) await new Promise((r) => setTimeout(r, 200));
  }

  manifest[bucketName] = {
    status: "done",
    file_count: files.length,
    success_count: successCount,
    fail_count: failCount,
    total_size_bytes: totalBytes,
    total_size_mb: (totalBytes / 1024 / 1024).toFixed(2),
    files: fileManifest,
  };

  console.log(
    `  ✅ ${bucketName}: ${successCount}/${files.length} files, ${(totalBytes / 1024 / 1024).toFixed(2)} MB`
  );
}

async function main() {
  const startTime = new Date();
  console.log("============================================================");
  console.log("  Sa Green School — Storage Backup");
  console.log(`  Started: ${startTime.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}`);
  console.log("  Mode: READ-ONLY (ดาวน์โหลดเท่านั้น)");
  console.log(`  Key type: ${SUPABASE_KEY === process.env.SUPABASE_SERVICE_ROLE_KEY ? "Service Role" : "Anon (Limited)"}`);
  console.log("============================================================");

  // First, list available buckets
  console.log("\n🗂️  กำลังตรวจสอบ Buckets...");
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

  let bucketsToProcess = BUCKETS_TO_BACKUP;
  if (!bucketsError && buckets) {
    const availableBuckets = buckets.map((b) => b.name);
    console.log(`  พบ Buckets: ${availableBuckets.join(", ")}`);
    bucketsToProcess = availableBuckets;
  } else {
    console.log(`  ⚠️  Cannot list buckets (${bucketsError?.message}) — trying known buckets`);
  }

  const manifest = {
    backup_timestamp: startTime.toISOString(),
    supabase_project_id: SUPABASE_URL.match(/https:\/\/([^.]+)\./)?.[1] || "unknown",
    buckets: {},
  };

  for (const bucket of bucketsToProcess) {
    await backupBucket(bucket, manifest.buckets);
  }

  const endTime = new Date();
  const totalFiles = Object.values(manifest.buckets).reduce((s, b) => s + (b.success_count || 0), 0);
  const totalMB = Object.values(manifest.buckets).reduce(
    (s, b) => s + parseFloat(b.total_size_mb || "0"),
    0
  );

  manifest.summary = {
    total_buckets: bucketsToProcess.length,
    total_files_downloaded: totalFiles,
    total_size_mb: totalMB.toFixed(2),
    duration_seconds: Math.round((endTime - startTime) / 1000),
    completed_at: endTime.toISOString(),
  };

  // Write manifest
  writeFileSync(join(BACKUP_DIR, "_manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

  console.log("\n============================================================");
  console.log(`  ✅ Storage Backup สมบูรณ์`);
  console.log(`  📁 Location: ${BACKUP_DIR}`);
  console.log(`  📄 Files: ${totalFiles}`);
  console.log(`  💾 Size: ${totalMB.toFixed(2)} MB`);
  console.log(`  ⏱️  ใช้เวลา: ${Math.round((endTime - startTime) / 1000)} seconds`);
  console.log("============================================================\n");
}

main().catch((err) => {
  console.error("❌ Storage backup failed:", err);
  process.exit(1);
});
