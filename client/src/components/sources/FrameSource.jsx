import { useApp } from '../../context/AppContext'
import { fileBaseName } from '../../utils/fileDisplay'

export default function FrameSource() {
  const { framePath, selectFrame } = useApp()
  const fileName = fileBaseName(framePath)

  return (
    <section className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Frame Source
      </h2>
      <button
        type="button"
        onClick={() => selectFrame()}
        className="w-full rounded-md bg-zinc-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-600"
      >
        Select Image
      </button>
      {fileName ? (
        <div className="mt-2 rounded-md bg-emerald-950/40 px-2 py-1.5">
          <p className="text-xs text-emerald-400">Selected</p>
          <p className="truncate text-sm font-medium text-white" title={framePath}>
            {fileName}
          </p>
        </div>
      ) : (
        <p className="mt-2 text-xs text-zinc-500">PNG, JPG, JPEG — 16:9 background</p>
      )}
    </section>
  )
}
