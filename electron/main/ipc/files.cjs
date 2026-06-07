const { dialog, ipcMain } = require('electron')

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
}

module.exports = { registerFileHandlers }
