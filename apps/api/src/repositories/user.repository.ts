import { PrismaClient, User } from '@prisma/client';
import { getPrismaClient } from '../db/client.js';

export class UserRepository {
  private db: PrismaClient;

  constructor() {
    this.db = getPrismaClient();
  }

  async findAll(): Promise<User[]> {
    return this.db.user.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id } });
  }
}
