import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { formatMediaTime } from '../../utils/coordinates'
import { fileBaseName } from '../../utils/fileDisplay'
import SelectedFileCard from './SelectedFileCard'

export default function MediaSource() {
  const {
    mediaPath,
    selectMedia,
    clearMedia,
    mediaTime,
    mediaDuration,
    mediaLoop,
    setMediaLoop,
    mediaSeekingRef,
    playMedia,
    pauseMedia,
    seekMedia,
  } = useApp()

  const [scrubValue, setScrubValue] = useState(0)
  const [isScrubbing, setIsScrubbing] = useState(false)

  const fileName = fileBaseName(mediaPath)
  const hasDuration = Number.isFinite(mediaDuration) && mediaDuration > 0
  const displayTime = isScrubbing ? scrubValue : mediaTime

  const beginScrub = () => {
    setIsScrubbing(true)
    mediaSeekingRef.current = true
    setScrubValue(mediaTime)
  }

  const scrubTo = (value) => {
    const time = Number(value)
    setScrubValue(time)
    seekMedia(time, { persist: false })
  }

  const endScrub = (value) => {
    if (!isScrubbing && !mediaSeekingRef.current) return
    const time = Number(value)
    mediaSeekingRef.current = false
    setIsScrubbing(false)
    seekMedia(time, { persist: true })
  }

  return (
    <section className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Media Source
      </h2>

      {fileName ? (
        <SelectedFileCard
          fileName={fileName}
          filePath={mediaPath}
          onChange={() => selectMedia()}
          onRemove={() => clearMedia()}
          changeLabel="Change"
        />
      ) : (
        <>
          <button
            type="button"
            onClick={() => selectMedia()}
            className="w-full rounded-md bg-zinc-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-600"
          >
            Select Video
          </button>
          <p className="mt-2 text-xs text-zinc-500">MP4 — manual playback only</p>
        </>
      )}

      {fileName && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={playMedia}
              className="flex-1 rounded-md bg-emerald-700 px-2 py-1.5 text-xs font-medium hover:bg-emerald-600"
            >
              Play
            </button>
            <button
              type="button"
              onClick={pauseMedia}
              className="flex-1 rounded-md bg-amber-700 px-2 py-1.5 text-xs font-medium hover:bg-amber-600"
            >
              Pause
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
            <span>{formatMediaTime(displayTime)}</span>
            <span>{hasDuration ? formatMediaTime(mediaDuration) : '--:--'}</span>
          </div>

          <input
            type="range"
            min={0}
            max={hasDuration ? mediaDuration : 1}
            step={0.1}
            value={hasDuration ? Math.min(displayTime, mediaDuration) : 0}
            onPointerDown={beginScrub}
            onInput={(e) => scrubTo(e.target.value)}
            onChange={(e) => endScrub(e.target.value)}
            onPointerUp={(e) => endScrub(e.target.value)}
            disabled={!hasDuration}
            className="w-full accent-red-500 disabled:opacity-40"
            aria-label="Seek"
          />

          <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={mediaLoop}
              onChange={(e) => setMediaLoop(e.target.checked)}
              className="accent-red-500"
            />
            Loop video when streaming
          </label>
          <p className="text-[10px] text-zinc-500">
            Seek sets where the stream starts. Loop replays the full video after it ends.
          </p>
        </div>
      )}
    </section>
  )
}
