'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateTicketSchema, ORDERED_STATUSES, STATUS_LABELS, Priority, PRIORITY_LABELS } from '@taskboard/shared-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUIStore } from '@/store/ui.store';
import { useCreateTicket, useTickets } from '@/hooks/useTickets';
import { useUsers } from '@/hooks/useUsers';

type FormValues = z.infer<typeof CreateTicketSchema>;

const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const TEAM_TAGS = ['backend', 'frontend', 'devops', 'mobile', 'data'];

export function CreateTicketModal() {
  const { createModalOpen, closeCreateModal } = useUIStore();
  const createTicket = useCreateTicket();
  const { data: users = [] } = useUsers();
  const { data: allTickets = [] } = useTickets({ parentTicketId: undefined });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(CreateTicketSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'BACKLOG',
      priority: 'MEDIUM',
      assigneeId: null,
      teamTag: null,
      parentTicketId: null,
    },
  });

  const onSubmit = async (data: FormValues) => {
    await createTicket.mutateAsync(data);
    reset();
    closeCreateModal();
  };

  const handleClose = () => {
    reset();
    closeCreateModal();
  };

  // Only show root-level tickets as potential parents
  const potentialParents = allTickets.filter((t) => !t.parentTicketId);

  return (
    <Dialog open={createModalOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Ticket</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
            <Input
              id="title"
              placeholder="Short, descriptive title"
              {...register('title')}
              autoFocus
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What needs to be done?"
              rows={3}
              {...register('description')}
            />
          </div>

          {/* Status + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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

          {/* Assignee + Team row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Assignee</Label>
              <Controller
                name="assigneeId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? 'none'} onValueChange={(v) => field.onChange(v === 'none' ? null : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
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
                    <SelectTrigger>
                      <SelectValue placeholder="No team" />
                    </SelectTrigger>
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

          {/* Parent ticket */}
          <div className="space-y-1.5">
            <Label>Parent Ticket (optional)</Label>
            <Controller
              name="parentTicketId"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? 'none'} onValueChange={(v) => field.onChange(v === 'none' ? null : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="None (root ticket)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (root ticket)</SelectItem>
                    {potentialParents.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="truncate max-w-[300px]">{t.title}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Ticket'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
