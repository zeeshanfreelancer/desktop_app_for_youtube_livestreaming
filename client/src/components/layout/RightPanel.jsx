import { useState } from 'react'
import StreamControls from '../stream/StreamControls'
import StreamSettingsModal from '../stream/StreamSettingsModal'

export default function RightPanel() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
      <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">Stream</h1>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
          >
            Settings
          </button>
        </div>

        <p className="text-xs text-zinc-500">
          Configure broadcast details, resolution, bitrate, and stream keys in Settings.
        </p>

        <StreamControls />
      </aside>

      <StreamSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  )
}
