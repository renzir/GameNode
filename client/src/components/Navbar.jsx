import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight hover:text-green-400 transition-colors">
          🎮 GameNode
        </Link>
        <div className="flex gap-4 text-sm">
          <Link to="/upload" className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors font-medium">
            Subir juego
          </Link>
        </div>
      </div>
    </nav>
  );
}
