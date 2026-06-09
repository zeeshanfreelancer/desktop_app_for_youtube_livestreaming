const fs = require('fs')
const { app } = require('electron')

function resolveFfmpegPath() {
  let ffmpegPath = require('ffmpeg-static')
  if (!ffmpegPath) return null

  if (app.isPackaged) {
    const unpacked = ffmpegPath.replace('app.asar', 'app.asar.unpacked')
    if (fs.existsSync(unpacked)) return unpacked
  }

  return fs.existsSync(ffmpegPath) ? ffmpegPath : null
}

module.exports = { resolveFfmpegPath }
