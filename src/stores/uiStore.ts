import { create } from "zustand";

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
}

interface UIState {
  sidebarOpen: boolean; // Mobile responsive drawer state
  sidebarCollapsed: boolean; // Desktop collapsed state
  commandPaletteOpen: boolean;
  upgradeModalOpen: boolean;
  notifications: ToastNotification[];
  billingInterval: "monthly" | "annually";
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void; // Toggles desktop sidebar collapse
  toggleMobileSidebar: () => void; // Toggles mobile overlay drawer
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  openUpgradeModal: () => void;
  closeUpgradeModal: () => void;
  addNotification: (notification: Omit<ToastNotification, "id">) => void;
  dismissNotification: (id: string) => void;
  setBillingInterval: (interval: "monthly" | "annually") => void;
}

/**
 * Zustand state store governing interface elements, including drawer states,
 * shortcut pallets, plan modals, and notification caches.
 */
export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  upgradeModalOpen: false,
  notifications: [],
  billingInterval: "monthly",
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleMobileSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  openUpgradeModal: () => set({ upgradeModalOpen: true }),
  closeUpgradeModal: () => set({ upgradeModalOpen: false }),
  addNotification: (notification) =>
    set((state) => {
      const id = Math.random().toString(36).substring(2, 9);
      return {
        notifications: [...state.notifications, { ...notification, id }],
      };
    }),
  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  setBillingInterval: (interval) => set({ billingInterval: interval }),
}));

export default useUIStore;
