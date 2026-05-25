import { create } from 'zustand';
import { Ticket, TicketFilters } from '@taskboard/shared-types';

interface UIStore {
  // Modals
  createModalOpen: boolean;
  selectedTicketId: string | null;
  drawerOpen: boolean;

  // Filters
  filters: TicketFilters;

  // Actions
  openCreateModal: () => void;
  closeCreateModal: () => void;
  openTicketDrawer: (ticketId: string) => void;
  closeTicketDrawer: () => void;
  setFilters: (filters: Partial<TicketFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: TicketFilters = {
  search: '',
  status: undefined,
  priority: undefined,
  assigneeId: undefined,
  teamTag: undefined,
  parentTicketId: null, // show only root tickets on board
};

export const useUIStore = create<UIStore>((set) => ({
  createModalOpen: false,
  selectedTicketId: null,
  drawerOpen: false,
  filters: defaultFilters,

  openCreateModal: () => set({ createModalOpen: true }),
  closeCreateModal: () => set({ createModalOpen: false }),

  openTicketDrawer: (ticketId) => set({ selectedTicketId: ticketId, drawerOpen: true }),
  closeTicketDrawer: () => set({ drawerOpen: false, selectedTicketId: null }),

  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  resetFilters: () => set({ filters: defaultFilters }),
}));
