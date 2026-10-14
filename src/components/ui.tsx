import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

const spring = { type: 'spring' as const, stiffness: 420, damping: 22 }

type Accent = 'pink' | 'lime' | 'cyan' | 'yellow'

// accent → text/border color classes (outline style)
const accentText: Record<Accent, string> = {
  pink: 'text-pink',
  lime: 'text-lime',
  cyan: 'text-cyan',
  yellow: 'text-cyan',
}
const accentBorder: Record<Accent, string> = {
  pink: 'border-pink/70 hover:border-pink',
  lime: 'border-lime/70 hover:border-lime',
  cyan: 'border-cyan/70 hover:border-cyan',
  yellow: 'border-cyan/70 hover:border-cyan',
}
const accentFill: Record<Accent, string> = {
  pink: 'bg-pink text-night border-pink',
  lime: 'bg-lime text-night border-lime',
  cyan: 'bg-cyan text-night border-cyan',
  yellow: 'bg-cyan text-night border-cyan',
}
const accentGlow: Record<Accent, string> = {
  pink: 'shadow-glow-pink',
  lime: 'shadow-glow-lime',
  cyan: 'shadow-glow-cyan',
  yellow: 'shadow-glow-cyan',
}

export function Button({
  children,
  onClick,
  accent = 'pink',
  big = false,
  primary = false,
  disabled = false,
  ariaLabel,
}: {
  children: ReactNode
  onClick?: () => void
  accent?: Accent
  big?: boolean
  /** The single filled primary action for the screen. */
  primary?: boolean
  wiggle?: boolean
  disabled?: boolean
  ariaLabel?: string
}) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={spring}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={[
        'inline-flex items-center justify-center gap-2 font-display rounded-[6px] border uppercase tracking-[0.3em]',
        'transition-colors duration-200',
        primary
          ? `${accentFill[accent]} ${accentGlow[accent]}`
          : `bg-transparent ${accentText[accent]} ${accentBorder[accent]} hover:${accentGlow[accent]}`,
        big ? 'text-sm px-8 py-3.5' : 'text-xs px-5 py-3',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      {children}
    </motion.button>
  )
}

/** A faint background glow (decorative). Low opacity only — no solid blobs. */
export function Blob({
  color,
  size,
  className = '',
  drift = true,
}: {
  color: string
  size: number
  className?: string
  drift?: boolean
}) {
  return (
    <div
      aria-hidden
      className={`absolute rounded-full blur-[120px] opacity-[0.14] pointer-events-none ${
        drift ? 'animate-drift' : ''
      } ${className}`}
      style={{ width: size, height: size, background: color }}
    />
  )
}

export function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`flex items-center gap-3 cursor-pointer select-none ${
        on ? 'text-lime' : 'text-[var(--text-muted)]'
      }`}
    >
      <span
        className={`w-12 h-6 rounded-[6px] border flex items-center transition-colors ${
          on ? 'border-lime bg-lime/20 justify-end' : 'border-[var(--card-line)] bg-white/5 justify-start'
        }`}
      >
        <motion.span
          layout
          transition={spring}
          className={`w-4 h-4 m-0.5 rounded-[3px] ${on ? 'bg-lime' : 'bg-[var(--text-muted)]'}`}
        />
      </span>
      <span className="font-display text-xs uppercase tracking-[0.2em]">{label}</span>
    </button>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[8px] border border-[var(--card-line)] bg-[var(--surface)] p-6 ${className}`}
    >
      {children}
    </div>
  )
}
