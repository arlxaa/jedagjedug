import { create } from 'zustand'

export interface NowPlaying {
  title: string
  artist: string
  coverUrl?: string
  trackId?: string
}

interface PlayerState {
  deviceId: string | null
  isReady: boolean
  isPlaying: boolean
  shuffle: boolean
  volume: number
  nowPlaying: NowPlaying | null
  set: (p: Partial<PlayerState>) => void
}

export const usePlayer = create<PlayerState>((set) => ({
  deviceId: null,
  isReady: false,
  isPlaying: false,
  shuffle: false,
  volume: 0.8,
  nowPlaying: null,
  set: (p) => set(p),
}))
