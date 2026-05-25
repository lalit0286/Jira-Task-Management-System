import { CommentRepository, CommentWithAuthor } from '../../repositories/comment.repository.js';
import { Comment, WsEvent } from '@taskboard/shared-types';
import { emitCommentEvent } from '../realtime/socket.gateway.js';

function mapComment(c: CommentWithAuthor): Comment {
  return {
    id: c.id,
    ticketId: c.ticketId,
    authorId: c.authorId,
    author: c.author ? { ...c.author, createdAt: c.author.createdAt.toISOString() } : undefined,
    message: c.message,
    createdAt: c.createdAt.toISOString(),
  };
}

export class CommentService {
  private repo: CommentRepository;

  constructor() {
    this.repo = new CommentRepository();
  }

  async getByTicketId(ticketId: string): Promise<Comment[]> {
    const comments = await this.repo.findByTicketId(ticketId);
    return comments.map(mapComment);
  }

  async create(ticketId: string, authorId: string, message: string): Promise<Comment> {
    const comment = await this.repo.create(ticketId, authorId, message);
    const mapped = mapComment(comment);
    emitCommentEvent({ event: WsEvent.COMMENT_ADDED, comment: mapped });
    return mapped;
  }
}
