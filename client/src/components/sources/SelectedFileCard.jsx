export default function SelectedFileCard({
  fileName,
  filePath,
  onChange,
  onRemove,
  changeLabel = 'Change',
}) {
  return (
    <div className="mt-2 rounded-md border border-emerald-900/50 bg-emerald-950/40 p-2">
      <p className="text-xs text-emerald-400">Selected</p>
      <p className="truncate text-sm font-medium text-white" title={filePath}>
        {fileName}
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onChange}
          className="flex-1 rounded-md bg-zinc-700 px-2 py-1.5 text-xs font-medium text-white hover:bg-zinc-600"
        >
          {changeLabel}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="flex-1 rounded-md bg-zinc-800 px-2 py-1.5 text-xs font-medium text-zinc-300 hover:bg-red-900/60 hover:text-red-200"
        >
          Remove
        </button>
      </div>
    </div>
  )
}
