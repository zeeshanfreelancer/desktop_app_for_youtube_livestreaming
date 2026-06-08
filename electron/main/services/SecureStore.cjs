const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { app, safeStorage } = require('electron')

const SETTINGS_FILE = 'settings.json'
const STREAM_COUNT = 5

const DEFAULT_BROADCAST = {
  title: '',
  description: '',
  privacy: 'public',
  categoryId: '22',
  madeForKids: false,
  tags: '',
}

const DEFAULT_OVERLAY = {
  x: 0.65,
  y: 0.55,
  width: 0.3,
  height: 0.35,
}

function createDefaultStreamSlot(index) {
  return {
    name: `Stream ${index + 1}`,
    streamKey: '',
    youtubeStreamId: '',
    broadcast: { ...DEFAULT_BROADCAST },
    resolution: '720p',
    bitrateKbps: 1500,
    layoutMode: 'frame-only',
    framePath: '',
    mediaPath: '',
    overlay: { ...DEFAULT_OVERLAY },
    mediaStartSeconds: 0,
  }
}

const DEFAULT_YOUTUBE = {
  clientId: '',
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

function migrateLegacyStreams(raw) {
  const streams = Array.from({ length: STREAM_COUNT }, (_, i) => createDefaultStreamSlot(i))

  if (Array.isArray(raw.streams) && raw.streams.length === STREAM_COUNT) {
    return raw.streams.map((slot, i) => ({
      ...createDefaultStreamSlot(i),
      ...slot,
      broadcast: { ...DEFAULT_BROADCAST, ...(slot.broadcast || {}) },
      overlay: { ...DEFAULT_OVERLAY, ...(slot.overlay || {}) },
    }))
  }

  const legacyKeys = raw.streamKeys || []
  const legacyStreamIds = raw.youtube?.streamIds || []

  for (let i = 0; i < STREAM_COUNT; i++) {
    if (legacyKeys[i]) {
      streams[i].streamKey = decryptValue(legacyKeys[i])
    }
    if (legacyStreamIds[i]) {
      streams[i].youtubeStreamId = legacyStreamIds[i]
    }
    if (raw.broadcast) {
      streams[i].broadcast = { ...DEFAULT_BROADCAST, ...raw.broadcast }
    }
    if (raw.resolution) streams[i].resolution = raw.resolution
    if (raw.bitrateKbps) streams[i].bitrateKbps = raw.bitrateKbps
  }

  return streams
}

function normalizeSettings(raw = {}) {
  if (Array.isArray(raw.streams) && raw.streams.length === STREAM_COUNT) {
    return {
      streams: raw.streams.map((slot, i) => {
        const { streamKeyEncrypted, streamKey, ...rest } = slot
        return {
          ...createDefaultStreamSlot(i),
          ...rest,
          streamKey: streamKeyEncrypted
            ? decryptValue(streamKeyEncrypted)
            : (streamKey || ''),
          broadcast: { ...DEFAULT_BROADCAST, ...(slot.broadcast || {}) },
          overlay: { ...DEFAULT_OVERLAY, ...(slot.overlay || {}) },
        }
      }),
      youtube: { ...DEFAULT_YOUTUBE, ...(raw.youtube || {}) },
      youtubeTokens: decryptJson(raw.youtubeTokensEncrypted),
      activeSlot: raw.activeSlot ?? 0,
    }
  }

  return {
    streams: migrateLegacyStreams(raw),
    youtube: { ...DEFAULT_YOUTUBE, ...(raw.youtube || {}) },
    youtubeTokens: decryptJson(raw.youtubeTokensEncrypted),
    activeSlot: raw.activeSlot ?? 0,
  }
}

function normalizeClientStreamSlot(slot, index) {
  const { streamKey, streamKeyEncrypted, ...rest } = slot
  return {
    ...createDefaultStreamSlot(index),
    ...rest,
    streamKey: streamKey || '',
  }
}

function serializeStreamSlot(slot) {
  const { streamKey, streamKeyEncrypted, ...rest } = slot
  return {
    ...rest,
    streamKeyEncrypted: encryptValue(streamKey || ''),
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

  const streams = Array.isArray(partial.streams) && partial.streams.length === STREAM_COUNT
    ? partial.streams.map((slot, i) => normalizeClientStreamSlot(slot, i))
    : current.streams

  const payload = {
    streams: streams.map(serializeStreamSlot),
    youtube: {
      ...current.youtube,
      ...(partial.youtube || {}),
    },
    activeSlot: partial.activeSlot ?? current.activeSlot,
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

function getStreamSlot(index) {
  const settings = loadSettings()
  return settings.streams[index]
}

module.exports = {
  loadSettings,
  saveSettings,
  saveYouTubeTokens,
  clearYouTubeTokens,
  getStreamSlot,
  STREAM_COUNT,
}
