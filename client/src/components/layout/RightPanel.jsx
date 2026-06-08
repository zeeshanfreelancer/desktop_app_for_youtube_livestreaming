import { useState } from 'react'
import StreamDashboard from '../stream/StreamDashboard'
import StreamSettingsModal from '../stream/StreamSettingsModal'

export default function RightPanel() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsSlot, setSettingsSlot] = useState(0)

  const openSettings = (slotIndex = 0) => {
    setSettingsSlot(slotIndex)
    setSettingsOpen(true)
  }

  return (
    <>
      <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">Streams</h1>
          <button
            type="button"
            onClick={() => openSettings(0)}
            className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
          >
            Settings
          </button>
        </div>

        <StreamDashboard onOpenSettings={openSettings} />
      </aside>

      <StreamSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialSlot={settingsSlot}
      />
    </>
  )
}
