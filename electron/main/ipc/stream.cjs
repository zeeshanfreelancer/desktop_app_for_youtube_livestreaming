const { ipcMain } = require('electron')
const fs = require('fs')
const { FFmpegManager } = require('../services/FFmpegManager.cjs')
const { loadSettings } = require('../services/SecureStore.cjs')
const {
  setupBroadcastsForStream,
  completeAllBroadcasts,
} = require('../services/YouTubeBroadcast.cjs')

function registerStreamHandlers(getMainWindow) {
  const ffmpegManager = new FFmpegManager()
  let activeBroadcastIds = []

  ffmpegManager.setStatusCallback((payload) => {
    const win = getMainWindow()
    if (win && !win.isDestroyed()) {
      win.webContents.send('stream:status', payload)
    }
  })

  ipcMain.handle('stream:start', async (_event, config) => {
    if (ffmpegManager.isRunning()) {
      return { success: false, error: 'Stream is already running' }
    }

    try {
      const settings = loadSettings()
      const keys = (config.selectedKeyIndices || [])
        .map((i) => settings.streamKeys[i])
        .filter((k) => k && k.trim())

      if (keys.length === 0) {
        return { success: false, error: 'Select at least one stream key' }
      }

      if (config.framePath && !fs.existsSync(config.framePath)) {
        return { success: false, error: 'Frame file not found' }
      }

      if (config.mediaPath && !fs.existsSync(config.mediaPath)) {
        return { success: false, error: 'Media file not found' }
      }

      if (settings.youtubeTokens && settings.broadcast?.title?.trim()) {
        const missingStreamIds = (config.selectedKeyIndices || []).filter(
          (i) => !settings.youtube.streamIds?.[i]?.trim(),
        )

        if (missingStreamIds.length > 0) {
          return {
            success: false,
            error: 'Link each selected stream key to a YouTube stream in Broadcast Settings',
          }
        }

        try {
          activeBroadcastIds = await setupBroadcastsForStream(
            config.selectedKeyIndices,
            settings,
          )
        } catch (err) {
          return {
            success: false,
            error: `YouTube broadcast setup failed: ${err.message}`,
          }
        }
      }

      ffmpegManager.start({
        ...config,
        streamKeys: keys,
      })

      return { success: true }
    } catch (err) {
      if (activeBroadcastIds.length > 0) {
        await completeAllBroadcasts(activeBroadcastIds).catch(() => {})
        activeBroadcastIds = []
      }
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('stream:stop', async () => {
    try {
      await ffmpegManager.stop()

      if (activeBroadcastIds.length > 0) {
        await completeAllBroadcasts(activeBroadcastIds)
        activeBroadcastIds = []
      }

      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('stream:is-running', () => {
    return ffmpegManager.isRunning()
  })
}

module.exports = { registerStreamHandlers }
