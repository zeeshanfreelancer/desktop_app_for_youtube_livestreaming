import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { PRIVACY_OPTIONS, YOUTUBE_CATEGORIES } from '../../utils/broadcastDefaults'

export default function BroadcastSettings() {
  const {
    broadcast,
    updateBroadcast,
    youtubeClientId,
    updateYoutubeClientId,
    youtubeStreamIds,
    updateYoutubeStreamId,
    youtubeConnected,
    youtubeChannelTitle,
    connectYouTube,
    disconnectYouTube,
    refreshYouTubeStreams,
    youtubeStreams,
  } = useApp()

  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    if (youtubeConnected) {
      refreshYouTubeStreams()
    }
  }, [youtubeConnected, refreshYouTubeStreams])

  const handleConnect = async () => {
    setAuthLoading(true)
    setAuthError('')
    const result = await connectYouTube()
    setAuthLoading(false)
    if (!result.success) {
      setAuthError(result.error || 'Failed to connect YouTube')
    }
  }

  const handleDisconnect = async () => {
    await disconnectYouTube()
  }

  const inputClass =
    'w-full rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-white placeholder:text-zinc-600 focus:border-red-500 focus:outline-none'

  return (
    <section className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Broadcast Settings
      </h2>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Title</label>
          <input
            type="text"
            value={broadcast.title}
            onChange={(e) => updateBroadcast({ title: e.target.value })}
            placeholder="My Live Stream"
            maxLength={100}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-500">Description</label>
          <textarea
            value={broadcast.description}
            onChange={(e) => updateBroadcast({ description: e.target.value })}
            placeholder="What is this stream about?"
            rows={3}
            maxLength={5000}
            className={`${inputClass} resize-y`}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-500">Privacy</label>
          <select
            value={broadcast.privacy}
            onChange={(e) => updateBroadcast({ privacy: e.target.value })}
            className={inputClass}
          >
            {PRIVACY_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-500">Category</label>
          <select
            value={broadcast.categoryId}
            onChange={(e) => updateBroadcast({ categoryId: e.target.value })}
            className={inputClass}
          >
            {YOUTUBE_CATEGORIES.map(({ id, label }) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-500">Tags (comma-separated)</label>
          <input
            type="text"
            value={broadcast.tags}
            onChange={(e) => updateBroadcast({ tags: e.target.value })}
            placeholder="gaming, live, tutorial"
            className={inputClass}
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={broadcast.madeForKids}
            onChange={(e) => updateBroadcast({ madeForKids: e.target.checked })}
            className="accent-red-500"
          />
          Made for kids
        </label>
      </div>

      <div className="mt-4 border-t border-zinc-700 pt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          YouTube API (optional)
        </h3>
        <p className="mb-2 text-xs text-zinc-500">
          Connect YouTube to apply title and description automatically. Requires a Google Cloud OAuth Desktop client ID.
        </p>

        <div className="mb-2">
          <label className="mb-1 block text-xs text-zinc-500">OAuth Client ID</label>
          <input
            type="text"
            value={youtubeClientId}
            onChange={(e) => updateYoutubeClientId(e.target.value)}
            placeholder="xxxx.apps.googleusercontent.com"
            className={inputClass}
          />
        </div>

        {youtubeConnected ? (
          <div className="space-y-2">
            <p className="text-xs text-emerald-400">
              Connected: {youtubeChannelTitle}
            </p>
            <button
              type="button"
              onClick={handleDisconnect}
              className="w-full rounded-md bg-zinc-700 px-3 py-2 text-sm hover:bg-zinc-600"
            >
              Disconnect YouTube
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            disabled={authLoading || !youtubeClientId.trim()}
            className="w-full rounded-md bg-red-700 px-3 py-2 text-sm font-medium hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {authLoading ? 'Waiting for authorization…' : 'Connect YouTube Account'}
          </button>
        )}

        {authError && (
          <p className="mt-2 text-xs text-red-400">{authError}</p>
        )}

        {youtubeConnected && youtubeStreams.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-zinc-500">
              Link each stream key to a YouTube stream:
            </p>
            {youtubeStreamIds.map((streamId, index) => (
              <div key={index}>
                <label className="mb-1 block text-xs text-zinc-500">
                  Stream Key {index + 1} → YouTube Stream
                </label>
                <select
                  value={streamId}
                  onChange={(e) => updateYoutubeStreamId(index, e.target.value)}
                  className={inputClass}
                >
                  <option value="">— Select stream —</option>
                  {youtubeStreams.map((stream) => (
                    <option key={stream.id} value={stream.id}>
                      {stream.title}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
