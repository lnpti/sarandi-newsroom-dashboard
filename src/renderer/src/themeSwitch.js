const STORAGE_KEY = 'appTheme';

export const THEMES = [
  { id: 'dark', label: 'Escuro' },
  { id: 'dracula', label: 'Dracula' },
  { id: 'light', label: 'Claro' },
];

export function getStoredTheme() {
  const t = localStorage.getItem(STORAGE_KEY);
  return THEMES.some((x) => x.id === t) ? t : 'dark';
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
}
