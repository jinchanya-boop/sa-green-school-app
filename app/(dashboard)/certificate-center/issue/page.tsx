import type { Metadata } from "next";
import { IssueCertificateWizard } from "@/components/certificate-center/issue-wizard";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const metadata: Metadata = {
  title: "ออกเกียรติบัตร - Certificate Center",
};

export default async function IssueCertificatePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createAdminClient(supabaseUrl!, supabaseKey!);

  const { data: templates } = await supabase
    .from("cert_center_templates")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="py-4">
      <IssueCertificateWizard initialTemplates={templates || []} />
    </div>
  );
}
