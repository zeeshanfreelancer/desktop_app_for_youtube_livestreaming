import FrameSource from '../sources/FrameSource'
import MediaSource from '../sources/MediaSource'
import SourceModeToggle from '../sources/SourceModeToggle'

export default function LeftPanel() {
  return (
    <aside className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-r border-zinc-800 bg-zinc-950 p-4">
      <h1 className="text-lg font-bold text-white">Sources</h1>
      <FrameSource />
      <MediaSource />
      <SourceModeToggle />
    </aside>
  )
}
