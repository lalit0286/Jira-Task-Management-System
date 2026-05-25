# TaskBoard — High Level Design Document

---

## Phase 1 — Initial System Design

### Overview

TaskBoard is a lightweight Kanban task management platform designed for engineering teams. The MVP is a monorepo with a Fastify REST API backend and a Next.js 15 frontend, connected by a PostgreSQL database and Redis-backed Socket.IO for real-time updates.

---

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                   │
│                                                       │
│   ┌─────────────────────────────────────────────┐    │
│   │         Next.js 15 App Router               │    │
│   │                                             │    │
│   │  ┌────────────┐  ┌──────────────────────┐  │    │
│   │  │  React     │  │  Socket.IO Client    │  │    │
│   │  │  Query     │  │  (live board sync)   │  │    │
│   │  │  (server   │  └──────────┬───────────┘  │    │
│   │  │   state)   │             │               │    │
│   │  └──────┬─────┘             │               │    │
│   │         │                   │               │    │
│   │  ┌──────▼─────┐  ┌──────────▼───────────┐  │    │
│   │  │  Zustand   │  │  DnD Kit Board       │  │    │
│   │  │  (UI state)│  │  (drag-and-drop)     │  │    │
│   │  └────────────┘  └──────────────────────┘  │    │
│   └────────────┬────────────────────────────────┘    │
└────────────────┼─────────────────────────────────────┘
                 │  REST (HTTP/JSON) + WebSocket (WS)
                 │
┌────────────────▼─────────────────────────────────────┐
│                  API SERVER (Fastify)                  │
│                                                       │
│   ┌──────────────────────────────────────────────┐   │
│   │             Route Layer (Fastify)             │   │
│   │  /api/tickets   /api/comments   /api/users   │   │
│   └──────────────────┬───────────────────────────┘   │
│                      │                                │
│   ┌──────────────────▼───────────────────────────┐   │
│   │              Service Layer                    │   │
│   │   TicketService  CommentService  UserService  │   │
│   └──────────────────┬───────────────────────────┘   │
│                      │                                │
│   ┌──────────────────▼───────────────────────────┐   │
│   │            Repository Layer (Prisma)          │   │
│   │  TicketRepo  CommentRepo  UserRepo            │   │
│   └──────────────────┬───────────────────────────┘   │
│                      │                                │
│   ┌──────────────────▼───────────────────────────┐   │
│   │          Socket.IO Gateway (Realtime)         │   │
│   │  Rooms: board / ticket:{id}                  │   │
│   └──────────────────┬───────────────────────────┘   │
└────────────────────────────────────────────────────── ┘
                 │                │
    ┌────────────▼────┐  ┌────────▼────────┐
    │   PostgreSQL    │  │     Redis       │
    │   (primary DB)  │  │  (Socket.IO     │
    │                 │  │   adapter /     │
    │   - users       │  │   sessions)     │
    │   - tickets     │  └─────────────────┘
    │   - comments    │
    └─────────────────┘
```

---

### Database Schema

```
┌──────────────────┐         ┌──────────────────────────────────┐
│      users       │         │            tickets               │
├──────────────────┤         ├──────────────────────────────────┤
│ id (PK, cuid)    │◄────────│ assigneeId (FK → users.id)       │
│ name             │         │ id (PK, cuid)                    │
│ email (unique)   │         │ title                            │
│ avatarUrl        │         │ description (TEXT)               │
│ createdAt        │         │ status (enum)                    │
└──────────────────┘         │ priority (enum)                  │
         ▲                   │ teamTag                          │
         │                   │ sortOrder (INT, indexed)         │
         │                   │ parentTicketId (FK → tickets.id) │◄─┐
┌────────┴─────────┐         │ createdAt                        │  │
│     comments     │         │ updatedAt                        │  │
├──────────────────┤         └──────────────────────────────────┘  │
│ id (PK, cuid)    │                         │ self-referential     │
│ ticketId (FK)    │─────────────────────────┘ parent-child        │
│ authorId (FK)    │                           hierarchy            │
│ message (TEXT)   │
│ createdAt        │
└──────────────────┘

Indexes:
- tickets.status         (column filter)
- tickets.priority       (filter)
- tickets.assigneeId     (filter)
- tickets.teamTag        (filter)
- tickets.parentTicketId (hierarchy queries)
- tickets.sortOrder      (ordering within column)
- comments.ticketId      (comment list per ticket)
```

---

### API Request Flow

```
POST /api/tickets

Client Request
     │
     ▼
Fastify Route Handler
     │  Zod validation (CreateTicketSchema)
     │  → 400 if invalid
     ▼
TicketService.create()
     │  compute next sortOrder in column
     ▼
TicketRepository.create()
     │  Prisma INSERT with relations
     ▼
PostgreSQL
     │
     ▼  returns TicketWithRelations
TicketService
     │  map Prisma entity → API Ticket type
     │  emitTicketEvent(TICKET_CREATED)
     ▼
Socket.IO Gateway
     │  broadcast to 'board' room
     │  broadcast to 'ticket:{id}' room
     ▼
201 Response { Ticket }
```

---

### Frontend Architecture

```
Next.js App Router
│
├── app/
│   ├── layout.tsx       ← Providers (React Query, Zustand)
│   └── page.tsx         ← BoardPage
│
├── components/
│   ├── board/
│   │   ├── BoardView    ← DndContext, drag orchestration
│   │   ├── KanbanColumn ← useDroppable, SortableContext
│   │   ├── TicketCard   ← useSortable
│   │   └── FilterBar    ← search + filter dropdowns
│   │
│   └── ticket/
│       ├── CreateTicketModal  ← React Hook Form + Zod
│       ├── TicketDrawer       ← Sheet panel (right side)
│       ├── TicketDetail       ← view + edit ticket
│       └── CommentSection     ← comment list + add form
│
├── hooks/
│   ├── useTickets.ts    ← React Query (list, get, create, update, move, delete)
│   ├── useComments.ts   ← React Query (list, create)
│   ├── useUsers.ts      ← React Query (list, cached forever)
│   └── useRealtime.ts   ← Socket.IO events → React Query invalidation
│
├── lib/
│   ├── api.ts           ← fetch wrapper, all API calls
│   └── socket.ts        ← Socket.IO client singleton
│
└── store/
    └── ui.store.ts      ← Zustand: modal state, drawer, active filters
```

---

### Real-time Sync Flow

```
User A drags ticket on their browser
         │
         ▼
useMoveTicket.mutate()
  → Optimistic update (Zustand/React Query cache)
  → PATCH /api/tickets/:id/move
         │
         ▼
TicketService.move()
  → DB update
  → emitTicketEvent(TICKET_MOVED, ticket)
         │
         ▼
Socket.IO Server
  → io.to('board').emit('ticket:moved', payload)
         │
    ┌────┴───────┐
    ▼            ▼
User B        User C
useBoardRealtime()
  socket.on('ticket:moved')
  → queryClient.invalidateQueries(['tickets'])
  → React Query refetch
  → Board re-renders with updated data
```

---

## Phase 2 — Scaling Strategy

### Target: 100K+ tickets, thousands of concurrent users, multiple teams

---

### 1. Database Scaling

**Problem:** Single Postgres instance becomes a bottleneck at scale.

**Solution:**

```
Read/Write Splitting:
┌───────────────┐
│  API Server   │
└───────┬───────┘
        │
   ┌────▼────┐      ┌──────────────────┐
   │ Primary │─────►│  Read Replica 1  │
   │ Postgres│      │  Read Replica 2  │  ← queries go here
   └────┬────┘      └──────────────────┘
        │
   WAL replication (streaming)
```

**Indexing Strategy:**
```sql
-- Composite index for board view (most common query)
CREATE INDEX idx_tickets_board
  ON tickets(status, sort_order, assignee_id)
  WHERE parent_ticket_id IS NULL;

-- Full-text search index
CREATE INDEX idx_tickets_fts
  ON tickets USING gin(to_tsvector('english', title || ' ' || description));

-- Team + status combined
CREATE INDEX idx_tickets_team_status ON tickets(team_tag, status);
```

**Pagination:** Migrate from `findMany` to cursor-based pagination:
```
GET /api/tickets?cursor=clx123&limit=50
→ returns { data, nextCursor }
```

**Partitioning:** Partition tickets table by team or date range when it exceeds ~10M rows:
```sql
-- Range partition by created_at year
PARTITION BY RANGE (EXTRACT(YEAR FROM created_at))
```

---

### 2. Caching Strategy

```
┌──────────┐    cache miss    ┌──────────┐    query    ┌──────────┐
│  Client  │─────────────────►│  Redis   │────────────►│ Postgres │
│          │                  │  Cache   │             │          │
│          │◄─────────────────│          │◄────────────│          │
└──────────┘    cache hit     └──────────┘   populate  └──────────┘
```

**What to cache:**
- Board column queries: `board:{teamId}:{status}` → 5-10s TTL
- Individual ticket: `ticket:{id}` → 30s TTL, invalidated on write
- User list: `users:all` → 5min TTL (rarely changes)
- Filter results: hash of filter params as cache key → 10s TTL

**Cache invalidation:**
```
On PATCH /api/tickets/:id:
  await redis.del(`ticket:${id}`)
  await redis.del(`board:*`)   // pattern delete or use tags
```

**Redis Cluster** for high availability:
```
Redis Cluster (3 primary + 3 replica nodes)
→ sharding by key hash slot
→ automatic failover
```

---

### 3. Real-time Scaling (Socket.IO)

**Problem:** Socket.IO is stateful. Sticky sessions break across multiple API instances.

**Solution: Redis Pub/Sub Adapter**

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  API Node 1  │   │  API Node 2  │   │  API Node 3  │
│  Socket.IO   │   │  Socket.IO   │   │  Socket.IO   │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                ┌─────────▼─────────┐
                │   Redis Pub/Sub   │
                │   (event relay)   │
                └───────────────────┘
```

**Implementation:**
```ts
import { createAdapter } from '@socket.io/redis-adapter';
io.adapter(createAdapter(pubClient, subClient));
```

Now `io.to('board').emit(...)` on Node 1 fans out to all clients on Nodes 2 and 3.

**Load Balancer:** Use sticky sessions (IP hash or cookie-based) at the Nginx/ALB layer, or prefer polling transport for stateless routing.

---

### 4. Queue & Event System

**Problem:** Synchronous event processing in the request-response cycle blocks API latency.

**Solution: BullMQ job queues for async work**

```
API Request
     │
     ▼
Fastify Route
     │  persists to DB
     │  enqueues job (non-blocking)
     ▼
BullMQ Queue (Redis)
     │
     ▼
Background Worker
     ├── Send email notifications
     ├── Write activity log
     ├── Trigger webhooks
     ├── Rebuild search index
     └── Generate reports
```

**Queue types:**
- `notifications` — email/Slack alerts on ticket assignment
- `audit-log` — immutable activity history per ticket
- `search-index` — update Elasticsearch/Meilisearch on changes
- `cleanup` — archive or delete stale tickets

---

### 5. API Performance

**Cursor pagination** (replaces offset):
```
GET /api/tickets?cursor=clx8a2b&limit=50&status=IN_PROGRESS
→ uses WHERE id > cursor ORDER BY created_at, no full-table count
```

**Query optimization:**
- Select only needed columns (no `SELECT *`)
- Use `include` selectively — don't always join comments and children
- Prisma `$queryRaw` for complex reporting queries

**Request batching / DataLoader:**
```
GET /api/tickets/batch?ids=id1,id2,id3
→ single DB query via WHERE id IN (...)
```

**Field projection:**
```
GET /api/tickets?fields=id,title,status,priority
→ reduces payload by 60-80% for list views
```

---

### 6. Rate Limiting

**API rate limiting** (per IP, per user):
```
Public endpoints:    100 req/min
Authenticated users: 1000 req/min
Bulk operations:     10 req/min
```

**Implementation using Redis sliding window:**
```ts
// Fastify plugin: @fastify/rate-limit
fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  redis: redisClient,
  keyGenerator: (req) => req.ip,
});
```

**WebSocket throttling:**
- Throttle `ticket:moved` events to max 10/sec per connection
- Debounce rapid reorder operations client-side before emitting

---

### 7. Horizontal Scaling

```
                        ┌─────────────────────────────┐
Internet ──────────────►│  Load Balancer (Nginx/ALB)  │
                        └───────────┬─────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
     ┌────────────────┐   ┌────────────────┐   ┌────────────────┐
     │  API Node 1    │   │  API Node 2    │   │  API Node 3    │
     │  (stateless)   │   │  (stateless)   │   │  (stateless)   │
     └────────┬───────┘   └────────┬───────┘   └────────┬───────┘
              └─────────────────────┼─────────────────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     ▼                             ▼
            ┌────────────────┐           ┌─────────────────┐
            │ PostgreSQL     │           │  Redis Cluster  │
            │ Primary +      │           │  (cache + pub/  │
            │ Read Replicas  │           │   sub + queues) │
            └────────────────┘           └─────────────────┘
```

**Stateless API design:**
- No in-memory session state
- All shared state in Redis or Postgres
- Container-ready (Docker/Kubernetes)

**Auto-scaling triggers:**
- CPU > 70% → scale out
- WebSocket connections > 5000/node → scale out
- Queue depth > 1000 jobs → scale workers

---

### 8. Concurrency & Conflict Resolution

**Problem:** Two users drag the same ticket simultaneously.

**Solution: Optimistic locking via `updatedAt` version check:**

```ts
// Client sends: { updatedAt: "2024-01-01T10:00:00Z" }
// Server checks:
const ticket = await db.ticket.findUnique({ where: { id } });
if (ticket.updatedAt.toISOString() !== payload.updatedAt) {
  throw new ConflictError('Ticket was modified by another user');
}
// Safe to update
```

**Move conflict resolution:**
```
User A moves ticket to IN_PROGRESS (sortOrder: 2)
User B moves same ticket to REVIEW (sortOrder: 0)
                          │
                Last-write-wins (simple MVP)
                OR
                Show conflict UI, let user resolve
```

**Sortorder conflicts:**
- Use floating-point sort orders (1.0, 2.0, 3.0)
- On insert between positions: avg(prev, next) = 1.5
- Re-index when precision gets too low (< 0.001 gap)

---

### 9. Search at Scale

**Phase 1:** Postgres full-text search with GIN index (handles ~1M tickets)

**Phase 2:** Dedicated search engine when Postgres FTS gets slow:

```
Ticket write → API → Postgres (source of truth)
                    → BullMQ job
                    → Worker → Meilisearch / Elasticsearch
                                        ↑
Client search query → API → Search Engine (fast, indexed)
```

**Meilisearch** preferred for simplicity; Elasticsearch for complex analytics.

---

### Scaling Summary Table

| Concern | Phase 1 (MVP) | Phase 2 (Scale) |
|---|---|---|
| Database | Single Postgres | Primary + 2 read replicas |
| Caching | None | Redis (board, ticket, users) |
| Search | Postgres ILIKE | Meilisearch / Elasticsearch |
| Real-time | Socket.IO single node | Socket.IO + Redis adapter |
| Jobs | None | BullMQ workers |
| Pagination | findMany (limit 100) | Cursor-based |
| Rate limiting | None | Redis sliding window |
| Deployment | Single server | Kubernetes / ECS |
| Concurrency | Last-write-wins | Optimistic locking |

---

### Estimated Capacity (Phase 2)

| Metric | Target |
|---|---|
| Tickets in DB | 100K+ (10M+ with partitioning) |
| Concurrent WebSocket clients | 5,000+ |
| API requests/sec | 2,000+ (3 nodes) |
| Board load time (P95) | < 200ms |
| Real-time latency | < 100ms |
| Cache hit rate | > 85% |
