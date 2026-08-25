import { useEffect, useRef, useState } from 'react';

const DEBOUNCE_MS = 400;

// Busca de cidade reaproveitada em dois lugares nas Configurações (cidade
// principal do clima e lista de cidades extras do Modo TV) — debounced pra
// não disparar uma chamada a cada tecla.
export default function CitySearchBox({ placeholder, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const found = await window.dashboard.searchCity(trimmed);
        setResults(found || []);
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function handleSelect(result) {
    onSelect(result);
    setQuery('');
    setResults([]);
  }

  return (
    <div className="city-search">
      <div className="settings-rss__add">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {searching && <p className="settings-rss__hint">Buscando…</p>}
      {results.length > 0 && (
        <div className="city-search__results">
          {results.map((r) => (
            <button key={r.id} type="button" className="city-search__result" onClick={() => handleSelect(r)}>
              {r.name}
              {r.admin1 ? `, ${r.admin1}` : ''}
              {r.country ? ` — ${r.country}` : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
