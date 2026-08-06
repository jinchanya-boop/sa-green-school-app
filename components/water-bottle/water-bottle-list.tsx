"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Plus, TrendingUp, Users, CheckCircle, Trophy, Leaf, Calendar, Check, Search, Eye, Clock, XCircle } from "lucide-react";
import { formatThaiDateShort, GRADE_BG, calculateGrade, STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useState, useEffect } from "react";
import { WaterBottleForm } from "./water-bottle-form";
import { WaterBottleDetailModal } from "./water-bottle-detail-modal";
import { createClient } from "@/lib/supabase/client";
import type { Homeroom, SemesterRecord, Student } from "@/types";

interface WaterBottleListProps {
  records: any[]; // Using any because it comes from a view
  homerooms: any[];
  semesters: any[];
  students: any[];
  assignedHomeroomId?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function WaterBottleList({ records: initialRecords, homerooms, semesters, students, assignedHomeroomId }: WaterBottleListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [recs, setRecs] = useState(initialRecords);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSuccess = () => {
    setIsFormOpen(false);
    // Refresh mechanism could be implemented here
  };

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (profile) setUserRole(profile.role);
      }
    };
    fetchUser();
  }, []);

  // Search Logic
  const filtered = recs.filter((r) => {
    const matchesSearch = (r.class_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (r.teacher_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const avgPercent = recs.length
    ? recs.reduce((s, r) => s + (r.percentage ?? 0), 0) / recs.length
    : 0;
  const avgGrade = calculateGrade(avgPercent);
  const greenLevel = avgPercent >= 90 ? "Excellent" : avgPercent >= 80 ? "Good" : avgPercent >= 70 ? "Fair" : "Needs Improvement";

  const canRecord = ["administrator", "director", "deputy_director", "grade_supervisor", "homeroom_teacher"].includes(userRole);

  const myRoomRecords = assignedHomeroomId ? recs.filter(r => r.homeroom_id === assignedHomeroomId) : [];
  const myLatestRecord = myRoomRecords.length > 0 ? myRoomRecords[0] : null;

  // Chart data — average per day for the last 7 days
  const groupedByDate = recs.reduce((acc, r) => {
    if (!r.check_date) return acc;
    if (!acc[r.check_date]) {
      acc[r.check_date] = { total: 0, count: 0 };
    }
    acc[r.check_date].total += (r.percentage ?? 0);
    acc[r.check_date].count += 1;
    return acc;
  }, {} as Record<string, {total: number, count: number}>);

  const chartData = Object.entries(groupedByDate)
    .map(([date, data]: [string, any]) => ({
      date: formatThaiDateShort(date),
      rate: data.total / data.count,
      rawDate: date,
    }))
    .sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime())
    .slice(-7);

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {isFormOpen ? (
          <WaterBottleForm 
            key="form"
            homerooms={homerooms}
            semesters={semesters}
            students={students}
            onCancel={() => setIsFormOpen(false)}
            onSuccess={handleSuccess}
            assignedHomeroomId={assignedHomeroomId}
          />
        ) : (
          <motion.div
            key="list"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={`space-y-6 ${selectedRecord ? 'print:hidden' : ''}`}
          >
            {/* Modern Hero Section */}
            <motion.div variants={itemVariants} className="bg-gradient-to-br from-cyan-50 to-blue-100/50 dark:from-cyan-950/20 dark:to-blue-900/10 rounded-3xl p-6 sm:p-8 border border-cyan-100/50 dark:border-cyan-900/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-64 h-64 bg-cyan-500/10 dark:bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/50 rounded-2xl flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-sm">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                    ติดตามแก้วน้ำส่วนตัว
                  </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium pl-13">
                  โมดูล C — ตรวจสอบโดยครูประจำชั้น รับทราบโดยหัวหน้าระดับ
                </p>
              </div>

              <div className="relative z-10 flex items-center gap-6 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/50 dark:border-gray-800 shadow-sm">
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Today's Progress</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-cyan-600 dark:text-cyan-400">{avgPercent.toFixed(1)}%</span>
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
                      className="text-cyan-500"
                      strokeWidth="3"
                      strokeDasharray={`${avgPercent}, 100`}
                      stroke="currentColor"
                      fill="none"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: "0, 100" }}
                      animate={{ strokeDasharray: `${avgPercent}, 100` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* Actions & Filters */}
            <motion.div variants={itemVariants} className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
              <div className="flex items-center gap-3 w-full xl:w-auto">
                <Link
                  href="/water-bottle/dashboard"
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-500 rounded-full text-sm font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all border border-amber-200/50 dark:border-amber-800/30 hover:scale-105 active:scale-95 shadow-sm"
                >
                  <Trophy className="w-4 h-4" />
                  แดชบอร์ด
                </Link>
              </div>

              <div className="flex items-center gap-3 w-full xl:w-auto">
                <div className="relative flex-1 xl:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาห้องเรียน หรือครูประจำชั้น..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all shadow-sm"
                  />
                </div>
                {canRecord && (
                  <button 
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-full text-sm font-bold transition-all shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    บันทึกใหม่
                  </button>
                )}
              </div>
            </motion.div>

            {/* My Room Highlight */}
            {assignedHomeroomId && (
              <motion.div variants={itemVariants} className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-cyan-500/20 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                      <Trophy className="w-7 h-7 text-cyan-100" />
                    </div>
                    <div>
                      <span className="text-cyan-100 font-bold text-sm uppercase tracking-wider block mb-1">สถานะห้องของคุณล่าสุด</span>
                      {myLatestRecord ? (
                        <>
                          <h3 className="text-2xl font-black">{myLatestRecord.class_name}</h3>
                          <p className="text-cyan-100 text-sm mt-1">{myLatestRecord.teacher_name}</p>
                        </>
                      ) : (
                        <h3 className="text-xl font-bold">ยังไม่มีข้อมูลของห้องคุณ</h3>
                      )}
                    </div>
                  </div>
                  {myLatestRecord && (
                    <div className="flex items-center gap-6 bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/10">
                      <div className="text-center border-r border-white/20 pr-6">
                        <span className="block text-cyan-100 text-xs font-bold uppercase mb-1">แก้วน้ำ / นร.</span>
                        <span className="text-2xl font-black">{myLatestRecord.students_with_bottle}/{myLatestRecord.total_students}</span>
                      </div>
                      <div className="text-center border-r border-white/20 pr-6">
                        <span className="block text-cyan-100 text-xs font-bold uppercase mb-1">อัตราการใช้</span>
                        <span className="text-3xl font-black">{myLatestRecord.percentage?.toFixed(1)}%</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-cyan-100 text-xs font-bold uppercase mb-1">ผลประเมิน</span>
                        <span className="text-xl font-bold bg-white/20 px-3 py-1 rounded-lg inline-block">
                          {myLatestRecord.grade === "gold" ? "เหรียญทอง" : myLatestRecord.grade === "silver" ? "เหรียญเงิน" : myLatestRecord.grade === "bronze" ? "เหรียญทองแดง" : "ไม่ผ่าน"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Summary Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "บันทึกทั้งหมด", value: recs.length, icon: Users, color: "from-blue-500 to-cyan-500", shadow: "shadow-blue-500/20" },
                { label: "อัตราเฉลี่ยการใช้แก้วน้ำ", value: avgPercent.toFixed(1) + "%", icon: TrendingUp, color: "from-green-500 to-emerald-500", shadow: "shadow-green-500/20" },
                { label: "ระดับรวมเฉลี่ย", value: avgGrade === "gold" ? "เหรียญทอง" : avgGrade === "silver" ? "เหรียญเงิน" : avgGrade === "bronze" ? "เหรียญทองแดง" : "ไม่ผ่าน", icon: Trophy, color: "from-amber-400 to-orange-500", shadow: "shadow-amber-500/20" },
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

            {/* Trend Chart */}
            {chartData.length > 0 && (
              <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h2 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-500" />
                  แนวโน้มอัตราการใช้แก้วน้ำ (7 วันล่าสุด)
                </h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(8, 145, 178, 0.05)' }}
                      contentStyle={{ borderRadius: "16px", border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      formatter={(v) => [`${Number(v).toFixed(1)}%`, "อัตราการใช้แก้วน้ำ"]}
                    />
                    <Bar dataKey="rate" fill="url(#colorCyan)" radius={[8, 8, 0, 0]} barSize={40} />
                    <defs>
                      <linearGradient id="colorCyan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#0891b2" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Records Table */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-50/50 dark:bg-gray-900/50">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <Droplets className="w-8 h-8 opacity-50" />
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white mb-1">ไม่พบข้อมูลบันทึก</p>
                  <p className="text-sm">เริ่มต้นด้วยการกดปุ่ม "บันทึกใหม่"</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-50/50 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 font-bold sticky top-0 z-10 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
                      <tr>
                        <th className="px-6 py-4 rounded-tl-3xl whitespace-nowrap">ห้องเรียน</th>
                        <th className="px-6 py-4 whitespace-nowrap">ครูประจำชั้น</th>
                        <th className="px-6 py-4 text-center whitespace-nowrap">แก้วน้ำ / นร.</th>
                        <th className="px-6 py-4 text-center whitespace-nowrap">อัตรา %</th>
                        <th className="px-6 py-4 text-center whitespace-nowrap">ระดับ</th>
                        <th className="px-6 py-4 text-center whitespace-nowrap">สถานะ</th>
                        <th className="px-6 py-4 whitespace-nowrap">วันที่</th>
                        <th className="px-6 py-4 text-center rounded-tr-3xl whitespace-nowrap">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                      {filtered.map((r) => (
                        <tr 
                          key={r.id}
                          className="hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-cyan-500 transition-colors">
                                <Users className="w-5 h-5" />
                              </div>
                              <p className="font-bold text-gray-900 dark:text-white text-sm">
                                {r.class_name ?? "—"}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {r.teacher_name ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-[10px] font-black">
                                  {r.teacher_name.substring(0, 1)}
                                </div>
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{r.teacher_name}</span>
                              </div>
                            ) : <span className="text-xs text-gray-400">—</span>}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">{r.students_with_bottle}</span>
                            <span className="text-xs text-gray-400 ml-1">/ {r.total_students}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="relative w-10 h-10 flex items-center justify-center">
                                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 absolute">
                                  <path className="text-gray-100 dark:text-gray-800" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                  <path 
                                    className={r.percentage >= 90 ? "text-green-500" : r.percentage >= 80 ? "text-yellow-500" : r.percentage >= 70 ? "text-orange-500" : "text-red-500"} 
                                    strokeWidth="4" strokeDasharray={`${r.percentage ?? 0}, 100`} stroke="currentColor" fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                  />
                                </svg>
                                <span className="text-[10px] font-black text-gray-900 dark:text-white relative z-10">{r.percentage?.toFixed(0) ?? 0}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {r.grade ? (
                              <span className={`text-[11px] font-black px-3 py-1 rounded-full border ${GRADE_BG[r.grade as keyof typeof GRADE_BG]} shadow-sm`}>
                                {r.grade === "gold" ? "เหรียญทอง" : r.grade === "silver" ? "เหรียญเงิน" : r.grade === "bronze" ? "เหรียญทองแดง" : "ไม่ผ่าน"}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-[11px] font-black px-3 py-1 rounded-full flex items-center justify-center gap-1.5 w-fit mx-auto ${STATUS_COLORS[r.status as keyof typeof STATUS_COLORS]}`}>
                              {r.status === "approved" && <CheckCircle className="w-3 h-3" />}
                              {r.status === "rejected" && <XCircle className="w-3 h-3" />}
                              {r.status === "submitted" && <Clock className="w-3 h-3" />}
                              {STATUS_LABELS[r.status as keyof typeof STATUS_LABELS] ?? r.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {r.check_date ? formatThaiDateShort(r.check_date) : "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => setSelectedRecord(r)}
                              className="w-8 h-8 rounded-full bg-gray-50 hover:bg-cyan-50 text-gray-400 hover:text-cyan-600 dark:bg-gray-800 dark:hover:bg-cyan-900/30 flex items-center justify-center mx-auto transition-all hover:scale-110 active:scale-95 shadow-sm"
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

            {/* Bottom Widget: Environmental Quote */}
            <motion.div variants={itemVariants} className="mt-8">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl p-6 text-white shadow-lg shadow-cyan-500/20 relative overflow-hidden flex items-center gap-6">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/20">
                  <Leaf className="w-6 h-6 text-green-300" />
                </div>
                <div>
                  <p className="text-sm font-bold text-cyan-100 uppercase tracking-widest mb-1">Environmental Quote</p>
                  <p className="font-medium text-lg leading-snug">
                    "การพกแก้วน้ำส่วนตัวมาเอง สามารถลดปริมาณขยะพลาสติกได้ถึงปีละกว่า 365 ชิ้นต่อคน!" 🌍
                  </p>
                </div>
              </div>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      {selectedRecord && (
        <WaterBottleDetailModal
          record={selectedRecord}
          userRole={userRole}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}
