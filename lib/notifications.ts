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

  const { data: gsData } = await adminClient
    .from("grade_supervisors")
    .select("supervisor_id")
    .eq("grade_level", gradeLevel);

  const targets = new Set<string>();

  if (heads) {
    heads.forEach((h: any) => {
      if (h.role === "grade_supervisor") {
        targets.add(h.id);
      }
    });
  }

  if (gsData) {
    gsData.forEach((gs: any) => targets.add(gs.supervisor_id));
  }

  if (targets.size === 0 && heads && heads.length > 0) {
    heads.forEach((h: any) => targets.add(h.id));
  }

  if (targets.size === 0) return;

  const notifications = Array.from(targets).map((id) => ({
    recipient_id: id,
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

  const { data: buildingData } = await adminClient
    .from("buildings")
    .select("supervisor_id")
    .eq("id", buildingId)
    .single();

  const targets = new Set<string>();

  if (buildingData?.supervisor_id) {
    targets.add(buildingData.supervisor_id);
  }

  if (heads) {
    heads.forEach((h: any) => {
      if (h.role === "building_supervisor") {
        targets.add(h.id);
      }
    });
  }

  if (targets.size === 0 && heads && heads.length > 0) {
    heads.forEach((h: any) => targets.add(h.id));
  }

  if (targets.size === 0) return;

  const notifications = Array.from(targets).map((id) => ({
    recipient_id: id,
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
