import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AreaEvaluationList } from "@/components/evaluation/area-evaluation-list";

export const metadata: Metadata = {
  title: "ประเมินพื้นที่รับผิดชอบ",
  description: "บันทึกและติดตามผลการประเมินพื้นที่รับผิดชอบ",
};

export default async function AreaEvaluationPage() {
  const supabase = await createClient();

  const [{ data: evaluations }, { data: areas }, { data: semesters }, { data: criteria }] =
    await Promise.all([
      supabase
        .from("v_area_evaluations_full")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("responsible_areas").select("*, homerooms(grade_level)").eq("is_active", true),
      supabase.from("semesters").select("*").eq("is_active", true),
      supabase.from("evaluation_criteria").select("*").eq("module", "area").order("sort_order", { ascending: true })
    ]);

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role, homeroom_id, grade_level").eq("id", user?.id).single();
  const userRole = profile?.role || "guest";
  const userHomeroomId = profile?.homeroom_id;

  let filteredAreas = areas ?? [];
  if (userRole === "class_representative" && userHomeroomId) {
    filteredAreas = filteredAreas.filter((a: any) => a.homeroom_id === userHomeroomId);
  } else if (userRole === "student_council" && profile?.grade_level) {
    filteredAreas = filteredAreas.filter((a: any) => a.homerooms?.grade_level === profile.grade_level);
  }

  // Filter evaluations for Grade Supervisors
  let filteredEvaluations = evaluations ?? [];
  const isAdmin = userRole === 'administrator' || userRole === 'director' || userRole === 'deputy_director';
  const isStudentCouncil = userRole === 'student_council';
  
  if (isStudentCouncil && profile?.grade_level) {
    filteredEvaluations = filteredEvaluations.filter(ev => {
      if (!ev.homeroom_name) return false;
      const gradeStr = ev.homeroom_name.match(/ม\.(\d+)/)?.[1];
      return gradeStr && parseInt(gradeStr) === profile.grade_level;
    });
  } else if (!isAdmin && !isStudentCouncil && (userRole === 'grade_supervisor' || userRole === 'homeroom_teacher')) {
    let gradeLevels: number[] = [];
    if (profile?.grade_level) gradeLevels.push(profile.grade_level);

    // Fetch assigned grade levels from grade_supervisors table
    const { data: gsData } = await supabase
      .from('grade_supervisors')
      .select('grade_level')
      .eq('supervisor_id', user?.id);

    if (gsData) {
      gsData.forEach(gs => {
        if (!gradeLevels.includes(gs.grade_level)) gradeLevels.push(gs.grade_level);
      });
    }

    if (gradeLevels.length > 0) {
      filteredEvaluations = filteredEvaluations.filter(ev => {
        if (!ev.homeroom_name) return false;
        const gradeStr = ev.homeroom_name.match(/ม\.(\d+)/)?.[1];
        return gradeStr && gradeLevels.includes(parseInt(gradeStr));
      });
    }
  }

  return (
    <AreaEvaluationList
      userRole={userRole}
      evaluations={filteredEvaluations}
      areas={filteredAreas}
      semesters={semesters ?? []}
      criteria={criteria ?? []}
    />
  );
}
