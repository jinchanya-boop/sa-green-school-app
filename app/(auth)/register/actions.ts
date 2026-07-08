"use server";

import { createClient } from "@/lib/supabase/server";

export async function registerWithCode(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const full_name = formData.get("full_name") as string;
  const role = formData.get("role") as string;
  const registration_code = formData.get("registration_code") as string;
  const homeroom_id = formData.get("homeroom_id") as string | null;

  if (!email || !password || !full_name || !role || !registration_code) {
    return { success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" };
  }

  if (role === "class_representative" && !homeroom_id) {
    return { success: false, error: "กรุณาเลือกห้องประจำชั้นรับผิดชอบ" };
  }

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
      }
    }
  });

  if (signUpError) {
    return { success: false, error: signUpError.message };
  }

  if (!authData.user) {
    return { success: false, error: "ไม่สามารถสร้างบัญชีได้" };
  }

  // Next.js server actions using @supabase/ssr don't automatically use the newly created session
  // for subsequent requests in the same execution. We must set it manually if available.
  if (authData.session) {
    await supabase.auth.setSession({
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
    });
  } else {
    // If email confirmation is required, session will be null.
    return { success: false, error: "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ" };
  }

  // Use the registration code to grant role
  const { data: rpcData, error: rpcError } = await supabase.rpc("fn_use_registration_code", {
    p_code: registration_code,
    p_room_id: null // We will set homeroom_id manually below
  });

  if (rpcError) {
    return { success: false, error: "รหัสผ่านลับไม่ถูกต้อง บัญชีถูกสร้างในฐานะผู้เยี่ยมชม (Guest)" };
  }

  // Set the homeroom_id manually for class_representative
  if (role === "class_representative" && homeroom_id) {
    await supabase.from("profiles").update({ homeroom_id }).eq("id", authData.user.id);
  }

  return { success: true };
}
