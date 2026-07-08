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
  const { data: profile } = await supabase.from("profiles").select("role, homeroom_id").eq("id", user?.id).single();
  const role = profile?.role || "guest";
  const userHomeroomId = profile?.homeroom_id;

  const [{ data: evaluations }, { data: rooms }, { data: semesters }, { data: criteria }] =
    await Promise.all([
      supabase
        .from("v_classroom_evaluations_full")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("rooms").select("id, name, homerooms(id, class_name)").eq("is_active", true).order("name"),
      supabase.from("semesters").select("*").eq("is_active", true),
      supabase.from("evaluation_criteria").select("*").eq("module", "classroom").order("sort_order", { ascending: true })
    ]);

  let mappedRooms = (rooms ?? []).map((r: any) => {
    const homeroom = r.homerooms?.[0];
    return {
      ...r,
      homeroom_id: homeroom?.id,
      name: homeroom?.class_name ? `${r.name} (${homeroom.class_name})` : r.name
    };
  });

  if (role === "class_representative" && userHomeroomId) {
    mappedRooms = mappedRooms.filter(r => r.homeroom_id === userHomeroomId);
  }

  return (
    <ClassroomEvalList
      evaluations={evaluations ?? []}
      rooms={mappedRooms}
      semesters={semesters ?? []}
      criteria={criteria ?? []}
      userRole={role}
    />
  );
}
