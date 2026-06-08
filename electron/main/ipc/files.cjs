const fs = require('fs')
const path = require('path')
const { dialog, ipcMain } = require('electron')

const IMAGE_MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
}

const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.m4v', '.mkv'])

const MAX_IMAGE_DATA_URL_BYTES = 20 * 1024 * 1024

function registerFileHandlers(getMainWindow) {
  const openDialog = (options) => {
    const win = getMainWindow?.()
    if (win && !win.isDestroyed()) {
      return dialog.showOpenDialog(win, options)
    }
    return dialog.showOpenDialog(options)
  }

  ipcMain.handle('files:open-image', async () => {
    const result = await openDialog({
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
    const result = await openDialog({
      title: 'Select Media Video',
      properties: ['openFile'],
      filters: [
        { name: 'Videos', extensions: ['mp4', 'webm', 'mov', 'm4v', 'mkv'] },
        { name: 'All files', extensions: ['*'] },
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
        return `local-media://file?path=${encodeURIComponent(filePath)}`
      }

      const data = await fs.promises.readFile(filePath)
      const mime = IMAGE_MIME[ext]
      return `data:${mime};base64,${data.toString('base64')}`
    }

    if (VIDEO_EXTENSIONS.has(ext)) {
      return `local-media://file?path=${encodeURIComponent(filePath)}`
    }

    return null
  })
}

module.exports = { registerFileHandlers }
