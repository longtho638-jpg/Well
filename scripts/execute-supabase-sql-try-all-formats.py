#!/usr/bin/env python3
"""
Execute SQL on Supabase PostgreSQL - Direct connection with URI
Tests multiple connection formats to find working one
"""

import sys
import os

try:
    import psycopg2
except ImportError:
    print("❌ psycopg2 not installed")
    sys.exit(1)

sql_file = sys.argv[1] if len(sys.argv) > 1 else None
if not sql_file or not os.path.exists(sql_file):
    print(f"❌ SQL file required")
    sys.exit(1)

with open(sql_file, 'r') as f:
    sql_content = f.read()

print(f"📁 File: {os.path.basename(sql_file)}")
print(f"📊 Size: {len(sql_content)} chars")
print("")

# Try multiple connection formats
connection_strings = [
    # Format 1: Connection pooler with full URI
    "postgresql://postgres.zumgrvmwmpstsigefuau:gz0t2vZvoSINAltJ@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require",

    # Format 2: Try without prefix in username
    "postgresql://postgres:gz0t2vZvoSINAltJ@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require",

    # Format 3: Session mode pooler
    "postgresql://postgres.zumgrvmwmpstsigefuau:gz0t2vZvoSINAltJ@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require",

    # Format 4: Try db hostname (if it resolves)
    "postgresql://postgres:gz0t2vZvoSINAltJ@db.zumgrvmwmpstsigefuau.supabase.co:5432/postgres?sslmode=require",
]

for i, conn_str in enumerate(connection_strings, 1):
    try:
        # Hide password in output
        display_str = conn_str.replace('gz0t2vZvoSINAltJ', '***')
        print(f"🔧 Attempt {i}/4: {display_str[:80]}...")

        conn = psycopg2.connect(conn_str)
        conn.set_session(autocommit=False)
        cursor = conn.cursor()

        print("   ✅ Connected!")
        print("")
        print("🚀 Executing SQL...")

        cursor.execute(sql_content)
        conn.commit()

        print("✅ SQL executed successfully!")
        print("")

        # Verify
        cursor.execute("""
            SELECT proname FROM pg_proc
            WHERE proname IN ('get_downline_tree', 'distribute_commissions',
                             'trigger_commission_on_order', 'create_withdrawal_request',
                             'process_withdrawal_request')
        """)
        functions = cursor.fetchall()
        print(f"✅ Functions: {len(functions)}")
        for func in functions:
            print(f"   - {func[0]}")

        cursor.execute("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'withdrawal_requests'
        """)
        tables = cursor.fetchall()
        print(f"✅ Tables: {len(tables)}")
        for table in tables:
            print(f"   - {table[0]}")

        cursor.execute("""
            SELECT tgname FROM pg_trigger WHERE tgname = 'order_completion_trigger'
        """)
        triggers = cursor.fetchall()
        print(f"✅ Triggers: {len(triggers)}")
        for trigger in triggers:
            print(f"   - {trigger[0]}")

        cursor.close()
        conn.close()
        sys.exit(0)

    except psycopg2.Error as e:
        print(f"   ❌ Failed: {str(e)[:100]}")
        print("")
        continue
    except Exception as e:
        print(f"   ❌ Error: {str(e)[:100]}")
        print("")
        continue

print("❌ All connection attempts failed")
print("💡 Please execute manually in Supabase Dashboard SQL Editor")
sys.exit(1)
