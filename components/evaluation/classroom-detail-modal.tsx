import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Image as ImageIcon, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calculateGrade, formatThaiDate } from "@/lib/utils";
import { evaluateClassroomReport, approveClassroomEvaluation, rejectClassroomEvaluation } from "@/app/(dashboard)/classroom-eval/actions";

interface ClassroomDetailModalProps {
  evaluation: any;
  userRole?: string;
  criteria?: any[];
  onClose: () => void;
}

export function ClassroomDetailModal({ evaluation, userRole, criteria = [], onClose }: ClassroomDetailModalProps) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [evalItems, setEvalItems] = useState<any[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [rejectNotes, setRejectNotes] = useState("");
  const [approving, setApproving] = useState(false);

  const needsScoring = userRole === "student_council" && evaluation.status === "draft";
  const needsApproval = ["building_supervisor", "grade_supervisor", "administrator"].includes(userRole || "") && evaluation.status === "submitted";

  useEffect(() => {
    const fetchPhotos = async () => {
      const supabase = createClient();
      const { data: photosData } = await supabase
        .from("evaluation_photos")
        .select("*")
        .eq("evaluation_id", evaluation.id);
      
      setPhotos(photosData || []);

      const { data: itemsData } = await supabase
        .from("classroom_evaluation_items")
        .select(`
          *,
          evaluation_criteria (
            name
          )
        `)
        .eq("classroom_evaluation_id", evaluation.id);
      
      setEvalItems(itemsData || []);

      setLoadingPhotos(false);
    };
    fetchPhotos();
  }, [evaluation.id, evaluation.status]);

  async function handleSubmitScores(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await evaluateClassroomReport(evaluation.id, formData);
    
    if (result.success) {
      onClose(); // Close on success
    } else {
      setError(result.error || "เกิดข้อผิดพลาดในการบันทึก");
      setSubmitting(false);
    }
  }

  const handleApprove = async () => {
    setApproving(true);
    const result = await approveClassroomEvaluation(evaluation.id, rejectNotes);
    setApproving(false);
    if (result.success) onClose();
    else alert(result.error);
  };

  const handleReject = async () => {
    if (!rejectNotes.trim()) {
      alert("กรุณาระบุเหตุผลที่ไม่อนุมัติ (Rejection Reason)");
      return;
    }
    setApproving(true);
    const result = await rejectClassroomEvaluation(evaluation.id, rejectNotes);
    setApproving(false);
    if (result.success) onClose();
    else alert(result.error);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {needsScoring ? "ประเมินห้องเรียน: " : "รายละเอียดการประเมิน: "} {evaluation.room_name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              รายงานโดย {evaluation.reporter_name || "—"} {evaluation.evaluator_name && `• ประเมินโดย ${evaluation.evaluator_name}`} • สัปดาห์ที่ {evaluation.eval_week}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="m-6 mb-0 p-4 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900 text-sm">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Photos */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-500" />
              ภาพถ่ายประกอบ
            </h3>
            
            {loadingPhotos ? (
              <div className="h-32 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl">
                <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
              </div>
            ) : photos.length === 0 ? (
              <div className="p-4 bg-yellow-50 text-yellow-700 rounded-xl text-sm">
                ไม่พบภาพถ่ายประกอบ
              </div>
            ) : (
              <div className="space-y-6">
                {/* Student Photos */}
                {photos.some(p => p.caption === 'class_rep' || p.caption === null || p.caption === 'other') && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">ภาพจากตัวแทนห้อง (นักเรียน)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {photos.filter(p => p.caption === 'class_rep' || p.caption === null || p.caption === 'other').map(p => (
                        <div key={p.id} className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                          <img src={p.public_url} alt="รูปภาพจากตัวแทนห้อง" className="object-cover w-full h-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Student Council Photos */}
                {photos.some(p => p.caption && p.caption.includes('student_council')) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">ภาพจากองค์กรนักเรียน</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {photos.filter(p => p.caption && p.caption.includes('student_council')).map(p => (
                        <div key={p.id} className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                          <img src={p.public_url} alt="รูปภาพจากองค์กรนักเรียน" className="object-cover w-full h-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Grading / Scoring */}
          {needsScoring ? (
            <form id="scoring-form" onSubmit={handleSubmitScores} className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800">
                ให้คะแนนการประเมิน (เกณฑ์ 10 ข้อ)
              </h3>
              <div className="space-y-3">
                {criteria.map((c) => {
                  const item = evalItems.find(i => i.criteria_id === c.id);
                  return (
                  <div key={c.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-start gap-4">
                    <input type="hidden" name="criteria_id[]" value={c.id} />
                    <input type="hidden" name="max_score[]" value={c.max_score} />
                    
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white text-sm">{c.name}</div>
                      {c.description && <div className="text-xs text-gray-500 mt-0.5">{c.description}</div>}
                    </div>
                    
                    <div className="w-24">
                      <input 
                        type="number"
                        name="score[]" 
                        min="0"
                        max={c.max_score}
                        step="0.5"
                        required
                        defaultValue={item?.score ?? ""}
                        placeholder={`0-${c.max_score}`}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-bold"
                      />
                    </div>
                    <div className="flex-1 max-w-[150px]">
                      <input 
                        type="text"
                        name="item_notes[]"
                        defaultValue={item?.notes ?? ""}
                        placeholder="หมายเหตุ"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                      />
                    </div>
                  </div>
                )})}
              </div>
              
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  ภาพถ่ายยืนยันการประเมิน (ไม่บังคับ)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">ภาพถ่ายที่ 1</label>
                    <input type="file" name="photo_1" accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">ภาพถ่ายที่ 2</label>
                    <input type="file" name="photo_2" accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800">
                คะแนนการประเมิน
              </h3>
              
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">คะแนนรวม</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">{evaluation.total_score} / {evaluation.max_score || 30}</p>
                </div>
                <div className="w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex-1 text-right">
                  <p className="font-medium text-gray-900 dark:text-white">สถานะ</p>
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mt-1">
                    {evaluation.status === 'submitted' ? 'รอการอนุมัติ' : evaluation.status === 'approved' ? 'อนุมัติแล้ว' : evaluation.status === 'rejected' ? 'ไม่อนุมัติ' : 'แบบร่าง'}
                  </p>
                </div>
              </div>
              {(evaluation.status === 'approved' || evaluation.status === 'submitted') && Number(evaluation.total_score) > 0 && (
                <div className="text-sm text-gray-500">
                  ผลการประเมิน: <strong className="text-gray-900 dark:text-white">{(Number(evaluation.total_score) / (Number(evaluation.max_score) || 30) * 100).toFixed(2)}%</strong> 
                  (เกณฑ์: {calculateGrade((Number(evaluation.total_score) / (Number(evaluation.max_score) || 30)) * 100).toUpperCase()})
                </div>
              )}

              {/* Detailed Score Breakdown */}
              {evalItems.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800">
                    รายละเอียดคะแนนแต่ละเกณฑ์
                  </h4>
                  <div className="space-y-2">
                    {evalItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.evaluation_criteria?.name}</p>
                          {item.notes && <p className="text-xs text-gray-500 mt-1">หมายเหตุ: {item.notes}</p>}
                        </div>
                        <div className="ml-4 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg whitespace-nowrap">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.score}</span>
                          <span className="text-xs text-gray-500 ml-1">/ {item.max_score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {evaluation.approver_notes && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ความคิดเห็นจากผู้อนุมัติ
              </label>
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50">
                {evaluation.approver_notes}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            {needsScoring ? "ยกเลิก" : "ปิดหน้าต่าง"}
          </button>
          
          {needsScoring && (
            <button
              type="submit"
              form="scoring-form"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/30 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {submitting ? "กำลังบันทึก..." : "ยืนยันผลการประเมิน"}
            </button>
          )}
        </div>

        {needsApproval && (
          <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ความคิดเห็นเพิ่มเติม / เหตุผลที่ไม่อนุมัติ (ถ้ามี)
            </label>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="เช่น รูปถ่ายไม่ชัดเจน, พื้นยังไม่สะอาด..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all mb-4"
              rows={3}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleReject}
                disabled={approving}
                className="px-6 py-2.5 rounded-xl font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
              >
                {approving ? "กำลังดำเนินการ..." : "ไม่อนุมัติ"}
              </button>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="px-6 py-2.5 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/30 transition-all disabled:opacity-50"
              >
                {approving ? "กำลังดำเนินการ..." : "อนุมัติผลการประเมิน"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
