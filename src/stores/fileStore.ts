import { create } from "zustand";

interface FileStore {
  viewMode: "grid" | "list";
  setViewMode: (viewMode: "grid" | "list") => void;
}

/**
 * Zustand store to manage frontend file view preferences (Grid vs. List)
 * safely without SSR hydration mismatch errors.
 */
export const useFileStore = create<FileStore>((set) => ({
  viewMode: "grid",
  setViewMode: (viewMode) => set({ viewMode }),
}));
