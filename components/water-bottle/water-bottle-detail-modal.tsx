"use client";

import { motion } from "framer-motion";
import { X, Check, XCircle, Droplets, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatThaiDateShort, GRADE_BG, calculateGrade, STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";
import { approveWaterBottleCheck, rejectWaterBottleCheck } from "@/app/(dashboard)/water-bottle/actions";

interface WaterBottleDetailModalProps {
  record: any;
  userRole: string;
  onClose: () => void;
}

export function WaterBottleDetailModal({ record, userRole, onClose }: WaterBottleDetailModalProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");

  const needsApproval = ["grade_supervisor", "deputy_director", "administrator"].includes(userRole || "") && record.status === "submitted";

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("student_water_bottle_statuses")
        .select(`
          *,
          students (
            student_number,
            first_name,
            last_name
          )
        `)
        .eq("water_bottle_record_id", record.id)
        .order("student_number", { referencedTable: "students", ascending: true });
      
      setItems(data || []);
      setLoading(false);
    };
    fetchData();
  }, [record.id]);

  const handleApprove = async () => {
    setApproving(true);
    const result = await approveWaterBottleCheck(record.id, rejectNotes);
    if (result.success) {
      onClose();
    } else {
      alert("Error: " + result.error);
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectNotes) {
      alert("กรุณาระบุเหตุผลที่ไม่อนุมัติ");
      setApproving(false);
      return;
    }
    setApproving(true);
    const result = await rejectWaterBottleCheck(record.id, rejectNotes);
    if (result.success) {
      onClose();
    } else {
      alert("Error: " + result.error);
      setApproving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 dark:bg-gray-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100 dark:border-gray-800"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              รายละเอียดการตรวจแก้วน้ำ: {record.class_name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              วันที่ {record.check_date ? formatThaiDateShort(record.check_date) : "—"} • ตรวจโดย {record.teacher_name}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
              <p className="text-sm text-gray-500 mb-1">ผลการตรวจสอบ</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {record.percentage}%
                </span>
                <span className="text-sm font-medium text-gray-500">
                  ({record.students_with_bottle}/{record.students_present} คน)
                </span>
              </div>
            </div>
            
            <div className={`p-4 rounded-2xl border flex flex-col justify-center items-center ${
              record.status === "approved" ? "bg-green-50 border-green-100 text-green-700 dark:bg-green-900/20 dark:border-green-800/30" : 
              record.status === "rejected" ? "bg-red-50 border-red-100 text-red-700 dark:bg-red-900/20 dark:border-red-800/30" : 
              "bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800/30"
            }`}>
              <p className="text-sm mb-1 opacity-80">สถานะ</p>
              <p className="font-bold">{STATUS_LABELS[record.status as keyof typeof STATUS_LABELS] || record.status}</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">รายชื่อนักเรียนและผลการตรวจสอบ</h3>
            
            {loading ? (
              <div className="py-12 flex justify-center">
                <span className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium">
                    <tr>
                      <th className="px-4 py-3 w-16">เลขที่</th>
                      <th className="px-4 py-3">ชื่อ-นามสกุล</th>
                      <th className="px-4 py-3 text-center w-24">พกแก้วน้ำ</th>
                      <th className="px-4 py-3 text-center w-24">ลา</th>
                      <th className="px-4 py-3 text-center w-24">ขาดเรียน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                    {items.map((item) => (
                      <tr key={item.id} className={item.is_absent || item.is_leave ? "opacity-50" : ""}>
                        <td className="px-4 py-3 text-gray-500">{item.students?.student_number}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {item.students?.first_name} {item.students?.last_name}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.has_bottle ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            !item.is_absent && !item.is_leave && <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.is_leave && <Check className="w-5 h-5 text-amber-500 mx-auto" />}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.is_absent && <Check className="w-5 h-5 text-red-500 mx-auto" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Approval Form */}
        {needsApproval && (
          <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ความคิดเห็นเพิ่มเติม / เหตุผลที่ไม่อนุมัติ (ถ้ามี)
            </label>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="เช่น ข้อมูลไม่ครบถ้วน..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all mb-4"
              rows={2}
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
                className="px-6 py-2.5 rounded-xl font-medium text-white bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-200/50 dark:shadow-cyan-900/30 transition-all disabled:opacity-50"
              >
                {approving ? "กำลังดำเนินการ..." : "รับทราบ/อนุมัติ"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
