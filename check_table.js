const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('cert_center_templates').select('id').limit(1);
  if (error) {
    console.log("Table 'cert_center_templates' does NOT exist or error:", error.message);
  } else {
    console.log("Table 'cert_center_templates' exists!");
  }
}

run();
