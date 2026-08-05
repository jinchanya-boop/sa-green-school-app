import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { WaterBottleDashboard } from "@/components/water-bottle/water-bottle-dashboard";

export const metadata: Metadata = {
  title: "แดชบอร์ดแก้วน้ำส่วนตัว",
  description: "สถิติและการประกวดการใช้แก้วน้ำส่วนตัว",
};

export default async function WaterBottleDashboardPage() {
  const supabase = await createClient();

  // Fetch current user's homeroom
  const { data: { user } } = await supabase.auth.getUser();
  let assignedHomeroomId: string | null = null;
  
  if (user) {
    const { data: homeroomTeacher } = await supabase
      .from("homeroom_teachers")
      .select("homeroom_id")
      .eq("teacher_id", user.id)
      .limit(1)
      .maybeSingle();
    
    if (homeroomTeacher) {
      assignedHomeroomId = homeroomTeacher.homeroom_id;
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("homeroom_id")
        .eq("id", user.id)
        .limit(1)
        .maybeSingle();
      if (profile) assignedHomeroomId = profile.homeroom_id;
    }
  }

  // Fetch all approved records for the current active semester
  const { data: activeSemester } = await supabase
    .from("semesters")
    .select("id")
    .eq("is_active", true)
    .single();

  const semesterId = activeSemester?.id;

  let query = supabase
    .from("v_water_bottle_full")
    .select("*")
    .eq("status", "approved")
    .order("check_date", { ascending: false });

  if (semesterId) {
    query = query.eq("semester_id", semesterId);
  }

  const { data: records } = await query;

  return (
    <WaterBottleDashboard
      records={records ?? []}
      assignedHomeroomId={assignedHomeroomId || undefined}
    />
  );
}
