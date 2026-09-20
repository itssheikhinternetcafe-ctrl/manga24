import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalSliderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
  viewAllLink?: string;
}

export const HorizontalSlider: React.FC<HorizontalSliderProps> = ({
  title,
  subtitle,
  badge,
  children,
  viewAllLink,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="my-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5 px-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold font-heading text-[#F5F1FF] light:text-[#1A1429]">
              {title}
            </h2>
            {badge && (
              <span className="text-[10px] font-mono-meta font-bold px-2 py-0.5 rounded-full bg-gradient-brand text-white uppercase shadow-sm">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-[#A79FC0] light:text-[#6E6288] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {viewAllLink && (
            <a
              href={viewAllLink}
              className="text-xs font-semibold text-[#FF9F1C] hover:underline mr-1"
            >
              View All
            </a>
          )}
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-xl bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] text-[#A79FC0] hover:text-white light:hover:text-[#1A1429] transition shadow-sm"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-xl bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] text-[#A79FC0] hover:text-white light:hover:text-[#1A1429] transition shadow-sm"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slider Container */}
      {React.Children.count(children) === 0 ? (
        <div className="py-8 px-4 text-center rounded-2xl bg-[#171122]/30 light:bg-white/30 border border-dashed border-[#2C2340] light:border-[#E2D9F3] text-xs text-[#A79FC0] light:text-[#6E6288]">
          No titles published yet in this category.
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2 pt-1 -mx-2 px-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {children}
        </div>
      )}
    </section>
  );
};
