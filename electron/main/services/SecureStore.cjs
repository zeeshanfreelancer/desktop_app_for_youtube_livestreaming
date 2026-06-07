const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { app, safeStorage } = require('electron')

const SETTINGS_FILE = 'settings.json'

const DEFAULT_SETTINGS = {
  resolution: '720p',
  bitrateKbps: 1500,
  streamKeys: ['', '', '', '', ''],
}

function getSettingsPath() {
  return path.join(app.getPath('userData'), SETTINGS_FILE)
}

function canUseSafeStorage() {
  try {
    return safeStorage.isEncryptionAvailable()
  } catch {
    return false
  }
}

function encryptValue(value) {
  if (!value) return ''
  if (canUseSafeStorage()) {
    return safeStorage.encryptString(value).toString('base64')
  }
  const key = crypto.createHash('sha256').update(app.getPath('userData')).digest()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  return `local:${iv.toString('base64')}:${encrypted.toString('base64')}`
}

function decryptValue(stored) {
  if (!stored) return ''
  if (canUseSafeStorage() && !stored.startsWith('local:')) {
    return safeStorage.decryptString(Buffer.from(stored, 'base64'))
  }
  if (stored.startsWith('local:')) {
    const [, ivB64, dataB64] = stored.split(':')
    const key = crypto.createHash('sha256').update(app.getPath('userData')).digest()
    const iv = Buffer.from(ivB64, 'base64')
    const data = Buffer.from(dataB64, 'base64')
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
  }
  return ''
}

function loadSettings() {
  const filePath = getSettingsPath()
  if (!fs.existsSync(filePath)) {
    return { ...DEFAULT_SETTINGS }
  }

  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    return {
      resolution: raw.resolution || DEFAULT_SETTINGS.resolution,
      bitrateKbps: raw.bitrateKbps ?? DEFAULT_SETTINGS.bitrateKbps,
      streamKeys: (raw.streamKeys || DEFAULT_SETTINGS.streamKeys).map(decryptValue),
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function saveSettings({ resolution, bitrateKbps, streamKeys }) {
  const filePath = getSettingsPath()
  const payload = {
    resolution: resolution || DEFAULT_SETTINGS.resolution,
    bitrateKbps: bitrateKbps ?? DEFAULT_SETTINGS.bitrateKbps,
    streamKeys: (streamKeys || DEFAULT_SETTINGS.streamKeys).map(encryptValue),
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8')
  return loadSettings()
}

module.exports = { loadSettings, saveSettings }
