const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('pomo', {
  getCycles: () => ipcRenderer.invoke('pomo:getCycles'),
  setCycles: (value) => ipcRenderer.invoke('pomo:setCycles', value),
  incrementCycles: () => ipcRenderer.invoke('pomo:incrementCycles'),
  getSoundPath: () => ipcRenderer.invoke('pomo:getSoundPath'),
  setSoundPath: (filePath) => ipcRenderer.invoke('pomo:setSoundPath', filePath),
  clearSoundPath: () => ipcRenderer.invoke('pomo:clearSoundPath'),
  beep: () => ipcRenderer.invoke('pomo:beep'),
  onSoundPathChanged: (cb) => {
    const wrapped = (_evt, p) => cb(p)
    ipcRenderer.on('pomo:soundPathChanged', wrapped)
    return () => ipcRenderer.removeListener('pomo:soundPathChanged', wrapped)
  }
})