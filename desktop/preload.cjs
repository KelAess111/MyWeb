const { contextBridge, ipcRenderer } = require('electron')
if (process.isMainFrame) contextBridge.exposeInMainWorld('studio', {
  info: () => ipcRenderer.invoke('studio:info'),
  choose: () => ipcRenderer.invoke('studio:choose'),
  mode: mode => ipcRenderer.invoke('studio:mode', mode),
  inspect: () => ipcRenderer.invoke('studio:inspect'),
  publish: (version, files) => ipcRenderer.invoke('studio:publish', version, files),
  onLog: fn => { const listener = (_, text) => fn(text); ipcRenderer.on('studio:log', listener); return () => ipcRenderer.removeListener('studio:log', listener) },
})
