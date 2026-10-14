/**
 * Beat detection via spectral flux on the bass band.
 *
 * Each frame we receive the current bass-band magnitude. We track the positive
 * change (flux) vs the previous frame, keep a moving average of flux, and fire
 * a beat when flux exceeds `avg * sensitivity` AND at least MIN_GAP_MS have
 * passed since the last beat. Beat timestamps feed a rough BPM estimate.
 */
export class BeatDetector {
  private prevBass = 0
  private avgFlux = 0
  private readonly fluxDecay = 0.92 // moving-average smoothing
  private lastBeatAt = 0
  private readonly minGapMs = 250 // ~240 BPM ceiling
  private beatTimes: number[] = []

  /** Higher = fewer beats (needs a bigger jump). ~1.3–1.8 is a good range. */
  sensitivity = 1.5

  /** @returns true if this frame is a beat onset. */
  update(bass: number, now: number): boolean {
    const flux = Math.max(0, bass - this.prevBass)
    this.prevBass = bass
    this.avgFlux = this.avgFlux * this.fluxDecay + flux * (1 - this.fluxDecay)

    const threshold = this.avgFlux * this.sensitivity + 0.004
    const gapOk = now - this.lastBeatAt >= this.minGapMs
    const isBeat = gapOk && flux > threshold && bass > 0.08

    if (isBeat) {
      this.lastBeatAt = now
      this.beatTimes.push(now)
      if (this.beatTimes.length > 24) this.beatTimes.shift()
    }
    return isBeat
  }

  /** Rough BPM from the median inter-beat interval, or undefined if unsure. */
  bpm(): number | undefined {
    if (this.beatTimes.length < 4) return undefined
    const gaps: number[] = []
    for (let i = 1; i < this.beatTimes.length; i++) {
      gaps.push(this.beatTimes[i] - this.beatTimes[i - 1])
    }
    gaps.sort((a, b) => a - b)
    const median = gaps[Math.floor(gaps.length / 2)]
    if (!median) return undefined
    const bpm = 60000 / median
    if (bpm < 50 || bpm > 220) return undefined
    return Math.round(bpm)
  }

  reset(): void {
    this.prevBass = 0
    this.avgFlux = 0
    this.lastBeatAt = 0
    this.beatTimes = []
  }
}
