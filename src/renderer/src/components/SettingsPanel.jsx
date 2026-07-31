import { useEffect, useState } from 'react';
import { INTERVAL_OPTIONS, SETTINGS_LABELS } from '../intervalOptions.js';
import { THEMES, getStoredTheme, applyTheme } from '../themeSwitch.js';

export default function SettingsPanel({ onClose }) {
  const [settings, setSettings] = useState(null);
  const [theme, setTheme] = useState(getStoredTheme);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    window.dashboard.getSettings().then(setSettings);
  }, []);

  function handleChange(key, ms) {
    setSettings((prev) => ({ ...prev, [key]: ms }));
    window.dashboard.updateSettings({ [key]: ms });
  }

  function handleTheme(id) {
    setTheme(id);
    applyTheme(id);
  }

  async function handleRefreshAll() {
    setRefreshing(true);
    await window.dashboard.refreshAll();
    setRefreshing(false);
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-panel__header">
          <span>Configurações</span>
          <button className="settings-panel__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="settings-row">
          <span>Tema</span>
          <div className="theme-picker">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`theme-chip ${theme === t.id ? 'theme-chip--active' : ''}`}
                onClick={() => handleTheme(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-panel__section">Frequência de atualização</div>
        {settings &&
          Object.keys(INTERVAL_OPTIONS).map((key) => (
            <div key={key} className="settings-row">
              <span>{SETTINGS_LABELS[key]}</span>
              <select value={settings[key]} onChange={(e) => handleChange(key, Number(e.target.value))}>
                {INTERVAL_OPTIONS[key].map((opt) => (
                  <option key={opt.ms} value={opt.ms}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

        <button
          className="settings-refresh-btn"
          onClick={handleRefreshAll}
          disabled={refreshing}
        >
          {refreshing ? 'Atualizando…' : '↻ Atualizar tudo agora'}
        </button>
      </div>
    </div>
  );
}
