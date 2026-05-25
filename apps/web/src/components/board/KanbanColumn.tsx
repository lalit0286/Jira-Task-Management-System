'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Ticket, TicketStatus, STATUS_LABELS } from '@taskboard/shared-types';
import { TicketCard } from './TicketCard';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';

const columnHeaderColors: Record<TicketStatus, string> = {
  BACKLOG: 'text-slate-500',
  TODO: 'text-indigo-500',
  IN_PROGRESS: 'text-blue-500',
  REVIEW: 'text-purple-500',
  DONE: 'text-green-500',
};

const columnDotColors: Record<TicketStatus, string> = {
  BACKLOG: 'bg-slate-400',
  TODO: 'bg-indigo-400',
  IN_PROGRESS: 'bg-blue-500',
  REVIEW: 'bg-purple-500',
  DONE: 'bg-green-500',
};

interface KanbanColumnProps {
  status: TicketStatus;
  tickets: Ticket[];
}

export function KanbanColumn({ status, tickets }: KanbanColumnProps) {
  const openCreateModal = useUIStore((s) => s.openCreateModal);

  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { type: 'column', status },
  });

  const ticketIds = tickets.map((t) => t.id);

  return (
    <div className="kanban-column flex flex-col gap-2">
      {/* Column header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', columnDotColors[status])} />
          <span className={cn('text-xs font-semibold uppercase tracking-wide', columnHeaderColors[status])}>
            {STATUS_LABELS[status]}
          </span>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 font-medium">
            {tickets.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100"
          onClick={openCreateModal}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col gap-2 min-h-[120px] rounded-lg p-1.5 transition-colors duration-150',
          isOver ? 'bg-primary/5 ring-1 ring-primary/20' : 'bg-muted/30',
        )}
      >
        <SortableContext items={ticketIds} strategy={verticalListSortingStrategy}>
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </SortableContext>

        {tickets.length === 0 && (
          <div className="flex items-center justify-center h-16 text-xs text-muted-foreground/50">
            Drop tickets here
          </div>
        )}
      </div>
    </div>
  );
}
