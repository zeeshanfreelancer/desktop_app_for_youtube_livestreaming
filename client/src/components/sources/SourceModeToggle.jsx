import { useApp } from '../../context/AppContext'
import { LAYOUT_MODE_LABELS, LAYOUT_MODES } from '../../utils/layoutModes'

const MODES = [
  LAYOUT_MODES.FRAME_ONLY,
  LAYOUT_MODES.MEDIA_ONLY,
  LAYOUT_MODES.FRAME_MEDIA,
]

export default function SourceModeToggle() {
  const { layoutMode, setLayoutMode } = useApp()

  return (
    <section className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Switch Source
      </h2>
      <div className="flex flex-col gap-2">
        {MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setLayoutMode(mode)}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              layoutMode === mode
                ? 'bg-red-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {LAYOUT_MODE_LABELS[mode]}
          </button>
        ))}
      </div>
    </section>
  )
}
