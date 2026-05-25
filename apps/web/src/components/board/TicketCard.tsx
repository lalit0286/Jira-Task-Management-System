'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MessageSquare, GitBranch } from 'lucide-react';
import { Ticket } from '@taskboard/shared-types';
import { Card } from '@/components/ui/card';
import { PriorityBadge, UserAvatar } from '@/components/ui/display-helpers';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';

interface TicketCardProps {
  ticket: Ticket;
  isDragOverlay?: boolean;
}

export function TicketCard({ ticket, isDragOverlay = false }: TicketCardProps) {
  const openTicketDrawer = useUIStore((s) => s.openTicketDrawer);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
    data: { type: 'ticket', ticket },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(isDragging && 'opacity-40')}
    >
      <Card
        className={cn(
          'p-3 cursor-pointer select-none hover:shadow-md hover:border-primary/30 transition-all duration-150 group',
          isDragOverlay && 'shadow-xl rotate-1 border-primary/40',
        )}
        onClick={() => !isDragging && openTicketDrawer(ticket.id)}
      >
        {/* Team tag */}
        {ticket.teamTag && (
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            {ticket.teamTag}
          </span>
        )}

        {/* Title */}
        <p className="text-sm font-medium leading-snug mt-0.5 mb-2 line-clamp-2 text-foreground">
          {ticket.title}
        </p>

        {/* Priority */}
        <div className="mb-2">
          <PriorityBadge priority={ticket.priority} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            {ticket.children && ticket.children.length > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <GitBranch className="h-3 w-3" />
                {ticket.children.length}
              </span>
            )}
          </div>
          {ticket.assignee && (
            <UserAvatar name={ticket.assignee.name} size="sm" />
          )}
        </div>
      </Card>
    </div>
  );
}
