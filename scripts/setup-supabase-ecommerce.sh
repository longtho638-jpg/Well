#!/bin/bash
# Execute Supabase SQL Setup Script
# This script runs the e-commerce setup SQL against your Supabase project

set -e  # Exit on error

SQL_FILE="docs/supabase-ecommerce-setup.sql"
ENV_FILE=".env.local"

echo "🚀 Supabase E-Commerce Setup Script"
echo "===================================="
echo ""

# Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Error: SQL file not found at $SQL_FILE"
    exit 1
fi

echo "✅ Found SQL file: $SQL_FILE"
echo ""

# Check for Supabase credentials
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
fi

if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "⚠️  Supabase credentials not found in .env.local"
    echo ""
    echo "📋 MANUAL SETUP REQUIRED:"
    echo ""
    echo "Since Supabase credentials are not configured yet, please follow these steps:"
    echo ""
    echo "1. Go to your Supabase Dashboard: https://supabase.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to SQL Editor (left sidebar)"
    echo "4. Click 'New query'"
    echo "5. Copy the entire contents of: $SQL_FILE"
    echo "6. Paste into the SQL Editor"
    echo "7. Click 'Run' or press Ctrl+Enter"
    echo ""
    echo "Alternative: Use psql directly"
    echo "-----------------------------"
    echo "If you have your database connection string:"
    echo ""
    echo "  psql 'postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres' -f $SQL_FILE"
    echo ""
    echo "Replace [PASSWORD] and [HOST] with your Supabase project details"
    echo "(Found in: Settings > Database > Connection string)"
    echo ""
    exit 1
fi

# Extract project ref from URL
PROJECT_URL="$VITE_SUPABASE_URL"
PROJECT_REF=$(echo "$PROJECT_URL" | sed -E 's|https://([^.]+)\.supabase\.co|\1|')

echo "📍 Project: $PROJECT_REF"
echo ""

# Check if supabase CLI is linked
if [ ! -f "supabase/.temp/project-ref" ]; then
    echo "🔗 Linking to Supabase project..."
    echo ""
    echo "You'll need to enter your database password."
    echo "(Found in: Settings > Database > Database password)"
    echo ""

    supabase link --project-ref "$PROJECT_REF"

    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Failed to link project"
        echo ""
        echo "Try manual linking:"
        echo "  supabase link --project-ref $PROJECT_REF"
        exit 1
    fi
fi

echo ""
echo "📤 Pushing SQL to remote database..."
echo ""

# Use supabase db push with the SQL file
# Note: We need to create a migration file first
TIMESTAMP=$(date +%Y%m%d%H%M%S)
MIGRATION_DIR="supabase/migrations"
MIGRATION_FILE="$MIGRATION_DIR/${TIMESTAMP}_ecommerce_setup.sql"

# Create migrations directory if it doesn't exist
mkdir -p "$MIGRATION_DIR"

# Copy SQL file to migrations
cp "$SQL_FILE" "$MIGRATION_FILE"

echo "Created migration: $MIGRATION_FILE"
echo ""

# Push to database
supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SQL setup completed successfully!"
    echo ""
    echo "🧪 Verify with these queries:"
    echo ""
    echo "  SELECT * FROM pg_proc WHERE proname = 'get_downline_tree';"
    echo "  SELECT * FROM pg_trigger WHERE tgname = 'order_completion_trigger';"
    echo "  SELECT * FROM withdrawal_requests LIMIT 1;"
    echo ""
else
    echo ""
    echo "❌ SQL execution failed"
    echo ""
    echo "Please check the error messages above and try again."
    exit 1
fi
