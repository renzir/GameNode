import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import GameCard from '../components/GameCard';

export default function Home() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/games')
      .then(res => res.json())
      .then(data => { setGames(data); setLoading(false); })
      .catch(err => { console.error('Error loading games:', err); setError('No se pudo cargar el catálogo'); setLoading(false); });
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-500">Cargando juegos...</div>;
  if (error) return <div className="text-red-400 text-center py-16">{error}</div>;
  if (!games.length) return <div className="text-center py-20 text-gray-500"><p>No hay juegos publicados aún.</p><Link to="/upload" className="mt-4 inline-block px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-colors">Subir el primero</Link></div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-white/90">Catálogo de juegos</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {games.map(game => (
          <Link key={game.id} to={`/games/${game.id}`}>
            <GameCard game={game} />
          </Link>
        ))}
      </div>
    </div>
  );
}
