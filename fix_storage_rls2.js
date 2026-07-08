require('dotenv').config({path: '.env.local'});

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const sqls = [
    `DROP POLICY IF EXISTS "storage_eval_photos_insert_auth" ON storage.objects`,
    `DROP POLICY IF EXISTS "storage_eval_photos_select_all" ON storage.objects`,
    `DROP POLICY IF EXISTS "storage_eval_photos_read" ON storage.objects`,
    `DROP POLICY IF EXISTS "storage_eval_photos_insert" ON storage.objects`,
    `DROP POLICY IF EXISTS "storage_eval_photos_delete" ON storage.objects`,
    `CREATE POLICY "eval_photos_read_all" ON storage.objects FOR SELECT USING (bucket_id = 'evaluation-photos')`,
    `CREATE POLICY "eval_photos_insert_auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'evaluation-photos')`,
    `CREATE POLICY "eval_photos_delete_auth" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'evaluation-photos')`,
  ];

  for (const sql of sqls) {
    const r = await fetch(`${url}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'apikey': key,
        'Prefer': 'params=single-object',
      },
      body: JSON.stringify({ query: sql })
    });
    
    // Use the Supabase management API instead
    const mgmtUrl = url.replace('.supabase.co', '.supabase.co');
    // Try using postgres REST directly
    const pgRes = await fetch(`${url}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'apikey': key,
      },
      body: JSON.stringify({ sql })
    });
    const pgJson = await pgRes.json().catch(() => ({}));
    console.log(`${sql.substring(0,60)}`);
    console.log('Status:', pgRes.status, JSON.stringify(pgJson).substring(0,100));
    console.log('---');
  }
}

run().catch(console.error);
