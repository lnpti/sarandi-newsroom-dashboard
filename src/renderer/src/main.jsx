import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { applyScale, getStoredScale } from './fontScale.js';
import { applyTheme, getStoredTheme } from './themeSwitch.js';
import './theme.css';

// Aplica antes do primeiro paint pra não piscar no tema/tamanho padrão.
applyTheme(getStoredTheme());
applyScale(getStoredScale());

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
