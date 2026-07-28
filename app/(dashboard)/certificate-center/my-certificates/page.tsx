import { createClient as createAdminClient } from "@supabase/supabase-js";
import { MyCertificatesClient } from "@/components/certificate-center/my-certificates-client";

export const metadata = {
  title: "เกียรติบัตรของฉัน | โรงเรียนสา",
};

export const dynamic = 'force-dynamic';

export default async function MyCertificatesPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createAdminClient(supabaseUrl!, supabaseKey!);

  // Fetch all issued certificates (In real app, filter by student_id)
  const { data: certificates, error } = await supabase
    .from("cert_center_issued")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <MyCertificatesClient initialCertificates={certificates || []} />
  );
}
