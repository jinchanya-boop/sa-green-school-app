import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function run() {
  const sql = `
    SELECT
      c.relname AS table_name,
      c.relrowsecurity AS rls_enabled
    FROM
      pg_class c
    JOIN
      pg_namespace n ON n.oid = c.relnamespace
    WHERE
      n.nspname = 'public'
      AND c.relkind = 'r'
    ORDER BY
      c.relname;
  `;
  const { data, error } = await supabase.rpc('execute_sql', { sql });
  if (error) {
    console.error("Error checking RLS:", error);
  } else {
    const disabled = data.filter(t => !t.rls_enabled);
    console.log("Tables with RLS Disabled:");
    console.table(disabled);
  }
}
run();
