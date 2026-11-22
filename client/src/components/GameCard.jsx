export default function GameCard({ game }) {
  const thumbUrl = game.thumbnail ? `/static/games/${game.id}${game.thumbnail}` : null;

  return (
    <div className="group bg-gray-900/50 hover:bg-gray-800/60 rounded-xl overflow-hidden border border-gray-800/50 hover:border-green-700/30 transition-all duration-200">
      {thumbUrl ? (
        <img src={thumbUrl} alt="" className="w-full aspect-video object-cover group-hover:scale-[1.02] transition-transform" loading="lazy" />
      ) : (
        <div className="w-full aspect-video bg-gray-800/50 flex items-center justify-center text-4xl">🎮</div>
      )}
      <div className="p-3">
        <h2 className="font-semibold truncate group-hover:text-green-400 transition-colors">{game.title}</h2>
        {game.tags?.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {game.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-800 rounded text-green-400/70">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
