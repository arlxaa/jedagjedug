import type { AudioFeatures } from '../../types.ts'
import { BeatDetector } from './beatDetector.ts'

/**
 * Turns a MediaStream into per-frame AudioFeatures.
 *
 * One shared AudioContext + AnalyserNode. On each read() we integrate the
 * frequency bins into bass/mid/treble bands, compute a smoothed energy, run
 * beat detection, and report silence for the mic-fallback prompt.
 */
export class AnalyserEngine {
  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private freq: Uint8Array<ArrayBuffer> = new Uint8Array(0)
  private readonly beat = new BeatDetector()

  private energySmooth = 0
  private silentSince: number | null = null
  private onSilent?: () => void
  private firedSilent = false

  /** How long of near-silence before we call onSilent (ms). */
  readonly silenceMs = 3000

  async attach(stream: MediaStream): Promise<void> {
    this.detach()
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    if (ctx.state === 'suspended') await ctx.resume()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.6
    const src = ctx.createMediaStreamSource(stream)
    src.connect(analyser)
    this.ctx = ctx
    this.analyser = analyser
    this.sourceNode = src
    this.freq = new Uint8Array(analyser.frequencyBinCount)
    this.silentSince = null
    this.firedSilent = false
    this.beat.reset()
  }

  detach(): void {
    try {
      this.sourceNode?.disconnect()
      this.analyser?.disconnect()
      void this.ctx?.close()
    } catch {
      /* ignore */
    }
    this.ctx = null
    this.analyser = null
    this.sourceNode = null
  }

  setSensitivity(v: number): void {
    this.beat.sensitivity = v
  }

  /** Loudness multiplier for the lights (1 = normal, >1 = react harder). */
  gain = 1

  setGain(v: number): void {
    this.gain = v
  }

  /** Register a callback fired once when ~silenceMs of near-silence passes. */
  onSilence(cb: () => void): void {
    this.onSilent = cb
  }

  /** Read features for the current frame. Returns zeros if not attached. */
  read(now: number): AudioFeatures {
    if (!this.analyser || !this.ctx) {
      return { bass: 0, mid: 0, treble: 0, energy: 0, beat: false }
    }
    this.analyser.getByteFrequencyData(this.freq)

    const nyquist = this.ctx.sampleRate / 2
    const binHz = nyquist / this.freq.length
    const g = this.gain
    const bass = clamp01(this.bandAvg(20, 150, binHz) * g)
    const mid = clamp01(this.bandAvg(150, 2000, binHz) * g)
    const treble = clamp01(this.bandAvg(2000, 16000, binHz) * g)

    const raw = (bass * 1.1 + mid + treble * 0.9) / 3
    this.energySmooth = this.energySmooth * 0.8 + raw * 0.2
    const energy = clamp01(this.energySmooth)

    const isBeat = this.beat.update(bass, now)

    // Silence tracking for the mic-fallback prompt.
    if (energy < 0.01) {
      if (this.silentSince === null) this.silentSince = now
      else if (!this.firedSilent && now - this.silentSince >= this.silenceMs) {
        this.firedSilent = true
        this.onSilent?.()
      }
    } else {
      this.silentSince = null
    }

    return {
      bass: clamp01(bass),
      mid: clamp01(mid),
      treble: clamp01(treble),
      energy,
      beat: isBeat,
      bpmEstimate: this.beat.bpm(),
    }
  }

  /** Average normalised magnitude across a frequency band. */
  private bandAvg(fromHz: number, toHz: number, binHz: number): number {
    const start = Math.max(1, Math.floor(fromHz / binHz))
    const end = Math.min(this.freq.length - 1, Math.ceil(toHz / binHz))
    if (end <= start) return 0
    let sum = 0
    for (let i = start; i <= end; i++) sum += this.freq[i]
    return sum / (end - start + 1) / 255
  }
}

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n
}
