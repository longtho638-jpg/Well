import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Configuration from .env.local
const SUPABASE_URL = 'https://jcbahdioqoepvoliplqy.supabase.co';
const SERVICE_ROLE_KEY = process.argv[3] || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: SERVICE_ROLE_KEY required');
  console.error('Usage: node scripts/execute-supabase-sql-via-client.js <sql-file> <service-role-key>');
  process.exit(1);
}

const sqlFilePath = process.argv[2];
if (!sqlFilePath) {
  console.error('❌ ERROR: SQL file path required');
  console.error('Usage: node scripts/execute-supabase-sql-via-client.js <sql-file> <service-role-key>');
  process.exit(1);
}

if (!fs.existsSync(sqlFilePath)) {
  console.error(`❌ ERROR: File not found: ${sqlFilePath}`);
  process.exit(1);
}

const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

console.log(`📁 SQL file: ${path.basename(sqlFilePath)}`);
console.log(`📊 Size: ${sqlContent.length} chars`);
console.log(`🔗 Target: ${SUPABASE_URL}`);
console.log('');

async function executeSql() {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('🔧 Executing SQL via Supabase client...');

    // Use RPC to execute raw SQL (requires a custom function or use query builder)
    // For DDL, we'll use the REST API directly
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ sql: sqlContent })
    });

    if (!response.ok) {
      const errorText = await response.text();
       // If exec_sql doesn't exist, try query
       if (response.status === 404) {
         console.log("exec_sql not found, trying 'query' rpc...");
          const response2 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({ query: sqlContent })
          });
           if (!response2.ok) {
               const errorText2 = await response2.text();
               throw new Error(`HTTP ${response2.status}: ${errorText2}`);
           }
            const result = await response2.json();
            console.log('✅ SQL execution successful (via query)!');
            return;
       }
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ SQL execution successful!');
    console.log('');
    if (result && Object.keys(result).length > 0) {
      console.log('Response:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Execution failed:', error.message);
    process.exit(1);
  }
}

executeSql();
