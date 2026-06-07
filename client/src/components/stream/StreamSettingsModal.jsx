import { useEffect } from 'react'
import BroadcastSettings from './BroadcastSettings'
import StreamSettings from './StreamSettings'
import StreamKeyFields from './StreamKeyFields'

export default function StreamSettingsModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border border-zinc-600 bg-zinc-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stream-settings-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-700 px-6 py-4">
          <h2 id="stream-settings-title" className="text-lg font-semibold text-white">
            Stream Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto p-6">
          <BroadcastSettings />
          <StreamSettings />
          <StreamKeyFields />
        </div>

        <div className="flex shrink-0 justify-end border-t border-zinc-700 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
