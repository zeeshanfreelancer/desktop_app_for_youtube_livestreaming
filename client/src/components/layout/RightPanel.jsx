import StreamSettings from '../stream/StreamSettings'
import BroadcastSettings from '../stream/BroadcastSettings'
import StreamKeyFields from '../stream/StreamKeyFields'
import StreamControls from '../stream/StreamControls'

export default function RightPanel() {
  return (
    <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-4">
      <h1 className="text-lg font-bold text-white">Stream Settings</h1>
      <BroadcastSettings />
      <StreamSettings />
      <StreamKeyFields />
      <StreamControls />
    </aside>
  )
}
