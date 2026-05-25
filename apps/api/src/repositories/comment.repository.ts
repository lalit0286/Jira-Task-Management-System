import { PrismaClient, Comment, Prisma } from '@prisma/client';
import { getPrismaClient } from '../db/client.js';

const commentInclude = { author: true } satisfies Prisma.CommentInclude;
export type CommentWithAuthor = Prisma.CommentGetPayload<{ include: typeof commentInclude }>;

export class CommentRepository {
  private db: PrismaClient;

  constructor() {
    this.db = getPrismaClient();
  }

  async findByTicketId(ticketId: string): Promise<CommentWithAuthor[]> {
    return this.db.comment.findMany({
      where: { ticketId },
      include: commentInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(ticketId: string, authorId: string, message: string): Promise<CommentWithAuthor> {
    return this.db.comment.create({
      data: { ticketId, authorId, message },
      include: commentInclude,
    });
  }
}
