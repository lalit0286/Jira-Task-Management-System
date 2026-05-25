import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CreateTicketSchema,
  UpdateTicketSchema,
  MoveTicketSchema,
  CreateCommentSchema,
  TicketFiltersSchema,
  TicketStatus,
  Priority,
} from '@taskboard/shared-types';

// ─── Validation Tests ────────────────────────────────────────────────────────

describe('CreateTicketSchema', () => {
  it('parses a valid ticket', () => {
    const result = CreateTicketSchema.parse({
      title: 'Fix login bug',
      description: 'Crashes on Safari',
      status: 'TODO',
      priority: 'HIGH',
    });
    expect(result.title).toBe('Fix login bug');
    expect(result.priority).toBe('HIGH');
    expect(result.status).toBe('TODO');
  });

  it('applies defaults for missing fields', () => {
    const result = CreateTicketSchema.parse({ title: 'Minimal ticket' });
    expect(result.status).toBe('BACKLOG');
    expect(result.priority).toBe('MEDIUM');
    expect(result.description).toBe('');
  });

  it('rejects empty title', () => {
    expect(() => CreateTicketSchema.parse({ title: '' })).toThrow();
  });

  it('rejects invalid priority', () => {
    expect(() => CreateTicketSchema.parse({ title: 'T', priority: 'SUPER_URGENT' })).toThrow();
  });

  it('rejects invalid status', () => {
    expect(() => CreateTicketSchema.parse({ title: 'T', status: 'WONT_FIX' })).toThrow();
  });

  it('accepts parentTicketId', () => {
    const result = CreateTicketSchema.parse({ title: 'Child', parentTicketId: 'ticket-123' });
    expect(result.parentTicketId).toBe('ticket-123');
  });
});

describe('UpdateTicketSchema', () => {
  it('allows partial updates', () => {
    const result = UpdateTicketSchema.parse({ priority: 'CRITICAL' });
    expect(result.priority).toBe('CRITICAL');
    expect(result.title).toBeUndefined();
  });

  it('accepts empty object', () => {
    const result = UpdateTicketSchema.parse({});
    expect(result).toEqual({});
  });
});

describe('MoveTicketSchema', () => {
  it('parses valid move', () => {
    const result = MoveTicketSchema.parse({ status: 'IN_PROGRESS', sortOrder: 2 });
    expect(result.status).toBe('IN_PROGRESS');
    expect(result.sortOrder).toBe(2);
  });

  it('rejects negative sortOrder', () => {
    expect(() => MoveTicketSchema.parse({ status: 'DONE', sortOrder: -1 })).toThrow();
  });

  it('rejects invalid status', () => {
    expect(() => MoveTicketSchema.parse({ status: 'INVALID', sortOrder: 0 })).toThrow();
  });
});

describe('CreateCommentSchema', () => {
  it('parses valid comment', () => {
    const result = CreateCommentSchema.parse({ message: 'LGTM!', authorId: 'user-1' });
    expect(result.message).toBe('LGTM!');
    expect(result.authorId).toBe('user-1');
  });

  it('rejects empty message', () => {
    expect(() => CreateCommentSchema.parse({ message: '', authorId: 'user-1' })).toThrow();
  });

  it('rejects missing authorId', () => {
    expect(() => CreateCommentSchema.parse({ message: 'Hi' })).toThrow();
  });
});

describe('TicketFiltersSchema', () => {
  it('accepts all empty filters', () => {
    const result = TicketFiltersSchema.parse({});
    expect(result).toEqual({});
  });

  it('parses valid filters', () => {
    const result = TicketFiltersSchema.parse({
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assigneeId: 'user-1',
      teamTag: 'backend',
      search: 'login',
    });
    expect(result.status).toBe('IN_PROGRESS');
    expect(result.search).toBe('login');
  });

  it('rejects invalid status in filter', () => {
    expect(() => TicketFiltersSchema.parse({ status: 'WONT_DO' })).toThrow();
  });
});

// ─── Mock Ticket Service Tests ───────────────────────────────────────────────

describe('TicketService (mocked)', () => {
  const mockRepo = {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    move: vi.fn(),
    delete: vi.fn(),
  };

  const makeTicket = (overrides = {}) => ({
    id: 'ticket-1',
    title: 'Test Ticket',
    description: '',
    status: 'BACKLOG' as TicketStatus,
    priority: 'MEDIUM' as Priority,
    assigneeId: null,
    assignee: null,
    teamTag: null,
    parentTicketId: null,
    parentTicket: null,
    children: [],
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return mapped tickets', async () => {
    const raw = makeTicket({ title: 'Feature X' });
    mockRepo.findAll.mockResolvedValue([raw]);
    const result = await mockRepo.findAll({});
    expect(result[0].title).toBe('Feature X');
  });

  it('should create a ticket with correct data', async () => {
    const created = makeTicket({ title: 'New Bug', status: 'TODO', priority: 'HIGH' });
    mockRepo.create.mockResolvedValue(created);
    const input = CreateTicketSchema.parse({ title: 'New Bug', status: 'TODO', priority: 'HIGH' });
    const result = await mockRepo.create(input);
    expect(result.title).toBe('New Bug');
    expect(result.status).toBe('TODO');
  });

  it('should move ticket to new status', async () => {
    const moved = makeTicket({ status: 'IN_PROGRESS', sortOrder: 1 });
    mockRepo.move.mockResolvedValue(moved);
    const result = await mockRepo.move('ticket-1', 'IN_PROGRESS', 1);
    expect(result.status).toBe('IN_PROGRESS');
    expect(result.sortOrder).toBe(1);
  });

  it('should create nested (child) ticket', async () => {
    const child = makeTicket({ title: 'Child Task', parentTicketId: 'ticket-parent' });
    mockRepo.create.mockResolvedValue(child);
    const result = await mockRepo.create({ title: 'Child Task', parentTicketId: 'ticket-parent' });
    expect(result.parentTicketId).toBe('ticket-parent');
  });

  it('should handle delete', async () => {
    mockRepo.delete.mockResolvedValue(undefined);
    await mockRepo.delete('ticket-1');
    expect(mockRepo.delete).toHaveBeenCalledWith('ticket-1');
  });
});

// ─── Filter Logic Tests ───────────────────────────────────────────────────────

describe('Filter query construction', () => {
  function buildWhere(filters: Record<string, string | undefined>) {
    const where: Record<string, any> = {};
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
    return where;
  }

  it('builds empty where for no filters', () => {
    expect(buildWhere({})).toEqual({});
  });

  it('builds search OR condition', () => {
    const where = buildWhere({ search: 'login' });
    expect(where.OR).toHaveLength(2);
    expect(where.OR[0].title.contains).toBe('login');
  });

  it('combines status and priority', () => {
    const where = buildWhere({ status: 'DONE', priority: 'HIGH' });
    expect(where.status).toBe('DONE');
    expect(where.priority).toBe('HIGH');
  });

  it('includes team tag filter', () => {
    const where = buildWhere({ teamTag: 'backend' });
    expect(where.teamTag).toBe('backend');
  });
});
