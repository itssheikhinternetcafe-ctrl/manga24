import React, { useState } from 'react';
import { Series } from '../types';
import { SeriesCard } from './SeriesCard';
import { Flame, Clock, Sparkles, ChevronDown } from 'lucide-react';

interface LatestUpdatesGridProps {
  seriesList: Series[];
}

export const LatestUpdatesGrid: React.FC<LatestUpdatesGridProps> = ({ seriesList }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'hot' | 'new'>('all');
  const [visibleCount, setVisibleCount] = useState(12);

  const getFilteredList = () => {
    let list = [...seriesList];
    if (activeTab === 'hot') {
      list.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (activeTab === 'new') {
      list.sort(
        (a, b) =>
          (b.releaseYear || 0) - (a.releaseYear || 0) ||
          (b.latestChapterNumber || 0) - (a.latestChapterNumber || 0)
      );
    } else {
      list.sort((a, b) => (b.latestChapterNumber || 0) - (a.latestChapterNumber || 0));
    }
    return list;
  };

  const filtered = getFilteredList();
  const displayed = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="my-8">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-heading text-[#F5F1FF] light:text-[#1A1429]">
              Latest Chapter Updates
            </h2>
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D6D] animate-ping" />
          </div>
          <p className="text-xs text-[#A79FC0] light:text-[#6E6288] mt-0.5">
            Updated in real-time by creators and authorized publishers
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center p-1 rounded-xl bg-[#171122] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] self-start sm:self-auto">
          <button
            onClick={() => {
              setActiveTab('all');
              setVisibleCount(12);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'all'
                ? 'bg-gradient-brand text-white shadow-sm'
                : 'text-[#A79FC0] light:text-[#6E6288] hover:text-white light:hover:text-[#1A1429]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>All Updates</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('hot');
              setVisibleCount(12);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'hot'
                ? 'bg-gradient-brand text-white shadow-sm'
                : 'text-[#A79FC0] light:text-[#6E6288] hover:text-white light:hover:text-[#1A1429]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Hot</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('new');
              setVisibleCount(12);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'new'
                ? 'bg-gradient-brand text-white shadow-sm'
                : 'text-[#A79FC0] light:text-[#6E6288] hover:text-white light:hover:text-[#1A1429]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Series</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {displayed.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-2xl bg-[#171122]/40 light:bg-white/40 border border-dashed border-[#2C2340] light:border-[#E2D9F3]">
          <Clock className="w-8 h-8 text-[#A79FC0] light:text-[#6E6288] mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold font-heading text-[#F5F1FF] light:text-[#1A1429]">
            No series updates yet
          </p>
          <p className="text-xs text-[#A79FC0] light:text-[#6E6288] mt-1">
            Publish chapters or upload new stories from the Admin console to see them appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {displayed.map((item) => (
            <SeriesCard
              key={item.id}
              series={item}
              showTrendingHot={activeTab === 'hot'}
            />
          ))}
        </div>
      )}

      {/* Load More Trigger */}
      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setVisibleCount((prev) => prev + 12)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] text-xs font-bold font-heading text-[#F5F1FF] light:text-[#1A1429] shadow-md hover:border-[#FF4D6D] transition active:scale-95"
          >
            <ChevronDown className="w-4 h-4 text-[#FF4D6D]" />
            <span>Load More Updates ({filtered.length - visibleCount} remaining)</span>
          </button>
        </div>
      )}
    </div>
  );
};
