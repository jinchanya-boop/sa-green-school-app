const fs = require('fs');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error("No DATABASE_URL found in .env.local");
    return;
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to database.");

    // Run 005
    const sql5 = fs.readFileSync('supabase/migrations/005_certificate_center.sql', 'utf8');
    await client.query(sql5);
    console.log("Successfully ran 005_certificate_center.sql");

    // Run 006
    const sql6 = fs.readFileSync('supabase/migrations/006_certificate_storage.sql', 'utf8');
    await client.query(sql6);
    console.log("Successfully ran 006_certificate_storage.sql");

  } catch (err) {
    console.error("Migration Error:", err);
  } finally {
    await client.end();
  }
}

run();
