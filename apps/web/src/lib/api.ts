import {
  Ticket,
  Comment,
  User,
  CreateTicketInput,
  UpdateTicketInput,
  MoveTicketInput,
  CreateCommentInput,
  TicketFilters,
} from '@taskboard/shared-types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

function buildQuery(filters: TicketFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.assigneeId) params.set('assigneeId', filters.assigneeId);
  if (filters.teamTag) params.set('teamTag', filters.teamTag);
  if (filters.parentTicketId === null) params.set('parentTicketId', 'null');
  else if (filters.parentTicketId) params.set('parentTicketId', filters.parentTicketId);
  const q = params.toString();
  return q ? `?${q}` : '';
}

export const api = {
  tickets: {
    list: (filters: TicketFilters = {}) =>
      request<Ticket[]>(`/api/tickets${buildQuery(filters)}`),
    get: (id: string) => request<Ticket>(`/api/tickets/${id}`),
    create: (data: CreateTicketInput) =>
      request<Ticket>('/api/tickets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateTicketInput) =>
      request<Ticket>(`/api/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    move: (id: string, data: MoveTicketInput) =>
      request<Ticket>(`/api/tickets/${id}/move`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/api/tickets/${id}`, { method: 'DELETE' }),
  },
  comments: {
    list: (ticketId: string) => request<Comment[]>(`/api/tickets/${ticketId}/comments`),
    create: (ticketId: string, data: CreateCommentInput) =>
      request<Comment>(`/api/tickets/${ticketId}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  },
  users: {
    list: () => request<User[]>('/api/users'),
  },
};
