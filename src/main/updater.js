import { app } from 'electron';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import electronUpdater from 'electron-updater';

const { autoUpdater } = electronUpdater;

// Verifica novas versões no GitHub Releases a cada 30 min (além de 1x no início).
const CHECK_INTERVAL_MS = 30 * 60 * 1000;
// Espera antes de reiniciar pra instalar — dá tempo do toast aparecer.
const INSTALL_DELAY_MS = 4000;

function flagPath() {
  return join(app.getPath('userData'), 'relaunch-fullscreen.flag');
}

// Lê e apaga o flag "reabrir em tela cheia" gravado antes de uma auto-atualização.
export function consumeFullscreenFlag() {
  try {
    readFileSync(flagPath());
    rmSync(flagPath());
    return true;
  } catch {
    return false;
  }
}

function setFullscreenFlag() {
  try {
    writeFileSync(flagPath(), '1');
  } catch {
    // best-effort
  }
}

export function setupAutoUpdater(win) {
  // Só roda no app empacotado — em dev não há release pra comparar.
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  const send = (status, info = {}) => {
    if (!win.isDestroyed()) win.webContents.send('updater:status', { status, ...info });
  };

  autoUpdater.on('checking-for-update', () => send('checking'));
  autoUpdater.on('update-available', (i) => send('available', { version: i?.version }));
  autoUpdater.on('update-not-available', () => send('idle'));
  autoUpdater.on('download-progress', (p) => send('downloading', { percent: Math.round(p.percent) }));
  autoUpdater.on('error', (e) => send('error', { message: String(e?.message || e) }));
  autoUpdater.on('update-downloaded', (i) => {
    send('downloaded', { version: i?.version });
    // grava o flag e reinicia pra instalar; ao voltar, abre em tela cheia.
    // (true, true) = instalação silenciosa + relançar o app depois, sem UI.
    setFullscreenFlag();
    setTimeout(() => autoUpdater.quitAndInstall(true, true), INSTALL_DELAY_MS);
  });

  autoUpdater.checkForUpdates().catch(() => {});
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), CHECK_INTERVAL_MS);
}

export function checkForUpdate() {
  if (!app.isPackaged) return Promise.resolve();
  return autoUpdater.checkForUpdates().catch(() => {});
}
