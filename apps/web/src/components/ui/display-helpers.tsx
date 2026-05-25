import { Priority, TicketStatus, PRIORITY_LABELS, STATUS_LABELS } from '@taskboard/shared-types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const priorityDot: Record<Priority, string> = {
  LOW: 'bg-slate-400',
  MEDIUM: 'bg-blue-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-red-500',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant={priority as any} className="gap-1 text-xs">
      <span className={cn('h-1.5 w-1.5 rounded-full', priorityDot[priority])} />
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge variant={status as any} className="text-xs">
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function UserAvatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    'bg-red-100 text-red-700',
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700',
    'bg-orange-100 text-orange-700',
    'bg-pink-100 text-pink-700',
  ];
  const color = colors[name.charCodeAt(0) % colors.length];

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium',
        size === 'sm' ? 'h-6 w-6 text-xs' : 'h-8 w-8 text-sm',
        color,
      )}
      title={name}
    >
      {initials}
    </span>
  );
}
