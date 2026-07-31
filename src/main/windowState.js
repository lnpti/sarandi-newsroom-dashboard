import { app, screen } from 'electron';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_BOUNDS = { width: 1400, height: 900 };

function statePath() {
  return join(app.getPath('userData'), 'window-state.json');
}

export function loadWindowState() {
  try {
    return JSON.parse(readFileSync(statePath(), 'utf-8'));
  } catch {
    return null;
  }
}

// Confirma que o centro da janela cai dentro de algum monitor conectado —
// evita reabrir "fora da tela" se um monitor foi desconectado.
function isBoundsVisible(bounds) {
  if (!bounds || bounds.x == null || bounds.y == null) return false;
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  return screen.getAllDisplays().some((d) => {
    const { x, y, width, height } = d.bounds;
    return cx >= x && cx <= x + width && cy >= y && cy <= y + height;
  });
}

// Bounds iniciais: a última posição salva (se ainda visível), senão o padrão
// centralizado no monitor principal.
export function getInitialBounds(state) {
  if (state?.bounds && isBoundsVisible(state.bounds)) {
    return state.bounds;
  }
  return { ...DEFAULT_BOUNDS };
}

// Salva posição/tamanho (só quando NÃO está em tela cheia, pra guardar a
// posição "real" da janela) e o estado de tela cheia.
export function attachWindowState(win) {
  let lastNormalBounds = win.getBounds();

  const persist = () => {
    try {
      writeFileSync(
        statePath(),
        JSON.stringify({ bounds: lastNormalBounds, fullscreen: win.isFullScreen() })
      );
    } catch {
      // best-effort
    }
  };

  const onGeometry = () => {
    if (!win.isFullScreen()) lastNormalBounds = win.getBounds();
    persist();
  };

  win.on('resize', onGeometry);
  win.on('move', onGeometry);
  win.on('enter-full-screen', persist);
  win.on('leave-full-screen', () => {
    lastNormalBounds = win.getBounds();
    persist();
  });
  win.on('close', persist);

  // grava o estado inicial pra o arquivo já existir na primeira execução
  persist();
}
