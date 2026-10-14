import { useAuth } from '../auth/authStore.ts'

const API = 'https://api.spotify.com/v1'

async function authed(path: string, init?: RequestInit): Promise<Response> {
  const token = await useAuth.getState().getFreshToken()
  if (!token) throw new Error('not-authed')
  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
}

export interface Track {
  id: string
  title: string
  artist: string
  coverUrl?: string
  uri: string
}

export interface Playlist {
  id: string
  name: string
  coverUrl?: string
  trackCount: number
}

export async function searchTracks(q: string): Promise<Track[]> {
  if (!q.trim()) return []
  const res = await authed(`/search?type=track&limit=20&q=${encodeURIComponent(q)}`)
  if (!res.ok) return []
  const json = await res.json()
  return (json.tracks?.items ?? []).map(toTrack)
}

export async function myPlaylists(): Promise<Playlist[]> {
  const res = await authed('/me/playlists?limit=30')
  if (!res.ok) return []
  const json = await res.json()
  return (json.items ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    name: p.name as string,
    coverUrl: (p.images as { url: string }[] | undefined)?.[0]?.url,
    trackCount: (p.tracks as { total: number } | undefined)?.total ?? 0,
  }))
}

export async function playlistTracks(id: string): Promise<Track[]> {
  const res = await authed(`/playlists/${id}/tracks?limit=50`)
  if (!res.ok) return []
  const json = await res.json()
  return (json.items ?? [])
    .map((i: Record<string, unknown>) => i.track)
    .filter(Boolean)
    .map(toTrack)
}

/** Start playback of a track (or a context of tracks) on our device.
 * We transfer playback to the web device FIRST so the SDK controls and the
 * audio both land here (otherwise Spotify may keep playing on another device
 * and our play/pause buttons appear to do nothing). */
export async function playTracks(deviceId: string, uris: string[], offset = 0): Promise<void> {
  // Best-effort transfer; ignore failure (device may already be active).
  try {
    await transferPlayback(deviceId)
  } catch {
    /* ignore */
  }
  await authed(`/me/player/play?device_id=${deviceId}`, {
    method: 'PUT',
    body: JSON.stringify({ uris, offset: { position: offset } }),
  })
}

export async function pause(deviceId: string): Promise<void> {
  await authed(`/me/player/pause?device_id=${deviceId}`, { method: 'PUT' })
}

export async function resume(deviceId: string): Promise<void> {
  await authed(`/me/player/play?device_id=${deviceId}`, { method: 'PUT' })
}

export async function next(deviceId: string): Promise<void> {
  await authed(`/me/player/next?device_id=${deviceId}`, { method: 'POST' })
}

export async function setVolume(deviceId: string, percent: number): Promise<void> {
  await authed(
    `/me/player/volume?volume_percent=${Math.round(percent * 100)}&device_id=${deviceId}`,
    { method: 'PUT' },
  )
}

/** Transfer active playback to our browser device. */
export async function transferPlayback(deviceId: string): Promise<void> {
  await authed('/me/player', {
    method: 'PUT',
    body: JSON.stringify({ device_ids: [deviceId], play: false }),
  })
}

/** Toggle Spotify shuffle on the active device. */
export async function setShuffle(deviceId: string, on: boolean): Promise<void> {
  await authed(`/me/player/shuffle?state=${on}&device_id=${deviceId}`, { method: 'PUT' })
}

/** Add a track to the Spotify playback queue. */
export async function addToQueue(deviceId: string, uri: string): Promise<void> {
  await authed(`/me/player/queue?uri=${encodeURIComponent(uri)}&device_id=${deviceId}`, {
    method: 'POST',
  })
}

/** Read the current queue (currently playing + upcoming). */
export async function getQueue(): Promise<Track[]> {
  const res = await authed('/me/player/queue')
  if (!res.ok) return []
  const json = await res.json()
  return (json.queue ?? []).slice(0, 20).map(toTrack)
}

function toTrack(t: Record<string, unknown>): Track {
  const artists = (t.artists as { name: string }[] | undefined) ?? []
  const album = t.album as { images?: { url: string }[] } | undefined
  return {
    id: t.id as string,
    title: t.name as string,
    artist: artists.map((a) => a.name).join(', '),
    coverUrl: album?.images?.[0]?.url,
    uri: t.uri as string,
  }
}
