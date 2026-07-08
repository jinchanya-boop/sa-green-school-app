require('dotenv').config({path: '.env.local'});
const {createClient} = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const sql = 'DROP POLICY IF EXISTS "rls_area_items_write" ON area_evaluation_items; CREATE POLICY "rls_area_items_write" ON area_evaluation_items FOR ALL USING (EXISTS (SELECT 1 FROM area_evaluations ae WHERE ae.id = area_evaluation_items.area_evaluation_id AND (ae.evaluator_id = auth.uid() OR ae.reporter_id = auth.uid() OR fn_is_admin())));';
  const { data, error } = await s.rpc('execute_sql', { sql });
  console.log(data, error);
}
run();
