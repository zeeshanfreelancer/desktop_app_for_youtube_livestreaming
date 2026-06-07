const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { app, safeStorage } = require('electron')

const SETTINGS_FILE = 'settings.json'

const DEFAULT_BROADCAST = {
  title: '',
  description: '',
  privacy: 'public',
  categoryId: '22',
  madeForKids: false,
  tags: '',
}

const DEFAULT_YOUTUBE = {
  clientId: '',
  streamIds: ['', '', '', '', ''],
}

const DEFAULT_SETTINGS = {
  resolution: '720p',
  bitrateKbps: 1500,
  streamKeys: ['', '', '', '', ''],
  broadcast: { ...DEFAULT_BROADCAST },
  youtube: { ...DEFAULT_YOUTUBE },
  youtubeTokens: null,
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
  const str = typeof value === 'string' ? value : JSON.stringify(value)
  if (canUseSafeStorage()) {
    return safeStorage.encryptString(str).toString('base64')
  }
  const key = crypto.createHash('sha256').update(app.getPath('userData')).digest()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  const encrypted = Buffer.concat([cipher.update(str, 'utf8'), cipher.final()])
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

function decryptJson(stored) {
  if (!stored) return null
  try {
    return JSON.parse(decryptValue(stored))
  } catch {
    return null
  }
}

function normalizeSettings(raw = {}) {
  return {
    resolution: raw.resolution || DEFAULT_SETTINGS.resolution,
    bitrateKbps: raw.bitrateKbps ?? DEFAULT_SETTINGS.bitrateKbps,
    streamKeys: (raw.streamKeys || DEFAULT_SETTINGS.streamKeys).map(decryptValue),
    broadcast: {
      ...DEFAULT_BROADCAST,
      ...(raw.broadcast || {}),
    },
    youtube: {
      ...DEFAULT_YOUTUBE,
      ...(raw.youtube || {}),
      streamIds: raw.youtube?.streamIds || DEFAULT_YOUTUBE.streamIds,
    },
    youtubeTokens: decryptJson(raw.youtubeTokensEncrypted),
  }
}

function loadSettings() {
  const filePath = getSettingsPath()
  if (!fs.existsSync(filePath)) {
    return normalizeSettings()
  }

  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    return normalizeSettings(raw)
  } catch {
    return normalizeSettings()
  }
}

function saveSettings(partial) {
  const current = loadSettings()
  const filePath = getSettingsPath()

  const broadcast = {
    ...current.broadcast,
    ...(partial.broadcast || {}),
  }

  const youtube = {
    ...current.youtube,
    ...(partial.youtube || {}),
  }

  const payload = {
    resolution: partial.resolution ?? current.resolution,
    bitrateKbps: partial.bitrateKbps ?? current.bitrateKbps,
    streamKeys: (partial.streamKeys ?? current.streamKeys).map(encryptValue),
    broadcast,
    youtube,
    youtubeTokensEncrypted: partial.youtubeTokens !== undefined
      ? (partial.youtubeTokens ? encryptValue(partial.youtubeTokens) : null)
      : (current.youtubeTokens ? encryptValue(current.youtubeTokens) : null),
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8')
  return loadSettings()
}

function saveYouTubeTokens(tokens) {
  return saveSettings({ youtubeTokens: tokens })
}

function clearYouTubeTokens() {
  return saveSettings({ youtubeTokens: null })
}

module.exports = {
  loadSettings,
  saveSettings,
  saveYouTubeTokens,
  clearYouTubeTokens,
}
