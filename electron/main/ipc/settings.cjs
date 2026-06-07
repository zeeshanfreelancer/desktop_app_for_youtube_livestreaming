const { ipcMain } = require('electron')
const { loadSettings, saveSettings } = require('../services/SecureStore.cjs')

function registerSettingsHandlers() {
  ipcMain.handle('settings:load', () => {
    const settings = loadSettings()
    const { youtubeTokens, ...safeSettings } = settings
    return {
      ...safeSettings,
      youtubeConnected: Boolean(youtubeTokens),
    }
  })

  ipcMain.handle('settings:save', (_event, data) => {
    return saveSettings(data)
  })
}

module.exports = { registerSettingsHandlers }
