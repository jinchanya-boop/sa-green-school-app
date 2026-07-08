import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AreaApprovalList } from "@/components/evaluation/area-approval-list";

export const metadata: Metadata = {
  title: "รอการอนุมัติ | ประเมินพื้นที่รับผิดชอบ",
  description: "อนุมัติผลการประเมินพื้นที่รับผิดชอบ",
};

export default async function AreaApprovalPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single();

  // Fetch only submitted evaluations
  let { data: evaluations } = await supabase
    .from("v_area_evaluations_full")
    .select("*")
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false });

  if (evaluations) {
    const isAdmin = profile?.role === 'administrator' || profile?.role === 'director' || profile?.role === 'deputy_director';
    const isGradeHead = !!profile?.grade_level;

    if (!isAdmin && isGradeHead) {
      // Filter evaluations for this grade head based on homeroom_name (e.g., "ม.1/2")
      evaluations = evaluations.filter(ev => {
        if (!ev.homeroom_name) return false;
        // Parse grade level from string like "ม.1/2" -> "1"
        const gradeStr = ev.homeroom_name.match(/ม\.(\d+)/)?.[1];
        return gradeStr && parseInt(gradeStr) === profile.grade_level;
      });
    } else if (!isAdmin) {
      // Normal teachers shouldn't see any area approvals
      evaluations = [];
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">รายการรออนุมัติ</h1>
        <p className="text-gray-500 dark:text-gray-400">
          ตรวจสอบและอนุมัติผลการประเมินพื้นที่รับผิดชอบ
        </p>
      </div>
      <AreaApprovalList evaluations={evaluations ?? []} />
    </div>
  );
}
