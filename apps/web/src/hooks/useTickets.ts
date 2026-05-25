'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Ticket,
  TicketFilters,
  CreateTicketInput,
  UpdateTicketInput,
  MoveTicketInput,
  TicketStatus,
  ORDERED_STATUSES,
} from '@taskboard/shared-types';

export const ticketKeys = {
  all: ['tickets'] as const,
  list: (filters: TicketFilters) => ['tickets', 'list', filters] as const,
  detail: (id: string) => ['tickets', 'detail', id] as const,
};

export function useTickets(filters: TicketFilters = {}) {
  return useQuery({
    queryKey: ticketKeys.list(filters),
    queryFn: () => api.tickets.list(filters),
    staleTime: 30_000,
  });
}

export function useTicket(id: string | null) {
  return useQuery({
    queryKey: ticketKeys.detail(id!),
    queryFn: () => api.tickets.get(id!),
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTicketInput) => api.tickets.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.all });
    },
  });
}

export function useUpdateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTicketInput }) =>
      api.tickets.update(id, data),
    onSuccess: (updated) => {
      qc.setQueryData(ticketKeys.detail(updated.id), updated);
      qc.invalidateQueries({ queryKey: ticketKeys.all });
    },
  });
}

export function useMoveTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MoveTicketInput }) =>
      api.tickets.move(id, data),
    onMutate: async ({ id, data }) => {
      // Optimistic update
      await qc.cancelQueries({ queryKey: ticketKeys.all });
      const snapshot = qc.getQueriesData({ queryKey: ticketKeys.all });

      qc.setQueriesData(
        { queryKey: ticketKeys.all },
        (old: Ticket[] | undefined) => {
          if (!old) return old;
          return old.map((t) =>
            t.id === id ? { ...t, status: data.status, sortOrder: data.sortOrder } : t,
          );
        },
      );

      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) {
        ctx.snapshot.forEach(([key, value]) => qc.setQueryData(key, value));
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.all });
    },
  });
}

export function useDeleteTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.tickets.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.all });
    },
  });
}

// Group tickets by status for board view
export function useBoard(filters: TicketFilters = {}) {
  const boardFilters = { ...filters, parentTicketId: null };
  const query = useTickets(boardFilters);

  const columns = ORDERED_STATUSES.map((status) => ({
    status,
    tickets: (query.data ?? [])
      .filter((t) => t.status === status)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }));

  return { ...query, columns };
}
