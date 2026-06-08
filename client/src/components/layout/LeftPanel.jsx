import { useApp } from '../../context/AppContext'
import FrameSource from '../sources/FrameSource'
import MediaSource from '../sources/MediaSource'
import SourceModeToggle from '../sources/SourceModeToggle'

export default function LeftPanel() {
  const { streams, activeSlot, setActiveSlot, streamCount } = useApp()

  return (
    <aside className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-r border-zinc-800 bg-zinc-950 p-4">
      <h1 className="text-lg font-bold text-white">Sources</h1>

      <section className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-3">
        <label className="mb-2 block text-xs font-semibold uppercase text-zinc-500">
          Editing stream
        </label>
        <select
          value={activeSlot}
          onChange={(e) => setActiveSlot(Number(e.target.value))}
          className="w-full rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
        >
          {Array.from({ length: streamCount }, (_, i) => (
            <option key={i} value={i}>
              {streams[i]?.name || `Stream ${i + 1}`}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-zinc-500">
          Preview and sources apply to the selected stream slot.
        </p>
      </section>

      <FrameSource />
      <MediaSource />
      <SourceModeToggle />
    </aside>
  )
}
