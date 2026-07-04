import { create } from 'zustand';

interface VideoStore {
  activeRoomId: string | null;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
}

export const useVideoStore = create<VideoStore>((set) => ({
  activeRoomId: null,
  joinRoom: (roomId: string) => set({ activeRoomId: roomId }),
  leaveRoom: () => set({ activeRoomId: null }),
}));
