import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export const metadata: Metadata = {
  title: "แดชบอร์ด",
  description: "ภาพรวมระบบจัดการสิ่งแวดล้อมโรงเรียนสา",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single();

  // Fetch dashboard statistics in parallel
  const [
    { count: totalEvals },
    { data: areaStats },
    { data: classroomStats },
    { data: waterStats },
    { data: rankings },
    { data: homerooms },
  ] = await Promise.all([
    // Existing queries
    supabase
      .from("area_evaluations")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("area_evaluations")
      .select("id, homeroom_id:responsible_areas(homeroom_id), evaluated_at, percentage, grade")
      .eq("status", "approved"),
    supabase
      .from("classroom_evaluations")
      .select("id, homeroom_id, evaluated_at, percentage, grade")
      .eq("status", "approved"),
    supabase
      .from("water_bottle_records")
      .select("id, homeroom_id, check_date, percentage, grade")
      .eq("status", "submitted"),
    supabase
      .from("homeroom_semester_scores")
      .select(`
        *,
        homeroom:homerooms(class_name, buildings(name))
      `)
      .order("total_score", { ascending: false })
      .limit(10),
    supabase
      .from("homerooms")
      .select("id, class_name, grade_level, class_number")
      .eq("is_active", true),
  ]);

  // Handle Pending Approvals manually to support role-based filtering
  let pendingApprovals: any[] = [];
  
  const isAdmin = profile?.role === 'administrator' || profile?.role === 'director' || profile?.role === 'deputy_director';
  const isBuildingHead = !!profile?.building_id;
  const isGradeHead = !!profile?.grade_level;

  if (isAdmin || isBuildingHead || isGradeHead) {
    const fetchPromises = [];

    // Area & Water -> Grade Head (or Admin)
    if (isAdmin || isGradeHead) {
      let areaQ = supabase.from("area_evaluations").select(`
        id, submitted_at, evaluator_id, 
        responsible_areas(name, building_id, homerooms(grade_level, class_name)),
        profiles!evaluator_id(full_name)
      `).eq("status", "submitted").order("submitted_at", { ascending: false }).limit(5);

      let waterQ = supabase.from("water_bottle_records").select(`
        id, check_date, submitted_at, teacher_id,
        homerooms(class_name, grade_level),
        profiles!teacher_id(full_name)
      `).eq("status", "submitted").order("submitted_at", { ascending: false }).limit(5);

      fetchPromises.push(areaQ, waterQ);
    }

    // Classroom -> Building Head (or Admin)
    if (isAdmin || isBuildingHead) {
      let classQ = supabase.from("classroom_evaluations").select(`
        id, submitted_at, evaluator_id,
        rooms(name, building_id),
        homerooms(class_name),
        profiles!evaluator_id(full_name)
      `).eq("status", "submitted").order("submitted_at", { ascending: false }).limit(5);
      
      fetchPromises.push(classQ);
    }

    const results = await Promise.all(fetchPromises);
    
    // Map and filter results
    let allPending: any[] = [];
    
    if (isAdmin || isGradeHead) {
      const areaRes = results[0].data || [];
      const waterRes = results[1].data || [];
      
      areaRes.forEach((a: any) => {
        const gradeLevel = a.responsible_areas?.homerooms?.grade_level;
        if (isAdmin || profile?.grade_level == gradeLevel) {
          allPending.push({
            type: 'area_evaluation',
            id: a.id,
            class_name: a.responsible_areas?.homerooms?.class_name,
            subject: a.responsible_areas?.name,
            action_at: a.submitted_at,
            submitted_by: a.profiles?.full_name
          });
        }
      });
      
      waterRes.forEach((w: any) => {
        const gradeLevel = w.homerooms?.grade_level;
        if (isAdmin || profile?.grade_level == gradeLevel) {
          allPending.push({
            type: 'water_bottle',
            id: w.id,
            class_name: w.homerooms?.class_name,
            subject: `ขวดน้ำส่วนตัว ${w.check_date}`,
            action_at: w.submitted_at,
            submitted_by: w.profiles?.full_name
          });
        }
      });
    }

    if (isAdmin || isBuildingHead) {
      // index depends on whether Grade Head queries were pushed
      const classRes = results.length > 1 ? results[2].data || [] : results[0].data || [];
      
      classRes.forEach((c: any) => {
        const bldgId = c.rooms?.building_id;
        if (isAdmin || profile?.building_id === bldgId) {
          allPending.push({
            type: 'classroom_evaluation',
            id: c.id,
            class_name: c.homerooms?.class_name,
            subject: c.rooms?.name,
            action_at: c.submitted_at,
            submitted_by: c.profiles?.full_name
          });
        }
      });
    }

    // Sort combined pending and slice top 5
    pendingApprovals = allPending.sort((a, b) => new Date(b.action_at).getTime() - new Date(a.action_at).getTime()).slice(0, 5);
  }

  const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
  
  const [
    { data: todayArea },
    { data: todayClass },
    { data: todayWater }
  ] = await Promise.all([
    supabase
      .from("area_evaluations")
      .select("responsible_areas(homeroom_id)")
      .gte("evaluated_at", todayStr),
    supabase
      .from("classroom_evaluations")
      .select("homeroom_id")
      .gte("evaluated_at", todayStr),
    supabase
      .from("water_bottle_records")
      .select("homeroom_id")
      .gte("check_date", todayStr),
  ]);

  return (
    <DashboardContent
      totalEvals={totalEvals ?? 0}
      areaStats={areaStats?.map((a: any) => ({ ...a, homeroom_id: a.homeroom_id?.homeroom_id || null })) ?? []}
      classroomStats={classroomStats ?? []}
      waterStats={waterStats ?? []}
      rankings={rankings ?? []}
      pendingApprovals={pendingApprovals ?? []}
      homerooms={homerooms ?? []}
      todaySubmissions={{
        area: todayArea ?? [],
        classroom: todayClass ?? [],
        water: todayWater ?? []
      }}
    />
  );
}
