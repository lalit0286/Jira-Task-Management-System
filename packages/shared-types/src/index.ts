import { z } from 'zod';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const Priority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

export const TicketStatus = {
  BACKLOG: 'BACKLOG',
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  REVIEW: 'REVIEW',
  DONE: 'DONE',
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const ORDERED_STATUSES: TicketStatus[] = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'DONE',
];

export const STATUS_LABELS: Record<TicketStatus, string> = {
  BACKLOG: 'Backlog',
  TODO: 'Todo',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  DONE: 'Done',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

export const CreateTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(10000).optional().default(''),
  status: z.nativeEnum(TicketStatus).default('BACKLOG'),
  priority: z.nativeEnum(Priority).default('MEDIUM'),
  assigneeId: z.string().optional().nullable(),
  teamTag: z.string().max(50).optional().nullable(),
  parentTicketId: z.string().optional().nullable(),
});

export const UpdateTicketSchema = CreateTicketSchema.partial();

export const MoveTicketSchema = z.object({
  status: z.nativeEnum(TicketStatus),
  sortOrder: z.number().int().min(0),
});

export const CreateCommentSchema = z.object({
  message: z.string().min(1, 'Message is required').max(5000),
  authorId: z.string().min(1, 'Author is required'),
});

export const TicketFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  assigneeId: z.string().optional(),
  teamTag: z.string().optional(),
  parentTicketId: z.string().nullable().optional(),
});

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;
export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>;
export type MoveTicketInput = z.infer<typeof MoveTicketSchema>;
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type TicketFilters = z.infer<typeof TicketFiltersSchema>;

// ─── Entity Types ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  assigneeId: string | null;
  assignee?: User | null;
  teamTag: string | null;
  parentTicketId: string | null;
  parentTicket?: Pick<Ticket, 'id' | 'title'> | null;
  children?: Pick<Ticket, 'id' | 'title' | 'status' | 'priority'>[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  ticketId: string;
  authorId: string;
  author?: User;
  message: string;
  createdAt: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}

// ─── WebSocket Events ─────────────────────────────────────────────────────────

export const WsEvent = {
  TICKET_CREATED: 'ticket:created',
  TICKET_UPDATED: 'ticket:updated',
  TICKET_MOVED: 'ticket:moved',
  TICKET_DELETED: 'ticket:deleted',
  COMMENT_ADDED: 'comment:added',
} as const;
export type WsEventType = (typeof WsEvent)[keyof typeof WsEvent];

export interface WsTicketPayload {
  event: WsEventType;
  ticket: Ticket;
}

export interface WsCommentPayload {
  event: typeof WsEvent.COMMENT_ADDED;
  comment: Comment;
}
