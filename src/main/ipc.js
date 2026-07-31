import { ipcMain, app } from 'electron';

export function registerIpc({ win, store, pollers, getSettings, updateSettings }) {
  ipcMain.handle('dashboard:getSnapshot', () => store.getSnapshot());

  // __APP_VERSION__ é injetado em build-time (electron.vite.config.mjs) a partir
  // do package.json — funciona igual em dev e no app empacotado, ao contrário de
  // app.getVersion() que em dev retorna a versão do Electron.
  ipcMain.handle('app:getVersion', () => (typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : app.getVersion()));

  ipcMain.handle('dashboard:refreshNow', (_event, sourceKey) => {
    const poller = pollers[sourceKey];
    if (poller) return poller.refreshNow();
    return null;
  });

  ipcMain.handle('dashboard:refreshAll', () =>
    Promise.all(Object.values(pollers).map((p) => p.refreshNow()))
  );

  ipcMain.handle('app:toggleFullscreen', () => {
    win.setFullScreen(!win.isFullScreen());
    return win.isFullScreen();
  });

  ipcMain.handle('settings:get', () => getSettings());

  ipcMain.handle('settings:update', (_event, partial) => updateSettings(partial));

  return store.subscribe((snapshot) => {
    if (!win.isDestroyed()) {
      win.webContents.send('dashboard:update', snapshot);
    }
  });
}
