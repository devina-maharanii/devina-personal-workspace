import { create } from 'zustand';

export interface RealtimeActivity {
  id: string;
  action: string;
  createdAt: string | Date;
  user?: {
    name?: string | null;
    email: string;
    avatarUrl?: string | null;
  } | null;
}

interface RealtimeStore {
  activities: RealtimeActivity[];
  addActivity: (activity: RealtimeActivity) => void;
  creditsRemaining: number | null;
  setCreditsRemaining: (credits: number) => void;
}

export const useRealtimeStore = create<RealtimeStore>((set) => ({
  activities: [],
  addActivity: (activity) => 
    set((state) => {
      const newActivities = [activity, ...state.activities].slice(0, 50); // Keep max 50
      return { activities: newActivities };
    }),
  creditsRemaining: null,
  setCreditsRemaining: (credits) => set({ creditsRemaining: credits }),
}));
