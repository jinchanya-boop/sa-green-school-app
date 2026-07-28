import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CertificatesView } from "@/components/certificates/certificates-view";

export const metadata: Metadata = {
  title: "เกียรติบัตร",
  description: "ดูและดาวน์โหลดเกียรติบัตรด้านสิ่งแวดล้อม",
};

export const dynamic = 'force-dynamic';

export default async function CertificatesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, homeroom_id")
    .eq("id", user?.id)
    .single();

  const isGlobalRole = profile?.role === "admin" || profile?.role === "executive";

  const { data: certificates } = await supabase
    .from("certificates")
    .select(`
      *,
      homeroom:homerooms(class_name, grade_level),
      issuer:profiles!certificates_issued_by_fkey(full_name)
    `)
    .eq("is_revoked", false)
    .order("issued_at", { ascending: false });

  // Fetch certificates from the new system
  let certQuery = supabase
    .from("cert_center_issued")
    .select("*")
    .order("created_at", { ascending: false });

  // If not admin/executive, only show certificates for their homeroom
  if (!isGlobalRole && profile?.homeroom_id) {
    certQuery = certQuery.eq("homeroom_id", profile.homeroom_id);
  } else if (!isGlobalRole && !profile?.homeroom_id) {
    // If they have no homeroom and aren't admin, they shouldn't see any class certificates
    certQuery = certQuery.eq("homeroom_id", "00000000-0000-0000-0000-000000000000"); // Dummy ID to return none
  }

  const { data: certCenterCerts } = await certQuery;

  return <CertificatesView certificates={certificates ?? []} certCenterCerts={certCenterCerts ?? []} />;
}
