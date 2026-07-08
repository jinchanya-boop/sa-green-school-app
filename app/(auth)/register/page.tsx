import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "สมัครสมาชิกสำหรับตัวแทนนักเรียน | โรงเรียนสา",
  description: "สมัครสมาชิกสำหรับตัวแทนห้องและสภานักเรียน",
};

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data: homerooms } = await supabase.from("homerooms").select("*, rooms(name, building_id)").eq("is_active", true).order("class_name");

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden py-12">
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
        <RegisterForm homerooms={homerooms || []} />
      </div>
    </main>
  );
}
