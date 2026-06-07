import { useApp } from '../../context/AppContext'

export default function MediaSource() {
  const {
    mediaPath,
    selectMedia,
    mediaTime,
    mediaDuration,
    playMedia,
    pauseMedia,
    seekMedia,
  } = useApp()

  return (
    <section className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Media Source
      </h2>
      <button
        type="button"
        onClick={selectMedia}
        className="w-full rounded-md bg-zinc-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-600"
      >
        Select Video
      </button>
      <p className="mt-2 truncate text-xs text-zinc-500">
        {mediaPath ? mediaPath.split(/[/\\]/).pop() : 'MP4 — manual playback only'}
      </p>

      {mediaPath && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={playMedia}
              className="flex-1 rounded-md bg-emerald-700 px-2 py-1.5 text-xs font-medium hover:bg-emerald-600"
            >
              Play
            </button>
            <button
              type="button"
              onClick={pauseMedia}
              className="flex-1 rounded-md bg-amber-700 px-2 py-1.5 text-xs font-medium hover:bg-amber-600"
            >
              Pause
            </button>
          </div>
          <input
            type="range"
            min={0}
            max={mediaDuration || 100}
            step={0.1}
            value={mediaTime}
            onChange={(e) => seekMedia(Number(e.target.value))}
            className="w-full accent-red-500"
            aria-label="Seek"
          />
        </div>
      )}
    </section>
  )
}
