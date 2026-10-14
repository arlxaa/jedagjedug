/**
 * Flash-rate safety gate. In Calm mode no scene may flash more than ~2.5 times
 * per second (well under the 3 Hz photosensitivity guideline). Every scene that
 * wants to "flash" asks the gate first.
 */
export class FlashGate {
  private lastFlash = 0
  private readonly calmGapMs = 400 // 2.5 Hz ceiling

  /** @returns true if a flash is allowed right now. */
  allow(now: number, calm: boolean): boolean {
    if (!calm) return true
    if (now - this.lastFlash >= this.calmGapMs) {
      this.lastFlash = now
      return true
    }
    return false
  }
}
