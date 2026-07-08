"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Download, FileSpreadsheet, FileText, Calendar, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { calculateGrade, GRADE_BG } from "@/lib/utils";

interface ReportsViewProps {
  homerooms: any[];
  classroomEvals: any[];
  areaEvals: any[];
  waterEvals: any[];
  semester: any;
}

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 print-container"
    >
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 no-print">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">รายงาน</h1>
            <p className="text-gray-400 text-sm">โมดูล E — รายงานสรุปผลการประเมินสิ่งแวดล้อม</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <FileText className="w-4 h-4 text-red-500" />
            ส่งออก PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="stat-card flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">กรองข้อมูล</span>
        </div>
        <select className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
          <option>ภาคเรียนที่ 1/2569</option>
          <option>ภาคเรียนที่ 2/2569</option>
        </select>
        <div className="flex items-center gap-2 ml-auto">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input type="date" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
          <span className="text-gray-400 text-sm">ถึง</span>
          <input type="date" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
        </div>
      </div>

      {/* Weekly Report Chart */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">ผลการประเมินรายสัปดาห์</h2>
            <p className="text-xs text-gray-400 mt-0.5">ภาพรวมตามภาคเรียน</p>
          </div>
          <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <Download className="w-3.5 h-3.5" />
            ดาวน์โหลดกราฟ
          </button>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={reportData} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="week" tick={{ fontSize: 12, fontFamily: "Sarabun" }} />
            <YAxis domain={[60, 100]} tick={{ fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: "12px", fontFamily: "Sarabun", fontSize: 13, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", backgroundColor: "rgba(255, 255, 255, 0.95)", color: "#111827" }}
              itemStyle={{ color: "#374151" }}
              labelStyle={{ color: "#111827", fontWeight: "bold" }}
              formatter={(v: any) => [`${Number(v)}%`]}
            />
            <Legend wrapperStyle={{ fontFamily: "Sarabun", fontSize: 12 }} />
            <Bar dataKey="area" name="พื้นที่รับผิดชอบ" fill="#16a34a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="classroom" name="ความสะอาดห้องเรียน" fill="#2563eb" radius={[4, 4, 0, 0]} />
            <Bar dataKey="water" name="แก้วน้ำส่วนตัว" fill="#0891b2" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">สรุปผลรายห้องเรียน</h2>
          <button className="flex items-center gap-1.5 text-sm text-green-600 font-medium hover:bg-green-50 dark:hover:bg-green-950 px-3 py-1.5 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            ดาวน์โหลดทั้งหมด
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="text-left">ห้องเรียน</th>
                <th className="text-center">พื้นที่รับผิดชอบ</th>
                <th className="text-center">ความสะอาด</th>
                <th className="text-center">แก้วน้ำ</th>
                <th className="text-center">ระดับ (พื้นที่)</th>
                <th className="text-center">ระดับ (ห้องเรียน)</th>
                <th className="text-center">ระดับ (แก้วน้ำ)</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((r) => (
                <tr key={r.class}>
                  <td className="font-semibold text-gray-900 dark:text-white text-sm">{r.class}</td>
                  <td className="text-center text-sm">{r.area}%</td>
                  <td className="text-center text-sm">{r.classroom}%</td>
                  <td className="text-center text-sm">{r.water}%</td>
                  <td className="text-center">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${r.gradeAreaClass}`}>
                      {r.gradeArea}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${r.gradeClassroomClass}`}>
                      {r.gradeClassroom}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${r.gradeWaterClass}`}>
                      {r.gradeWater}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
