const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  toFileUrl: (filePath) => {
    if (!filePath) return null
    return `local-media://load?path=${encodeURIComponent(filePath)}`
  },

  files: {
    openImage: () => ipcRenderer.invoke('files:open-image'),
    openVideo: () => ipcRenderer.invoke('files:open-video'),
  },

  settings: {
    load: () => ipcRenderer.invoke('settings:load'),
    save: (data) => ipcRenderer.invoke('settings:save', data),
  },

  stream: {
    start: (config) => ipcRenderer.invoke('stream:start', config),
    stop: () => ipcRenderer.invoke('stream:stop'),
    isRunning: () => ipcRenderer.invoke('stream:is-running'),
    onStatus: (callback) => {
      const handler = (_event, payload) => callback(payload)
      ipcRenderer.on('stream:status', handler)
      return () => ipcRenderer.removeListener('stream:status', handler)
    },
  },
})
