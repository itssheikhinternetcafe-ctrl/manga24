import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Series, Chapter, ChapterPage } from '../types';
import { useAppStore } from '../store/useAppStore';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Sliders,
  Sun,
  Moon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle,
  ThumbsUp,
  MessageSquare,
  BookOpen,
  Sparkles,
  Share2,
} from 'lucide-react';

export const ReaderPage: React.FC = () => {
  const { id, chapterNumber } = useParams<{ id: string; chapterNumber: string }>();
  const navigate = useNavigate();

  const currentChNum = parseInt(chapterNumber || '1', 10);

  const {
    readingMode,
    setReadingMode,
    fitMode,
    setFitMode,
    zoom,
    setZoom,
    darkReaderMode,
    setDarkReaderMode,
    updateReadingProgress,
    showToast,
  } = useAppStore();

  const [series, setSeries] = useState<Series | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [fetchedChapter, setFetchedChapter] = useState<Chapter | null>(null);
  const [pages, setPages] = useState<ChapterPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasLikedChapter, setHasLikedChapter] = useState(false);
  const [chapterComment, setChapterComment] = useState('');

  // Novel reader settings
  const [novelFontSize, setNovelFontSize] = useState<number>(18);
  const [novelTheme, setNovelTheme] = useState<'plum' | 'sepia' | 'black'>('plum');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  // Load series & pages
  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        const s = await api.getSeriesById(id);
        setSeries(s);
        const chList = await api.getChapters(id);
        setChapters(chList);
        const chData = await api.getChapter(id, currentChNum);
        setFetchedChapter(chData);

        const pList = await api.getChapterPages(id, currentChNum);
        setPages(pList);
        setCurrentPageIndex(0);

        // Update initial progress
        updateReadingProgress(id, currentChNum, 1, 10);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, currentChNum]);

  // Track scroll position for Webtoon mode & auto-hide controls
  useEffect(() => {
    if (readingMode !== 'webtoon') return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progressPercent = maxScroll > 0 ? (currentScrollY / maxScroll) * 100 : 0;

      if (id) {
        const pageEst = Math.min(
          pages.length,
          Math.max(1, Math.ceil((currentScrollY / (maxScroll || 1)) * pages.length))
        );
        updateReadingProgress(id, currentChNum, pageEst, Math.round(progressPercent));
      }

      // Hide controls on scroll down, show on scroll up
      if (currentScrollY > lastScrollY.current + 40 && currentScrollY > 100) {
        setControlsVisible(false);
      } else if (currentScrollY < lastScrollY.current - 20) {
        setControlsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [readingMode, id, currentChNum, pages.length]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowRight') {
        if (readingMode === 'paged-rtl') {
          prevPage();
        } else {
          nextPage();
        }
      } else if (e.key === 'ArrowLeft') {
        if (readingMode === 'paged-rtl') {
          nextPage();
        } else {
          prevPage();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        setControlsVisible((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSettingsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readingMode, currentPageIndex, pages.length]);

  const nextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      const newPage = currentPageIndex + 1;
      setCurrentPageIndex(newPage);
      if (id) {
        updateReadingProgress(id, currentChNum, newPage + 1, Math.round(((newPage + 1) / pages.length) * 100));
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentChNum < (series?.totalChapters || 1)) {
      goToChapter(currentChNum + 1);
    }
  };

  const prevPage = () => {
    if (currentPageIndex > 0) {
      const newPage = currentPageIndex - 1;
      setCurrentPageIndex(newPage);
      if (id) {
        updateReadingProgress(id, currentChNum, newPage + 1, Math.round(((newPage + 1) / pages.length) * 100));
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToChapter = (num: number) => {
    if (!id) return;
    navigate(`/series/${id}/chapter/${num}`);
    window.scrollTo({ top: 0 });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleChapterLike = () => {
    setHasLikedChapter(true);
    showToast('Chapter Liked!', 'Thank you for supporting this release!', 'success');
  };

  const handlePostChapterComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterComment.trim()) return;
    showToast('Comment Sent', 'Posted to chapter discussion.', 'success');
    setChapterComment('');
  };

  const currentChapter = fetchedChapter || chapters.find((c) => c.chapterNumber === currentChNum);
  const nextChapterAvailable = currentChNum < (series?.totalChapters || 1);
  const prevChapterAvailable = currentChNum > 1;

  // Reading progress percentage calculation
  const progressPercent =
    readingMode === 'webtoon'
      ? Math.min(100, Math.round(((currentPageIndex + 1) / (pages.length || 1)) * 100))
      : Math.round(((currentPageIndex + 1) / (pages.length || 1)) * 100);

  // Background styling
  const bgClass = darkReaderMode ? 'bg-black text-[#F5F1FF]' : 'bg-[#0E0A14] text-[#F5F1FF] light:bg-[#FAF7FF] light:text-[#1A1429]';

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-200 select-none relative`}>
      {/* Top Thin Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-transparent z-50 pointer-events-none">
        <div
          className="h-full bg-gradient-brand transition-all duration-200 shadow-sm"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Floating / Sticky Top Controls Bar */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 bg-[#0E0A14]/90 light:bg-white/90 backdrop-blur-md border-b border-[#2C2340] light:border-[#E2D9F3] transition-transform duration-300 ${
          controlsVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
          {/* Back & Series Info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => navigate(`/series/${id}`)}
              className="p-1.5 rounded-xl bg-[#171122] hover:bg-[#1F1830] light:bg-[#F3EEFC] text-[#F5F1FF] light:text-[#1A1429] transition"
              aria-label="Back to series details"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <Link
                to={`/series/${id}`}
                className="text-xs sm:text-sm font-bold font-heading truncate text-[#F5F1FF] light:text-[#1A1429] hover:text-[#FF4D6D] transition block"
              >
                {series?.title || 'Series'}
              </Link>
              <p className="text-[10px] text-[#A79FC0] light:text-[#6E6288] font-mono-meta truncate">
                Ch. {currentChNum}: {currentChapter?.title || 'Episode'}
              </p>
            </div>
          </div>

          {/* Chapter Quick Jumper Dropdown */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <select
              value={currentChNum}
              onChange={(e) => goToChapter(parseInt(e.target.value, 10))}
              className="py-1 px-2.5 rounded-xl text-xs font-semibold bg-[#171122] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] text-[#F5F1FF] light:text-[#1A1429] focus:outline-none focus:border-[#FF4D6D]"
            >
              {chapters.map((ch) => (
                <option key={ch.id} value={ch.chapterNumber}>
                  Ch. {ch.chapterNumber}
                </option>
              ))}
            </select>

            {/* Settings Trigger */}
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`p-2 rounded-xl border transition ${
                settingsOpen
                  ? 'bg-[#FF4D6D] text-white border-[#FF4D6D]'
                  : 'bg-[#171122] hover:bg-[#1F1830] light:bg-[#F3EEFC] border-[#2C2340] light:border-[#E2D9F3] text-[#F5F1FF] light:text-[#1A1429]'
              }`}
              aria-label="Reader settings"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Fullscreen Trigger */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-[#171122] hover:bg-[#1F1830] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] text-[#F5F1FF] light:text-[#1A1429] transition hidden sm:flex"
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Reader Settings Drawer Modal */}
      {settingsOpen && (
        <div className="fixed top-16 right-3 sm:right-6 z-50 w-72 rounded-2xl bg-[#171122] border border-[#2C2340] shadow-2xl p-4 text-[#F5F1FF] light:bg-white light:border-[#E2D9F3] light:text-[#1A1429] animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#2C2340]/60 light:border-[#E2D9F3]">
            <span className="text-xs font-bold font-heading">Reader Settings</span>
            <button
              onClick={() => setSettingsOpen(false)}
              className="text-xs text-[#A79FC0] hover:text-white"
            >
              Done
            </button>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Reading Mode */}
            <div>
              <span className="block text-[#A79FC0] light:text-[#6E6288] mb-1.5 font-medium">
                Reading Mode
              </span>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#0E0A14] light:bg-[#F3EEFC]">
                <button
                  onClick={() => setReadingMode('webtoon')}
                  className={`py-1 rounded-lg text-[11px] font-semibold transition ${
                    readingMode === 'webtoon' ? 'bg-[#FF4D6D] text-white shadow-sm' : 'text-[#A79FC0]'
                  }`}
                >
                  Webtoon
                </button>
                <button
                  onClick={() => setReadingMode('paged-rtl')}
                  className={`py-1 rounded-lg text-[11px] font-semibold transition ${
                    readingMode === 'paged-rtl' ? 'bg-[#8B5CFF] text-white shadow-sm' : 'text-[#A79FC0]'
                  }`}
                  title="Traditional Manga (Right to Left)"
                >
                  RTL
                </button>
                <button
                  onClick={() => setReadingMode('paged-ltr')}
                  className={`py-1 rounded-lg text-[11px] font-semibold transition ${
                    readingMode === 'paged-ltr' ? 'bg-[#FF9F1C] text-[#0E0A14] shadow-sm' : 'text-[#A79FC0]'
                  }`}
                  title="Comic (Left to Right)"
                >
                  LTR
                </button>
              </div>
            </div>

            {/* Fit Mode */}
            <div>
              <span className="block text-[#A79FC0] light:text-[#6E6288] mb-1.5 font-medium">
                Image Fit
              </span>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#0E0A14] light:bg-[#F3EEFC]">
                {(['width', 'height', 'original'] as const).map((fit) => (
                  <button
                    key={fit}
                    onClick={() => setFitMode(fit)}
                    className={`py-1 rounded-lg text-[11px] capitalize font-semibold transition ${
                      fitMode === fit ? 'bg-[#FF4D6D] text-white shadow-sm' : 'text-[#A79FC0]'
                    }`}
                  >
                    {fit}
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom Controls */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[#A79FC0] light:text-[#6E6288] font-medium">Zoom</span>
                <span className="font-mono-meta font-bold text-[#FF9F1C]">{zoom}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom((z) => Math.max(50, z - 10))}
                  className="p-1.5 rounded-lg bg-[#0E0A14] hover:bg-[#1F1830] text-[#A79FC0]"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-[#FF4D6D]"
                />
                <button
                  onClick={() => setZoom((z) => Math.min(150, z + 10))}
                  className="p-1.5 rounded-lg bg-[#0E0A14] hover:bg-[#1F1830] text-[#A79FC0]"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoom(100)}
                  className="p-1.5 rounded-lg bg-[#0E0A14] hover:bg-[#1F1830] text-[#A79FC0]"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* True Black OLED Toggle */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[#A79FC0] light:text-[#6E6288] font-medium">
                True Black OLED (#000)
              </span>
              <button
                onClick={() => setDarkReaderMode((prev) => !prev)}
                className={`w-10 h-5 rounded-full transition p-0.5 ${
                  darkReaderMode ? 'bg-[#FF4D6D]' : 'bg-[#2C2340]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    darkReaderMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Comic Viewer Area */}
      <main
        ref={scrollContainerRef}
        onClick={() => setControlsVisible(!controlsVisible)}
        className="pt-16 pb-24 flex flex-col items-center justify-center min-h-[80vh] cursor-pointer"
      >
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-[#FF4D6D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs text-[#A79FC0] font-mono-meta">Rendering chapter content...</p>
          </div>
        ) : currentChapter?.textContent ? (
          /* Serialized Novel Story Reader */
          <div
            className={`w-full max-w-3xl mx-auto px-4 sm:px-8 py-8 rounded-3xl transition-colors duration-300 ${
              novelTheme === 'sepia'
                ? 'bg-[#FBF0D9] text-[#2C2216]'
                : novelTheme === 'black'
                ? 'bg-black text-[#E0D8F0]'
                : 'bg-[#171122] text-[#F5F1FF] border border-[#2C2340]'
            }`}
            style={{ fontSize: `${novelFontSize}px` }}
          >
            {/* Novel Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-6 mb-8 border-b border-current/20">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-mono-meta opacity-70">
                  {series?.title} • Chapter {currentChNum}
                </span>
                <h1 className="text-xl sm:text-2xl font-black font-heading mt-1">
                  {currentChapter.title || `Chapter ${currentChNum}`}
                </h1>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {/* Font Size Adjust */}
                <div className="flex items-center rounded-xl bg-black/20 p-1 border border-current/20">
                  <button
                    onClick={() => setNovelFontSize((s) => Math.max(14, s - 2))}
                    className="px-2.5 py-1 font-bold rounded-lg hover:bg-black/20"
                    title="Smaller Text"
                  >
                    A-
                  </button>
                  <span className="px-2 font-mono-meta font-bold">{novelFontSize}px</span>
                  <button
                    onClick={() => setNovelFontSize((s) => Math.min(28, s + 2))}
                    className="px-2.5 py-1 font-bold rounded-lg hover:bg-black/20"
                    title="Larger Text"
                  >
                    A+
                  </button>
                </div>

                {/* Theme Selector */}
                <div className="flex items-center rounded-xl bg-black/20 p-1 border border-current/20">
                  <button
                    onClick={() => setNovelTheme('plum')}
                    className={`w-6 h-6 rounded-lg bg-[#171122] border ${
                      novelTheme === 'plum' ? 'border-[#FF4D6D] ring-2 ring-[#FF4D6D]/40' : 'border-transparent'
                    }`}
                    title="Dark Plum Theme"
                  />
                  <button
                    onClick={() => setNovelTheme('sepia')}
                    className={`w-6 h-6 rounded-lg bg-[#FBF0D9] ml-1.5 border ${
                      novelTheme === 'sepia' ? 'border-[#FF9F1C] ring-2 ring-[#FF9F1C]/40' : 'border-transparent'
                    }`}
                    title="Sepia Paper Theme"
                  />
                  <button
                    onClick={() => setNovelTheme('black')}
                    className={`w-6 h-6 rounded-lg bg-black ml-1.5 border ${
                      novelTheme === 'black' ? 'border-white ring-2 ring-white/40' : 'border-transparent'
                    }`}
                    title="Pitch Black Theme"
                  />
                </div>
              </div>
            </div>

            {/* Prose Content */}
            <div className="prose max-w-none leading-relaxed space-y-6 whitespace-pre-wrap font-serif">
              {currentChapter.textContent}
            </div>
          </div>
        ) : readingMode === 'webtoon' ? (
          /* Webtoon Continuous Scroll View */
          <div
            className="w-full flex flex-col items-center"
            style={{
              maxWidth: fitMode === 'original' ? '760px' : fitMode === 'height' ? '640px' : '820px',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {pages.map((p) => (
              <ComicPanelRenderer
                key={p.pageNumber}
                page={p}
                seriesTitle={series?.title || 'Manga'}
                fitMode={fitMode}
              />
            ))}
          </div>
        ) : (
          /* Single Page View (Paged LTR or RTL) */
          <div
            className="w-full flex flex-col items-center justify-center max-w-2xl px-2"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {pages[currentPageIndex] && (
              <ComicPanelRenderer
                page={pages[currentPageIndex]}
                seriesTitle={series?.title || 'Manga'}
                fitMode={fitMode}
              />
            )}

            {/* Paged mode bottom page indicator */}
            <div className="mt-4 px-4 py-1.5 rounded-full bg-[#171122]/90 light:bg-white/90 border border-[#2C2340] text-xs font-mono-meta font-bold shadow-md">
              Page {currentPageIndex + 1} of {pages.length}
            </div>
          </div>
        )}

        {/* End of Chapter Card & Next Chapter Gateway */}
        {!loading && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl mx-auto mt-12 p-6 rounded-3xl bg-[#171122] border border-[#2C2340] light:bg-white light:border-[#E2D9F3] text-center shadow-2xl space-y-4 cursor-default"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center text-white mx-auto shadow-lg">
              <CheckCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-black font-heading text-[#F5F1FF] light:text-[#1A1429]">
                Chapter {currentChNum} Complete!
              </h3>
              <p className="text-xs text-[#A79FC0] light:text-[#6E6288] mt-1">
                You've reached the end of this chapter.
              </p>
            </div>

            {/* Actions: Next Chapter, Like, Share */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {nextChapterAvailable ? (
                <button
                  onClick={() => goToChapter(currentChNum + 1)}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-brand text-white font-heading font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-[#FF4D6D]/20 hover:opacity-95 active:scale-95 transition"
                >
                  <span>Next: Chapter {currentChNum + 1}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="px-4 py-2 rounded-2xl bg-[#1F1830] light:bg-[#F3EEFC] text-xs font-semibold text-[#FF9F1C]">
                  ✨ You're all caught up! Check back soon for new releases.
                </div>
              )}

              <button
                onClick={handleChapterLike}
                disabled={hasLikedChapter}
                className={`px-4 py-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                  hasLikedChapter
                    ? 'bg-[#FF4D6D] text-white border-[#FF4D6D]'
                    : 'bg-[#1F1830] text-[#F5F1FF] hover:text-white light:bg-[#F3EEFC] light:text-[#1A1429] border-[#2C2340] light:border-[#E2D9F3]'
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${hasLikedChapter ? 'fill-current' : ''}`} />
                <span>{hasLikedChapter ? 'Liked!' : 'Like Chapter'}</span>
              </button>
            </div>

            {/* Quick Chapter Review / Comment Box */}
            <form onSubmit={handlePostChapterComment} className="pt-3 border-t border-[#2C2340]/60 light:border-[#E2D9F3]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chapterComment}
                  onChange={(e) => setChapterComment(e.target.value)}
                  placeholder="Leave a quick reaction to this chapter..."
                  className="flex-1 py-2 px-3 rounded-xl text-xs bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] focus:outline-none focus:border-[#FF4D6D]"
                />
                <button
                  type="submit"
                  disabled={!chapterComment.trim()}
                  className="py-2 px-4 rounded-xl bg-gradient-brand text-white text-xs font-bold font-heading disabled:opacity-40"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Floating / Sticky Bottom Controls Bar */}
      <footer
        className={`fixed bottom-0 left-0 right-0 z-40 bg-[#0E0A14]/95 light:bg-white/95 backdrop-blur-md border-t border-[#2C2340] light:border-[#E2D9F3] transition-transform duration-300 ${
          controlsVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Previous Chapter Button */}
          <button
            onClick={() => prevChapterAvailable && goToChapter(currentChNum - 1)}
            disabled={!prevChapterAvailable}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#171122] hover:bg-[#1F1830] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] disabled:opacity-30 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev Ch.</span>
          </button>

          {/* Center Page Progress Indicator & Paged navigation */}
          <div className="flex items-center gap-2 text-xs font-mono-meta font-semibold">
            {readingMode !== 'webtoon' && (
              <button
                onClick={prevPage}
                disabled={currentPageIndex === 0}
                className="p-1 rounded-lg hover:bg-[#1F1830] disabled:opacity-30"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <span>
              Page {readingMode === 'webtoon' ? '1' : currentPageIndex + 1} / {pages.length}
            </span>

            {readingMode !== 'webtoon' && (
              <button
                onClick={nextPage}
                disabled={currentPageIndex === pages.length - 1}
                className="p-1 rounded-lg hover:bg-[#1F1830] disabled:opacity-30"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Next Chapter Button */}
          <button
            onClick={() => nextChapterAvailable && goToChapter(currentChNum + 1)}
            disabled={!nextChapterAvailable}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-brand text-white shadow-md disabled:opacity-30 transition"
          >
            <span className="hidden sm:inline">Next Ch.</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
};

/**
 * Comic Panel Renderer:
 * Dynamically constructs high-resolution vector comic art with stylized panels,
 * dramatic perspective lines, speech bubbles, and sound effects.
 */
interface PanelRendererProps {
  page: ChapterPage;
  seriesTitle: string;
  fitMode: 'width' | 'height' | 'original';
}

const ComicPanelRenderer: React.FC<PanelRendererProps> = ({ page, seriesTitle, fitMode }) => {
  if (page.imageUrl) {
    return (
      <div className="w-full my-2 relative flex justify-center">
        <img
          src={page.imageUrl}
          alt={`${seriesTitle} - Page ${page.pageNumber}`}
          className="w-full h-auto object-contain rounded-xl shadow-2xl border border-[#2C2340]/60 light:border-[#E2D9F3]"
          style={{
            maxHeight: fitMode === 'height' ? '84vh' : 'none',
          }}
          loading="lazy"
        />
      </div>
    );
  }

  const themeGradients = {
    'violet-noir': { bg: ['#171122', '#0E0A14'], accent: '#8B5CFF', sfx: '#FF4D6D' },
    'crimson-fire': { bg: ['#280A15', '#0E0A14'], accent: '#FF4D6D', sfx: '#FF9F1C' },
    'golden-dawn': { bg: ['#251A08', '#0E0A14'], accent: '#FF9F1C', sfx: '#8B5CFF' },
    'cyber-neon': { bg: ['#0A1A24', '#0E0A14'], accent: '#00B4D8', sfx: '#FF4D6D' },
    'mystic-forest': { bg: ['#0A2016', '#0E0A14'], accent: '#2EC4B6', sfx: '#FF9F1C' },
  };

  const currentTheme =
    (page.paletteTheme && themeGradients[page.paletteTheme as keyof typeof themeGradients]) ||
    themeGradients['violet-noir'];

  return (
    <div className="w-full my-2 relative transition-all duration-300">
      <svg
        viewBox="0 0 800 1150"
        className="w-full h-auto rounded-xl shadow-2xl border border-[#2C2340]/60 light:border-[#E2D9F3]"
        style={{
          maxHeight: fitMode === 'height' ? '82vh' : 'none',
        }}
      >
        <defs>
          <linearGradient id={`grad-${page.pageNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={currentTheme.bg[0]} />
            <stop offset="100%" stopColor={currentTheme.bg[1]} />
          </linearGradient>

          <pattern id={`screentone-${page.pageNumber}`} width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#FFFFFF" opacity="0.08" />
          </pattern>
        </defs>

        {/* Outer Panel Border */}
        <rect x="0" y="0" width="800" height="1150" fill={`url(#grad-${page.pageNumber})`} />
        <rect x="0" y="0" width="800" height="1150" fill={`url(#screentone-${page.pageNumber})`} />

        {/* Comic Panels depending on layout */}
        {page.panelLayout === 'action-split' ? (
          <>
            {/* Top Action Panel */}
            <g transform="translate(30, 30)">
              <rect x="0" y="0" width="740" height="500" rx="8" fill="#1F1830" stroke="#2C2340" strokeWidth="3" />
              {/* Dynamic perspective speed lines */}
              <line x1="0" y1="0" x2="370" y2="250" stroke={currentTheme.accent} strokeWidth="2" opacity="0.4" />
              <line x1="740" y1="0" x2="370" y2="250" stroke={currentTheme.accent} strokeWidth="2" opacity="0.4" />
              <line x1="0" y1="500" x2="370" y2="250" stroke={currentTheme.accent} strokeWidth="2" opacity="0.4" />
              <line x1="740" y1="500" x2="370" y2="250" stroke={currentTheme.accent} strokeWidth="2" opacity="0.4" />

              {/* Action Silhouette */}
              <path
                d="M370 140L330 290L370 270L410 290Z"
                fill={currentTheme.accent}
                opacity="0.85"
              />
              <circle cx="370" cy="130" r="28" fill={currentTheme.accent} />
              {/* Energy Slash */}
              <path
                d="M120 400Q370 200 620 100"
                stroke={currentTheme.sfx}
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.9"
              />
            </g>

            {/* Bottom Split Panels */}
            <g transform="translate(30, 560)">
              <rect x="0" y="0" width="355" height="520" rx="8" fill="#171122" stroke="#2C2340" strokeWidth="3" />
              <rect x="385" y="0" width="355" height="520" rx="8" fill="#171122" stroke="#2C2340" strokeWidth="3" />
            </g>
          </>
        ) : (
          /* Full Splash or Dialogue Focus */
          <g transform="translate(30, 30)">
            <rect x="0" y="0" width="740" height="1060" rx="12" fill="#171122" stroke="#2C2340" strokeWidth="3" />
            {/* Cinematic aura background */}
            <circle cx="370" cy="530" r="240" fill={currentTheme.accent} opacity="0.12" />
            {/* Manga Character Silhouette */}
            <path
              d="M370 420L310 700H430Z"
              fill={currentTheme.accent}
              opacity="0.5"
            />
            <circle cx="370" cy="380" r="44" fill={currentTheme.accent} opacity="0.8" />
          </g>
        )}

        {/* Bold Sound Effect (SFX) */}
        {page.soundEffect && (
          <g transform="translate(400, 310)">
            <text
              x="0"
              y="0"
              fontFamily="'Sora', sans-serif"
              fontWeight="900"
              fontSize="48"
              fill={currentTheme.sfx}
              stroke="#0E0A14"
              strokeWidth="6"
              paintOrder="stroke fill"
              textAnchor="middle"
              transform="rotate(-8)"
              className="drop-shadow-lg"
            >
              {page.soundEffect}
            </text>
          </g>
        )}

        {/* Dialogue Speech Bubbles */}
        {page.dialogue &&
          page.dialogue.map((dlg, idx) => {
            const posY = 140 + idx * 280;
            const posX = idx % 2 === 0 ? 160 : 540;

            return (
              <g key={idx} transform={`translate(${posX}, ${posY})`}>
                {/* Bubble Shape */}
                <rect
                  x="-120"
                  y="-35"
                  width="240"
                  height="70"
                  rx="35"
                  fill="#FAF7FF"
                  stroke="#2C2340"
                  strokeWidth="3"
                  filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
                />
                {/* Bubble tail */}
                <polygon points="0,35 -15,55 10,35" fill="#FAF7FF" stroke="#2C2340" strokeWidth="2" />

                <text
                  x="0"
                  y="5"
                  fontFamily="'Inter', sans-serif"
                  fontWeight="700"
                  fontSize="13"
                  fill="#0E0A14"
                  textAnchor="middle"
                >
                  {dlg}
                </text>
              </g>
            );
          })}

        {/* Page Footer Watermark */}
        <text
          x="750"
          y="1120"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="12"
          fill="#A79FC0"
          opacity="0.6"
          textAnchor="end"
        >
          {seriesTitle} • Page {page.pageNumber} • Manga24.xyz
        </text>
      </svg>
    </div>
  );
};
