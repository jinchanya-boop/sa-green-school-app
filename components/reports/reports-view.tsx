"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Download, FileSpreadsheet, FileText, Calendar, Filter, Target, Trophy, Droplets, Leaf, Star } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { calculateGrade, GRADE_BG } from "@/lib/utils";

interface ReportsViewProps {
  homerooms: any[];
  classroomEvals: any[];
  areaEvals: any[];
  waterEvals: any[];
  semester: any;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function ReportsView({ homerooms, classroomEvals, areaEvals, waterEvals, semester }: ReportsViewProps) {
  
  // Helper to calculate week relative to semester
  const getWeek = (dateStr: string) => {
    if (!dateStr || !semester?.start_date) return 1;
    const date = new Date(dateStr);
    const start = new Date(semester.start_date);
    const diff = date.getTime() - start.getTime();
    if (diff < 0) return 1; // before semester
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 7)) + 1;
  };

  // Aggregate data for the table
  const tableData = useMemo(() => {
    return homerooms.map(hr => {
      const cEvals = classroomEvals.filter(e => e.homeroom_id === hr.id);
      const aEvals = areaEvals.filter(e => e.homeroom_name === hr.class_name || (e.responsible_area && e.responsible_area.homeroom_id === hr.id));
      const wEvals = waterEvals.filter(e => e.homeroom_id === hr.id);

      const avgClassroom = cEvals.length ? cEvals.reduce((s, e) => s + (e.percentage || 0), 0) / cEvals.length : 0;
      const avgArea = aEvals.length ? aEvals.reduce((s, e) => s + (e.percentage || 0), 0) / aEvals.length : 0;
      const avgWater = wEvals.length ? wEvals.reduce((s, e) => s + (e.percentage || 0), 0) / wEvals.length : 0;
      
      const gradeArea = calculateGrade(avgArea);
      const gradeClassroom = calculateGrade(avgClassroom);
      const gradeWater = calculateGrade(avgWater);

      return {
        class: hr.class_name,
        area: avgArea.toFixed(1),
        classroom: avgClassroom.toFixed(1),
        water: avgWater.toFixed(1),
        totalScore: avgArea + avgClassroom + avgWater, // Used for finding top classroom
        gradeArea,
        gradeClassroom,
        gradeWater,
        gradeAreaClass: GRADE_BG[gradeArea as keyof typeof GRADE_BG] || "bg-gray-100 text-gray-800",
        gradeClassroomClass: GRADE_BG[gradeClassroom as keyof typeof GRADE_BG] || "bg-gray-100 text-gray-800",
        gradeWaterClass: GRADE_BG[gradeWater as keyof typeof GRADE_BG] || "bg-gray-100 text-gray-800",
      };
    }).sort((a, b) => Number(b.area) + Number(b.classroom) + Number(b.water) - (Number(a.area) + Number(a.classroom) + Number(a.water)));
  }, [homerooms, classroomEvals, areaEvals, waterEvals]);

  // Aggregate data for chart (by week)
  const reportData = useMemo(() => {
    const weeks = new Set<number>();
    
    // Assign calculated week to each record
    const cEvalsWithWeek = classroomEvals.map(e => ({ ...e, cal_week: getWeek(e.evaluated_at) }));
    const aEvalsWithWeek = areaEvals.map(e => ({ ...e, cal_week: getWeek(e.evaluated_at) }));
    const wEvalsWithWeek = waterEvals.map(e => ({ ...e, cal_week: getWeek(e.check_date) }));

    cEvalsWithWeek.forEach(e => weeks.add(e.cal_week));
    aEvalsWithWeek.forEach(e => weeks.add(e.cal_week));
    wEvalsWithWeek.forEach(e => weeks.add(e.cal_week));

    return Array.from(weeks).sort((a, b) => a - b).map(w => {
      const cEvals = cEvalsWithWeek.filter(e => e.cal_week === w);
      const aEvals = aEvalsWithWeek.filter(e => e.cal_week === w);
      const wEvals = wEvalsWithWeek.filter(e => e.cal_week === w);

      const avgClassroom = cEvals.length ? cEvals.reduce((s, e) => s + (e.percentage || 0), 0) / cEvals.length : 0;
      const avgArea = aEvals.length ? aEvals.reduce((s, e) => s + (e.percentage || 0), 0) / aEvals.length : 0;
      const avgWater = wEvals.length ? wEvals.reduce((s, e) => s + (e.percentage || 0), 0) / wEvals.length : 0;

      return {
        week: `สัปดาห์ ${w}`,
        area: Number(avgArea.toFixed(1)),
        classroom: Number(avgClassroom.toFixed(1)),
        water: Number(avgWater.toFixed(1))
      };
    });
  }, [classroomEvals, areaEvals, waterEvals]);

  // Calculations for Summary Cards
  const totalArea = tableData.reduce((sum, row) => sum + Number(row.area), 0);
  const totalClassroom = tableData.reduce((sum, row) => sum + Number(row.classroom), 0);
  const totalWater = tableData.reduce((sum, row) => sum + Number(row.water), 0);
  
  const overallAvgArea = tableData.length > 0 ? (totalArea / tableData.length) : 0;
  const overallAvgClassroom = tableData.length > 0 ? (totalClassroom / tableData.length) : 0;
  const overallAvgWater = tableData.length > 0 ? (totalWater / tableData.length) : 0;
  
  const overallAvg = (overallAvgArea + overallAvgClassroom + overallAvgWater) / 3;
  const topClassroom = tableData.length > 0 ? tableData[0].class : "--";

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 print-container"
    >
      {/* Modern Hero Section */}
      <motion.div variants={itemVariants} className="bg-gradient-to-br from-indigo-50 to-blue-100/50 dark:from-indigo-950/20 dark:to-blue-900/10 rounded-3xl p-6 sm:p-8 border border-indigo-100/50 dark:border-indigo-900/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden shadow-sm no-print">
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              📊 รายงานผลสิ่งแวดล้อม
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium mt-1">
              ภาพรวมผลการดำเนินงานของโรงเรียน (โมดูล E)
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <button 
            onClick={handlePrint} 
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-full text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95"
          >
            <FileText className="w-4 h-4" />
            ส่งออก PDF
          </button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        {[
          { label: "คะแนนเฉลี่ยรวม", value: overallAvg.toFixed(1) + "%", icon: Target, color: "from-blue-500 to-indigo-500", shadow: "shadow-blue-500/20" },
          { label: "ห้องเรียนยอดเยี่ยม", value: topClassroom, icon: Trophy, color: "from-amber-400 to-orange-500", shadow: "shadow-orange-500/20" },
          { label: "การใช้แก้วน้ำเฉลี่ย", value: overallAvgWater.toFixed(1) + "%", icon: Droplets, color: "from-cyan-500 to-blue-500", shadow: "shadow-cyan-500/20" },
          { label: "พื้นที่รับผิดชอบเฉลี่ย", value: overallAvgArea.toFixed(1) + "%", icon: Leaf, color: "from-green-500 to-emerald-500", shadow: "shadow-green-500/20" },
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
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center shadow-lg ${s.shadow} shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white truncate">{s.value}</p>
                  <p className="text-xs font-bold text-gray-400 truncate">{s.label}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 rounded-full p-2 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-wrap items-center gap-2 no-print">
        <div className="flex items-center gap-2 pl-4 pr-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-bold text-gray-600 dark:text-gray-300">กรองข้อมูล</span>
        </div>
        <select className="px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
          <option>ภาคเรียนที่ 1/2569</option>
          <option>ภาคเรียนที่ 2/2569</option>
        </select>
        <div className="flex flex-wrap items-center gap-2 ml-auto pr-2">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-full px-4 py-2 border border-gray-200 dark:border-gray-700">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input type="date" className="bg-transparent text-gray-900 dark:text-white text-sm font-medium focus:outline-none w-32" />
            <span className="text-gray-400 text-sm mx-1">ถึง</span>
            <input type="date" className="bg-transparent text-gray-900 dark:text-white text-sm font-medium focus:outline-none w-32" />
          </div>
        </div>
      </motion.div>

      {/* Weekly Report Chart */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              ผลการประเมินรายสัปดาห์
            </h2>
            <p className="text-sm text-gray-400 font-medium mt-0.5 ml-7">ภาพรวมตามภาคเรียน</p>
          </div>
          <button className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 dark:bg-gray-800 dark:hover:bg-indigo-900/30 px-4 py-2 rounded-full transition-all border border-gray-100 dark:border-gray-700 no-print hover:scale-105 active:scale-95 shadow-sm">
            <Download className="w-4 h-4" />
            ดาวน์โหลดกราฟ
          </button>
        </div>
        <div className="relative z-10">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={reportData} barSize={20} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} dy={10} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }}
                contentStyle={{ borderRadius: "16px", border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '12px 16px' }}
                itemStyle={{ fontSize: 13, fontWeight: 'bold', padding: '4px 0' }}
                labelStyle={{ fontSize: 12, color: '#6b7280', marginBottom: '8px' }}
                formatter={(v: any) => [`${Number(v)}%`]}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px', fontSize: 13, fontWeight: 'bold' }} 
                iconType="circle" 
                iconSize={8} 
              />
              <Bar dataKey="area" name="พื้นที่รับผิดชอบ" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="classroom" name="ความสะอาดห้องเรียน" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="water" name="แก้วน้ำส่วนตัว" fill="#06b6d4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Summary Table */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
          <h2 className="font-bold text-gray-900 dark:text-white">สรุปผลรายห้องเรียน</h2>
          <button className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 px-4 py-2 rounded-full transition-all no-print shadow-sm">
            <Download className="w-4 h-4" />
            ดาวน์โหลด Excel
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-bold sticky top-0 z-10 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 shadow-sm">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">ห้องเรียน</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">พื้นที่รับผิดชอบ</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">ความสะอาดห้อง</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">แก้วน้ำส่วนตัว</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">ระดับ (พื้นที่)</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">ระดับ (ห้องเรียน)</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">ระดับ (แก้วน้ำ)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {tableData.map((r) => (
                <tr key={r.class} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{r.class}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-gray-900 dark:text-white">{r.area}%</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-gray-900 dark:text-white">{r.classroom}%</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-gray-900 dark:text-white">{r.water}%</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-[11px] font-black px-3 py-1 rounded-full border ${r.gradeAreaClass.includes('gold') || r.gradeArea === 'gold' ? GRADE_BG['gold'] : r.gradeArea === 'silver' ? GRADE_BG['silver'] : r.gradeArea === 'bronze' ? GRADE_BG['bronze'] : GRADE_BG['fail']} shadow-sm`}>
                      {r.gradeArea === "gold" ? "เหรียญทอง" : r.gradeArea === "silver" ? "เหรียญเงิน" : r.gradeArea === "bronze" ? "เหรียญทองแดง" : "ไม่ผ่าน"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-[11px] font-black px-3 py-1 rounded-full border ${r.gradeClassroomClass.includes('gold') || r.gradeClassroom === 'gold' ? GRADE_BG['gold'] : r.gradeClassroom === 'silver' ? GRADE_BG['silver'] : r.gradeClassroom === 'bronze' ? GRADE_BG['bronze'] : GRADE_BG['fail']} shadow-sm`}>
                      {r.gradeClassroom === "gold" ? "เหรียญทอง" : r.gradeClassroom === "silver" ? "เหรียญเงิน" : r.gradeClassroom === "bronze" ? "เหรียญทองแดง" : "ไม่ผ่าน"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-[11px] font-black px-3 py-1 rounded-full border ${r.gradeWaterClass.includes('gold') || r.gradeWater === 'gold' ? GRADE_BG['gold'] : r.gradeWater === 'silver' ? GRADE_BG['silver'] : r.gradeWater === 'bronze' ? GRADE_BG['bronze'] : GRADE_BG['fail']} shadow-sm`}>
                      {r.gradeWater === "gold" ? "เหรียญทอง" : r.gradeWater === "silver" ? "เหรียญเงิน" : r.gradeWater === "bronze" ? "เหรียญทองแดง" : "ไม่ผ่าน"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Bottom Widget: Weekly Highlight */}
      <motion.div variants={itemVariants} className="mt-8 no-print">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden flex items-center gap-6">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/20">
            <Star className="w-6 h-6 text-yellow-300" />
          </div>
          <div>
            <p className="text-sm font-bold text-indigo-100 uppercase tracking-widest mb-1">Weekly Highlight</p>
            <p className="font-medium text-lg leading-snug">
              ขอแสดงความยินดีกับ "{topClassroom}" ที่ได้คะแนนรวมสูงสุดในสัปดาห์นี้ เป็นแบบอย่างที่ดีเยี่ยม! 🏆
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
