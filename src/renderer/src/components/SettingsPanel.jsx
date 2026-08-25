import { useEffect, useState } from 'react';
import { INTERVAL_OPTIONS, SETTINGS_LABELS } from '../intervalOptions.js';
import { THEMES, getStoredTheme, applyTheme } from '../themeSwitch.js';
import { KIOSK_SLIDE_LABELS } from './KioskView.jsx';
import CitySearchBox from './CitySearchBox.jsx';

const TABS = [
  { id: 'geral', label: 'Geral' },
  { id: 'frequencias', label: 'Frequências' },
  { id: 'regional', label: 'Notícias da região' },
  { id: 'clima', label: 'Clima' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'tv', label: 'Modo TV' },
];

const SLIDE_DURATION_OPTIONS = [10, 15, 20, 30, 45, 60];

// Agrupa as frequências por assunto em vez de uma lista única de 11 itens.
const FREQUENCY_GROUPS = [
  { title: 'Rádio', keys: ['listeners', 'radioNews'] },
  { title: 'Notícias', keys: ['externalNews', 'regionalNews'] },
  { title: 'Clima', keys: ['weather', 'weatherAlerts'] },
  { title: 'Outros', keys: ['currency', 'football', 'holidays', 'lottery', 'saint', 'calendar', 'youtube'] },
];

export default function SettingsPanel({ kiosk, onUpdateKiosk, onClose }) {
  const [tab, setTab] = useState('geral');
  const [settings, setSettings] = useState(null);
  const [theme, setTheme] = useState(getStoredTheme);
  const [refreshing, setRefreshing] = useState(false);
  const [updateState, setUpdateState] = useState(null);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [icsUrl, setIcsUrl] = useState('');
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');
  const [extraCityNotice, setExtraCityNotice] = useState('');

  useEffect(() => {
    window.dashboard.getSettings().then((s) => {
      setSettings(s);
      setIcsUrl(s.calendarIcsUrl || '');
      setYoutubeUrlInput(s.youtubeUrl || '');
    });
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

  function handleSaveIcsUrl() {
    const url = icsUrl.trim();
    setSettings((prev) => ({ ...prev, calendarIcsUrl: url }));
    window.dashboard.updateSettings({ calendarIcsUrl: url });
  }

  function handleClearIcsUrl() {
    setIcsUrl('');
    setSettings((prev) => ({ ...prev, calendarIcsUrl: '' }));
    window.dashboard.updateSettings({ calendarIcsUrl: '' });
  }

  function handleSaveYoutubeUrl() {
    const url = youtubeUrlInput.trim();
    setSettings((prev) => ({ ...prev, youtubeUrl: url }));
    window.dashboard.updateSettings({ youtubeUrl: url });
  }

  function handleClearYoutubeUrl() {
    setYoutubeUrlInput('');
    setSettings((prev) => ({ ...prev, youtubeUrl: '' }));
    window.dashboard.updateSettings({ youtubeUrl: '' });
  }

  function handleSetMainCity(city) {
    const patch = { weatherLat: city.lat, weatherLon: city.lon, weatherCityLabel: city.name };
    setSettings((prev) => ({ ...prev, ...patch }));
    window.dashboard.updateSettings(patch);
  }

  function handleAddExtraCity(city) {
    const current = settings.weatherExtraCities || [];
    if (current.some((c) => c.label === city.name)) {
      // Clicar de novo numa cidade que já está na lista não fazia nada
      // visível — parecia que o clique tinha sido ignorado.
      setExtraCityNotice(`"${city.name}" já está na lista.`);
      setTimeout(() => setExtraCityNotice(''), 3000);
      return;
    }
    const updated = [...current, { label: city.name, lat: city.lat, lon: city.lon }];
    setSettings((prev) => ({ ...prev, weatherExtraCities: updated }));
    window.dashboard.updateSettings({ weatherExtraCities: updated });
  }

  function handleRemoveExtraCity(label) {
    const updated = (settings.weatherExtraCities || []).filter((c) => c.label !== label);
    setSettings((prev) => ({ ...prev, weatherExtraCities: updated }));
    window.dashboard.updateSettings({ weatherExtraCities: updated });
  }

  function handleToggleSlide(key) {
    const current = kiosk?.kioskEnabledSlides || [];
    const updated = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    onUpdateKiosk({ kioskEnabledSlides: updated });
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

        <div className="settings-panel__main">
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

          {tab === 'clima' && settings && (
            <div className="settings-rss">
              <p className="settings-rss__hint">Cidade principal usada na previsão do tempo.</p>
              <div className="settings-rss__item">
                <span className="settings-rss__url">{settings.weatherCityLabel}</span>
              </div>
              <CitySearchBox placeholder="Buscar cidade principal…" onSelect={handleSetMainCity} />

              <div className="settings-panel__section">Cidades adicionais (Modo TV)</div>
              <p className="settings-rss__hint">
                Mostra a temperatura dessas cidades no slide de clima do Modo TV — útil pra onde a rádio
                tem retransmissão.
              </p>
              {(settings.weatherExtraCities || []).length === 0 && (
                <p className="settings-rss__empty">Nenhuma cidade adicional cadastrada.</p>
              )}
              {(settings.weatherExtraCities || []).map((city) => (
                <div key={city.label} className="settings-rss__item">
                  <span className="settings-rss__url">{city.label}</span>
                  <button
                    className="settings-rss__remove"
                    onClick={() => handleRemoveExtraCity(city.label)}
                    title="Remover"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {extraCityNotice && <p className="settings-rss__hint">{extraCityNotice}</p>}
              <CitySearchBox placeholder="Adicionar cidade…" onSelect={handleAddExtraCity} />
            </div>
          )}

          {tab === 'agenda' && settings && (
            <div className="settings-rss">
              <p className="settings-rss__hint">
                Link ICS do calendário do Outlook. No Outlook na Web: Configurações ⚙ → Calendário →
                Calendários compartilhados → Publicação de calendário. Mostra os eventos dos próximos 7 dias.
              </p>
              {!settings.calendarIcsUrl && (
                <p className="settings-rss__empty">Nenhum calendário cadastrado.</p>
              )}
              {settings.calendarIcsUrl && (
                <div className="settings-rss__item">
                  <span className="settings-rss__url" title={settings.calendarIcsUrl}>
                    {settings.calendarIcsUrl}
                  </span>
                  <button className="settings-rss__remove" onClick={handleClearIcsUrl} title="Remover">
                    ✕
                  </button>
                </div>
              )}
              <div className="settings-rss__add">
                <input
                  type="text"
                  placeholder="Cole o link ICS do calendário"
                  value={icsUrl}
                  onChange={(e) => setIcsUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveIcsUrl()}
                />
                <button onClick={handleSaveIcsUrl} disabled={!icsUrl.trim() || icsUrl.trim() === settings.calendarIcsUrl}>
                  Salvar
                </button>
              </div>
            </div>
          )}

          {tab === 'youtube' && settings && (
            <div className="settings-rss">
              <p className="settings-rss__hint">
                URL do canal do YouTube da emissora (pode ser o link do canal, de um vídeo ou o
                endereço com @nomedousuário). Mostra os vídeos mais recentes no Modo TV.
              </p>
              {!settings.youtubeUrl && <p className="settings-rss__empty">Nenhum canal cadastrado.</p>}
              {settings.youtubeUrl && (
                <div className="settings-rss__item">
                  <span className="settings-rss__url" title={settings.youtubeUrl}>
                    {settings.youtubeUrl}
                  </span>
                  <button className="settings-rss__remove" onClick={handleClearYoutubeUrl} title="Remover">
                    ✕
                  </button>
                </div>
              )}
              <div className="settings-rss__add">
                <input
                  type="text"
                  placeholder="Cole a URL do canal do YouTube"
                  value={youtubeUrlInput}
                  onChange={(e) => setYoutubeUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveYoutubeUrl()}
                />
                <button
                  onClick={handleSaveYoutubeUrl}
                  disabled={!youtubeUrlInput.trim() || youtubeUrlInput.trim() === settings.youtubeUrl}
                >
                  Salvar
                </button>
              </div>
            </div>
          )}

          {tab === 'tv' && kiosk && (
            <div className="settings-tv">
              <div className="settings-row">
                <span>Modo TV (rodízio em tela cheia)</span>
                <button
                  className={`settings-tv__toggle ${kiosk.kioskModeOn ? 'settings-tv__toggle--on' : ''}`}
                  onClick={() => onUpdateKiosk({ kioskModeOn: !kiosk.kioskModeOn })}
                >
                  {kiosk.kioskModeOn ? 'Ligado' : 'Desligado'}
                </button>
              </div>

              <div className="settings-row">
                <span>Duração de cada tela</span>
                <select
                  value={kiosk.kioskSecondsPerSlide}
                  onChange={(e) => onUpdateKiosk({ kioskSecondsPerSlide: Number(e.target.value) })}
                >
                  {SLIDE_DURATION_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s} segundos
                    </option>
                  ))}
                </select>
              </div>

              <div className="settings-panel__section settings-panel__section--first">Telas no rodízio</div>
              {Object.entries(KIOSK_SLIDE_LABELS).map(([key, label]) => (
                <label className="settings-row settings-tv__slide" key={key}>
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={(kiosk.kioskEnabledSlides || []).includes(key)}
                    onChange={() => handleToggleSlide(key)}
                  />
                </label>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
