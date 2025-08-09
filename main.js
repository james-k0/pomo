const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron/main')
const { shell } = require('electron')
const path = require('node:path')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  win.loadFile('index.html')
  return win
}

let store
async function setupStoreHandlers() {
  const { default: Store } = await import('electron-store')
  store = new Store({ name: 'pomo' })

  ipcMain.handle('pomo:getCycles', () => store.get('cycles', 0))
  ipcMain.handle('pomo:setCycles', (_evt, value) => {
    const n = Number.isFinite(Number(value)) ? Number(value) : 0
    const v = Math.max(0, Math.trunc(n))
    store.set('cycles', v)
    return v
  })
  ipcMain.handle('pomo:incrementCycles', () => {
    const current = Number(store.get('cycles', 0)) || 0
    const next = current + 1
    store.set('cycles', next)
    return next
  })

  ipcMain.handle('pomo:getSoundPath', () => store.get('soundPath', ''))
  ipcMain.handle('pomo:setSoundPath', (_evt, filePath) => {
    if (typeof filePath === 'string' && filePath.length > 0) {
      store.set('soundPath', filePath)
      return filePath
    }
    return ''
  })
  ipcMain.handle('pomo:clearSoundPath', () => {
    store.delete('soundPath')
    return ''
  })
  ipcMain.handle('pomo:beep', () => {
    try { shell.beep() } catch {}
    return true
  })
}

function setupMenu(win) {
  const template = [
  { role: 'viewMenu' },
    {
      label: 'Settings',
      submenu: [
        {
          label: 'Select Sound…',
          click: async () => {
            const result = await dialog.showOpenDialog(win, {
              title: 'Select notification sound',
              properties: ['openFile'],
              filters: [
                { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'webm'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            })
            if (!result.canceled && result.filePaths && result.filePaths[0]) {
              const p = result.filePaths[0]
              store.set('soundPath', p)
              win.webContents.send('pomo:soundPathChanged', p)
            }
          }
        },
        {
          label: 'Clear Sound',
          click: () => {
            store.delete('soundPath')
            win.webContents.send('pomo:soundPathChanged', '')
          }
        }
      ]
    }
  ]
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(async () => {
  await setupStoreHandlers()
  const win = createWindow()
  setupMenu(win)
})