"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, School, MapPin, Droplets, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

import { ClassroomDetailModal } from "@/components/evaluation/classroom-detail-modal";
import { AreaDetailModal } from "@/components/evaluation/area-detail-modal";
import { WaterBottleDetailModal } from "@/components/water-bottle/water-bottle-detail-modal";

interface PendingListProps {
  classroomEvals: any[];
  areaEvals: any[];
  waterBottleRecords: any[];
  userRole: string;
  classroomCriteria?: any[];
  areaCriteria?: any[];
}

export function PendingList({ 
  classroomEvals, 
  areaEvals, 
  waterBottleRecords, 
  userRole,
  classroomCriteria = [],
  areaCriteria = [] 
}: PendingListProps) {
  
  const [selectedClassroomEval, setSelectedClassroomEval] = useState<any | null>(null);
  const [selectedAreaEval, setSelectedAreaEval] = useState<any | null>(null);
  const [selectedWaterRecord, setSelectedWaterRecord] = useState<any | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  const totalPending = classroomEvals.length + areaEvals.length + waterBottleRecords.length;

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <div className="bg-gradient-to-br from-amber-50 to-orange-100/50 dark:from-amber-950/20 dark:to-orange-900/10 rounded-3xl p-6 sm:p-8 border border-amber-100/50 dark:border-amber-900/30 flex items-center gap-6 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-64 h-64 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div className="relative z-10 flex-1">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              📋 รออนุมัติ
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium mt-1">
              คุณมีรายการที่รอการตรวจสอบและอนุมัติทั้งหมด {totalPending} รายการ
            </p>
          </div>
        </div>

        {totalPending === 0 ? (
          <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">ไม่มีรายการรออนุมัติ</h3>
            <p className="text-gray-500 dark:text-gray-400">เยี่ยมมาก! คุณได้ตรวจสอบและอนุมัติทุกรายการเรียบร้อยแล้ว</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Classroom Evals (For Building Supervisor) */}
            {(userRole === "administrator" || userRole === "director" || userRole === "deputy_director" || userRole === "building_supervisor") && (
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <School className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">ความสะอาดห้องเรียน ({classroomEvals.length})</h2>
                </div>
                
                {classroomEvals.length === 0 ? (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-center text-gray-500 text-sm">
                    ไม่มีรายการรออนุมัติ
                  </div>
                ) : (
                  <div className="space-y-3">
                    {classroomEvals.map((evalRecord) => (
                      <div 
                        key={evalRecord.id}
                        onClick={() => setSelectedClassroomEval(evalRecord)}
                        className="cursor-pointer bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group flex flex-col gap-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{evalRecord.room_name}</p>
                            <p className="text-xs text-gray-500 mt-1">ผู้ประเมิน: {evalRecord.evaluator_name}</p>
                          </div>
                          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">รออนุมัติ</span>
                        </div>
                        <div className="flex justify-between items-center mt-2 border-t border-gray-50 dark:border-gray-700/50 pt-2">
                          <p className="text-xs text-gray-400">
                            {format(new Date(evalRecord.evaluated_at), "dd MMM yy", { locale: th })}
                          </p>
                          <div className="flex items-center text-blue-600 text-xs font-semibold group-hover:translate-x-1 transition-transform">
                            ประเมินเลย <ArrowRight className="w-3 h-3 ml-1" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Area Evals (For Building / Grade Supervisor) */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">พื้นที่รับผิดชอบ ({areaEvals.length})</h2>
              </div>
              
              {areaEvals.length === 0 ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-center text-gray-500 text-sm">
                  ไม่มีรายการรออนุมัติ
                </div>
              ) : (
                <div className="space-y-3">
                  {areaEvals.map((evalRecord) => (
                    <div 
                      key={evalRecord.id}
                      onClick={() => setSelectedAreaEval(evalRecord)}
                      className="cursor-pointer bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white line-clamp-1">{evalRecord.area_name}</p>
                          <p className="text-xs text-gray-500 mt-1">{evalRecord.homeroom_name || evalRecord.evaluator_name}</p>
                        </div>
                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-lg shrink-0">รออนุมัติ</span>
                      </div>
                      <div className="flex justify-between items-center mt-2 border-t border-gray-50 dark:border-gray-700/50 pt-2">
                        <p className="text-xs text-gray-400">
                          {format(new Date(evalRecord.evaluated_at), "dd MMM yy", { locale: th })}
                        </p>
                        <div className="flex items-center text-indigo-600 text-xs font-semibold group-hover:translate-x-1 transition-transform">
                          ประเมินเลย <ArrowRight className="w-3 h-3 ml-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Water Bottle Records (For Grade Supervisor) */}
            {(userRole === "administrator" || userRole === "director" || userRole === "deputy_director" || userRole === "grade_supervisor") && (
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Droplets className="w-5 h-5 text-cyan-500" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">แก้วน้ำส่วนตัว ({waterBottleRecords.length})</h2>
                </div>
                
                {waterBottleRecords.length === 0 ? (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-center text-gray-500 text-sm">
                    ไม่มีรายการรออนุมัติ
                  </div>
                ) : (
                  <div className="space-y-3">
                    {waterBottleRecords.map((record) => (
                      <div 
                        key={record.id}
                        onClick={() => setSelectedWaterRecord(record)}
                        className="cursor-pointer bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group flex flex-col gap-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{record.homeroom_name}</p>
                            <p className="text-xs text-gray-500 mt-1">คาบที่: {record.check_period}</p>
                          </div>
                          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-lg shrink-0">รออนุมัติ</span>
                        </div>
                        <div className="flex justify-between items-center mt-2 border-t border-gray-50 dark:border-gray-700/50 pt-2">
                          <p className="text-xs text-gray-400">
                            {format(new Date(record.check_date), "dd MMM yy", { locale: th })}
                          </p>
                          <div className="flex items-center text-cyan-600 text-xs font-semibold group-hover:translate-x-1 transition-transform">
                            ประเมินเลย <ArrowRight className="w-3 h-3 ml-1" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {selectedClassroomEval && (
          <ClassroomDetailModal
            evaluation={selectedClassroomEval}
            userRole={userRole}
            criteria={classroomCriteria}
            onClose={() => setSelectedClassroomEval(null)}
          />
        )}
        
        {selectedAreaEval && (
          <AreaDetailModal
            evaluation={selectedAreaEval}
            userRole={userRole}
            criteria={areaCriteria}
            onClose={() => setSelectedAreaEval(null)}
          />
        )}
        
        {selectedWaterRecord && (
          <WaterBottleDetailModal
            record={selectedWaterRecord}
            userRole={userRole}
            onClose={() => setSelectedWaterRecord(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
