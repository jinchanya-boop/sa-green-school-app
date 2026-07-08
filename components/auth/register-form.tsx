"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, AlertCircle, Key, User, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { registerWithCode } from "@/app/(auth)/register/actions";
export function RegisterForm({ homerooms }: { homerooms: any[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<"class_representative" | "student_council">("class_representative");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("role", role);

    const result = await registerWithCode(formData);

    if (result.success) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError(result.error || "เกิดข้อผิดพลาดในการลงทะเบียน");
    }
    setLoading(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="gradient-green px-8 py-8 text-center">
          <h1 className="text-2xl font-bold text-white">สมัครสมาชิก</h1>
          <p className="text-green-100 text-sm mt-1">
            สำหรับตัวแทนนักเรียนเท่านั้น
          </p>
        </div>

        <div className="px-8 py-8 space-y-5">
          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("class_representative")}
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                role === "class_representative"
                  ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "border-gray-100 bg-white text-gray-500 hover:border-gray-200 dark:border-gray-800 dark:bg-gray-900"
              }`}
            >
              ตัวแทนห้องเรียน
            </button>
            <button
              type="button"
              onClick={() => setRole("student_council")}
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                role === "student_council"
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                  : "border-gray-100 bg-white text-gray-500 hover:border-gray-200 dark:border-gray-800 dark:bg-gray-900"
              }`}
            >
              สภานักเรียน
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Registration Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                รหัสผ่านลับ (Registration Code) *
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                <input
                  type="text"
                  name="registration_code"
                  required
                  placeholder={role === "class_representative" ? "เช่น CLASSREP2026" : "เช่น COUNCIL2026"}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white uppercase font-medium tracking-wider"
                />
              </div>
            </div>

            {/* Room Selection (for Class Rep) */}
            {role === "class_representative" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  ห้องเรียนรับผิดชอบ *
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    name="homeroom_id"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all dark:text-white appearance-none text-gray-900"
                  >
                    <option value="">เลือกห้องประจำชั้น</option>
                    {Array.from(new Map(homerooms.map(hr => [hr.class_name, hr])).values()).map((hr) => (
                      <option key={hr.id} value={hr.id}>
                        {hr.class_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                ชื่อ-นามสกุล *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="full_name"
                  required
                  placeholder="ด.ช. รักเรียน ตั้งใจ"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all dark:text-white"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                อีเมล *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all dark:text-white"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                รหัสผ่าน *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 mt-2 rounded-xl text-white font-medium bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200/50 dark:shadow-green-900/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "สมัครสมาชิก"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative pt-2">
            <div className="absolute inset-0 flex items-center pt-2">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase pt-2">
              <span className="bg-white dark:bg-gray-900 px-3 text-gray-400">
                หรือ
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            กลับไปหน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    </motion.div>
  );
}
