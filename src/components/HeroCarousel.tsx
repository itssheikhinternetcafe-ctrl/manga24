import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Series } from '../types';
import { useAppStore } from '../store/useAppStore';
import { BookOpen, Bookmark, Star, ChevronLeft, ChevronRight, Flame, Sparkles } from 'lucide-react';

interface HeroCarouselProps {
  seriesList: Series[];
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ seriesList }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { library, toggleBookmark } = useAppStore();
  const navigate = useNavigate();

  const featured = seriesList.slice(0, 5);

  useEffect(() => {
    if (isPaused || featured.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featured.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused, featured.length]);

  if (featured.length === 0) {
    return (
      <div className="relative w-full rounded-3xl overflow-hidden my-4 sm:my-6 p-8 sm:p-12 text-center border border-dashed border-[#2C2340] light:border-[#E2D9F3] bg-[#171122]/40 light:bg-white/40 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-[#FF4D6D]/10 text-[#FF4D6D] border border-[#FF4D6D]/20 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold font-heading text-[#F5F1FF] light:text-[#1A1429] mb-1">
          No featured series yet
        </h3>
        <p className="text-xs text-[#A79FC0] light:text-[#6E6288] max-w-md mx-auto mb-4">
          Publish a series in the Admin panel and mark it as 'Featured' to spotlight it on this hero carousel.
        </p>
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-brand text-white font-heading font-bold text-xs shadow-md hover:opacity-95 transition"
        >
          <span>Open Admin Panel</span>
        </Link>
      </div>
    );
  }

  const current = featured[currentIndex];
  const isBookmarked = !!library[current.id]?.isBookmarked;

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleBookmark(current.id);
  };

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % featured.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + featured.length) % featured.length);

  const coverImg = current.coverUrl || current.coverImage || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80';

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden my-4 sm:my-6 shadow-2xl border border-[#2C2340] light:border-[#E2D9F3] bg-[#171122] light:bg-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Blurred Backdrop Image */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src={coverImg}
          alt={current.title}
          className="w-full h-full object-cover scale-125 filter blur-3xl opacity-20 light:opacity-10 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0E0A14] via-[#0E0A14]/90 to-[#0E0A14]/40 light:from-white light:via-white/90 light:to-white/40" />
      </div>

      {/* Main Slide Content */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 p-5 sm:p-8 md:p-10 items-center min-h-[360px] sm:min-h-[420px]">
        {/* Left Info Column */}
        <div className="md:col-span-8 flex flex-col justify-center space-y-4">
          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] font-mono-meta font-bold px-2.5 py-1 rounded-lg bg-gradient-brand text-white uppercase shadow-md">
              <Flame className="w-3.5 h-3.5 fill-white" />
              <span>FEATURED #{currentIndex + 1}</span>
            </span>

            <span className="text-[11px] font-mono-meta font-bold px-2.5 py-1 rounded-lg bg-[#8B5CFF]/20 text-[#8B5CFF] border border-[#8B5CFF]/30">
              {current.type}
            </span>

            <div className="flex items-center gap-1 text-xs font-mono-meta px-2.5 py-1 rounded-lg bg-[#1F1830] light:bg-[#F3EEFC] text-[#FF9F1C] border border-[#2C2340] light:border-[#E2D9F3]">
              <Star className="w-3.5 h-3.5 fill-[#FF9F1C]" />
              <span className="font-bold">{(current.rating || 5).toFixed(2)}</span>
              <span className="text-[#A79FC0] light:text-[#6E6288] text-[10px]">
                ({((current.views || 0) / 1000).toFixed(0)}k reads)
              </span>
            </div>
          </div>

          {/* Title */}
          <Link to={`/series/${current.id}`} className="group">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-heading tracking-tight text-[#F5F1FF] light:text-[#1A1429] group-hover:text-[#FF4D6D] transition-colors leading-tight">
              {current.title}
            </h1>
          </Link>

          {/* Genres Chips */}
          <div className="flex flex-wrap gap-1.5">
            {(current.genres || []).map((g) => (
              <span
                key={g}
                className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#1F1830] light:bg-[#F3EEFC] text-[#A79FC0] light:text-[#6E6288] border border-[#2C2340] light:border-[#E2D9F3]"
              >
                {g}
              </span>
            ))}
            <span className="text-[11px] px-2.5 py-0.5 rounded-full text-[#FF9F1C] font-mono-meta">
              {current.status} • Ch. {current.latestChapterNumber || 0}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[#A79FC0] light:text-[#6E6288] line-clamp-3 leading-relaxed max-w-2xl">
            {current.synopsis}
          </p>

          {/* Buttons Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => navigate(`/series/${current.id}/chapter/1`)}
              className="py-2.5 px-5 sm:px-6 rounded-2xl bg-gradient-brand text-white font-heading font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-[#FF4D6D]/20 hover:opacity-95 active:scale-95 transition"
            >
              <BookOpen className="w-4 h-4" />
              <span>Start Reading Ch. 1</span>
            </button>

            <button
              onClick={handleBookmark}
              className={`py-2.5 px-4 sm:px-5 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2 border transition ${
                isBookmarked
                  ? 'bg-[#FF4D6D] text-white border-[#FF4D6D] shadow-lg'
                  : 'bg-[#1F1830] hover:bg-[#2C2340] text-[#F5F1FF] light:bg-[#F3EEFC] light:text-[#1A1429] light:hover:bg-[#E2D9F3] border-[#2C2340] light:border-[#E2D9F3]'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              <span>{isBookmarked ? 'In Library' : 'Add to Library'}</span>
            </button>

            <Link
              to={`/series/${current.id}`}
              className="py-2.5 px-4 rounded-2xl text-xs font-semibold text-[#A79FC0] light:text-[#6E6288] hover:text-[#F5F1FF] light:hover:text-[#1A1429] transition"
            >
              Details & Chapters →
            </Link>
          </div>
        </div>

        {/* Right Artwork Column (Desktop) */}
        <div className="md:col-span-4 hidden md:flex justify-center items-center">
          <Link
            to={`/series/${current.id}`}
            className="relative block w-52 lg:w-60 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/10 hover:scale-105 transition-transform duration-300 group"
          >
            <img
              src={coverImg}
              alt={current.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <span className="text-xs font-bold text-white font-heading">
                Explore Series Overview →
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Carousel Navigation Arrows & Dots */}
      <div className="relative z-10 px-5 sm:px-8 pb-5 flex items-center justify-between">
        {/* Dots */}
        <div className="flex items-center gap-2">
          {featured.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-8 bg-gradient-brand'
                  : 'w-2 bg-[#2C2340] light:bg-[#E2D9F3] hover:bg-[#A79FC0]'
              }`}
              aria-label={`Slide to ${item.title}`}
            />
          ))}
        </div>

        {/* Left / Right arrow triggers */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevSlide}
            className="p-2 rounded-xl bg-[#1F1830] hover:bg-[#2C2340] light:bg-[#F3EEFC] light:hover:bg-[#E2D9F3] border border-[#2C2340] light:border-[#E2D9F3] text-[#F5F1FF] light:text-[#1A1429] transition shadow-sm"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextSlide}
            className="p-2 rounded-xl bg-[#1F1830] hover:bg-[#2C2340] light:bg-[#F3EEFC] light:hover:bg-[#E2D9F3] border border-[#2C2340] light:border-[#E2D9F3] text-[#F5F1FF] light:text-[#1A1429] transition shadow-sm"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
