"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, CheckCircle, XCircle, Clock, Filter, RefreshCw, Eye, Search, Calendar, Leaf, Trophy, Lightbulb } from "lucide-react";
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
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function AreaEvaluationList({ evaluations, areas, semesters, criteria, userRole }: AreaEvaluationListProps) {
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);

  const evals = evaluations;
  
  // Search & Filter Logic
  const filtered = evals.filter((e) => {
    const matchesFilter = filter === "all" || e.status === filter;
    const matchesSearch = (e.area_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (e.reporter_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (e.evaluator_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Calculate Average Progress
  const totalScore = evals.reduce((sum, e) => sum + (e.percentage || 0), 0);
  const avgScore = evals.length > 0 ? (totalScore / evals.length).toFixed(1) : "0";
  const greenLevel = Number(avgScore) >= 90 ? "Excellent" : Number(avgScore) >= 80 ? "Good" : Number(avgScore) >= 70 ? "Fair" : "Needs Improvement";

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
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-2 shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-auto relative"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 mb-4 sticky top-0 bg-white dark:bg-gray-900 z-10">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-green-500" />
                        แผนผังเขตพื้นที่รับผิดชอบ
                      </h2>
                      <button onClick={() => setIsMapOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <XCircle className="w-6 h-6" />
                      </button>
                    </div>
                    <img src="/images/area.jpg" alt="แผนผังเขตพื้นที่" className="w-full h-auto rounded-2xl" />
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Modern Hero Section */}
            <motion.div variants={itemVariants} className="bg-gradient-to-br from-green-50 to-emerald-100/50 dark:from-green-950/20 dark:to-emerald-900/10 rounded-3xl p-6 sm:p-8 border border-green-100/50 dark:border-green-900/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-64 h-64 bg-green-500/10 dark:bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400 shadow-sm">
                    <Leaf className="w-5 h-5" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                    ประเมินพื้นที่รับผิดชอบ
                  </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium pl-13">
                  "ร่วมกันดูแลโรงเรียนให้น่าอยู่และเป็นมิตรกับสิ่งแวดล้อม"
                </p>
              </div>

              <div className="relative z-10 flex items-center gap-6 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/50 dark:border-gray-800 shadow-sm">
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Today's Progress</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-green-600 dark:text-green-400">{avgScore}%</span>
                    <span className="text-sm font-bold text-gray-400">{greenLevel}</span>
                  </div>
                </div>
                <div className="w-16 h-16 relative">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <path
                      className="text-gray-200 dark:text-gray-800"
                      strokeWidth="3"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <motion.path
                      className="text-green-500"
                      strokeWidth="3"
                      strokeDasharray={`${avgScore}, 100`}
                      stroke="currentColor"
                      fill="none"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: "0, 100" }}
                      animate={{ strokeDasharray: `${avgScore}, 100` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* Actions & Filters */}
            <motion.div variants={itemVariants} className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 w-full xl:w-auto scrollbar-hide">
                <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {["all", "draft", "submitted", "approved", "rejected"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                      filter === f
                        ? "bg-green-500 text-white shadow-md shadow-green-500/20"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700/50"
                    }`}
                  >
                    {f === "all" ? "ทั้งหมด" : STATUS_LABELS[f as keyof typeof STATUS_LABELS]}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 w-full xl:w-auto">
                <div className="relative flex-1 xl:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาพื้นที่ หรือผู้ประเมิน..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500/20 outline-none transition-all shadow-sm"
                  />
                </div>
                <button 
                  onClick={() => setIsMapOpen(true)}
                  className="p-2.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                  title="ดูแผนผังพื้นที่"
                >
                  <MapPin className="w-5 h-5" />
                </button>
                {userRole !== "student_council" && (
                  <button 
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full text-sm font-bold transition-all shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    ประเมินใหม่
                  </button>
                )}
              </div>
            </motion.div>

            {/* Summary Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "พื้นที่ทั้งหมด", value: evals.length, icon: RefreshCw, color: "from-blue-500 to-cyan-500", shadow: "shadow-blue-500/20" },
                { label: "รอการอนุมัติ", value: evals.filter((e) => e.status === "submitted").length, icon: Clock, color: "from-orange-400 to-amber-500", shadow: "shadow-orange-500/20" },
                { label: "อนุมัติแล้ว", value: evals.filter((e) => e.status === "approved").length, icon: CheckCircle, color: "from-green-500 to-emerald-500", shadow: "shadow-green-500/20" },
                { label: "คะแนนเฉลี่ย", value: avgScore + "%", icon: Trophy, color: "from-purple-500 to-fuchsia-500", shadow: "shadow-purple-500/20" },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <motion.div 
                    whileHover={{ y: -4 }}
                    key={s.label} 
                    className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group cursor-default"
                  >
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${s.color} opacity-5 rounded-full blur-xl group-hover:opacity-10 transition-opacity`} />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center shadow-lg ${s.shadow}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</p>
                        <p className="text-xs font-bold text-gray-400">{s.label}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Table / List */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-50/50 dark:bg-gray-900/50">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <MapPin className="w-8 h-8 opacity-50" />
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white mb-1">ไม่พบข้อมูลการประเมิน</p>
                  <p className="text-sm">ลองปรับตัวกรอง หรือเริ่มต้นด้วยการกดปุ่ม "ประเมินใหม่"</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-50/50 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 font-bold sticky top-0 z-10 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
                      <tr>
                        <th className="px-6 py-4 rounded-tl-3xl whitespace-nowrap">พื้นที่รับผิดชอบ</th>
                        <th className="px-6 py-4 whitespace-nowrap">ผู้ประเมิน</th>
                        <th className="px-6 py-4 text-center whitespace-nowrap">คะแนน</th>
                        <th className="px-6 py-4 text-center whitespace-nowrap">ระดับ</th>
                        <th className="px-6 py-4 text-center whitespace-nowrap">สถานะ</th>
                        <th className="px-6 py-4 whitespace-nowrap">วันที่</th>
                        <th className="px-6 py-4 text-center rounded-tr-3xl whitespace-nowrap">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                      {filtered.map((ev) => (
                        <tr key={ev.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                                <MapPin className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">
                                  {ev.area_name ?? "—"}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate">
                                  {ev.location_description ?? ""}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5">
                              {ev.reporter_name && (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-black">
                                    {ev.reporter_name.substring(0, 1)}
                                  </div>
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{ev.reporter_name}</span>
                                </div>
                              )}
                              {ev.evaluator_name && (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 flex items-center justify-center text-[10px] font-black">
                                    {ev.evaluator_name.substring(0, 1)}
                                  </div>
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{ev.evaluator_name}</span>
                                </div>
                              )}
                              {!ev.reporter_name && !ev.evaluator_name && <span className="text-xs text-gray-400">—</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="relative w-10 h-10 flex items-center justify-center">
                                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 absolute">
                                  <path className="text-gray-100 dark:text-gray-800" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                  <path 
                                    className={ev.percentage >= 90 ? "text-green-500" : ev.percentage >= 80 ? "text-yellow-500" : ev.percentage >= 70 ? "text-orange-500" : "text-red-500"} 
                                    strokeWidth="4" strokeDasharray={`${ev.percentage ?? 0}, 100`} stroke="currentColor" fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                  />
                                </svg>
                                <span className="text-[10px] font-black text-gray-900 dark:text-white relative z-10">{ev.percentage?.toFixed(0) ?? 0}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {ev.grade ? (
                              <span className={`text-[11px] font-black px-3 py-1 rounded-full border ${GRADE_BG[ev.grade as keyof typeof GRADE_BG]} shadow-sm`}>
                                {ev.grade === "gold" ? "เหรียญทอง" : ev.grade === "silver" ? "เหรียญเงิน" : ev.grade === "bronze" ? "เหรียญทองแดง" : "ไม่ผ่าน"}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-[11px] font-black px-3 py-1 rounded-full flex items-center justify-center gap-1.5 w-fit mx-auto ${STATUS_COLORS[ev.status as keyof typeof STATUS_COLORS]}`}>
                              {ev.status === "approved" && <CheckCircle className="w-3 h-3" />}
                              {ev.status === "rejected" && <XCircle className="w-3 h-3" />}
                              {ev.status === "submitted" && <Clock className="w-3 h-3" />}
                              {STATUS_LABELS[ev.status as keyof typeof STATUS_LABELS]}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {ev.evaluated_at ? formatThaiDateShort(ev.evaluated_at) : "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => setSelectedDetail(ev)}
                              className="w-8 h-8 rounded-full bg-gray-50 hover:bg-green-50 text-gray-400 hover:text-green-600 dark:bg-gray-800 dark:hover:bg-green-900/30 flex items-center justify-center mx-auto transition-all hover:scale-110 active:scale-95 shadow-sm"
                              title="ดูรายละเอียด"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* Bottom Widget: Eco Tip of the Day */}
            <motion.div variants={itemVariants} className="mt-8">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-6 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden flex items-center gap-6">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/20">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-100 uppercase tracking-widest mb-1">Eco Tip of the Day</p>
                  <p className="font-medium text-lg leading-snug">
                    "การแยกขยะตั้งแต่ต้นทาง ช่วยให้โรงเรียนนำกลับมาใช้ประโยชน์ใหม่ได้ถึง 80%" ♻️
                  </p>
                </div>
              </div>
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
