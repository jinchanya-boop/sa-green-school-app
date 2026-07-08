"use client";

import { useState } from "react";
import { GraduationCap, Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { addAcademicYear, deleteAcademicYear, setActiveAcademicYear, addSemester, deleteSemester, setActiveSemester } from "@/app/(dashboard)/settings/actions";

import { useRouter } from "next/navigation";

export function AcademicTab({ data }: { data: any }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleAddYear = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await addAcademicYear(formData);
    if (!res.success) {
      setErrorMsg(res.error || "Failed to add academic year");
    } else {
      form.reset();
      router.refresh();
    }
    setLoading(false);
  };

  const handleAddSemester = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await addSemester(formData);
    if (!res.success) {
      setErrorMsg(res.error || "Failed to add semester");
    } else {
      form.reset();
      router.refresh();
    }
    setLoading(false);
  };

  const handleSetYearActive = async (id: string) => {
    setLoading(true);
    const res = await setActiveAcademicYear(id);
    if (!res.success) setErrorMsg(res.error || "Failed to update status");
    router.refresh();
    setLoading(false);
  };

  const handleDeleteYear = async (id: string) => {
    if (!confirm("ต้องการลบใช่หรือไม่?")) return;
    setLoading(true);
    const res = await deleteAcademicYear(id);
    if (!res.success) setErrorMsg(res.error || "Failed to delete");
    router.refresh();
    setLoading(false);
  };

  const handleSetSemesterActive = async (id: string) => {
    setLoading(true);
    const res = await setActiveSemester(id);
    if (!res.success) setErrorMsg(res.error || "Failed to update status");
    router.refresh();
    setLoading(false);
  };

  const handleDeleteSemester = async (id: string) => {
    if (!confirm("ต้องการลบใช่หรือไม่?")) return;
    setLoading(true);
    const res = await deleteSemester(id);
    if (!res.success) setErrorMsg(res.error || "Failed to delete");
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Academic Years */}
      <div className="stat-card space-y-6 bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-500" />
            ปีการศึกษา
          </h2>
        </div>
        
        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAddYear} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">ปีการศึกษา (พ.ศ.)</label>
            <input type="number" name="year" min={2560} required className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="เช่น 2567" />
          </div>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </form>

        <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium">
              <tr>
                <th className="px-4 py-3">ปีการศึกษา</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.academicYears.map((year: any) => (
                <tr key={year.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{year.label}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleSetYearActive(year.id)} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border border-transparent">
                      {year.is_active ? (
                        <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> ปัจจุบัน</span>
                      ) : (
                        <span className="text-gray-400 hover:text-gray-600 flex items-center gap-1"><Circle className="w-3.5 h-3.5" /> ตั้งเป็นปัจจุบัน</span>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDeleteYear(year.id)} disabled={loading} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Semesters */}
      <div className="stat-card space-y-6 bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-500" />
            ภาคเรียน
          </h2>
        </div>

        <form onSubmit={handleAddSemester} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">ปีการศึกษา</label>
            <select name="academic_year_id" required className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
              <option value="">เลือกปี</option>
              {data.academicYears.map((y: any) => <option key={y.id} value={y.id}>{y.label}</option>)}
            </select>
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">ภาคเรียน</label>
            <select name="semester" required className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">เริ่ม</label>
            <input type="date" name="start_date" required className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">สิ้นสุด</label>
            <input type="date" name="end_date" required className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
          </div>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors">
            <Plus className="w-4 h-4 mx-auto" />
          </button>
        </form>

        <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium">
              <tr>
                <th className="px-4 py-3">ปีการศึกษา</th>
                <th className="px-4 py-3">ภาคเรียน</th>
                <th className="px-4 py-3 text-center">ระยะเวลา</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.semesters.map((sem: any) => {
                const year = data.academicYears.find((y: any) => y.id === sem.academic_year_id);
                return (
                  <tr key={sem.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{year?.label}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{sem.label}</td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">{sem.start_date} - {sem.end_date}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleSetSemesterActive(sem.id)} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border border-transparent">
                        {sem.is_active ? (
                          <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> ปัจจุบัน</span>
                        ) : (
                          <span className="text-gray-400 hover:text-gray-600 flex items-center gap-1"><Circle className="w-3.5 h-3.5" /> ตั้งเป็นปัจจุบัน</span>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDeleteSemester(sem.id)} disabled={loading} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
