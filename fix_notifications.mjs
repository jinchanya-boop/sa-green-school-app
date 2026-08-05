import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Fixing action_url for student council notifications...");
  
  const { data, error } = await supabase
    .from('notifications')
    .update({ action_url: '/area-evaluation' })
    .eq('action_url', '/area-evaluation/approvals')
    .eq('title', 'มีพื้นที่รับผิดชอบรอประเมินคะแนน');

  if (error) {
    console.error("Error fixing notifications:", error);
  } else {
    console.log("Successfully fixed notifications!");
  }
}

run();
