import { useApp } from '../../context/AppContext'
import { fileBaseName } from '../../utils/fileDisplay'
import { PRIVACY_OPTIONS, YOUTUBE_CATEGORIES } from '../../utils/broadcastDefaults'
import { LAYOUT_MODE_LABELS, LAYOUT_MODES, RESOLUTIONS } from '../../utils/layoutModes'

const MODES = [
  LAYOUT_MODES.FRAME_ONLY,
  LAYOUT_MODES.MEDIA_ONLY,
  LAYOUT_MODES.FRAME_MEDIA,
]

export default function StreamSlotSettings({ slotIndex }) {
  const {
    streams,
    updateStreamSlot,
    updateStreamBroadcast,
    youtubeStreams,
    youtubeConnected,
    selectFrame,
    selectMedia,
    clearFrame,
    clearMedia,
    activeSlot,
  } = useApp()

  const slot = streams[slotIndex]
  if (!slot) return null

  const inputClass =
    'w-full rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-white placeholder:text-zinc-600 focus:border-red-500 focus:outline-none'

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs text-zinc-500">Stream label</label>
        <input
          type="text"
          value={slot.name}
          onChange={(e) => updateStreamSlot(slotIndex, { name: e.target.value })}
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-zinc-500">Stream key</label>
        <input
          type="password"
          value={slot.streamKey}
          onChange={(e) => updateStreamSlot(slotIndex, { streamKey: e.target.value })}
          placeholder="YouTube stream key"
          className={inputClass}
        />
      </div>

      {youtubeConnected && youtubeStreams.length > 0 && (
        <div>
          <label className="mb-1 block text-xs text-zinc-500">YouTube stream (for broadcast API)</label>
          <select
            value={slot.youtubeStreamId}
            onChange={(e) => updateStreamSlot(slotIndex, { youtubeStreamId: e.target.value })}
            className={inputClass}
          >
            <option value="">— Select stream —</option>
            {youtubeStreams.map((stream) => (
              <option key={stream.id} value={stream.id}>{stream.title}</option>
            ))}
          </select>
        </div>
      )}

      <div className="rounded-lg border border-zinc-700 bg-zinc-950/50 p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase text-zinc-500">Broadcast</h3>
        <div className="space-y-2">
          <input
            type="text"
            value={slot.broadcast.title}
            onChange={(e) => updateStreamBroadcast(slotIndex, { title: e.target.value })}
            placeholder="Title"
            maxLength={100}
            className={inputClass}
          />
          <textarea
            value={slot.broadcast.description}
            onChange={(e) => updateStreamBroadcast(slotIndex, { description: e.target.value })}
            placeholder="Description"
            rows={2}
            className={`${inputClass} resize-y`}
          />
          <select
            value={slot.broadcast.privacy}
            onChange={(e) => updateStreamBroadcast(slotIndex, { privacy: e.target.value })}
            className={inputClass}
          >
            {PRIVACY_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={slot.broadcast.categoryId}
            onChange={(e) => updateStreamBroadcast(slotIndex, { categoryId: e.target.value })}
            className={inputClass}
          >
            {YOUTUBE_CATEGORIES.map(({ id, label }) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
          <input
            type="text"
            value={slot.broadcast.tags}
            onChange={(e) => updateStreamBroadcast(slotIndex, { tags: e.target.value })}
            placeholder="Tags (comma-separated)"
            className={inputClass}
          />
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={slot.broadcast.madeForKids}
              onChange={(e) => updateStreamBroadcast(slotIndex, { madeForKids: e.target.checked })}
              className="accent-red-500"
            />
            Made for kids
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-700 bg-zinc-950/50 p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase text-zinc-500">Output</h3>
        <div className="space-y-2">
          {Object.entries(RESOLUTIONS).map(([key, { label }]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`resolution-${slotIndex}`}
                checked={slot.resolution === key}
                onChange={() => updateStreamSlot(slotIndex, { resolution: key })}
                className="accent-red-500"
              />
              {label}
            </label>
          ))}
          <div className="flex items-center gap-3 pt-1">
            <input
              type="range"
              min={800}
              max={2500}
              step={100}
              value={slot.bitrateKbps}
              onChange={(e) => updateStreamSlot(slotIndex, { bitrateKbps: Number(e.target.value) })}
              className="flex-1 accent-red-500"
            />
            <span className="w-20 text-right text-xs font-mono">{slot.bitrateKbps} kbps</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-700 bg-zinc-950/50 p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase text-zinc-500">Sources & layout</h3>
        <div className="mb-2 flex flex-col gap-1">
          {MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => updateStreamSlot(slotIndex, { layoutMode: mode })}
              className={`rounded-md px-2 py-1.5 text-xs font-medium ${
                slot.layoutMode === mode
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {LAYOUT_MODE_LABELS[mode]}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <div className="rounded-md bg-zinc-900/80 p-2">
            <p className="mb-1 text-xs text-zinc-500">Frame image</p>
            {slot.framePath ? (
              <>
                <p className="truncate text-xs font-medium text-emerald-400" title={slot.framePath}>
                  {fileBaseName(slot.framePath)}
                </p>
                <div className="mt-1.5 flex gap-1">
                  <button
                    type="button"
                    onClick={() => selectFrame(slotIndex)}
                    className="flex-1 rounded bg-zinc-700 px-2 py-1 text-xs hover:bg-zinc-600"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => clearFrame(slotIndex)}
                    className="flex-1 rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-400 hover:bg-red-900/50 hover:text-red-200"
                  >
                    Remove
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => selectFrame(slotIndex)}
                className="w-full rounded bg-zinc-700 px-2 py-1.5 text-xs hover:bg-zinc-600"
              >
                Select frame
              </button>
            )}
          </div>

          <div className="rounded-md bg-zinc-900/80 p-2">
            <p className="mb-1 text-xs text-zinc-500">Media video</p>
            {slot.mediaPath ? (
              <>
                <p className="truncate text-xs font-medium text-emerald-400" title={slot.mediaPath}>
                  {fileBaseName(slot.mediaPath)}
                </p>
                <div className="mt-1.5 flex gap-1">
                  <button
                    type="button"
                    onClick={() => selectMedia(slotIndex)}
                    className="flex-1 rounded bg-zinc-700 px-2 py-1 text-xs hover:bg-zinc-600"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => clearMedia(slotIndex)}
                    className="flex-1 rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-400 hover:bg-red-900/50 hover:text-red-200"
                  >
                    Remove
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => selectMedia(slotIndex)}
                className="w-full rounded bg-zinc-700 px-2 py-1.5 text-xs hover:bg-zinc-600"
              >
                Select media
              </button>
            )}
          </div>
        </div>
        {slotIndex === activeSlot && slot.layoutMode === LAYOUT_MODES.FRAME_MEDIA && (
          <p className="mt-1 text-xs text-amber-500/80">
            Drag the video overlay in the preview to set PiP position for this stream.
          </p>
        )}
        {slotIndex !== activeSlot && slot.layoutMode === LAYOUT_MODES.FRAME_MEDIA && (
          <p className="mt-1 text-xs text-zinc-500">
            Select this stream in the left panel to edit PiP overlay in preview.
          </p>
        )}
      </div>
    </div>
  )
}
