import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { WaterBottleList } from "@/components/water-bottle/water-bottle-list";

export const metadata: Metadata = {
  title: "ติดตามแก้วน้ำส่วนตัว",
  description: "บันทึกและติดตามการใช้แก้วน้ำส่วนตัวของนักเรียน",
};

export default async function WaterBottlePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  let assignedHomeroomId: string | null = null;
  
  if (user) {
    const { data: homeroomTeacher } = await supabase
      .from("homeroom_teachers")
      .select("homeroom_id")
      .eq("teacher_id", user.id)
      .limit(1)
      .single();
    
    if (homeroomTeacher) {
      assignedHomeroomId = homeroomTeacher.homeroom_id;
    }
  }

  const [
    { data: records },
    { data: academicYear },
    { data: semesters }
  ] = await Promise.all([
      supabase
        .from("v_water_bottle_full")
        .select("*")
        .order("check_date", { ascending: false })
        .limit(50),
      supabase.from("academic_years").select("id").eq("is_active", true).single(),
      supabase.from("semesters").select("*").eq("is_active", true)
    ]);

  const activeYearId = academicYear?.id;

  const { data: homerooms } = await supabase
    .from("homerooms")
    .select("*")
    .eq("is_active", true)
    .eq("academic_year_id", activeYearId)
    .order("class_name");

  // Fetch all students bypassing 1000 row limit
  let allStudents: any[] = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data } = await supabase
      .from("students")
      .select("id, homeroom_id, student_number, first_name, last_name")
      .eq("is_active", true)
      .order("student_number", { ascending: true })
      .range(from, from + step - 1);
      
    if (!data || data.length === 0) break;
    allStudents = [...allStudents, ...data];
    if (data.length < step) break;
    from += step;
  }

  return (
    <WaterBottleList
      records={records ?? []}
      homerooms={homerooms ?? []}
      semesters={semesters ?? []}
      students={allStudents}
      assignedHomeroomId={assignedHomeroomId || undefined}
    />
  );
}
