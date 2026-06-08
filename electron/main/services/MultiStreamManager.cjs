const { FFmpegManager } = require('./FFmpegManager.cjs')

class MultiStreamManager {
  constructor() {
    this.active = new Map()
    this.onStatus = null
  }

  setStatusCallback(callback) {
    this.onStatus = callback
  }

  emit(streamIndex, payload) {
    if (this.onStatus) {
      this.onStatus({ streamIndex, ...payload })
    }
  }

  getActiveStreams() {
    return [...this.active.entries()].map(([streamIndex, entry]) => ({
      streamIndex,
      status: entry.status,
      startedAt: entry.startedAt,
      liveUrl: entry.liveUrl,
      name: entry.name,
    }))
  }

  isRunning(streamIndex) {
    if (streamIndex !== undefined) {
      return this.active.has(streamIndex)
    }
    return this.active.size > 0
  }

  startStream(streamIndex, config, meta = {}) {
    if (this.active.has(streamIndex)) {
      throw new Error(`Stream ${streamIndex + 1} is already running`)
    }

    const manager = new FFmpegManager()
    const entry = {
      manager,
      startedAt: null,
      liveUrl: meta.liveUrl || null,
      broadcastId: meta.broadcastId || null,
      name: meta.name || `Stream ${streamIndex + 1}`,
      status: 'starting',
    }

    manager.setStatusCallback(({ status, message }) => {
      entry.status = status
      if ((status === 'live' || status === 'starting') && !entry.startedAt) {
        entry.startedAt = Date.now()
      }
      this.emit(streamIndex, {
        status,
        message,
        startedAt: entry.startedAt,
        liveUrl: entry.liveUrl,
        name: entry.name,
      })
    })

    this.active.set(streamIndex, entry)
    manager.start(config)

    if (!entry.startedAt) {
      entry.startedAt = Date.now()
    }
    entry.status = 'live'
    this.emit(streamIndex, {
      status: 'live',
      message: 'Streaming to YouTube',
      startedAt: entry.startedAt,
      liveUrl: entry.liveUrl,
      name: entry.name,
    })
  }

  async stopStream(streamIndex) {
    const entry = this.active.get(streamIndex)
    if (!entry) return { broadcastId: null }

    await entry.manager.stop()
    this.active.delete(streamIndex)
    this.emit(streamIndex, {
      status: 'idle',
      message: 'Stream stopped',
      startedAt: null,
      liveUrl: null,
      name: entry.name,
    })

    return { broadcastId: entry.broadcastId }
  }

  async stopAll() {
    const indices = [...this.active.keys()]
    const broadcastIds = []

    for (const index of indices) {
      const { broadcastId } = await this.stopStream(index)
      if (broadcastId) broadcastIds.push(broadcastId)
    }

    return broadcastIds
  }
}

module.exports = { MultiStreamManager }
