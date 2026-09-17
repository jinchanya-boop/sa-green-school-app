import { config } from "dotenv";
config({ path: ".env.local" });

async function run() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`;
  const res = await fetch(url, {
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
  
  if (!res.ok) {
    console.error("Failed to fetch:", res.status, await res.text());
    return;
  }
  
  const spec = await res.json();
  const tables = Object.keys(spec.definitions);
  console.log("Tables in OpenAPI Spec:");
  console.log(tables);
}

run();
