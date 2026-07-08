"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { StudentFormModal } from "./student-form-modal";
import { deleteStudent, updateStudentRole, generateStudentAccount } from "@/app/(dashboard)/students/actions";
import { UserCheck, ShieldPlus } from "lucide-react";

interface StudentListProps {
  homerooms: any[];
  students: any[];
}

export function StudentList({ homerooms, students }: StudentListProps) {
  const [selectedHomeroom, setSelectedHomeroom] = useState<string>(homerooms[0]?.id || "");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);

  const filteredStudents = students
    .filter(s => s.homeroom_id === selectedHomeroom && s.is_active)
    .sort((a, b) => {
      // Sort by student number if possible
      const aNum = parseInt(a.student_number);
      const bNum = parseInt(b.student_number);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return (a.student_number || "").localeCompare(b.student_number || "");
    });

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`คุณต้องการลบข้อมูลของ ${name} ใช่หรือไม่?`)) {
      await deleteStudent(id);
    }
  };

  const handleEdit = (student: any) => {
    setEditingStudent(student);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingStudent(null);
    setIsFormOpen(true);
  };

  const handleUpdateRole = async (studentId: string, role: string) => {
    if (confirm("คุณต้องการเปลี่ยนสิทธิ์ของนักเรียนคนนี้ใช่หรือไม่?")) {
      const res = await updateStudentRole(studentId, role);
      if (!res.success) alert(res.error);
    }
  };

  const handleGenerateAccount = async (studentId: string) => {
    if (confirm("ระบบจะสร้างบัญชีสำหรับนักเรียนคนนี้เพื่อใช้เข้าระบบประเมิน ยืนยันหรือไม่?")) {
      const res = await generateStudentAccount(studentId);
      if (res.success && res.email!) {
        const username = res.email!.split("@")[0];
        alert(`สร้างบัญชีสำเร็จ!\nชื่อผู้ใช้งาน: ${username}\nรหัสผ่าน: ${res.password}\n(โปรดแจ้งข้อมูลนี้ให้นักเรียนทราบ)`);
      } else {
        alert(res.error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-600" />
            จัดการรายชื่อนักเรียน
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            เพิ่ม แก้ไข และลบรายชื่อนักเรียนในแต่ละห้องเรียน
          </p>
        </div>

        <button
          onClick={handleAddNew}
          disabled={!selectedHomeroom}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-cyan-200/50 dark:shadow-cyan-900/30 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          เพิ่มนักเรียนใหม่
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <div className="mb-6 max-w-sm">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            เลือกห้องเรียน
          </label>
          <select
            value={selectedHomeroom}
            onChange={(e) => setSelectedHomeroom(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
          >
            {homerooms.map((h) => (
              <option key={h.id} value={h.id}>
                {h.class_name} (ระดับชั้น {h.grade_level})
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3 w-20 text-center">เลขที่</th>
                <th className="px-4 py-3">รหัสนักเรียน</th>
                <th className="px-4 py-3">ชื่อ-นามสกุล</th>
                <th className="px-4 py-3 text-center">สิทธิ์ผู้รายงาน</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>ยังไม่มีรายชื่อนักเรียนในห้องนี้</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, i) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-center text-gray-500 font-medium">
                      {s.student_number || i + 1}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {s.national_id || "-"} {/* Display national ID or something as student ID */}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {s.full_name}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.profiles ? (
                        <select
                          value={s.profiles.role}
                          onChange={(e) => handleUpdateRole(s.id, e.target.value)}
                          className="w-full min-w-[140px] px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-1 focus:ring-cyan-500"
                        >
                          <option value="student">นักเรียนทั่วไป</option>
                          <option value="class_representative">หัวหน้าห้อง/เวร</option>
                          <option value="student_council">สภานักเรียน</option>
                        </select>
                      ) : (
                        <button
                          onClick={() => handleGenerateAccount(s.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded-lg text-xs font-medium transition-colors"
                        >
                          <ShieldPlus className="w-3.5 h-3.5" />
                          สร้างบัญชีตัวแทน
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(s)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.full_name)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <StudentFormModal
            student={editingStudent}
            homeroomId={selectedHomeroom}
            onClose={() => setIsFormOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
