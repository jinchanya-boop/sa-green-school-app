import type { Metadata } from "next";
import { TemplatesManager } from "@/components/certificate-center/templates-manager";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const metadata: Metadata = {
  title: "จัดการแม่แบบเกียรติบัตร - Certificate Center",
};

export default async function CertificateTemplatesPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createAdminClient(supabaseUrl!, supabaseKey!);

  const { data: templates } = await supabase
    .from("cert_center_templates")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <TemplatesManager initialTemplates={templates || []} />
    </div>
  );
}
