import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PendingList } from "@/components/pending-approvals/pending-list";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "รออนุมัติ",
  description: "รายการที่รอการตรวจสอบและอนุมัติ",
};

export default async function PendingApprovalsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, homeroom_id, building_id, grade_level")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "guest";

  // เช็คสิทธิ์การเข้าถึงหน้านี้
  const allowedRoles = ["administrator", "director", "deputy_director", "building_supervisor", "grade_supervisor"];
  if (!allowedRoles.includes(role)) {
    redirect("/dashboard");
  }

  // ดึงข้อมูลอาคารและระดับชั้นที่ดูแล
  let userBuildingId = profile?.building_id;
  let gradeLevels: number[] = [];
  if (profile?.grade_level) gradeLevels.push(profile.grade_level);

  if (role === "grade_supervisor") {
    const { data: gsData } = await supabase
      .from('grade_supervisors')
      .select('grade_level')
      .eq('supervisor_id', user.id);
    
    if (gsData) {
      gsData.forEach(gs => {
        if (!gradeLevels.includes(gs.grade_level)) gradeLevels.push(gs.grade_level);
      });
    }
  }

  // 1. ดึงข้อมูลการประเมินห้องเรียนที่รออนุมัติ
  let { data: classroomEvals } = await supabase
    .from("v_classroom_evaluations_full")
    .select("*")
    .eq("status", "submitted")
    .order("evaluated_at", { ascending: false });

  // 2. ดึงข้อมูลการประเมินพื้นที่ที่รออนุมัติ
  let { data: areaEvals } = await supabase
    .from("v_area_evaluations_full")
    .select("*")
    .eq("status", "submitted")
    .order("evaluated_at", { ascending: false });

  // 3. ดึงข้อมูลการประเมินแก้วน้ำที่รออนุมัติ
  let { data: waterBottleRecords } = await supabase
    .from("v_water_bottle_full")
    .select("*")
    .eq("status", "submitted")
    .order("check_date", { ascending: false });

  const isAdmin = role === "administrator" || role === "director" || role === "deputy_director";

  // กรองข้อมูลตามสิทธิ์
  if (!isAdmin) {
    if (role === "building_supervisor" && userBuildingId) {
      // หัวหน้าอาคารเห็นเฉพาะอาคารตัวเอง
      const { data: rooms } = await supabase.from("rooms").select("id").eq("building_id", userBuildingId);
      const roomIds = rooms?.map(r => r.id) || [];
      
      classroomEvals = (classroomEvals || []).filter(ev => roomIds.includes(ev.room_id));
      areaEvals = (areaEvals || []).filter(ev => ev.building_id === userBuildingId);
      waterBottleRecords = []; // หัวหน้าอาคารไม่เกี่ยวหน้าแก้วน้ำ
    } else if (role === "grade_supervisor" && gradeLevels.length > 0) {
      // หัวหน้าระดับเห็นเฉพาะระดับตัวเอง
      classroomEvals = []; // หัวหน้าระดับไม่เกี่ยวหน้าประเมินห้องเรียน (อาคารเป็นคนประเมิน)
      areaEvals = (areaEvals || []).filter(ev => gradeLevels.includes(ev.grade_level));
      waterBottleRecords = (waterBottleRecords || []).filter(r => gradeLevels.includes(r.grade_level));
    } else {
      // ถ้าไม่มีสิทธิ์ที่ชัดเจน ให้เห็นว่างเปล่า
      classroomEvals = [];
      areaEvals = [];
      waterBottleRecords = [];
    }
  }

  // ดึงข้อมูลเกณฑ์การประเมิน (Criteria)
  const { data: classroomCriteria } = await supabase
    .from("evaluation_criteria")
    .select("*")
    .eq("evaluation_type", "classroom")
    .eq("is_active", true)
    .order("order_num");

  const { data: areaCriteria } = await supabase
    .from("evaluation_criteria")
    .select("*")
    .eq("evaluation_type", "area")
    .eq("is_active", true)
    .order("order_num");

  return (
    <PendingList
      classroomEvals={classroomEvals || []}
      areaEvals={areaEvals || []}
      waterBottleRecords={waterBottleRecords || []}
      userRole={role}
      classroomCriteria={classroomCriteria || []}
      areaCriteria={areaCriteria || []}
    />
  );
}
