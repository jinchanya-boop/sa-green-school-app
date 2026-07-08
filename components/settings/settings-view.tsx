"use client";

import { motion } from "framer-motion";
import { Settings, Building2, Users, GraduationCap, FileText, Bell, Shield } from "lucide-react";
import { useState } from "react";
import { AcademicTab } from "./academic-tab";
import { BuildingsTab } from "./buildings-tab";
import { CriteriaTab } from "./criteria-tab";
import { UsersTab } from "./users-tab";
import { AreasTab } from "./areas-tab";
import { HomeroomsTab } from "./homerooms-tab";

const TABS = [
  { id: "general", label: "ทั่วไป", icon: Settings },
  { id: "buildings", label: "อาคาร/ห้อง", icon: Building2 },
  { id: "homerooms", label: "ห้องประจำชั้น", icon: Users },
  { id: "users", label: "ผู้ใช้งาน", icon: Users },
  { id: "academic", label: "ปีการศึกษา", icon: GraduationCap },
  { id: "areas", label: "พื้นที่รับผิดชอบ", icon: Building2 },
  { id: "criteria", label: "เกณฑ์ประเมิน", icon: FileText },
  { id: "notifications", label: "การแจ้งเตือน", icon: Bell },
  { id: "audit", label: "บันทึกระบบ", icon: Shield },
];

export function SettingsView({ data }: { data: any }) {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
          <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ตั้งค่าระบบ</h1>
          <p className="text-gray-400 text-sm">โมดูล I — จัดการการตั้งค่าทั้งหมด</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Nav */}
        <div className="lg:w-56 flex-shrink-0">
          <nav className="space-y-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Panel */}
        <div className="flex-1">
          {activeTab === "general" && (() => {
            const getSetting = (key: string, def: string) => {
              const s = data.settings?.find((x: any) => x.key === key);
              if (!s) return def;
              try {
                return JSON.parse(s.value);
              } catch (e) {
                return s.value;
              }
            };

            return (
              <>
                <form action={async (formData) => {
                  const { updateGeneralSettings } = await import("@/app/(dashboard)/settings/actions");
                  const res = await updateGeneralSettings(formData);
                  if (!res.success) alert(res.error);
                  else alert("บันทึกข้อมูลสำเร็จ");
                }} className="stat-card space-y-6 bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
                  <h2 className="font-semibold text-gray-900 dark:text-white">ข้อมูลโรงเรียน</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: "ชื่อโรงเรียน", value: getSetting("school_name", "โรงเรียนสา"), name: "school_name" },
                      { label: "ชื่อภาษาอังกฤษ", value: getSetting("school_name_en", "Sa School"), name: "school_name_en" },
                      { label: "ที่อยู่", value: getSetting("school_address", "อ.เวียงสา จ.น่าน 55110"), name: "school_address" },
                    ].map((field) => (
                      <div key={field.name} className={field.name === "school_address" ? "sm:col-span-2" : ""}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          {field.label}
                        </label>
                        <input
                          name={field.name}
                          defaultValue={field.value}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">เกณฑ์คะแนน</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "🥇 ทอง", value: getSetting("grade_gold", "90"), name: "grade_gold" },
                        { label: "🥈 เงิน", value: getSetting("grade_silver", "80"), name: "grade_silver" },
                        { label: "🥉 ทองแดง", value: getSetting("grade_bronze", "70"), name: "grade_bronze" },
                        { label: "✅ ผ่าน", value: getSetting("grade_pass", "60"), name: "grade_pass" },
                      ].map((t) => (
                        <div key={t.name}>
                          <label className="block text-xs font-medium text-gray-500 mb-1">{t.label} (≥%)</label>
                          <input
                            type="number"
                            name={t.name}
                            defaultValue={t.value}
                            min={0}
                            max={100}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm text-center font-semibold"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" className="px-6 py-2.5 gradient-green text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-green-200/50">
                      บันทึกการเปลี่ยนแปลง
                    </button>
                  </div>
                </form>

                <div className="mt-8 stat-card border-red-100 dark:border-red-900 bg-red-50/50 dark:bg-red-900/10 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">เขตอันตราย (Danger Zone)</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      การล้างข้อมูลทดสอบ จะทำการลบข้อมูล อาคาร ชั้น ห้อง พื้นที่รับผิดชอบ และการประเมินต่างๆ ทั้งหมดออกจากระบบ (ข้อมูลผู้ใช้จะยังคงอยู่)
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm("ยืนยันการล้างข้อมูลทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้!")) {
                        const { clearAllDummyData } = await import("@/app/(dashboard)/settings/actions");
                        const res = await clearAllDummyData();
                        if (res.success) {
                          alert("ล้างข้อมูลสำเร็จแล้ว!");
                        } else {
                          alert("เกิดข้อผิดพลาดในการล้างข้อมูล");
                        }
                      }
                    }}
                    className="px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl text-sm font-medium transition-colors"
                  >
                    ล้างข้อมูลทดสอบทั้งหมด
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm("ต้องการอัปเดตเกณฑ์ประเมินห้องเรียน 10 ข้อใหม่ใช่หรือไม่?")) {
                        const { updateClassroomCriteria } = await import("@/app/(dashboard)/settings/actions");
                        const res = await updateClassroomCriteria();
                        if (res.success) {
                          alert("อัปเดตเกณฑ์ประเมินห้องเรียนเรียบร้อยแล้ว!");
                        } else {
                          alert("เกิดข้อผิดพลาด: " + res.error);
                        }
                      }
                    }}
                    className="px-4 py-2 ml-4 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl text-sm font-medium transition-colors"
                  >
                    ติดตั้งเกณฑ์การประเมินห้องเรียน (10 ข้อ)
                  </button>
                </div>
              </>
            );
          })()}

          {activeTab === "academic" && (
            <AcademicTab data={data} />
          )}

          {activeTab === "buildings" && (
            <BuildingsTab data={data} />
          )}

          {activeTab === "criteria" && (
            <CriteriaTab data={data} />
          )}

          {activeTab === "users" && (
            <UsersTab data={data} />
          )}

          {activeTab === "areas" && (
            <AreasTab data={data} />
          )}

          {activeTab === "homerooms" && (
            <HomeroomsTab data={data} />
          )}

          {activeTab !== "general" && activeTab !== "academic" && activeTab !== "buildings" && activeTab !== "homerooms" && activeTab !== "criteria" && activeTab !== "users" && activeTab !== "areas" && (
            <div className="stat-card flex flex-col items-center justify-center py-20 text-gray-400">
              <Settings className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium">
                {TABS.find((t) => t.id === activeTab)?.label}
              </p>
              <p className="text-sm mt-1">ส่วนนี้อยู่ระหว่างการพัฒนา</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
