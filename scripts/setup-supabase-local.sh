#!/bin/bash
# Setup Local Supabase Environment
# Usage: ./scripts/setup-supabase-local.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SUPABASE_DIR="$PROJECT_ROOT/supabase"

echo "🚀 Setting up local Supabase environment..."

# Check if Docker is running
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if docker-compose exists
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo "❌ docker-compose is not installed."
    exit 1
fi

echo "📦 Starting Supabase services..."
cd "$PROJECT_ROOT"
$COMPOSE_CMD up -d

echo "⏳ Waiting for database to be ready..."
sleep 5

# Check if database is ready
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if docker exec well-supabase-db pg_isready -U postgres &> /dev/null; then
        echo "✅ Database is ready!"
        break
    fi
    attempt=$((attempt + 1))
    echo "   Waiting for database... ($attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Database failed to start. Check logs with: docker-compose logs db"
    exit 1
fi

echo ""
echo "🎉 Supabase local environment is running!"
echo ""
echo "📍 Endpoints:"
echo "   - Database:   localhost:54322 (postgres:postgres)"
echo "   - Auth API:   localhost:9999"
echo "   - REST API:   localhost:54323"
echo "   - Storage:    localhost:54324"
echo "   - MailHog UI: localhost:8025"
echo ""
echo "🔧 Next steps:"
echo "   1. Run migrations: supabase db push"
echo "   2. Start edge functions: supabase functions serve"
echo "   3. Run tests: pnpm vitest run supabase/functions/__tests__"
echo ""
