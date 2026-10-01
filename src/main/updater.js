import { app } from 'electron';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import electronUpdater from 'electron-updater';
import { stationConfig } from './stations/index.js';

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

// Canais de atualização em ordem de preferência: GitHub Releases e, se ele
// estiver inacessível (ex.: rede que bloqueia o GitHub), o espelho no
// Cloudflare R2. Cada canal é configurado explicitamente a cada checagem — o
// app-update.yml embutido na build só conhece o GitHub.
const { UPDATE_FEEDS } = stationConfig;
const FEEDS = UPDATE_FEEDS
  ? [
      { provider: 'github', owner: UPDATE_FEEDS.github.owner, repo: UPDATE_FEEDS.github.repo },
      { provider: 'generic', url: UPDATE_FEEDS.r2 },
    ]
  : [];

// true enquanto ainda há outro canal pra tentar — o erro do canal que falhou
// não vira aviso na tela (só o erro de TODOS os canais).
let suppressError = false;

// 'Falha' aqui = erro de rede/servidor, não 'não há versão nova' (esse caso
// resolve normalmente e não tenta o próximo canal).
async function checkAllFeeds() {
  if (FEEDS.length === 0) return autoUpdater.checkForUpdates();

  let lastError;
  for (let i = 0; i < FEEDS.length; i++) {
    suppressError = i < FEEDS.length - 1;
    try {
      autoUpdater.setFeedURL(FEEDS[i]);
      return await autoUpdater.checkForUpdates();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
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
  autoUpdater.on('error', (e) => {
    if (!suppressError) send('error', { message: String(e?.message || e) });
  });
  autoUpdater.on('update-downloaded', (i) => {
    send('downloaded', { version: i?.version });
    // grava o flag e reinicia pra instalar; ao voltar, abre em tela cheia.
    // (true, true) = instalação silenciosa + relançar o app depois, sem UI.
    setFullscreenFlag();
    setTimeout(() => autoUpdater.quitAndInstall(true, true), INSTALL_DELAY_MS);
  });

  checkAllFeeds().catch(() => {});
  setInterval(() => checkAllFeeds().catch(() => {}), CHECK_INTERVAL_MS);
}

export function checkForUpdate() {
  if (!app.isPackaged) return Promise.resolve();
  return checkAllFeeds().catch(() => {});
}
