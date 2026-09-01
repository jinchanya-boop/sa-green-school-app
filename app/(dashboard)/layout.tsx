import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDev = process.env.NODE_ENV === "development";

  if (!user && !isDev) {
    redirect("/login");
  }

  // Fetch profile
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
    profile = data;
  } else if (isDev) {
    // Fake profile for unauthenticated user in dev
    profile = { 
      id: "dev-bypass", 
      full_name: "แอดมิน (โหมดจำลอง)", 
      role: "administrator" 
    };
  }
  // Fetch unread notifications count
  let unreadNotificationsCount = 0;
  let pendingCount = 0;
  
  if (user) {
    const { count: notifCount } = await supabase
      .from("notifications")
      .select("*", { count: 'exact', head: true })
      .eq("recipient_id", user.id)
      .eq("is_read", false);
    
    unreadNotificationsCount = notifCount ?? 0;

    // Calculate Pending Count
    if (profile?.role === "administrator" || profile?.role === "director" || profile?.role === "deputy_director" || profile?.role === "building_supervisor" || profile?.role === "grade_supervisor") {
      let cCount = 0, aCount = 0, wCount = 0;
      const isAdmin = ["administrator", "director", "deputy_director"].includes(profile.role);
      
      let userBuildingId = profile.building_id;
      let gradeLevels: number[] = [];
      if (profile.grade_level) gradeLevels.push(profile.grade_level);

      if (profile.role === "grade_supervisor") {
        const { data: gsData } = await supabase.from('grade_supervisors').select('grade_level').eq('supervisor_id', user.id);
        if (gsData) {
          gsData.forEach(gs => {
            if (!gradeLevels.includes(gs.grade_level)) gradeLevels.push(gs.grade_level);
          });
        }
      }

      // Classroom Evals
      if (isAdmin || profile.role === "building_supervisor") {
        let q = supabase.from("v_classroom_evaluations_full").select("*", { count: 'exact', head: true }).eq("status", "submitted");
        if (!isAdmin && userBuildingId) {
          const { data: rooms } = await supabase.from("rooms").select("id").eq("building_id", userBuildingId);
          const roomIds = rooms?.map(r => r.id) || [];
          if (roomIds.length > 0) q = q.in("room_id", roomIds);
          else q = q.eq("room_id", "00000000-0000-0000-0000-000000000000"); // hack for 0 results
        }
        const { count } = await q;
        cCount = count ?? 0;
      }

      // Area Evals
      if (isAdmin || profile.role === "building_supervisor" || profile.role === "grade_supervisor") {
        let q = supabase.from("v_area_evaluations_full").select("*", { count: 'exact', head: true }).eq("status", "submitted");
        if (!isAdmin) {
           if (profile.role === "building_supervisor" && userBuildingId) q = q.eq("building_id", userBuildingId);
           else if (profile.role === "grade_supervisor" && gradeLevels.length > 0) q = q.in("grade_level", gradeLevels);
           else q = q.eq("id", "00000000-0000-0000-0000-000000000000");
        }
        const { count } = await q;
        aCount = count ?? 0;
      }

      // Water Bottle Evals
      if (isAdmin || profile.role === "grade_supervisor") {
        let q = supabase.from("v_water_bottle_full").select("*", { count: 'exact', head: true }).eq("status", "submitted");
        if (!isAdmin) {
           if (gradeLevels.length > 0) q = q.in("grade_level", gradeLevels);
           else q = q.eq("id", "00000000-0000-0000-0000-000000000000");
        }
        const { count } = await q;
        wCount = count ?? 0;
      }

      pendingCount = cCount + aCount + wCount;
    }
  }

  return <DashboardShell profile={profile} unreadCount={unreadNotificationsCount} pendingCount={pendingCount}>{children}</DashboardShell>;
}
