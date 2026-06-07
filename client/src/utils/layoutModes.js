export const LAYOUT_MODES = {
  FRAME_ONLY: 'frame-only',
  MEDIA_ONLY: 'media-only',
  FRAME_MEDIA: 'frame+media',
}

export const LAYOUT_MODE_LABELS = {
  [LAYOUT_MODES.FRAME_ONLY]: 'Frame Only',
  [LAYOUT_MODES.MEDIA_ONLY]: 'Media Only',
  [LAYOUT_MODES.FRAME_MEDIA]: 'Frame + Media',
}

export const RESOLUTIONS = {
  '720p': { width: 1280, height: 720, label: '720p (1280×720)' },
  '1080p': { width: 1920, height: 1080, label: '1080p (1920×1080)' },
}

export const DEFAULT_OVERLAY = {
  x: 0.65,
  y: 0.55,
  width: 0.3,
  height: 0.35,
}
