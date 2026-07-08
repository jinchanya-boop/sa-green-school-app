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
      supabase.from("responsible_areas").select("*").eq("is_active", true),
      supabase.from("semesters").select("*").eq("is_active", true),
      supabase.from("evaluation_criteria").select("*").eq("module", "area").order("sort_order", { ascending: true })
    ]);

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role, homeroom_id").eq("id", user?.id).single();
  const userRole = profile?.role || "guest";
  const userHomeroomId = profile?.homeroom_id;

  let filteredAreas = areas ?? [];
  if (userRole === "class_representative" && userHomeroomId) {
    filteredAreas = filteredAreas.filter((a: any) => a.homeroom_id === userHomeroomId);
  }

  return (
    <AreaEvaluationList
      userRole={userRole}
      evaluations={evaluations ?? []}
      areas={filteredAreas}
      semesters={semesters ?? []}
      criteria={criteria ?? []}
    />
  );
}
