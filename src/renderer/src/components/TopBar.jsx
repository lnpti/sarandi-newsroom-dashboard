import { useEffect, useState } from 'react';
import ListenerGauge from './ListenerGauge.jsx';
import ListenerSparkline from './ListenerSparkline.jsx';
import StatusBadge from './StatusBadge.jsx';
import StreamStatus from './StreamStatus.jsx';
import RelativeTime from './RelativeTime.jsx';
import Clock from './Clock.jsx';
import WeatherWidget from './WeatherWidget.jsx';
import CurrencyWidget from './CurrencyWidget.jsx';
import SettingsPanel from './SettingsPanel.jsx';
import FontSizeControl from './FontSizeControl.jsx';
import logoDark from '@station-assets/logo-dark.png';
import logoLight from '@station-assets/logo-light.png';
import { RADIO_NAME } from '@station-assets/info.js';
import appIcon from '../assets/app-icon.png';

export default function TopBar({ listeners, listenerHistory, weather, currency }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [version, setVersion] = useState('');

  useEffect(() => {
    window.dashboard.getVersion?.().then(setVersion);
  }, []);

  return (
    <div className="top-bar">
      <img className="top-bar__logo top-bar__logo--dark" src={logoDark} alt={RADIO_NAME} />
      <img className="top-bar__logo top-bar__logo--light" src={logoLight} alt={RADIO_NAME} />
      <StreamStatus streamStatus={listeners.data?.streamStatus} />
      <ListenerGauge listeners={listeners} history={listenerHistory} />
      <ListenerSparkline history={listenerHistory} />
      <WeatherWidget weather={weather} />
      <CurrencyWidget currency={currency} />
      <div className="top-bar__spacer" />
      <Clock />
      <div className="top-bar__meta">
        <StatusBadge status={listeners.status} />
        <span>
          atualizado <RelativeTime timestamp={listeners.lastUpdated} />
        </span>
        <FontSizeControl />
        <button className="icon-btn" title="Configurações" onClick={() => setSettingsOpen(true)}>
          ⚙
        </button>
        <button
          className="icon-btn"
          title="Tela cheia (F11)"
          onClick={() => window.dashboard.toggleFullscreen()}
        >
          ⛶
        </button>
        {version && (
          <span className="top-bar__version">
            <img className="top-bar__version-icon" src={appIcon} alt="" />
            v{version}
          </span>
        )}
      </div>
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
