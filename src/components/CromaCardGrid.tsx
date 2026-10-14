type CromaCardItem = {
  label: string
  onClick?: () => void
}

type CromaCardGridProps = {
  items: CromaCardItem[]
}

type Accent = 'pink' | 'cyan' | 'lime'

const ACCENTS: Accent[] = ['pink', 'cyan', 'lime']

const mix = (c: Accent, pct: number) =>
  `color-mix(in srgb, var(--${c}) ${pct}%, transparent)`

export function CromaCardGrid({ items }: CromaCardGridProps) {
  return (
    <section
      aria-label="Quick links"
      className="grid grid-cols-1 gap-2 bg-[var(--bg)] p-2 md:grid-cols-3 md:gap-3 md:p-3"
    >
      {items.map((item, i) => {
        const accent = ACCENTS[i % ACCENTS.length]
        const clickable = Boolean(item.onClick)
        const Wrapper = clickable ? 'button' : 'div'

        return (
          <Wrapper
            key={item.label}
            type={clickable ? 'button' : undefined}
            onClick={item.onClick}
            className="group relative isolate flex min-h-[38vh] w-full items-center justify-center overflow-hidden rounded-[6px] border border-[var(--card-line)] bg-[var(--bg)] text-[var(--text)] md:min-h-[46vh] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyan)] cursor-pointer"
          >
            {/* Dasar gradient gelap, tiap kartu beda aksen */}
            <span
              aria-hidden
              className="absolute inset-0 -z-30"
              style={{
                backgroundImage: [
                  `radial-gradient(70% 80% at ${i % 2 === 0 ? '15% 10%' : '85% 10%'}, ${mix(accent, 20)}, transparent 70%)`,
                  `linear-gradient(160deg, ${mix(accent, 8)}, transparent 60%)`,
                ].join(','),
              }}
            />

            {/* Glow aksen muncul saat hover */}
            <span
              aria-hidden
              className="absolute inset-0 -z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
              style={{
                backgroundImage: `radial-gradient(60% 60% at 50% 100%, ${mix(accent, 24)}, transparent 70%)`,
              }}
            />

            <span
              aria-hidden
              className="croma-grain absolute inset-0 -z-10 opacity-20 mix-blend-overlay"
            />

            {/* Overlay gelap: terang sedikit saat hover */}
            <span
              aria-hidden
              className="absolute inset-0 -z-10 bg-[var(--bg)]/35 transition-colors duration-300 group-hover:bg-[var(--bg)]/10 motion-reduce:transition-none"
            />

            <span className="relative px-4 text-center text-sm uppercase tracking-[0.3em] transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 md:text-base">
              {item.label}
            </span>
          </Wrapper>
        )
      })}
    </section>
  )
}
