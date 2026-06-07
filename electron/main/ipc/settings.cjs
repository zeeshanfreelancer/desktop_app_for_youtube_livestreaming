const { ipcMain } = require('electron')
const { loadSettings, saveSettings } = require('../services/SecureStore.cjs')

function registerSettingsHandlers() {
  ipcMain.handle('settings:load', () => {
    return loadSettings()
  })

  ipcMain.handle('settings:save', (_event, data) => {
    return saveSettings(data)
  })
}

module.exports = { registerSettingsHandlers }
