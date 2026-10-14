import type { SVGProps } from 'react'

// Simple 1.5px line icons, stroke=currentColor. Size via className (w-/h-).
function base(props: SVGProps<SVGSVGElement>) {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  }
}

export function PlayIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M6 4.5v15l13-7.5-13-7.5Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function PauseIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function NextIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M6 5l9 7-9 7V5Z" fill="currentColor" stroke="none" />
      <line x1="18" y1="5" x2="18" y2="19" />
    </svg>
  )
}

export function PrevIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M18 5l-9 7 9 7V5Z" fill="currentColor" stroke="none" />
      <line x1="6" y1="5" x2="6" y2="19" />
    </svg>
  )
}

export function ShuffleIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M3 6h4l10 12h4" />
      <path d="M17 6h4" />
      <path d="M19 4l2 2-2 2" />
      <path d="M3 18h4l3-3.5" />
      <path d="M19 16l2 2-2 2" />
    </svg>
  )
}

export function VolumeIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      <path d="M17 8a5 5 0 0 1 0 8" />
    </svg>
  )
}

export function VolumeLowIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
    </svg>
  )
}

export function LyricsIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <path d="M5 4h14v16l-3-2-3 2-3-2-3 2V4Z" />
      <line x1="8" y1="9" x2="16" y2="9" />
      <line x1="8" y1="13" x2="13" y2="13" />
    </svg>
  )
}

export function LightsIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="9" r="4" />
      <path d="M12 13v4" />
      <path d="M9 20h6" />
      <path d="M12 2v1M5 5l.7.7M19 5l-.7.7" />
    </svg>
  )
}

export function PlusIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function BackIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(p)}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  )
}
