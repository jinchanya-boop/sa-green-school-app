"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ==========================================
// GENERAL SETTINGS ACTIONS
// ==========================================

export async function updateGeneralSettings(formData: FormData) {
  const supabase = await createClient();
  
  // Convert formData into an array of updates
  // Example: { key: "school_name", value: "โรงเรียนสา" }
  const updates = [];
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      updates.push({ key, value: JSON.stringify(value) });
    }
  }

  if (updates.length > 0) {
    const { error } = await supabase.from("system_settings").upsert(updates);
    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

// ==========================================
// ACADEMIC YEAR ACTIONS
// ==========================================

export async function addAcademicYear(formData: FormData) {
  const supabase = await createClient();
  const year = parseInt(formData.get("year") as string);
  
  if (!year || isNaN(year)) return { success: false, error: "Invalid year" };

  const { error } = await supabase.from("academic_years").insert({
    year,
    year_ce: year - 543,
    is_active: false // default false
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function deleteAcademicYear(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase.from("academic_years").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return { success: false, error: "ไม่สามารถลบได้ เนื่องจากมีข้อมูลที่เกี่ยวข้องผูกอยู่ (เช่น การประเมินพื้นที่/ห้องเรียน)" };
    }
    return { success: false, error: error.message };
  }
  revalidatePath("/settings");
  return { success: true };
}

export async function setActiveAcademicYear(id: string) {
  const supabase = await createClient();
  
  // 1. Set all to false
  await supabase.from("academic_years").update({ is_active: false }).neq("id", id);
  
  // 2. Set target to true
  const { error } = await supabase.from("academic_years").update({ is_active: true }).eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

// ==========================================
// SEMESTER ACTIONS
// ==========================================

export async function addSemester(formData: FormData) {
  const supabase = await createClient();
  const academic_year_id = formData.get("academic_year_id") as string;
  const semester = formData.get("semester") as string;
  const start_date = formData.get("start_date") as string;
  const end_date = formData.get("end_date") as string;

  if (!academic_year_id || !semester || !start_date || !end_date) {
    return { success: false, error: "Missing fields" };
  }

  const { error } = await supabase.from("semesters").insert({
    academic_year_id,
    semester,
    start_date,
    end_date,
    is_active: false
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function deleteSemester(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase.from("semesters").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return { success: false, error: "ไม่สามารถลบได้ เนื่องจากมีข้อมูลการประเมินในภาคเรียนนี้" };
    }
    return { success: false, error: error.message };
  }
  revalidatePath("/settings");
  return { success: true };
}

export async function setActiveSemester(id: string) {
  const supabase = await createClient();
  
  // 1. Set all to false
  await supabase.from("semesters").update({ is_active: false }).neq("id", id);
  
  // 2. Set target to true
  const { error } = await supabase.from("semesters").update({ is_active: true }).eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

// ==========================================
// BUILDING ACTIONS
// ==========================================

export async function addBuilding(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const total_floors = parseInt(formData.get("total_floors") as string) || 1;
  const supervisor_id = formData.get("supervisor_id") as string || null;

  const { error } = await supabase.from("buildings").insert({
    name,
    code,
    total_floors,
    supervisor_id
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function updateBuilding(id: string, formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const total_floors = parseInt(formData.get("total_floors") as string) || 1;
  const supervisor_id = formData.get("supervisor_id") as string || null;

  const { error } = await supabase.from("buildings").update({
    name,
    code,
    total_floors,
    supervisor_id
  }).eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function deleteBuilding(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("buildings").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") return { success: false, error: "ไม่สามารถลบอาคารได้ เนื่องจากมีชั้นหรือห้องเรียนผูกอยู่" };
    return { success: false, error: error.message };
  }
  revalidatePath("/settings");
  return { success: true };
}

// ==========================================
// FLOOR ACTIONS
// ==========================================

export async function addFloor(formData: FormData) {
  const supabase = await createClient();
  const building_id = formData.get("building_id") as string;
  const floor_number = parseInt(formData.get("floor_number") as string);
  const name = formData.get("name") as string;

  const { error } = await supabase.from("floors").insert({
    building_id,
    floor_number,
    name
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function updateFloor(id: string, formData: FormData) {
  const supabase = await createClient();
  const floor_number = parseInt(formData.get("floor_number") as string);
  const name = formData.get("name") as string;

  const { error } = await supabase.from("floors").update({
    floor_number,
    name
  }).eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function deleteFloor(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("floors").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") return { success: false, error: "ไม่สามารถลบชั้นได้ เนื่องจากมีห้องเรียนหรือพื้นที่รับผิดชอบผูกอยู่" };
    return { success: false, error: error.message };
  }
  revalidatePath("/settings");
  return { success: true };
}

// ==========================================
// ROOM ACTIONS
// ==========================================

export async function addRoom(formData: FormData) {
  const supabase = await createClient();
  const building_id = formData.get("building_id") as string;
  const floor_id = formData.get("floor_id") as string;
  const room_number = formData.get("room_number") as string;
  const name = formData.get("name") as string;
  const type = formData.get("type") as string || "classroom";

  const { error } = await supabase.from("rooms").insert({
    building_id,
    floor_id,
    room_number,
    name,
    type
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function updateRoom(id: string, formData: FormData) {
  const supabase = await createClient();
  const room_number = formData.get("room_number") as string;
  const name = formData.get("name") as string;

  const { error } = await supabase.from("rooms").update({
    room_number,
    name
  }).eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function deleteRoom(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("rooms").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") return { success: false, error: "ไม่สามารถลบห้องเรียนได้ เนื่องจากมีการผูกข้อมูลห้องประจำชั้นหรือพื้นที่รับผิดชอบไว้แล้ว" };
    return { success: false, error: error.message };
  }
  revalidatePath("/settings");
  return { success: true };
}

// ==========================================
// CRITERIA ACTIONS
// ==========================================

export async function updateCriteriaScore(id: string, max_score: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("evaluation_criteria").update({ max_score }).eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function updateCriteriaName(id: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("evaluation_criteria").update({ name }).eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

// ==========================================
// USER ACTIONS
// ==========================================

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseServiceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function addUser(data: { email: string; full_name: string; role: string; password?: string }) {
  try {
    const supabaseAdmin = getAdminClient();
    
    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password || "123456",
      email_confirm: true,
      user_metadata: {
        full_name: data.full_name,
      }
    });

    if (authError) return { success: false, error: authError.message };

    // 2. Profile is automatically created by Postgres Trigger (handle_new_user)
    // We just need to update the role since the trigger sets it to 'guest' by default.
    if (data.role && data.role !== 'guest' && authData.user) {
      const { error: profileError } = await supabaseAdmin.from("profiles").update({
        role: data.role,
      }).eq("id", authData.user.id);
      
      if (profileError) return { success: false, error: profileError.message };
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Unknown error occurred" };
  }
}

export async function bulkImportUsers(users: Array<{ email: string; full_name: string; role: string; password?: string }>) {
  try {
    const supabaseAdmin = getAdminClient();
    let successCount = 0;
    let errors = [];

    for (const user of users) {
      if (!user.email) continue;
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password || "123456",
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
        }
      });

      if (authError) {
        errors.push(`Error for ${user.email}: ${authError.message}`);
        continue;
      }

      if (user.role && user.role !== 'guest' && authData.user) {
        await supabaseAdmin.from("profiles").update({
          role: user.role,
        }).eq("id", authData.user.id);
      }
      
      successCount++;
    }

    revalidatePath("/settings");
    return { 
      success: true, 
      message: `Imported ${successCount} users successfully. ${errors.length > 0 ? `Errors: ${errors.join(", ")}` : ""}`
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Unknown error occurred" };
  }
}

export async function updateUserRole(userId: string, role: string) {
  const supabaseAdmin = getAdminClient();
  const { error } = await supabaseAdmin.from("profiles").update({ role }).eq("id", userId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function updateUserHomeroom(userId: string, homeroom_id: string | null) {
  const supabaseAdmin = getAdminClient();
  const { error } = await supabaseAdmin.from("profiles").update({ homeroom_id }).eq("id", userId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function toggleUserActive(userId: string, is_active: boolean) {
  const supabaseAdmin = getAdminClient();
  const { error } = await supabaseAdmin.from("profiles").update({ is_active }).eq("id", userId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

// ==========================================
// RESPONSIBLE AREA ACTIONS
// ==========================================

export async function addResponsibleArea(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const building_id = formData.get("building_id") as string;
  const homeroom_id = formData.get("homeroom_id") as string;
  const description = formData.get("description") as string;

  const { error } = await supabase.from("responsible_areas").insert({
    name,
    building_id,
    homeroom_id,
    description
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function updateResponsibleArea(id: string, formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const building_id = formData.get("building_id") as string;
  const homeroom_id = formData.get("homeroom_id") as string;
  const description = formData.get("description") as string;

  const { error } = await supabase.from("responsible_areas").update({
    name,
    building_id,
    homeroom_id,
    description
  }).eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function deleteResponsibleArea(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("responsible_areas").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") return { success: false, error: "ไม่สามารถลบพื้นที่รับผิดชอบได้ เนื่องจากมีการประเมินในพื้นที่นี้แล้ว" };
    return { success: false, error: error.message };
  }
  revalidatePath("/settings");
  return { success: true };
}

export async function clearAllDummyData() {
  const supabase = await createClient();
  
  // order of deletion is important if CASCADE is not fully set up
  // delete evaluations first
  await supabase.from("water_bottle_records").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("area_evaluations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("classroom_evaluations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("evaluation_sessions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  
  // delete rooms and areas
  await supabase.from("responsible_areas").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("rooms").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("homerooms").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  
  // delete floors and buildings
  await supabase.from("floors").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("buildings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  
  revalidatePath("/settings");
  return { success: true };
}

export async function updateClassroomCriteria() {
  const supabase = await createClient();
  
  // Delete old criteria
  await supabase.from("evaluation_criteria").delete().eq("module", "classroom");

  // Insert new 10 criteria
  const newCriteria = [
    { module: "classroom", name: "ความเป็นระเบียบเรียบร้อยของห้องเรียนโดยรวม", description: "แบ่งมุมห้องชัดเจนเช่น โต๊ะครู/โต๊ะนักเรียน/มุมทิ้งขยะ/มุมเก็บของ", max_score: 3, sort_order: 1 },
    { module: "classroom", name: "การจัดโต๊ะ/เก้าอี้/โต๊ะครู", description: "", max_score: 3, sort_order: 2 },
    { module: "classroom", name: "ความสะอาดใต้โต๊ะ/เก้าอี้", description: "", max_score: 3, sort_order: 3 },
    { module: "classroom", name: "ความสะอาดของพื้นห้องเรียน", description: "", max_score: 3, sort_order: 4 },
    { module: "classroom", name: "ความสะอาดของผนัง/ฝ้าเพดาน/การกำจัดหยากไย่", description: "", max_score: 3, sort_order: 5 },
    { module: "classroom", name: "การทิ้งขยะในห้องเรียน/ไม่มีกลิ่นเหม็นขยะ", description: "", max_score: 3, sort_order: 6 },
    { module: "classroom", name: "ความสะอาดของกระดาน", description: "", max_score: 3, sort_order: 7 },
    { module: "classroom", name: "จัดเก็บอุปกรณ์ทำความสะอาดเป็นระเบียบ", description: "", max_score: 3, sort_order: 8 },
    { module: "classroom", name: "ปิดหน้าต่างทุกบาน", description: "", max_score: 3, sort_order: 9 },
    { module: "classroom", name: "การเก็บรักษาอุปกรณ์และเครื่องใช้ไฟฟ้าในห้องเรียน", description: "(TV / สายHDMI / รีโมท TV / พัดลม / แอร์ / เครื่องฟอกอากาศ)", max_score: 3, sort_order: 10 },
  ];

  const { error } = await supabase.from("evaluation_criteria").insert(newCriteria);
  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateAreaCriteria() {
  const supabase = await createClient();
  
  // Delete old criteria
  await supabase.from("evaluation_criteria").delete().eq("module", "area");

  // Insert new 4 criteria
  const newCriteria = [
    { module: "area", name: "ไม่มีขยะในบริเวณพื้นที่", description: "สะอาดเรียบร้อย 100% ไม่มีเศษขยะ ใบไม้แห้ง ตกค้างหรือน้ำขัง", max_score: 3, sort_order: 1 },
    { module: "area", name: "นักเรียนทุกคนมีส่วนร่วม", description: "นักเรียนในกลุ่มเวรมาพร้อมเพรียงกัน สามัคคี แบ่งงานชัดเจน", max_score: 3, sort_order: 2 },
    { module: "area", name: "เก็บรักษาอุปกรณ์เป็นระเบียบ", description: "อุปกรณ์ทุกชิ้นทำความสะอาด และจัดวางเรียงประเภทเรียบร้อย", max_score: 3, sort_order: 3 },
    { module: "area", name: "ลงพื้นที่เป็นประจำวัน", description: "ปฏิบัติหน้าที่ตรงเวลา สม่ำเสมอครบถ้วน ทั้งรอบเช้าและรอบเย็น", max_score: 3, sort_order: 4 },
  ];

  const { error } = await supabase.from("evaluation_criteria").insert(newCriteria);
  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// --------------------------------------------------------------------------------
// Homerooms Actions
// --------------------------------------------------------------------------------

export async function addHomeroom(formData: FormData) {
  const supabase = await createClient();
  const academic_year_id = formData.get("academic_year_id") as string;
  const grade_level = parseInt(formData.get("grade_level") as string);
  const class_number = parseInt(formData.get("class_number") as string);
  const room_id = formData.get("room_id") as string | null;

  if (!academic_year_id || !grade_level || !class_number) {
    return { success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" };
  }

  // Check if room is already taken
  if (room_id) {
    const { data: existing } = await supabase
      .from("homerooms")
      .select("id")
      .eq("room_id", room_id)
      .eq("academic_year_id", academic_year_id)
      .single();
    if (existing) {
      return { success: false, error: "ห้องทางกายภาพนี้ถูกจับคู่กับห้องประจำชั้นอื่นไปแล้วในปีการศึกษานี้" };
    }
  }

  const { data: newHomeroom, error } = await supabase.from("homerooms").insert({
    academic_year_id,
    grade_level,
    class_number,
    class_name: `ม.${grade_level}/${class_number}`,
    room_id: room_id || null,
  }).select().single();

  if (error) {
    if (error.code === '23505') return { success: false, error: "มีห้องประจำชั้นนี้อยู่แล้วในปีการศึกษานี้" };
    return { success: false, error: error.message };
  }

  const teacher_id_1 = formData.get("teacher_id_1") as string | null;
  const teacher_id_2 = formData.get("teacher_id_2") as string | null;

  if (newHomeroom) {
    if (teacher_id_1) {
      await supabase.from("homeroom_teachers").insert({
        homeroom_id: newHomeroom.id,
        teacher_id: teacher_id_1,
        is_primary: true
      });
    }
    if (teacher_id_2 && teacher_id_2 !== teacher_id_1) {
      await supabase.from("homeroom_teachers").insert({
        homeroom_id: newHomeroom.id,
        teacher_id: teacher_id_2,
        is_primary: false
      });
    }
  }
  revalidatePath("/settings");
  return { success: true };
}

export async function deleteHomeroom(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("homerooms").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function updateHomeroom(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const grade_level = parseInt(formData.get("grade_level") as string);
  const class_number = parseInt(formData.get("class_number") as string);
  const room_id = formData.get("room_id") as string | null;
  const is_active = formData.get("is_active") === "true";

  if (!id || !grade_level || !class_number) {
    return { success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" };
  }

  const { error } = await supabase.from("homerooms").update({
    grade_level,
    class_number,
    class_name: `ม.${grade_level}/${class_number}`,
    room_id: room_id || null,
    is_active
  }).eq("id", id);

  if (error) {
    if (error.code === '23505') return { success: false, error: "มีห้องประจำชั้นนี้อยู่แล้วในปีการศึกษานี้" };
    return { success: false, error: error.message };
  }

  const teacher_id_1 = formData.get("teacher_id_1") as string | null;
  const teacher_id_2 = formData.get("teacher_id_2") as string | null;
  
  // Clear existing teachers for this homeroom
  await supabase.from("homeroom_teachers").delete().eq("homeroom_id", id);

  if (teacher_id_1) {
    await supabase.from("homeroom_teachers").insert({
      homeroom_id: id,
      teacher_id: teacher_id_1,
      is_primary: true
    });
  }
  if (teacher_id_2 && teacher_id_2 !== teacher_id_1) {
    await supabase.from("homeroom_teachers").insert({
      homeroom_id: id,
      teacher_id: teacher_id_2,
      is_primary: false
    });
  }

  revalidatePath("/settings");
  return { success: true };
}
