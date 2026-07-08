require('dotenv').config({path: '.env.local'});
const {createClient} = require('@supabase/supabase-js');

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'storage' } }
);

async function run() {
  // Use the postgres schema directly
  const { createClient: createPGClient } = require('@supabase/supabase-js');
  const pg = createPGClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Use rpc with service_role - try execute_sql function
  const sqls = [
    `DROP POLICY IF EXISTS "storage_eval_photos_read" ON storage.objects`,
    `DROP POLICY IF EXISTS "storage_eval_photos_insert" ON storage.objects`,
    `DROP POLICY IF EXISTS "eval_photos_read_all" ON storage.objects`,
    `DROP POLICY IF EXISTS "eval_photos_insert_auth" ON storage.objects`,
    `CREATE POLICY "eval_photos_read_all" ON storage.objects FOR SELECT USING (bucket_id = 'evaluation-photos')`,
    `CREATE POLICY "eval_photos_insert_auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'evaluation-photos')`,
  ];

  for (const sql of sqls) {
    try {
      const { data, error } = await pg.rpc('execute_sql', { sql_query: sql });
      if (error) {
        console.log(`FAIL [${sql.substring(0,50)}]:`, error.message);
      } else {
        console.log(`OK [${sql.substring(0,50)}]`);
      }
    } catch(e) {
      console.log(`EXCEPTION [${sql.substring(0,50)}]:`, e.message);
    }
  }
}

run().catch(console.error);
