import { Card, Button } from '../components/ui.tsx'

/** Shown once before the first light show. */
export function PhotoWarning({
  onAccept,
  onCalm,
}: {
  onAccept: () => void
  onCalm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 px-6">
      <Card className="max-w-md text-center border-pink/50">
        <p className="eyebrow mb-2">Heads-up</p>
        <h2 className="font-display text-2xl text-[var(--text)]">Flashing lights ahead</h2>
        <p className="mt-3 text-[var(--text-muted)]">
          This light show includes flashing colors and fast motion. If you’re sensitive to flashing
          lights (photosensitive epilepsy), please use Calm mode, which keeps flashes slow and gentle.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button accent="lime" onClick={onCalm}>
            Start in Calm mode
          </Button>
          <Button accent="pink" primary onClick={onAccept}>
            Full lights
          </Button>
        </div>
      </Card>
    </div>
  )
}
