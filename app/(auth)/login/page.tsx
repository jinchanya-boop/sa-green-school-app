import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ | โรงเรียนสา",
  description: "เข้าสู่ระบบจัดการสิ่งแวดล้อมโรงเรียนสา",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(22,163,74,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(37,99,235,0.1) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(16,185,129,0.1) 0%, transparent 50%)",
          backgroundColor: "hsl(120, 20%, 98%)",
        }}
      />

      {/* Decorative circles */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-green-200/30 rounded-full blur-3xl -z-10 dark:bg-green-900/20" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl -z-10 dark:bg-blue-900/10" />

      <div className="w-full max-w-md mx-auto px-4">
        <LoginForm />
      </div>
    </main>
  );
}
