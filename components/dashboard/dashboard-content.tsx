"use client";

import { useState, useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";
import {
  MapPin,
  School,
  Droplets,
  Trophy,
  TrendingUp,
  CheckCircle2,
  Clock,
  Star,
  Filter,
} from "lucide-react";
import { GRADE_COLORS, formatPercent } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

interface DashboardContentProps {
  totalEvals: number;
  areaStats: any[];
  classroomStats: any[];
  waterStats: any[];
  rankings: any[];
  pendingApprovals: any[];
  homerooms: any[];
  todaySubmissions?: {
    area: any[];
    classroom: any[];
    water: any[];
  };
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function countGrades(stats: Array<{ grade: string | null }>) {
  const counts: Record<string, number> = { gold: 0, silver: 0, bronze: 0, pass: 0, fail: 0 };
  stats.forEach((s) => { if (s.grade) counts[s.grade] = (counts[s.grade] ?? 0) + 1; });
  return counts;
}

function avgPercent(stats: Array<{ percentage: number }>) {
  if (!stats.length) return 0;
  return stats.reduce((sum, s) => sum + (s.percentage || 0), 0) / stats.length;
}

const GRADE_LABEL_MAP: Record<string, string> = {
  gold: "ทอง", silver: "เงิน", bronze: "ทองแดง", pass: "ผ่าน", fail: "ไม่ผ่าน",
};

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16"];

export function DashboardContent({
  totalEvals,
  areaStats,
  classroomStats,
  waterStats,
  rankings,
  pendingApprovals,
  homerooms,
  todaySubmissions = { area: [], classroom: [], water: [] },
}: DashboardContentProps) {
  const areaGrades = countGrades(areaStats);
  const classroomGrades = countGrades(classroomStats);
  const waterGrades = countGrades(waterStats);

  const pieData = Object.entries(areaGrades)
    .filter(([, v]) => v > 0)
    .map(([grade, count]) => ({
      name: GRADE_LABEL_MAP[grade] ?? grade,
      value: count,
      color: GRADE_COLORS[grade as keyof typeof GRADE_COLORS] ?? "#6b7280",
    }));

  const barData = [
    {
      name: "พื้นที่",
      ทอง: areaGrades.gold,
      เงิน: areaGrades.silver,
      ทองแดง: areaGrades.bronze,
      ผ่าน: areaGrades.pass,
      ไม่ผ่าน: areaGrades.fail,
    },
    {
      name: "ห้องเรียน",
      ทอง: classroomGrades.gold,
      เงิน: classroomGrades.silver,
      ทองแดง: classroomGrades.bronze,
      ผ่าน: classroomGrades.pass,
      ไม่ผ่าน: classroomGrades.fail,
    },
    {
      name: "แก้วน้ำ",
      ทอง: waterGrades.gold,
      เงิน: waterGrades.silver,
      ทองแดง: waterGrades.bronze,
      ผ่าน: waterGrades.pass,
      ไม่ผ่าน: waterGrades.fail,
    },
  ];

  const avgArea = avgPercent(areaStats);
  const avgClass = avgPercent(classroomStats);
  const avgWater = avgPercent(waterStats);

  const stats = [
    {
      label: "การประเมินทั้งหมด",
      value: totalEvals.toLocaleString("th-TH"),
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950",
      trend: "+12%",
    },
    {
      label: "คะแนนเฉลี่ยพื้นที่",
      value: formatPercent(avgArea),
      icon: MapPin,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
      trend: "+5%",
    },
    {
      label: "คะแนนเฉลี่ยห้องเรียน",
      value: formatPercent(avgClass),
      icon: School,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950",
      trend: "+3%",
    },
    {
      label: "อัตราการใช้แก้วน้ำ",
      value: formatPercent(avgWater),
      icon: Droplets,
      color: "text-cyan-600",
      bg: "bg-cyan-50 dark:bg-cyan-950",
      trend: "+8%",
    },
  ];

  const radarData = [
    { subject: "พื้นที่รับผิดชอบ", score: avgArea || 0 },
    { subject: "ความสะอาดห้องเรียน", score: avgClass || 0 },
    { subject: "แก้วน้ำส่วนตัว", score: avgWater || 0 },
  ];

  // --- Monthly Progress Logic ---
  const [selectedGrade, setSelectedGrade] = useState<string>("1");
  const [selectedCategory, setSelectedCategory] = useState<"area" | "classroom" | "water">("area");
  const [viewMode, setViewMode] = useState<"monthly" | "weekly">("monthly");

  const progressData = useMemo(() => {
    const periods = new Set<string>();
    
    const getWeekOfMonth = (dateStr: string) => {
      const [y, m, d] = dateStr.split('-');
      const day = parseInt(d);
      if (day <= 7) return "1";
      if (day <= 14) return "2";
      if (day <= 21) return "3";
      return "4";
    };

    const extractPeriods = (records: any[], dateField: string) => {
      records.forEach(r => { 
        if (r[dateField]) {
          if (viewMode === "monthly") {
            periods.add(r[dateField].slice(0, 7)); // YYYY-MM
          } else {
            const [y, m] = r[dateField].split('-');
            const week = getWeekOfMonth(r[dateField]);
            periods.add(`${y}-${m}-W${week}`);
          }
        } 
      });
    };
    extractPeriods(areaStats, "evaluated_at");
    extractPeriods(classroomStats, "evaluated_at");
    extractPeriods(waterStats, "check_date");
    
    const sortedPeriods = Array.from(periods).sort();
    
    // Filter homerooms by grade and sort by class number
    const filteredHomerooms = homerooms
      .filter(hr => hr.grade_level?.toString() === selectedGrade)
      .sort((a, b) => (a.class_number || 0) - (b.class_number || 0));
    
    // Build Chart Data
    const chartData = sortedPeriods.map(period => {
      let label = "";
      if (viewMode === "monthly") {
        label = new Date(period + "-01").toLocaleDateString("th-TH", { month: "short" });
      } else {
        const [y, m, w] = period.split('-');
        const monthName = new Date(`${y}-${m}-01`).toLocaleDateString("th-TH", { month: "short" });
        label = `${monthName} สัปดาห์ ${w.replace('W', '')}`;
      }
      
      const dataPoint: any = { period: label };
      const periodPrefix = viewMode === "monthly" ? period : period.substring(0, 7); // "YYYY-MM"
      
      filteredHomerooms.forEach(hr => {
        let hrScore = 0;
        
        const isMatch = (dateStr: string) => {
          if (!dateStr) return false;
          if (viewMode === "monthly") return dateStr.startsWith(periodPrefix);
          const [y, m] = dateStr.split('-');
          const week = getWeekOfMonth(dateStr);
          return `${y}-${m}-W${week}` === period;
        };
        
        if (selectedCategory === "area") {
          const areaRecs = areaStats.filter(r => r.homeroom_id === hr.id && isMatch(r.evaluated_at));
          const avgA = areaRecs.length > 0 ? areaRecs.reduce((s, r) => s + (r.percentage||0), 0) / areaRecs.length : 0;
          hrScore = avgA;
        }
        
        if (selectedCategory === "classroom") {
          const classRecs = classroomStats.filter(r => r.homeroom_id === hr.id && isMatch(r.evaluated_at));
          const avgC = classRecs.length > 0 ? classRecs.reduce((s, r) => s + (r.percentage||0), 0) / classRecs.length : 0;
          hrScore = avgC;
        }

        if (selectedCategory === "water") {
          const waterRecs = waterStats.filter(r => r.homeroom_id === hr.id && isMatch(r.check_date));
          const avgW = waterRecs.length > 0 ? waterRecs.reduce((s, r) => s + (r.percentage||0), 0) / waterRecs.length : 0;
          hrScore = avgW;
        }

        // Only add if there's any data
        dataPoint[hr.class_name] = hrScore > 0 ? Number(hrScore.toFixed(1)) : null;
      });
      return dataPoint;
    });

    return { chartData, sortedPeriods, filteredHomerooms };
  }, [areaStats, classroomStats, waterStats, homerooms, selectedGrade, selectedCategory, viewMode]);

  // --- Today's Submission Tracker Logic ---
  const [submissionGrade, setSubmissionGrade] = useState<string>("1");
  const filteredSubmissionHomerooms = homerooms
    .filter(hr => hr.grade_level?.toString() === submissionGrade)
    .sort((a, b) => (a.class_number || 0) - (b.class_number || 0));

  const checkSubmission = (categoryId: "area" | "classroom" | "water", homeroomId: string) => {
    if (categoryId === "area") {
      return todaySubmissions.area.some((s: any) => s.responsible_areas?.homeroom_id === homeroomId);
    } else if (categoryId === "classroom") {
      return todaySubmissions.classroom.some((s: any) => s.homeroom_id === homeroomId);
    } else if (categoryId === "water") {
      return todaySubmissions.water.some((s: any) => s.homeroom_id === homeroomId);
    }
    return false;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          แดชบอร์ดสิ่งแวดล้อม 🌿
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          ภาพรวมผลการประเมินสิ่งแวดล้อมโรงเรียนสา · ปีการศึกษา 2567
        </p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="stat-card bg-white dark:bg-gray-900 group cursor-default"
            >
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                  <TrendingUp className="w-3 h-3" />
                  {stat.trend}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Monthly Progress Trends */}
      <motion.div variants={itemVariants} className="stat-card bg-white dark:bg-gray-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white text-lg">
              กราฟความคืบหน้า 📈
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">เปรียบเทียบคะแนนแต่ละห้องเรียน เพื่อดูพัฒนาการ</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("monthly")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === "monthly" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                รายเดือน
              </button>
              <button
                onClick={() => setViewMode("weekly")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === "weekly" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                รายสัปดาห์
              </button>
            </div>
            
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mr-2">
              <button
                onClick={() => setSelectedCategory("area")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  selectedCategory === "area" ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <MapPin className="w-3.5 h-3.5" /> พื้นที่
              </button>
              <button
                onClick={() => setSelectedCategory("classroom")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  selectedCategory === "classroom" ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <School className="w-3.5 h-3.5" /> ห้องเรียน
              </button>
              <button
                onClick={() => setSelectedCategory("water")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  selectedCategory === "water" ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <Droplets className="w-3.5 h-3.5" /> แก้วน้ำ
              </button>
            </div>
            <select 
              value={selectedGrade} 
              onChange={e => setSelectedGrade(e.target.value)}
              className="bg-gray-50 dark:bg-gray-800 border-none text-sm rounded-lg focus:ring-0 cursor-pointer text-gray-900 dark:text-white"
            >
              <option value="1">ม.1</option>
              <option value="2">ม.2</option>
              <option value="3">ม.3</option>
              <option value="4">ม.4</option>
              <option value="5">ม.5</option>
              <option value="6">ม.6</option>
            </select>
          </div>
        </div>

        {progressData.chartData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 12, fontFamily: "Sarabun", fill: "currentColor" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "currentColor" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "12px", fontFamily: "Sarabun", fontSize: 13, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", background: "var(--background)", color: "var(--foreground)" }} />
                <Legend wrapperStyle={{ fontFamily: "Sarabun", fontSize: 12, paddingTop: "20px", color: "currentColor" }} />
                {progressData.filteredHomerooms.map((hr, idx) => (
                  <Line 
                    key={hr.id}
                    type="monotone"
                    dataKey={hr.class_name}
                    stroke={COLORS[idx % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            
            {/* Progress Matrix Table */}
            <div className="mt-8 overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-left w-32">ห้องเรียน</th>
                    {progressData.chartData.map(d => (
                      <th key={d.period} className="text-center">{d.period}</th>
                    ))}
                    <th className="text-center">เฉลี่ยรวม</th>
                  </tr>
                </thead>
                <tbody>
                  {progressData.filteredHomerooms.map(hr => {
                    let total = 0;
                    let count = 0;
                    return (
                      <tr key={hr.id}>
                        <td className="font-semibold text-gray-900 dark:text-white">{hr.class_name}</td>
                        {progressData.chartData.map(d => {
                          const val = d[hr.class_name];
                          if (val) {
                            total += val;
                            count++;
                          }
                          return (
                            <td key={d.period} className="text-center">
                              {val ? (
                                <span className={`font-medium ${val >= 80 ? 'text-green-600' : val >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                                  {val}%
                                </span>
                              ) : <span className="text-gray-300">-</span>}
                            </td>
                          );
                        })}
                        <td className="text-center font-bold text-blue-600 dark:text-blue-400">
                          {count > 0 ? formatPercent(total / count) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
            <LineChart className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">ยังไม่มีข้อมูลสำหรับพล็อตกราฟ</p>
          </div>
        )}
      </motion.div>

      {/* --- Today's Submission Tracker --- */}
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-500" />
              ติดตามสถานะการส่งรายงานวันนี้
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              แสดงผลเรียลไทม์ว่าห้องไหนส่งรายงานของวันนี้แล้วบ้าง (ไม่ได้คิดเป็นคะแนน)
            </p>
          </div>
          <select
            value={submissionGrade}
            onChange={(e) => setSubmissionGrade(e.target.value)}
            className="px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="1">ม.1</option>
            <option value="2">ม.2</option>
            <option value="3">ม.3</option>
            <option value="4">ม.4</option>
            <option value="5">ม.5</option>
            <option value="6">ม.6</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
              <tr>
                <th className="px-4 py-3">ห้องเรียน</th>
                <th className="px-4 py-3 text-center">เขตพื้นที่</th>
                <th className="px-4 py-3 text-center">ห้องเรียนสะอาด</th>
                <th className="px-4 py-3 text-center">แก้วน้ำส่วนตัว</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredSubmissionHomerooms.map(hr => {
                const hasArea = checkSubmission("area", hr.id);
                const hasClass = checkSubmission("classroom", hr.id);
                const hasWater = checkSubmission("water", hr.id);
                return (
                  <tr key={hr.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {hr.class_name}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {hasArea ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 mx-auto" title="ส่งแล้ว">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="inline-block w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700" title="ยังไม่ส่ง" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {hasClass ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 mx-auto" title="ส่งแล้ว">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="inline-block w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700" title="ยังไม่ส่ง" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {hasWater ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 mx-auto" title="ส่งแล้ว">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="inline-block w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700" title="ยังไม่ส่ง" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredSubmissionHomerooms.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              ไม่พบข้อมูลห้องเรียนในระดับชั้นนี้
            </div>
          )}
        </div>
      </motion.div>

      {/* Charts Row 2 */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {/* Grade Comparison Bar */}
        <div className="stat-card">
          <div className="mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">เปรียบเทียบระดับคะแนน</h2>
            <p className="text-xs text-gray-400 mt-0.5">ภาพรวมทั้งโรงเรียน</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: "Sarabun" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "12px", fontFamily: "Sarabun", fontSize: 13, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
              <Legend wrapperStyle={{ fontFamily: "Sarabun", fontSize: 12, paddingTop: "10px" }} />
              <Bar dataKey="ทอง" fill="#F59E0B" radius={[4,4,0,0]} />
              <Bar dataKey="เงิน" fill="#94A3B8" radius={[4,4,0,0]} />
              <Bar dataKey="ทองแดง" fill="#B45309" radius={[4,4,0,0]} />
              <Bar dataKey="ผ่าน" fill="#22C55E" radius={[4,4,0,0]} />
              <Bar dataKey="ไม่ผ่าน" fill="#EF4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Rankings Mini */}
        <div className="stat-card flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">แชมป์สุดยอดห้องเรียน</h2>
              <p className="text-xs text-gray-400 mt-0.5">คะแนนสะสมรวมสูงสุด (Overall)</p>
            </div>
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          <div className="space-y-3 flex-1">
            {rankings.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center border-2 border-dashed border-gray-100 rounded-xl">
                ยังไม่มีข้อมูลคะแนนรวม
              </p>
            ) : (
              rankings.slice(0, 5).map((r, i) => {
                const rank = i + 1;
                return (
                  <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      rank === 1 ? "bg-amber-100 text-amber-700" :
                      rank === 2 ? "bg-slate-100 text-slate-600" :
                      rank === 3 ? "bg-orange-100 text-orange-700" :
                      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}>
                      {rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{r.homeroom?.class_name ?? "—"}</p>
                      <p className="text-xs text-gray-400">{r.homeroom?.buildings?.name ?? "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white text-sm">
                        {formatPercent(r.total_score)}
                      </p>
                      {r.grade && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          r.grade === "gold" ? "badge-gold" :
                          r.grade === "silver" ? "badge-silver" :
                          r.grade === "bronze" ? "badge-bronze" : "bg-gray-100 text-gray-500"
                        }`}>
                          {GRADE_LABEL_MAP[r.grade] ?? r.grade}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
