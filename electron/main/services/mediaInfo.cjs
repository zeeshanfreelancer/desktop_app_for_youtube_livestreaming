const fs = require('fs')
const { spawnSync } = require('child_process')

function getFfmpegPath() {
  try {
    const { resolveFfmpegPath } = require('../utils/resolveFfmpegPath.cjs')
    const resolved = resolveFfmpegPath()
    if (resolved) return resolved
  } catch {
    // Electron app may not be ready; fall back to dev path.
  }

  const fallback = require('ffmpeg-static')
  return fallback && fs.existsSync(fallback) ? fallback : null
}

function getVideoDuration(filePath) {
  const ffmpegPath = getFfmpegPath()
  if (!ffmpegPath || !filePath || !fs.existsSync(filePath)) return null

  const result = spawnSync(
    ffmpegPath,
    ['-hide_banner', '-i', filePath],
    {
      encoding: 'utf8',
      windowsHide: true,
      maxBuffer: 16 * 1024 * 1024,
    },
  )

  const text = `${result.stderr || ''}\n${result.stdout || ''}`
  const match = text.match(/Duration:\s*(\d+):(\d{2}):(\d{2}(?:\.\d+)?)/)
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  const seconds = Number(match[3])
  if (!Number.isFinite(hours + minutes + seconds)) return null

  return hours * 3600 + minutes * 60 + seconds
}

module.exports = { getVideoDuration }
