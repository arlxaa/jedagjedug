import { create } from 'zustand'
import type { Tokens } from './pkce.ts'
import { refresh } from './pkce.ts'

export interface SpotifyProfile {
  id: string
  display_name: string
  email?: string
  product?: string // 'premium' | 'free' | ...
  images?: { url: string }[]
}

interface AuthState {
  status: 'anon' | 'authing' | 'ready' | 'error'
  tokens: Tokens | null
  profile: SpotifyProfile | null
  error?: string
  setTokens: (t: Tokens) => void
  setProfile: (p: SpotifyProfile) => void
  setError: (e: string) => void
  logout: () => void
  /** Return a valid access token, refreshing if near expiry. */
  getFreshToken: () => Promise<string | null>
}

const SS_KEY = 'cl_tokens'

function loadTokens(): Tokens | null {
  try {
    const raw = sessionStorage.getItem(SS_KEY)
    return raw ? (JSON.parse(raw) as Tokens) : null
  } catch {
    return null
  }
}

function saveTokens(t: Tokens | null) {
  try {
    if (t) sessionStorage.setItem(SS_KEY, JSON.stringify(t))
    else sessionStorage.removeItem(SS_KEY)
  } catch {
    /* ignore */
  }
}

export const useAuth = create<AuthState>((set, get) => ({
  status: loadTokens() ? 'ready' : 'anon',
  tokens: loadTokens(),
  profile: null,

  setTokens: (t) => {
    saveTokens(t)
    set({ tokens: t, status: 'ready', error: undefined })
  },
  setProfile: (p) => set({ profile: p }),
  setError: (e) => set({ status: 'error', error: e }),
  logout: () => {
    saveTokens(null)
    set({ tokens: null, profile: null, status: 'anon' })
  },

  getFreshToken: async () => {
    const t = get().tokens
    if (!t) return null
    // Refresh if < 60s left.
    if (t.expiresAt - Date.now() > 60_000) return t.accessToken
    if (!t.refreshToken) return t.accessToken
    try {
      const next = await refresh(t.refreshToken)
      saveTokens(next)
      set({ tokens: next })
      return next.accessToken
    } catch {
      return t.accessToken
    }
  },
}))
