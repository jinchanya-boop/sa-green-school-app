"use client";

import { useState } from "react";
import { Users, Plus, Trash2, Edit, Save, X, BookOpen, AlertCircle } from "lucide-react";
import { addHomeroom, updateHomeroom, deleteHomeroom } from "@/app/(dashboard)/settings/actions";
import { useRouter } from "next/navigation";
import { SearchableSelect } from "@/components/ui/searchable-select";

export function HomeroomsTab({ data }: { data: any }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const router = useRouter();

  // Only active academic years or all? Let's use active by default, or let them choose.
  // Actually, we should filter by academic year.
  const activeYear = data.academicYears.find((y: any) => y.is_active) || data.academicYears[0];
  const [selectedYearId, setSelectedYearId] = useState<string>(activeYear?.id || "");
  
  const teachers = data.profiles?.filter((p: any) => 
    ['homeroom_teacher', 'building_supervisor', 'grade_supervisor', 'deputy_director', 'director', 'administrator'].includes(p.role)
  ) || [];

  const filteredHomerooms = data.homerooms.filter((h: any) => h.academic_year_id === selectedYearId);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Auto-assign academic_year_id if not present
    if (!formData.get("academic_year_id")) {
      formData.append("academic_year_id", selectedYearId);
    }

    const res = await addHomeroom(formData);
    if (!res.success) {
      setErrorMsg(res.error || "Failed to add homeroom");
    } else {
      form.reset();
      router.refresh();
    }
    setLoading(false);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const res = await updateHomeroom(formData);
    if (!res.success) {
      setErrorMsg(res.error || "Failed to update homeroom");
    } else {
      setEditingId(null);
      router.refresh();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบห้องประจำชั้นนี้ใช่หรือไม่?")) return;
    setLoading(true);
    const res = await deleteHomeroom(id);
    if (!res.success) setErrorMsg(res.error || "Failed to delete");
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="stat-card space-y-6 bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              จัดการห้องประจำชั้น (Homerooms)
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              สร้างชื่อชั้นเรียน เช่น ม.1/1 และจับคู่กับห้องทางกายภาพ (สถานที่จริง)
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">ปีการศึกษา:</label>
            <select 
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              {data.academicYears.map((y: any) => (
                <option key={y.id} value={y.id}>{y.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAdd} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">ระดับชั้น</label>
              <select name="grade_level" required className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm">
                <option value="">เลือกระดับชั้น</option>
                {[1,2,3,4,5,6].map(g => (
                  <option key={g} value={g}>มัธยมศึกษาปีที่ {g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">ทับ (ห้อง)</label>
              <input type="number" name="class_number" min={1} max={20} required placeholder="เช่น 1" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">ห้องเรียนทางกายภาพ (อุปกรณ์/สถานที่)</label>
              <select name="room_id" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm">
                <option value="">-- ไม่ระบุ (เรียนเดินเรียน) --</option>
                {data.rooms.map((r: any) => {
                  const floor = data.floors.find((f: any) => f.id === r.floor_id);
                  const building = data.buildings.find((b: any) => b.id === r.building_id);
                  return (
                    <option key={r.id} value={r.id}>
                      {r.room_number} - {r.name} ({building?.name || 'ไม่ระบุอาคาร'})
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">ครูประจำชั้นคนที่ 1</label>
              <SearchableSelect 
                name="teacher_id_1" 
                options={teachers.map((t: any) => ({ id: t.id, label: t.full_name }))} 
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">ครูประจำชั้นคนที่ 2</label>
              <SearchableSelect 
                name="teacher_id_2" 
                options={teachers.map((t: any) => ({ id: t.id, label: t.full_name }))} 
              />
            </div>
          </div>
          <button type="submit" disabled={loading || !selectedYearId} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> เพิ่มห้องประจำชั้น
          </button>
        </form>

        <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-visible">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium">
              <tr>
                <th className="px-4 py-3">ชื่อห้อง</th>
                <th className="px-4 py-3">สถานที่ (ห้องเรียนจริง)</th>
                <th className="px-4 py-3">ครูประจำชั้น</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredHomerooms.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    ยังไม่มีข้อมูลห้องประจำชั้นในปีการศึกษานี้
                  </td>
                </tr>
              ) : filteredHomerooms.map((hr: any) => {
                const isEditing = editingId === hr.id;
                const assignedRoom = data.rooms.find((r: any) => r.id === hr.room_id);
                const assignedTeacherRecords = data.homeroomTeachers?.filter((ht: any) => ht.homeroom_id === hr.id) || [];
                const assignedTeacher1Record = assignedTeacherRecords.find((ht: any) => ht.is_primary);
                const assignedTeacher2Record = assignedTeacherRecords.find((ht: any) => !ht.is_primary);
                const assignedTeacher1 = assignedTeacher1Record ? data.profiles.find((p: any) => p.id === assignedTeacher1Record.teacher_id) : null;
                const assignedTeacher2 = assignedTeacher2Record ? data.profiles.find((p: any) => p.id === assignedTeacher2Record.teacher_id) : null;

                if (isEditing) {
                  return (
                    <tr key={hr.id} className="bg-indigo-50/50 dark:bg-indigo-900/10">
                      <td colSpan={5} className="p-4">
                        <form onSubmit={handleUpdate} className="flex flex-col sm:flex-row gap-3 items-end">
                          <input type="hidden" name="id" value={hr.id} />
                          <div className="w-full sm:w-1/4">
                            <label className="block text-xs font-medium text-gray-500 mb-1">ระดับชั้น (ม.)</label>
                            <input type="number" name="grade_level" defaultValue={hr.grade_level} min={1} max={6} required className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
                          </div>
                          <div className="w-full sm:w-1/4">
                            <label className="block text-xs font-medium text-gray-500 mb-1">ทับ (ห้อง)</label>
                            <input type="number" name="class_number" defaultValue={hr.class_number} min={1} max={20} required className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
                          </div>
                          <div className="w-full sm:w-2/4">
                            <label className="block text-xs font-medium text-gray-500 mb-1">สถานที่ (ห้องเรียนจริง)</label>
                            <select name="room_id" defaultValue={hr.room_id || ""} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm">
                              <option value="">-- ไม่ระบุ (เรียนเดินเรียน) --</option>
                              {data.rooms.map((r: any) => (
                                <option key={r.id} value={r.id}>{r.room_number} - {r.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="w-full sm:w-1/4">
                             <label className="block text-xs font-medium text-gray-500 mb-1">สถานะ</label>
                             <select name="is_active" defaultValue={hr.is_active ? "true" : "false"} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm">
                               <option value="true">ใช้งาน</option>
                               <option value="false">ปิดใช้งาน</option>
                             </select>
                          </div>
                          <div className="w-full sm:w-1/4">
                             <label className="block text-xs font-medium text-gray-500 mb-1">ครูคนที่ 1</label>
                             <SearchableSelect 
                               name="teacher_id_1" 
                               defaultValue={assignedTeacher1Record?.teacher_id || ""}
                               options={teachers.map((t: any) => ({ id: t.id, label: t.full_name }))} 
                             />
                          </div>
                          <div className="w-full sm:w-1/4">
                             <label className="block text-xs font-medium text-gray-500 mb-1">ครูคนที่ 2</label>
                             <SearchableSelect 
                               name="teacher_id_2" 
                               defaultValue={assignedTeacher2Record?.teacher_id || ""}
                               options={teachers.map((t: any) => ({ id: t.id, label: t.full_name }))} 
                             />
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <button type="submit" disabled={loading} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                              <Save className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={() => setEditingId(null)} className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={hr.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!hr.is_active ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3 font-semibold text-indigo-600 dark:text-indigo-400">
                      {hr.class_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 flex items-center gap-2">
                      {assignedRoom ? (
                        <>
                          <BookOpen className="w-4 h-4 text-emerald-500" />
                          {assignedRoom.room_number} - {assignedRoom.name}
                        </>
                      ) : (
                        <span className="text-gray-400 text-xs italic">-- ไม่ระบุ --</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {assignedTeacher1 || assignedTeacher2 ? (
                        <div className="flex flex-col gap-1 text-sm">
                          {assignedTeacher1 && <span>1. {assignedTeacher1.full_name}</span>}
                          {assignedTeacher2 && <span>2. {assignedTeacher2.full_name}</span>}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">-- ไม่ระบุ --</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        hr.is_active 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {hr.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setEditingId(hr.id)} disabled={loading} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(hr.id)} disabled={loading} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
