import type { AudioFeatures, Palette } from '../../types.ts'
import { NEON_PALETTE } from '../../lib/palette.ts'
import { allScenes } from './scenes.ts'
import { AutoDirector } from './autoDirector.ts'

/**
 * Owns the canvas and the animation loop. It pulls the latest AudioFeatures
 * from a provided callback, asks the AutoDirector for the active scene, and
 * renders it. Measures frame time and nudges a quality factor to hold ~60fps.
 */
export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private director = new AutoDirector(allScenes())
  private raf = 0
  private lastTs = 0
  private running = false

  private getFeatures: () => AudioFeatures
  palette: Palette = NEON_PALETTE
  calm = false

  // Dynamic quality (0.5..1): lowered when frames run long.
  private quality = 1
  private slowFrames = 0

  constructor(canvas: HTMLCanvasElement, getFeatures: () => AudioFeatures) {
    this.canvas = canvas
    this.getFeatures = getFeatures
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('2d context unavailable')
    this.ctx = ctx
    this.resize()
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2) * this.quality
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    this.canvas.width = Math.round(w * dpr)
    this.canvas.height = Math.round(h * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.lastTs = performance.now()
    this.loop(this.lastTs)
  }

  stop(): void {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  skipScene(): void {
    this.director.skip()
  }

  currentSceneName(): string {
    return this.director.current().name
  }

  private loop = (ts: number) => {
    if (!this.running) return
    const dt = Math.min(0.05, (ts - this.lastTs) / 1000)
    this.lastTs = ts

    // Adaptive quality: if frames consistently exceed ~22ms, drop quality.
    const frameMs = dt * 1000
    if (frameMs > 22) {
      if (++this.slowFrames > 30 && this.quality > 0.55) {
        this.quality = Math.max(0.55, this.quality - 0.1)
        this.slowFrames = 0
        this.resize()
      }
    } else {
      this.slowFrames = Math.max(0, this.slowFrames - 1)
    }

    const f = this.getFeatures()
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    const scene = this.director.update(f, ts)
    scene.render(this.ctx, f, this.palette, dt, w, h, this.calm)

    this.raf = requestAnimationFrame(this.loop)
  }
}
