require('dotenv').config({path: '.env.local'});
const {createClient} = require('@supabase/supabase-js');
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // For the latest eval that has photos in storage but not in DB
  const evalId = '3559fe68-c1eb-47e0-8b19-f99394196b43';
  
  const files = [
    { name: 'class_rep_photo1_1783251714145.png', mime: 'image/png', size: 126996 },
    { name: 'class_rep_photo2_1783251714148.jpg', mime: 'image/jpeg', size: 182158 },
  ];
  
  for (const file of files) {
    const filePath = evalId + '/' + file.name;
    const url = admin.storage.from('evaluation-photos').getPublicUrl(filePath).data.publicUrl;
    
    const {data, error} = await admin.from('evaluation_photos').insert({
      evaluation_id: evalId,
      evaluation_type: 'area',
      storage_path: filePath,
      public_url: url,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.mime,
      photo_category: 'other',
      uploaded_by: 'cd3851d3-8ebc-4417-850e-49968d5ef192'
    });
    
    console.log(file.name + ':', error ? 'FAIL: ' + error.message : 'OK ✓');
  }
  
  // Verify
  const {data: photos} = await admin.from('evaluation_photos').select('id, public_url, photo_category').eq('evaluation_id', evalId);
  console.log('\nPhotos in DB:', JSON.stringify(photos, null, 2));
}

run().catch(console.error);
