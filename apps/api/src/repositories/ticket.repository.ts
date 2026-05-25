import { PrismaClient, Ticket, Prisma } from '@prisma/client';
import { getPrismaClient } from '../db/client.js';
import { CreateTicketInput, UpdateTicketInput, TicketFilters } from '@taskboard/shared-types';

const ticketInclude = {
  assignee: true,
  parentTicket: { select: { id: true, title: true } },
  children: {
    select: { id: true, title: true, status: true, priority: true },
    orderBy: { sortOrder: 'asc' as const },
  },
} satisfies Prisma.TicketInclude;

export type TicketWithRelations = Prisma.TicketGetPayload<{ include: typeof ticketInclude }>;

export class TicketRepository {
  private db: PrismaClient;

  constructor() {
    this.db = getPrismaClient();
  }

  async findAll(filters: TicketFilters): Promise<TicketWithRelations[]> {
    const where: Prisma.TicketWhereInput = {};

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.teamTag) where.teamTag = filters.teamTag;

    // Only show root-level tickets on the board by default
    if (filters.parentTicketId === null) {
      where.parentTicketId = null;
    } else if (filters.parentTicketId) {
      where.parentTicketId = filters.parentTicketId;
    }

    return this.db.ticket.findMany({
      where,
      include: ticketInclude,
      orderBy: [{ status: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findById(id: string): Promise<TicketWithRelations | null> {
    return this.db.ticket.findUnique({ where: { id }, include: ticketInclude });
  }

  async create(data: CreateTicketInput): Promise<TicketWithRelations> {
    // Get next sortOrder for the column
    const maxOrder = await this.db.ticket.aggregate({
      where: { status: data.status ?? 'BACKLOG' },
      _max: { sortOrder: true },
    });
    const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    return this.db.ticket.create({
      data: {
        title: data.title,
        description: data.description ?? '',
        status: data.status ?? 'BACKLOG',
        priority: data.priority ?? 'MEDIUM',
        assigneeId: data.assigneeId ?? null,
        teamTag: data.teamTag ?? null,
        parentTicketId: data.parentTicketId ?? null,
        sortOrder,
      },
      include: ticketInclude,
    });
  }

  async update(id: string, data: UpdateTicketInput): Promise<TicketWithRelations> {
    return this.db.ticket.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
        ...(data.teamTag !== undefined && { teamTag: data.teamTag }),
        ...(data.parentTicketId !== undefined && { parentTicketId: data.parentTicketId }),
      },
      include: ticketInclude,
    });
  }

  async move(id: string, status: string, sortOrder: number): Promise<TicketWithRelations> {
    return this.db.ticket.update({
      where: { id },
      data: { status: status as any, sortOrder },
      include: ticketInclude,
    });
  }

  async reorderColumn(status: string, orderedIds: string[]): Promise<void> {
    await this.db.$transaction(
      orderedIds.map((ticketId, index) =>
        this.db.ticket.update({ where: { id: ticketId }, data: { sortOrder: index } }),
      ),
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.ticket.delete({ where: { id } });
  }
}
