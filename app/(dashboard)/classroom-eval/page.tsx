import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ClassroomEvalList } from "@/components/evaluation/classroom-eval-list";

export const metadata: Metadata = {
  title: "ประเมินห้องเรียน",
  description: "บันทึกและติดตามผลการประเมินความสะอาดห้องเรียน",
};

export default async function ClassroomEvalPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role, homeroom_id, building_id").eq("id", user?.id).single();
  const role = profile?.role || "guest";
  const userHomeroomId = profile?.homeroom_id;
  const userBuildingId = profile?.building_id;

  const [{ data: evaluations }, { data: rooms }, { data: semesters }, { data: criteria }] =
    await Promise.all([
      supabase
        .from("v_classroom_evaluations_full")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("rooms").select("id, name, building_id, homerooms(id, class_name)").eq("is_active", true).order("name"),
      supabase.from("semesters").select("*").eq("is_active", true),
      supabase.from("evaluation_criteria").select("*").eq("module", "classroom").order("sort_order", { ascending: true })
    ]);

  let mappedRooms: any[] = [];
  (rooms ?? []).forEach((r: any) => {
    if (r.homerooms && r.homerooms.length > 0) {
      r.homerooms.forEach((homeroom: any) => {
        mappedRooms.push({
          ...r,
          homeroom_id: homeroom.id,
          name: `${r.name} (${homeroom.class_name})`
        });
      });
    } else {
      mappedRooms.push({
        ...r,
        homeroom_id: null,
        name: r.name
      });
    }
  });

  if (role === "student_council" && userBuildingId) {
    mappedRooms = mappedRooms.filter(r => r.building_id === userBuildingId);
  } else if (role === "class_representative" && userHomeroomId) {
    mappedRooms = mappedRooms.filter(r => r.homeroom_id === userHomeroomId);
  }

  // Filter evaluations for Building Supervisors
  let filteredEvaluations = evaluations ?? [];
  const isAdmin = role === 'administrator' || role === 'director' || role === 'deputy_director';
  const isStudentCouncil = role === 'student_council';

  if (!isAdmin && ((role === 'building_supervisor' && userBuildingId) || (role === 'student_council' && userBuildingId))) {
    // Find all room IDs in this building
    const allowedRoomIds = mappedRooms
      .filter(r => r.building_id === userBuildingId)
      .map(r => r.id);

    filteredEvaluations = filteredEvaluations.filter(ev => allowedRoomIds.includes(ev.room_id));
  }

  return (
    <ClassroomEvalList
      evaluations={filteredEvaluations}
      rooms={mappedRooms}
      semesters={semesters ?? []}
      criteria={criteria ?? []}
      userRole={role}
    />
  );
}
