"use client";

import { motion, AnimatePresence } from "framer-motion";
import { School, Plus, Filter } from "lucide-react";
import { formatThaiDateShort, GRADE_BG, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { useState } from "react";
import { ClassroomEvalForm } from "./classroom-eval-form";
import { ClassroomDetailModal } from "./classroom-detail-modal";
import type { EvaluationCriteria, Room, SemesterRecord } from "@/types";

interface ClassroomEvalListProps {
  evaluations: any[]; // Using any here because it's from a view
  rooms: Room[];
  semesters: SemesterRecord[];
  criteria: EvaluationCriteria[];
  userRole?: string;
}

export function ClassroomEvalList({ evaluations, rooms, semesters, criteria, userRole }: ClassroomEvalListProps) {
  const [filter, setFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);

  const evals = evaluations;
  const filtered = filter === "all" ? evals : evals.filter((e) => e.status === filter);

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {isFormOpen ? (
          <ClassroomEvalForm 
            key="form"
            rooms={rooms}
            semesters={semesters}
            criteria={criteria}
            userRole={userRole}
            onCancel={() => setIsFormOpen(false)}
            onSuccess={() => setIsFormOpen(false)}
          />
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-50 dark:bg-purple-950 rounded-xl flex items-center justify-center">
                    <School className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    ประเมินความสะอาดห้องเรียน
                  </h1>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-10">
                  โมดูล B — ส่งรายงานโดยตัวแทนห้อง ประเมินโดยสภานักเรียน อนุมัติโดยหัวหน้าระดับ
                </p>
              </div>
              {userRole !== "student_council" && (
                <button 
                  onClick={() => setIsFormOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 gradient-green text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all shadow-md shadow-green-200/50"
                >
                  <Plus className="w-4 h-4" />
                  บันทึกการประเมินใหม่
                </button>
              )}
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-gray-400" />
              {["all", "draft", "submitted", "approved", "rejected"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === f ? "bg-green-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  {f === "all" ? "ทั้งหมด" : STATUS_LABELS[f as keyof typeof STATUS_LABELS]}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <School className="w-12 h-12 mb-3 opacity-20" />
                  <p className="font-medium">ไม่มีข้อมูลการประเมิน</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="text-left">ห้องเรียน</th>
                        <th className="text-left">รายงานโดย / ประเมินโดย</th>
                        <th className="text-center">คะแนน</th>
                        <th className="text-center">ระดับ</th>
                        <th className="text-center">สถานะ</th>
                        <th className="text-left">วันที่</th>
                        <th className="text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((ev) => (
                        <tr key={ev.id}>
                          <td>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {ev.room_name ?? "—"}
                            </p>
                            <p className="text-xs text-gray-400">{ev.building_name ?? ""}</p>
                          </td>
                          <td>
                            <div className="flex flex-col gap-0.5">
                              {ev.reporter_name && <span className="text-xs text-blue-600 dark:text-blue-400">📝 {ev.reporter_name}</span>}
                              {ev.evaluator_name && <span className="text-xs text-green-600 dark:text-green-400">✅ {ev.evaluator_name}</span>}
                              {!ev.reporter_name && !ev.evaluator_name && <span className="text-xs text-gray-400">—</span>}
                            </div>
                          </td>
                          <td className="text-center font-bold text-sm text-gray-900 dark:text-white">
                            {ev.percentage?.toFixed(1) ?? 0}%
                          </td>
                          <td className="text-center">
                            {ev.grade ? (
                              <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${GRADE_BG[ev.grade as keyof typeof GRADE_BG]}`}>
                                {ev.grade === "gold" ? "ทอง" : ev.grade === "silver" ? "เงิน" : ev.grade === "bronze" ? "ทองแดง" : "ไม่ผ่าน"}
                              </span>
                            ) : <span className="text-gray-400 text-xs">—</span>}
                          </td>
                          <td className="text-center">
                            <span className={`text-xs font-medium px-2 py-1 rounded-lg ${STATUS_COLORS[ev.status as keyof typeof STATUS_COLORS]}`}>
                              {STATUS_LABELS[ev.status as keyof typeof STATUS_LABELS]}
                            </span>
                          </td>
                          <td className="text-sm text-gray-400">
                            {ev.evaluated_at ? formatThaiDateShort(ev.evaluated_at) : "—"}
                          </td>
                          <td className="text-center">
                            <button 
                              onClick={() => setSelectedDetail(ev)}
                              className="px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950 rounded-lg transition-colors"
                            >
                              ดูรายละเอียด
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedDetail && (
        <ClassroomDetailModal 
          evaluation={selectedDetail} 
          userRole={userRole}
          criteria={criteria}
          onClose={() => setSelectedDetail(null)} 
        />
      )}
    </div>
  );
}
