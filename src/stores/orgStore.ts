import { create } from "zustand";

interface OrgState {
  activeOrgId: string | null;
  setActiveOrgId: (id: string) => void;
}

export const useOrgStore = create<OrgState>((set) => ({
  activeOrgId: null,
  setActiveOrgId: (id) => {
    if (typeof window !== "undefined") {
      document.cookie = `selected_org_id=${id}; path=/; max-age=31536000; SameSite=Lax`;
    }
    set({ activeOrgId: id });
  },
}));

export default useOrgStore;
