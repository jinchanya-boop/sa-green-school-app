import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentList } from "@/components/students/student-list";

export const metadata = {
  title: "จัดการรายชื่อนักเรียน",
  description: "เพิ่ม ลบ แก้ไข รายชื่อนักเรียนในแต่ละห้อง",
};

export default async function StudentsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check if admin or grade supervisor
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!["administrator", "grade_supervisor"].includes(profile?.role || "")) {
    redirect("/dashboard");
  }

  // Fetch active academic year
  const { data: activeYear } = await supabase
    .from("academic_years")
    .select("id")
    .eq("is_active", true)
    .single();

  // Fetch homerooms for the active year
  const { data: homerooms } = await supabase
    .from("homerooms")
    .select("id, class_name, grade_level")
    .eq("is_active", true)
    .eq("academic_year_id", activeYear?.id)
    .order("grade_level", { ascending: true })
    .order("class_name", { ascending: true });

  // Fetch all students bypassing 1000 row limit
  let allStudents: any[] = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data } = await supabase
      .from("students")
      .select("*, profiles(id, role, email)")
      .eq("is_active", true)
      .range(from, from + step - 1);
      
    if (!data || data.length === 0) break;
    allStudents = [...allStudents, ...data];
    if (data.length < step) break;
    from += step;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <StudentList 
        homerooms={homerooms || []} 
        students={allStudents} 
      />
    </div>
  );
}
