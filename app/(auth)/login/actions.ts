"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Helper to auto-provision student accounts on first login attempt
export async function tryAutoProvisionStudent(identifier: string) {
  try {
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Check if the identifier matches any student
    const { data: students, error: studentError } = await adminClient
      .from("students")
      .select("*")
      .or(`national_id.eq.${identifier},student_number.eq.${identifier}`)
      .eq("is_active", true);

    if (studentError || !students || students.length === 0) {
      return { success: false, error: "not_found" };
    }

    const student = students[0];

    // If profile_id is already linked, they already have an account (maybe wrong password)
    if (student.profile_id) {
      return { success: false, error: "already_exists" };
    }

    const email = `${identifier}@sa.ac.th`;
    const password = "saschool1234";

    // 2. Check if Auth user already exists by email (in case profile_id wasn't linked)
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const userExists = existingUsers?.users.find((u: any) => u.email === email);

    let authUserId = userExists?.id;

    if (!authUserId) {
      // 3. Create new Auth User
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: student.full_name }
      });

      if (authError) {
        return { success: false, error: authError.message };
      }
      authUserId = authData.user?.id;
    }

    if (authUserId) {
      // 4. Link student to profile
      await adminClient.from("students").update({ profile_id: authUserId }).eq("id", student.id);
      
      // 5. Update profile role to general 'student' (if not already set by triggers)
      await adminClient.from("profiles").update({ 
        role: "student", 
        homeroom_id: student.homeroom_id 
      }).eq("id", authUserId);
      
      return { success: true };
    }

    return { success: false, error: "failed_to_create" };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
