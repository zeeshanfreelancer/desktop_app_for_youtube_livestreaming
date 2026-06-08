import { useApp } from '../../context/AppContext'
import { fileBaseName } from '../../utils/fileDisplay'
import SelectedFileCard from './SelectedFileCard'

export default function FrameSource() {
  const { framePath, selectFrame, clearFrame } = useApp()
  const fileName = fileBaseName(framePath)

  return (
    <section className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Frame Source
      </h2>

      {fileName ? (
        <SelectedFileCard
          fileName={fileName}
          filePath={framePath}
          onChange={() => selectFrame()}
          onRemove={() => clearFrame()}
          changeLabel="Change"
        />
      ) : (
        <>
          <button
            type="button"
            onClick={() => selectFrame()}
            className="w-full rounded-md bg-zinc-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-600"
          >
            Select Image
          </button>
          <p className="mt-2 text-xs text-zinc-500">PNG, JPG, JPEG — 16:9 background</p>
        </>
      )}
    </section>
  )
}
