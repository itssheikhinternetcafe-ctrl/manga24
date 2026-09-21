import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { Series, ReadingStatus } from '../types';
import { SeriesCard } from '../components/SeriesCard';
import { MascotIllustration } from '../components/MascotIllustration';
import {
  Bookmark,
  Clock,
  Layers,
  Settings as SettingsIcon,
  Trash2,
  Plus,
  Play,
  Download,
  Upload,
  BookOpen,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const LibraryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    library,
    readingHistory,
    collections,
    createCollection,
    readingMode,
    setReadingMode,
    user,
    updateProfile,
    showToast,
  } = useAppStore();

  const activeTabParam = searchParams.get('tab') || 'reading';
  const [activeTab, setActiveTab] = useState(activeTabParam);
  const [newCollectionModal, setNewCollectionModal] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [collectionDesc, setCollectionDesc] = useState('');

  const [allSeries, setAllSeries] = useState<Series[]>([]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    api.getSeries({ limit: 100 }).then((res) => {
      setAllSeries(res.items || []);
    });
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Organize library series
  const librarySeriesMap = new Map<string, Series>();
  allSeries.forEach((s) => librarySeriesMap.set(s.id, s));

  const getSeriesByStatus = (status: ReadingStatus) => {
    return Object.values(library)
      .filter((item) => item.status === status)
      .map((item) => librarySeriesMap.get(item.seriesId))
      .filter(Boolean) as Series[];
  };

  const readingList = getSeriesByStatus('Reading');
  const planToReadList = getSeriesByStatus('Plan to Read');
  const completedList = getSeriesByStatus('Completed');
  const droppedList = getSeriesByStatus('Dropped');

  // History entries
  const historyEntries = Object.values(readingHistory).map((entry) => ({
    entry,
    series: librarySeriesMap.get(entry.seriesId),
  })).filter((item) => !!item.series);

  // Export data as JSON
  const handleExportData = () => {
    const backup = {
      library,
      readingHistory,
      collections,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manhwa24-backup-${Date.now()}.json`;
    a.click();
    showToast('Export Complete', 'Library and history data downloaded as JSON.', 'success');
  };

  // Import mock restore
  const handleImportData = () => {
    showToast('Import Ready', 'Select a Manhwa24 JSON backup to restore.', 'info');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-[#F5F1FF] light:text-[#1A1429]">
            My Library & Bookmarks
          </h1>
          <p className="text-xs sm:text-sm text-[#A79FC0] light:text-[#6E6288] mt-1">
            Keep track of your reading progress, custom reading lists, and bookmarks 24/7
          </p>
        </div>

        {/* Quick Data Sync Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5 text-[#FF9F1C]" />
            <span>Export Backup</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 border-b border-[#2C2340]/60 light:border-[#E2D9F3] mb-6">
        <button
          onClick={() => handleTabChange('reading')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-heading flex items-center gap-2 shrink-0 transition ${
            activeTab === 'reading'
              ? 'bg-gradient-brand text-white shadow-md'
              : 'bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#F3EEFC] text-[#A79FC0] light:text-[#6E6288]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Reading ({readingList.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('plan')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-heading flex items-center gap-2 shrink-0 transition ${
            activeTab === 'plan'
              ? 'bg-gradient-brand text-white shadow-md'
              : 'bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#F3EEFC] text-[#A79FC0] light:text-[#6E6288]'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Plan to Read ({planToReadList.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-heading flex items-center gap-2 shrink-0 transition ${
            activeTab === 'completed'
              ? 'bg-gradient-brand text-white shadow-md'
              : 'bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#F3EEFC] text-[#A79FC0] light:text-[#6E6288]'
          }`}
        >
          <span>Completed ({completedList.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('dropped')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-heading flex items-center gap-2 shrink-0 transition ${
            activeTab === 'dropped'
              ? 'bg-gradient-brand text-white shadow-md'
              : 'bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#F3EEFC] text-[#A79FC0] light:text-[#6E6288]'
          }`}
        >
          <span>Dropped ({droppedList.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-heading flex items-center gap-2 shrink-0 transition ${
            activeTab === 'history'
              ? 'bg-gradient-brand text-white shadow-md'
              : 'bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#F3EEFC] text-[#A79FC0] light:text-[#6E6288]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>History ({historyEntries.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('collections')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-heading flex items-center gap-2 shrink-0 transition ${
            activeTab === 'collections'
              ? 'bg-gradient-brand text-white shadow-md'
              : 'bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#F3EEFC] text-[#A79FC0] light:text-[#6E6288]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Collections ({collections.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-heading flex items-center gap-2 shrink-0 transition ${
            activeTab === 'settings'
              ? 'bg-gradient-brand text-white shadow-md'
              : 'bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#F3EEFC] text-[#A79FC0] light:text-[#6E6288]'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>Preferences</span>
        </button>
      </div>

      {/* Reading Tab */}
      {activeTab === 'reading' && (
        <div>
          {readingList.length === 0 ? (
            <EmptyLibraryState tabName="Currently Reading" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {readingList.map((s) => (
                <SeriesCard key={s.id} series={s} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Plan to Read Tab */}
      {activeTab === 'plan' && (
        <div>
          {planToReadList.length === 0 ? (
            <EmptyLibraryState tabName="Plan to Read" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {planToReadList.map((s) => (
                <SeriesCard key={s.id} series={s} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Completed Tab */}
      {activeTab === 'completed' && (
        <div>
          {completedList.length === 0 ? (
            <EmptyLibraryState tabName="Completed" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {completedList.map((s) => (
                <SeriesCard key={s.id} series={s} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dropped Tab */}
      {activeTab === 'dropped' && (
        <div>
          {droppedList.length === 0 ? (
            <EmptyLibraryState tabName="Dropped" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {droppedList.map((s) => (
                <SeriesCard key={s.id} series={s} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reading History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs text-[#A79FC0] light:text-[#6E6288]">
              Recently opened chapters saved locally on your device
            </span>
          </div>

          {historyEntries.length === 0 ? (
            <EmptyLibraryState tabName="Reading History" />
          ) : (
            <div className="space-y-3">
              {historyEntries.map(({ entry, series }) => {
                if (!series) return null;
                return (
                  <div
                    key={series.id}
                    className="p-3 sm:p-4 rounded-2xl bg-[#171122] border border-[#2C2340] light:bg-white light:border-[#E2D9F3] flex items-center gap-4 hover:border-[#FF4D6D]/40 transition group"
                  >
                    <Link to={`/series/${series.id}`} className="shrink-0 w-14 sm:w-16 aspect-[2/3] rounded-xl overflow-hidden bg-[#0E0A14]">
                      <img src={series.coverImage} alt={series.title} className="w-full h-full object-cover" />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/series/${series.id}`}
                        className="font-bold font-heading text-sm sm:text-base text-[#F5F1FF] light:text-[#1A1429] hover:text-[#FF4D6D] transition truncate block"
                      >
                        {series.title}
                      </Link>

                      <p className="text-xs text-[#A79FC0] light:text-[#6E6288] mt-0.5">
                        Chapter {entry.chapterNumber} • {entry.lastReadAt}
                      </p>

                      {/* Progress bar */}
                      <div className="mt-2 w-full max-w-md h-1.5 rounded-full bg-[#0E0A14] light:bg-[#E2D9F3] overflow-hidden">
                        <div
                          className="h-full bg-gradient-brand rounded-full transition-all"
                          style={{ width: `${entry.percentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`/series/${series.id}/chapter/${entry.chapterNumber}`}
                        className="py-2 px-4 rounded-xl bg-gradient-brand text-white font-heading font-bold text-xs flex items-center gap-1.5 shadow-md hover:opacity-90 active:scale-95 transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span className="hidden sm:inline">Continue Ch. {entry.chapterNumber}</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Custom Collections Tab */}
      {activeTab === 'collections' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-heading">Your Custom Lists</h3>
              <p className="text-xs text-[#A79FC0] light:text-[#6E6288]">
                Group series into themed shelves and collections
              </p>
            </div>
            <button
              onClick={() => setNewCollectionModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-brand text-white text-xs font-bold font-heading shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>New Collection</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((col) => (
              <div
                key={col.id}
                className="p-5 rounded-2xl bg-[#171122] border border-[#2C2340] light:bg-white light:border-[#E2D9F3] flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono-meta px-2 py-0.5 rounded-full bg-[#8B5CFF]/20 text-[#8B5CFF]">
                      {col.seriesIds.length} titles
                    </span>
                    <span className="text-[10px] text-[#A79FC0] font-mono-meta">
                      {col.updatedAt}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold font-heading text-[#F5F1FF] light:text-[#1A1429]">
                    {col.name}
                  </h4>
                  <p className="text-xs text-[#A79FC0] light:text-[#6E6288] mt-1 line-clamp-2">
                    {col.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#2C2340]/60 light:border-[#E2D9F3] flex items-center justify-between">
                  <span className="text-xs text-[#A79FC0] light:text-[#6E6288]">
                    By {col.ownerName}
                  </span>
                  <Link
                    to={`/browse?q=${encodeURIComponent(col.name)}`}
                    className="text-xs font-bold text-[#FF9F1C] hover:underline"
                  >
                    View Titles →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preferences / Settings Tab */}
      {activeTab === 'settings' && (
        <div className="max-w-xl mx-auto p-6 rounded-3xl bg-[#171122] border border-[#2C2340] light:bg-white light:border-[#E2D9F3] shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold font-heading text-[#F5F1FF] light:text-[#1A1429]">
              Reader & Application Preferences
            </h3>
            <p className="text-xs text-[#A79FC0] light:text-[#6E6288] mt-0.5">
              Customize your Manhwa24 experience across all devices
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Default Reading Mode */}
            <div className="p-3 rounded-2xl bg-[#0E0A14] light:bg-[#F3EEFC] space-y-2">
              <span className="font-semibold block text-sm">Default Reader Layout</span>
              <div className="grid grid-cols-3 gap-2">
                {(['webtoon', 'paged-rtl', 'paged-ltr'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setReadingMode(mode);
                      showToast('Default Set', `Default reader mode: ${mode.toUpperCase()}`, 'info');
                    }}
                    className={`py-2 rounded-xl font-semibold capitalize transition ${
                      readingMode === mode
                        ? 'bg-[#FF4D6D] text-white shadow-sm'
                        : 'bg-[#171122] light:bg-white text-[#A79FC0]'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Profile Info */}
            {user && (
              <div className="p-3 rounded-2xl bg-[#0E0A14] light:bg-[#F3EEFC] space-y-2">
                <span className="font-semibold block text-sm">Active Account</span>
                <div className="flex items-center gap-3">
                  <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-xl object-cover" />
                  <div>
                    <p className="font-bold text-xs">{user.username}</p>
                    <p className="text-[11px] text-[#A79FC0]">{user.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Collection Modal */}
      {newCollectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#171122] border border-[#2C2340] p-6 shadow-2xl text-[#F5F1FF] light:bg-white light:border-[#E2D9F3] light:text-[#1A1429]">
            <h3 className="text-base font-bold font-heading mb-3">Create Collection</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#A79FC0] mb-1">Name</label>
                <input
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="e.g. S-Tier Martial Arts"
                  className="w-full p-2 rounded-xl text-xs bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A79FC0] mb-1">Description</label>
                <textarea
                  value={collectionDesc}
                  onChange={(e) => setCollectionDesc(e.target.value)}
                  placeholder="What makes these titles special?"
                  rows={2}
                  className="w-full p-2 rounded-xl text-xs bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setNewCollectionModal(false)}
                  className="flex-1 py-2 rounded-xl bg-[#1F1830] text-xs font-semibold text-[#A79FC0]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (collectionName.trim()) {
                      createCollection(collectionName.trim(), collectionDesc.trim());
                      setCollectionName('');
                      setCollectionDesc('');
                      setNewCollectionModal(false);
                    }
                  }}
                  className="flex-1 py-2 rounded-xl bg-gradient-brand text-white text-xs font-bold font-heading shadow-md"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EmptyLibraryState: React.FC<{ tabName: string }> = ({ tabName }) => {
  return (
    <div className="py-16 text-center rounded-3xl bg-[#171122] border border-[#2C2340] light:bg-white light:border-[#E2D9F3] p-8 max-w-md mx-auto my-6 shadow-xl">
      <MascotIllustration size={130} mood="reading" className="mx-auto mb-4" />
      <h3 className="text-base font-bold font-heading text-[#F5F1FF] light:text-[#1A1429]">
        Your "{tabName}" is empty!
      </h3>
      <p className="text-xs text-[#A79FC0] light:text-[#6E6288] mt-1 mb-5">
        Explore available titles on Manhwa24 and bookmark your favorite series.
      </p>
      <Link
        to="/browse"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-brand text-white font-heading font-bold text-xs shadow-md hover:opacity-90 active:scale-95 transition"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Browse Manga Catalog</span>
      </Link>
    </div>
  );
};
