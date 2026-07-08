"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function createStudent(data: any) {
  const supabase = await createClient();
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await adminClient
    .from("students")
    .insert({
      student_number: data.student_number,
      national_id: data.national_id || null,
      prefix: data.prefix,
      first_name: data.first_name,
      last_name: data.last_name,
      gender: data.gender || null,
      homeroom_id: data.homeroom_id,
      is_active: true,
    });

  if (error) return { success: false, error: error.message };
  revalidatePath("/students");
  return { success: true };
}

export async function updateStudent(id: string, data: any) {
  const supabase = await createClient();
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await adminClient
    .from("students")
    .update({
      student_number: data.student_number,
      national_id: data.national_id || null,
      prefix: data.prefix,
      first_name: data.first_name,
      last_name: data.last_name,
      gender: data.gender || null,
      homeroom_id: data.homeroom_id,
      is_active: data.is_active !== undefined ? data.is_active : true,
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/students");
  return { success: true };
}

export async function deleteStudent(id: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Instead of hard delete, maybe just deactivate
  const { error } = await adminClient
    .from("students")
    .update({ is_active: false })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/students");
  return { success: true };
}

export async function updateStudentRole(id: string, role: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Get student's profile_id
  const { data: student } = await adminClient.from("students").select("profile_id").eq("id", id).single();
  if (!student || !student.profile_id) return { success: false, error: "นักเรียนยังไม่มีบัญชีผู้ใช้งาน" };

  const { error } = await adminClient
    .from("profiles")
    .update({ role })
    .eq("id", student.profile_id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/students");
  return { success: true };
}

export async function generateStudentAccount(id: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: student } = await adminClient.from("students").select("*").eq("id", id).single();
  if (!student) return { success: false, error: "ไม่พบข้อมูลนักเรียน" };

  // Use national_id as identifier (fallback to student number if empty)
  const identifier = student.national_id || student.student_number;
  if (!identifier || identifier === "-") {
    return { success: false, error: "นักเรียนต้องมีรหัสนักเรียนหรือเลขประจำตัวประชาชนเพื่อใช้สร้างบัญชี" };
  }

  const email = `${identifier}@sa.ac.th`;
  const password = "saschool1234"; // Default password as requested

  // Create Auth User
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: student.full_name }
  });

  if (authError) return { success: false, error: authError.message };

  if (authData.user) {
    // Link student to profile
    await adminClient.from("students").update({ profile_id: authData.user.id }).eq("id", id);
    
    // Update profile role to class_representative
    await adminClient.from("profiles").update({ 
      role: "class_representative", 
      homeroom_id: student.homeroom_id 
    }).eq("id", authData.user.id);
  }

  revalidatePath("/students");
  return { success: true, email, password };
}
