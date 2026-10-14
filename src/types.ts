// ---- Shared types for Club Lights ----
// The light engine depends ONLY on AudioFeatures (and Palette). It must never
// import a concrete audio source or anything Spotify-specific.

/** Where the sound comes from. The light engine does not care which. */
export interface AudioSource {
  readonly id: 'tab' | 'mic'
  /** Request permission and return a live MediaStream. */
  start(): Promise<MediaStream>
  /** Stop all tracks and release the device. */
  stop(): void
}

/** Per-animation-frame summary of the music. All band values are 0..1. */
export interface AudioFeatures {
  bass: number // ~20–150 Hz
  mid: number // ~150–2000 Hz
  treble: number // ~2–16 kHz
  energy: number // 0..1 smoothed overall level
  beat: boolean // true on a detected onset this frame
  bpmEstimate?: number
}

/** Four hot colors + a background, used by every scene. */
export interface Palette {
  bg: string
  colors: [string, string, string, string]
}

/** A single light show. Self-contained; draws to a 2D canvas. */
export interface Scene {
  readonly name: string
  /**
   * Draw one frame.
   * @param ctx    canvas 2D context (already DPR-scaled by the renderer)
   * @param f      current audio features
   * @param p      active palette
   * @param dt     seconds since last frame
   * @param w,h    CSS pixel size of the canvas
   * @param calm   when true: no hard strobe, flashes gated < 3 Hz
   */
  render(
    ctx: CanvasRenderingContext2D,
    f: AudioFeatures,
    p: Palette,
    dt: number,
    w: number,
    h: number,
    calm: boolean,
  ): void
  /** Called when this scene becomes active, to reset internal state. */
  reset?(): void
}

export type SceneName =
  | 'Strobe Pop'
  | 'Disco Ball'
  | 'Laser Rain'
  | 'Bass Bubbles'
  | 'Rainbow Wave'
  | 'Spotlight Sweep'

export type PaletteMode = 'cover' | 'neon'
