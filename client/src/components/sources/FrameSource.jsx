import { useApp } from '../../context/AppContext'

export default function FrameSource() {
  const { framePath, selectFrame } = useApp()

  return (
    <section className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Frame Source
      </h2>
      <button
        type="button"
        onClick={selectFrame}
        className="w-full rounded-md bg-zinc-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-600"
      >
        Select Image
      </button>
      <p className="mt-2 truncate text-xs text-zinc-500">
        {framePath ? framePath.split(/[/\\]/).pop() : 'PNG, JPG, JPEG — 16:9 background'}
      </p>
    </section>
  )
}
