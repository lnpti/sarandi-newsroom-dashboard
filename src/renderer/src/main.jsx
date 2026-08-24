import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { applyScale, getStoredScale } from './fontScale.js';
import { applyTheme, getStoredTheme } from './themeSwitch.js';
import { APP_NAME } from '@station-assets/info.js';
import './theme.css';
import '@station-assets/theme-override.css';

// Aplica antes do primeiro paint pra não piscar no tema/tamanho padrão.
applyTheme(getStoredTheme());
applyScale(getStoredScale());
document.title = APP_NAME;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
