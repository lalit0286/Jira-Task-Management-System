import 'dotenv/config';
import { createServer } from 'http';
import { buildApp } from './app.js';
import { getConfig } from '@taskboard/config';
import { logger } from './utils/logger.js';
import { initSocketServer } from './modules/realtime/socket.gateway.js';
import { getPrismaClient } from './db/client.js';

async function bootstrap() {
  const config = getConfig();

  const prisma = getPrismaClient();
  await prisma.$connect();
  logger.info('✅ Database connected');

  const app = await buildApp();

  // Start Fastify (binds to its internal server)
  await app.listen({ port: config.PORT, host: config.HOST });

  // Attach Socket.IO to Fastify's underlying HTTP server
  initSocketServer(app.server as any);
  logger.info(`🚀 Server + Socket.IO running on http://${config.HOST}:${config.PORT}`);

  const shutdown = async (signal: string) => {
    logger.info({ signal }, '⏳ Shutting down...');
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error({ err }, '💥 Fatal startup error');
  process.exit(1);
});
