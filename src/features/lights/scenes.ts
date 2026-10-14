import type { AudioFeatures, Palette, Scene } from '../../types.ts'
import { pick } from '../../lib/palette.ts'
import { FlashGate } from './flashGate.ts'

const gate = new FlashGate()

function fade(ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number) {
  ctx.fillStyle = `rgba(0,0,0,${alpha})`
  ctx.fillRect(0, 0, w, h)
}

// 1. Strobe Pop — color flashes on every beat.
export class StrobePop implements Scene {
  readonly name = 'Strobe Pop'
  private flash = 0
  private idx = 0
  render(ctx: CanvasRenderingContext2D, f: AudioFeatures, p: Palette, _dt: number, w: number, h: number, calm: boolean) {
    if (f.beat && gate.allow(performance.now(), calm)) {
      this.flash = calm ? 0.6 : 1
      this.idx = (this.idx + 1) % 4
    }
    this.flash *= calm ? 0.9 : 0.74 // snappier decay = harder strobe
    ctx.fillStyle = p.bg
    ctx.fillRect(0, 0, w, h)
    if (this.flash > 0.02) {
      ctx.fillStyle = pick(p, this.idx)
      ctx.globalAlpha = this.flash
      ctx.fillRect(0, 0, w, h)
      ctx.globalAlpha = 1
    }
    // Bass-driven color bars top & bottom for extra punch.
    if (!calm && f.bass > 0.2) {
      const barH = f.bass * h * 0.3
      ctx.fillStyle = pick(p, this.idx + 2)
      ctx.globalAlpha = f.bass
      ctx.fillRect(0, 0, w, barH)
      ctx.fillRect(0, h - barH, w, barH)
      ctx.globalAlpha = 1
    }
  }
  reset() {
    this.flash = 0
  }
}

// 2. Disco Ball — rotating sparkle grid, speed follows energy.
export class DiscoBall implements Scene {
  readonly name = 'Disco Ball'
  private angle = 0
  render(ctx: CanvasRenderingContext2D, f: AudioFeatures, p: Palette, dt: number, w: number, h: number) {
    fade(ctx, w, h, 0.25)
    this.angle += dt * (0.4 + f.energy * 2.5)
    const cx = w / 2
    const cy = h * 0.42
    const rings = 5
    const perRing = 16
    for (let r = 1; r <= rings; r++) {
      const radius = (Math.min(w, h) * 0.07) * r + f.bass * 60
      for (let i = 0; i < perRing; i++) {
        const a = this.angle * (r % 2 ? 1 : -1) + (i / perRing) * Math.PI * 2
        const x = cx + Math.cos(a) * radius
        const y = cy + Math.sin(a) * radius * 0.6
        const size = 3 + f.treble * 8 + (r === rings ? f.bass * 6 : 0)
        ctx.fillStyle = pick(p, (i + r) % 4)
        ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(a + this.angle))
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  }
}

// 3. Laser Rain — vertical beams swaying with mids.
export class LaserRain implements Scene {
  readonly name = 'Laser Rain'
  private t = 0
  render(ctx: CanvasRenderingContext2D, f: AudioFeatures, p: Palette, dt: number, w: number, h: number) {
    fade(ctx, w, h, 0.3)
    this.t += dt
    const beams = 14
    for (let i = 0; i < beams; i++) {
      const base = (i / beams) * w + w / beams / 2
      const sway = Math.sin(this.t * 1.5 + i) * (20 + f.mid * 120)
      const x = base + sway
      const alpha = 0.25 + f.energy * 0.6
      const grad = ctx.createLinearGradient(x, 0, x, h)
      const c = pick(p, i % 4)
      grad.addColorStop(0, 'transparent')
      grad.addColorStop(0.5, c)
      grad.addColorStop(1, 'transparent')
      ctx.strokeStyle = grad
      ctx.globalAlpha = alpha
      ctx.lineWidth = 2 + f.treble * 5
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x + sway * 0.3, h)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }
}

// 4. Bass Bubbles — big blobs that pulse with bass.
export class BassBubbles implements Scene {
  readonly name = 'Bass Bubbles'
  private bubbles = Array.from({ length: 7 }, (_, i) => ({
    x: Math.random(),
    y: Math.random(),
    r: 0.1 + Math.random() * 0.15,
    c: i % 4,
    phase: Math.random() * Math.PI * 2,
  }))
  private t = 0
  render(ctx: CanvasRenderingContext2D, f: AudioFeatures, p: Palette, dt: number, w: number, h: number) {
    fade(ctx, w, h, 0.18)
    this.t += dt
    const kick = f.beat ? 0.6 : 0
    for (const b of this.bubbles) {
      const pulse = 1 + f.bass * 2.6 + kick + Math.sin(this.t + b.phase) * 0.12
      const radius = b.r * Math.min(w, h) * pulse
      const x = b.x * w + Math.sin(this.t * 0.4 + b.phase) * 30
      const y = b.y * h + Math.cos(this.t * 0.3 + b.phase) * 30
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius)
      const c = pick(p, b.c)
      grad.addColorStop(0, c)
      grad.addColorStop(1, 'transparent')
      ctx.fillStyle = grad
      ctx.globalAlpha = 0.55 + f.bass * 0.4
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }
}

// 5. Rainbow Wave — scrolling gradient, hue shifts with treble.
export class RainbowWave implements Scene {
  readonly name = 'Rainbow Wave'
  private offset = 0
  render(ctx: CanvasRenderingContext2D, f: AudioFeatures, p: Palette, dt: number, w: number, h: number) {
    this.offset = (this.offset + dt * (40 + f.treble * 240)) % w
    const grad = ctx.createLinearGradient(this.offset - w, 0, this.offset, 0)
    const cols = [...p.colors, p.colors[0]]
    cols.forEach((c, i) => grad.addColorStop(i / cols.length, c))
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    // Overlay darkening band driven by energy, for a "wave" feel.
    const wave = ctx.createLinearGradient(0, 0, 0, h)
    wave.addColorStop(0, `rgba(0,0,0,${0.5 - f.energy * 0.4})`)
    wave.addColorStop(0.5, 'rgba(0,0,0,0)')
    wave.addColorStop(1, `rgba(0,0,0,${0.5 - f.energy * 0.4})`)
    ctx.fillStyle = wave
    ctx.fillRect(0, 0, w, h)
  }
}

// 6. Spotlight Sweep — moving cones across the screen.
export class SpotlightSweep implements Scene {
  readonly name = 'Spotlight Sweep'
  private t = 0
  render(ctx: CanvasRenderingContext2D, f: AudioFeatures, p: Palette, dt: number, w: number, h: number) {
    ctx.fillStyle = p.bg
    ctx.fillRect(0, 0, w, h)
    this.t += dt * (0.6 + f.energy * 1.8)
    const cones = 3
    for (let i = 0; i < cones; i++) {
      const px = (0.5 + 0.45 * Math.sin(this.t + (i * Math.PI * 2) / cones)) * w
      const c = pick(p, i % 4)
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      const grad = ctx.createRadialGradient(px, -h * 0.1, 0, px, -h * 0.1, h * (1 + f.bass))
      grad.addColorStop(0, c)
      grad.addColorStop(0.4, c + '66')
      grad.addColorStop(1, 'transparent')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.moveTo(px, -h * 0.1)
      ctx.lineTo(px - w * 0.25, h)
      ctx.lineTo(px + w * 0.25, h)
      ctx.closePath()
      ctx.globalAlpha = 0.4 + f.energy * 0.5
      ctx.fill()
      ctx.restore()
    }
    ctx.globalAlpha = 1
  }
}

export function allScenes(): Scene[] {
  return [
    new StrobePop(),
    new DiscoBall(),
    new LaserRain(),
    new BassBubbles(),
    new RainbowWave(),
    new SpotlightSweep(),
  ]
}
