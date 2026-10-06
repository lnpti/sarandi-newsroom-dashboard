import * as sarandi from './sarandi/config.js';
import * as cacique from './cacique/config.js';
import * as alvorada from './alvorada/config.js';

const STATION = process.env.STATION || 'sarandi';

const STATIONS = { sarandi, cacique, alvorada };

export const stationConfig = STATIONS[STATION] || sarandi;
