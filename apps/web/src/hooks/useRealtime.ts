'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { WsEvent, WsTicketPayload, WsCommentPayload } from '@taskboard/shared-types';
import { connectSocket, getSocket } from '@/lib/socket';
import { ticketKeys } from './useTickets';
import { commentKeys } from './useComments';

export function useBoardRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = connectSocket();
    socket.emit('join:board');

    const handleTicketEvent = (payload: WsTicketPayload) => {
      qc.invalidateQueries({ queryKey: ticketKeys.all });
      qc.setQueryData(ticketKeys.detail(payload.ticket.id), payload.ticket);
    };

    socket.on(WsEvent.TICKET_CREATED, handleTicketEvent);
    socket.on(WsEvent.TICKET_UPDATED, handleTicketEvent);
    socket.on(WsEvent.TICKET_MOVED, handleTicketEvent);
    socket.on(WsEvent.TICKET_DELETED, () => {
      qc.invalidateQueries({ queryKey: ticketKeys.all });
    });

    return () => {
      socket.emit('leave:board');
      socket.off(WsEvent.TICKET_CREATED, handleTicketEvent);
      socket.off(WsEvent.TICKET_UPDATED, handleTicketEvent);
      socket.off(WsEvent.TICKET_MOVED, handleTicketEvent);
    };
  }, [qc]);
}

export function useTicketRealtime(ticketId: string | null) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!ticketId) return;
    const socket = getSocket();
    if (!socket.connected) return;

    socket.emit('join:ticket', ticketId);

    const handleComment = (payload: WsCommentPayload) => {
      qc.invalidateQueries({ queryKey: commentKeys.list(payload.comment.ticketId) });
    };

    socket.on(WsEvent.COMMENT_ADDED, handleComment);

    return () => {
      socket.emit('leave:ticket', ticketId);
      socket.off(WsEvent.COMMENT_ADDED, handleComment);
    };
  }, [ticketId, qc]);
}
