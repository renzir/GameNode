import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function UploadGame() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [gameFile, setGameFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Generate a slug from title for the game ID
  function generateId(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^(-)+|(-)+$/g, '') || `game-${Date.now()}`;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    
    if (!title.trim()) return setError('El título es obligatorio');
    if (!gameFile) return setError('Debes subir un archivo de juego (.zip o carpeta con index.html)');

    setUploading(true);

    try {
      const formData = new FormData();
      
      // Metadata as JSON string in a field called "metadata"
      const metadata = {
        id: generateId(title),
        title,
        description,
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean)
      };
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));

      // Thumbnail if provided
      if (thumbnail) {
        formData.append('thumbnail', thumbnail);
      }

      // Game files - accept .zip or individual HTML/CSS/JS assets
      const zipBlob = await gameFile.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(zipBlob)));
      
      // Send as base64 in the metadata field for simplicity (avoids multipart complexity)
      formData.append('metadata', new Blob([JSON.stringify({ ...metadata, zipData: `data:${gameFile.type};base64,${base64}` })], { type: 'application/json' }));

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);
      }

      navigate(`/games/${metadata.id}`);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'No se pudo subir el juego');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-white/90">Subir un juego</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1.5 text-gray-300">Título *</label>
          <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Mi juego increíble" required maxLength={80} className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-600/30 outline-none transition-colors text-white placeholder:text-gray-600" />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1.5 text-gray-300">Descripción</label>
          <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe tu juego..." rows={4} maxLength={2000} className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-600/30 outline-none transition-colors text-white placeholder:text-gray-600 resize-y" />
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium mb-1.5 text-gray-300">Tags (separados por comas)</label>
          <input id="tags" type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="arcade, 2d, plataformas" className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-600/30 outline-none transition-colors text-white placeholder:text-gray-600" />
        </div>

        {/* Game file */}
        <div>
          <label htmlFor="gameFile" className="block text-sm font-medium mb-1.5 text-gray-300">Archivo del juego *</label>
          <input id="gameFile" type="file" accept=".zip,application/zip,text/html,.html,.htm" onChange={e => setGameFile(e.target.files[0])} className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-600/30 outline-none transition-colors text-white file:bg-green-600 file:text-white file:border-0 file:rounded-md file:px-4 file:py-1.5 file:cursor-pointer" />
          <p className="mt-1 text-xs text-gray-500">Sube un .zip con tu juego (index.html + assets). Máx 50MB.</p>
        </div>

        {/* Thumbnail */}
        <div>
          <label htmlFor="thumbnail" className="block text-sm font-medium mb-1.5 text-gray-300">Thumbnail</label>
          <input id="thumbnail" type="file" accept=".png,.jpg,.jpeg,.gif,.webp" onChange={e => setThumbnail(e.target.files[0])} className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-600/30 outline-none transition-colors text-white file:bg-gray-800 file:text-white file:border-0 file:rounded-md file:px-4 file:py-1.5 file:cursor-pointer" />
          <p className="mt-1 text-xs text-gray-500">Imagen de portada (opcional). Máx 2MB.</p>
        </div>

        {/* Submit */}
        <button type="submit" disabled={uploading} className={`w-full py-3 rounded-xl font-bold transition-colors ${uploading ? 'bg-green-700/50 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/20 active:scale-[0.98]'}`}>
          {uploading ? 'Subiendo...' : 'Publicar juego'}
        </button>

        <div className="text-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-green-400 transition-colors">← Volver al catálogo</Link>
        </div>
      </form>
    </div>
  );
}
