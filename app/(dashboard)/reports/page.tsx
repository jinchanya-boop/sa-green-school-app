import type { Metadata } from "next";
import { ReportsView } from "@/components/reports/reports-view";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "รายงาน",
  description: "รายงานสรุปผลการประเมินสิ่งแวดล้อม",
};

export default async function ReportsPage() {
  const supabase = await createClient();

  const { data: activeSemester } = await supabase
    .from('semesters')
    .select('*')
    .eq('is_active', true)
    .single();

  const [{ data: homerooms }, { data: classroomEvals }, { data: areaEvals }, { data: waterEvals }] = await Promise.all([
    supabase.from('homerooms').select('*').eq('is_active', true),
    supabase.from('v_classroom_evaluations_full').select('*').eq('status', 'approved').eq('semester_id', activeSemester?.id),
    supabase.from('v_area_evaluations_full').select('*').eq('status', 'approved').eq('semester_id', activeSemester?.id),
    supabase.from('water_bottle_records').select('*').eq('semester_id', activeSemester?.id).eq('status', 'submitted')
  ]);

  return <ReportsView 
    homerooms={homerooms || []} 
    classroomEvals={classroomEvals || []} 
    areaEvals={areaEvals || []} 
    waterEvals={waterEvals || []}
    semester={activeSemester}
  />;
}
