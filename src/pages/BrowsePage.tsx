import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Series, FilterOptions, SeriesType, PublicationStatus, Demographic, ContentRating, ALL_GENRES } from '../types';
import { SeriesCard } from '../components/SeriesCard';
import {
  Search,
  Filter,
  Grid,
  List as ListIcon,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Star,
  Clock,
  BookOpen,
  Bookmark,
  Check,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const BrowsePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { library, toggleBookmark } = useAppStore();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedTypes, setSelectedTypes] = useState<SeriesType[]>(() => {
    const t = searchParams.get('type');
    return t ? [t as SeriesType] : [];
  });
  const [selectedStatuses, setSelectedStatuses] = useState<PublicationStatus[]>(() => {
    const s = searchParams.get('status');
    return s ? [s as PublicationStatus] : [];
  });
  const [selectedDemographics, setSelectedDemographics] = useState<Demographic[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<ContentRating[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(() => {
    const g = searchParams.get('genre');
    return g ? [g] : [];
  });
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<FilterOptions['sortBy']>(
    (searchParams.get('sort') as FilterOptions['sortBy']) || 'popular'
  );
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Sync URL params when searchParams change externally (e.g. from navbar)
  useEffect(() => {
    const qParam = searchParams.get('q');
    if (qParam !== null && qParam !== query) {
      setQuery(qParam);
    }
    const tParam = searchParams.get('type');
    if (tParam) {
      setSelectedTypes([tParam as SeriesType]);
    }
    const gParam = searchParams.get('genre');
    if (gParam) {
      setSelectedGenres([gParam]);
    }
    const sParam = searchParams.get('sort');
    if (sParam) {
      setSortBy(sParam as any);
    }
  }, [searchParams]);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const filters: FilterOptions = {
          query,
          types: selectedTypes,
          statuses: selectedStatuses,
          demographics: selectedDemographics,
          contentRatings: selectedRatings,
          genres: selectedGenres,
          year: selectedYear,
          sortBy,
          page,
          limit: 16,
        };

        const result = await api.getSeries(filters);
        setSeriesList(result.items);
        setTotalItems(result.total);
        setTotalPages(result.totalPages);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchData();
    }, 150);

    return () => clearTimeout(timer);
  }, [
    query,
    selectedTypes,
    selectedStatuses,
    selectedDemographics,
    selectedRatings,
    selectedGenres,
    selectedYear,
    sortBy,
    page,
  ]);

  const toggleType = (t: SeriesType) => {
    setPage(1);
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    );
  };

  const toggleStatus = (s: PublicationStatus) => {
    setPage(1);
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s]
    );
  };

  const toggleGenre = (genre: string) => {
    setPage(1);
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const resetFilters = () => {
    setQuery('');
    setSelectedTypes([]);
    setSelectedStatuses([]);
    setSelectedDemographics([]);
    setSelectedRatings([]);
    setSelectedGenres([]);
    setSelectedYear(undefined);
    setSortBy('popular');
    setPage(1);
    setSearchParams({});
  };

  const activeFiltersCount =
    selectedTypes.length +
    selectedStatuses.length +
    selectedDemographics.length +
    selectedRatings.length +
    selectedGenres.length +
    (selectedYear ? 1 : 0) +
    (query ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-[#F5F1FF] light:text-[#1A1429]">
            Browse Catalog
          </h1>
          <p className="text-xs sm:text-sm text-[#A79FC0] light:text-[#6E6288] mt-1">
            Explore 40+ original titles across manga, manhwa, manhua, and webtoons
          </p>
        </div>

        {/* View Toggle & Filter Button */}
        <div className="flex items-center gap-2">
          {/* Filter toggle on mobile */}
          <button
            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
              filterPanelOpen || activeFiltersCount > 0
                ? 'bg-gradient-brand text-white border-transparent shadow-md'
                : 'bg-[#171122] light:bg-white border-[#2C2340] light:border-[#E2D9F3] text-[#F5F1FF] light:text-[#1A1429]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
          </button>

          {/* Grid / List switch */}
          <div className="flex items-center p-1 rounded-xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-[#1F1830] text-[#FF4D6D] light:bg-[#F3EEFC]'
                  : 'text-[#A79FC0] hover:text-white light:text-[#6E6288]'
              }`}
              aria-label="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-[#1F1830] text-[#FF4D6D] light:bg-[#F3EEFC]'
                  : 'text-[#A79FC0] hover:text-white light:text-[#6E6288]'
              }`}
              aria-label="List view"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#171122] border border-[#2C2340] light:bg-white light:border-[#E2D9F3] shadow-lg mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Query input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#A79FC0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by series title, author, or keyword..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] focus:outline-none focus:border-[#FF4D6D] transition"
            />
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#A79FC0] light:text-[#6E6288] shrink-0">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setPage(1);
              }}
              className="py-2 px-3 rounded-xl text-xs sm:text-sm bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] focus:outline-none focus:border-[#FF4D6D] text-[#F5F1FF] light:text-[#1A1429] cursor-pointer"
            >
              <option value="popular">Most Popular</option>
              <option value="latest">Latest Chapter</option>
              <option value="rating">Top Rated</option>
              <option value="az">Title (A - Z)</option>
              <option value="chapters">Most Chapters</option>
            </select>

            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="p-2 rounded-xl bg-[#1F1830] hover:bg-[#2C2340] light:bg-[#F3EEFC] light:hover:bg-[#E2D9F3] text-[#FF4D6D] transition flex items-center gap-1 text-xs font-semibold"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Type & Status Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-[#2C2340]/60 light:border-[#E2D9F3]">
          <span className="text-xs text-[#A79FC0] light:text-[#6E6288] font-mono-meta mr-1">
            Type:
          </span>
          {(['Manga', 'Manhwa', 'Manhua', 'Webtoon'] as SeriesType[]).map((t) => (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedTypes.includes(t)
                  ? 'bg-[#FF4D6D] text-white shadow-sm'
                  : 'bg-[#0E0A14] hover:bg-[#1F1830] light:bg-[#F3EEFC] light:hover:bg-[#E2D9F3] text-[#A79FC0] light:text-[#6E6288]'
              }`}
            >
              {t}
            </button>
          ))}

          <div className="h-4 w-px bg-[#2C2340] light:bg-[#E2D9F3] mx-1 hidden sm:block" />

          <span className="text-xs text-[#A79FC0] light:text-[#6E6288] font-mono-meta mr-1">
            Status:
          </span>
          {(['Ongoing', 'Completed', 'Hiatus'] as PublicationStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedStatuses.includes(s)
                  ? 'bg-[#8B5CFF] text-white shadow-sm'
                  : 'bg-[#0E0A14] hover:bg-[#1F1830] light:bg-[#F3EEFC] light:hover:bg-[#E2D9F3] text-[#A79FC0] light:text-[#6E6288]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Expanded Filters Accordion (Genres, Demographics, Content Rating) */}
        {filterPanelOpen && (
          <div className="pt-4 mt-4 border-t border-[#2C2340]/60 light:border-[#E2D9F3] space-y-4 animate-in fade-in">
            {/* Multi-select Genres */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-heading text-[#F5F1FF] light:text-[#1A1429]">
                  Genres ({selectedGenres.length} selected)
                </span>
                {selectedGenres.length > 0 && (
                  <button
                    onClick={() => setSelectedGenres([])}
                    className="text-[11px] text-[#FF9F1C] hover:underline"
                  >
                    Clear genres
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {ALL_GENRES.map((g: string) => {
                  const isSelected = selectedGenres.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => toggleGenre(g)}
                      className={`px-2.5 py-1 rounded-lg text-xs transition flex items-center gap-1 ${
                        isSelected
                          ? 'bg-[#FF9F1C] text-[#0E0A14] font-bold shadow-sm'
                          : 'bg-[#0E0A14] hover:bg-[#1F1830] light:bg-[#F3EEFC] light:hover:bg-[#E2D9F3] text-[#A79FC0] light:text-[#6E6288]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{g}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Demographics & Content Rating */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Demographics */}
              <div>
                <span className="block text-xs font-bold font-heading text-[#F5F1FF] light:text-[#1A1429] mb-2">
                  Demographic
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(['Shounen', 'Seinen', 'Shoujo', 'Josei'] as Demographic[]).map((d) => (
                    <button
                      key={d}
                      onClick={() =>
                        setSelectedDemographics((prev) =>
                          prev.includes(d) ? prev.filter((item) => item !== d) : [...prev, d]
                        )
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs transition ${
                        selectedDemographics.includes(d)
                          ? 'bg-[#FF4D6D] text-white font-semibold'
                          : 'bg-[#0E0A14] light:bg-[#F3EEFC] text-[#A79FC0] light:text-[#6E6288]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Rating */}
              <div>
                <span className="block text-xs font-bold font-heading text-[#F5F1FF] light:text-[#1A1429] mb-2">
                  Content Rating
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(['Safe', 'Suggestive', 'Mature'] as ContentRating[]).map((r) => (
                    <button
                      key={r}
                      onClick={() =>
                        setSelectedRatings((prev) =>
                          prev.includes(r) ? prev.filter((item) => item !== r) : [...prev, r]
                        )
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs transition ${
                        selectedRatings.includes(r)
                          ? 'bg-[#8B5CFF] text-white font-semibold'
                          : 'bg-[#0E0A14] light:bg-[#F3EEFC] text-[#A79FC0] light:text-[#6E6288]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Results Summary */}
      <div className="flex items-center justify-between mb-4 px-1 text-xs text-[#A79FC0] light:text-[#6E6288]">
        <span>
          Showing <strong className="text-[#F5F1FF] light:text-[#1A1429]">{seriesList.length}</strong> of{' '}
          <strong className="text-[#F5F1FF] light:text-[#1A1429]">{totalItems}</strong> titles
        </span>
        <span>
          Page {page} of {totalPages}
        </span>
      </div>

      {/* Main Results View */}
      {seriesList.length === 0 && !loading ? (
        <div className="py-16 text-center rounded-3xl bg-[#171122] border border-[#2C2340] light:bg-white light:border-[#E2D9F3] p-6">
          <p className="text-base font-bold font-heading text-[#F5F1FF] light:text-[#1A1429] mb-1">
            No series match your search filters
          </p>
          <p className="text-xs text-[#A79FC0] light:text-[#6E6288] mb-4">
            Try loosening the selected genres or clearing your search keywords.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-gradient-brand text-white text-xs font-bold font-heading shadow-md"
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-5">
          {seriesList.map((s) => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {seriesList.map((s) => {
            const isBookmarked = !!library[s.id]?.isBookmarked;
            return (
              <div
                key={s.id}
                className="p-3 sm:p-4 rounded-2xl bg-[#171122] border border-[#2C2340] light:bg-white light:border-[#E2D9F3] flex items-center gap-4 hover:border-[#FF4D6D]/50 transition group"
              >
                <a href={`/series/${s.id}`} className="shrink-0 w-16 sm:w-20 aspect-[2/3] rounded-xl overflow-hidden bg-[#0E0A14]">
                  <img src={s.coverUrl || s.coverImage} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                </a>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono-meta font-bold px-2 py-0.5 rounded bg-[#8B5CFF]/20 text-[#8B5CFF]">
                      {s.type}
                    </span>
                    <span className="text-[10px] font-mono-meta text-[#A79FC0] light:text-[#6E6288]">
                      {s.status}
                    </span>
                  </div>

                  <a
                    href={`/series/${s.id}`}
                    className="block font-bold font-heading text-sm sm:text-base truncate text-[#F5F1FF] light:text-[#1A1429] group-hover:text-[#FF4D6D] transition"
                  >
                    {s.title}
                  </a>

                  <p className="text-xs text-[#A79FC0] light:text-[#6E6288] line-clamp-2 mt-1 hidden sm:block">
                    {s.synopsis}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs text-[#A79FC0] light:text-[#6E6288] font-mono-meta">
                    <span className="flex items-center gap-1 text-[#FF9F1C]">
                      <Star className="w-3.5 h-3.5 fill-[#FF9F1C]" />
                      <strong>{s.rating.toFixed(2)}</strong>
                    </span>
                    <span>•</span>
                    <span className="text-[#FF9F1C] font-semibold">Ch. {s.latestChapterNumber}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {s.latestUpdateDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleBookmark(s.id)}
                    className={`p-2 rounded-xl border transition ${
                      isBookmarked
                        ? 'bg-[#FF4D6D] text-white border-[#FF4D6D]'
                        : 'bg-[#1F1830] text-[#A79FC0] hover:text-white light:bg-[#F3EEFC] border-[#2C2340] light:border-[#E2D9F3]'
                    }`}
                    title={isBookmarked ? 'Bookmarked' : 'Add to library'}
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                  </button>

                  <a
                    href={`/series/${s.id}/chapter/1`}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-brand text-white font-heading font-bold text-xs shadow-md"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Read</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] text-[#F5F1FF] light:text-[#1A1429] disabled:opacity-40 transition shadow-sm"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl text-xs font-bold font-heading transition ${
                p === page
                  ? 'bg-gradient-brand text-white shadow-md'
                  : 'bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] text-[#A79FC0] light:text-[#6E6288]'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-xl bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] text-[#F5F1FF] light:text-[#1A1429] disabled:opacity-40 transition shadow-sm"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
