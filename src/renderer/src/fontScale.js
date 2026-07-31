const STORAGE_KEY = 'newsFontScale';
export const MIN_SCALE = 0.8;
export const MAX_SCALE = 1.4;
export const SCALE_STEP = 0.1;

export function getStoredScale() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 1;
}

export function clampScale(scale) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(scale * 10) / 10));
}

export function applyScale(scale) {
  document.documentElement.style.setProperty('--news-font-scale', scale);
  localStorage.setItem(STORAGE_KEY, String(scale));
}
