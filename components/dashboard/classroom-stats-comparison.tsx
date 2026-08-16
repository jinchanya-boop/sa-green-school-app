"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO, startOfWeek } from "date-fns";
import { th } from "date-fns/locale";
import { GitCompare, Filter } from "lucide-react";

interface ClassroomStatsComparisonProps {
  myHomeroomId: string | null;
  homerooms: any[];
  areaStats: any[];
  classroomStats: any[];
  waterStats: any[];
}

type TimeFilter = "daily" | "weekly" | "monthly";

export function ClassroomStatsComparison({
  myHomeroomId,
  homerooms,
  areaStats,
  classroomStats,
  waterStats,
}: ClassroomStatsComparisonProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("weekly");
  const [compareHomeroomId, setCompareHomeroomId] = useState<string>("none");

  const myHomeroom = homerooms.find((h) => h.id === myHomeroomId);
  const compareHomeroom = homerooms.find((h) => h.id === compareHomeroomId);

  // Group data by time period
  const chartData = useMemo(() => {
    if (!myHomeroomId) return [];

    const dateMap = new Map<string, any>();

    const getPeriodKey = (dateStr: string) => {
      if (!dateStr) return null;
      const d = parseISO(dateStr);
      if (isNaN(d.getTime())) return null;
      
      if (timeFilter === "daily") {
        return format(d, "yyyy-MM-dd");
      } else if (timeFilter === "weekly") {
        const start = startOfWeek(d, { weekStartsOn: 1 });
        return format(start, "yyyy-MM-dd");
      } else {
        return format(d, "yyyy-MM");
      }
    };

    const getDisplayLabel = (key: string) => {
      if (timeFilter === "daily") {
        return format(parseISO(key), "d MMM yy", { locale: th });
      } else if (timeFilter === "weekly") {
        const d = parseISO(key);
        return `สัปดาห์ ${format(d, "d MMM", { locale: th })}`;
      } else {
        return format(parseISO(key + "-01"), "MMMM yyyy", { locale: th });
      }
    };

    const initPeriod = (key: string) => {
      if (!dateMap.has(key)) {
        dateMap.set(key, {
          key,
          period: getDisplayLabel(key),
          myArea: [], myClass: [], myWater: [],
          compArea: [], compClass: [], compWater: [],
        });
      }
      return dateMap.get(key);
    };

    // Process Area
    areaStats.forEach((r) => {
      const key = getPeriodKey(r.evaluated_at);
      if (!key) return;
      const period = initPeriod(key);
      if (r.homeroom_id === myHomeroomId) period.myArea.push(r.percentage || 0);
      else if (compareHomeroomId !== "none" && r.homeroom_id === compareHomeroomId) period.compArea.push(r.percentage || 0);
    });

    // Process Classroom
    classroomStats.forEach((r) => {
      const key = getPeriodKey(r.evaluated_at);
      if (!key) return;
      const period = initPeriod(key);
      if (r.homeroom_id === myHomeroomId) period.myClass.push(r.percentage || 0);
      else if (compareHomeroomId !== "none" && r.homeroom_id === compareHomeroomId) period.compClass.push(r.percentage || 0);
    });

    // Process Water
    waterStats.forEach((r) => {
      const key = getPeriodKey(r.check_date);
      if (!key) return;
      const period = initPeriod(key);
      if (r.homeroom_id === myHomeroomId) period.myWater.push(r.percentage || 0);
      else if (compareHomeroomId !== "none" && r.homeroom_id === compareHomeroomId) period.compWater.push(r.percentage || 0);
    });

    // Compute averages
    const result = Array.from(dateMap.values())
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((p) => {
        const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
        return {
          period: p.period,
          myAreaAvg: Number(avg(p.myArea).toFixed(1)),
          myClassAvg: Number(avg(p.myClass).toFixed(1)),
          myWaterAvg: Number(avg(p.myWater).toFixed(1)),
          compAreaAvg: Number(avg(p.compArea).toFixed(1)),
          compClassAvg: Number(avg(p.compClass).toFixed(1)),
          compWaterAvg: Number(avg(p.compWater).toFixed(1)),
          // Counts for table
          myAreaCount: p.myArea.length,
          myClassCount: p.myClass.length,
          myWaterCount: p.myWater.length,
          compAreaCount: p.compArea.length,
          compClassCount: p.compClass.length,
          compWaterCount: p.compWater.length,
        };
      });

    // Take last 10 periods
    return result.slice(-10);
  }, [areaStats, classroomStats, waterStats, myHomeroomId, compareHomeroomId, timeFilter]);

  if (!myHomeroomId) {
    return null;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
          <p className="font-bold text-gray-900 dark:text-white mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color || entry.stroke }} />
                <span className="text-gray-600 dark:text-gray-300">{entry.name}:</span>
                <span className="font-bold text-gray-900 dark:text-white">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[32px] p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-indigo-500" />
            สถิติการส่งงานห้อง {myHomeroom?.class_name}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            ดูผลการประเมินย้อนหลัง และเปรียบเทียบกับห้องเรียนอื่น
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Filter */}
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {(["daily", "weekly", "monthly"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                  timeFilter === filter
                    ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {filter === "daily" ? "รายวัน" : filter === "weekly" ? "รายสัปดาห์" : "รายเดือน"}
              </button>
            ))}
          </div>

          {/* Homeroom Compare Selector */}
          <div className="relative">
            <select
              value={compareHomeroomId}
              onChange={(e) => setCompareHomeroomId(e.target.value)}
              className="appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-bold rounded-xl px-4 py-2 pr-10 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="none">-- ไม่เปรียบเทียบ --</option>
              {homerooms
                .filter((h) => h.id !== myHomeroomId)
                .sort((a, b) => a.class_name.localeCompare(b.class_name))
                .map((h) => (
                  <option key={h.id} value={h.id}>
                    เปรียบเทียบกับ: {h.class_name}
                  </option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
              <Filter className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="space-y-8">
          {/* Chart */}
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#888888" strokeOpacity={0.1} vertical={false} />
                <XAxis 
                  dataKey="period" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: '600' }} 
                  dy={10}
                />
                <YAxis 
                  domain={[0, 100]}
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Legend wrapperStyle={{ fontSize: '13px', fontWeight: 'bold', paddingTop: '20px' }} />
                
                {/* My Homeroom Bars */}
                <Bar name="พื้นที่ (ห้องเรา)" dataKey="myAreaAvg" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar name="ห้องเรียน (ห้องเรา)" dataKey="myClassAvg" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar name="แก้วน้ำ (ห้องเรา)" dataKey="myWaterAvg" fill="#06B6D4" radius={[4, 4, 0, 0]} maxBarSize={40} />

                {/* Compared Homeroom Bars (Rendered only if selected) */}
                {compareHomeroomId !== "none" && (
                  <>
                    <Bar name={`พื้นที่ (${compareHomeroom?.class_name})`} dataKey="compAreaAvg" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar name={`ห้องเรียน (${compareHomeroom?.class_name})`} dataKey="compClassAvg" fill="#EC4899" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar name={`แก้วน้ำ (${compareHomeroom?.class_name})`} dataKey="compWaterAvg" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
                <tr>
                  <th className="px-4 py-3 rounded-tl-xl border-b border-gray-100 dark:border-gray-800">ช่วงเวลา</th>
                  <th className="px-4 py-3 text-center border-b border-gray-100 dark:border-gray-800" colSpan={3}>จำนวนครั้งที่ส่ง (ห้องเรา)</th>
                  {compareHomeroomId !== "none" && (
                    <th className="px-4 py-3 text-center border-l border-b border-gray-200 dark:border-gray-700" colSpan={3}>จำนวนครั้งที่ส่ง ({compareHomeroom?.class_name})</th>
                  )}
                </tr>
                <tr className="text-xs">
                  <th className="px-4 py-2 border-b border-gray-100 dark:border-gray-800"></th>
                  <th className="px-4 py-2 text-center text-green-600 dark:text-green-400 border-b border-gray-100 dark:border-gray-800">พื้นที่</th>
                  <th className="px-4 py-2 text-center text-purple-600 dark:text-purple-400 border-b border-gray-100 dark:border-gray-800">ห้องเรียน</th>
                  <th className="px-4 py-2 text-center text-cyan-600 dark:text-cyan-400 border-b border-gray-100 dark:border-gray-800">แก้วน้ำ</th>
                  {compareHomeroomId !== "none" && (
                    <>
                      <th className="px-4 py-2 text-center text-amber-500 border-l border-b border-gray-200 dark:border-gray-700">พื้นที่</th>
                      <th className="px-4 py-2 text-center text-pink-500 border-b border-gray-200 dark:border-gray-700">ห้องเรียน</th>
                      <th className="px-4 py-2 text-center text-blue-500 border-b border-gray-200 dark:border-gray-700">แก้วน้ำ</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {chartData.map((d, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">{d.period}</td>
                    <td className="px-4 py-3 text-center font-bold">{d.myAreaCount > 0 ? d.myAreaCount : "-"}</td>
                    <td className="px-4 py-3 text-center font-bold">{d.myClassCount > 0 ? d.myClassCount : "-"}</td>
                    <td className="px-4 py-3 text-center font-bold">{d.myWaterCount > 0 ? d.myWaterCount : "-"}</td>
                    {compareHomeroomId !== "none" && (
                      <>
                        <td className="px-4 py-3 text-center text-gray-500 border-l border-gray-200 dark:border-gray-700">{d.compAreaCount > 0 ? d.compAreaCount : "-"}</td>
                        <td className="px-4 py-3 text-center text-gray-500">{d.compClassCount > 0 ? d.compClassCount : "-"}</td>
                        <td className="px-4 py-3 text-center text-gray-500">{d.compWaterCount > 0 ? d.compWaterCount : "-"}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
          <GitCompare className="w-8 h-8 mb-3 opacity-30" />
          <p className="text-sm font-medium">ยังไม่มีข้อมูลการส่งงาน</p>
        </div>
      )}
    </div>
  );
}
