#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   TaskBoard - Kanban Task Manager - Task 3       ║"
echo "║   Setup & Start Script                           ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required. Install from https://nodejs.org"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required."; exit 1; }

echo "✅ Prerequisites OK"
echo ""

echo "🐳 Starting PostgreSQL and Redis..."
docker-compose up -d
echo "⏳ Waiting for services..."
sleep 5
echo "✅ Docker services running"
echo ""

echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

echo "🗄️  Setting up database..."
cd apps/api
npx prisma generate
npx prisma migrate dev --name init --skip-seed
npx tsx src/db/seed.ts
cd ../..
echo "✅ Database seeded with sample data"
echo ""

echo "════════════════════════════════════════════════════"
echo "🚀 Starting servers..."
echo ""
echo "  API      → http://localhost:3001"
echo "  Web      → http://localhost:3000"
echo "  Health   → http://localhost:3001/health"
echo ""
echo "  Default board has 12 tickets across 5 columns"
echo "  Press Ctrl+C to stop"
echo "════════════════════════════════════════════════════"
echo ""

npm run dev
