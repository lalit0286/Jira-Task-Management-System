'use client';

import { LayoutDashboard, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/ui.store';

export function Header() {
  const openCreateModal = useUIStore((s) => s.openCreateModal);

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2">
        <LayoutDashboard className="h-5 w-5 text-primary" />
        <span className="font-semibold text-foreground tracking-tight">TaskBoard</span>
        <span className="text-muted-foreground text-sm ml-1">/ Board</span>
      </div>
      <Button size="sm" onClick={openCreateModal} className="gap-1.5">
        <Plus className="h-4 w-4" />
        New Ticket
      </Button>
    </header>
  );
}
