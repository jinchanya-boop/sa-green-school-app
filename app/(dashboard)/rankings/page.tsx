import type { Metadata } from "next";
import { RankingsView } from "@/components/dashboard/rankings-view";

export const metadata: Metadata = {
  title: "การจัดอันดับ",
  description: "อันดับห้องเรียนด้านสิ่งแวดล้อม",
};

import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export default async function RankingsPage() {
  const supabase = await createClient();

  // Fetch active semester
  const { data: activeSemester } = await supabase
    .from("semesters")
    .select("*")
    .eq("is_active", true)
    .single();

  const [
    { data: homerooms },
    { data: waterRecords },
    { data: areaRecords },
    { data: classRecords },
    { data: responsibleAreas },
  ] = await Promise.all([
    supabase.from("homerooms").select("id, class_name, grade_level, class_number, rooms(buildings(name))").eq("is_active", true).order("grade_level").order("class_number"),
    supabase.from("water_bottle_records").select("id, homeroom_id, check_date, percentage, status").eq("status", "approved").eq("semester_id", activeSemester?.id),
    supabase.from("area_evaluations").select("id, responsible_area_id, evaluated_at, percentage, status").eq("status", "approved").eq("semester_id", activeSemester?.id),
    supabase.from("classroom_evaluations").select("id, homeroom_id, evaluated_at, percentage, status").eq("status", "approved").eq("semester_id", activeSemester?.id),
    supabase.from("responsible_areas").select("id, homeroom_id"),
  ]);

  // Map area evaluations to include homeroom_id from responsible_areas lookup
  const areaMap = new Map((responsibleAreas ?? []).map(ra => [ra.id, ra.homeroom_id]));
  const areaRecordsWithHrId = (areaRecords ?? []).map(r => ({
    ...r,
    homeroom_id: areaMap.get(r.responsible_area_id) || null,
  }));

  console.log('[Rankings Debug] semester:', activeSemester?.id);
  console.log('[Rankings Debug] homerooms:', homerooms?.length);
  console.log('[Rankings Debug] waterRecords:', waterRecords?.length);
  console.log('[Rankings Debug] areaRecords:', areaRecords?.length);
  console.log('[Rankings Debug] classRecords:', classRecords?.length);
  console.log('[Rankings Debug] responsibleAreas:', responsibleAreas?.length);
  console.log('[Rankings Debug] areaRecordsWithHrId sample:', areaRecordsWithHrId.slice(0, 2));

  return <RankingsView 
    homerooms={homerooms ?? []} 
    waterRecords={waterRecords ?? []} 
    areaRecords={areaRecordsWithHrId}
    classRecords={classRecords ?? []}
    semester={activeSemester}
  />;
}
