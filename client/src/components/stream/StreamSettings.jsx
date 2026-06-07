import { useApp } from '../../context/AppContext'
import { RESOLUTIONS } from '../../utils/layoutModes'

export default function StreamSettings() {
  const { resolution, bitrateKbps, updateResolution, updateBitrate } = useApp()

  return (
    <section className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Resolution
      </h2>
      <div className="mb-4 space-y-2">
        {Object.entries(RESOLUTIONS).map(([key, { label }]) => (
          <label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="resolution"
              value={key}
              checked={resolution === key}
              onChange={() => updateResolution(key)}
              className="accent-red-500"
            />
            {label}
          </label>
        ))}
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Bitrate
      </h2>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={800}
          max={2500}
          step={100}
          value={bitrateKbps}
          onChange={(e) => updateBitrate(Number(e.target.value))}
          className="flex-1 accent-red-500"
        />
        <span className="w-20 text-right text-sm font-mono text-zinc-300">
          {bitrateKbps} kbps
        </span>
      </div>
    </section>
  )
}
