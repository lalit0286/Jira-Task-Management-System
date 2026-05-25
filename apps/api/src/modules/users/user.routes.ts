import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserRepository } from '../../repositories/user.repository.js';

const repo = new UserRepository();

export async function userRoutes(app: FastifyInstance) {
  app.get('/', async (_req: FastifyRequest, reply: FastifyReply) => {
    const users = await repo.findAll();
    return reply.send(users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })));
  });
}
