const { ipcMain } = require('electron')
const {
  connectYouTube,
  disconnectYouTube,
  getYouTubeStatus,
  listLiveStreams,
} = require('../services/YouTubeAuth.cjs')

function registerYouTubeHandlers() {
  ipcMain.handle('youtube:connect', async () => {
    try {
      return { success: true, ...(await connectYouTube()) }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('youtube:disconnect', async () => {
    try {
      await disconnectYouTube()
      return { success: true, connected: false }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('youtube:status', async () => {
    try {
      return { success: true, ...(await getYouTubeStatus()) }
    } catch (err) {
      return { success: false, connected: false, error: err.message }
    }
  })

  ipcMain.handle('youtube:list-streams', async () => {
    try {
      const streams = await listLiveStreams()
      return { success: true, streams }
    } catch (err) {
      return { success: false, error: err.message, streams: [] }
    }
  })
}

module.exports = { registerYouTubeHandlers }
