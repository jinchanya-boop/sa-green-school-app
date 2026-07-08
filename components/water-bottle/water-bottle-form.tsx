"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Droplets, X, Save, Users, CheckSquare } from "lucide-react";
import { submitWaterBottleCheck } from "@/app/(dashboard)/water-bottle/actions";
import type { Homeroom, SemesterRecord, Student } from "@/types";

interface WaterBottleFormProps {
  homerooms: Homeroom[];
  semesters: SemesterRecord[];
  students: Student[];
  assignedHomeroomId?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export function WaterBottleForm({ homerooms, semesters, students, assignedHomeroomId, onCancel, onSuccess }: WaterBottleFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHomeroom, setSelectedHomeroom] = useState<string>(assignedHomeroomId || "");

  const activeSemester = semesters.find(s => s.is_active);
  const filteredStudents = students
    .filter(s => s.homeroom_id === selectedHomeroom)
    .sort((a, b) => {
      const aNum = parseInt(a.student_number || "");
      const bNum = parseInt(b.student_number || "");
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return (a.student_number || "").localeCompare(b.student_number || "");
    });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await submitWaterBottleCheck(formData);

    setLoading(false);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || "เกิดข้อผิดพลาดในการบันทึก");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Droplets className="w-5 h-5 text-cyan-600" />
          บันทึกการตรวจแก้วน้ำส่วนตัว
        </h2>
        <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <input type="hidden" name="semester_id" value={activeSemester?.id || ""} />

        {/* Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ห้องประจำชั้น</label>
            <select 
              name="homeroom_id" 
              required
              value={selectedHomeroom}
              onChange={(e) => setSelectedHomeroom(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
            >
              <option value="">-- เลือกห้อง --</option>
              {homerooms.map(h => (
                <option key={h.id} value={h.id}>{h.class_name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">วันที่ตรวจ</label>
            <input 
              type="date"
              name="check_date"
              defaultValue={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Student Checklist */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-gray-400" />
              รายชื่อนักเรียน
            </h3>
            <div className="text-sm text-gray-500">
              พบนักเรียน {filteredStudents.length} คน
            </div>
          </div>
          
          {selectedHomeroom ? (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium">
                  <tr>
                    <th className="px-4 py-3 w-16 text-center">เลขที่</th>
                    <th className="px-4 py-3">ชื่อ-นามสกุล</th>
                    <th className="px-4 py-3 w-24 text-center text-cyan-700 dark:text-cyan-400">พกแก้ว</th>
                    <th className="px-4 py-3 w-24 text-center text-gray-500">ไม่พก</th>
                    <th className="px-4 py-3 w-24 text-center text-amber-600 dark:text-amber-400">ลา</th>
                    <th className="px-4 py-3 w-24 text-center text-red-600 dark:text-red-400">ขาด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                        ไม่มีรายชื่อนักเรียนในห้องนี้
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s, i) => (
                      <tr key={s.id} className="hover:bg-white dark:hover:bg-gray-800 transition-colors">
                        <td className="px-4 py-3 text-center text-gray-500">
                          {s.student_number || i + 1}
                          <input type="hidden" name="student_id[]" value={s.id} />
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {s.first_name} {s.last_name}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input 
                            type="radio" 
                            name={`status_${s.id}`} 
                            value="bottle"
                            defaultChecked
                            className="w-5 h-5 text-cyan-600 focus:ring-cyan-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input 
                            type="radio" 
                            name={`status_${s.id}`}
                            value="no_bottle" 
                            className="w-5 h-5 text-gray-500 focus:ring-gray-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input 
                            type="radio" 
                            name={`status_${s.id}`}
                            value="leave" 
                            className="w-5 h-5 text-amber-500 focus:ring-amber-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input 
                            type="radio" 
                            name={`status_${s.id}`}
                            value="absent" 
                            className="w-5 h-5 text-red-600 focus:ring-red-500"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400 flex flex-col items-center">
              <Users className="w-12 h-12 mb-3 opacity-20" />
              <p>กรุณาเลือกห้องประจำชั้นก่อน เพื่อแสดงรายชื่อนักเรียน</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button 
            type="button" 
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            ยกเลิก
          </button>
          <button 
            type="submit" 
            disabled={loading || !selectedHomeroom || filteredStudents.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-200/50 dark:shadow-cyan-900/30 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {loading ? "กำลังบันทึก..." : "บันทึกผลการประเมิน"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
