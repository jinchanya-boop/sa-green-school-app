import type { Metadata } from "next";
import { CertificateCenterDashboard } from "@/components/certificate-center/dashboard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "ศูนย์เกียรติบัตร (Certificate Center) - Sa Green School",
  description: "จัดการและออกเกียรติบัตรออนไลน์",
};

export default async function CertificateCenterPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let role = "guest";
  const isDev = process.env.NODE_ENV === "development";

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile) role = profile.role;
    if (isDev && profile) role = "administrator";
  } else if (isDev) {
    role = "administrator";
  }

  return <CertificateCenterDashboard userRole={role} />;
}
