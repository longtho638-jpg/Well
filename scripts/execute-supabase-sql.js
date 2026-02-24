#!/usr/bin/env node

/**
 * Execute SQL file on Supabase using service role key
 * Usage: node scripts/execute-supabase-sql.js <sql-file-path>
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://zumgrvmwmpstsigefuau.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('Set it with: export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  process.exit(1);
}

const sqlFilePath = process.argv[2];
if (!sqlFilePath) {
  console.error('ERROR: SQL file path is required');
  console.error('Usage: node scripts/execute-supabase-sql.js <sql-file-path>');
  process.exit(1);
}

if (!fs.existsSync(sqlFilePath)) {
  console.error(`ERROR: SQL file not found: ${sqlFilePath}`);
  process.exit(1);
}

const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

console.log(`📁 Reading SQL file: ${sqlFilePath}`);
console.log(`📊 SQL content size: ${sqlContent.length} characters`);
console.log(`🔗 Target: ${SUPABASE_URL}`);
console.log('');

// Execute SQL via Supabase REST API
async function executeSql() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sqlContent })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ SQL execution successful!');
    console.log('');
    console.log('Response:', JSON.stringify(result, null, 2));
    return result;

  } catch (error) {
    console.error('❌ SQL execution failed:');
    console.error(error.message);
    process.exit(1);
  }
}

executeSql();
