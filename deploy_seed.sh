#!/bin/bash

# SEED Phase Deployment Script
# Usage: ./deploy_seed.sh <project-ref>

PROJECT_REF=$1

if [ -z "$PROJECT_REF" ]; then
  echo "⚠️  No Project Ref provided as argument."
  echo "Please enter your Supabase Project Reference (e.g., abcdefghijklmno):"
  read -r PROJECT_REF
  
  if [ -z "$PROJECT_REF" ]; then
    echo "Error: Project Ref is required."
    exit 1
  fi
fi

echo "🚀 Starting SEED Phase Deployment for Project: $PROJECT_REF"

# 1. Link Project
echo "🔗 Linking Supabase Project..."
npx supabase link --project-ref "$PROJECT_REF"

# 2. Database Migration
echo "📦 Applying Database Migrations..."
# We explicitly push the migration for scalable architecture
npx supabase db push

# 3. Set Secrets (Interactive or Placeholder)
echo "🔑 Configuring Secrets for Edge Functions..."
echo "Please enter the SUPABASE_URL (Production):"
read -r PROD_SUPABASE_URL
echo "Please enter the SUPABASE_SERVICE_ROLE_KEY (Production):"
read -r PROD_SERVICE_ROLE_KEY

npx supabase secrets set --project-ref "$PROJECT_REF" \
  SUPABASE_URL="$PROD_SUPABASE_URL" \
  SUPABASE_SERVICE_ROLE_KEY="$PROD_SERVICE_ROLE_KEY"

# 4. Deploy Edge Function
echo "⚡ Deploying 'agent-worker' Edge Function..."
npx supabase functions deploy agent-worker --project-ref "$PROJECT_REF" --no-verify-jwt

echo "⚡ Deploying 'agent-reward' Edge Function..."
npx supabase functions deploy agent-reward --project-ref "$PROJECT_REF" --no-verify-jwt

echo "✅ Deployment Complete!"
echo "Next Steps:"
echo "1. Go to Supabase Dashboard -> Database -> Extensions and enable 'pg_cron'."
echo "2. Run the SQL snippet from DEPLOYMENT_PLAN_SEED.md to schedule the worker heartbeat."
