# TaskBoard — Lightweight Kanban Task Management

A production-grade MVP Kanban board built as a technical assessment. Supports ticket creation, drag-and-drop, nested tickets, comments, search/filter, and real-time updates via WebSockets.

---

## Tech Stack

**Backend:** Node.js · TypeScript · Fastify · PostgreSQL · Prisma · Redis · Socket.IO · Zod · Pino · Vitest

**Frontend:** Next.js 15 · TypeScript · Tailwind CSS · shadcn/ui · React Query · Zustand · DnD Kit · React Hook Form · Zod

**Infra:** Docker Compose (Postgres + Redis)

---

## Prerequisites

- Node.js 20+
- npm 10+ (workspaces support)
- Docker + Docker Compose

---

## Quick Start

### 1. Clone and install

```bash
git clone <repo>
cd assessment-task-3
npm install
```

### 2. Start infrastructure

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** on `localhost:5432`
- **Redis** on `localhost:6379`

Verify they're running:
```bash
docker-compose ps
```

### 3. Configure environment

```bash
# Backend
cp apps/api/.env.example apps/api/.env

# Frontend
cp apps/web/.env.example apps/web/.env
```

The defaults work out of the box with the Docker Compose config.

### 4. Set up the database

```bash
cd apps/api

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with sample data
npm run db:seed
```

The seed creates:
- 4 mock users (Alice, Bob, Carol, David)
- 12 tickets (including parent-child hierarchy and standalone tickets)
- 6 comments across various tickets

### 5. Run the application

```bash
# From the root — starts both api and web concurrently
npm run dev

# Or individually:
npm run dev --workspace=apps/api      # API on :3001
npm run dev --workspace=apps/web      # Web on :3000
```

Open: **http://localhost:3000**

---

## Project Structure

```
assessment-task-3/
├── apps/
│   ├── api/                        # Fastify backend
│   │   ├── prisma/
│   │   │   └── schema.prisma       # DB schema
│   │   ├── src/
│   │   │   ├── db/                 # Prisma client + seed
│   │   │   ├── config/             # Redis config
│   │   │   ├── repositories/       # Data access layer
│   │   │   │   ├── ticket.repository.ts
│   │   │   │   ├── comment.repository.ts
│   │   │   │   └── user.repository.ts
│   │   │   ├── modules/
│   │   │   │   ├── tickets/        # Ticket routes + service
│   │   │   │   ├── comments/       # Comment routes + service
│   │   │   │   ├── users/          # User routes
│   │   │   │   └── realtime/       # Socket.IO gateway
│   │   │   ├── utils/              # Logger
│   │   │   ├── app.ts              # Fastify app builder
│   │   │   └── index.ts            # Entry point
│   │   └── .env.example
│   │
│   └── web/                        # Next.js 15 frontend
│       ├── src/
│       │   ├── app/                # App router pages
│       │   ├── components/
│       │   │   ├── board/          # BoardView, KanbanColumn, TicketCard, FilterBar
│       │   │   ├── ticket/         # CreateModal, TicketDrawer, TicketDetail, Comments
│       │   │   ├── layout/         # Header, Providers
│       │   │   └── ui/             # shadcn components
│       │   ├── hooks/              # React Query + realtime hooks
│       │   ├── lib/                # API client, socket client
│       │   └── store/              # Zustand UI store
│       └── .env.example
│
└── packages/
    ├── shared-types/               # Zod schemas + TypeScript types
    └── config/                     # Environment config
```

---

## API Reference

### Tickets

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tickets` | List tickets (supports filters) |
| `GET` | `/api/tickets/:id` | Get single ticket with relations |
| `POST` | `/api/tickets` | Create ticket |
| `PATCH` | `/api/tickets/:id` | Update ticket fields |
| `PATCH` | `/api/tickets/:id/move` | Move ticket to column |
| `DELETE` | `/api/tickets/:id` | Delete ticket |

### Filter Query Params

```
GET /api/tickets?search=login&status=IN_PROGRESS&priority=HIGH&assigneeId=user-1&teamTag=backend
```

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tickets/:id/comments` | List comments for ticket |
| `POST` | `/api/tickets/:id/comments` | Add comment |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users` | List all users |

### Health

```
GET /health → { status: "ok", timestamp: "..." }
```

---

## WebSocket Events

Connect to `ws://localhost:3001`.

```js
socket.emit('join:board')           // subscribe to board-wide events
socket.emit('join:ticket', id)      // subscribe to specific ticket
socket.emit('leave:board')
socket.emit('leave:ticket', id)

// Incoming events:
socket.on('ticket:created', handler)
socket.on('ticket:updated', handler)
socket.on('ticket:moved', handler)
socket.on('ticket:deleted', handler)
socket.on('comment:added', handler)
```

---

## Running Tests

```bash
# All tests
npm run test

# Backend only
npm run test --workspace=apps/api

# With coverage
npm run test:coverage --workspace=apps/api

# Watch mode
npm run test:watch --workspace=apps/api
```

Test suites cover:
- Zod schema validation (CreateTicket, UpdateTicket, Move, Comment, Filters)
- Ticket service logic (create, move, nested tickets, delete)
- Filter query construction

---

## Database Commands

```bash
cd apps/api

npm run db:generate       # Regenerate Prisma client after schema changes
npm run db:migrate        # Run migrations (dev mode)
npm run db:migrate:prod   # Run migrations (production)
npm run db:seed           # Seed sample data
npm run db:studio         # Open Prisma Studio (visual DB browser)
```

---

## Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Stop and wipe all data
docker-compose down -v

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Restart specific service
docker-compose restart redis
```

---

## Environment Variables

### Backend (`apps/api/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment |
| `PORT` | `3001` | API port |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | `redis_pass` | Redis auth |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed origin |
| `LOG_LEVEL` | `info` | Pino log level |

### Frontend (`apps/web/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Backend API URL |
| `NEXT_PUBLIC_WS_URL` | `http://localhost:3001` | WebSocket URL |

---

## Features

- **Kanban board** with 5 columns: Backlog → Todo → In Progress → Review → Done
- **Drag-and-drop** tickets between columns and within columns (DnD Kit)
- **Optimistic UI updates** — board updates instantly before server confirms
- **Ticket creation** via modal with full field support
- **Ticket editing** inline in the detail drawer
- **Nested tickets** — parent-child hierarchy with breadcrumb navigation
- **Comments** with real-time updates via Socket.IO
- **Search** by title/description
- **Filters** by status, priority, assignee, team tag
- **Real-time sync** — changes from other clients reflect live on the board
- **Delete** tickets with confirmation

---

## Architecture

See `HLD.md` for the full High Level Design document including Phase 1 system design and Phase 2 scaling strategy.
