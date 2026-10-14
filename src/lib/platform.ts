// Small platform helpers. Kept dumb on purpose: used only to pick a *default*
// audio source and to decide quality knobs.

export function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

export function isChromium(): boolean {
  if (typeof navigator === 'undefined') return false
  // getDisplayMedia with tab audio is a Chromium/Edge thing on desktop.
  return /Chrome|Chromium|Edg/i.test(navigator.userAgent)
}

export function supportsTabCapture(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getDisplayMedia &&
    isChromium() &&
    !isMobile()
  )
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
