function formatWhen(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function VideoCard({ video }) {
  return (
    <a className="kiosk-video-card" href={video.link} target="_blank" rel="noreferrer">
      <div className="kiosk-video-card__thumb">
        <img src={video.thumbnail} alt="" />
        <span className="kiosk-video-card__play">▶</span>
      </div>
      <p className="kiosk-video-card__title">{video.title}</p>
      {video.publishedAt && <span className="kiosk-video-card__date">{formatWhen(video.publishedAt)}</span>}
    </a>
  );
}

export default function KioskYoutubeSlide({ youtube }) {
  const videos = (youtube?.data || []).filter((v) => v.thumbnail).slice(0, 8);

  return (
    <div className="kiosk-slide kiosk-slide--youtube">
      <div className="kiosk-slide__header">▶ Vídeos no YouTube</div>
      <div className="kiosk-slide__body kiosk-video-grid">
        {videos.length === 0 && <p className="kiosk-calendar__empty">Nenhum vídeo encontrado.</p>}
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}
