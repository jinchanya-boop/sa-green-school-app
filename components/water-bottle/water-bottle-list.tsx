"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Plus, TrendingUp, Users, CheckCircle, Trophy } from "lucide-react";
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

export function WaterBottleList({ records: initialRecords, homerooms, semesters, students, assignedHomeroomId }: WaterBottleListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [recs, setRecs] = useState(initialRecords);

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

  const avgPercent = recs.length
    ? recs.reduce((s, r) => s + (r.percentage ?? 0), 0) / recs.length
    : 0;
  const avgGrade = calculateGrade(avgPercent);

  // Chart data — last 7 records
  const chartData = recs
    .slice(0, 7)
    .reverse()
    .map((r) => ({
      date: r.check_date ? formatThaiDateShort(r.check_date) : "—",
      rate: r.percentage ?? 0,
    }));

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
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-cyan-50 dark:bg-cyan-950 rounded-xl flex items-center justify-center">
                    <Droplets className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    ติดตามแก้วน้ำส่วนตัว
                  </h1>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-10">
                  โมดูล C — ตรวจสอบโดยครูประจำชั้น รับทราบโดยหัวหน้าระดับ
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/water-bottle/dashboard"
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-500 rounded-xl text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors border border-amber-200/50 dark:border-amber-800/30"
                >
                  <Trophy className="w-4 h-4" />
                  ดูแดชบอร์ดและการจัดอันดับ
                </Link>
                <button 
                  onClick={() => setIsFormOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 gradient-green text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all shadow-md shadow-green-200/50"
                >
                  <Plus className="w-4 h-4" />
                  บันทึกการตรวจสอบ
                </button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="stat-card flex items-center gap-4">
                <div className="p-3 bg-cyan-50 dark:bg-cyan-950 rounded-xl">
                  <Users className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{recs.length}</p>
                  <p className="text-sm text-gray-400">บันทึกทั้งหมด</p>
                </div>
              </div>
              <div className="stat-card flex items-center gap-4">
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {avgPercent.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-400">อัตราเฉลี่ยการใช้แก้วน้ำ</p>
                </div>
              </div>
              <div className="stat-card flex items-center gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <span className={`text-sm font-bold px-2.5 py-1 rounded-lg border ${GRADE_BG[avgGrade as keyof typeof GRADE_BG]}`}>
                    {avgGrade === "gold" ? "ทอง" : avgGrade === "silver" ? "เงิน" : avgGrade === "bronze" ? "ทองแดง" : "ไม่ผ่าน"}
                  </span>
                  <p className="text-sm text-gray-400 mt-1">ระดับรวมเฉลี่ย</p>
                </div>
              </div>
            </div>

            {/* Trend Chart */}
            {chartData.length > 0 && (
              <div className="stat-card">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
                  แนวโน้มอัตราการใช้แก้วน้ำ (7 วันล่าสุด)
                </h2>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: "Sarabun" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", fontFamily: "Sarabun", fontSize: 13 }}
                      formatter={(v) => [`${Number(v).toFixed(1)}%`, "อัตราการใช้แก้วน้ำ"]}
                    />
                    <Bar dataKey="rate" fill="#0891b2" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Records Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
              {recs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Droplets className="w-12 h-12 mb-3 opacity-20" />
                  <p className="font-medium">ยังไม่มีบันทึกการตรวจแก้วน้ำ</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="text-left">ห้องเรียน</th>
                        <th className="text-left">ครูประจำชั้น</th>
                        <th className="text-center">นักเรียนทั้งหมด</th>
                        <th className="text-center">แก้วน้ำครบ</th>
                        <th className="text-center">อัตรา %</th>
                        <th className="text-center">ระดับ</th>
                        <th className="text-center">สถานะ</th>
                        <th className="text-left">วันที่ตรวจ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recs.map((r) => (
                        <tr 
                          key={r.id}
                          onClick={() => setSelectedRecord(r)}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                        >
                          <td className="font-medium text-gray-900 dark:text-white text-sm">
                            {r.class_name ?? "—"}
                          </td>
                          <td className="text-sm text-gray-600 dark:text-gray-300">{r.teacher_name ?? "—"}</td>
                          <td className="text-center text-sm text-gray-700 dark:text-gray-300">{r.total_students}</td>
                          <td className="text-center text-sm text-cyan-600 dark:text-cyan-400 font-semibold">{r.students_with_bottle}</td>
                          <td className="text-center font-bold text-sm text-gray-900 dark:text-white">
                            {r.percentage?.toFixed(1)}%
                          </td>
                          <td className="text-center">
                            {r.grade ? (
                              <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${GRADE_BG[r.grade as keyof typeof GRADE_BG]}`}>
                                {r.grade === "gold" ? "ทอง" : r.grade === "silver" ? "เงิน" : r.grade === "bronze" ? "ทองแดง" : "ไม่ผ่าน"}
                              </span>
                            ) : <span className="text-gray-400 text-xs">—</span>}
                          </td>
                          <td className="text-center">
                            <span className={`text-xs font-medium px-2 py-1 rounded-lg ${STATUS_COLORS[r.status as keyof typeof STATUS_COLORS]}`}>
                              {STATUS_LABELS[r.status as keyof typeof STATUS_LABELS] ?? r.status}
                            </span>
                          </td>
                          <td className="text-sm text-gray-400">
                            {r.check_date ? formatThaiDateShort(r.check_date) : "—"}
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
