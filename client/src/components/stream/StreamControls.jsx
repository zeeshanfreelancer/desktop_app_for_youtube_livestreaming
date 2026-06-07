import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { LAYOUT_MODES } from '../../utils/layoutModes'
import { toOutputOverlay } from '../../utils/coordinates'
import StartStreamModal from './StartStreamModal'

export default function StreamControls() {
  const {
    layoutMode,
    framePath,
    mediaPath,
    resolution,
    bitrateKbps,
    overlay,
    previewSize,
    mediaTime,
    isStreaming,
    streamStatus,
    streamMessage,
  } = useApp()

  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState('')

  const validate = () => {
    if (layoutMode === LAYOUT_MODES.FRAME_ONLY && !framePath) {
      return 'Select a frame image before streaming'
    }
    if (layoutMode === LAYOUT_MODES.MEDIA_ONLY && !mediaPath) {
      return 'Select a media video before streaming'
    }
    if (layoutMode === LAYOUT_MODES.FRAME_MEDIA) {
      if (!framePath) return 'Select a frame image before streaming'
      if (!mediaPath) return 'Select a media video before streaming'
      if (!overlay || overlay.width < 2 || overlay.height < 2) {
        return 'Set up the video overlay in the preview before streaming'
      }
    }
    return null
  }

  const handleStart = async (selectedKeyIndices) => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    if (!window.api) {
      setError('Electron API not available')
      return
    }

    const payload = {
      mode: layoutMode,
      framePath,
      mediaPath,
      resolution,
      bitrateKbps,
      selectedKeyIndices,
      mediaStartSeconds: mediaTime,
    }

    if (layoutMode === LAYOUT_MODES.FRAME_MEDIA) {
      if (!overlay || overlay.width < 2 || overlay.height < 2) {
        return 'Set up the video overlay in the preview before streaming'
      }
      payload.overlay = toOutputOverlay(overlay, previewSize, resolution)
    }

    const result = await window.api.stream.start(payload)
    if (!result.success) {
      setError(result.error || 'Failed to start stream')
    } else {
      setError('')
    }
  }

  const handleStop = async () => {
    if (!window.api) return
    await window.api.stream.stop()
  }

  const statusColor = {
    idle: 'text-zinc-400',
    starting: 'text-amber-400',
    live: 'text-emerald-400',
    stopping: 'text-amber-400',
    error: 'text-red-400',
  }[streamStatus] || 'text-zinc-400'

  return (
    <section className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Streaming
      </h2>

      <div className={`mb-3 text-xs ${statusColor}`}>
        Status: {streamStatus}
        {streamMessage && ` — ${streamMessage}`}
      </div>

      {error && (
        <p className="mb-3 text-xs text-red-400">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            const err = validate()
            if (err) {
              setError(err)
              return
            }
            setError('')
            setModalOpen(true)
          }}
          disabled={isStreaming}
          className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Start Stream
        </button>
        <button
          type="button"
          onClick={handleStop}
          disabled={streamStatus === 'idle' || streamStatus === 'stopping'}
          className="flex-1 rounded-md bg-zinc-700 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Stop Stream
        </button>
      </div>

      <StartStreamModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleStart}
      />
    </section>
  )
}
