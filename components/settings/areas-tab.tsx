"use client";

import { useState } from "react";
import { Building2, Plus, Trash2, Edit } from "lucide-react";
import { addResponsibleArea, updateResponsibleArea, deleteResponsibleArea } from "@/app/(dashboard)/settings/actions";

export function AreasTab({ data }: { data: any }) {
  const [loading, setLoading] = useState(false);
  const [editingArea, setEditingArea] = useState<any>(null);

  const handleAddArea = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const res = await addResponsibleArea(new FormData(form));
    if (!res.success) alert(res.error);
    else form.reset();
    setLoading(false);
  };

  const handleUpdateArea = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const res = await updateResponsibleArea(editingArea.id, new FormData(e.currentTarget));
    if (!res.success) alert(res.error);
    else setEditingArea(null);
    setLoading(false);
  };

  return (
    <>
      <div className="stat-card space-y-6 bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-rose-500" />
            จัดการพื้นที่รับผิดชอบ
          </h2>
        </div>

        <form onSubmit={handleAddArea} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">ชื่อพื้นที่</label>
            <input type="text" name="name" required placeholder="เช่น ลานจอดรถ" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm" />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">อาคารอ้างอิง</label>
            <select name="building_id" required className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm">
              <option value="">เลือกอาคาร</option>
              {data.buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">ห้องที่รับผิดชอบ</label>
            <select name="homeroom_id" required className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm">
              <option value="">เลือกห้อง</option>
              {data.homerooms.map((hr: any) => <option key={hr.id} value={hr.id}>{hr.class_name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">รายละเอียด</label>
            <input type="text" name="description" placeholder="รายละเอียดเพิ่มเติม" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition-colors flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> เพิ่ม
          </button>
        </form>

        <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium">
              <tr>
                <th className="px-4 py-3">ชื่อพื้นที่</th>
                <th className="px-4 py-3">รายละเอียด</th>
                <th className="px-4 py-3">อาคาร</th>
                <th className="px-4 py-3">ผู้รับผิดชอบ</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.areas.map((area: any) => (
                <tr key={area.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium">{area.name}</td>
                  <td className="px-4 py-3 text-gray-500">{area.description || "-"}</td>
                  <td className="px-4 py-3">{area.buildings?.name}</td>
                  <td className="px-4 py-3">
                    <span className="bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 px-2.5 py-1 rounded-full text-xs font-medium">
                      {area.homerooms?.class_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEditingArea(area)} className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => confirm("ต้องการลบใช่หรือไม่?") && deleteResponsibleArea(area.id).then(r => !r.success && alert(r.error))} disabled={loading} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.areas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    ไม่มีข้อมูลพื้นที่รับผิดชอบ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingArea && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleUpdateArea} className="bg-white dark:bg-gray-900 p-6 rounded-2xl max-w-sm w-full space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">แก้ไขพื้นที่รับผิดชอบ</h3>
            <div className="space-y-3">
              <input type="text" name="name" defaultValue={editingArea.name} required placeholder="ชื่อพื้นที่" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
              <select name="building_id" defaultValue={editingArea.building_id} required className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm">
                <option value="">เลือกอาคาร</option>
                {data.buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select name="homeroom_id" defaultValue={editingArea.homeroom_id} required className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm">
                <option value="">เลือกห้องที่รับผิดชอบ</option>
                {data.homerooms.map((hr: any) => <option key={hr.id} value={hr.id}>{hr.class_name}</option>)}
              </select>
              <input type="text" name="description" defaultValue={editingArea.description || ""} placeholder="รายละเอียดเพิ่มเติม" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingArea(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">ยกเลิก</button>
              <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-rose-600 text-white hover:bg-rose-700 rounded-lg">บันทึก</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
