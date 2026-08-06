"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markAllAsRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("markAllAsRead error:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/notifications");
  return { success: true };
}

export async function deleteNotification(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("recipient_id", user.id);

  if (error) {
    console.error("deleteNotification error:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/notifications");
  return { success: true };
}
