import { create } from 'zustand';

interface UserState {
  workSection: string;
  setWorkSection: (section: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  workSection: '',
  setWorkSection: (section) => set({ workSection: section }),
}));