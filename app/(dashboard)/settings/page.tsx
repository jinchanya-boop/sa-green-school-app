import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/settings-view";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "ตั้งค่าระบบ",
  description: "จัดการข้อมูลระบบ บทบาท และการตั้งค่า",
};

export default async function SettingsPage() {
  const supabase = await createClient();

  // Fetch all necessary master data
  const [
    { data: academicYears },
    { data: semesters },
    { data: buildings },
    { data: floors },
    { data: rooms },
    { data: areas },
    { data: criteria },
    { data: profiles },
    { data: homerooms },
    { data: homeroomTeachers },
    { data: settings }
  ] = await Promise.all([
    supabase.from("academic_years").select("*").order("year", { ascending: false }),
    supabase.from("semesters").select("*").order("start_date", { ascending: false }),
    supabase.from("buildings").select("*").order("sort_order", { ascending: true }),
    supabase.from("floors").select("*").order("floor_number", { ascending: true }),
    supabase.from("rooms").select("*").order("room_number", { ascending: true }),
    supabase.from("responsible_areas").select("*, homerooms(class_name), buildings(name)").order("name"),
    supabase.from("evaluation_criteria").select("*").order("module").order("sort_order"),
    supabase.from("profiles").select("*").order("full_name"),
    supabase.from("homerooms").select("*").eq("is_active", true).order("class_name"),
    supabase.from("homeroom_teachers").select("*"),
    supabase.from("system_settings").select("*")
  ]);

  const data = {
    academicYears: academicYears || [],
    semesters: semesters || [],
    buildings: buildings || [],
    floors: floors || [],
    rooms: rooms || [],
    areas: areas || [],
    criteria: criteria || [],
    profiles: profiles || [],
    homerooms: homerooms || [],
    homeroomTeachers: homeroomTeachers || [],
    settings: settings || []
  };

  return <SettingsView data={data} />;
}
