const fs = require('fs')
const path = require('path')
const { dialog, ipcMain } = require('electron')

const IMAGE_MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
}

const MAX_IMAGE_DATA_URL_BYTES = 20 * 1024 * 1024

function registerFileHandlers() {
  ipcMain.handle('files:open-image', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Frame Image',
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] },
      ],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  })

  ipcMain.handle('files:open-video', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Media Video',
      properties: ['openFile'],
      filters: [
        { name: 'Videos', extensions: ['mp4'] },
      ],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  })

  ipcMain.handle('files:to-preview-url', async (_event, filePath) => {
    if (!filePath || !fs.existsSync(filePath)) {
      return null
    }

    const ext = path.extname(filePath).toLowerCase()

    if (IMAGE_MIME[ext]) {
      const stat = fs.statSync(filePath)
      if (stat.size > MAX_IMAGE_DATA_URL_BYTES) {
        return `local-media://load?path=${encodeURIComponent(filePath)}`
      }

      const data = await fs.promises.readFile(filePath)
      const mime = IMAGE_MIME[ext]
      return `data:${mime};base64,${data.toString('base64')}`
    }

    if (ext === '.mp4') {
      return `local-media://load?path=${encodeURIComponent(filePath)}`
    }

    return null
  })
}

module.exports = { registerFileHandlers }
