import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean slate
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  // Users
  const users = await Promise.all([
    prisma.user.create({ data: { id: 'user-1', name: 'Alice Chen', email: 'alice@taskboard.dev', avatarUrl: null } }),
    prisma.user.create({ data: { id: 'user-2', name: 'Bob Martinez', email: 'bob@taskboard.dev', avatarUrl: null } }),
    prisma.user.create({ data: { id: 'user-3', name: 'Carol White', email: 'carol@taskboard.dev', avatarUrl: null } }),
    prisma.user.create({ data: { id: 'user-4', name: 'David Kim', email: 'david@taskboard.dev', avatarUrl: null } }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Parent tickets
  const authTicket = await prisma.ticket.create({
    data: {
      id: 'ticket-auth',
      title: 'Authentication Module',
      description: 'Implement full authentication system including login, signup, and password reset flows.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assigneeId: 'user-1',
      teamTag: 'backend',
      sortOrder: 0,
    },
  });

  const dashboardTicket = await prisma.ticket.create({
    data: {
      id: 'ticket-dashboard',
      title: 'Dashboard Redesign',
      description: 'Redesign the main dashboard for better UX and performance.',
      status: 'TODO',
      priority: 'MEDIUM',
      assigneeId: 'user-2',
      teamTag: 'frontend',
      sortOrder: 0,
    },
  });

  const infraTicket = await prisma.ticket.create({
    data: {
      id: 'ticket-infra',
      title: 'Infrastructure Upgrade',
      description: 'Upgrade cloud infrastructure for improved scalability and reliability.',
      status: 'BACKLOG',
      priority: 'CRITICAL',
      assigneeId: 'user-4',
      teamTag: 'devops',
      sortOrder: 0,
    },
  });

  // Child tickets under auth
  const childTickets = await Promise.all([
    prisma.ticket.create({
      data: {
        title: 'Login API',
        description: 'Implement POST /auth/login endpoint with JWT token generation.',
        status: 'DONE',
        priority: 'HIGH',
        assigneeId: 'user-1',
        teamTag: 'backend',
        parentTicketId: authTicket.id,
        sortOrder: 0,
      },
    }),
    prisma.ticket.create({
      data: {
        title: 'Signup API',
        description: 'Implement POST /auth/signup with email validation and password hashing.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assigneeId: 'user-1',
        teamTag: 'backend',
        parentTicketId: authTicket.id,
        sortOrder: 1,
      },
    }),
    prisma.ticket.create({
      data: {
        title: 'Password Reset Flow',
        description: 'Email-based password reset with secure tokens.',
        status: 'TODO',
        priority: 'MEDIUM',
        assigneeId: 'user-3',
        teamTag: 'backend',
        parentTicketId: authTicket.id,
        sortOrder: 2,
      },
    }),
    prisma.ticket.create({
      data: {
        title: 'Auth Frontend Forms',
        description: 'Build login and signup forms with validation.',
        status: 'TODO',
        priority: 'MEDIUM',
        assigneeId: 'user-2',
        teamTag: 'frontend',
        parentTicketId: authTicket.id,
        sortOrder: 3,
      },
    }),
  ]);

  // Standalone tickets
  const standaloneTickets = await Promise.all([
    prisma.ticket.create({
      data: {
        title: 'Fix navbar responsive layout',
        description: 'Navbar breaks on mobile screens < 375px.',
        status: 'TODO',
        priority: 'LOW',
        assigneeId: 'user-2',
        teamTag: 'frontend',
        sortOrder: 1,
      },
    }),
    prisma.ticket.create({
      data: {
        title: 'Add rate limiting to API',
        description: 'Implement per-IP rate limiting on all public endpoints.',
        status: 'REVIEW',
        priority: 'HIGH',
        assigneeId: 'user-3',
        teamTag: 'backend',
        sortOrder: 0,
      },
    }),
    prisma.ticket.create({
      data: {
        title: 'Database query optimization',
        description: 'Add missing indexes and optimize slow queries identified in production.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assigneeId: 'user-4',
        teamTag: 'backend',
        sortOrder: 1,
      },
    }),
    prisma.ticket.create({
      data: {
        title: 'Setup CI/CD pipeline',
        description: 'Configure GitHub Actions for automated testing and deployment.',
        status: 'DONE',
        priority: 'MEDIUM',
        assigneeId: 'user-4',
        teamTag: 'devops',
        sortOrder: 0,
      },
    }),
    prisma.ticket.create({
      data: {
        title: 'Write API documentation',
        description: 'Create comprehensive OpenAPI spec for all endpoints.',
        status: 'BACKLOG',
        priority: 'LOW',
        assigneeId: 'user-3',
        teamTag: 'backend',
        sortOrder: 1,
      },
    }),
    prisma.ticket.create({
      data: {
        title: 'Implement dark mode',
        description: 'Add dark mode toggle with user preference persistence.',
        status: 'BACKLOG',
        priority: 'LOW',
        assigneeId: 'user-2',
        teamTag: 'frontend',
        sortOrder: 2,
      },
    }),
    prisma.ticket.create({
      data: {
        title: 'Performance monitoring setup',
        description: 'Integrate Sentry and performance monitoring dashboards.',
        status: 'REVIEW',
        priority: 'MEDIUM',
        assigneeId: 'user-1',
        teamTag: 'devops',
        sortOrder: 1,
      },
    }),
  ]);

  console.log(`✅ Created ${1 + childTickets.length + standaloneTickets.length + 2} tickets`);

  // Comments
  const firstStandalone = standaloneTickets[0];
  const secondStandalone = standaloneTickets[1];

  await Promise.all([
    prisma.comment.create({
      data: {
        ticketId: authTicket.id,
        authorId: 'user-2',
        message: 'Should we use refresh tokens or stick with short-lived JWTs?',
      },
    }),
    prisma.comment.create({
      data: {
        ticketId: authTicket.id,
        authorId: 'user-1',
        message: 'Going with refresh tokens — 15min access + 7-day refresh. Keeps sessions smooth.',
      },
    }),
    prisma.comment.create({
      data: {
        ticketId: authTicket.id,
        authorId: 'user-3',
        message: "Sounds good. Make sure we invalidate refresh tokens on password change.",
      },
    }),
    prisma.comment.create({
      data: {
        ticketId: childTickets[0].id,
        authorId: 'user-1',
        message: 'Login API is done and deployed to staging. Ready for review.',
      },
    }),
    prisma.comment.create({
      data: {
        ticketId: secondStandalone.id,
        authorId: 'user-4',
        message: 'Using express-rate-limit with Redis store. Should handle 5000 req/min per IP.',
      },
    }),
    prisma.comment.create({
      data: {
        ticketId: secondStandalone.id,
        authorId: 'user-2',
        message: 'Make sure to whitelist the health check endpoint.',
      },
    }),
  ]);

  console.log('✅ Created comments');
  console.log('🌱 Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
