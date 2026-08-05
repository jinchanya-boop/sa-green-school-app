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
  if (user) {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: 'exact', head: true })
      .eq("recipient_id", user.id)
      .eq("is_read", false);
    
    unreadNotificationsCount = count ?? 0;
  }

  return <DashboardShell profile={profile} unreadCount={unreadNotificationsCount}>{children}</DashboardShell>;
}
