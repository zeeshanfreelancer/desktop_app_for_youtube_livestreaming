import { RESOLUTIONS } from './layoutModes'

export function overlayToNormalized(overlay, previewSize) {
  if (!previewSize.width || !previewSize.height) return overlay
  return {
    x: overlay.x / previewSize.width,
    y: overlay.y / previewSize.height,
    width: overlay.width / previewSize.width,
    height: overlay.height / previewSize.height,
  }
}

export function overlayFromNormalized(normalized, previewSize) {
  if (!previewSize.width || !previewSize.height) return null
  return {
    x: normalized.x * previewSize.width,
    y: normalized.y * previewSize.height,
    width: normalized.width * previewSize.width,
    height: normalized.height * previewSize.height,
  }
}

export function toOutputOverlay(overlay, previewSize, resolution) {
  const { width: outW, height: outH } = RESOLUTIONS[resolution]
  const { width: prevW, height: prevH } = previewSize

  if (!prevW || !prevH) {
    return {
      x: Math.round(overlay.x * outW),
      y: Math.round(overlay.y * outH),
      width: Math.round(overlay.width * outW),
      height: Math.round(overlay.height * outH),
    }
  }

  const scaleX = outW / prevW
  const scaleY = outH / prevH

  return {
    x: Math.round(overlay.x * scaleX),
    y: Math.round(overlay.y * scaleY),
    width: Math.round(overlay.width * scaleX),
    height: Math.round(overlay.height * scaleY),
  }
}

export function toOutputOverlayFromNormalized(normalized, resolution) {
  const { width: outW, height: outH } = RESOLUTIONS[resolution]
  return {
    x: Math.round(normalized.x * outW),
    y: Math.round(normalized.y * outH),
    width: Math.round(normalized.width * outW),
    height: Math.round(normalized.height * outH),
  }
}

export function clampOverlay(overlay, containerWidth, containerHeight, minSize = 80) {
  const width = Math.max(minSize, Math.min(overlay.width, containerWidth))
  const height = Math.max(minSize, Math.min(overlay.height, containerHeight))
  const x = Math.max(0, Math.min(overlay.x, containerWidth - width))
  const y = Math.max(0, Math.min(overlay.y, containerHeight - height))

  return { x, y, width, height }
}

export function formatMediaTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const totalSeconds = Math.floor(seconds)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatDuration(ms) {
  if (!ms || ms < 0) return '00:00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}
