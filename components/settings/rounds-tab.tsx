"use client";

import { useState } from "react";
import { Plus, Trash2, Calendar } from "lucide-react";

export interface EvaluationRound {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  announce_date: string;
}

export function RoundsTab({ initialRounds }: { initialRounds: EvaluationRound[] }) {
  const [rounds, setRounds] = useState<EvaluationRound[]>(initialRounds || []);
  const [isSaving, setIsSaving] = useState(false);

  const addRound = () => {
    const newRound: EvaluationRound = {
      id: crypto.randomUUID(),
      name: "",
      start_date: "",
      end_date: "",
      announce_date: "",
    };
    setRounds([...rounds, newRound]);
  };

  const removeRound = (id: string) => {
    setRounds(rounds.filter(r => r.id !== id));
  };

  const updateRound = (id: string, field: keyof EvaluationRound, value: string) => {
    setRounds(rounds.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const { updateEvaluationRounds } = await import("@/app/(dashboard)/settings/actions");
      const res = await updateEvaluationRounds(rounds);
      if (res.success) {
        alert("บันทึกข้อมูลรอบการประเมินสำเร็จ");
      } else {
        alert("เกิดข้อผิดพลาด: " + res.error);
      }
    } catch (e) {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="stat-card space-y-6 bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            รอบการประเมินรายเดือน
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            กำหนดวันที่เริ่มต้น สิ้นสุด และวันประกาศผลของแต่ละเดือน กราฟแดชบอร์ดจะนับสัปดาห์ (จันทร์-ศุกร์) ตามช่วงเวลาเหล่านี้
          </p>
        </div>
        <button
          onClick={addRound}
          className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> เพิ่มรอบ
        </button>
      </div>

      {rounds.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-gray-500">
          ยังไม่ได้กำหนดรอบการประเมิน
        </div>
      ) : (
        <div className="space-y-4">
          {rounds.map((round) => (
            <div key={round.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 relative group">
              <div className="md:col-span-3">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">ชื่อรอบ (เช่น ส.ค. 67)</label>
                <input
                  type="text"
                  value={round.name}
                  onChange={(e) => updateRound(round.id, "name", e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น ส.ค. 67"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">วันเริ่มประเมิน</label>
                <input
                  type="date"
                  value={round.start_date}
                  onChange={(e) => updateRound(round.id, "start_date", e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">วันสิ้นสุด</label>
                <input
                  type="date"
                  value={round.end_date}
                  onChange={(e) => updateRound(round.id, "end_date", e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">วันประกาศผล</label>
                <input
                  type="date"
                  value={round.announce_date}
                  onChange={(e) => updateRound(round.id, "announce_date", e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-1 flex items-end pb-1 justify-end">
                <button
                  onClick={() => removeRound(round.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title="ลบรอบนี้"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
        </button>
      </div>
    </div>
  );
}
