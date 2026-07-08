"use client";

import { useState } from "react";
import { formatThaiDate } from "@/lib/utils";
import { CheckCircle, XCircle, Eye, Search } from "lucide-react";
import { AreaApprovalModal } from "./area-approval-modal";

interface AreaApprovalListProps {
  evaluations: any[]; // Using any for simplicity here, maps to v_area_evaluations_full
}

export function AreaApprovalList({ evaluations }: AreaApprovalListProps) {
  const [selectedEval, setSelectedEval] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = evaluations.filter((e) => {
    const search = searchTerm.toLowerCase();
    return (
      e.area_name?.toLowerCase().includes(search) ||
      e.evaluator_name?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="ค้นหาตามชื่อพื้นที่ หรือผู้ประเมิน..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        />
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            ไม่มีรายการรออนุมัติ
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 font-medium">
                <tr>
                  <th className="px-6 py-4">วันที่ประเมิน</th>
                  <th className="px-6 py-4">พื้นที่รับผิดชอบ</th>
                  <th className="px-6 py-4">ผู้ประเมิน (ตัวแทนห้อง)</th>
                  <th className="px-6 py-4">คะแนนรวม (ก่อนอนุมัติ)</th>
                  <th className="px-6 py-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {formatThaiDate(e.evaluated_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{e.area_name}</div>
                      <div className="text-gray-500 text-xs">{e.location_description}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {e.evaluator_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900 dark:text-white">{e.total_score}</span>
                      <span className="text-gray-500"> / {e.max_score}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedEval(e)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        ตรวจสอบ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedEval && (
        <AreaApprovalModal 
          evaluation={selectedEval} 
          onClose={() => setSelectedEval(null)} 
        />
      )}
    </div>
  );
}
