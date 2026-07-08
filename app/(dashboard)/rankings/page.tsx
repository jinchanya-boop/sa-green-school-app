import type { Metadata } from "next";
import { RankingsView } from "@/components/dashboard/rankings-view";

export const metadata: Metadata = {
  title: "การจัดอันดับ",
  description: "อันดับห้องเรียนด้านสิ่งแวดล้อม",
};

import { createClient } from "@/lib/supabase/server";

export default async function RankingsPage() {
  const supabase = await createClient();

  // Fetch active academic year
  const { data: activeYear } = await supabase
    .from("academic_years")
    .select("id")
    .eq("is_active", true)
    .single();

  const [
    { data: homerooms },
    { data: waterRecords },
    { data: areaRecords },
    { data: classRecords },
    { data: overallScores }
  ] = await Promise.all([
    supabase.from("homerooms").select("id, class_name, grade_level, class_number, buildings(name)").eq("is_active", true).order("grade_level").order("class_number"),
    supabase.from("water_bottle_records").select("id, homeroom_id, check_date, percentage, status").eq("status", "approved"),
    supabase.from("area_evaluations").select("id, area:responsibility_areas(homeroom_id), eval_date, percentage, status").eq("status", "approved"),
    supabase.from("classroom_evaluations").select("id, homeroom_id, eval_date, percentage, status").eq("status", "approved"),
    supabase.from("homeroom_semester_scores").select("*, homeroom:homerooms(class_name, buildings(name))").order("total_score", { ascending: false })
  ]);

  return <RankingsView 
    homerooms={homerooms ?? []} 
    waterRecords={waterRecords ?? []} 
    areaRecords={areaRecords ?? []}
    classRecords={classRecords ?? []}
    overallScores={overallScores ?? []} 
  />;
}
