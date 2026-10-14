import type { ReactNode } from 'react'

/** Shared editorial background: near-black + faint corner glows + grain + vignette. */
export function Backdrop({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-full w-full overflow-hidden bg-[var(--bg)]">
      {/* Faint corner glows (low opacity, no solid blocks) */}
      <div
        aria-hidden
        className="absolute inset-0 -z-30"
        style={{
          backgroundImage: [
            'radial-gradient(50% 40% at 0% 0%, color-mix(in srgb, var(--pink) 14%, transparent), transparent 70%)',
            'radial-gradient(50% 40% at 100% 0%, color-mix(in srgb, var(--cyan) 12%, transparent), transparent 70%)',
            'radial-gradient(60% 50% at 50% 120%, color-mix(in srgb, var(--pink) 8%, transparent), transparent 70%)',
          ].join(','),
        }}
      />
      {/* Grain */}
      <div aria-hidden className="croma-grain absolute inset-0 -z-20 opacity-[0.12] mix-blend-overlay" />
      {/* Vignette */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ backgroundImage: 'radial-gradient(ellipse at center, transparent 55%, var(--bg) 100%)' }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
