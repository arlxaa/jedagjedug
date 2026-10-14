import type { AudioSource } from '../../types.ts'
import { supportsTabCapture } from '../../lib/platform.ts'

/**
 * Desktop tab/screen capture WITH audio.
 * Risk: Spotify playback is DRM (Widevine); the captured audio track may be
 * silent even though the user ticked "share tab audio". The SilenceDetector
 * is the safety net that offers mic mode when that happens.
 */
export class TabAudioSource implements AudioSource {
  readonly id = 'tab' as const
  private stream: MediaStream | null = null

  async start(): Promise<MediaStream> {
    // video:true is required by most browsers to even offer the audio tickbox.
    const stream = await navigator.mediaDevices.getDisplayMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
      video: true,
    })
    if (stream.getAudioTracks().length === 0) {
      stream.getTracks().forEach((t) => t.stop())
      throw new Error('no-audio-track')
    }
    this.stream = stream
    return stream
  }

  stop(): void {
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
  }
}

/** Microphone capture. Works everywhere, picks up room noise. */
export class MicAudioSource implements AudioSource {
  readonly id = 'mic' as const
  private stream: MediaStream | null = null

  async start(): Promise<MediaStream> {
    // Keep the browser's audio processing ON (prevents the crunchy "comms"
    // capture mode) AND ask for a high-quality stereo 48kHz stream so the music
    // the mic hears is captured as cleanly as the hardware allows.
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 2,
      },
    })
    this.stream = stream
    return stream
  }

  stop(): void {
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
  }
}

export function createAudioSource(id: 'tab' | 'mic'): AudioSource {
  return id === 'tab' ? new TabAudioSource() : new MicAudioSource()
}

/** Best default source for this device. */
export function pickDefaultSource(): 'tab' | 'mic' {
  return supportsTabCapture() ? 'tab' : 'mic'
}
