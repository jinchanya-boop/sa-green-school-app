require('dotenv').config({path: '.env.local'});
const {createClient} = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // Drop old policies then create new ones
  const sqls = [
    `DROP POLICY IF EXISTS "storage_eval_photos_insert_auth" ON storage.objects`,
    `DROP POLICY IF EXISTS "storage_eval_photos_select_all" ON storage.objects`,
    `DROP POLICY IF EXISTS "storage_eval_photos_read" ON storage.objects`,
    `DROP POLICY IF EXISTS "storage_eval_photos_insert" ON storage.objects`,
    `CREATE POLICY "storage_eval_photos_select_all" ON storage.objects FOR SELECT USING (bucket_id = 'evaluation-photos')`,
    `CREATE POLICY "storage_eval_photos_insert_auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'evaluation-photos')`,
  ];

  for (const sql of sqls) {
    const { error } = await s.rpc('pgexec', { query: sql });
    if (error) {
      // Try alternative
      console.log('RPC pgexec failed, trying direct query...');
      const r2 = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/pgexec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({ query: sql })
      });
      const r2json = await r2.json();
      console.log(`SQL: ${sql.substring(0,60)}...`);
      console.log('Result:', r2json);
    } else {
      console.log(`OK: ${sql.substring(0,60)}...`);
    }
  }
}

run().catch(console.error);
