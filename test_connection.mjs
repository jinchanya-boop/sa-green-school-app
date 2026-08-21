// Test Service Role Key specifically
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data, error } = await supabase.from("academic_years").select("id, year").limit(3);
if (error) {
  console.log("❌ Service role key error:", error.message);
} else {
  console.log("✅ Service role key works! Records:", data.length, "| Sample:", JSON.stringify(data));
}
