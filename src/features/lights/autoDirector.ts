import type { AudioFeatures, Scene } from '../../types.ts'

/**
 * Decides which scene is active. Switches every 8–16 beats, or immediately on a
 * big energy jump (a "drop"). Keeps the show moving with zero user input.
 */
export class AutoDirector {
  private scenes: Scene[]
  private index = 0
  private beatCount = 0
  private nextSwitchAt = randInt(8, 16)
  private energyAvg = 0
  private lastDropAt = 0

  constructor(scenes: Scene[]) {
    this.scenes = scenes
    this.scenes[this.index].reset?.()
  }

  /** Call once per frame. Returns the scene to render. */
  update(f: AudioFeatures, now: number): Scene {
    // Track a slow energy average to detect drops (sudden jump above it).
    this.energyAvg = this.energyAvg * 0.97 + f.energy * 0.03
    const isDrop =
      f.energy > this.energyAvg + 0.28 && now - this.lastDropAt > 1500

    if (f.beat) {
      this.beatCount++
    }

    if (isDrop) {
      this.lastDropAt = now
      this.switch(true)
    } else if (this.beatCount >= this.nextSwitchAt) {
      this.switch(false)
    }

    return this.scenes[this.index]
  }

  current(): Scene {
    return this.scenes[this.index]
  }

  /** Force the next scene (used by the "shuffle" tap on the dance floor). */
  skip(): void {
    this.switch(false)
  }

  private switch(onDrop: boolean) {
    // On a drop, jump to a high-impact scene; otherwise advance in order.
    const next = onDrop
      ? pickDifferent(this.index, this.scenes.length)
      : (this.index + 1) % this.scenes.length
    this.index = next
    this.beatCount = 0
    this.nextSwitchAt = randInt(8, 16)
    this.scenes[this.index].reset?.()
  }
}

function randInt(lo: number, hi: number): number {
  return Math.floor(lo + Math.random() * (hi - lo + 1))
}

function pickDifferent(current: number, n: number): number {
  let i = current
  while (i === current) i = Math.floor(Math.random() * n)
  return i
}
