import { useEffect, useRef, useState } from 'react'
import { Backdrop } from '../Backdrop.tsx'
import { Button, Card } from '../../components/ui.tsx'
import { handleCallback } from '../../features/auth/pkce.ts'
import { useAuth } from '../../features/auth/authStore.ts'

export function Callback({ onDone }: { onDone: (to: string) => void }) {
  const setTokens = useAuth((s) => s.setTokens)
  const setProfile = useAuth((s) => s.setProfile)
  const setError = useAuth((s) => s.setError)
  const [msg, setMsg] = useState('Connecting to Spotify…')
  const [failed, setFailed] = useState(false)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const err = params.get('error')

    if (err) {
      setError(err)
      setMsg(`Spotify said: ${err}`)
      setFailed(true)
      return
    }
    if (!code) {
      setMsg('No authorization code found.')
      setFailed(true)
      return
    }

    ;(async () => {
      try {
        const tokens = await handleCallback(code)
        setTokens(tokens)
        // Fetch profile (also tells us Premium vs Free).
        const res = await fetch('https://api.spotify.com/v1/me', {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        })
        if (res.ok) setProfile(await res.json())
        // Strip the ?code=… from the URL without changing the path, THEN let
        // the router navigate (navigate() no-ops if the path already matches,
        // which previously left us stuck on this screen).
        window.history.replaceState({}, '', '/callback')
        onDone('/player')
      } catch (e) {
        const m = e instanceof Error ? e.message : 'unknown'
        setError(m)
        setMsg(`Couldn’t finish sign-in (${m}).`)
        setFailed(true)
      }
    })()
  }, [onDone, setError, setProfile, setTokens])

  return (
    <Backdrop>
      <main className="min-h-screen grid place-items-center px-6">
        <Card className="text-center max-w-md">
          <p className="eyebrow mb-3">{failed ? 'Sign-in failed' : 'Connecting'}</p>
          <p className="text-lg text-[var(--text)]">{msg}</p>
          {failed && (
            <div className="mt-6">
              <Button accent="cyan" onClick={() => onDone('/')}>
                Back to start
              </Button>
            </div>
          )}
        </Card>
      </main>
    </Backdrop>
  )
}
