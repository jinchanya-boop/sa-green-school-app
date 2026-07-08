"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, CheckCircle, XCircle, Clock, Filter, RefreshCw } from "lucide-react";
import { formatThaiDateShort, GRADE_BG, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { useState } from "react";
import { AreaEvaluationForm } from "./area-evaluation-form";
import { AreaDetailModal } from "./area-detail-modal";
import type { EvaluationCriteria, ResponsibleArea, SemesterRecord, AreaEvaluation } from "@/types";

interface AreaEvaluationListProps {
  evaluations: any[]; // Using any here because it's from a view
  areas: ResponsibleArea[];
  semesters: SemesterRecord[];
  criteria: EvaluationCriteria[];
  userRole?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

export function AreaEvaluationList({ evaluations, areas, semesters, criteria, userRole }: AreaEvaluationListProps) {
  const [filter, setFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);

  const evals = evaluations;
  const filtered = filter === "all" ? evals : evals.filter((e) => e.status === filter);

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {isFormOpen ? (
          <AreaEvaluationForm 
            key="form"
            areas={areas}
            semesters={semesters}
            criteria={criteria}
            userRole={userRole}
            onCancel={() => setIsFormOpen(false)}
            onSuccess={() => setIsFormOpen(false)}
          />
        ) : (
          <motion.div
            key="list"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Map Modal */}
            <AnimatePresence>
              {isMapOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-2 shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-auto relative"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 mb-4 sticky top-0 bg-white dark:bg-gray-900 z-10">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-500" />
                        แผนผังเขตพื้นที่รับผิดชอบ
                      </h2>
                      <button onClick={() => setIsMapOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <XCircle className="w-6 h-6" />
                      </button>
                    </div>
                    <img src="/images/area.jpg" alt="แผนผังเขตพื้นที่" className="w-full h-auto rounded-xl" />
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    ประเมินพื้นที่รับผิดชอบ
                  </h1>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-10">
                  โมดูล A — บันทึกและติดตามผลการประเมินพื้นที่รับผิดชอบ
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsMapOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-xl text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-sm"
                >
                  <MapPin className="w-4 h-4" />
                  ดูแผนผังพื้นที่
                </button>
                {userRole !== "student_council" && (
                  <button 
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 gradient-green text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all shadow-md shadow-green-200/50 dark:shadow-green-900/30"
                  >
                    <Plus className="w-4 h-4" />
                    บันทึกการประเมินใหม่
                  </button>
                )}
              </div>
            </motion.div>

            {/* Summary Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "ทั้งหมด", value: evals.length, icon: RefreshCw, color: "text-gray-600", bg: "bg-gray-50 dark:bg-gray-800" },
                { label: "รอการอนุมัติ", value: evals.filter((e) => e.status === "submitted").length, icon: Clock, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950" },
                { label: "อนุมัติแล้ว", value: evals.filter((e) => e.status === "approved").length, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" },
                { label: "ปฏิเสธ", value: evals.filter((e) => e.status === "rejected").length, icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950" },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="stat-card !p-4 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${s.bg}`}>
                      <Icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                      <p className="text-xs text-gray-400">{s.label}</p>
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* Filter Tabs */}
            {/* Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-gray-400" />
              {["all", "draft", "submitted", "approved", "rejected"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {f === "all" ? "ทั้งหมด" : STATUS_LABELS[f as keyof typeof STATUS_LABELS]}
                </button>
              ))}
            </div>

            {/* Table / List */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <MapPin className="w-12 h-12 mb-3 opacity-20" />
                  <p className="font-medium">ไม่มีข้อมูลการประเมิน</p>
                  <p className="text-sm mt-1">เริ่มต้นด้วยการกดปุ่ม "บันทึกการประเมินใหม่"</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="text-left">พื้นที่</th>
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
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                {ev.area_name ?? "—"}
                              </p>
                              <p className="text-xs text-gray-400">
                                {ev.location_description ?? ""}
                              </p>
                            </div>
                          </td>
                          <td>
                            <div className="flex flex-col gap-0.5">
                              {ev.reporter_name && <span className="text-xs text-blue-600 dark:text-blue-400">📝 {ev.reporter_name}</span>}
                              {ev.evaluator_name && <span className="text-xs text-green-600 dark:text-green-400">✅ {ev.evaluator_name}</span>}
                              {!ev.reporter_name && !ev.evaluator_name && <span className="text-xs text-gray-400">—</span>}
                            </div>
                          </td>
                          <td className="text-center">
                            <span className="font-bold text-gray-900 dark:text-white text-sm">
                              {ev.percentage?.toFixed(1) ?? 0}%
                            </span>
                          </td>
                          <td className="text-center">
                            {ev.grade ? (
                              <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${GRADE_BG[ev.grade as keyof typeof GRADE_BG]}`}>
                                {ev.grade === "gold" ? "ทอง" : ev.grade === "silver" ? "เงิน" : ev.grade === "bronze" ? "ทองแดง" : "ไม่ผ่าน"}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedDetail && (
        <AreaDetailModal 
          evaluation={selectedDetail} 
          userRole={userRole}
          criteria={criteria}
          onClose={() => setSelectedDetail(null)} 
        />
      )}
    </div>
  );
}
