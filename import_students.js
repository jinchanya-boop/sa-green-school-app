require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const xlsx = require('xlsx');
const fs = require('fs');

async function importStudents() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Reading Excel file...');
  const wb = xlsx.readFile('student69.xlsx');
  const sheetName = wb.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]);

  console.log(`Found ${data.length} records. Fetching homerooms...`);

  // Fetch homerooms to map classroom name to homeroom_id
  const { data: homerooms, error: homeroomError } = await supabase
    .from('homerooms')
    .select('id, class_name');

  if (homeroomError) {
    console.error('Error fetching homerooms:', homeroomError);
    return;
  }

  const homeroomMap = {};
  for (const hr of homerooms) {
    // Normalize classroom name e.g., "ม.1/1" -> "ม.1/1"
    homeroomMap[hr.class_name.trim()] = hr.id;
  }

  const { data: existingStudents, error: existError } = await supabase
    .from('students')
    .select('national_id');

  if (existError) {
    console.error('Error fetching existing students:', existError);
    return;
  }

  const existingIds = new Set(existingStudents.map(s => s.national_id));

  const studentsToInsert = [];

  for (const row of data) {
    const studentId = row['StudentID']?.toString();
    const number = row['Number']?.toString();
    const name = row['Name']?.trim();
    const classroom = row['Classroom']?.trim();

    if (!name || !classroom) continue;

    const homeroom_id = homeroomMap[classroom];
    if (!homeroom_id) {
      console.warn(`Homeroom not found for class: ${classroom}. Skipping ${name}.`);
      continue;
    }

    if (existingIds.has(studentId)) {
      // Skip if student already exists
      continue;
    }

    // Parse prefix, first name, last name
    let prefix = 'เด็กชาย';
    let gender = 'male';
    if (name.startsWith('เด็กหญิง')) { prefix = 'เด็กหญิง'; gender = 'female'; }
    else if (name.startsWith('นางสาว')) { prefix = 'นางสาว'; gender = 'female'; }
    else if (name.startsWith('นาย')) { prefix = 'นาย'; gender = 'male'; }
    else if (name.startsWith('เด็กชาย')) { prefix = 'เด็กชาย'; gender = 'male'; }

    let nameWithoutPrefix = name.replace(prefix, '').trim();
    // Some prefixes might not have spaces after them, already handled by replace
    
    // Split into first name and last name based on space
    const parts = nameWithoutPrefix.split(/\s+/);
    const first_name = parts[0];
    const last_name = parts.slice(1).join(' ') || '-';

    studentsToInsert.push({
      national_id: studentId, // Using national_id for the 5-digit Student ID based on current UI mapping
      student_number: number, // Using student_number for running number (เลขที่)
      prefix,
      first_name,
      last_name,
      gender,
      homeroom_id,
      is_active: true
    });
  }

  console.log(`Preparing to insert ${studentsToInsert.length} students...`);

  if (studentsToInsert.length > 0) {
    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < studentsToInsert.length; i += batchSize) {
      const batch = studentsToInsert.slice(i, i + batchSize);
      const { error } = await supabase.from('students').insert(batch);
      if (error) {
        console.error(`Error inserting batch ${i}:`, error.message);
      } else {
        console.log(`Successfully inserted batch ${i} to ${i + batch.length}`);
      }
    }
  }

  console.log('Done!');
}

importStudents();
