"use client";

import { motion } from "framer-motion";
import { 
  Trophy, Star, Flame, Shield, Leaf, 
  CheckCircle2, Target, Award, Crown,
  Droplets, MapPin, School, ArrowUp, Clock, Coins,
  TrendingUp, BarChart2, ChevronRight
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { formatPercent } from "@/lib/utils";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ClassroomStatsComparison } from "./classroom-stats-comparison";
import { parseISO, isSameWeek } from "date-fns";

interface StudentGamifiedDashboardProps {
  totalEvals: number;
  areaStats: any[];
  classroomStats: any[];
  waterStats: any[];
  rankings: any[];
  homerooms: any[];
  todaySubmissions?: {
    area: any[];
    classroom: any[];
    water: any[];
  };
  profile?: any;
}

export function StudentGamifiedDashboard({
  totalEvals,
  areaStats,
  classroomStats,
  waterStats,
  rankings,
  homerooms,
  todaySubmissions,
  profile
}: StudentGamifiedDashboardProps) {
  
  const [comparisonCategory, setComparisonCategory] = useState<"area" | "classroom" | "water">("area");
  const [comparisonGrade, setComparisonGrade] = useState<string>("1");

  // Calculate gamified stats based on existing data
  const myHomeroomId = profile?.homeroom_id || (homerooms.length > 0 ? homerooms[0].id : null);
  const myHomeroom = homerooms.find(h => h.id === myHomeroomId);
  const classNameStr = myHomeroom?.class_name || "—";
  
  // Calculate XP & Level
  const baseXP = totalEvals * 15 + waterStats.length * 5;
  const level = Math.max(1, Math.floor(baseXP / 100));
  const currentXP = baseXP % 100;
  const nextLevelXP = 100;
  
  // Calculate Eco Points & Rank
  const myRankRecord = rankings.find(r => r.homeroom_id === myHomeroomId);
  const myRankIndex = rankings.findIndex(r => r.homeroom_id === myHomeroomId);
  const ecoPoints = myRankRecord ? Math.floor(myRankRecord.total_score * 1000) : 1500;
  const myClassScore = myRankRecord ? myRankRecord.total_score : 0;
  
  // Daily Missions (check todaySubmissions)
  const hasArea = (todaySubmissions?.area || []).some(a => a.responsible_areas?.homeroom_id === myHomeroomId);
  const hasClass = (todaySubmissions?.classroom || []).some(c => c.homeroom_id === myHomeroomId);
  const hasWater = (todaySubmissions?.water || []).some(w => w.homeroom_id === myHomeroomId);
  const missionsCompleted = [hasArea, hasClass, hasWater].filter(Boolean).length;
  const totalMissions = 3;

  // Mock a Streak (derive pseudo-random from totalEvals)
  const streakDays = Math.max(1, (totalEvals % 7) + 2);

  // Calculate Submission Stats
  const submissionStats = useMemo(() => {
    if (!homerooms.length) return [];
    
    // Count submissions per homeroom
    const statsMap: Record<string, { area: number, class: number, water: number, total: number, name: string }> = {};
    homerooms.forEach(h => {
      statsMap[h.id] = { area: 0, class: 0, water: 0, total: 0, name: h.class_name };
    });
    
    areaStats.forEach(a => { if (a.homeroom_id && statsMap[a.homeroom_id]) statsMap[a.homeroom_id].area++; });
    classroomStats.forEach(c => { if (c.homeroom_id && statsMap[c.homeroom_id]) statsMap[c.homeroom_id].class++; });
    waterStats.forEach(w => { if (w.homeroom_id && statsMap[w.homeroom_id]) statsMap[w.homeroom_id].water++; });
    
    return Object.values(statsMap).map(s => {
      s.total = s.area + s.class + s.water;
      return s;
    }).sort((a, b) => b.total - a.total);
  }, [homerooms, areaStats, classroomStats, waterStats]);

  const myStats = submissionStats.find(s => s.name === classNameStr);
  const mySubmissionCount = myStats ? myStats.total : 0;

  // Calculate Weekly Goal
  const weeklyGoalStats = useMemo(() => {
    if (!myHomeroomId) return { count: 0, percent: 0, daysLeft: 0 };
    
    const now = new Date();
    const isThisWeek = (dateStr: string) => {
      if (!dateStr) return false;
      const d = parseISO(dateStr);
      if (isNaN(d.getTime())) return false;
      return isSameWeek(d, now, { weekStartsOn: 1 });
    };

    let count = 0;
    areaStats.forEach(a => { if (a.homeroom_id === myHomeroomId && isThisWeek(a.evaluated_at)) count++; });
    classroomStats.forEach(c => { if (c.homeroom_id === myHomeroomId && isThisWeek(c.evaluated_at)) count++; });
    waterStats.forEach(w => { if (w.homeroom_id === myHomeroomId && isThisWeek(w.check_date)) count++; });

    const maxWeekly = 15; // 5 days * 3 activities
    const percent = Math.min(100, Math.round((count / maxWeekly) * 100));
    
    let currentDay = now.getDay();
    if (currentDay === 0) currentDay = 7; // Sunday is 7
    const daysLeft = Math.max(0, 5 - currentDay); // Mon-Fri

    return { count, percent, daysLeft };
  }, [areaStats, classroomStats, waterStats, myHomeroomId]);

  // Filter for bottom chart
  const filteredSubmissionStats = useMemo(() => {
    let targetHomerooms = homerooms;
    
    if (comparisonGrade === "junior") {
      targetHomerooms = homerooms.filter(h => h.grade_level >= 1 && h.grade_level <= 3);
    } else if (comparisonGrade === "senior") {
      targetHomerooms = homerooms.filter(h => h.grade_level >= 4 && h.grade_level <= 6);
    } else {
      targetHomerooms = homerooms.filter(h => h.grade_level === parseInt(comparisonGrade));
    }

    return targetHomerooms.map(h => {
      const stats = submissionStats.find(s => s.name === h.class_name);
      const statValue = stats 
        ? (comparisonCategory === "classroom" ? stats.class : stats[comparisonCategory])
        : 0;
        
      return {
        name: h.class_name,
        value: statValue
      };
    });
  }, [homerooms, submissionStats, comparisonCategory, comparisonGrade]);

  return (
    <div className="space-y-6 pb-20">
      
      {/* SECTION 1: HERO */}
      <div className="bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 rounded-[32px] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Floating eco illustrations */}
        <motion.div 
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }} 
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-10 text-white/20 text-6xl pointer-events-none"
        >
          🌱
        </motion.div>
        <motion.div 
          animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }} 
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-5 right-1/4 text-white/10 text-7xl pointer-events-none"
        >
          🌍
        </motion.div>
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-300/20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          {/* Avatar / Level Badge */}
          <motion.div whileHover={{ scale: 1.05 }} className="relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white/10 backdrop-blur-md border-[3px] border-white/40 rounded-[28px] shadow-lg flex items-center justify-center rotate-3 transition-transform">
              <span className="text-5xl drop-shadow-md">🌿</span>
            </div>
            <div className="absolute -bottom-3 -right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black text-sm sm:text-base px-4 py-1.5 rounded-full shadow-lg border-2 border-white/80">
              Lv. {level}
            </div>
          </motion.div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl sm:text-3xl font-black mb-2 text-shadow-sm">สวัสดี, ฮีโร่รักษ์โลก! 🌍</h1>
            <p className="text-green-50 font-medium mb-5 text-sm sm:text-base opacity-90">
              ทำภารกิจวันนี้เพื่อเพิ่ม XP และพิทักษ์โรงเรียนสา
            </p>
            
            {/* XP Bar */}
            <div className="bg-black/30 rounded-full h-4 w-full md:w-3/4 overflow-hidden backdrop-blur-md relative shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(currentXP / nextLevelXP) * 100}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 rounded-full relative"
              >
                <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite]" />
              </motion.div>
            </div>
            <p className="text-xs sm:text-sm text-yellow-100 mt-2 font-bold tracking-wide">
              {currentXP} / {nextLevelXP} XP สู่เลเวล {level + 1}
            </p>
          </div>
          
          {/* Streak & Points */}
          <div className="flex gap-3 sm:gap-4 mt-4 md:mt-0">
            <motion.div whileHover={{ y: -4 }} className="bg-white/20 backdrop-blur-md rounded-2xl p-3 sm:p-4 text-center border border-white/30 shadow-lg min-w-[80px]">
              <Flame className="w-8 h-8 sm:w-10 sm:h-10 text-orange-300 mx-auto fill-orange-400/80 mb-1 drop-shadow-md" />
              <div className="text-2xl sm:text-3xl font-black text-white">{streakDays}</div>
              <div className="text-[10px] sm:text-xs uppercase font-black text-green-100">Day Streak</div>
            </motion.div>
            <motion.div whileHover={{ y: -4 }} className="bg-white/20 backdrop-blur-md rounded-2xl p-3 sm:p-4 text-center border border-white/30 shadow-lg min-w-[80px]">
              <Leaf className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-200 mx-auto fill-emerald-300/80 mb-1 drop-shadow-md" />
              <div className="text-2xl sm:text-3xl font-black text-white">{ecoPoints}</div>
              <div className="text-[10px] sm:text-xs uppercase font-black text-green-100">Eco Points</div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* ROW 1 LEFT: MY PROGRESS & MY CLASS */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* SECTION 3: MY CLASS (NEW) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-[32px] p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center gap-6"
          >
            <div className="flex-shrink-0 w-20 h-20 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-[24px] flex items-center justify-center rotate-3 border border-blue-100 dark:border-blue-800">
              <School className="w-10 h-10" />
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">🏫 ห้องของฉัน</h2>
              <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-4 mb-3">
                <span className="text-3xl font-black text-gray-900 dark:text-white">
                  {classNameStr}
                </span>
                {myRankRecord ? (
                  <span className="text-lg font-bold text-amber-500 flex items-center justify-center sm:justify-start gap-1">
                    {myRankIndex === 0 ? "🥇" : myRankIndex === 1 ? "🥈" : myRankIndex === 2 ? "🥉" : "🏅"} 
                    อันดับ {myRankIndex + 1}
                  </span>
                ) : (
                  <span className="text-sm font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                    รอประเมิน
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-center sm:justify-start gap-4">
                <div className="flex-1 max-w-[200px]">
                  <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                    <span>คะแนนเฉลี่ย</span>
                    <span className="text-blue-600 dark:text-blue-400">{formatPercent(myClassScore)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, myClassScore)}%` }}
                      transition={{ duration: 1 }}
                      className="h-full bg-blue-500 rounded-full"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md">
                  <TrendingUp className="w-3 h-3" />
                  <span>+1</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* SECTION 2: DAILY MISSIONS */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-900 rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Target className="w-6 h-6 text-blue-500 fill-blue-500/20" />
                  ภารกิจประจำวัน (Daily Missions)
                </h2>
                <p className="text-sm font-medium text-gray-500 mt-1">ทำภารกิจให้ครบเพื่อรับโบนัส XP 🔥</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-black px-4 py-2 rounded-xl text-sm border border-blue-100 dark:border-blue-800/50">
                {missionsCompleted} / {totalMissions}
              </div>
            </div>

            <div className="space-y-4">
              <Link href="/area-evaluation" className="block">
                <MissionCard 
                  title="พิทักษ์เขตพื้นที่รับผิดชอบ" 
                  xp={50} 
                  coins={20}
                  difficulty={1}
                  icon={MapPin}
                  color="green"
                  isCompleted={hasArea} 
                />
              </Link>
              <Link href="/classroom-eval" className="block">
                <MissionCard 
                  title="ดูแลความสะอาดห้องเรียน" 
                  xp={40} 
                  coins={15}
                  difficulty={2}
                  icon={School}
                  color="purple"
                  isCompleted={hasClass} 
                />
              </Link>
              <Link href="/water-bottle" className="block">
                <MissionCard 
                  title="ลดการใช้พลาสติก (แก้วน้ำส่วนตัว)" 
                  xp={30} 
                  coins={10}
                  difficulty={3}
                  icon={Droplets}
                  color="cyan"
                  isCompleted={hasWater} 
                />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* ROW 1 RIGHT: BADGES & WEEKLY GOAL */}
        <div className="flex flex-col gap-6">
          
          {/* SECTION 6: BADGES */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-gray-800"
          >
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-amber-500 fill-amber-500/20" />
              เข็มกลัดเกียรติยศ
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <BadgeItem icon="🌱" name="ผู้เริ่มต้น" isUnlocked={true} color="from-green-400 to-emerald-500" />
              <BadgeItem icon="💧" name="ฮีโร่น้ำ" isUnlocked={true} color="from-cyan-400 to-blue-500" />
              <BadgeItem icon="🧹" name="เนี๊ยบสุด" isUnlocked={level >= 2} color="from-purple-400 to-fuchsia-500" />
              <BadgeItem icon="🔥" name="ไฟแรง" isUnlocked={streakDays >= 5} color="from-orange-400 to-red-500" />
              <BadgeItem icon="⭐" name="ตัวท็อป" isUnlocked={false} color="from-yellow-400 to-amber-500" />
              <BadgeItem icon="👑" name="ตำนาน" isUnlocked={false} color="from-amber-300 via-yellow-400 to-orange-500" legendary />
            </div>
          </motion.div>

          {/* SECTION 7: WEEKLY GOAL */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-[32px] p-6 border border-purple-100 dark:border-purple-800/50 shadow-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-purple-900 dark:text-purple-100 flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-500 fill-purple-500/20" />
                เป้าหมายประจำสัปดาห์
              </h2>
              <span className="text-[10px] sm:text-xs font-bold bg-purple-200 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full border border-purple-300 dark:border-purple-700">
                {weeklyGoalStats.daysLeft > 0 ? `เหลืออีก ${weeklyGoalStats.daysLeft} วัน` : "หมดเวลาแล้ว"}
              </span>
            </div>
            
            <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl p-5 backdrop-blur-md border border-white/50 dark:border-gray-700/50">
              <div className="flex justify-between text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                <span className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-500" />
                  รักษ์โลกต่อเนื่อง ({weeklyGoalStats.count}/15)
                </span>
                <span className="text-purple-600 dark:text-purple-400 font-black">{weeklyGoalStats.percent}%</span>
              </div>
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${weeklyGoalStats.percent}%` }}
                  transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full relative"
                >
                  <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                </motion.div>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-gray-500">
                <div className="w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  🎁
                </div>
                ทำสำเร็จรับ "กล่องสุ่มแรร์"
              </div>
            </div>
          </motion.div>

          {/* SECTION 5: TODAY'S HIGHLIGHT */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-emerald-50 dark:bg-emerald-900/20 rounded-[32px] p-6 border border-emerald-100 dark:border-emerald-800/50 flex gap-4 items-center"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Leaf className="w-6 h-6 fill-emerald-500/20" />
            </div>
            <div>
              <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-100 mb-1">🌱 Eco Tip</h3>
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 leading-relaxed">
                การพกแก้วน้ำส่วนตัวมาโรงเรียนทุกวัน ช่วยลดขยะพลาสติกได้ถึง 365 ชิ้นต่อปีเลยนะ!
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ROW 3: LEADERBOARD & STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          {/* SECTION 4: CLASS LEADERBOARD (Replacing Top 3) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-900 rounded-[32px] p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500/20" />
                🏆 ห้องเรียนยอดเยี่ยม (Top 5)
              </h2>
            </div>
            
            <div className="space-y-3">
              {rankings.length === 0 ? (
                <div className="text-center py-8 text-gray-400 font-medium">รอข้อมูลการประเมิน...</div>
              ) : (
                rankings.slice(0, 5).map((r, i) => (
                  <motion.div 
                    whileHover={{ scale: 1.01, x: 4 }}
                    key={r.id} 
                    className={`flex items-center gap-4 p-3 sm:p-4 rounded-[20px] transition-all border ${
                      r.homeroom_id === myHomeroomId 
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50" 
                        : "hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent hover:border-gray-100 dark:hover:border-gray-700"
                    }`}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-sm shrink-0 ${
                      i === 0 ? "bg-gradient-to-br from-yellow-300 to-amber-500 text-lg sm:text-xl shadow-yellow-500/30" :
                      i === 1 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-base sm:text-lg" :
                      i === 2 ? "bg-gradient-to-br from-orange-300 to-orange-500 text-base sm:text-lg" :
                      "bg-gray-100 dark:bg-gray-800 text-gray-400 text-sm sm:text-base border border-gray-200 dark:border-gray-700"
                    }`}>
                      {i + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                            {r.homeroom?.class_name ?? "—"}
                          </p>
                          {r.homeroom_id === myHomeroomId && (
                            <span className="hidden sm:inline-block bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-lg border border-blue-200">
                              ห้องคุณ
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 font-medium sm:hidden">
                          {formatPercent(r.total_score)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 sm:gap-8">
                        <p className="hidden sm:block text-sm font-black text-gray-700 dark:text-gray-300">
                          {formatPercent(r.total_score)}
                        </p>
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md">
                          <TrendingUp className="w-3 h-3" />
                          <span className="hidden sm:inline">คงที่</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-2">
          {/* NEW SECTION: SUBMISSION STATISTICS WITH COMPARISON */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="h-full"
          >
            <ClassroomStatsComparison
              myHomeroomId={myHomeroomId}
              homerooms={homerooms}
              areaStats={areaStats}
              classroomStats={classroomStats}
              waterStats={waterStats}
            />
          </motion.div>
        </div>
      </div>

      {/* NEW SECTION: COMPARISON CHART WITH FILTERS */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white dark:bg-gray-900 rounded-[32px] p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-indigo-500 fill-indigo-500/20" />
              สถิติการส่งงานของแต่ละห้อง
            </h2>
            <p className="text-sm font-medium text-gray-500 mt-1">
              เปรียบเทียบจำนวนการส่งงานแยกตามประเภทและระดับชั้น
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setComparisonCategory("area")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  comparisonCategory === "area" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <MapPin className="w-3.5 h-3.5" /> พื้นที่
              </button>
              <button
                onClick={() => setComparisonCategory("classroom")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  comparisonCategory === "classroom" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <School className="w-3.5 h-3.5" /> ห้องเรียน
              </button>
              <button
                onClick={() => setComparisonCategory("water")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  comparisonCategory === "water" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <Droplets className="w-3.5 h-3.5" /> แก้วน้ำ
              </button>
            </div>
            <select 
              value={comparisonGrade} 
              onChange={e => setComparisonGrade(e.target.value)}
              className="bg-gray-50 dark:bg-gray-800 border-none text-sm font-medium rounded-lg focus:ring-0 cursor-pointer text-gray-900 dark:text-white py-1.5"
            >
              <option value="1">ม.1</option>
              <option value="2">ม.2</option>
              <option value="3">ม.3</option>
              <option value="4">ม.4</option>
              <option value="5">ม.5</option>
              <option value="6">ม.6</option>
              <option value="junior">ม.ต้น</option>
              <option value="senior">ม.ปลาย</option>
            </select>
          </div>
        </div>
        
        <div className="h-[280px] w-full mt-4">
          {filteredSubmissionStats.length > 0 ? (
            <div className="text-gray-500 dark:text-gray-400">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={filteredSubmissionStats} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'currentColor', fontSize: 12, fontWeight: 'bold' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'currentColor', fontSize: 12 }} 
                    dx={-10}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#1F2937', marginBottom: '8px' }}
                  />
                  <Bar 
                    name={comparisonCategory === "area" ? "พื้นที่" : comparisonCategory === "classroom" ? "ห้องเรียน" : "แก้วน้ำ"} 
                    dataKey="value" 
                    fill={comparisonCategory === "area" ? "#10B981" : comparisonCategory === "classroom" ? "#8B5CF6" : "#06B6D4"} 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 font-medium">ไม่มีข้อมูลห้องเรียนในระดับชั้นนี้</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function MissionCard({ title, xp, coins, difficulty, icon: Icon, color, isCompleted }: { title: string, xp: number, coins: number, difficulty: number, icon: any, color: string, isCompleted: boolean }) {
  const colorStyles: Record<string, string> = {
    green: "text-green-600 bg-green-100 dark:bg-green-900/40 border-green-200 dark:border-green-800/50",
    purple: "text-purple-600 bg-purple-100 dark:bg-purple-900/40 border-purple-200 dark:border-purple-800/50",
    cyan: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/40 border-cyan-200 dark:border-cyan-800/50",
  };

  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${h}h ${m}m`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      whileHover={!isCompleted ? { scale: 1.02, x: 4, y: -2 } : {}}
      className={`relative overflow-hidden flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-[24px] border-2 transition-all ${
        isCompleted 
          ? "border-green-400 bg-green-50/50 dark:bg-green-900/20 shadow-lg shadow-green-100/50 dark:shadow-none opacity-90" 
          : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-gray-200 shadow-sm hover:shadow-md"
      }`}
    >
      <div className="flex items-center gap-4 w-full sm:w-auto">
        {/* Progress Ring & Icon */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" className="stroke-gray-100 dark:stroke-gray-700" strokeWidth="3" />
            <motion.circle 
              cx="18" cy="18" r="16" fill="none" 
              className={`${isCompleted ? "stroke-green-500" : "stroke-blue-400"} transition-all duration-1000`} 
              strokeWidth="3" 
              strokeDasharray="100" 
              strokeDashoffset={isCompleted ? 0 : 100}
              strokeLinecap="round" 
            />
          </svg>
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center z-10 ${isCompleted ? "bg-green-500 text-white shadow-md" : colorStyles[color]}`}>
            {isCompleted ? <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" /> : <Icon className="w-5 h-5 sm:w-6 sm:h-6" />}
          </div>
        </div>

        <div className="flex-1 min-w-0 sm:hidden">
          <h3 className={`font-black text-sm truncate ${isCompleted ? "text-green-700 dark:text-green-400" : "text-gray-900 dark:text-white"}`}>
            {title}
          </h3>
          <div className="flex items-center gap-1 mt-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Star key={i} className={`w-3 h-3 ${i < difficulty ? "text-yellow-400 fill-yellow-400" : "text-gray-200 dark:text-gray-700"}`} />
            ))}
          </div>
        </div>
        
        <div className="ml-auto hidden sm:flex items-center text-gray-400 dark:text-gray-600">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full sm:w-auto">
        <div className="hidden sm:block">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex">
              {Array.from({ length: 3 }).map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < difficulty ? "text-yellow-400 fill-yellow-400" : "text-gray-200 dark:text-gray-700"}`} />
              ))}
            </div>
            {!isCompleted && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3" /> {timeLeft}
              </span>
            )}
          </div>
          <h3 className={`font-black text-sm truncate ${isCompleted ? "text-green-700 dark:text-green-400" : "text-gray-900 dark:text-white"}`}>
            {title}
          </h3>
        </div>
        
        {/* Rewards */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${isCompleted ? "bg-green-100 border-green-200 dark:bg-green-900/30 dark:border-green-800" : "bg-blue-50 border-blue-100 dark:bg-blue-900/30 dark:border-blue-800"}`}>
            <ArrowUp className={`w-3.5 h-3.5 ${isCompleted ? "text-green-600" : "text-blue-500"}`} />
            <span className={`text-xs font-black ${isCompleted ? "text-green-700 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>{xp} XP</span>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${isCompleted ? "bg-green-100 border-green-200 dark:bg-green-900/30 dark:border-green-800" : "bg-emerald-50 border-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800"}`}>
            <Coins className={`w-3.5 h-3.5 ${isCompleted ? "text-green-600" : "text-emerald-500"}`} />
            <span className={`text-xs font-black ${isCompleted ? "text-green-700 dark:text-green-400" : "text-emerald-600 dark:text-emerald-400"}`}>+{coins}</span>
          </div>
        </div>
      </div>
      
      {/* Completion Stamp Animation */}
      {isCompleted && (
        <motion.div 
          initial={{ scale: 2, opacity: 0, rotate: -20 }} 
          animate={{ scale: 1, opacity: 1, rotate: -12 }} 
          transition={{ type: "spring", bounce: 0.5 }}
          className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:block"
        >
          <div className="border-[3px] border-green-500 text-green-500 font-black text-xl px-3 py-1 rounded-xl opacity-20 transform rotate-12">
            CLEAR
          </div>
        </motion.div>
      )}
      
      {/* Glow effect on completion */}
      {isCompleted && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: [0, 0.3, 0] }} 
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-green-400/20 blur-xl pointer-events-none" 
        />
      )}
    </motion.div>
  );
}

function BadgeItem({ icon, name, isUnlocked, color, legendary = false }: { icon: string, name: string, isUnlocked: boolean, color: string, legendary?: boolean }) {
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      className={`relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-[20px] border transition-all ${
        isUnlocked 
          ? `bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 ${legendary ? 'shadow-[0_0_15px_rgba(250,204,21,0.4)] border-yellow-200 dark:border-yellow-900/50' : 'shadow-sm'}` 
          : "bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800/50 opacity-60 grayscale"
      }`}
    >
      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-2xl sm:text-3xl shadow-inner relative ${
        isUnlocked ? `bg-gradient-to-br ${color} text-white` : "bg-gray-200 dark:bg-gray-700"
      }`}>
        {icon}
        {isUnlocked && legendary && (
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-dashed border-yellow-300/50" 
          />
        )}
      </div>
      <span className={`text-[10px] sm:text-xs font-black text-center ${isUnlocked ? 'text-gray-700 dark:text-gray-200' : 'text-gray-500 dark:text-gray-500'}`}>
        {name}
      </span>
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/30 dark:bg-black/20 backdrop-blur-[1px] rounded-[20px]">
          <Shield className="w-6 h-6 text-gray-500/80 drop-shadow-md" />
        </div>
      )}
    </motion.div>
  );
}
