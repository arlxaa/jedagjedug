import { useCallback, useEffect, useRef, useState } from 'react'
import type { AudioFeatures } from '../../types.ts'
import { AnalyserEngine } from './analyser.ts'
import { createAudioSource } from './sources.ts'
import type { AudioSource } from '../../types.ts'

const ZERO: AudioFeatures = { bass: 0, mid: 0, treble: 0, energy: 0, beat: false }

export type AudioStatus = 'idle' | 'starting' | 'running' | 'silent' | 'error'

/**
 * Manages the audio source + analyser. Exposes:
 *  - status, the current source id, and any error
 *  - start(id) / stop() / switchTo(id)
 *  - getFeatures(): a stable function the Renderer polls each frame
 *  - a `silent` flag that flips true after ~3s of silence (mic-fallback prompt)
 */
export function useAudioEngine(sensitivity: number, gain = 1) {
  const engineRef = useRef(new AnalyserEngine())
  const sourceRef = useRef<AudioSource | null>(null)
  const featuresRef = useRef<AudioFeatures>(ZERO)

  const [status, setStatus] = useState<AudioStatus>('idle')
  const [sourceId, setSourceId] = useState<'tab' | 'mic' | null>(null)
  const [silent, setSilent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep the beat sensitivity in sync.
  useEffect(() => {
    engineRef.current.setSensitivity(sensitivity)
  }, [sensitivity])

  // Keep the loudness gain in sync.
  useEffect(() => {
    engineRef.current.setGain(gain)
  }, [gain])

  const getFeatures = useCallback(() => {
    featuresRef.current = engineRef.current.read(performance.now())
    return featuresRef.current
  }, [])

  const stop = useCallback(() => {
    sourceRef.current?.stop()
    engineRef.current.detach()
    sourceRef.current = null
    setStatus('idle')
    setSourceId(null)
    setSilent(false)
  }, [])

  const start = useCallback(async (id: 'tab' | 'mic') => {
    setError(null)
    setSilent(false)
    setStatus('starting')
    try {
      sourceRef.current?.stop()
      const src = createAudioSource(id)
      const stream = await src.start()
      sourceRef.current = src
      engineRef.current.onSilence(() => {
        setSilent(true)
        setStatus('silent')
      })
      await engineRef.current.attach(stream)
      // If the user stops the share from the browser UI, reflect it.
      stream.getTracks().forEach((t) => {
        t.onended = () => stop()
      })
      setSourceId(id)
      setStatus('running')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown'
      setError(msg)
      setStatus('error')
    }
  }, [stop])

  const switchTo = useCallback(
    async (id: 'tab' | 'mic') => {
      await start(id)
    },
    [start],
  )

  // Cleanup on unmount.
  useEffect(() => () => stop(), [stop])

  return { status, sourceId, silent, error, start, stop, switchTo, getFeatures }
}
