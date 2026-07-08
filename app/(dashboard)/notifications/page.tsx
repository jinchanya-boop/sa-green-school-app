import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { NotificationsView } from "@/components/notifications/notifications-view";

export const metadata: Metadata = {
  title: "การแจ้งเตือน",
  description: "ศูนย์การแจ้งเตือนระบบสิ่งแวดล้อม",
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", user?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(50);

  return <NotificationsView notifications={notifications ?? []} />;
}
