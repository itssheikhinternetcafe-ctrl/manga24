import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Series } from '../types';
import { HeroCarousel } from '../components/HeroCarousel';
import { HorizontalSlider } from '../components/HorizontalSlider';
import { SeriesCard } from '../components/SeriesCard';
import { LatestUpdatesGrid } from '../components/LatestUpdatesGrid';
import { SidebarWidgets } from '../components/SidebarWidgets';
import { UserCollectionsSlider } from '../components/UserCollectionsSlider';
import { Flame, Star, Sparkles, TrendingUp, Layers } from 'lucide-react';

const quickFilters = [
  { label: '🔥 All Series', path: '/browse' },
  { label: '🎌 Manga', path: '/browse?type=Manga' },
  { label: '⚡ Manhwa', path: '/browse?type=Manhwa' },
  { label: '🐉 Manhua', path: '/browse?type=Manhua' },
  { label: '📱 Webtoon', path: '/browse?type=Webtoon' },
  { label: '⚔ Action', path: '/browse?genre=Action' },
  { label: '✨ Fantasy', path: '/browse?genre=Fantasy' },
  { label: '🌀 Isekai', path: '/browse?genre=Isekai' },
  { label: '💖 Romance', path: '/browse?genre=Romance' },
  { label: '🥋 Martial Arts', path: '/browse?genre=Martial+Arts' },
  { label: '🚀 Sci-Fi', path: '/browse?genre=Sci-Fi' },
];

export const HomePage: React.FC = () => {
  const [featured, setFeatured] = useState<Series[]>([]);
  const [trending, setTrending] = useState<Series[]>([]);
  const [mostFollowed, setMostFollowed] = useState<Series[]>([]);
  const [editorPicks, setEditorPicks] = useState<Series[]>([]);
  const [latestUpdates, setLatestUpdates] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const [feat, trend, followed, picks, updates] = await Promise.all([
          api.getFeaturedSeries(),
          api.getTrendingSeries(),
          api.getMostFollowed(),
          api.getEditorPicks(),
          api.getLatestUpdates('all'),
        ]);

        setFeatured(feat);
        setTrending(trend);
        setMostFollowed(followed);
        setEditorPicks(picks);
        setLatestUpdates(updates);
      } catch (err) {
        console.error('Failed to load homepage data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* Hero Carousel */}
      <HeroCarousel seriesList={featured} />

      {/* Quick Category & Genre Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 -mx-2 px-2 my-4">
        {quickFilters.map((q) => (
          <button
            key={q.label}
            onClick={() => navigate(q.path)}
            className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] text-[#F5F1FF] light:text-[#1A1429] hover:border-[#FF4D6D] transition active:scale-95 shadow-sm"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Trending Now Slider (Ranked #1 - #10) */}
      <HorizontalSlider
        title="Trending Right Now"
        subtitle="Most read series in the past 24 hours on Manga24"
        badge="TOP 10"
        viewAllLink="/browse?sort=popular"
      >
        {trending.map((item, index) => (
          <div key={item.id} className="w-36 sm:w-44 shrink-0" style={{ scrollSnapAlign: 'start' }}>
            <SeriesCard
              series={item}
              rank={index + 1}
              showRank={true}
              showTrendingHot={index < 3}
            />
          </div>
        ))}
      </HorizontalSlider>

      {/* Most Followed Series Slider */}
      <HorizontalSlider
        title="Most Followed Hits"
        subtitle="Readers' all-time top bookmarks and subscribed series"
        badge="MOST SAVED"
        viewAllLink="/browse?sort=popular"
      >
        {mostFollowed.map((item) => (
          <div key={item.id} className="w-36 sm:w-44 shrink-0" style={{ scrollSnapAlign: 'start' }}>
            <SeriesCard series={item} />
          </div>
        ))}
      </HorizontalSlider>

      {/* Main Two-Column Layout: Left Updates & Right Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8">
        {/* Left 8 Columns: Latest Chapter Updates Grid */}
        <div className="lg:col-span-8">
          <LatestUpdatesGrid seriesList={latestUpdates} />
        </div>

        {/* Right 4 Columns: Desktop Sidebar Widgets */}
        <div className="lg:col-span-4">
          <SidebarWidgets />
        </div>
      </div>

      {/* Staff & Editor Picks Slider */}
      <HorizontalSlider
        title="Manga24 Staff Recommendations"
        subtitle="Hand-picked for exceptional art, pacing, and compelling storylines"
        badge="CURATED"
        viewAllLink="/browse?sort=rating"
      >
        {editorPicks.map((item) => (
          <div key={item.id} className="w-36 sm:w-44 shrink-0" style={{ scrollSnapAlign: 'start' }}>
            <SeriesCard series={item} />
          </div>
        ))}
      </HorizontalSlider>

      {/* Curated User Collections Section */}
      <UserCollectionsSlider />
    </div>
  );
};
