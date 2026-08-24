import { useDashboardSnapshot } from './hooks/useDashboardSnapshot.js';
import TopBar from './components/TopBar.jsx';
import RadioNewsColumn from './components/RadioNewsColumn.jsx';
import ExternalNewsColumn from './components/ExternalNewsColumn.jsx';
import RegionalNewsSection from './components/RegionalNewsSection.jsx';
import WeatherForecast from './components/WeatherForecast.jsx';
import CalendarPanel from './components/CalendarPanel.jsx';
import GamesPanel from './components/GamesPanel.jsx';
import HolidaysPanel from './components/HolidaysPanel.jsx';
import LotteryPanel from './components/LotteryPanel.jsx';
import SaintPanel from './components/SaintPanel.jsx';
import WeatherAlertBanner from './components/WeatherAlertBanner.jsx';
import UpdateToast from './components/UpdateToast.jsx';

export default function App() {
  const snapshot = useDashboardSnapshot();

  if (!snapshot) {
    return <div className="app">Carregando…</div>;
  }

  return (
    <div className="app">
      <div className="body-columns">
        <RadioNewsColumn radioNews={snapshot.radioNews} />
        <ExternalNewsColumn externalNews={snapshot.externalNews} />
        <div className="column column--regional">
          <RegionalNewsSection regional={snapshot.regionalNews} />
        </div>
        <div className="column column--widgets">
          <WeatherForecast weather={snapshot.weather} />
          <GamesPanel football={snapshot.football} />
          <LotteryPanel lottery={snapshot.lottery} />
          <HolidaysPanel holidays={snapshot.holidays} />
          <SaintPanel saint={snapshot.saint} />
        </div>
        <CalendarPanel calendar={snapshot.calendar} />
      </div>
      <TopBar
        listeners={snapshot.listeners}
        listenerHistory={snapshot.listenerHistory}
        weather={snapshot.weather}
        currency={snapshot.currency}
      />
      <WeatherAlertBanner weatherAlerts={snapshot.weatherAlerts} />
      <UpdateToast />
    </div>
  );
}
