require('dotenv').config({path: '.env.local'});
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect();
client.query("ALTER TABLE students ADD COLUMN assigned_role TEXT DEFAULT 'student'", (err, res) => {
  if (err) console.error(err);
  else console.log('Column added');
  client.end();
});
