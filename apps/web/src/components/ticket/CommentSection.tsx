'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useComments, useCreateComment } from '@/hooks/useComments';
import { useUsers } from '@/hooks/useUsers';
import { useTicketRealtime } from '@/hooks/useRealtime';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserAvatar } from '@/components/ui/display-helpers';
import { Separator } from '@/components/ui/separator';
import { MessageSquare } from 'lucide-react';

// Fallback for date-fns if not installed
function timeAgo(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return new Date(dateStr).toLocaleDateString();
  }
}

interface CommentSectionProps {
  ticketId: string;
}

export function CommentSection({ ticketId }: CommentSectionProps) {
  const { data: comments = [], isLoading } = useComments(ticketId);
  const { data: users = [] } = useUsers();
  const createComment = useCreateComment(ticketId);
  const [message, setMessage] = useState('');
  const [authorId, setAuthorId] = useState(users[0]?.id ?? '');

  useTicketRealtime(ticketId);

  const handleSubmit = async () => {
    if (!message.trim() || !authorId) return;
    await createComment.mutateAsync({ message: message.trim(), authorId });
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Comments</span>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5">{comments.length}</span>
      </div>

      {/* Comment list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2 animate-pulse">
              <div className="h-6 w-6 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-12 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2.5">
              {comment.author && <UserAvatar name={comment.author.name} size="sm" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold">{comment.author?.name ?? 'Unknown'}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap break-words">{comment.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Separator />

      {/* Add comment */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Select
            value={authorId || (users[0]?.id ?? '')}
            onValueChange={setAuthorId}
          >
            <SelectTrigger className="h-7 w-[140px] text-xs">
              <SelectValue placeholder="Comment as..." />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">⌘+Enter to submit</span>
        </div>
        <Textarea
          placeholder="Add a comment..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          className="text-sm resize-none"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!message.trim() || !authorId || createComment.isPending}
          >
            {createComment.isPending ? 'Posting...' : 'Comment'}
          </Button>
        </div>
      </div>
    </div>
  );
}
