#!/usr/bin/env python3
"""
Execute SQL file on Supabase PostgreSQL database
Uses psycopg2 for direct PostgreSQL connection
"""

import sys
import os

try:
    import psycopg2
except ImportError:
    print("❌ psycopg2 not installed")
    print("Install: pip3 install psycopg2-binary")
    sys.exit(1)

# Database configuration - Use connection pooler port 6543 (Transaction Mode)
DB_CONFIG = {
    'host': 'aws-0-ap-southeast-1.pooler.supabase.com',
    'port': 6543,
    'database': 'postgres',
    'user': 'postgres.zumgrvmwmpstsigefuau',
    'password': 'gz0t2vZvoSINAltJ',
    'sslmode': 'require'
}

sql_file = sys.argv[1] if len(sys.argv) > 1 else None
if not sql_file or not os.path.exists(sql_file):
    print(f"❌ SQL file not found: {sql_file}")
    print("Usage: python3 execute-sql-with-psycopg2.py <sql-file>")
    sys.exit(1)

print(f"📁 Reading: {sql_file}")
with open(sql_file, 'r') as f:
    sql_content = f.read()

print(f"📊 Size: {len(sql_content)} chars")
print(f"🔗 Connecting to: {DB_CONFIG['host']}:{DB_CONFIG['port']}")
print("")

try:
    # Connect to database
    conn = psycopg2.connect(**DB_CONFIG)
    conn.set_session(autocommit=False)
    cursor = conn.cursor()

    print("✅ Connected successfully")
    print("🔧 Executing SQL...")
    print("")

    # Execute SQL
    cursor.execute(sql_content)
    conn.commit()

    print("✅ SQL execution completed!")
    print("")

    # Verify functions created
    cursor.execute("""
        SELECT proname FROM pg_proc
        WHERE proname IN (
            'get_downline_tree',
            'distribute_commissions',
            'trigger_commission_on_order',
            'create_withdrawal_request',
            'process_withdrawal_request'
        )
    """)
    functions = cursor.fetchall()
    print(f"✅ Functions created: {len(functions)}")
    for func in functions:
        print(f"   - {func[0]}")
    print("")

    # Verify tables
    cursor.execute("""
        SELECT table_name FROM information_schema.tables
        WHERE table_name = 'withdrawal_requests'
    """)
    tables = cursor.fetchall()
    print(f"✅ Tables created: {len(tables)}")
    for table in tables:
        print(f"   - {table[0]}")
    print("")

    # Verify triggers
    cursor.execute("""
        SELECT tgname FROM pg_trigger
        WHERE tgname = 'order_completion_trigger'
    """)
    triggers = cursor.fetchall()
    print(f"✅ Triggers created: {len(triggers)}")
    for trigger in triggers:
        print(f"   - {trigger[0]}")

    cursor.close()
    conn.close()

except psycopg2.Error as e:
    print(f"❌ Database error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    sys.exit(1)
