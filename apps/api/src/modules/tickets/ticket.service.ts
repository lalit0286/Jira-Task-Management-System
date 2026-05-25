import { TicketRepository, TicketWithRelations } from '../../repositories/ticket.repository.js';
import {
  CreateTicketInput,
  UpdateTicketInput,
  MoveTicketInput,
  TicketFilters,
  WsEvent,
  Ticket,
} from '@taskboard/shared-types';
import { emitTicketEvent } from '../realtime/socket.gateway.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('ticket-service');

function mapToApiTicket(t: TicketWithRelations): Ticket {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status as any,
    priority: t.priority as any,
    assigneeId: t.assigneeId,
    assignee: t.assignee ? { ...t.assignee, createdAt: t.assignee.createdAt.toISOString() } : null,
    teamTag: t.teamTag,
    parentTicketId: t.parentTicketId,
    parentTicket: t.parentTicket ?? null,
    children: t.children?.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status as any,
      priority: c.priority as any,
    })) ?? [],
    sortOrder: t.sortOrder,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export class TicketService {
  private repo: TicketRepository;

  constructor() {
    this.repo = new TicketRepository();
  }

  async getAll(filters: TicketFilters): Promise<Ticket[]> {
    const tickets = await this.repo.findAll(filters);
    return tickets.map(mapToApiTicket);
  }

  async getById(id: string): Promise<Ticket> {
    const ticket = await this.repo.findById(id);
    if (!ticket) throw new NotFoundError(`Ticket ${id} not found`);
    return mapToApiTicket(ticket);
  }

  async create(data: CreateTicketInput): Promise<Ticket> {
    logger.info({ title: data.title }, 'Creating ticket');
    const ticket = await this.repo.create(data);
    const mapped = mapToApiTicket(ticket);
    emitTicketEvent({ event: WsEvent.TICKET_CREATED, ticket: mapped });
    return mapped;
  }

  async update(id: string, data: UpdateTicketInput): Promise<Ticket> {
    await this.assertExists(id);
    logger.info({ id }, 'Updating ticket');
    const ticket = await this.repo.update(id, data);
    const mapped = mapToApiTicket(ticket);
    emitTicketEvent({ event: WsEvent.TICKET_UPDATED, ticket: mapped });
    return mapped;
  }

  async move(id: string, data: MoveTicketInput): Promise<Ticket> {
    await this.assertExists(id);
    logger.info({ id, status: data.status, sortOrder: data.sortOrder }, 'Moving ticket');
    const ticket = await this.repo.move(id, data.status, data.sortOrder);
    const mapped = mapToApiTicket(ticket);
    emitTicketEvent({ event: WsEvent.TICKET_MOVED, ticket: mapped });
    return mapped;
  }

  async delete(id: string): Promise<void> {
    await this.assertExists(id);
    logger.info({ id }, 'Deleting ticket');
    await this.repo.delete(id);
  }

  private async assertExists(id: string): Promise<void> {
    const exists = await this.repo.findById(id);
    if (!exists) throw new NotFoundError(`Ticket ${id} not found`);
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}
