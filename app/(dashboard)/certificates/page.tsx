import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CertificatesView } from "@/components/certificates/certificates-view";

export const metadata: Metadata = {
  title: "เกียรติบัตร",
  description: "ดูและดาวน์โหลดเกียรติบัตรด้านสิ่งแวดล้อม",
};

export default async function CertificatesPage() {
  const supabase = await createClient();

  const { data: certificates } = await supabase
    .from("certificates")
    .select(`
      *,
      homeroom:homerooms(class_name, grade_level),
      issuer:profiles!certificates_issued_by_fkey(full_name)
    `)
    .eq("is_revoked", false)
    .order("issued_at", { ascending: false });

  return <CertificatesView certificates={certificates ?? []} />;
}
