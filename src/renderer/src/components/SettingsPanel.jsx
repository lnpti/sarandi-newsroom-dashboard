import { useEffect, useState } from 'react';
import { INTERVAL_OPTIONS, SETTINGS_LABELS } from '../intervalOptions.js';
import { THEMES, getStoredTheme, applyTheme } from '../themeSwitch.js';

const TABS = [
  { id: 'geral', label: 'Geral' },
  { id: 'frequencias', label: 'Frequências' },
  { id: 'regional', label: 'Notícias da região' },
];

// Agrupa as frequências por assunto em vez de uma lista única de 11 itens.
const FREQUENCY_GROUPS = [
  { title: 'Rádio', keys: ['listeners', 'radioNews'] },
  { title: 'Notícias', keys: ['externalNews', 'regionalNews'] },
  { title: 'Clima', keys: ['weather', 'weatherAlerts'] },
  { title: 'Outros', keys: ['currency', 'football', 'holidays', 'lottery', 'saint'] },
];

export default function SettingsPanel({ onClose }) {
  const [tab, setTab] = useState('geral');
  const [settings, setSettings] = useState(null);
  const [theme, setTheme] = useState(getStoredTheme);
  const [refreshing, setRefreshing] = useState(false);
  const [updateState, setUpdateState] = useState(null);
  const [newFeedUrl, setNewFeedUrl] = useState('');

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

  function handleAddFeed() {
    const url = newFeedUrl.trim();
    if (!url || settings.regionalRssUrls?.includes(url)) return;
    const updated = [...(settings.regionalRssUrls || []), url];
    setSettings((prev) => ({ ...prev, regionalRssUrls: updated }));
    window.dashboard.updateSettings({ regionalRssUrls: updated });
    setNewFeedUrl('');
  }

  function handleRemoveFeed(url) {
    const updated = (settings.regionalRssUrls || []).filter((u) => u !== url);
    setSettings((prev) => ({ ...prev, regionalRssUrls: updated }));
    window.dashboard.updateSettings({ regionalRssUrls: updated });
  }

  useEffect(() => {
    const unsub = window.dashboard.onUpdaterStatus?.((payload) => {
      setUpdateState(payload.status);
      if (payload.status === 'idle') {
        setTimeout(() => setUpdateState(null), 3000);
      }
    });
    return () => unsub?.();
  }, []);

  async function handleRefreshAll() {
    setRefreshing(true);
    await window.dashboard.refreshAll();
    setRefreshing(false);
  }

  async function handleCheckUpdate() {
    setUpdateState('checking');
    await window.dashboard.checkForUpdate();
  }

  const updateLabel =
    updateState === 'checking' ? 'Verificando…' :
    updateState === 'idle'     ? 'App já está atualizado ✓' :
                                 'Verificar atualização do app';

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-panel__header">
          <span>Configurações</span>
          <button className="settings-panel__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="settings-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`settings-tab ${tab === t.id ? 'settings-tab--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="settings-panel__body">
          {tab === 'geral' && (
            <>
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

              <button className="settings-refresh-btn" onClick={handleRefreshAll} disabled={refreshing}>
                {refreshing ? 'Atualizando…' : '↻ Atualizar tudo agora'}
              </button>

              <button
                className="settings-refresh-btn settings-refresh-btn--secondary"
                onClick={handleCheckUpdate}
                disabled={updateState === 'checking' || updateState === 'available' || updateState === 'downloading'}
              >
                {updateLabel}
              </button>
            </>
          )}

          {tab === 'frequencias' &&
            settings &&
            FREQUENCY_GROUPS.map((group, i) => (
              <div key={group.title}>
                <div className={`settings-panel__section ${i === 0 ? 'settings-panel__section--first' : ''}`}>
                  {group.title}
                </div>
                {group.keys.map((key) => (
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
              </div>
            ))}

          {tab === 'regional' && settings && (
            <div className="settings-rss">
              <p className="settings-rss__hint">
                Feeds RSS do Google Alertas usados nas notícias da região. Pode adicionar mais de um.
              </p>
              {(settings.regionalRssUrls || []).length === 0 && (
                <p className="settings-rss__empty">Nenhum feed cadastrado — usando o padrão do app.</p>
              )}
              {(settings.regionalRssUrls || []).map((url) => (
                <div key={url} className="settings-rss__item">
                  <span className="settings-rss__url" title={url}>{url}</span>
                  <button
                    className="settings-rss__remove"
                    onClick={() => handleRemoveFeed(url)}
                    title="Remover feed"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="settings-rss__add">
                <input
                  type="text"
                  placeholder="Cole a URL do feed RSS do Google Alertas"
                  value={newFeedUrl}
                  onChange={(e) => setNewFeedUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFeed()}
                />
                <button onClick={handleAddFeed} disabled={!newFeedUrl.trim()}>
                  + Adicionar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
