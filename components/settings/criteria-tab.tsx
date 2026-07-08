"use client";

import { useState } from "react";
import { FileText, Save } from "lucide-react";
import { updateCriteriaScore, updateCriteriaName } from "@/app/(dashboard)/settings/actions";

export function CriteriaTab({ data }: { data: any }) {
  const [loading, setLoading] = useState(false);
  
  // Local state to handle inline editing before saving
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [tempScore, setTempScore] = useState<number>(10);

  const startEdit = (c: any) => {
    setEditingId(c.id);
    setTempName(c.name);
    setTempScore(c.max_score);
  };

  const handleSave = async (id: string) => {
    setLoading(true);
    // Update both name and score via separate actions or combined.
    // For simplicity, we fire both since they are quick.
    await updateCriteriaName(id, tempName);
    await updateCriteriaScore(id, tempScore);
    
    setEditingId(null);
    setLoading(false);
  };

  const moduleA = data.criteria.filter((c: any) => c.module === "area");
  const moduleB = data.criteria.filter((c: any) => c.module === "classroom");

  const renderTable = (items: any[], title: string, colorClass: string) => (
    <div className={`stat-card space-y-4 bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800`}>
      <h2 className={`font-semibold text-gray-900 dark:text-white flex items-center gap-2 ${colorClass}`}>
        <FileText className="w-5 h-5" />
        {title}
      </h2>
      <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium">
            <tr>
              <th className="px-4 py-3">หัวข้อการประเมิน</th>
              <th className="px-4 py-3 text-center w-32">คะแนนเต็ม</th>
              <th className="px-4 py-3 text-right w-24">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map((c: any) => (
              <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-4 py-3">
                  {editingId === c.id ? (
                    <input 
                      type="text" 
                      value={tempName} 
                      onChange={(e) => setTempName(e.target.value)}
                      className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <span className="font-medium">{c.name}</span>
                  )}
                  {c.description && editingId !== c.id && <div className="text-xs text-gray-500 mt-0.5">{c.description}</div>}
                </td>
                <td className="px-4 py-3 text-center">
                  {editingId === c.id ? (
                    <input 
                      type="number" 
                      value={tempScore} 
                      onChange={(e) => setTempScore(Number(e.target.value))}
                      className="w-20 px-2 py-1 text-center border rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{c.max_score}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {editingId === c.id ? (
                    <button onClick={() => handleSave(c.id)} disabled={loading} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                      <Save className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={() => startEdit(c)} disabled={loading} className="text-indigo-500 hover:text-indigo-700 text-xs font-medium px-2 py-1 rounded border border-indigo-100 hover:bg-indigo-50 transition-colors">
                      แก้ไข
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {renderTable(moduleA, "เกณฑ์ประเมินพื้นที่รับผิดชอบ (Module A)", "text-orange-500")}
      {renderTable(moduleB, "เกณฑ์ประเมินความสะอาดห้องเรียน (Module B)", "text-blue-500")}
    </div>
  );
}
