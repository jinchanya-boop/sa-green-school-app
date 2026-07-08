require('dotenv').config({path: '.env.local'});
const {createClient} = require('@supabase/supabase-js');
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const sql = `SELECT policyname, cmd FROM pg_policies WHERE tablename = 'evaluation_photos';`;
  const {data, error} = await admin.rpc('exec_sql', {sql});
  console.log(data || error);
}

run().catch(console.error);
