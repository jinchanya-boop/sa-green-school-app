"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { notifyGradeHead, notifyUser, removePendingNotifications } from "@/lib/notifications";

export async function submitWaterBottleCheck(formData: FormData) {
  const supabase = await createClient();
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Parse Form Data
  const homeroom_id = formData.get("homeroom_id") as string;
  const semester_id = formData.get("semester_id") as string;
  const check_date = formData.get("check_date") as string;
  const check_period = "all_day"; // Hardcoded since it was removed from UI
  const teacher_notes = formData.get("teacher_notes") as string;

  const studentIds = formData.getAll("student_id[]") as string[];
  
  // Get current user (Homeroom Teacher)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "Authentication required" };
  }

  // Basic Validation
  if (!homeroom_id || !semester_id || !check_date || studentIds.length === 0) {
    return { success: false, error: "Missing required fields" };
  }

  // Prevent duplicate submission for the same homeroom and date
  const { data: existing } = await adminClient
    .from("water_bottle_records")
    .select("id")
    .eq("homeroom_id", homeroom_id)
    .eq("check_date", check_date)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "มีการบันทึกข้อมูลแก้วน้ำสำหรับห้องและวันที่เลือกไปแล้ว" };
  }

  const total_students = studentIds.length;
  let students_with_bottle = 0;
  let students_absent = 0;
  let students_leave = 0;

  const studentStatuses = studentIds.map(id => {
    const status = formData.get(`status_${id}`) as string;
    
    let has_bottle = false;
    let is_absent = false;
    let is_leave = false;

    if (status === "absent") {
      is_absent = true;
      students_absent++;
    } else if (status === "leave") {
      is_leave = true;
      students_leave++;
    } else if (status === "bottle") {
      has_bottle = true;
      students_with_bottle++;
    }

    return {
      student_id: id,
      has_bottle,
      is_absent,
      is_leave,
    };
  });

  const students_present = total_students - students_absent - students_leave;

  // 1. Insert into water_bottle_records using adminClient to bypass RLS
  const { data: recordData, error: recordError } = await adminClient
    .from("water_bottle_records")
    .insert({
      homeroom_id,
      semester_id,
      teacher_id: user.id,
      check_date,
      check_period,
      status: "submitted",
      total_students,
      students_present,
      students_with_bottle,
      students_leave,
      teacher_notes: teacher_notes || null,
    })
    .select("id")
    .single();

  if (recordError || !recordData) {
    console.error("Water Bottle Record Insert Error:", recordError);
    let errorMsg = recordError?.message || "Failed to submit record";
    
    // ดักจับ Error เกี่ยวกับ API Key เพื่อแจ้งเตือนให้เข้าใจง่ายขึ้น
    if (errorMsg.includes("Unregistered API key") || errorMsg.includes("Invalid API key")) {
      errorMsg = "ระบบตั้งค่า API Key ไม่ถูกต้อง กรุณาอัปเดต SUPABASE_SERVICE_ROLE_KEY บน Vercel";
    }
    
    return { success: false, error: errorMsg };
  }

  // 2. Insert items (student statuses)
  const statusesWithRecordId = studentStatuses.map(status => ({
    ...status,
    water_bottle_record_id: recordData.id
  }));

  const { error: statusesError } = await adminClient
    .from("student_water_bottle_statuses")
    .insert(statusesWithRecordId);

  if (statusesError) {
    console.error("Student Statuses Insert Error:", statusesError);
    return { success: false, error: statusesError.message };
  }

  // 3. Send Notification to Grade Head
  const { data: hrData } = await adminClient
    .from("homerooms")
    .select("grade_level, class_name")
    .eq("id", homeroom_id)
    .single();

  if (hrData?.grade_level) {
    await notifyGradeHead(
      adminClient,
      hrData.grade_level,
      "มีการบันทึกข้อมูลการใช้แก้วน้ำส่วนตัว",
      `รอการรับทราบ: บันทึกข้อมูลแก้วน้ำส่วนตัวของห้อง ${hrData.class_name}`,
      "water_bottle",
      recordData.id,
      "/water-bottle"
    );
  }

  // 4. Revalidate path to refresh list
  revalidatePath("/water-bottle");

  return { success: true, record_id: recordData.id };
}

export async function approveWaterBottleCheck(recordId: string, notes: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: { user } } = await supabase.auth.getUser();

  const { data: updatedRecord, error } = await adminClient
    .from("water_bottle_records")
    .update({
      status: "approved",
      acknowledger_id: user?.id,
      acknowledger_notes: notes,
      acknowledged_at: new Date().toISOString(),
    })
    .eq("id", recordId)
    .select("teacher_id, homerooms(class_name), check_date")
    .single();

  if (error) return { success: false, error: error.message };

  if (updatedRecord?.teacher_id) {
    const rooms: any = updatedRecord.homerooms;
    const className = rooms?.class_name || (Array.isArray(rooms) ? rooms[0]?.class_name : undefined) || "ของคุณ";
    const date = updatedRecord.check_date || "ล่าสุด";
    await notifyUser(
      adminClient,
      updatedRecord.teacher_id,
      "✅ การบันทึกแก้วน้ำถูกรับทราบแล้ว",
      `บันทึกแก้วน้ำส่วนตัวของห้อง ${className} ประจำวันที่ ${date} ได้รับการอนุมัติ/รับทราบแล้ว`,
      "water_bottle",
      recordId,
      "/water-bottle"
    );
  }
  
  await removePendingNotifications(adminClient, recordId, "water_bottle");

  revalidatePath("/water-bottle");
  revalidatePath("/pending-approvals");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function rejectWaterBottleCheck(recordId: string, reason: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: { user } } = await supabase.auth.getUser();

  const { data: updatedRecord, error } = await adminClient
    .from("water_bottle_records")
    .update({
      status: "rejected",
      acknowledger_id: user?.id,
      teacher_notes: reason,
      acknowledger_notes: reason,
      acknowledged_at: new Date().toISOString(),
    })
    .eq("id", recordId)
    .select("teacher_id, homerooms(class_name), check_date")
    .single();

  if (error) return { success: false, error: error.message };

  if (updatedRecord?.teacher_id) {
    const rooms: any = updatedRecord.homerooms;
    const className = rooms?.class_name || (Array.isArray(rooms) ? rooms[0]?.class_name : undefined) || "ของคุณ";
    const date = updatedRecord.check_date || "ล่าสุด";
    await notifyUser(
      adminClient,
      updatedRecord.teacher_id,
      "❌ การบันทึกแก้วน้ำถูกตีกลับ",
      `บันทึกแก้วน้ำส่วนตัวของห้อง ${className} ประจำวันที่ ${date} ถูกตีกลับ: ${reason}`,
      "water_bottle",
      recordId,
      "/water-bottle"
    );
  }

  await removePendingNotifications(adminClient, recordId, "water_bottle");

  revalidatePath("/water-bottle");
  revalidatePath("/pending-approvals");
  revalidatePath("/dashboard");
  return { success: true };
}
