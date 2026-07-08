"use client";

import { motion } from "framer-motion";
import { Trophy, Droplets, Medal, Award, Crown, Calendar, TrendingUp } from "lucide-react";
import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { calculateGrade, GRADE_BG, formatThaiDateShort } from "@/lib/utils";

interface WaterBottleDashboardProps {
  records: any[];
}

export function WaterBottleDashboard({ records }: WaterBottleDashboardProps) {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly">("daily");

  const leaderboard = useMemo(() => {
    // 1. Filter by time period
    const now = new Date();
    // Use local date string for comparison to avoid timezone issues with simple logic
    const todayStr = now.toLocaleDateString("en-CA"); // YYYY-MM-DD
    
    // Simplistic weekly/monthly filtering
    const getWeek = (date: Date) => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
      return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    };
    const currentWeek = getWeek(now);
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const filtered = records.filter(r => {
      if (!r.check_date) return false;
      const rDate = new Date(r.check_date);
      
      if (activeTab === "daily") {
        return r.check_date === todayStr;
      } else if (activeTab === "weekly") {
        return getWeek(rDate) === currentWeek && rDate.getFullYear() === currentYear;
      } else if (activeTab === "monthly") {
        return rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear;
      }
      return false;
    });

    // 2. Group by classroom and calculate average
    const grouped = filtered.reduce((acc, r) => {
      if (!acc[r.homeroom_id]) {
        acc[r.homeroom_id] = {
          homeroom_id: r.homeroom_id,
          class_name: r.class_name,
          teacher_name: r.teacher_name,
          total_percentages: 0,
          count: 0,
        };
      }
      acc[r.homeroom_id].total_percentages += Number(r.percentage || 0);
      acc[r.homeroom_id].count += 1;
      return acc;
    }, {} as Record<string, any>);

    // 3. Format and sort
    const result = Object.values(grouped).map((g: any) => {
      const avg = g.total_percentages / g.count;
      return {
        ...g,
        avg_percentage: avg,
        grade: calculateGrade(avg)
      };
    }).sort((a, b) => b.avg_percentage - a.avg_percentage);

    // Assign ranks, handling ties simply by index for now
    return result.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }, [records, activeTab]);

  const top3 = leaderboard.slice(0, 3);
  const others = leaderboard.slice(3);

  // Chart Data for top 10
  const chartData = leaderboard.slice(0, 10).map(item => ({
    name: item.class_name,
    rate: Number(item.avg_percentage.toFixed(1))
  }));

  const COLORS = ['#f59e0b', '#94a3b8', '#b45309', '#0891b2']; // Gold, Silver, Bronze, Cyan

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-50 dark:bg-amber-950/50 rounded-xl flex items-center justify-center">
                <Trophy className="w-4 h-4 text-amber-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                ประกวดการใช้แก้วน้ำส่วนตัว
              </h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-10">
              จัดอันดับห้องเรียนที่นำแก้วน้ำส่วนตัวมามากที่สุด (คิดเป็นร้อยละจากนักเรียนที่มาเรียน)
            </p>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {(["daily", "weekly", "monthly"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {tab === "daily" ? "รายวัน" : tab === "weekly" ? "รายสัปดาห์" : "รายเดือน"}
              </button>
            ))}
          </div>
        </div>

        {leaderboard.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center text-gray-400 flex flex-col items-center">
            <Calendar className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">ยังไม่มีข้อมูลสำหรับการจัดอันดับ</p>
            <p>กรุณาตรวจสอบว่ามีข้อมูลการตรวจแก้วน้ำในช่วงเวลาที่เลือกหรือไม่</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-8 pt-8">
              {/* Rank 2 - Silver */}
              {top3[1] && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="order-2 md:order-1 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center text-center shadow-lg relative"
                >
                  <div className="absolute -top-6 bg-gray-200 dark:bg-gray-700 p-3 rounded-full border-4 border-white dark:border-gray-900 shadow-md">
                    <Medal className="w-8 h-8 text-gray-500 dark:text-gray-300" />
                  </div>
                  <div className="mt-6 mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">อันดับ 2</span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{top3[1].class_name}</h3>
                    <p className="text-xs text-gray-500">{top3[1].teacher_name}</p>
                  </div>
                  <div className="mt-auto">
                    <span className="text-3xl font-black text-gray-700 dark:text-gray-300">{top3[1].avg_percentage.toFixed(1)}%</span>
                  </div>
                </motion.div>
              )}

              {/* Rank 1 - Gold */}
              {top3[0] && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="order-1 md:order-2 bg-gradient-to-b from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-900 rounded-2xl border-2 border-amber-300 dark:border-amber-700/50 p-8 flex flex-col items-center text-center shadow-xl shadow-amber-100 dark:shadow-amber-900/20 relative z-10 scale-105"
                >
                  <div className="absolute -top-8 bg-amber-100 dark:bg-amber-900 p-4 rounded-full border-4 border-white dark:border-gray-900 shadow-lg">
                    <Crown className="w-10 h-10 text-amber-500" />
                  </div>
                  <div className="mt-8 mb-2">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">อันดับ 1</span>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{top3[0].class_name}</h3>
                    <p className="text-sm text-gray-500">{top3[0].teacher_name}</p>
                  </div>
                  <div className="mt-auto">
                    <span className="text-4xl font-black text-amber-600 dark:text-amber-500">{top3[0].avg_percentage.toFixed(1)}%</span>
                  </div>
                </motion.div>
              )}

              {/* Rank 3 - Bronze */}
              {top3[2] && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="order-3 md:order-3 bg-gradient-to-b from-orange-50 to-white dark:from-orange-950/30 dark:to-gray-900 rounded-2xl border border-orange-200 dark:border-orange-900/50 p-6 flex flex-col items-center text-center shadow-lg relative"
                >
                  <div className="absolute -top-6 bg-orange-100 dark:bg-orange-900/50 p-3 rounded-full border-4 border-white dark:border-gray-900 shadow-md">
                    <Award className="w-8 h-8 text-orange-600 dark:text-orange-500" />
                  </div>
                  <div className="mt-6 mb-2">
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-500 uppercase tracking-wider">อันดับ 3</span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{top3[2].class_name}</h3>
                    <p className="text-xs text-gray-500">{top3[2].teacher_name}</p>
                  </div>
                  <div className="mt-auto">
                    <span className="text-3xl font-black text-orange-700 dark:text-orange-500">{top3[2].avg_percentage.toFixed(1)}%</span>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart */}
              <div className="lg:col-span-2 stat-card bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-500" />
                  สถิติ 10 อันดับแรก
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: "Sarabun" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", fontFamily: "Sarabun", fontSize: 13, border: "none", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                      cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                      formatter={(v) => [`${Number(v).toFixed(1)}%`, "อัตราการนำแก้วน้ำมา"]}
                    />
                    <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? COLORS[0] : index === 1 ? COLORS[1] : index === 2 ? COLORS[2] : COLORS[3]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Others List */}
              <div className="stat-card bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 overflow-hidden flex flex-col">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">อันดับอื่นๆ</h2>
                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                  {others.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">ไม่มีข้อมูลห้องอื่นๆ</div>
                  ) : (
                    others.map((item) => (
                      <div key={item.homeroom_id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-center font-bold text-gray-400">{item.rank}</span>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{item.class_name}</p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${GRADE_BG[item.grade as keyof typeof GRADE_BG]}`}>
                              {item.grade === "gold" ? "ทอง" : item.grade === "silver" ? "เงิน" : item.grade === "bronze" ? "ทองแดง" : "ไม่ผ่าน"}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-gray-700 dark:text-gray-300">
                          {item.avg_percentage.toFixed(1)}%
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
