const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dashboard', {
  getSnapshot: () => ipcRenderer.invoke('dashboard:getSnapshot'),
  onUpdate: (callback) => {
    const listener = (_event, snapshot) => callback(snapshot);
    ipcRenderer.on('dashboard:update', listener);
    return () => ipcRenderer.removeListener('dashboard:update', listener);
  },
  refreshNow: (sourceKey) => ipcRenderer.invoke('dashboard:refreshNow', sourceKey),
  refreshAll: () => ipcRenderer.invoke('dashboard:refreshAll'),
  toggleFullscreen: () => ipcRenderer.invoke('app:toggleFullscreen'),
  checkForUpdate: () => ipcRenderer.invoke('app:checkForUpdate'),
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (partial) => ipcRenderer.invoke('settings:update', partial),
  searchCity: (query) => ipcRenderer.invoke('weather:searchCity', query),
  onUpdaterStatus: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('updater:status', listener);
    return () => ipcRenderer.removeListener('updater:status', listener);
  },
});
