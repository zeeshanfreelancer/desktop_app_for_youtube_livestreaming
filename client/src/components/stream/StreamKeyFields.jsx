import { useApp } from '../../context/AppContext'

export default function StreamKeyFields() {
  const { streamKeys, updateStreamKey } = useApp()

  return (
    <section className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Stream Keys
      </h2>
      <div className="space-y-2">
        {streamKeys.map((key, index) => (
          <div key={index}>
            <label className="mb-1 block text-xs text-zinc-500">
              Stream Key {index + 1}
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => updateStreamKey(index, e.target.value)}
              placeholder="YouTube stream key"
              className="w-full rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-white placeholder:text-zinc-600 focus:border-red-500 focus:outline-none"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
