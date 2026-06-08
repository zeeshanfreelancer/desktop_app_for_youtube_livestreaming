import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { formatDuration } from '../../utils/coordinates'

function LiveTimer({ startedAt }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!startedAt) return <span>00:00:00</span>
  return <span>{formatDuration(now - startedAt)}</span>
}

function StreamCard({ index, onOpenSettings }) {
  const { streams, liveStreams } = useApp()
  const slot = streams[index]
  const live = liveStreams[index]
  const isLive = live && live.status !== 'idle'

  const statusClass = isLive ? 'text-emerald-400' : 'text-zinc-500'

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-white">{slot.name}</p>
          <p className={`text-xs ${statusClass}`}>
            {isLive ? '● LIVE' : '○ Idle'}
            {isLive && (
              <span className="ml-2 font-mono text-zinc-300">
                <LiveTimer startedAt={live.startedAt} />
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenSettings(index)}
          className="shrink-0 text-xs text-zinc-400 hover:text-white"
        >
          Edit
        </button>
      </div>

      {slot.broadcast.title && (
        <p className="mb-1 truncate text-xs text-zinc-400">{slot.broadcast.title}</p>
      )}

      {isLive && live.liveUrl && (
        <a
          href={live.liveUrl}
          target="_blank"
          rel="noreferrer"
          className="mb-2 block truncate text-xs text-red-400 hover:underline"
        >
          {live.liveUrl}
        </a>
      )}

      {isLive && !live.liveUrl && (
        <p className="mb-2 text-xs text-zinc-500">
          Live URL available when YouTube API is connected with a broadcast title.
        </p>
      )}

      <p className="truncate text-xs text-zinc-600">
        {slot.streamKey ? 'Key configured' : 'No stream key'}
        {' · '}
        {slot.resolution} · {slot.bitrateKbps} kbps
      </p>
    </div>
  )
}

export default function StreamDashboard({ onOpenSettings }) {
  const { streams, liveStreams, streamCount } = useApp()
  const [selected, setSelected] = useState([])
  const [error, setError] = useState('')

  const toggle = (index) => {
    if (liveStreams[index]) return
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    )
  }

  const handleStartSelected = async () => {
    if (selected.length === 0) {
      setError('Select at least one idle stream')
      return
    }

    if (!window.api) {
      setError('Electron API not available')
      return
    }

    const result = await window.api.stream.start(selected)
    if (!result.success) {
      setError(result.error || 'Failed to start streams')
    } else {
      setError('')
      setSelected([])
      if (result.warnings) {
        setError(result.warnings)
      }
    }
  }

  const handleStartOne = async (index) => {
    if (!window.api) return
    const result = await window.api.stream.start([index])
    if (!result.success) {
      setError(result.error || `Failed to start stream ${index + 1}`)
    } else {
      setError('')
    }
  }

  const handleStopOne = async (index) => {
    if (!window.api) return
    await window.api.stream.stop(index)
  }

  const handleStopAll = async () => {
    if (!window.api) return
    await window.api.stream.stopAll()
    setSelected([])
  }

  const liveCount = Object.keys(liveStreams).length

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Streams ({liveCount} live)
        </h2>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="space-y-2">
        {Array.from({ length: streamCount }, (_, index) => {
          const isLive = Boolean(liveStreams[index])
          const slot = streams[index]

          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.includes(index)}
                  onChange={() => toggle(index)}
                  disabled={isLive || !slot.streamKey?.trim()}
                  className="accent-red-500"
                  aria-label={`Select ${slot.name}`}
                />
                <div className="flex-1">
                  <StreamCard index={index} onOpenSettings={onOpenSettings} />
                </div>
              </div>
              <div className="ml-6 flex gap-2">
                {!isLive ? (
                  <button
                    type="button"
                    onClick={() => handleStartOne(index)}
                    disabled={!slot.streamKey?.trim()}
                    className="flex-1 rounded-md bg-red-700 px-2 py-1 text-xs font-medium hover:bg-red-600 disabled:opacity-40"
                  >
                    Start
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStopOne(index)}
                    className="flex-1 rounded-md bg-zinc-700 px-2 py-1 text-xs font-medium hover:bg-zinc-600"
                  >
                    Stop
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleStartSelected}
          disabled={selected.length === 0}
          className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
        >
          Start Selected ({selected.length})
        </button>
        <button
          type="button"
          onClick={handleStopAll}
          disabled={liveCount === 0}
          className="flex-1 rounded-md bg-zinc-700 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-600 disabled:opacity-50"
        >
          Stop All
        </button>
      </div>
    </section>
  )
}
