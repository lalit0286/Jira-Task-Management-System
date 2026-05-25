# Task 3 — Setup Guide

## One-command start (recommended)
```bash
./START.sh
```

## Manual steps

### 1. Start infrastructure
```bash
docker-compose up -d
```

### 2. Install packages
```bash
npm install
```

### 3. Set up backend database
```bash
cd apps/api
cp .env.example .env          # or use the .env already present
npx prisma generate
npx prisma migrate dev --name init
npx tsx src/db/seed.ts
cd ../..
```

### 4. Start both servers
```bash
npm run dev
```

## URLs
- Kanban Board: http://localhost:3000
- API: http://localhost:3001
- Health: http://localhost:3001/health
- Users: http://localhost:3001/api/users
- Tickets: http://localhost:3001/api/tickets

## Seed data includes
- 4 users: Alice, Bob, Carol, David
- 12 tickets across 5 columns
- Nested ticket hierarchy (Authentication Module → child tickets)
- 6 comments

## Run tests
```bash
npm run test --workspace=apps/api
```
