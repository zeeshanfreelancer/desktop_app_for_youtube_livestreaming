const { spawn } = require('child_process')
const ffmpegPath = require('ffmpeg-static')
const { buildFfmpegArgs } = require('./buildFfmpegArgs.cjs')

class FFmpegManager {
  constructor() {
    this.process = null
    this.onStatus = null
  }

  setStatusCallback(callback) {
    this.onStatus = callback
  }

  emit(status, message = '') {
    if (this.onStatus) {
      this.onStatus({ status, message })
    }
  }

  isRunning() {
    return this.process !== null
  }

  start(config) {
    if (this.process) {
      throw new Error('Stream is already running')
    }

    const args = buildFfmpegArgs(config)

    this.emit('starting', 'Launching FFmpeg...')

    this.process = spawn(ffmpegPath, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    this.process.stdout.on('data', (data) => {
      const text = data.toString().trim()
      if (text) this.emit('live', text)
    })

    this.process.stderr.on('data', (data) => {
      const text = data.toString().trim()
      if (text.includes('error') || text.includes('Error')) {
        this.emit('error', text)
      }
    })

    this.process.on('error', (err) => {
      this.emit('error', err.message)
      this.process = null
    })

    this.process.on('close', (code) => {
      this.process = null
      if (code === 0 || code === null) {
        this.emit('idle', 'Stream stopped')
      } else {
        this.emit('error', `FFmpeg exited with code ${code}`)
      }
    })

    this.emit('live', 'Streaming to YouTube')
    return { success: true }
  }

  stop() {
    return new Promise((resolve) => {
      if (!this.process) {
        this.emit('idle', 'Stream stopped')
        resolve({ success: true })
        return
      }

      const proc = this.process
      this.emit('stopping', 'Stopping stream...')

      const forceKill = setTimeout(() => {
        if (proc && !proc.killed) {
          proc.kill('SIGKILL')
        }
      }, 5000)

      proc.once('close', () => {
        clearTimeout(forceKill)
        this.process = null
        this.emit('idle', 'Stream stopped')
        resolve({ success: true })
      })

      proc.kill('SIGTERM')
    })
  }
}

module.exports = { FFmpegManager }
