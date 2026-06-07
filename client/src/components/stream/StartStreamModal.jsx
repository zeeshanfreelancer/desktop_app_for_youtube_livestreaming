import { useState } from 'react'
import { useApp } from '../../context/AppContext'

export default function StartStreamModal({ open, onClose, onConfirm }) {
  const { streamKeys } = useApp()
  const [selected, setSelected] = useState([])

  if (!open) return null

  const available = streamKeys
    .map((key, index) => ({ key, index }))
    .filter(({ key }) => key && key.trim())

  const toggle = (index) => {
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    )
  }

  const handleConfirm = () => {
    if (selected.length === 0) return
    onConfirm(selected)
    setSelected([])
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-md rounded-lg border border-zinc-600 bg-zinc-900 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Select YouTube Channel(s) to Stream
        </h2>

        {available.length === 0 ? (
          <p className="mb-4 text-sm text-zinc-400">
            Add at least one stream key in Stream Settings.
          </p>
        ) : (
          <ul className="mb-4 space-y-2">
            {available.map(({ index }) => (
              <li key={index}>
                <label className="flex cursor-pointer items-center gap-2 rounded-md bg-zinc-800 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(index)}
                    onChange={() => toggle(index)}
                    className="accent-red-500"
                  />
                  Stream Key {index + 1}
                </label>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-zinc-700 px-4 py-2 text-sm hover:bg-zinc-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selected.length === 0}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start Streaming
          </button>
        </div>
      </div>
    </div>
  )
}
