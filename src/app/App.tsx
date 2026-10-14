import { useState } from 'react'
import { useRoute } from './router.ts'
import { Landing } from './screens/Landing.tsx'
import { Callback } from './screens/Callback.tsx'
import { Player } from './screens/Player.tsx'
import { DanceFloor } from './screens/DanceFloor.tsx'
import { Settings } from './screens/Settings.tsx'
import { PhotoWarning } from './PhotoWarning.tsx'
import { beginLogin } from '../features/auth/pkce.ts'
import { useAuth } from '../features/auth/authStore.ts'
import { usePrefs } from '../store/prefsStore.ts'
import { useSpotifyPlayer } from '../features/player/useSpotifyPlayer.ts'

export function App() {
  const [path, navigate] = useRoute()
  const { seenPhotoWarning, set } = usePrefs()
  const authStatus = useAuth((s) => s.status)
  const [pendingLights, setPendingLights] = useState(false)

  // Mount the Spotify player ONCE at the app root so it stays connected when
  // moving between the player and the dance floor (otherwise the SDK device
  // disconnects on navigation and playback stops).
  useSpotifyPlayer()

  // Gate the first entry to the dance floor behind the photosensitivity notice.
  function goToLights() {
    if (seenPhotoWarning) navigate('/floor')
    else setPendingLights(true)
  }

  if (pendingLights) {
    return (
      <PhotoWarning
        onCalm={() => {
          set({ calmMode: true, seenPhotoWarning: true })
          setPendingLights(false)
          navigate('/floor')
        }}
        onAccept={() => {
          set({ seenPhotoWarning: true })
          setPendingLights(false)
          navigate('/floor')
        }}
      />
    )
  }

  const connected = authStatus === 'ready'

  switch (path) {
    case '/callback':
      return <Callback onDone={navigate} />
    case '/player':
      return connected ? <Player onLights={goToLights} /> : <Landing onConnect={() => void beginLogin()} />
    case '/floor':
      return connected ? <DanceFloor onExit={() => navigate('/player')} /> : <Landing onConnect={() => void beginLogin()} />
    case '/settings':
      return connected ? <Settings onBack={() => navigate('/player')} /> : <Landing onConnect={() => void beginLogin()} />
    default:
      return (
        <Landing
          onConnect={() => void beginLogin()}
        />
      )
  }
}
