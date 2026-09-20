import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { Series } from '../types';
import { Layers, Bookmark, ArrowRight, BookOpen } from 'lucide-react';

export const UserCollectionsSlider: React.FC = () => {
  const { collections } = useAppStore();
  const [allSeries, setAllSeries] = useState<Series[]>([]);

  useEffect(() => {
    api.getSeries({ limit: 50 }).then((res) => setAllSeries(res.items || []));
  }, []);

  return (
    <section className="my-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-heading text-[#F5F1FF] light:text-[#1A1429]">
              Curated Community Collections
            </h2>
            <span className="text-[10px] font-mono-meta font-bold px-2 py-0.5 rounded-full bg-[#8B5CFF]/20 text-[#8B5CFF]">
              STAFF & VIP PICKS
            </span>
          </div>
          <p className="text-xs text-[#A79FC0] light:text-[#6E6288] mt-0.5">
            Hand-picked reading lists made by readers with over 1,000+ completed chapters
          </p>
        </div>

        <Link
          to="/library?tab=collections"
          className="text-xs font-semibold text-[#FF9F1C] hover:underline flex items-center gap-1"
        >
          <span>Create Collection</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {collections.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[#171122]/40 border border-dashed border-[#2C2340] light:bg-white/40 light:border-[#E2D9F3]">
          <Layers className="w-8 h-8 text-[#A79FC0] mx-auto mb-2 opacity-50" />
          <p className="text-xs font-bold text-[#F5F1FF] light:text-[#1A1429]">
            No curated collections yet
          </p>
          <p className="text-[11px] text-[#A79FC0] light:text-[#6E6288] max-w-sm mx-auto mt-1">
            Build custom reading lists and share your favorite manga, manhwa, and webtoons with fellow readers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {collections.slice(0, 3).map((col) => {
            const previewSeries = allSeries
              .filter((s) => col.seriesIds.includes(s.id))
              .slice(0, 4);

            return (
              <div
                key={col.id}
                className="p-4 rounded-2xl bg-[#171122] border border-[#2C2340] light:bg-white light:border-[#E2D9F3] hover:border-[#FF4D6D]/60 transition-all duration-300 flex flex-col justify-between group shadow-lg"
              >
                <div>
                  {/* 4 Cover Preview Stack */}
                  <div className="grid grid-cols-4 gap-1.5 mb-3 rounded-xl overflow-hidden p-1 bg-[#0E0A14] light:bg-[#F3EEFC]">
                    {previewSeries.map((s) => (
                      <div key={s.id} className="aspect-[2/3] rounded-lg overflow-hidden">
                        <img
                          src={s.coverUrl || s.coverImage}
                          alt={s.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                    {previewSeries.length < 4 && (
                      <div className="aspect-[2/3] rounded-lg bg-[#1F1830] flex items-center justify-center text-[#A79FC0]">
                        <Bookmark className="w-4 h-4 opacity-40" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold font-heading text-[#F5F1FF] light:text-[#1A1429] group-hover:text-[#FF4D6D] transition line-clamp-1">
                      {col.name}
                    </h3>
                    <span className="text-[10px] font-mono-meta px-2 py-0.5 rounded-full bg-[#1F1830] light:bg-[#F3EEFC] text-[#A79FC0] light:text-[#6E6288] shrink-0">
                      {col.seriesIds.length} titles
                    </span>
                  </div>

                  <p className="text-xs text-[#A79FC0] light:text-[#6E6288] line-clamp-2 leading-relaxed mb-3">
                    {col.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#2C2340]/60 light:border-[#E2D9F3]">
                  <div className="flex items-center gap-2">
                    <img
                      src={col.ownerAvatar}
                      alt={col.ownerName}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="text-xs text-[#A79FC0] light:text-[#6E6288]">
                      {col.ownerName}
                    </span>
                  </div>

                  <Link
                    to={`/browse?q=${encodeURIComponent(col.name)}`}
                    className="text-xs font-semibold text-[#FF9F1C] hover:underline"
                  >
                    Explore List →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
