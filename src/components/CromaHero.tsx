import { motion, useReducedMotion } from 'framer-motion'

type CromaHeroProps = {
  onConnect: () => void
  onDemo: () => void
  /** Slot foto opsional. Default: none -> pakai gradient + grain. */
  backgroundImage?: string
}

type Accent = 'pink' | 'cyan' | 'lime'

// Campur token warna dengan transparan, tanpa hex.
const mix = (c: Accent, pct: number) =>
  `color-mix(in srgb, var(--${c}) ${pct}%, transparent)`

const TITLE =
  'font-display uppercase whitespace-nowrap leading-[0.9] tracking-[0.02em] ' +
  'text-[clamp(3rem,12vw,9rem)] -skew-x-6'

const CTA =
  'inline-flex items-center justify-center border px-8 py-3 text-xs uppercase ' +
  'tracking-[0.3em] transition-colors duration-200 cursor-pointer ' +
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--cyan)]'

export function CromaHero({ onConnect, onDemo, backgroundImage }: CromaHeroProps) {
  const reduce = useReducedMotion()

  const ease = [0.16, 1, 0.3, 1] as const
  const reveal = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, delay, ease },
  })

  return (
    <section className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      {/* Slot foto opsional */}
      {backgroundImage ? (
        <div
          aria-hidden
          className="absolute inset-0 -z-40 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      ) : null}

      {/* Glow sudut: pink kiri-atas, cyan kanan-atas, pink tipis di lantai */}
      <div
        aria-hidden
        className="absolute inset-0 -z-30"
        style={{
          backgroundImage: [
            `radial-gradient(60% 50% at 6% 0%, ${mix('pink', 30)}, transparent 70%)`,
            `radial-gradient(55% 55% at 96% 8%, ${mix('cyan', 26)}, transparent 70%)`,
            `radial-gradient(70% 40% at 50% 112%, ${mix('pink', 16)}, transparent 70%)`,
          ].join(','),
        }}
      />

      {/* Sorot lampu panggung (kesan foto gelap) */}
      <div
        aria-hidden
        className="absolute left-[8%] top-0 -z-20 h-[85%] w-[38%] origin-top blur-2xl animate-[croma-sway_9s_ease-in-out_infinite] motion-reduce:animate-none"
        style={{
          backgroundImage: `linear-gradient(to bottom, ${mix('pink', 26)}, transparent 85%)`,
          clipPath: 'polygon(46% 0, 54% 0, 100% 100%, 0 100%)',
        }}
      />
      <div
        aria-hidden
        className="absolute right-[6%] top-0 -z-20 h-[80%] w-[34%] origin-top blur-2xl animate-[croma-sway_11s_ease-in-out_infinite_reverse] motion-reduce:animate-none"
        style={{
          backgroundImage: `linear-gradient(to bottom, ${mix('cyan', 22)}, transparent 85%)`,
          clipPath: 'polygon(46% 0, 54% 0, 100% 100%, 0 100%)',
        }}
      />

      {/* Grain */}
      <div
        aria-hidden
        className="croma-grain absolute inset-0 -z-10 opacity-25 mix-blend-overlay"
      />

      {/* Vignette + fade ke section berikutnya */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: [
            'linear-gradient(to top, var(--bg), transparent 28%)',
            'radial-gradient(ellipse at center, transparent 38%, var(--bg) 100%)',
          ].join(','),
        }}
      />

      {/* Filter SVG untuk tepi "brush" di judul */}
      <svg aria-hidden width="0" height="0" className="absolute">
        <filter id="croma-brush" x="-5%" y="-10%" width="110%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04 0.9" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <div className="relative flex flex-col items-center px-4 text-center">
        <motion.p className="eyebrow mb-5 text-[var(--text-muted)]" {...reveal(0)}>
          Turn your screen into a club
        </motion.p>

        <motion.div className="relative" {...reveal(0.1)}>
          {/* Ghost chromatic offset */}
          <span
            aria-hidden
            className={`${TITLE} absolute inset-0 -translate-x-[0.03em] select-none text-[var(--pink)] opacity-60 mix-blend-screen blur-[1px]`}
          >
            Club Lights
          </span>
          <span
            aria-hidden
            className={`${TITLE} absolute inset-0 translate-x-[0.03em] select-none text-[var(--cyan)] opacity-50 mix-blend-screen blur-[1px]`}
          >
            Club Lights
          </span>
          <h1
            className={`${TITLE} relative text-[var(--text)]`}
            style={{ filter: 'url(#croma-brush)' }}
          >
            Club Lights
          </h1>
        </motion.div>

        <motion.div
          className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center"
          {...reveal(0.35)}
        >
          <button
            type="button"
            onClick={onDemo}
            className={`${CTA} border-[var(--text)]/40 text-[var(--text)] hover:border-[var(--text)] hover:bg-[var(--text)]/5`}
          >
            Play
          </button>
          <button
            type="button"
            onClick={onConnect}
            className={`${CTA} border-[var(--cyan)]/70 text-[var(--cyan)] hover:border-[var(--cyan)] hover:bg-[var(--cyan)]/10 hover:shadow-[0_0_32px_-8px_var(--cyan)]`}
          >
            Connect Spotify
          </button>
        </motion.div>
      </div>
    </section>
  )
}
