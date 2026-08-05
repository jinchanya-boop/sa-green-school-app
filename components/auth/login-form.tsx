"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod" ;
import { motion } from "framer-motion";
import { Leaf, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { tryAutoProvisionStudent } from "@/app/(auth)/login/actions";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  // Create client lazily inside component to avoid build-time env var issues
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);
    setError(null);
    
    // Auto-append domain if user enters only a username
    const loginEmail = data.email.includes("@") ? data.email : `${data.email}@sa.ac.th`;

    // If the password is less than 6 characters long, we append "sa" 
    // This allows teachers using "1234" -> "1234sa"
    // And students using "19624" -> "19624sa"
    const finalPassword = data.password.length < 6 ? `${data.password}sa` : data.password;

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: finalPassword,
    });

    if (signInError) {
      // If login fails, try to auto-provision if it's a student ID
      const identifier = data.email.split("@")[0];
      const provisionRes = await tryAutoProvisionStudent(identifier, finalPassword);
      
      if (provisionRes?.success) {
        // Retry login after auto-provisioning
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: finalPassword,
        });
        
        if (retryError) {
          setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      } else {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }
    } else {
      router.push("/dashboard");
      router.refresh();
    }
    setIsLoading(false);
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) setError("ไม่สามารถเข้าสู่ระบบด้วย Google ได้");
    setIsGoogleLoading(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Card */}
      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/50 dark:border-gray-700/50 overflow-hidden relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-500/90 to-emerald-600/90 px-8 py-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-4 p-2 shadow-lg"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Sa School Logo" className="w-full h-full object-contain" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">โรงเรียนสา</h1>
          <p className="text-green-100 text-sm mt-1">
            ระบบจัดการสิ่งแวดล้อม · Sa Green School
          </p>
        </div>

        {/* Form */}
        <div className="px-8 py-8 space-y-5">
          {/* Google Login */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-[20px] border-2 border-white/80 dark:border-gray-700 bg-white/90 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-750 font-bold text-gray-800 dark:text-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-green-400 hover:text-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <div className="w-6 h-6 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin" />
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            <span className="text-lg tracking-tight">
              {isGoogleLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบด้วย Google"}
            </span>
          </motion.button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-medium">
              <span className="bg-transparent px-3 text-gray-500 backdrop-blur-sm">
                หรือเข้าสู่ระบบด้วย Username/อีเมล
              </span>
            </div>
          </div>

          {/* Error Banner */}
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                ชื่อผู้ใช้งาน (Username) หรือ อีเมล
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                  {...register("email")}
                  type="text"
                  placeholder="เช่น sa135 หรือ teacher@sa.ac.th"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/60 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white focus:dark:bg-gray-800 transition-all text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 shadow-sm hover:shadow-md"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-white/60 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white focus:dark:bg-gray-800 transition-all text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 shadow-sm hover:shadow-md"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-[16px] bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-lg shadow-lg hover:shadow-green-400/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </span>
              ) : (
                "เข้าสู่ระบบ"
              )}
            </motion.button>
          </form>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
            >
              สมัครสมาชิกสำหรับตัวแทนนักเรียน
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
            ระบบจัดการสิ่งแวดล้อมโรงเรียนสา · จังหวัดน่าน
          </p>
        </div>
      </div>
    </motion.div>
  );
}
