import { SupabaseClient } from "@supabase/supabase-js";

export async function notifyGradeHead(
  adminClient: SupabaseClient,
  gradeLevel: number,
  title: string,
  body: string,
  entityType: string,
  entityId: string,
  url: string
) {
  const { data: heads } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("grade_level", gradeLevel)
    .in("role", ["grade_supervisor", "homeroom_teacher", "building_supervisor"]);

  if (!heads || heads.length === 0) return;

  // Prefer grade_supervisor if multiple exist, otherwise notify all with the grade_level
  const gradeSupervisors = heads.filter((h: any) => h.role === "grade_supervisor");
  const targets = gradeSupervisors.length > 0 ? gradeSupervisors : heads;

  const notifications = targets.map((h: any) => ({
    recipient_id: h.id,
    title,
    body,
    entity_type: entityType,
    entity_id: entityId,
    action_url: url,
    event: "system_alert",
    channel: "in_app"
  }));

  await adminClient.from("notifications").insert(notifications);
}

export async function notifyBuildingHead(
  adminClient: SupabaseClient,
  buildingId: string,
  title: string,
  body: string,
  entityType: string,
  entityId: string,
  url: string
) {
  const { data: heads } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("building_id", buildingId)
    .in("role", ["building_supervisor", "grade_supervisor", "homeroom_teacher"]);

  if (!heads || heads.length === 0) return;

  const buildingSupervisors = heads.filter((h: any) => h.role === "building_supervisor");
  const targets = buildingSupervisors.length > 0 ? buildingSupervisors : heads;

  const notifications = targets.map((h: any) => ({
    recipient_id: h.id,
    title,
    body,
    entity_type: entityType,
    entity_id: entityId,
    action_url: url,
    event: "system_alert",
    channel: "in_app"
  }));

  await adminClient.from("notifications").insert(notifications);
}

export async function notifyUser(
  adminClient: SupabaseClient,
  userId: string,
  title: string,
  body: string,
  entityType: string,
  entityId: string,
  url: string
) {
  if (!userId) return;
  const notification = {
    recipient_id: userId,
    title,
    body,
    entity_type: entityType,
    entity_id: entityId,
    action_url: url,
    event: "system_alert",
    channel: "in_app"
  };
  await adminClient.from("notifications").insert(notification);
}

export async function notifyStudentCouncil(
  adminClient: SupabaseClient,
  title: string,
  body: string,
  entityType: string,
  entityId: string,
  url: string
) {
  const { data: councilMembers } = await adminClient
    .from("profiles")
    .select("id")
    .eq("role", "student_council");

  if (!councilMembers || councilMembers.length === 0) return;

  const notifications = councilMembers.map((member: any) => ({
    recipient_id: member.id,
    title,
    body,
    entity_type: entityType,
    entity_id: entityId,
    action_url: url,
    event: "system_alert",
    channel: "in_app"
  }));

  await adminClient.from("notifications").insert(notifications);
}
