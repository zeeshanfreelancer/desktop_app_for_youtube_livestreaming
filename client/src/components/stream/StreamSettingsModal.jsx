import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import StreamSlotSettings from './StreamSlotSettings'

function YouTubeConnectSection() {
  const {
    youtubeClientId,
    updateYoutubeClientId,
    youtubeConnected,
    youtubeChannelTitle,
    connectYouTube,
    disconnectYouTube,
  } = useApp()

  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const inputClass =
    'w-full rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-white placeholder:text-zinc-600 focus:border-red-500 focus:outline-none'

  const handleConnect = async () => {
    setAuthLoading(true)
    setAuthError('')
    const result = await connectYouTube()
    setAuthLoading(false)
    if (!result.success) {
      setAuthError(result.error || 'Failed to connect YouTube')
    }
  }

  return (
    <section className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        YouTube API (shared)
      </h3>
      <p className="mb-2 text-xs text-zinc-500">
        Connect once to enable per-stream titles, descriptions, and live URLs.
      </p>
      <input
        type="text"
        value={youtubeClientId}
        onChange={(e) => updateYoutubeClientId(e.target.value)}
        placeholder="OAuth Client ID"
        className={`${inputClass} mb-2`}
      />
      {youtubeConnected ? (
        <div className="space-y-2">
          <p className="text-xs text-emerald-400">Connected: {youtubeChannelTitle}</p>
          <button
            type="button"
            onClick={disconnectYouTube}
            className="w-full rounded-md bg-zinc-700 px-3 py-2 text-sm hover:bg-zinc-600"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleConnect}
          disabled={authLoading || !youtubeClientId.trim()}
          className="w-full rounded-md bg-red-700 px-3 py-2 text-sm font-medium hover:bg-red-600 disabled:opacity-50"
        >
          {authLoading ? 'Waiting for authorization…' : 'Connect YouTube Account'}
        </button>
      )}
      {authError && <p className="mt-2 text-xs text-red-400">{authError}</p>}
    </section>
  )
}

export default function StreamSettingsModal({ open, onClose, initialSlot = 0 }) {
  const { streamCount } = useApp()
  const [activeTab, setActiveTab] = useState(initialSlot)

  useEffect(() => {
    if (open) setActiveTab(initialSlot)
  }, [open, initialSlot])

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
      >
        <div className="shrink-0 border-b border-zinc-700 px-6 py-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Stream Settings</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {Array.from({ length: streamCount }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveTab(i)}
                className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium ${
                  activeTab === i
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                Stream {i + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto p-6">
          <StreamSlotSettings slotIndex={activeTab} />
          <YouTubeConnectSection />
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
