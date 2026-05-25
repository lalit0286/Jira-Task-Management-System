import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  CreateTicketSchema,
  UpdateTicketSchema,
  MoveTicketSchema,
  TicketFiltersSchema,
} from '@taskboard/shared-types';
import { TicketService, NotFoundError } from './ticket.service.js';

const service = new TicketService();

export async function ticketRoutes(app: FastifyInstance) {
  // GET /api/tickets
  app.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as Record<string, string>;
    const filters = TicketFiltersSchema.parse({
      search: query.search,
      status: query.status,
      priority: query.priority,
      assigneeId: query.assigneeId,
      teamTag: query.teamTag,
      parentTicketId: query.parentTicketId === 'null' ? null : query.parentTicketId,
    });
    const tickets = await service.getAll(filters);
    return reply.send(tickets);
  });

  // GET /api/tickets/:id
  app.get('/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const ticket = await service.getById(req.params.id);
      return reply.send(ticket);
    } catch (e) {
      if (e instanceof NotFoundError) return reply.status(404).send({ message: e.message });
      throw e;
    }
  });

  // POST /api/tickets
  app.post('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const data = CreateTicketSchema.parse(req.body);
    const ticket = await service.create(data);
    return reply.status(201).send(ticket);
  });

  // PATCH /api/tickets/:id
  app.patch('/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = UpdateTicketSchema.parse(req.body);
      const ticket = await service.update(req.params.id, data);
      return reply.send(ticket);
    } catch (e) {
      if (e instanceof NotFoundError) return reply.status(404).send({ message: e.message });
      throw e;
    }
  });

  // PATCH /api/tickets/:id/move
  app.patch('/:id/move', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = MoveTicketSchema.parse(req.body);
      const ticket = await service.move(req.params.id, data);
      return reply.send(ticket);
    } catch (e) {
      if (e instanceof NotFoundError) return reply.status(404).send({ message: e.message });
      throw e;
    }
  });

  // DELETE /api/tickets/:id
  app.delete('/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await service.delete(req.params.id);
      return reply.status(204).send();
    } catch (e) {
      if (e instanceof NotFoundError) return reply.status(404).send({ message: e.message });
      throw e;
    }
  });
}
