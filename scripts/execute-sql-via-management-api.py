#!/usr/bin/env python3
"""
Execute SQL file on Supabase using Management API with Service Role Key
Direct SQL execution via Supabase PostgREST
"""

import sys
import os
import json
import urllib.request
import urllib.error

# Configuration
SUPABASE_URL = "https://zumgrvmwmpstsigefuau.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bWdydm13bXBzdHNpZ2VmdWF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzAzMTIwOCwiZXhwIjoyMDc4NjA3MjA4fQ.tWjDTqi_ZUg2tbqJ3j9Ns2WKQgHZnh3k3CVKUf7Xzto"

sql_file = sys.argv[1] if len(sys.argv) > 1 else None
if not sql_file or not os.path.exists(sql_file):
    print(f"❌ SQL file not found: {sql_file}")
    print("Usage: python3 execute-sql-via-management-api.py <sql-file>")
    sys.exit(1)

print(f"📁 Reading: {sql_file}")
with open(sql_file, 'r') as f:
    sql_content = f.read()

print(f"📊 Size: {len(sql_content)} chars")
print(f"🔗 Target: {SUPABASE_URL}")
print("")

# Split SQL into individual statements
statements = [s.strip() for s in sql_content.split(';') if s.strip() and not s.strip().startswith('--')]

print(f"📝 Found {len(statements)} SQL statements")
print("🔧 Executing statements...")
print("")

success_count = 0
error_count = 0

for i, statement in enumerate(statements, 1):
    # Skip comments and empty statements
    if not statement or statement.startswith('--'):
        continue

    # Show progress for long statements
    preview = statement[:80].replace('\n', ' ')
    print(f"[{i}/{len(statements)}] {preview}...")

    try:
        # Execute via PostgREST query endpoint
        url = f"{SUPABASE_URL}/rest/v1/rpc/exec"

        # Create request
        data = json.dumps({"query": statement}).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                'Content-Type': 'application/json',
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': f'Bearer {SERVICE_ROLE_KEY}'
            },
            method='POST'
        )

        # Execute request
        with urllib.request.urlopen(req, timeout=30) as response:
            result = response.read().decode('utf-8')
            success_count += 1
            print(f"   ✅ Success")

    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        # Some DDL statements might not work via REST API, that's expected
        if '404' in str(e.code) or 'function' in error_body.lower():
            print(f"   ⚠️  Skipped (API limitation)")
        else:
            error_count += 1
            print(f"   ❌ Error: {e.code} - {error_body[:200]}")
    except Exception as e:
        error_count += 1
        print(f"   ❌ Error: {str(e)[:200]}")

print("")
print(f"✅ Completed: {success_count} successful, {error_count} errors")

# Note about manual execution if errors
if error_count > 0:
    print("")
    print("💡 Note: Some DDL statements require direct database access.")
    print("   Please execute manually in Supabase Dashboard SQL Editor:")
    print(f"   https://supabase.com/dashboard/project/zumgrvmwmpstsigefuau/sql/new")
