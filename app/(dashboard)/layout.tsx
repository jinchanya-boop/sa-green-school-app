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

  return <DashboardShell profile={profile}>{children}</DashboardShell>;
}
