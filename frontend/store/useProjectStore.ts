'use client';

import { create } from 'zustand';

interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  details?: unknown;
}

interface ProjectStore {
  selectedFilePath: string | null;
  activityState: 'idle' | 'connected' | 'reconnecting' | 'disconnected';
  logs: ActivityItem[];
  setSelectedFilePath: (value: string | null) => void;
  setActivityState: (value: ProjectStore['activityState']) => void;
  hydrateLogs: (logs: ActivityItem[]) => void;
  pushLog: (log: ActivityItem) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  selectedFilePath: null,
  activityState: 'idle',
  logs: [],
  setSelectedFilePath: (value) => set({ selectedFilePath: value }),
  setActivityState: (value) => set({ activityState: value }),
  hydrateLogs: (logs) => set({ logs }),
  pushLog: (log) => set((state) => ({ logs: [log, ...state.logs].slice(0, 100) })),
}));