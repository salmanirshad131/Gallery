const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  isMac: process.platform === 'darwin',
  scanMacDefault: (customTargets) => ipcRenderer.invoke('scan-mac-default', customTargets),
  scanFolderPath: (folderPath) => ipcRenderer.invoke('scan-folder-path', folderPath),
  selectFolders: () => ipcRenderer.invoke('select-folders'),
  showInFinder: (filePath) => ipcRenderer.invoke('show-in-finder', filePath),
  openPath: (filePath) => ipcRenderer.invoke('open-path', filePath),
  trashItem: (filePath) => ipcRenderer.invoke('trash-item', filePath),
  loadSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  loadLibrary: () => ipcRenderer.invoke('get-library'),
  saveLibrary: (libraryData) => ipcRenderer.invoke('save-library', libraryData),
  loadFavorites: () => ipcRenderer.invoke('get-favorites'),
  saveFavorites: (favorites) => ipcRenderer.invoke('save-favorites', favorites),
  loadAlbums: () => ipcRenderer.invoke('get-albums'),
  saveAlbums: (albums) => ipcRenderer.invoke('save-albums', albums),
  getServerPort: () => ipcRenderer.invoke('get-server-port'),
  onFullscreenChange: (callback) => {
    const handler = (_event, isFullscreen) => callback(isFullscreen);
    ipcRenderer.on('window-fullscreen-changed', handler);
    return () => ipcRenderer.removeListener('window-fullscreen-changed', handler);
  },
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
});
