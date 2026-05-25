'use client';

import { useCallback, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Ticket, TicketStatus } from '@taskboard/shared-types';
import { KanbanColumn } from './KanbanColumn';
import { TicketCard } from './TicketCard';
import { FilterBar } from './FilterBar';
import { CreateTicketModal } from '@/components/ticket/CreateTicketModal';
import { TicketDrawer } from '@/components/ticket/TicketDrawer';
import { useBoard, useMoveTicket } from '@/hooks/useTickets';
import { useUIStore } from '@/store/ui.store';
import { useBoardRealtime } from '@/hooks/useRealtime';

export function BoardView() {
  const { filters } = useUIStore();
  const { columns, isLoading, isError } = useBoard(filters);
  const moveTicket = useMoveTicket();
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  // Enable realtime sync
  useBoardRealtime();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const findColumnForTicket = useCallback(
    (ticketId: string): TicketStatus | null => {
      for (const col of columns) {
        if (col.tickets.some((t) => t.id === ticketId)) return col.status;
      }
      return null;
    },
    [columns],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const ticket = event.active.data.current?.ticket as Ticket | undefined;
      if (ticket) setActiveTicket(ticket);
    },
    [],
  );

  const handleDragOver = useCallback(
    (_event: DragOverEvent) => {
      // Visual feedback is handled by DnD Kit internally via the droppable isOver state
    },
    [],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTicket(null);
      const { active, over } = event;
      if (!over) return;

      const ticketId = active.id as string;
      const overId = over.id as string;

      // Determine target column
      let targetStatus: TicketStatus | null = null;
      let targetIndex = 0;

      // Dropped onto a column droppable
      if (overId.startsWith('column-')) {
        targetStatus = overId.replace('column-', '') as TicketStatus;
        const targetCol = columns.find((c) => c.status === targetStatus);
        targetIndex = targetCol ? targetCol.tickets.length : 0;
      } else {
        // Dropped onto another ticket
        targetStatus = findColumnForTicket(overId);
        if (targetStatus) {
          const targetCol = columns.find((c) => c.status === targetStatus);
          if (targetCol) {
            targetIndex = targetCol.tickets.findIndex((t) => t.id === overId);
            if (targetIndex === -1) targetIndex = targetCol.tickets.length;
          }
        }
      }

      if (!targetStatus) return;

      const sourceStatus = findColumnForTicket(ticketId);

      // No-op if dropped in same position
      if (sourceStatus === targetStatus) {
        const col = columns.find((c) => c.status === targetStatus)!;
        const oldIndex = col.tickets.findIndex((t) => t.id === ticketId);
        if (oldIndex === targetIndex) return;
      }

      moveTicket.mutate({
        id: ticketId,
        data: { status: targetStatus, sortOrder: targetIndex },
      });
    },
    [columns, findColumnForTicket, moveTicket],
  );

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Failed to load board. Is the API running?
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <FilterBar />

      <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="kanban-board group">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="kanban-column">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse mb-3" />
                    <div className="flex flex-col gap-2">
                      {Array.from({ length: 3 }).map((_, j) => (
                        <div key={j} className="h-24 bg-muted rounded-lg animate-pulse" />
                      ))}
                    </div>
                  </div>
                ))
              : columns.map((col) => (
                  <KanbanColumn key={col.status} status={col.status} tickets={col.tickets} />
                ))}
          </div>

          <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
            {activeTicket && <TicketCard ticket={activeTicket} isDragOverlay />}
          </DragOverlay>
        </DndContext>
      </div>

      <CreateTicketModal />
      <TicketDrawer />
    </div>
  );
}
