"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Minus, Droplets, Calendar, Star, MapPin, School, Medal } from "lucide-react";
import { formatPercent, GRADE_BG } from "@/lib/utils";
import { Confetti } from "@/components/ui/confetti";

interface RankingsViewProps {
  homerooms: any[];
  waterRecords: any[];
  areaRecords: any[];
  classRecords: any[];
  overallScores: any[];
}

type TabType = "area" | "classroom" | "water";

function getGrade(percentage: number) {
  if (percentage >= 90) return "gold";
  if (percentage >= 80) return "silver";
  if (percentage >= 70) return "bronze";
  return "fail";
}

export function RankingsView({ homerooms, waterRecords, areaRecords, classRecords, overallScores }: RankingsViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("area");
  const [rankingGroup, setRankingGroup] = useState<"junior" | "senior">("junior");
  
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

    const filteredHomerooms = homerooms.filter(hr => {
      const grade = hr.grade_level?.toString() || "";
      if (rankingGroup === "junior") return ["1", "2", "3"].includes(grade);
      if (rankingGroup === "senior") return ["4", "5", "6"].includes(grade);
      return true;
    });

    const rankingsData = filteredHomerooms.map(hr => {
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

  const waterRankings = useMemo(() => processRankings(waterRecords, "check_date"), [homerooms, waterRecords, selectedMonth, rankingGroup]);
  const areaRankings = useMemo(() => processRankings(areaRecords, "eval_date", true), [homerooms, areaRecords, selectedMonth, rankingGroup]);
  const classroomRankings = useMemo(() => processRankings(classRecords, "eval_date"), [homerooms, classRecords, selectedMonth, rankingGroup]);

  const getDisplayData = () => {
    switch (activeTab) {
      case "area": return areaRankings;
      case "classroom": return classroomRankings;
      case "water": return waterRankings;
      default: return areaRankings;
    }
  };

  const displayData = getDisplayData();

  const getTabColors = (tab: TabType) => {
    switch (tab) {
      case "area": return { icon: MapPin, text: "text-green-600 dark:text-green-400", bgIcon: "bg-green-100 text-green-700", border: "border-green-200", shadow: "shadow-green-100", title: "พื้นที่รับผิดชอบ", activeBtn: "text-green-600 dark:text-green-400" };
      case "classroom": return { icon: School, text: "text-purple-600 dark:text-purple-400", bgIcon: "bg-purple-100 text-purple-700", border: "border-purple-200", shadow: "shadow-purple-100", title: "ห้องเรียนสะอาด", activeBtn: "text-purple-600 dark:text-purple-400" };
      case "water": return { icon: Droplets, text: "text-blue-600 dark:text-blue-400", bgIcon: "bg-blue-100 text-blue-700", border: "border-blue-200", shadow: "shadow-blue-100", title: "แชมป์แก้วน้ำส่วนตัว", activeBtn: "text-blue-600 dark:text-blue-400" };
      default: return { icon: MapPin, text: "text-green-600 dark:text-green-400", bgIcon: "bg-green-100 text-green-700", border: "border-green-200", shadow: "shadow-green-100", title: "พื้นที่รับผิดชอบ", activeBtn: "text-green-600 dark:text-green-400" };
    }
  };

  const theme = getTabColors(activeTab);
  const Icon = theme.icon;

  // Helper for generating deterministic colors/avatars based on string ID
  const getAvatarAndColor = (id: string, rank: number) => {
    const hash = id.split("").reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
    const colors = [
      "from-rose-400 to-red-500", "from-pink-400 to-fuchsia-500", "from-purple-400 to-indigo-500",
      "from-blue-400 to-cyan-500", "from-teal-400 to-emerald-500", "from-green-400 to-lime-500",
      "from-orange-400 to-amber-500"
    ];
    const avatars = ["🦊", "🐼", "🐯", "🦁", "🐰", "🐨", "🐶", "🐱", "🐸", "🐧"];
    return {
      color: rank === 1 ? "from-yellow-300 to-yellow-500" : rank === 2 ? "from-slate-300 to-slate-400" : rank === 3 ? "from-orange-300 to-orange-500" : colors[Math.abs(hash) % colors.length],
      avatar: avatars[Math.abs(hash) % avatars.length]
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-20 relative"
    >
      {/* Confetti effect when data is loaded and there are rankings */}
      {displayData.length > 0 && <Confetti count={40} />}

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme.bgIcon}`}>
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">หอเกียรติยศ (Leaderboard)</h1>
            <p className="text-gray-500 font-medium text-sm">
              {`${theme.title} — ศึกประชันความเป็นเลิศแห่งเดือน`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl w-full xl:w-auto overflow-x-auto gap-1 shadow-inner">
          {(["area", "classroom", "water"] as TabType[]).map((tab) => {
            const isTabActive = activeTab === tab;
            const tabTheme = getTabColors(tab);
            const TabIcon = tabTheme.icon;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none px-5 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                  isTabActive ? `bg-white dark:bg-gray-700 ${tabTheme.activeBtn} shadow-md scale-105` : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {tabTheme.title}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-3 bg-white dark:bg-gray-900 p-3 rounded-2xl border-2 border-gray-100 dark:border-gray-800 shadow-sm w-full sm:max-w-sm focus-within:border-blue-500 transition-colors">
          <Calendar className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">ประจำเดือน:</span>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer text-gray-900 dark:text-white"
          >
            {availableMonths.map(m => {
              const d = new Date(m + "-01");
              const label = d.toLocaleDateString("th-TH", { month: 'long', year: 'numeric' });
              return <option key={m} value={m} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{label}</option>
            })}
          </select>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-gray-900 p-3 rounded-2xl border-2 border-gray-100 dark:border-gray-800 shadow-sm w-full sm:max-w-xs focus-within:border-purple-500 transition-colors">
          <School className="w-5 h-5 text-purple-500" />
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">ระดับชั้น:</span>
          <select 
            value={rankingGroup}
            onChange={(e) => setRankingGroup(e.target.value as "junior" | "senior")}
            className="w-full bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer text-gray-900 dark:text-white"
          >
            <option value="junior" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">ระดับ ม.ต้น (Junior)</option>
            <option value="senior" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">ระดับ ม.ปลาย (Senior)</option>
          </select>
        </div>
      </div>

      {/* Game-style Podium */}
      {displayData.length > 0 ? (
        <div className="flex justify-center items-end h-[320px] gap-2 sm:gap-6 pt-10 mb-12">
          
          {/* Silver - 2nd Place */}
          {displayData[1] && (
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="w-[30%] sm:w-[25%] max-w-[140px] flex flex-col items-center">
              <div className="relative mb-2 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-200 to-slate-400 rounded-full border-4 border-white dark:border-gray-800 shadow-lg flex items-center justify-center text-3xl sm:text-4xl z-10">
                {getAvatarAndColor((displayData[1] as any).id, 2).avatar}
                <div className="absolute -bottom-3 bg-slate-500 text-white text-xs font-black px-2 py-0.5 rounded-full shadow border-2 border-white">2nd</div>
              </div>
              <div className="w-full h-[140px] bg-gradient-to-t from-slate-400 to-slate-300 rounded-t-[20px] sm:rounded-t-[32px] shadow-2xl flex flex-col items-center p-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20" />
                <p className="font-black text-xs sm:text-sm text-slate-900 z-10 text-center">{(displayData[1] as any).class}</p>
                <p className="font-black text-white text-sm sm:text-lg z-10 mt-1 drop-shadow-md">{formatPercent((displayData[1] as any).avgPercentage)}</p>
              </div>
            </motion.div>
          )}

          {/* Gold - 1st Place */}
          {displayData[0] && (
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, type: "spring" }} className="w-[35%] sm:w-[30%] max-w-[160px] flex flex-col items-center">
              <motion.div 
                animate={{ y: [0, -10, 0] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                className="mb-1 z-20"
              >
                <Medal className="w-10 h-10 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
              </motion.div>
              <div className="relative mb-2 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full border-4 border-white dark:border-gray-800 shadow-xl flex items-center justify-center text-4xl sm:text-5xl z-10">
                {getAvatarAndColor((displayData[0] as any).id, 1).avatar}
                <div className="absolute -bottom-4 bg-amber-500 text-white text-sm font-black px-3 py-1 rounded-full shadow-lg border-2 border-white">1st</div>
              </div>
              <div className="w-full h-[180px] bg-gradient-to-t from-amber-500 to-yellow-400 rounded-t-[24px] sm:rounded-t-[40px] shadow-2xl flex flex-col items-center p-3 sm:p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]" />
                <p className="font-black text-sm sm:text-base text-amber-950 z-10 text-center">{(displayData[0] as any).class}</p>
                <p className="font-black text-white text-base sm:text-2xl z-10 mt-1 drop-shadow-md">{formatPercent((displayData[0] as any).avgPercentage)}</p>
                <div className="mt-auto z-10">
                  <Star className="w-5 h-5 text-white/50 fill-white/50" />
                </div>
              </div>
            </motion.div>
          )}

          {/* Bronze - 3rd Place */}
          {displayData[2] && (
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0 }} className="w-[30%] sm:w-[25%] max-w-[140px] flex flex-col items-center">
              <div className="relative mb-2 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-300 to-orange-500 rounded-full border-4 border-white dark:border-gray-800 shadow-lg flex items-center justify-center text-3xl sm:text-4xl z-10">
                {getAvatarAndColor((displayData[2] as any).id, 3).avatar}
                <div className="absolute -bottom-3 bg-orange-600 text-white text-xs font-black px-2 py-0.5 rounded-full shadow border-2 border-white">3rd</div>
              </div>
              <div className="w-full h-[110px] bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-[20px] sm:rounded-t-[32px] shadow-2xl flex flex-col items-center p-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10" />
                <p className="font-black text-xs sm:text-sm text-orange-950 z-10 text-center">{(displayData[2] as any).class}</p>
                <p className="font-black text-white text-sm sm:text-lg z-10 mt-1 drop-shadow-md">{formatPercent((displayData[2] as any).avgPercentage)}</p>
              </div>
            </motion.div>
          )}

        </div>
      ) : (
        <div className="py-20 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <Trophy className="w-10 h-10 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-gray-500 font-bold">ยังไม่มีข้อมูลสำหรับการจัดอันดับในเดือนนี้</p>
        </div>
      )}

      {/* Friendly Card Layout (Rank 4+) */}
      {displayData.length > 3 && (
        <div className="space-y-3 mt-4">
          <h3 className="font-black text-gray-900 dark:text-white mb-4 px-2">นักสู้รักษ์โลกอันดับอื่นๆ (Challengers)</h3>
          {displayData.slice(3).map((r: any) => {
            const styleInfo = getAvatarAndColor(r.id, r.rank);
            return (
              <motion.div 
                key={r.rank} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * (r.rank - 3) }}
                className="flex items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-3xl border-2 border-gray-100 dark:border-gray-800 shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-all group"
              >
                <div className="font-black text-gray-400 dark:text-gray-500 text-xl w-8 text-center">
                  #{r.rank}
                </div>
                
                <div className={`w-12 h-12 rounded-[18px] bg-gradient-to-br ${styleInfo.color} flex items-center justify-center text-2xl shadow-md border-2 border-white/50 group-hover:scale-110 transition-transform`}>
                  {styleInfo.avatar}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white text-base sm:text-lg truncate">
                    {r.class}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-gray-500 hidden sm:inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {r.building}
                    </p>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map(w => (
                        <div key={w} className={`w-2 h-2 rounded-full ${r.weekly[w] !== null ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'}`} title={`สัปดาห์ ${w+1}`} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-black text-xl text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
                    {formatPercent(r.avgPercentage)}
                  </p>
                  <div className="flex justify-end items-center mt-1">
                    {r.trend === "up" ? <TrendingUp className="w-4 h-4 text-green-500" /> :
                     r.trend === "down" ? <TrendingDown className="w-4 h-4 text-red-500" /> :
                     <Minus className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
