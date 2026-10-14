import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PaletteMode } from '../types.ts'
import { prefersReducedMotion } from '../lib/platform.ts'

interface PrefsState {
  calmMode: boolean
  source: 'tab' | 'mic' | null
  paletteMode: PaletteMode
  sensitivity: number // 1.0 .. 2.2 (beat detector threshold multiplier)
  gain: number // 1.0 .. 3.0 (mic loudness boost for the lights)
  seenPhotoWarning: boolean
  set: (p: Partial<PrefsState>) => void
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      // Reduced-motion users start in Calm mode by default.
      calmMode: prefersReducedMotion(),
      source: null,
      paletteMode: 'cover',
      sensitivity: 1.3,
      gain: 1.4,
      seenPhotoWarning: false,
      set: (p) => set(p),
    }),
    { name: 'club-lights-prefs' },
  ),
)
