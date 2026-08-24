import * as sarandi from './sarandi/config.js';
import * as cacique from './cacique/config.js';

const STATION = process.env.STATION || 'sarandi';

const STATIONS = { sarandi, cacique };

export const stationConfig = STATIONS[STATION] || sarandi;
