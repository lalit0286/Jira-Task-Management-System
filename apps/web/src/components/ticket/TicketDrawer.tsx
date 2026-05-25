'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useUIStore } from '@/store/ui.store';
import { useTicket } from '@/hooks/useTickets';
import { TicketDetail } from './TicketDetail';
import { Skeleton } from '@/components/ui/skeleton';

function TicketDrawerContent({ ticketId }: { ticketId: string }) {
  const { data: ticket, isLoading, isError } = useTicket(ticketId);

  if (isLoading) {
    return (
      <div className="space-y-4 mt-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="mt-8 text-center text-sm text-muted-foreground">
        Failed to load ticket.
      </div>
    );
  }

  return <TicketDetail ticket={ticket} />;
}

export function TicketDrawer() {
  const { drawerOpen, selectedTicketId, closeTicketDrawer } = useUIStore();

  return (
    <Sheet open={drawerOpen} onOpenChange={(open) => !open && closeTicketDrawer()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col overflow-hidden p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <SheetTitle className="text-base">Ticket Details</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-hidden px-6 py-4">
          {selectedTicketId && <TicketDrawerContent ticketId={selectedTicketId} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
