'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/ui.store';
import { useUsers } from '@/hooks/useUsers';
import { ORDERED_STATUSES, STATUS_LABELS, Priority, PRIORITY_LABELS } from '@taskboard/shared-types';
import { useCallback } from 'react';

const TEAM_TAGS = ['backend', 'frontend', 'devops', 'mobile', 'data'];
const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export function FilterBar() {
  const { filters, setFilters, resetFilters } = useUIStore();
  const { data: users = [] } = useUsers();

  const hasActiveFilters =
    !!filters.search || !!filters.status || !!filters.priority || !!filters.assigneeId || !!filters.teamTag;

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setFilters({ search: e.target.value }),
    [setFilters],
  );

  return (
    <div className="flex items-center gap-2 px-6 py-3 border-b bg-background flex-wrap">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tickets..."
          className="pl-8 h-8 text-sm"
          value={filters.search || ''}
          onChange={handleSearch}
        />
      </div>

      <Select
        value={filters.status || 'all'}
        onValueChange={(v) => setFilters({ status: v === 'all' ? undefined : (v as any) })}
      >
        <SelectTrigger className="h-8 w-[130px] text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {ORDERED_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.priority || 'all'}
        onValueChange={(v) => setFilters({ priority: v === 'all' ? undefined : (v as any) })}
      >
        <SelectTrigger className="h-8 w-[120px] text-xs">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          {PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.assigneeId || 'all'}
        onValueChange={(v) => setFilters({ assigneeId: v === 'all' ? undefined : v })}
      >
        <SelectTrigger className="h-8 w-[140px] text-xs">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All assignees</SelectItem>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.teamTag || 'all'}
        onValueChange={(v) => setFilters({ teamTag: v === 'all' ? undefined : v })}
      >
        <SelectTrigger className="h-8 w-[120px] text-xs">
          <SelectValue placeholder="Team" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All teams</SelectItem>
          {TEAM_TAGS.map((t) => (
            <SelectItem key={t} value={t}>{t}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 px-2 text-xs gap-1 text-muted-foreground">
          <X className="h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
