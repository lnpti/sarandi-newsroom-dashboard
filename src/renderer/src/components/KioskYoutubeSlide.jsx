const LIST_LIMIT = 4;

function formatWhen(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 7) return `Há ${days} dias`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// A miniatura padrão (hqdefault) é 4:3 com tarja preta em cima e embaixo; a
// hq720 é 16:9 de verdade, mas nem todo vídeo tem — cai pra padrão se faltar.
function Thumb({ video, className }) {
  return (
    <div className={`yt-thumb ${className || ''}`}>
      <img
        src={`https://i.ytimg.com/vi/${video.id}/hq720.jpg`}
        alt=""
        onError={(e) => {
          if (e.currentTarget.dataset.fallback) return;
          e.currentTarget.dataset.fallback = '1';
          e.currentTarget.src = video.thumbnail;
        }}
      />
      <span className="yt-thumb__play">▶</span>
    </div>
  );
}

function Featured({ video }) {
  return (
    <a className="yt-featured" href={video.link} target="_blank" rel="noreferrer">
      <Thumb video={video} className="yt-featured__thumb" />
      <div className="yt-featured__body">
        <span className="yt-tag">Último vídeo</span>
        <h2 className="yt-featured__title">{video.title}</h2>
        <span className="yt-when">{formatWhen(video.publishedAt)}</span>
      </div>
    </a>
  );
}

function ListItem({ video }) {
  return (
    <a className="yt-item" href={video.link} target="_blank" rel="noreferrer">
      <Thumb video={video} className="yt-item__thumb" />
      <div className="yt-item__body">
        <h3 className="yt-item__title">{video.title}</h3>
        <span className="yt-when">{formatWhen(video.publishedAt)}</span>
      </div>
    </a>
  );
}

export default function KioskYoutubeSlide({ youtube }) {
  const videos = (youtube?.data || []).filter((v) => v.thumbnail);
  const [first, ...rest] = videos;

  return (
    <div className="kiosk-slide kiosk-slide--youtube">
      <div className="kiosk-slide__header">▶ Vídeos no YouTube</div>
      {!first ? (
        <p className="kiosk-calendar__empty">Nenhum vídeo encontrado.</p>
      ) : (
        <div className={`yt ${rest.length === 0 ? 'yt--single' : ''}`}>
          <Featured video={first} />
          {rest.length > 0 && (
            <div className="yt-list">
              <h3 className="market-panel__title">Mais recentes</h3>
              {rest.slice(0, LIST_LIMIT).map((v) => (
                <ListItem key={v.id} video={v} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
