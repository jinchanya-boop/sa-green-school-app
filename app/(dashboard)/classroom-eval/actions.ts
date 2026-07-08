"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { notifyBuildingHead } from "@/lib/notifications";

export async function submitClassroomEvaluation(formData: FormData) {
  const supabase = await createClient();
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Parse Form Data
  const room_id = formData.get("room_id") as string;
  const semester_id = formData.get("semester_id") as string;
  const eval_date = formData.get("eval_date") as string;
  const evaluated_at = eval_date ? new Date(`${eval_date}T12:00:00Z`).toISOString() : new Date().toISOString();
  const evaluator_notes = formData.get("evaluator_notes") as string;
  
  const criteriaIds = formData.getAll("criteria_id[]") as string[];
  const scores = formData.getAll("score[]") as string[];
  const maxScores = formData.getAll("max_score[]") as string[];
  const itemNotes = formData.getAll("item_notes[]") as string[];

  // Get current user (Evaluator)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "Authentication required" };
  }

  // Get user role to determine if they are reporting or evaluating
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = profile?.role || "guest";
  
  const isReporter = role === "class_representative";

  // Basic Validation
  if (!room_id || !semester_id) {
    return { success: false, error: "Missing required fields" };
  }
  
  if (!isReporter && criteriaIds.length === 0) {
    return { success: false, error: "Missing criteria scoring" };
  }

  // Find homeroom for this room to link it properly
  const { data: homeroom } = await supabase
    .from("homerooms")
    .select("id")
    .eq("room_id", room_id)
    .single();

  // Calculate totals
  let total_score = 0;
  let max_score = 0;
  
  const itemsToInsert = criteriaIds.map((id, index) => {
    const s = parseFloat(scores[index] || "0");
    const ms = parseFloat(maxScores[index] || "10");
    total_score += s;
    max_score += ms;
    return {
      criteria_id: id,
      score: s,
      max_score: ms,
      notes: itemNotes[index] || null,
    };
  });

  // 1. Insert into classroom_evaluations
  const { data: evalData, error: evalError } = await adminClient
    .from("classroom_evaluations")
    .insert({
      room_id,
      homeroom_id: homeroom?.id || null,
      semester_id,
      reporter_id: isReporter ? user.id : null,
      evaluator_id: isReporter ? null : user.id,
      evaluated_at,
      eval_round: 1, // simplified for now
      status: isReporter ? "draft" : "submitted",
      total_score: total_score,
      max_score: max_score,
      evaluator_notes: evaluator_notes || null,
    })
    .select("id")
    .single();

  if (evalError || !evalData) {
    console.error("Evaluation Insert Error:", evalError);
    return { success: false, error: evalError?.message || "Failed to submit evaluation" };
  }

  // 2. Insert items
  if (itemsToInsert.length > 0) {
    const itemsWithEvalId = itemsToInsert.map(item => ({
      ...item,
      classroom_evaluation_id: evalData.id
    }));

    const { error: itemsError } = await adminClient
      .from("classroom_evaluation_items")
      .insert(itemsWithEvalId);

    if (itemsError) {
      console.error("Items Insert Error:", itemsError);
      return { success: false, error: itemsError.message };
    }
  }

  // 3. Upload Photos
  const photo1 = formData.get("photo_1") as File;
  const photo2 = formData.get("photo_2") as File;
  const uploadPromises = [];
  
  const uploadPhoto = async (file: File, category: string) => {
    if (!file || file.size === 0) return;
    const ext = file.name.split('.').pop();
    const filePath = `${evalData.id}/${category}_${Date.now()}.${ext}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("evaluation-photos")
      .upload(filePath, file);

    if (!uploadError && uploadData) {
      const { data: { publicUrl } } = supabase.storage
        .from("evaluation-photos")
        .getPublicUrl(filePath);

      await adminClient.from("evaluation_photos").insert({
        evaluation_id: evalData.id,
        evaluation_type: "classroom",
        storage_path: filePath,
        public_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        photo_category: "other",
        caption: category,
        uploaded_by: user.id,
      });
    }
  };

  if (photo1 && photo1.size > 0) {
    uploadPromises.push(uploadPhoto(photo1, "class_rep"));
  }
  if (photo2 && photo2.size > 0) {
    uploadPromises.push(uploadPhoto(photo2, "class_rep"));
  }

  await Promise.all(uploadPromises);

  // 4. Send Notification if submitted
  if (!isReporter && evalData) {
    const { data: roomData } = await adminClient
      .from("rooms")
      .select("building_id, name")
      .eq("id", room_id)
      .single();
      
    if (roomData?.building_id) {
      await notifyBuildingHead(
        adminClient,
        roomData.building_id,
        "มีการประเมินห้องเรียนใหม่",
        `รอการอนุมัติ: ประเมินความสะอาดห้องเรียน ${roomData.name}`,
        "classroom_evaluation",
        evalData.id,
        "/classroom-eval"
      );
    }
  }

  // 5. Revalidate path to refresh list
  revalidatePath("/classroom-eval");

  return { success: true, evaluation_id: evalData.id };
}

export async function submitClassroomReport(formData: FormData) {
  const supabase = await createClient();

  // Parse Form Data
  const room_id = formData.get("room_id") as string;
  const semester_id = formData.get("semester_id") as string;
  const eval_week = parseInt(formData.get("eval_week") as string) || 1;
  const evaluator_notes = formData.get("evaluator_notes") as string;
  
  // Get current user (Reporter)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "Authentication required" };
  }

  if (!room_id || !semester_id) {
    return { success: false, error: "Missing required fields" };
  }

  // Find homeroom for this room to link it properly
  const { data: homeroom } = await supabase
    .from("homerooms")
    .select("id")
    .eq("room_id", room_id)
    .single();

  // 1. Insert into classroom_evaluations
  const { data: evalData, error: evalError } = await supabase
    .from("classroom_evaluations")
    .insert({
      room_id,
      homeroom_id: homeroom?.id || null,
      semester_id,
      evaluator_id: user.id, // Class Rep ID temporarily
      eval_week,
      eval_round: 1,
      status: "submitted",
      total_score: 0,
      max_score: 0,
      evaluator_notes: evaluator_notes || null,
    })
    .select("id")
    .single();

  if (evalError || !evalData) {
    return { success: false, error: evalError?.message || "Failed to submit report" };
  }

  // 2. Upload Photos
  const photo1 = formData.get("photo_1") as File;
  const photo2 = formData.get("photo_2") as File;
  const uploadPromises = [];
  
  const uploadPhoto = async (file: File, category: string) => {
    if (!file || file.size === 0) return;
    const ext = file.name.split('.').pop();
    const filePath = `${evalData.id}/${category}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("evaluation-photos")
      .upload(filePath, file);

    if (uploadError) return;

    const { data: { publicUrl } } = supabase.storage
      .from("evaluation-photos")
      .getPublicUrl(filePath);

    await supabase.from("evaluation_photos").insert({
      evaluation_id: evalData.id,
      evaluation_type: "classroom",
      storage_path: filePath,
      public_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      caption: category,
      uploaded_by: user.id
    });
  };

  if (photo1 && photo1.size > 0) uploadPromises.push(uploadPhoto(photo1, "other"));
  if (photo2 && photo2.size > 0) uploadPromises.push(uploadPhoto(photo2, "other"));
  
  await Promise.all(uploadPromises);
  revalidatePath("/classroom-eval");
  return { success: true };
}

export async function evaluateClassroomReport(evaluationId: string, formData: FormData) {
  const supabase = await createClient();
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const criteriaIds = formData.getAll("criteria_id[]") as string[];
  const scores = formData.getAll("score[]") as string[];
  const maxScores = formData.getAll("max_score[]") as string[];
  const itemNotes = formData.getAll("item_notes[]") as string[];

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: "Authentication required" };
  }

  let total_score = 0;
  let max_score = 0;
  
  const itemsToInsert = criteriaIds.map((id, index) => {
    const s = parseFloat(scores[index] || "0");
    const ms = parseFloat(maxScores[index] || "3");
    total_score += s;
    max_score += ms;
    return {
      classroom_evaluation_id: evaluationId,
      criteria_id: id,
      score: s,
      max_score: ms,
      notes: itemNotes[index] || null,
    };
  });

  const percentage = (total_score / (max_score || 30)) * 100;

  // Grade calculation (Premium: 27-30 (90%), Gold: 23-26 (76.6%), Silver: 18-22 (60%), Bronze: 0-17)
  let grade = "bronze";
  if (total_score >= 27) grade = "premium";
  else if (total_score >= 23) grade = "gold";
  else if (total_score >= 18) grade = "silver";

  const { error: evalError } = await adminClient
    .from("classroom_evaluations")
    .update({
      evaluator_id: user.id, // Update evaluator to the Student Council member
      total_score,
      max_score,
      percentage,
      grade,
      status: "submitted", // stays submitted for Supervisor to approve
      evaluated_at: new Date().toISOString()
    })
    .eq("id", evaluationId);

  if (evalError) return { success: false, error: evalError.message };

  await adminClient.from("classroom_evaluation_items").delete().eq("classroom_evaluation_id", evaluationId);

  const { error: itemsError } = await adminClient
    .from("classroom_evaluation_items")
    .insert(itemsToInsert);

  if (itemsError) return { success: false, error: itemsError.message };

  // Upload Photos (Student Council)
  const photo1 = formData.get("photo_1") as File;
  const photo2 = formData.get("photo_2") as File;
  const uploadPromises = [];
  
  const uploadPhoto = async (file: File, category: string) => {
    if (!file || file.size === 0) return;
    const ext = file.name.split('.').pop();
    const filePath = `${evaluationId}/${category}_${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from("evaluation-photos")
      .upload(filePath, arrayBuffer, { contentType: file.type });

    if (!uploadError && uploadData) {
      const { data: { publicUrl } } = adminClient.storage
        .from("evaluation-photos")
        .getPublicUrl(filePath);

      await adminClient.from("evaluation_photos").insert({
        evaluation_id: evaluationId,
        evaluation_type: "classroom",
        storage_path: filePath,
        public_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        caption: "student_council",
        uploaded_by: user.id
      });
    }
  };

  if (photo1 && photo1.size > 0) uploadPromises.push(uploadPhoto(photo1, "photo1"));
  if (photo2 && photo2.size > 0) uploadPromises.push(uploadPhoto(photo2, "photo2"));
  
  await Promise.all(uploadPromises);

  // Notify Building Head
  const { data: evData } = await adminClient
    .from("classroom_evaluations")
    .select("rooms(building_id, name)")
    .eq("id", evaluationId)
    .single();

  if (evData?.rooms?.building_id) {
    await notifyBuildingHead(
      adminClient,
      evData.rooms.building_id,
      "มีการประเมินห้องเรียนใหม่ (โดยสภานักเรียน)",
      `รอการอนุมัติ: ประเมินความสะอาดห้องเรียน ${evData.rooms.name}`,
      "classroom_evaluation",
      evaluationId,
      "/classroom-eval"
    );
  }

  revalidatePath("/classroom-eval");
  return { success: true };
}

export async function approveClassroomEvaluation(id: string, notes?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Authentication required" };

  const { error } = await supabase
    .from("classroom_evaluations")
    .update({ 
      status: "approved",
      approver_id: user.id,
      approver_notes: notes || null
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/classroom-eval");
  return { success: true };
}

export async function rejectClassroomEvaluation(id: string, notes: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Authentication required" };

  const { error } = await supabase
    .from("classroom_evaluations")
    .update({ 
      status: "rejected",
      approver_id: user.id,
      approver_notes: notes
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/classroom-eval");
  return { success: true };
}
