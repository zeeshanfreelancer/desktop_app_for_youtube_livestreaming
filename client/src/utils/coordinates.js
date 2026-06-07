import { RESOLUTIONS } from './layoutModes'

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

export function clampOverlay(overlay, containerWidth, containerHeight, minSize = 80) {
  const width = Math.max(minSize, Math.min(overlay.width, containerWidth))
  const height = Math.max(minSize, Math.min(overlay.height, containerHeight))
  const x = Math.max(0, Math.min(overlay.x, containerWidth - width))
  const y = Math.max(0, Math.min(overlay.y, containerHeight - height))

  return { x, y, width, height }
}
