import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { NatureBackground } from "@/components/auth/nature-background";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ | โรงเรียนสา",
  description: "เข้าสู่ระบบจัดการสิ่งแวดล้อมโรงเรียนสา",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-green-50 to-emerald-100/50">
      <NatureBackground />

      <div className="w-full max-w-md mx-auto px-4">
        <LoginForm />
      </div>
    </main>
  );
}
