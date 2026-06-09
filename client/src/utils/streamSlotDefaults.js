import { DEFAULT_BROADCAST } from './broadcastDefaults'
import { DEFAULT_OVERLAY, LAYOUT_MODES } from './layoutModes'

export const STREAM_COUNT = 5

export function createDefaultStreamSlot(index) {
  return {
    name: `Stream ${index + 1}`,
    streamKey: '',
    youtubeStreamId: '',
    broadcast: {
      ...DEFAULT_BROADCAST,
      title: '',
    },
    resolution: '720p',
    bitrateKbps: 1500,
    layoutMode: LAYOUT_MODES.FRAME_ONLY,
    framePath: '',
    mediaPath: '',
    overlay: { ...DEFAULT_OVERLAY },
    mediaStartSeconds: 0,
    mediaLoop: false,
  }
}

export function createDefaultStreams() {
  return Array.from({ length: STREAM_COUNT }, (_, i) => createDefaultStreamSlot(i))
}
