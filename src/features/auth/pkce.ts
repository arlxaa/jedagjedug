// Spotify Authorization Code + PKCE flow. Public client — NO secret shipped.
// Tokens are kept in memory + sessionStorage only (never persisted to disk /
// never sent to a server we control).

const AUTH_URL = 'https://accounts.spotify.com/authorize'
const TOKEN_URL = 'https://accounts.spotify.com/api/token'

const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'playlist-read-private',
].join(' ')

const VERIFIER_KEY = 'cl_pkce_verifier'

export interface Tokens {
  accessToken: string
  refreshToken?: string
  expiresAt: number // epoch ms
}

export function clientId(): string {
  return import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? ''
}

export function redirectUri(): string {
  const override = import.meta.env.VITE_SPOTIFY_REDIRECT_URI
  if (override) return override
  return `${window.location.origin}/callback`
}

export function isConfigured(): boolean {
  return clientId().length > 0
}

// ---- PKCE primitives ----

function randomString(len: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

async function sha256(input: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
}

function base64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// ---- Flow ----

/** Build the authorize URL and redirect the browser to Spotify. */
export async function beginLogin(): Promise<void> {
  const verifier = randomString(64)
  sessionStorage.setItem(VERIFIER_KEY, verifier)
  const challenge = base64url(await sha256(verifier))
  const params = new URLSearchParams({
    client_id: clientId(),
    response_type: 'code',
    redirect_uri: redirectUri(),
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: SCOPES,
  })
  window.location.href = `${AUTH_URL}?${params.toString()}`
}

/** Exchange the ?code= on the callback for tokens. */
export async function handleCallback(code: string): Promise<Tokens> {
  const verifier = sessionStorage.getItem(VERIFIER_KEY)
  if (!verifier) throw new Error('missing-verifier')
  const body = new URLSearchParams({
    client_id: clientId(),
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri(),
    code_verifier: verifier,
  })
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`token-exchange-failed:${res.status}`)
  const json = await res.json()
  sessionStorage.removeItem(VERIFIER_KEY)
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  }
}

/** Refresh the access token with a stored refresh token. */
export async function refresh(refreshToken: string): Promise<Tokens> {
  const body = new URLSearchParams({
    client_id: clientId(),
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`token-refresh-failed:${res.status}`)
  const json = await res.json()
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? refreshToken,
    expiresAt: Date.now() + json.expires_in * 1000,
  }
}
