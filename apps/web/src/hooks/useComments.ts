'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CreateCommentInput } from '@taskboard/shared-types';

export const commentKeys = {
  list: (ticketId: string) => ['comments', ticketId] as const,
};

export function useComments(ticketId: string | null) {
  return useQuery({
    queryKey: commentKeys.list(ticketId!),
    queryFn: () => api.comments.list(ticketId!),
    enabled: !!ticketId,
  });
}

export function useCreateComment(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCommentInput) => api.comments.create(ticketId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentKeys.list(ticketId) });
    },
  });
}
