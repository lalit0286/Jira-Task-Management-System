import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { getConfig } from '@taskboard/config';
import { logger } from './utils/logger.js';
import { ticketRoutes } from './modules/tickets/ticket.routes.js';
import { commentRoutes } from './modules/comments/comment.routes.js';
import { userRoutes } from './modules/users/user.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const config = getConfig();

  const app = Fastify({ logger: false, trustProxy: true });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: config.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Routes
  await app.register(ticketRoutes, { prefix: '/api/tickets' });
  await app.register(commentRoutes, { prefix: '/api/tickets' });
  await app.register(userRoutes, { prefix: '/api/users' });

  // Hooks
  app.addHook('onRequest', async (req) => {
    logger.info({ method: req.method, url: req.url }, '→ Request');
  });

  app.setErrorHandler((error, _req, reply) => {
    if (error.validation) {
      return reply.status(400).send({ statusCode: 400, error: 'Validation Error', message: error.message });
    }
    logger.error({ error }, 'Unhandled error');
    reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Internal Server Error',
      message: error.message,
    });
  });

  return app;
}
