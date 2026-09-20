import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Series } from '../types';
import { useAppStore } from '../store/useAppStore';
import { Star, Bookmark, Play, Clock, Flame } from 'lucide-react';

interface SeriesCardProps {
  series: Series;
  rank?: number;
  showRank?: boolean;
  showTrendingHot?: boolean;
  compact?: boolean;
  className?: string;
}

export const SeriesCard: React.FC<SeriesCardProps> = ({
  series,
  rank,
  showRank = false,
  showTrendingHot = false,
  compact = false,
  className = '',
}) => {
  const { library, toggleBookmark } = useAppStore();
  const navigate = useNavigate();

  const isBookmarked = !!library[series.id]?.isBookmarked;

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(series.id);
  };

  const handleReadNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/series/${series.id}/chapter/${series.latestChapterNumber || 1}`);
  };

  const typeColorMap: Record<string, string> = {
    Manga: 'bg-[#FF4D6D] text-white',
    Manhwa: 'bg-[#8B5CFF] text-white',
    Manhua: 'bg-[#FF9F1C] text-[#0E0A14]',
    Webtoon: 'bg-[#00B4D8] text-white',
  };

  return (
    <div
      className={`group relative flex flex-col rounded-2xl overflow-hidden bg-[#1F1830]/80 light:bg-white border border-[#2C2340] light:border-[#E2D9F3] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#FF4D6D]/10 hover:border-[#FF4D6D]/50 ${className}`}
    >
      {/* Cover container */}
      <Link to={`/series/${series.id}`} className="relative block aspect-[2/3] w-full overflow-hidden bg-[#0E0A14]">
        <img
          src={series.coverUrl || series.coverImage || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80'}
          alt={series.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          {/* Type Badge */}
          <span
            className={`text-[10px] font-mono-meta font-bold px-2 py-0.5 rounded-lg shadow-md uppercase tracking-wider ${
              typeColorMap[series.type] || 'bg-[#8B5CFF] text-white'
            }`}
          >
            {series.type}
          </span>

          {/* Quick Bookmark button */}
          <button
            onClick={handleBookmarkClick}
            className={`pointer-events-auto p-1.5 rounded-lg backdrop-blur-md transition ${
              isBookmarked
                ? 'bg-[#FF4D6D] text-white shadow-md scale-110'
                : 'bg-[#0E0A14]/70 text-[#F5F1FF] hover:bg-[#FF4D6D] hover:text-white'
            }`}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark series'}
            title={isBookmarked ? 'Bookmarked' : 'Add to library'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Rank Overlay (for Top 10 lists) */}
        {showRank && (rank !== undefined || series.rank) && (
          <div className="absolute top-2 left-2 pointer-events-none">
            <span className="w-7 h-7 rounded-xl bg-gradient-brand text-white font-heading font-black text-xs flex items-center justify-center shadow-lg ring-1 ring-white/20">
              #{rank || series.rank}
            </span>
          </div>
        )}

        {/* Hot badge */}
        {showTrendingHot && (
          <div className="absolute bottom-2 left-2 pointer-events-none flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FF4D6D]/90 text-white text-[10px] font-mono-meta font-bold shadow-md">
            <Flame className="w-3 h-3 fill-white" />
            <span>HOT</span>
          </div>
        )}

        {/* Rating chip bottom right */}
        <div className="absolute bottom-2 right-2 pointer-events-none flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#0E0A14]/80 backdrop-blur-sm text-white text-[10px] font-mono-meta font-semibold shadow-md">
          <Star className="w-3 h-3 text-[#FF9F1C] fill-[#FF9F1C]" />
          <span>{(series.rating || 5).toFixed(1)}</span>
        </div>

        {/* Hover Overlay with "Read Now" */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E0A14] via-[#0E0A14]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 pointer-events-none">
          <p className="text-xs text-[#FAF7FF] line-clamp-3 mb-2.5 leading-snug drop-shadow">
            {series.synopsis}
          </p>
          <button
            onClick={handleReadNow}
            className="pointer-events-auto w-full py-1.5 px-3 rounded-xl bg-gradient-brand text-white font-heading font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg hover:opacity-90 active:scale-95 transition"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Read Now</span>
          </button>
        </div>
      </Link>

      {/* Info Section */}
      <div className={`p-2.5 sm:p-3 flex flex-col flex-1 justify-between ${compact ? 'gap-1' : 'gap-1.5'}`}>
        <div>
          <Link
            to={`/series/${series.id}`}
            className="block text-xs sm:text-sm font-bold font-heading line-clamp-1 text-[#F5F1FF] light:text-[#1A1429] hover:text-[#FF4D6D] transition-colors"
            title={series.title}
          >
            {series.title}
          </Link>
          <p className="text-[11px] text-[#A79FC0] light:text-[#6E6288] line-clamp-1 mt-0.5">
            {series.genres.slice(0, 2).join(' • ')}
          </p>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-[#2C2340]/50 light:border-[#E2D9F3] text-[11px] font-mono-meta">
          <span className="text-[#FF9F1C] font-semibold">
            Ch. {series.latestChapterNumber}
          </span>
          <span className="text-[#A79FC0] light:text-[#6E6288] flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {series.latestUpdateDate}
          </span>
        </div>
      </div>
    </div>
  );
};
