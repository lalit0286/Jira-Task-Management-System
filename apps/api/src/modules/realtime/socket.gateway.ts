import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { WsEvent, WsTicketPayload, WsCommentPayload } from '@taskboard/shared-types';
import { createLogger } from '../../utils/logger.js';
import { getConfig } from '@taskboard/config';

const logger = createLogger('realtime');

let io: Server | null = null;

export function initSocketServer(httpServer: HttpServer): Server {
  const config = getConfig();

  io = new Server(httpServer, {
    cors: {
      origin: config.CORS_ORIGIN,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    logger.info({ socketId: socket.id }, 'Client connected');

    socket.on('join:board', () => {
      socket.join('board');
      logger.debug({ socketId: socket.id }, 'Joined board room');
    });

    socket.on('leave:board', () => {
      socket.leave('board');
    });

    socket.on('join:ticket', (ticketId: string) => {
      socket.join(`ticket:${ticketId}`);
    });

    socket.on('leave:ticket', (ticketId: string) => {
      socket.leave(`ticket:${ticketId}`);
    });

    socket.on('disconnect', () => {
      logger.debug({ socketId: socket.id }, 'Client disconnected');
    });
  });

  return io;
}

export function getSocketServer(): Server {
  if (!io) throw new Error('Socket server not initialized');
  return io;
}

export function emitTicketEvent(event: WsTicketPayload): void {
  if (!io) return;
  io.to('board').emit(event.event, event);
  io.to(`ticket:${event.ticket.id}`).emit(event.event, event);
  logger.debug({ event: event.event, ticketId: event.ticket.id }, 'Emitted ticket event');
}

export function emitCommentEvent(payload: WsCommentPayload): void {
  if (!io) return;
  io.to(`ticket:${payload.comment.ticketId}`).emit(WsEvent.COMMENT_ADDED, payload);
  logger.debug({ ticketId: payload.comment.ticketId }, 'Emitted comment event');
}
