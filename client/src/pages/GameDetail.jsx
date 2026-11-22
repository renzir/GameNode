import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function GameDetail() {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    fetch(`/api/games/${id}`)
      .then(res => res.json())
      .then(data => { if (data.error) throw new Error(data.error); setGame(data); setLoading(false); })
      .catch(err => { console.error('Error loading game:', err); setError('No se pudo cargar el juego'); setLoading(false); });
  }, [id]);

  if (loading) return <div className="text-center py-20 text-gray-500">Cargando...</div>;
  if (error || !game) return <div className="text-red-400 text-center py-16">{error}</div>;

  const thumbUrl = game.thumbnail ? `/static/games/${id}${game.thumbnail}` : null;

  return (
    <div>
      {!playing && (
        <>
          {thumbUrl && (
            <img src={thumbUrl} alt={game.title} className="w-full max-h-80 object-cover rounded-xl mb-6" />
          )}
          <h1 className="text-4xl font-bold text-white/95">{game.title}</h1>
          {game.description && (
            <p className="mt-3 text-gray-400 max-w-2xl leading-relaxed">{game.description}</p>
          )}
          {game.tags?.length > 0 && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {game.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-gray-800 rounded-full text-xs font-medium text-green-400">{tag}</span>
              ))}
            </div>
          )}
        </>
      )}

      {playing && (
        <iframe
          src={`/static/games/${id}/index.html`}
          className="game-player w-full aspect-video"
          title={game.title}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          referrerPolicy="no-referrer"
        />
      )}

      <div className="mt-6 flex gap-4">
        {!playing ? (
          <>
            {game.hasIndexHtml && (
              <button onClick={() => setPlaying(true)} className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-green-900/20">▶ Jugar</button>
            )}
          </>
        ) : (
          <Link to={`/games/${id}`} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors text-sm font-medium">← Volver al detalle</Link>
        )}
      </div>

      {!playing && !game.hasIndexHtml && (
        <p className="mt-6 text-yellow-500/80 text-sm">⚠️ Este juego aún no tiene un index.html para jugar.</p>
      )}
    </div>
  );
}
