const { ipcMain } = require('electron')
const fs = require('fs')
const { MultiStreamManager } = require('../services/MultiStreamManager.cjs')
const { buildStreamConfigFromSlot } = require('../services/buildFfmpegArgs.cjs')
const { loadSettings } = require('../services/SecureStore.cjs')
const {
  setupBroadcastForSlot,
  completeAllBroadcasts,
} = require('../services/YouTubeBroadcast.cjs')

function validateSlot(slot, streamIndex) {
  const label = slot.name || `Stream ${streamIndex + 1}`

  if (!slot.streamKey?.trim()) {
    return `${label}: stream key is required`
  }

  if (slot.layoutMode === 'frame-only' && !slot.framePath) {
    return `${label}: frame image is required for Frame Only mode`
  }

  if (slot.layoutMode === 'media-only' && !slot.mediaPath) {
    return `${label}: media video is required for Media Only mode`
  }

  if (slot.layoutMode === 'frame+media') {
    if (!slot.framePath) return `${label}: frame image is required`
    if (!slot.mediaPath) return `${label}: media video is required`
    if (!slot.overlay?.width || !slot.overlay?.height) {
      return `${label}: video overlay is not configured`
    }
  }

  if (slot.framePath && !fs.existsSync(slot.framePath)) {
    return `${label}: frame file not found`
  }

  if (slot.mediaPath && !fs.existsSync(slot.mediaPath)) {
    return `${label}: media file not found`
  }

  return null
}

function registerStreamHandlers(getMainWindow) {
  const streamManager = new MultiStreamManager()
  const broadcastIdsByStream = new Map()

  streamManager.setStatusCallback((payload) => {
    const win = getMainWindow()
    if (win && !win.isDestroyed()) {
      win.webContents.send('stream:status', payload)
    }
  })

  ipcMain.handle('stream:start', async (_event, { streamIndices }) => {
    const indices = streamIndices || []
    if (indices.length === 0) {
      return { success: false, error: 'Select at least one stream to start' }
    }

    const settings = loadSettings()
    const started = []
    const errors = []

    for (const index of indices) {
      if (streamManager.isRunning(index)) {
        errors.push(`Stream ${index + 1} is already live`)
        continue
      }

      const slot = settings.streams[index]
      if (!slot) {
        errors.push(`Stream ${index + 1} not found`)
        continue
      }

      const validationError = validateSlot(slot, index)
      if (validationError) {
        errors.push(validationError)
        continue
      }

      try {
        let meta = { name: slot.name }

        if (settings.youtubeTokens && slot.broadcast?.title?.trim()) {
          const broadcastMeta = await setupBroadcastForSlot(slot, settings.youtubeTokens)
          if (broadcastMeta) {
            meta = { ...meta, ...broadcastMeta }
            broadcastIdsByStream.set(index, broadcastMeta.broadcastId)
          }
        }

        streamManager.startStream(index, buildStreamConfigFromSlot(slot), meta)
        started.push(index)
      } catch (err) {
        errors.push(`Stream ${index + 1}: ${err.message}`)
      }
    }

    if (started.length === 0) {
      return {
        success: false,
        error: errors.join('. ') || 'Failed to start streams',
      }
    }

    return {
      success: true,
      started,
      warnings: errors.length > 0 ? errors.join('. ') : null,
    }
  })

  ipcMain.handle('stream:stop', async (_event, { streamIndex } = {}) => {
    try {
      if (streamIndex === undefined || streamIndex === null) {
        const ids = []
        for (const [, broadcastId] of broadcastIdsByStream) {
          if (broadcastId) ids.push(broadcastId)
        }
        await streamManager.stopAll()
        await completeAllBroadcasts(ids)
        broadcastIdsByStream.clear()
        return { success: true }
      }

      const { broadcastId } = await streamManager.stopStream(streamIndex)
      if (broadcastId || broadcastIdsByStream.get(streamIndex)) {
        await completeAllBroadcasts([
          broadcastId || broadcastIdsByStream.get(streamIndex),
        ])
        broadcastIdsByStream.delete(streamIndex)
      }

      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('stream:get-active', () => {
    return streamManager.getActiveStreams()
  })

  ipcMain.handle('stream:is-running', (_event, streamIndex) => {
    return streamManager.isRunning(streamIndex)
  })
}

module.exports = { registerStreamHandlers }
