const { app, BrowserWindow } = require('electron')
const fs = require('fs')
const path = require('path')
const { registerLocalMediaProtocol } = require('./protocol/localMedia.cjs')
const { registerFileHandlers } = require('./ipc/files.cjs')
const { registerSettingsHandlers } = require('./ipc/settings.cjs')
const { registerStreamHandlers } = require('./ipc/stream.cjs')
const { registerYouTubeHandlers } = require('./ipc/youtube.cjs')

const useDevServer = process.env.ELECTRON_DEV === '1'
const distHtml = path.join(__dirname, '../../client/dist/index.html')

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1100,
    minHeight: 700,
    title: 'YouTube Stream',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (useDevServer) {
    mainWindow.loadURL('http://localhost:5173')
  } else if (fs.existsSync(distHtml)) {
    mainWindow.loadFile(distHtml)
  } else {
    mainWindow.loadURL('http://localhost:5173')
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  registerLocalMediaProtocol()
  createWindow()
  registerFileHandlers(() => mainWindow)
  registerSettingsHandlers()
  registerYouTubeHandlers()
  registerStreamHandlers(() => mainWindow)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
