import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Series, Chapter, UserComment, ReadingStatus } from '../types';
import { useAppStore } from '../store/useAppStore';
import { SeriesCard } from '../components/SeriesCard';
import { AgeGate, hasAgeConfirmation, isAdultRating, rememberAgeConfirmation } from '../components/ContentSafety';
import { SITE_NAME, SITE_URL } from '../config';
import { ReportButton } from '../components/ReportButton';
import { TurnstileWidget } from '../components/TurnstileWidget';
import {
  Star,
  Bookmark,
  Share2,
  BookOpen,
  ArrowUpDown,
  Search,
  Download,
  CheckCircle2,
  Clock,
  Eye,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Users,
} from 'lucide-react';

export const SeriesDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    library,
    setSeriesLibraryStatus,
    setSeriesRating,
    readingHistory,
    showToast,
  } = useAppStore();

  const [series, setSeries] = useState<Series | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [comments, setComments] = useState<UserComment[]>([]);
  const [relatedSeries, setRelatedSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  // UI States
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [chapterSearch, setChapterSearch] = useState('');
  const [chapterOrder, setChapterOrder] = useState<'desc' | 'asc'>('desc');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [coverModalOpen, setCoverModalOpen] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);

  // New Comment Input
  const [newCommentText, setNewCommentText] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});
  const [turnstileToken, setTurnstileToken] = useState('');

  useEffect(() => {
    async function loadSeriesData() {
      if (!id) return;
      setLoading(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      try {
        const data = await api.getSeriesById(id);
        if (data) {
          setSeries(data);
          const allowed = !isAdultRating(data.contentRating) || hasAgeConfirmation();
          setAgeConfirmed(allowed);
          if (!allowed) return;
          const chs = await api.getChapters(data.id);
          setChapters(chs);
          const cmts = await api.getComments(data.id);
          setComments(cmts);

          // Find recommendations with matching genres
          const all = await api.getSeries();
          const related = all.items
            .filter((s) => s.id !== data.id && s.genres.some((g) => data.genres.includes(g)))
            .slice(0, 8);
          setRelatedSeries(related);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSeriesData();
  }, [id, user, ageConfirmed]);

  useEffect(() => {
    if (!series) return;
    const adult = isAdultRating(series.contentRating);
    document.title = `${series.title} - Read on ${SITE_NAME}`;
    const description = document.querySelector('meta[name="description"]') || document.createElement('meta');
    description.setAttribute('name', 'description');
    description.setAttribute('content', series.synopsis.slice(0, 155));
    document.head.appendChild(description);
    const canonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', `${SITE_URL}/series/${series.slug || series.id}`);
    document.head.appendChild(canonical);
    const robots = document.querySelector('meta[name="robots"]') || document.createElement('meta');
    robots.setAttribute('name', 'robots');
    robots.setAttribute('content', adult ? 'noindex, nofollow' : 'index, follow');
    document.head.appendChild(robots);
    const rta = document.querySelector('meta[name="RATING"]');
    if (adult && ageConfirmed) {
      const tag = rta || document.createElement('meta');
      tag.setAttribute('name', 'RATING');
      tag.setAttribute('content', 'RTA-5042-1996-1400-1577-RTA');
      document.head.appendChild(tag);
    } else if (rta) {
      rta.remove();
    }
    return () => { if (rta) rta.remove(); };
  }, [series, ageConfirmed]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-[#FF4D6D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-[#A79FC0] font-mono-meta">Loading series details...</p>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold font-heading mb-2">Series Not Found</h2>
        <p className="text-xs text-[#A79FC0] mb-6">
          The series you are looking for does not exist or may have been updated.
        </p>
        <Link
          to="/browse"
          className="px-5 py-2.5 rounded-xl bg-gradient-brand text-white font-bold text-xs"
        >
          Return to Browse
        </Link>
      </div>
    );
  }

  if (isAdultRating(series.contentRating) && !ageConfirmed) {
    return (
      <AgeGate
        onLeave={() => navigate('/browse')}
        onConfirm={() => {
          rememberAgeConfirmation();
          setAgeConfirmed(true);
        }}
      />
    );
  }

  const currentLibraryItem = library[series.id];
  const userStatus = currentLibraryItem?.status || null;
  const userRating = currentLibraryItem?.userRating || null;
  const history = readingHistory[series.id];

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${series.title} - Read Free on Manhwa24`,
        text: `Read ${series.title} on ${SITE_URL}! ${series.synopsis.slice(0, 100)}...`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link Copied', 'Series link copied to your clipboard.', 'success');
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment = await api.postComment({
      content: newCommentText.trim(),
      isSpoiler,
    }, turnstileToken);

    setComments((prev) => [newComment, ...prev]);
    setNewCommentText('');
    setIsSpoiler(false);
    showToast('Comment Posted', 'Your thoughts were shared with the community.', 'success');
  };

  const toggleRevealSpoiler = (commentId: string) => {
    setRevealedSpoilers((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  // Filtered and sorted chapters
  const filteredChapters = chapters
    .filter(
      (c) =>
        (c.chapterNumber || 0).toString().includes(chapterSearch.trim()) ||
        (c.title || '').toLowerCase().includes(chapterSearch.toLowerCase().trim())
    )
    .sort((a, b) =>
      chapterOrder === 'desc'
        ? (b.chapterNumber || 0) - (a.chapterNumber || 0)
        : (a.chapterNumber || 0) - (b.chapterNumber || 0)
    );

  const statuses: ReadingStatus[] = ['Reading', 'Plan to Read', 'Completed', 'Dropped'];

  return (
    <div className="relative pb-16">
      {/* Big Blurred Backdrop Banner */}
      <div className="relative w-full h-72 sm:h-96 overflow-hidden">
        <img
          src={series.coverImage}
          alt={series.title}
          className="w-full h-full object-cover scale-110 filter blur-3xl opacity-30 light:opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#0E0A14]/70 to-[#0E0A14] light:from-white/30 light:via-[#FAF7FF]/80 light:to-[#FAF7FF]" />
      </div>

      {/* Main Series Detail Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-44 sm:-mt-56 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cover & Quick Actions */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start space-y-4">
            {/* Cover Image */}
            <div
              onClick={() => setCoverModalOpen(true)}
              className="relative w-56 sm:w-64 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/10 hover:ring-[#FF4D6D] transition cursor-pointer group bg-[#0E0A14]"
            >
              <img
                src={series.coverImage}
                alt={series.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-semibold text-white">
                <Eye className="w-4 h-4 mr-1.5" />
                <span>Enlarge Cover</span>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="w-full max-w-xs space-y-2.5">
              {history ? (
                <button
                  onClick={() =>
                    navigate(`/series/${series.id}/chapter/${history.chapterNumber}`)
                  }
                  className="w-full py-3 rounded-2xl bg-gradient-brand text-white font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#FF4D6D]/20 hover:opacity-95 active:scale-95 transition"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Continue Ch. {history.chapterNumber}</span>
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/series/${series.id}/chapter/1`)}
                  className="w-full py-3 rounded-2xl bg-gradient-brand text-white font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#FF4D6D]/20 hover:opacity-95 active:scale-95 transition"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Start Reading Ch. 1</span>
                </button>
              )}

              {/* Add to Library with Status Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  className={`w-full py-2.5 px-4 rounded-2xl font-semibold text-xs flex items-center justify-between border transition ${
                    userStatus
                      ? 'bg-[#FF4D6D] text-white border-[#FF4D6D] shadow-md'
                      : 'bg-[#171122] hover:bg-[#1F1830] text-[#F5F1FF] light:bg-white light:text-[#1A1429] light:hover:bg-[#F3EEFC] border-[#2C2340] light:border-[#E2D9F3]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4" />
                    <span>{userStatus ? `In Library: ${userStatus}` : 'Add to Library'}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 opacity-70" />
                </button>

                {statusDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl bg-[#171122] border border-[#2C2340] shadow-2xl p-2 z-30 text-[#F5F1FF] light:bg-white light:border-[#E2D9F3] light:text-[#1A1429] animate-in fade-in">
                    {statuses.map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setSeriesLibraryStatus(series.id, status);
                          setStatusDropdownOpen(false);
                        }}
                        className={`w-full py-2 px-3 rounded-xl text-xs text-left font-medium transition flex items-center justify-between ${
                          userStatus === status
                            ? 'bg-[#FF4D6D] text-white font-bold'
                            : 'hover:bg-[#1F1830] light:hover:bg-[#F3EEFC]'
                        }`}
                      >
                        <span>{status}</span>
                        {userStatus === status && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                    {userStatus && (
                      <button
                        onClick={() => {
                          setSeriesLibraryStatus(series.id, null);
                          setStatusDropdownOpen(false);
                        }}
                        className="w-full py-2 px-3 rounded-xl text-xs text-left text-[#FF4D6D] hover:bg-[#FF4D6D]/10 mt-1 transition"
                      >
                        Remove from Library
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Share and Rating Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setRatingModalOpen(true)}
                  className="py-2 px-3 rounded-xl bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] text-xs font-semibold text-[#FF9F1C] flex items-center justify-center gap-1.5 transition"
                >
                  <Star className="w-3.5 h-3.5 fill-[#FF9F1C]" />
                  <span>{userRating ? `${userRating} Stars` : 'Rate Series'}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="py-2 px-3 rounded-xl bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] text-xs font-semibold text-[#A79FC0] hover:text-white light:text-[#6E6288] flex items-center justify-center gap-1.5 transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
                <ReportButton seriesId={series.id} />
              </div>
            </div>
          </div>

          {/* Right Column: Information, Synopsis, Metadata, Chapter List */}
          <div className="lg:col-span-8 space-y-6">
            {/* Title & Metadata Badges */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono-meta font-bold px-2.5 py-0.5 rounded-lg bg-[#FF4D6D] text-white">
                  {series.type}
                </span>
                <span className="text-[10px] font-mono-meta font-bold px-2.5 py-0.5 rounded-lg bg-[#8B5CFF]/20 text-[#8B5CFF] border border-[#8B5CFF]/30">
                  {series.status}
                </span>
                <span className="text-[10px] font-mono-meta px-2.5 py-0.5 rounded-lg bg-[#171122] light:bg-[#F3EEFC] text-[#A79FC0] light:text-[#6E6288] border border-[#2C2340] light:border-[#E2D9F3]">
                  {series.demographic}
                </span>
                <span className="text-[10px] font-mono-meta px-2.5 py-0.5 rounded-lg bg-[#171122] light:bg-[#F3EEFC] text-[#A79FC0] light:text-[#6E6288] border border-[#2C2340] light:border-[#E2D9F3]">
                  {series.contentRating}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-heading text-[#F5F1FF] light:text-[#1A1429] tracking-tight">
                {series.title}
              </h1>

              {series.altTitles.length > 0 && (
                <p className="text-xs text-[#A79FC0] light:text-[#6E6288] italic">
                  Also known as: {series.altTitles.join(' • ')}
                </p>
              )}
            </div>

            {/* Score & Social Stats */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 p-4 rounded-2xl bg-[#171122] border border-[#2C2340] light:bg-white light:border-[#E2D9F3] text-xs font-mono-meta">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[#FF9F1C]/15 flex items-center justify-center text-[#FF9F1C]">
                  <Star className="w-5 h-5 fill-[#FF9F1C]" />
                </div>
                <div>
                  <span className="text-base font-bold text-[#F5F1FF] light:text-[#1A1429]">
                    {series.rating.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-[#A79FC0] light:text-[#6E6288]">Manhwa24 Score</p>
                </div>
              </div>

              <div className="h-8 w-px bg-[#2C2340] light:bg-[#E2D9F3] hidden sm:block" />

              <div>
                <span className="text-sm font-bold text-[#F5F1FF] light:text-[#1A1429]">
                  {(series.views / 1000).toFixed(1)}k
                </span>
                <p className="text-[10px] text-[#A79FC0] light:text-[#6E6288]">Total Views</p>
              </div>

              <div>
                <span className="text-sm font-bold text-[#F5F1FF] light:text-[#1A1429]">
                  {(series.followers || 0).toLocaleString()}
                </span>
                <p className="text-[10px] text-[#A79FC0] light:text-[#6E6288]">Followers</p>
              </div>

              <div>
                <span className="text-sm font-bold text-[#F5F1FF] light:text-[#1A1429]">
                  #{series.rank || 1}
                </span>
                <p className="text-[10px] text-[#A79FC0] light:text-[#6E6288]">Global Rank</p>
              </div>

              <div>
                <span className="text-sm font-bold text-[#F5F1FF] light:text-[#1A1429]">
                  {series.releaseYear || new Date().getFullYear()}
                </span>
                <p className="text-[10px] text-[#A79FC0] light:text-[#6E6288]">Released</p>
              </div>
            </div>

            {/* Clickable Genre Pills */}
            <div className="flex flex-wrap gap-1.5">
              {(series.genres || []).map((g) => (
                <Link
                  key={g}
                  to={`/browse?genre=${encodeURIComponent(g)}`}
                  className="px-3 py-1 rounded-xl text-xs font-semibold bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] text-[#A79FC0] hover:text-[#FF4D6D] light:text-[#6E6288] transition shadow-sm"
                >
                  {g}
                </Link>
              ))}
            </div>

            {/* Synopsis with Read More Toggle */}
            <div className="p-4 rounded-2xl bg-[#171122] border border-[#2C2340] light:bg-white light:border-[#E2D9F3] shadow-md">
              <h3 className="text-xs font-bold font-heading uppercase tracking-wider text-[#A79FC0] light:text-[#6E6288] mb-2">
                Synopsis
              </h3>
              <p
                className={`text-xs sm:text-sm text-[#FAF7FF] light:text-[#1A1429] leading-relaxed transition-all ${
                  !synopsisExpanded ? 'line-clamp-3' : ''
                }`}
              >
                {series.synopsis}
              </p>
              <button
                onClick={() => setSynopsisExpanded(!synopsisExpanded)}
                className="mt-2 text-xs font-semibold text-[#FF9F1C] hover:underline flex items-center gap-1"
              >
                <span>{synopsisExpanded ? 'Show Less' : 'Read Full Synopsis'}</span>
                {synopsisExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <div className="mt-4 pt-3 border-t border-[#2C2340]/60 light:border-[#E2D9F3] grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-[#A79FC0] light:text-[#6E6288] block">Author:</span>
                  <span className="font-semibold text-[#F5F1FF] light:text-[#1A1429]">{series.author || series.authorName || 'Original Creator'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#A79FC0] light:text-[#6E6288] block">Artist:</span>
                  <span className="font-semibold text-[#F5F1FF] light:text-[#1A1429]">{series.artist || 'Original Artist'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#A79FC0] light:text-[#6E6288] block">Serialization:</span>
                  <span className="font-semibold text-[#F5F1FF] light:text-[#1A1429]">{series.serialization || 'Manhwa24 Digital'}</span>
                </div>
              </div>
            </div>

            {/* Chapter List Section */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#171122] border border-[#2C2340] light:bg-white light:border-[#E2D9F3] shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2C2340]/60 light:border-[#E2D9F3]">
                <div>
                  <h3 className="text-base font-bold font-heading text-[#F5F1FF] light:text-[#1A1429]">
                    Chapters ({chapters.length || series.totalChapters || 0})
                  </h3>
                  <p className="text-[11px] text-[#A79FC0] light:text-[#6E6288]">
                    Available in Webtoon, Right-to-Left, and Left-to-Right reading modes
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Chapter search input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#A79FC0] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={chapterSearch}
                      onChange={(e) => setChapterSearch(e.target.value)}
                      placeholder="Search chapter..."
                      className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] focus:outline-none focus:border-[#FF4D6D] w-36 sm:w-44"
                    />
                  </div>

                  {/* Asc / Desc Sort */}
                  <button
                    onClick={() => setChapterOrder(chapterOrder === 'desc' ? 'asc' : 'desc')}
                    className="p-1.5 rounded-xl bg-[#0E0A14] hover:bg-[#1F1830] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] text-xs font-mono-meta flex items-center gap-1 text-[#A79FC0] hover:text-white light:text-[#6E6288]"
                    title="Toggle sort order"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span className="uppercase">{chapterOrder}</span>
                  </button>
                </div>
              </div>

              {/* Chapters list items */}
              <div className="mt-3 divide-y divide-[#2C2340]/50 light:divide-[#E2D9F3] max-h-96 overflow-y-auto pr-1">
                {filteredChapters.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#A79FC0]">
                    No chapters matched your search.
                  </div>
                ) : (
                  filteredChapters.map((ch) => {
                    const isRead = history && history.chapterNumber >= (ch.chapterNumber || 0);

                    return (
                      <div
                        key={ch.id}
                        className="py-3 px-2 flex items-center justify-between hover:bg-[#1F1830]/70 light:hover:bg-[#F3EEFC] rounded-xl transition group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Read indicator */}
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isRead ? 'bg-[#FF9F1C]' : 'bg-[#2C2340] light:bg-[#E2D9F3]'
                            }`}
                            title={isRead ? 'Read' : 'Unread'}
                          />

                          <div className="min-w-0">
                            <Link
                              to={`/series/${series.id}/chapter/${ch.chapterNumber}`}
                              className="font-bold font-heading text-xs sm:text-sm text-[#F5F1FF] light:text-[#1A1429] group-hover:text-[#FF4D6D] transition truncate block"
                            >
                              Chapter {ch.chapterNumber}: {ch.title}
                            </Link>

                            <div className="flex items-center gap-2 text-[11px] text-[#A79FC0] light:text-[#6E6288] font-mono-meta mt-0.5">
                              <span>{ch.authorName || 'Original Creator'}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {ch.releaseDate}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="hidden sm:inline text-[11px] text-[#A79FC0] light:text-[#6E6288] font-mono-meta">
                            {ch.views.toLocaleString()} reads
                          </span>

                          <button
                            onClick={() => showToast('Download', `Chapter ${ch.chapterNumber} download requested.`, 'success')}
                            className="p-1.5 rounded-lg text-[#A79FC0] hover:text-white hover:bg-[#2C2340] light:hover:bg-[#E2D9F3] transition"
                            title="Download for offline"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <Link
                            to={`/series/${series.id}/chapter/${ch.chapterNumber}`}
                            className="px-3 py-1 rounded-xl bg-[#1F1830] group-hover:bg-gradient-brand text-white text-xs font-semibold shadow-sm transition"
                          >
                            Read
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Discussion & Comments Section */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#171122] border border-[#2C2340] light:bg-white light:border-[#E2D9F3] shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-[#2C2340]/60 light:border-[#E2D9F3] mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#FF4D6D]" />
                  <h3 className="text-base font-bold font-heading text-[#F5F1FF] light:text-[#1A1429]">
                    Reader Discussion ({comments.length})
                  </h3>
                </div>
                <span className="text-xs text-[#A79FC0] light:text-[#6E6288]">
                  Be respectful & tag spoilers
                </span>
              </div>

              {/* Post Comment Input */}
              <form onSubmit={handlePostComment} className="mb-6 space-y-2">
                <TurnstileWidget onToken={setTurnstileToken} />
                <textarea
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Share your chapter review, theory, or reaction..."
                  rows={3}
                  className="w-full p-3 rounded-xl text-xs sm:text-sm bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] focus:outline-none focus:border-[#FF4D6D] text-[#F5F1FF] light:text-[#1A1429] resize-none"
                />

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-[#A79FC0] light:text-[#6E6288] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSpoiler}
                      onChange={(e) => setIsSpoiler(e.target.checked)}
                      className="rounded accent-[#FF4D6D]"
                    />
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#FF9F1C]" />
                      Tag as spoiler
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={!newCommentText.trim()}
                    className="px-4 py-2 rounded-xl bg-gradient-brand text-white font-heading font-bold text-xs shadow-md disabled:opacity-40 transition"
                  >
                    Post Comment
                  </button>
                </div>
              </form>

              {/* Comment Thread List */}
              <div className="space-y-4">
                {comments.map((cmt) => {
                  const isRevealed = revealedSpoilers[cmt.id];

                  return (
                    <div
                      key={cmt.id}
                      className="p-3.5 rounded-2xl bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340]/60 light:border-[#E2D9F3]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={cmt.authorAvatar}
                            alt={cmt.authorName}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-xs font-bold text-[#F5F1FF] light:text-[#1A1429]">
                            {cmt.authorName}
                          </span>
                          {cmt.authorBadge && (
                            <span className="text-[9px] font-mono-meta px-1.5 py-0.5 rounded bg-[#FF4D6D]/20 text-[#FF4D6D]">
                              {cmt.authorBadge}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-[#A79FC0] light:text-[#6E6288] font-mono-meta">
                          {cmt.createdAt}
                        </span>
                      </div>

                      {/* Content or Spoiler Barrier */}
                      {cmt.isSpoiler && !isRevealed ? (
                        <div
                          onClick={() => toggleRevealSpoiler(cmt.id)}
                          className="p-3 rounded-xl bg-[#171122] light:bg-white border border-[#2C2340] cursor-pointer text-center group"
                        >
                          <p className="text-xs font-semibold text-[#FF4D6D] flex items-center justify-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>This comment contains spoilers! Click to reveal.</span>
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-[#FAF7FF] light:text-[#1A1429] leading-relaxed">
                          {cmt.content}
                        </p>
                      )}

                      {/* Comment Actions */}
                      <div className="flex items-center gap-4 mt-3 pt-2 border-t border-[#2C2340]/40 light:border-[#E2D9F3] text-xs text-[#A79FC0] light:text-[#6E6288]">
                        <button
                          onClick={() => showToast('Liked', 'You liked this comment!', 'info')}
                          className="flex items-center gap-1 hover:text-[#FF4D6D] transition"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{cmt.likes}</span>
                        </button>
                        <button
                          onClick={() => showToast('Disliked', 'Feedback recorded.', 'info')}
                          className="flex items-center gap-1 hover:text-white transition"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          <span>{cmt.dislikes}</span>
                        </button>
                        <button
                          onClick={() => showToast('Reply', 'Replying opened in discussion tab.', 'info')}
                          className="hover:underline ml-auto"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* More Like This Recommended Section */}
        {relatedSeries.length > 0 && (
          <div className="mt-16 pt-8 border-t border-[#2C2340] light:border-[#E2D9F3]">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#FF9F1C]" />
              <h2 className="text-xl font-bold font-heading text-[#F5F1FF] light:text-[#1A1429]">
                More Titles Like "{series.title}"
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {relatedSeries.map((item) => (
                <SeriesCard key={item.id} series={item} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cover Image Modal */}
      {coverModalOpen && (
        <div
          onClick={() => setCoverModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in cursor-pointer"
        >
          <div className="max-w-md w-full rounded-2xl overflow-hidden shadow-2xl">
            <img src={series.coverImage} alt={series.title} className="w-full h-auto object-cover" />
            <div className="p-3 bg-[#171122] text-center text-xs text-[#A79FC0]">
              Click anywhere to close
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#171122] border border-[#2C2340] p-6 shadow-2xl text-[#F5F1FF] light:bg-white light:border-[#E2D9F3] light:text-[#1A1429] text-center">
            <h3 className="text-base font-bold font-heading mb-1">Rate "{series.title}"</h3>
            <p className="text-xs text-[#A79FC0] light:text-[#6E6288] mb-4">
              How would you score this series?
            </p>

            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => {
                    setSeriesRating(series.id, star);
                    setRatingModalOpen(false);
                  }}
                  className="p-1 hover:scale-125 transition transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      (userRating || 0) >= star
                        ? 'text-[#FF9F1C] fill-[#FF9F1C]'
                        : 'text-[#2C2340] hover:text-[#FF9F1C]'
                    }`}
                  />
                </button>
              ))}
            </div>

            <button
              onClick={() => setRatingModalOpen(false)}
              className="w-full py-2 rounded-xl bg-[#1F1830] text-xs font-semibold text-[#A79FC0] hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
