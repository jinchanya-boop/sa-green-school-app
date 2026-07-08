"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Minus, Droplets, Calendar, Star, MapPin, School } from "lucide-react";
import { formatPercent, GRADE_BG } from "@/lib/utils";

interface RankingsViewProps {
  homerooms: any[];
  waterRecords: any[];
  areaRecords: any[];
  classRecords: any[];
  overallScores: any[];
}

type TabType = "overall" | "area" | "classroom" | "water";

function getGrade(percentage: number) {
  if (percentage >= 90) return "gold";
  if (percentage >= 80) return "silver";
  if (percentage >= 70) return "bronze";
  if (percentage >= 60) return "pass";
  return "fail";
}

export function RankingsView({ homerooms, waterRecords, areaRecords, classRecords, overallScores }: RankingsViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overall");
  
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);

  // Collect all available months across all record types
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    const addMonths = (records: any[], dateField: string) => {
      records.forEach(r => {
        if (r[dateField]) months.add(r[dateField].slice(0, 7));
      });
    };
    addMonths(waterRecords, "check_date");
    addMonths(areaRecords, "eval_date");
    addMonths(classRecords, "eval_date");
    
    const sorted = Array.from(months).sort().reverse();
    if (!sorted.includes(currentMonth)) sorted.unshift(currentMonth);
    return sorted;
  }, [waterRecords, areaRecords, classRecords, currentMonth]);

  const overallRankings = useMemo(() => {
    return overallScores.map((score, index) => ({
      rank: index + 1,
      class: score.homeroom?.class_name || "ไม่ระบุ",
      building: score.homeroom?.buildings?.name || "ไม่ระบุ",
      area: score.area_score || 0,
      classroom: score.classroom_score || 0,
      water: score.water_score || 0,
      total: score.total_score || 0,
      grade: score.grade || "pass",
      trend: "stable",
    }));
  }, [overallScores]);

  // Generic function to process rankings for a specific type (area, class, water)
  const processRankings = (records: any[], dateField: string, isArea: boolean = false) => {
    const monthRecords = records.filter(r => r[dateField]?.startsWith(selectedMonth));
    const hrMap = new Map<string, any[]>();
    
    monthRecords.forEach(r => {
      // Area records have homeroom_id inside area relation
      const hrId = isArea ? r.area?.homeroom_id : r.homeroom_id;
      if (hrId) {
        if (!hrMap.has(hrId)) hrMap.set(hrId, []);
        hrMap.get(hrId)!.push(r);
      }
    });

    const rankingsData = homerooms.map(hr => {
      const recs = hrMap.get(hr.id) || [];
      const totalChecks = recs.length;
      const avgPercentage = totalChecks > 0 
        ? recs.reduce((sum, r) => sum + (r.percentage || 0), 0) / totalChecks 
        : 0;
      
      const w1: number[] = [], w2: number[] = [], w3: number[] = [], w4: number[] = [];
      recs.forEach(r => {
        const day = parseInt(r[dateField].split("-")[2]);
        if (day <= 7) w1.push(r.percentage);
        else if (day <= 14) w2.push(r.percentage);
        else if (day <= 21) w3.push(r.percentage);
        else w4.push(r.percentage);
      });

      const avgW = (arr: number[]) => arr.length > 0 ? arr.reduce((a,b)=>a+b,0)/arr.length : null;

      return {
        id: hr.id,
        class: hr.class_name,
        building: hr.buildings?.name || "ไม่ระบุ",
        totalChecks,
        avgPercentage,
        grade: getGrade(avgPercentage),
        weekly: [avgW(w1), avgW(w2), avgW(w3), avgW(w4)]
      };
    });

    rankingsData.sort((a, b) => b.avgPercentage - a.avgPercentage);
    
    return rankingsData.map((data, index) => ({
      ...data,
      rank: index + 1,
      trend: data.weekly[3] !== null && data.weekly[2] !== null 
        ? (data.weekly[3]! > data.weekly[2]! ? "up" : data.weekly[3]! < data.weekly[2]! ? "down" : "stable") 
        : "stable"
    }));
  };

  const waterRankings = useMemo(() => processRankings(waterRecords, "check_date"), [homerooms, waterRecords, selectedMonth]);
  const areaRankings = useMemo(() => processRankings(areaRecords, "eval_date", true), [homerooms, areaRecords, selectedMonth]);
  const classroomRankings = useMemo(() => processRankings(classRecords, "eval_date"), [homerooms, classRecords, selectedMonth]);

  const getDisplayData = () => {
    switch (activeTab) {
      case "area": return areaRankings;
      case "classroom": return classroomRankings;
      case "water": return waterRankings;
      default: return overallRankings;
    }
  };

  const displayData = getDisplayData();

  const getTabColors = (tab: TabType) => {
    switch (tab) {
      case "area": return { icon: MapPin, text: "text-green-600 dark:text-green-400", bgIcon: "bg-green-100 text-green-700", border: "border-green-200", shadow: "shadow-green-100", title: "พื้นที่รับผิดชอบ", activeBtn: "text-green-600 dark:text-green-400" };
      case "classroom": return { icon: School, text: "text-purple-600 dark:text-purple-400", bgIcon: "bg-purple-100 text-purple-700", border: "border-purple-200", shadow: "shadow-purple-100", title: "ห้องเรียนสะอาด", activeBtn: "text-purple-600 dark:text-purple-400" };
      case "water": return { icon: Droplets, text: "text-blue-600 dark:text-blue-400", bgIcon: "bg-blue-100 text-blue-700", border: "border-blue-200", shadow: "shadow-blue-100", title: "แชมป์แก้วน้ำส่วนตัว", activeBtn: "text-blue-600 dark:text-blue-400" };
      default: return { icon: Trophy, text: "text-amber-600 dark:text-amber-400", bgIcon: "bg-amber-100 text-amber-700", border: "border-amber-200", shadow: "shadow-amber-100", title: "แชมป์ที่สุด (Overall)", activeBtn: "text-gray-900 dark:text-white" };
    }
  };

  const theme = getTabColors(activeTab);
  const Icon = theme.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme.bgIcon}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">การจัดอันดับ</h1>
            <p className="text-gray-400 text-sm">
              {activeTab === "overall" ? "ภาคเรียนที่ 1/2567 — คะแนนสะสมทุกด้าน" : `${theme.title} — ประจำเดือน`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-full xl:w-auto overflow-x-auto gap-1">
          {(["overall", "area", "classroom", "water"] as TabType[]).map((tab) => {
            const isTabActive = activeTab === tab;
            const tabTheme = getTabColors(tab);
            const TabIcon = tabTheme.icon;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
                  isTabActive ? `bg-white dark:bg-gray-700 ${tabTheme.activeBtn} shadow-sm` : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {tabTheme.title}
              </button>
            )
          })}
        </div>
      </div>

      {activeTab !== "overall" && (
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm max-w-sm">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">ประจำเดือน:</span>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border-none text-sm rounded-lg focus:ring-0 cursor-pointer text-gray-900 dark:text-white"
          >
            {availableMonths.map(m => {
              const d = new Date(m + "-01");
              const label = d.toLocaleDateString("th-TH", { month: 'long', year: 'numeric' });
              return <option key={m} value={m}>{label}</option>
            })}
          </select>
        </div>
      )}

      {/* Podium */}
      {displayData.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto">
          {displayData[1] && (
            <div className="flex flex-col items-center pt-6">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-lg mb-2">
                2
              </div>
              <div className={`w-full rounded-t-2xl p-2 sm:p-3 text-center h-20 flex flex-col justify-center ${activeTab === 'overall' ? 'bg-slate-100 dark:bg-slate-800' : `${theme.bgIcon.split(' ')[0]}/40 dark:bg-gray-800 border border-gray-200 dark:border-gray-700`}`}>
                <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white line-clamp-1">{displayData[1].class}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatPercent(activeTab === 'overall' ? displayData[1].total : displayData[1].avgPercentage)}
                </p>
              </div>
            </div>
          )}
          
          {displayData[0] && (
            <div className="flex flex-col items-center">
              <Icon className={`w-7 h-7 mb-1 ${theme.text}`} />
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 ${theme.bgIcon}`}>
                1
              </div>
              <div className={`w-full border-2 rounded-t-2xl p-2 sm:p-3 text-center h-28 flex flex-col justify-center bg-white dark:bg-gray-900 shadow-md ${theme.border} ${theme.shadow}`}>
                <p className={`font-bold text-xs sm:text-sm line-clamp-1 ${theme.text}`}>
                  {displayData[0].class}
                </p>
                <p className={`text-xs font-semibold mt-0.5 ${theme.text}`}>
                  {formatPercent(activeTab === 'overall' ? displayData[0].total : displayData[0].avgPercentage)}
                </p>
              </div>
            </div>
          )}
          
          {displayData[2] && (
            <div className="flex flex-col items-center pt-10">
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-orange-700 dark:text-orange-300 font-bold text-lg mb-2">
                3
              </div>
              <div className={`w-full rounded-t-2xl p-2 sm:p-3 text-center h-16 flex flex-col justify-center ${activeTab === 'overall' ? 'bg-orange-50 dark:bg-orange-950' : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700'}`}>
                <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white line-clamp-1">{displayData[2].class}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatPercent(activeTab === 'overall' ? displayData[2].total : displayData[2].avgPercentage)}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-12 text-center text-gray-500">ไม่พบข้อมูลการประเมินในรอบเวลานี้</div>
      )}

      {/* Table */}
      {displayData.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="text-center w-14">อันดับ</th>
                  <th className="text-left">ห้องเรียน</th>
                  <th className="text-left hidden sm:table-cell">อาคาร</th>
                  
                  {activeTab === "overall" ? (
                    <>
                      <th className="text-center">พื้นที่</th>
                      <th className="text-center">ห้องเรียน</th>
                      <th className="text-center">แก้วน้ำ</th>
                      <th className="text-center">รวม</th>
                      <th className="text-center">ระดับ</th>
                    </>
                  ) : (
                    <>
                      <th className="text-center hidden md:table-cell">ตรวจ (ครั้ง)</th>
                      <th className="text-center">สัปดาห์ 1</th>
                      <th className="text-center">สัปดาห์ 2</th>
                      <th className="text-center">สัปดาห์ 3</th>
                      <th className="text-center">สัปดาห์ 4</th>
                      <th className={`text-center font-bold ${theme.text}`}>เฉลี่ยเดือนนี้</th>
                    </>
                  )}
                  <th className="text-center">แนวโน้ม</th>
                </tr>
              </thead>
              <tbody>
                {displayData.map((r: any) => (
                  <tr key={r.rank} className={r.rank <= 3 ? (activeTab === 'overall' ? "bg-amber-50/30 dark:bg-amber-950/20" : "bg-gray-50/50 dark:bg-gray-800/30") : ""}>
                    <td className="text-center">
                      <span className={`w-7 h-7 inline-flex items-center justify-center rounded-lg font-bold text-sm ${
                        r.rank === 1 ? theme.bgIcon :
                        r.rank === 2 ? "bg-slate-100 text-slate-600" :
                        r.rank === 3 ? "bg-orange-100 text-orange-700" :
                        "text-gray-500"
                      }`}>
                        {r.rank}
                      </span>
                    </td>
                    <td className="font-semibold text-gray-900 dark:text-white text-sm whitespace-nowrap">{r.class}</td>
                    <td className="text-sm text-gray-500 hidden sm:table-cell">{r.building}</td>
                    
                    {activeTab === "overall" ? (
                      <>
                        <td className="text-center text-sm font-medium text-gray-700 dark:text-gray-300">{formatPercent(r.area)}</td>
                        <td className="text-center text-sm font-medium text-gray-700 dark:text-gray-300">{formatPercent(r.classroom)}</td>
                        <td className="text-center text-sm font-medium text-gray-700 dark:text-gray-300">{formatPercent(r.water)}</td>
                        <td className="text-center">
                          <span className="font-bold text-gray-900 dark:text-white">{formatPercent(r.total)}</span>
                        </td>
                        <td className="text-center">
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg border whitespace-nowrap ${GRADE_BG[r.grade as keyof typeof GRADE_BG] || GRADE_BG['pass']}`}>
                            {r.grade === "gold" ? "ทอง" : r.grade === "silver" ? "เงิน" : r.grade === "bronze" ? "ทองแดง" : "ผ่าน"}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="text-center text-sm text-gray-500 hidden md:table-cell">{r.totalChecks}</td>
                        <td className="text-center text-sm text-gray-500">{r.weekly[0] !== null ? formatPercent(r.weekly[0]) : '-'}</td>
                        <td className="text-center text-sm text-gray-500">{r.weekly[1] !== null ? formatPercent(r.weekly[1]) : '-'}</td>
                        <td className="text-center text-sm text-gray-500">{r.weekly[2] !== null ? formatPercent(r.weekly[2]) : '-'}</td>
                        <td className="text-center text-sm text-gray-500">{r.weekly[3] !== null ? formatPercent(r.weekly[3]) : '-'}</td>
                        <td className="text-center">
                          <span className={`font-bold ${theme.text}`}>{formatPercent(r.avgPercentage)}</span>
                        </td>
                      </>
                    )}
                    
                    <td className="text-center">
                      {r.trend === "up" ? <TrendingUp className="w-4 h-4 text-green-500 mx-auto" /> :
                       r.trend === "down" ? <TrendingDown className="w-4 h-4 text-red-500 mx-auto" /> :
                       <Minus className="w-4 h-4 text-gray-300 dark:text-gray-600 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
