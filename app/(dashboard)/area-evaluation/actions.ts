"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { notifyGradeHead } from "@/lib/notifications";

export async function submitAreaEvaluation(formData: FormData) {
  const supabase = await createClient();
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Parse Form Data
  const responsible_area_id = formData.get("responsible_area_id") as string;
  const semester_id = formData.get("semester_id") as string;
  const evaluated_at = formData.get("evaluated_at") as string || new Date().toISOString();
  const evaluator_notes = formData.get("evaluator_notes") as string;
  const status = formData.get("status") as "draft" | "submitted";
  
  const criteriaIds = formData.getAll("criteria_id[]") as string[];
  const scores = formData.getAll("score[]") as string[];
  const maxScores = formData.getAll("max_score[]") as string[];
  const itemNotes = formData.getAll("item_notes[]") as string[];

  // Photos (received directly in FormData after client-side compression)
  const photo1 = formData.get("photo_1") as File;
  const photo2 = formData.get("photo_2") as File;

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
  if (!responsible_area_id || !semester_id) {
    return { success: false, error: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน" };
  }
  
  if (!isReporter && criteriaIds.length === 0) {
    return { success: false, error: "กรุณากรอกคะแนนการประเมินให้ครบถ้วน" };
  }

  // Prevent duplicate submission for the same room and date
  const evalDate = new Date(evaluated_at);
  const startOfDay = new Date(evalDate.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(evalDate.setHours(23, 59, 59, 999)).toISOString();

  const { data: existing } = await supabase
    .from("area_evaluations")
    .select("id")
    .eq("responsible_area_id", responsible_area_id)
    .gte("evaluated_at", startOfDay)
    .lte("evaluated_at", endOfDay)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "มีการประเมินในพื้นที่นี้สำหรับวันที่เลือกไปแล้ว" };
  }

  // Calculate totals
  let total_score = 0;
  let max_score = 0;
  
  const itemsToInsert = criteriaIds.map((id, index) => {
    const s = parseFloat(scores[index] || "0");
    const ms = parseFloat(maxScores[index] || "3");
    total_score += s;
    max_score += ms;
    return {
      criteria_id: id,
      score: s,
      max_score: ms,
      notes: itemNotes[index] || null,
    };
  });

  // 1. Insert into area_evaluations
  const { data: evalData, error: evalError } = await supabase
    .from("area_evaluations")
    .insert({
      responsible_area_id,
      semester_id,
      reporter_id: isReporter ? user.id : null,
      evaluator_id: isReporter ? null : user.id, // Class rep self evaluates, but is not the final evaluator
      status: isReporter ? "draft" : (status || "submitted"),
      total_score,
      max_score,
      evaluator_notes: evaluator_notes || null,
      evaluated_at,
      submitted_at: (!isReporter && status === "submitted") ? new Date().toISOString() : null,
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
      area_evaluation_id: evalData.id
    }));

    const { error: itemsError } = await adminClient
      .from("area_evaluation_items")
      .insert(itemsWithEvalId);

    if (itemsError) {
      console.error("Items Insert Error:", itemsError);
      return { success: false, error: itemsError.message };
    }
  }

  // 3. Upload Photos (same pattern as classroom-eval)
  const uploadPromises: Promise<void>[] = [];

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
        evaluation_type: "area",
        storage_path: filePath,
        public_url: publicUrl,
        file_name: file.name,
        mime_type: file.type,
        photo_category: "other",
        caption: "class_rep",
        uploaded_by: user.id,
      });
    } else if (uploadError) {
      console.error(`Upload error for ${category}:`, uploadError);
    }
  };

  if (photo1 && photo1.size > 0) uploadPromises.push(uploadPhoto(photo1, "photo1"));
  if (photo2 && photo2.size > 0) uploadPromises.push(uploadPhoto(photo2, "photo2"));

  await Promise.all(uploadPromises);

  // 4. Send Notification if submitted
  if (!isReporter && status === "submitted") {
    // Get grade level for this area
    const { data: areaData } = await adminClient
      .from("responsible_areas")
      .select("homerooms(grade_level, class_name)")
      .eq("id", responsible_area_id)
      .single();
    
    if (areaData?.homerooms) {
      const homeroom = Array.isArray(areaData.homerooms) ? areaData.homerooms[0] : areaData.homerooms;
      if (homeroom?.grade_level) {
        const className = homeroom.class_name;
        await notifyGradeHead(
          adminClient,
          homeroom.grade_level,
          "มีการประเมินพื้นที่รับผิดชอบใหม่",
          `รอการอนุมัติ: ประเมินพื้นที่รับผิดชอบของห้อง ${className}`,
        "area_evaluation",
        evalData.id,
        "/area-evaluation/approvals"
      );
    }
  }

  // 5. Revalidate path to refresh list
  revalidatePath("/area-evaluation");

  return { success: true, evaluation_id: evalData.id };
}

export async function approveAreaEvaluation(evaluationId: string, percentage: number, grade: string, notes: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await adminClient
    .from("area_evaluations")
    .update({
      status: "approved",
      approver_id: user?.id,
      approver_notes: notes,
      percentage,
      grade,
      approved_at: new Date().toISOString(),
    })
    .eq("id", evaluationId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/area-evaluation");
  revalidatePath("/area-evaluation/approvals");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function rejectAreaEvaluation(evaluationId: string, reason: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await adminClient
    .from("area_evaluations")
    .update({
      status: "rejected",
      approver_id: user?.id,
      rejection_reason: reason,
      rejected_at: new Date().toISOString(),
    })
    .eq("id", evaluationId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/area-evaluation");
  revalidatePath("/area-evaluation/approvals");
  return { success: true };
}

export async function evaluateAreaReport(evaluationId: string, formData: FormData) {
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
      area_evaluation_id: evaluationId,
      criteria_id: id,
      score: s,
      max_score: ms,
      notes: itemNotes[index] || null,
    };
  });

  const { error: evalError } = await supabase
    .from("area_evaluations")
    .update({
      evaluator_id: user.id, // Update evaluator to the Student Council member
      total_score,
      max_score,
      status: "submitted", // stays submitted for Supervisor to approve
      submitted_at: new Date().toISOString()
    })
    .eq("id", evaluationId);

  if (evalError) return { success: false, error: evalError.message };

  await adminClient.from("area_evaluation_items").delete().eq("area_evaluation_id", evaluationId);

  const { error: itemsError } = await adminClient
    .from("area_evaluation_items")
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
        evaluation_type: "area",
        storage_path: filePath,
        public_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        photo_category: "other",
        caption: "student_council",
        uploaded_by: user.id
      });
    } else if (uploadError) {
      console.error(`Upload error for student council:`, uploadError);
    }
  };

  if (photo1 && photo1.size > 0) uploadPromises.push(uploadPhoto(photo1, "photo1"));
  if (photo2 && photo2.size > 0) uploadPromises.push(uploadPhoto(photo2, "photo2"));
  
  await Promise.all(uploadPromises);

  // Notify Grade Head
  const { data: evalData } = await adminClient
    .from("area_evaluations")
    .select("responsible_areas(homerooms(grade_level, class_name))")
    .eq("id", evaluationId)
    .single();

  if (evalData?.responsible_areas?.homerooms?.grade_level) {
    const className = evalData.responsible_areas.homerooms.class_name;
    await notifyGradeHead(
      adminClient,
      evalData.responsible_areas.homerooms.grade_level,
      "มีการประเมินพื้นที่รับผิดชอบใหม่ (โดยสภานักเรียน)",
      `รอการอนุมัติ: ประเมินพื้นที่รับผิดชอบของห้อง ${className}`,
      "area_evaluation",
      evaluationId,
      "/area-evaluation/approvals"
    );
  }

  revalidatePath("/area-evaluation");
  return { success: true };
}
