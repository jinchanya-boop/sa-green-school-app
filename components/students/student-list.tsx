"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Users, ShieldPlus, RotateCcw, UserX, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StudentFormModal } from "./student-form-modal";
import { deleteStudent, restoreStudent, updateStudentRole, generateStudentAccount } from "@/app/(dashboard)/students/actions";

interface StudentListProps {
  homerooms: any[];
  students: any[];
}

export function StudentList({ homerooms, students }: StudentListProps) {
  const router = useRouter();
  const [selectedHomeroom, setSelectedHomeroom] = useState<string>(homerooms[0]?.id || "");
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Filter students for current homeroom
  const homeroomStudents = students.filter(s => s.homeroom_id === selectedHomeroom);
  const activeStudentsCount = homeroomStudents.filter(s => s.is_active).length;
  const inactiveStudentsCount = homeroomStudents.filter(s => !s.is_active).length;

  const filteredStudents = homeroomStudents
    .filter(s => (activeTab === "active" ? s.is_active : !s.is_active))
    .sort((a, b) => {
      const aNum = parseInt(a.student_number);
      const bNum = parseInt(b.student_number);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return (a.student_number || "").localeCompare(b.student_number || "");
    });

  const handleSoftDelete = async (id: string, name: string) => {
    if (confirm(`คุณต้องการแจ้งจำหน่าย/ลาออก สำหรับ ${name} ใช่หรือไม่?\n(ข้อมูลจะถูกเปลี่ยนสถานะเป็นจำหน่ายออกและย้ายไปแท็บ "จำหน่าย / ลาออก")`)) {
      setLoadingId(id);
      const res = await deleteStudent(id, false);
      setLoadingId(null);
      if (!res.success) {
        alert(`ไม่สามารถจำหน่ายนักเรียนได้: ${res.error}`);
      } else {
        router.refresh();
      }
    }
  };

  const handleHardDelete = async (id: string, name: string) => {
    if (confirm(`⚠️ ยืนยันการลบข้อมูลถาวรของ ${name}?\n\nการลบถาวรจะไม่สามารถกู้คืนข้อมูลได้ หากต้องการเพียงระบุว่านักเรียนลาออก ให้เลือก "จำหน่าย/ลาออก" แทน`)) {
      setLoadingId(id);
      const res = await deleteStudent(id, true);
      setLoadingId(null);
      if (!res.success) {
        alert(`ไม่สามารถลบข้อมูลถาวรได้: ${res.error}`);
      } else {
        router.refresh();
      }
    }
  };

  const handleRestore = async (id: string, name: string) => {
    if (confirm(`คุณต้องการคืนสภาพนักเรียน ${name} กลับเข้าชั้นเรียนใช่หรือไม่?`)) {
      setLoadingId(id);
      const res = await restoreStudent(id);
      setLoadingId(null);
      if (!res.success) {
        alert(`ไม่สามารถคืนสภาพนักเรียนได้: ${res.error}`);
      } else {
        router.refresh();
      }
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
      setLoadingId(studentId);
      const res = await updateStudentRole(studentId, role);
      setLoadingId(null);
      if (!res.success) {
        alert(res.error);
      } else {
        router.refresh();
      }
    }
  };

  const handleGenerateAccount = async (studentId: string) => {
    if (confirm("ระบบจะสร้างบัญชีสำหรับนักเรียนคนนี้เพื่อใช้เข้าระบบประเมิน ยืนยันหรือไม่?")) {
      setLoadingId(studentId);
      const res = await generateStudentAccount(studentId);
      setLoadingId(null);
      if (res.success && res.email!) {
        const username = res.email!.split("@")[0];
        alert(`สร้างบัญชีสำเร็จ!\nชื่อผู้ใช้งาน: ${username}\nรหัสผ่าน: ${res.password}\n(โปรดแจ้งข้อมูลนี้ให้นักเรียนทราบ)`);
        router.refresh();
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
            เพิ่ม แก้ไข จำหน่ายออก/ลาออก และจัดการสิทธิ์รายชื่อนักเรียนในแต่ละห้องเรียน
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="w-full sm:w-72">
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

          {/* Status Tabs */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl self-start sm:self-end">
            <button
              onClick={() => setActiveTab("active")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "active"
                  ? "bg-white dark:bg-gray-900 text-cyan-600 dark:text-cyan-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              นักเรียนปัจจุบัน ({activeStudentsCount})
            </button>
            <button
              onClick={() => setActiveTab("inactive")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "inactive"
                  ? "bg-white dark:bg-gray-900 text-amber-600 dark:text-amber-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <UserX className="w-3.5 h-3.5" />
              จำหน่าย / ลาออก ({inactiveStudentsCount})
            </button>
          </div>
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
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>
                      {activeTab === "active"
                        ? "ยังไม่มีรายชื่อนักเรียนในห้องนี้"
                        : "ไม่มีรายการนักเรียนที่ลาออก/จำหน่ายออก ในห้องนี้"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, i) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-center text-gray-500 font-medium">
                      {s.student_number || i + 1}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {s.national_id || "-"}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>{s.full_name}</span>
                        {!s.is_active && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 rounded-full">
                            ลาออก/จำหน่าย ({s.left_at || "ไม่ระบุวัน"})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.is_active ? (
                        s.profiles ? (
                          <select
                            value={s.profiles.role}
                            disabled={loadingId === s.id}
                            onChange={(e) => handleUpdateRole(s.id, e.target.value)}
                            className="w-full min-w-[140px] px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
                          >
                            <option value="student">นักเรียนทั่วไป</option>
                            <option value="class_representative">หัวหน้าห้อง/เวร</option>
                            <option value="student_council">สภานักเรียน</option>
                          </select>
                        ) : (
                          <button
                            onClick={() => handleGenerateAccount(s.id)}
                            disabled={loadingId === s.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {loadingId === s.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ShieldPlus className="w-3.5 h-3.5" />
                            )}
                            สร้างบัญชีตัวแทน
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-gray-400 font-normal">ปิดใช้งานบัญชี</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {loadingId === s.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
                        ) : s.is_active ? (
                          <>
                            <button
                              onClick={() => handleEdit(s)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="แก้ไขข้อมูล"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleSoftDelete(s.id, s.full_name)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                              title="แจ้งลาออก / จำหน่ายออก"
                            >
                              <UserX className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleHardDelete(s.id, s.full_name)}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="ลบข้อมูลถาวร"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRestore(s.id, s.full_name)}
                              className="p-1.5 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                              title="คืนสภาพนักเรียน"
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span>คืนสภาพ</span>
                            </button>

                            <button
                              onClick={() => handleHardDelete(s.id, s.full_name)}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="ลบข้อมูลถาวร"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
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
            onClose={() => {
              setIsFormOpen(false);
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
