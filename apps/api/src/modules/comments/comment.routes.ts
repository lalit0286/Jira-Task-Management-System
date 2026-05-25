import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CreateCommentSchema } from '@taskboard/shared-types';
import { CommentService } from './comment.service.js';

const service = new CommentService();

export async function commentRoutes(app: FastifyInstance) {
  // GET /api/tickets/:id/comments
  app.get('/:ticketId/comments', async (req: FastifyRequest<{ Params: { ticketId: string } }>, reply: FastifyReply) => {
    const comments = await service.getByTicketId(req.params.ticketId);
    return reply.send(comments);
  });

  // POST /api/tickets/:id/comments
  app.post('/:ticketId/comments', async (req: FastifyRequest<{ Params: { ticketId: string } }>, reply: FastifyReply) => {
    const data = CreateCommentSchema.parse(req.body);
    const comment = await service.create(req.params.ticketId, data.authorId, data.message);
    return reply.status(201).send(comment);
  });
}
