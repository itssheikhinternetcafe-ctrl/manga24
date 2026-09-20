import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Series, CommunityPost } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Trophy,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Flame,
  ArrowRight,
} from 'lucide-react';

export const SidebarWidgets: React.FC = () => {
  const [tab, setTab] = useState<'completed' | 'recent'>('completed');
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);

  useEffect(() => {
    async function loadWidgetsData() {
      try {
        const [seriesRes, postsRes] = await Promise.all([
          api.getSeries({ limit: 10 }),
          api.getCommunityPosts(),
        ]);
        setSeriesList(seriesRes.items || []);
        setCommunityPosts(postsRes || []);
      } catch (err) {
        console.error('SidebarWidgets load error:', err);
      }
    }
    loadWidgetsData();
  }, []);

  const completedSeries = seriesList.filter((s) => s.status === 'Completed').slice(0, 5);
  const recentlyAdded = [...seriesList]
    .sort(
      (a, b) =>
        (b.releaseYear || 0) - (a.releaseYear || 0) ||
        (b.latestChapterNumber || 0) - (a.latestChapterNumber || 0)
    )
    .slice(0, 5);

  const activeSeriesList = tab === 'completed' ? completedSeries : recentlyAdded;

  return (
    <aside className="space-y-6">
      {/* PWA In-App Install Widget */}
      <PWAInstallButton variant="card" />

      {/* Join Discord Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#5865F2]/20 via-[#171122] to-[#1F1830] border border-[#5865F2]/30 light:from-[#5865F2]/10 light:to-white light:border-[#5865F2]/20 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#5865F2] flex items-center justify-center text-white font-bold shadow-md">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold font-heading text-[#F5F1FF] light:text-[#1A1429]">
                Manga24 Discord
              </h4>
              <p className="text-[10px] text-[#A79FC0] light:text-[#6E6288]">
                18,400+ online manga fans
              </p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#57F287] ring-4 ring-[#57F287]/20" />
        </div>
        <p className="text-xs text-[#A79FC0] light:text-[#6E6288] mb-3 leading-relaxed">
          Chat raw chapter spoilers, scanlation releases, and series recommendations 24/7.
        </p>
        <a
          href="https://discord.gg"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2 px-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold font-heading flex items-center justify-center gap-1.5 shadow-md transition"
        >
          <span>Join Community Discord</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Completed Series / Recent Releases Tabs */}
      <div className="p-4 rounded-2xl bg-[#171122] border border-[#2C2340] light:bg-white light:border-[#E2D9F3] shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-[#2C2340]/60 light:border-[#E2D9F3]">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0E0A14] light:bg-[#F3EEFC]">
            <button
              onClick={() => setTab('completed')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                tab === 'completed'
                  ? 'bg-[#FF4D6D] text-white shadow-sm'
                  : 'text-[#A79FC0] light:text-[#6E6288]'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setTab('recent')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                tab === 'recent'
                  ? 'bg-[#8B5CFF] text-white shadow-sm'
                  : 'text-[#A79FC0] light:text-[#6E6288]'
              }`}
            >
              Recent
            </button>
          </div>
          <Link
            to="/browse"
            className="text-[11px] font-semibold text-[#FF9F1C] hover:underline flex items-center gap-0.5"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {activeSeriesList.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#A79FC0] light:text-[#6E6288]">
            No series in this list yet.
          </div>
        ) : (
          <div className="divide-y divide-[#2C2340]/40 light:divide-[#E2D9F3] mt-2">
            {activeSeriesList.map((series) => (
              <Link
                key={series.id}
                to={`/series/${series.id}`}
                className="py-2.5 flex items-center gap-3 group"
              >
                <img
                  src={series.coverUrl || series.coverImage}
                  alt={series.title}
                  className="w-11 h-15 rounded-lg object-cover shadow-sm group-hover:scale-105 transition shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono-meta px-1.5 py-0.2 rounded bg-[#8B5CFF]/20 text-[#8B5CFF] font-bold">
                      {series.type}
                    </span>
                    {series.status === 'Completed' && (
                      <span className="text-[9px] text-[#57F287] font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Done
                      </span>
                    )}
                  </div>
                  <h5 className="text-xs font-bold font-heading truncate mt-0.5 group-hover:text-[#FF4D6D] transition text-[#F5F1FF] light:text-[#1A1429]">
                    {series.title}
                  </h5>
                  <p className="text-[10px] text-[#A79FC0] light:text-[#6E6288] font-mono-meta mt-0.5">
                    Ch. {series.latestChapterNumber || 0} • {series.views?.toLocaleString() || 0} reads
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Live Community Feed Snippet */}
      <div className="p-4 rounded-2xl bg-[#171122] border border-[#2C2340] light:bg-white light:border-[#E2D9F3] shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-[#2C2340]/60 light:border-[#E2D9F3]">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#FF4D6D]" />
            <h4 className="text-xs font-bold font-heading text-[#F5F1FF] light:text-[#1A1429]">
              Hot Discussions
            </h4>
          </div>
          <Link to="/community" className="text-[11px] font-semibold text-[#FF9F1C] hover:underline">
            All Posts
          </Link>
        </div>

        {communityPosts.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#A79FC0] light:text-[#6E6288]">
            No discussions yet. Be the first to start a thread!
          </div>
        ) : (
          <div className="divide-y divide-[#2C2340]/40 light:divide-[#E2D9F3] mt-2">
            {communityPosts.slice(0, 3).map((post) => (
              <Link key={post.id} to="/community" className="py-2.5 block group">
                <div className="flex items-center gap-1.5 text-[10px] font-mono-meta text-[#A79FC0] light:text-[#6E6288] mb-1">
                  <span className="text-[#8B5CFF] font-semibold">[{post.category}]</span>
                  <span>•</span>
                  <span>{post.replyCount || 0} comments</span>
                </div>
                <p className="text-xs font-bold line-clamp-2 group-hover:text-[#FF4D6D] transition text-[#F5F1FF] light:text-[#1A1429]">
                  {post.title}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-[#A79FC0] light:text-[#6E6288]">
                  <span>by {post.authorName}</span>
                  <span>•</span>
                  <span>{post.likes} likes</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
