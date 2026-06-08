const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  toFileUrl: (filePath) => {
    if (!filePath) return null
    return `local-media://load?path=${encodeURIComponent(filePath)}`
  },

  files: {
    openImage: () => ipcRenderer.invoke('files:open-image'),
    openVideo: () => ipcRenderer.invoke('files:open-video'),
    toPreviewUrl: (filePath) => ipcRenderer.invoke('files:to-preview-url', filePath),
  },

  settings: {
    load: () => ipcRenderer.invoke('settings:load'),
    save: (data) => ipcRenderer.invoke('settings:save', data),
  },

  stream: {
    start: (streamIndices) => ipcRenderer.invoke('stream:start', { streamIndices }),
    stop: (streamIndex) => ipcRenderer.invoke('stream:stop', { streamIndex }),
    stopAll: () => ipcRenderer.invoke('stream:stop', { streamIndex: null }),
    getActive: () => ipcRenderer.invoke('stream:get-active'),
    isRunning: (streamIndex) => ipcRenderer.invoke('stream:is-running', streamIndex),
    onStatus: (callback) => {
      const handler = (_event, payload) => callback(payload)
      ipcRenderer.on('stream:status', handler)
      return () => ipcRenderer.removeListener('stream:status', handler)
    },
  },

  youtube: {
    connect: () => ipcRenderer.invoke('youtube:connect'),
    disconnect: () => ipcRenderer.invoke('youtube:disconnect'),
    status: () => ipcRenderer.invoke('youtube:status'),
    listStreams: () => ipcRenderer.invoke('youtube:list-streams'),
  },
})
