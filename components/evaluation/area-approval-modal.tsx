"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Check, XCircle, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { approveAreaEvaluation, rejectAreaEvaluation } from "@/app/(dashboard)/area-evaluation/actions";
import { calculateGrade, formatThaiDate } from "@/lib/utils";

interface AreaApprovalModalProps {
  evaluation: any;
  onClose: () => void;
}

export function AreaApprovalModal({ evaluation, onClose }: AreaApprovalModalProps) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  
  const [score, setScore] = useState<number>(Number(evaluation.total_score));
  const [notes, setNotes] = useState("");
  
  const [photos, setPhotos] = useState<any[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      const [photosRes, itemsRes] = await Promise.all([
        supabase.from("evaluation_photos").select("*").eq("evaluation_id", evaluation.id),
        supabase.from("area_evaluation_items").select("*, evaluation_criteria(name)").eq("area_evaluation_id", evaluation.id)
      ]);
      
      setPhotos(photosRes.data || []);
      setLoadingPhotos(false);
      
      setItems(itemsRes.data || []);
      setLoadingItems(false);
    };
    fetchData();
  }, [evaluation.id]);

  const handleApprove = async () => {
    setLoading(true);
    const maxScore = Number(evaluation.max_score);
    const percentage = (score / maxScore) * 100;
    const grade = calculateGrade(percentage);

    const result = await approveAreaEvaluation(evaluation.id, percentage, grade, notes);
    setLoading(false);
    if (result.success) onClose();
    else alert(result.error);
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      alert("กรุณาระบุเหตุผลที่ไม่อนุมัติ (Rejection Reason)");
      return;
    }
    setLoading(true);
    const result = await rejectAreaEvaluation(evaluation.id, notes);
    setLoading(false);
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
              ตรวจสอบการประเมิน: {evaluation.area_name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              วันที่ {formatThaiDate(evaluation.evaluated_at)} • โดย {evaluation.evaluator_name}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Photos */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-500" />
              ภาพถ่ายประกอบ
            </h3>
            
            {loadingPhotos ? (
              <div className="h-32 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl">
                <span className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
              </div>
            ) : photos.length === 0 ? (
              <div className="p-4 bg-yellow-50 text-yellow-700 rounded-xl text-sm">
                ไม่พบภาพถ่ายประกอบ
              </div>
            ) : (
              <div className="space-y-6">
                {/* Student Photos */}
                {photos.some(p => p.caption === 'class_rep') && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">ภาพจากตัวแทนห้อง (นักเรียน)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {photos.filter(p => p.caption === 'class_rep').map(p => (
                        <div key={p.id} className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                          <img src={p.public_url} alt="รูปภาพจากตัวแทนห้อง" className="object-cover w-full h-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Student Council Photos */}
                {photos.some(p => p.caption === 'student_council') && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">ภาพจากองค์กรนักเรียน</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {photos.filter(p => p.caption === 'student_council').map(p => (
                        <div key={p.id} className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                          <img src={p.public_url} alt="รูปภาพจากองค์กรนักเรียน" className="object-cover w-full h-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Legacy/Other Photos without explicit caption */}
                {photos.some(p => p.caption !== 'class_rep' && p.caption !== 'student_council') && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">ภาพอื่นๆ</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {photos.filter(p => p.caption !== 'class_rep' && p.caption !== 'student_council').map(p => (
                        <div key={p.id} className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                          <img src={p.public_url} alt="รูปภาพทั่วไป" className="object-cover w-full h-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Detailed Criteria Scores */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <span>รายละเอียดคะแนนรายข้อ (องค์กรนักเรียนประเมิน)</span>
            </h3>
            
            {loadingItems ? (
              <div className="h-20 flex items-center justify-center">
                <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
              </div>
            ) : items.length === 0 ? (
              <div className="text-sm text-gray-500">ไม่พบข้อมูลคะแนนรายข้อ</div>
            ) : (
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.evaluation_criteria?.name || 'เกณฑ์การประเมิน'}
                      </span>
                      <span className="text-sm font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded text-right">
                        {item.score} / {item.max_score}
                      </span>
                    </div>
                    {item.notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                        หมายเหตุ: {item.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grading */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800">
              พิจารณาคะแนน
            </h3>
            
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">คะแนนจากการประเมินขององค์กรนักเรียน</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{evaluation.total_score} / {evaluation.max_score}</p>
              </div>
              <div className="w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ปรับแก้คะแนน (ถ้ามี)
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    min="0"
                    max={evaluation.max_score}
                    step="0.5"
                    value={score}
                    onChange={e => setScore(Number(e.target.value))}
                    className="w-24 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-center font-bold"
                  />
                  <span className="text-gray-500">/ {evaluation.max_score}</span>
                </div>
              </div>
            </div>
            
            {/* Percentage & Grade Preview */}
            <div className="text-sm text-gray-500">
              ผลการประเมิน: <strong className="text-gray-900 dark:text-white">{(score / Number(evaluation.max_score) * 100).toFixed(2)}%</strong> 
              (เกณฑ์: {calculateGrade((score / Number(evaluation.max_score)) * 100).toUpperCase()})
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              ความคิดเห็น / เหตุผล (บังคับหากไม่อนุมัติ)
            </label>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="เช่น ทำความสะอาดได้ดีมาก หรือ ยังมีขยะบริเวณ..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 flex justify-between items-center gap-4">
          <button
            onClick={() => setAction(action === "reject" ? null : "reject")}
            className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
              action === "reject" ? "bg-red-100 text-red-700" : "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            }`}
          >
            ไม่อนุมัติ (ส่งให้แก้ไข)
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              ยกเลิก
            </button>
            
            {action === "reject" ? (
              <button
                onClick={handleReject}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700"
              >
                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <XCircle className="w-5 h-5" />}
                ยืนยันการไม่อนุมัติ
              </button>
            ) : (
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white gradient-green hover:opacity-90 transition-all shadow-md shadow-green-500/20"
              >
                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Check className="w-5 h-5" />}
                อนุมัติผลการประเมิน
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
