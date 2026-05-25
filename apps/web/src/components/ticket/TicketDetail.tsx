'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UpdateTicketSchema,
  ORDERED_STATUSES,
  STATUS_LABELS,
  Priority,
  PRIORITY_LABELS,
  Ticket,
} from '@taskboard/shared-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PriorityBadge, StatusBadge, UserAvatar } from '@/components/ui/display-helpers';
import { CommentSection } from './CommentSection';
import { useUpdateTicket, useDeleteTicket } from '@/hooks/useTickets';
import { useUsers } from '@/hooks/useUsers';
import { useUIStore } from '@/store/ui.store';
import { GitBranch, Pencil, Trash2, X, ExternalLink, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type FormValues = z.infer<typeof UpdateTicketSchema>;

const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const TEAM_TAGS = ['backend', 'frontend', 'devops', 'mobile', 'data'];

interface TicketDetailProps {
  ticket: Ticket;
}

export function TicketDetail({ ticket }: TicketDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();
  const { data: users = [] } = useUsers();
  const { openTicketDrawer, closeTicketDrawer } = useUIStore();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(UpdateTicketSchema),
    defaultValues: {
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      assigneeId: ticket.assigneeId,
      teamTag: ticket.teamTag,
      parentTicketId: ticket.parentTicketId,
    },
  });

  const onSubmit = async (data: FormValues) => {
    await updateTicket.mutateAsync({ id: ticket.id, data });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this ticket? This cannot be undone.')) return;
    await deleteTicket.mutateAsync(ticket.id);
    closeTicketDrawer();
  };

  const handleCancelEdit = () => {
    reset();
    setIsEditing(false);
  };

  const createdAt = new Date(ticket.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          {ticket.teamTag && (
            <Badge variant="outline" className="text-xs">{ticket.teamTag}</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!isEditing && (
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(true)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1">
        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input {...register('title')} autoFocus />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea {...register('description')} rows={4} className="resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ORDERED_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Assignee</Label>
                <Controller
                  name="assigneeId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? 'none'} onValueChange={(v) => field.onChange(v === 'none' ? null : v)}>
                      <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Team</Label>
                <Controller
                  name="teamTag"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? 'none'} onValueChange={(v) => field.onChange(v === 'none' ? null : v)}>
                      <SelectTrigger><SelectValue placeholder="No team" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No team</SelectItem>
                        {TEAM_TAGS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <>
            {/* Title */}
            <h2 className="text-lg font-semibold leading-snug">{ticket.title}</h2>

            {/* Description */}
            {ticket.description ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">No description</p>
            )}

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Assignee</p>
                {ticket.assignee ? (
                  <div className="flex items-center gap-1.5">
                    <UserAvatar name={ticket.assignee.name} size="sm" />
                    <span className="text-sm">{ticket.assignee.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground/60">Unassigned</span>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Created</p>
                <span>{createdAt}</span>
              </div>
            </div>

            <Separator />

            {/* Parent ticket */}
            {ticket.parentTicket && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium">Parent</p>
                  <button
                    onClick={() => openTicketDrawer(ticket.parentTicket!.id)}
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {ticket.parentTicket.title}
                  </button>
                </div>
                <Separator />
              </>
            )}

            {/* Child tickets */}
            {ticket.children && ticket.children.length > 0 && (
              <>
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                      Sub-tickets ({ticket.children.length})
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {ticket.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => openTicketDrawer(child.id)}
                        className="w-full flex items-center justify-between gap-2 text-left px-2.5 py-2 rounded-md hover:bg-muted transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate">{child.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <StatusBadge status={child.status} />
                          <PriorityBadge priority={child.priority} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}
          </>
        )}

        {/* Comments */}
        {!isEditing && <CommentSection ticketId={ticket.id} />}
      </div>
    </div>
  );
}
