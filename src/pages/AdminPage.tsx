import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  dbGetSeries,
  dbCreateSeries,
  dbUpdateSeries,
  dbDeleteSeries,
  dbGetChapters,
  dbCreateChapter,
  dbUpdateChapter,
  dbDeleteChapter,
  dbGetComments,
  dbDeleteComment,
  dbGetUsers,
  dbUpdateUserRole,
  dbToggleBanUser,
  dbGetSiteSettings,
  dbUpdateSiteSettings,
} from '../services/db';
import { uploadMediaFile, isFirebaseConfigured } from '../firebase';
import { aiWriter, hasGeminiApiKey, saveAdminGeminiKey } from '../services/aiWriter';
import { Series, Chapter, UserProfile, UserComment, SiteSettings, MangaType, MangaStatus, ContentRating, ALL_GENRES } from '../types';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Sparkles,
  Users,
  MessageSquare,
  Settings,
  Plus,
  Trash2,
  Edit,
  Upload,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  Image as ImageIcon,
  Key,
  ShieldCheck,
  RefreshCw,
  TrendingUp,
  Sliders,
  ChevronDown,
  ArrowUpRight,
  ArrowDown,
  ArrowUp,
  Languages,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { user, claimAdminRole, setAuthModalOpen, showToast } = useAppStore();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'series' | 'chapters' | 'ai_studio' | 'creator_queue' | 'comments' | 'users' | 'settings'
  >('overview');

  // Database states
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
  const [chaptersList, setChaptersList] = useState<Chapter[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [commentsList, setCommentsList] = useState<UserComment[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Series Modal Form State
  const [seriesModalOpen, setSeriesModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [seriesForm, setSeriesForm] = useState({
    title: '',
    altTitles: '',
    slug: '',
    synopsis: '',
    type: 'Manga' as MangaType,
    status: 'Ongoing' as MangaStatus,
    contentRating: 'Safe' as ContentRating,
    author: '',
    artist: '',
    genres: [] as string[],
    tags: '',
    coverUrl: '',
    bannerUrl: '',
    featured: false,
    isDraft: false,
  });
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Chapter Modal Form State
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [chapterType, setChapterType] = useState<'manga' | 'novel'>('manga');
  const [chapterForm, setChapterForm] = useState({
    seriesId: '',
    number: 1,
    title: '',
    pages: [] as string[],
    textContent: '',
    isDraft: false,
    scheduledAt: '',
  });
  const [uploadingPages, setUploadingPages] = useState(false);

  // AI Studio State
  const [aiSubTab, setAiSubTab] = useState<'story' | 'world' | 'outline' | 'draft' | 'meta' | 'prompt'>('story');
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState('');

  // AI Form States
  const [aiStoryParams, setAiStoryParams] = useState({
    genre: 'Fantasy',
    tone: 'Epic & High-Stakes',
    format: 'Webtoon',
    targetAudience: 'Shounen / Young Adult',
    themes: 'Ancient sealed magic, underdog rebirth, guild politics',
  });

  const [aiWorldParams, setAiWorldParams] = useState({
    storyPremise: '',
    genre: 'Urban Fantasy',
    magicOrTechSystem: 'Constellation affinity runes that cost emotional memories to invoke',
  });

  const [aiOutlineParams, setAiOutlineParams] = useState({
    storyTitle: '',
    synopsis: '',
    characters: 'A former grandmaster and an idealistic novice blacksmith',
    targetChapterCount: 10,
  });

  const [aiDraftParams, setAiDraftParams] = useState({
    seriesTitle: '',
    chapterNumber: 1,
    chapterTitle: 'The Broken Seal',
    outlineOrScenePrompt: 'The protagonist awakens in the ruins of the Astral Spire with strange glowing runes on his arm.',
    writingStyle: 'Web Novel Prose' as any,
    length: 'Standard (~1,500 words)' as any,
  });

  const [aiMetaParams, setAiMetaParams] = useState({
    concept: '',
    type: 'Webtoon',
    tone: 'Suspenseful & Supernatural',
  });

  const [aiPromptParams, setAiPromptParams] = useState({
    title: '',
    synopsis: '',
    style: 'Modern Korean Webtoon',
  });

  // Fetch initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const { items } = await dbGetSeries(undefined, true);
      setSeriesList(items);
      if (items.length > 0 && !selectedSeriesId) {
        setSelectedSeriesId(items[0].id);
      }

      const users = await dbGetUsers();
      setUsersList(users);

      const comments = await dbGetComments();
      setCommentsList(comments);

      const settings = await dbGetSiteSettings();
      setSiteSettings(settings);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch chapters when selected series changes
  useEffect(() => {
    if (selectedSeriesId) {
      dbGetChapters(selectedSeriesId, true).then((chapters) => {
        setChaptersList(chapters);
      });
    } else {
      setChaptersList([]);
    }
  }, [selectedSeriesId]);

  // Gate check
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#171122] border border-[#2C2340] shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black font-heading text-[#F5F1FF] mb-2">Admin Access Required</h2>
          <p className="text-xs text-[#A79FC0] mb-6 leading-relaxed">
            The Manga24 Admin Control Panel is strictly protected. Only users with the <span className="text-[#FF4D6D] font-bold">Admin</span> role can access publishing, chapter uploads, and site controls.
          </p>

          <p className="text-[11px] text-[#A79FC0]/80 font-mono-meta">
            Admin is assigned only from Firebase Console (Firestore → users → your account → role = admin).
          </p>
        </div>
      </div>
    );
  }

  // Handle Cover File Upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadMediaFile(file, 'covers');
      setSeriesForm((prev) => ({ ...prev, coverUrl: url }));
      showToast('Cover Uploaded', 'Image processed successfully.', 'success');
    } catch {
      showToast('Upload Failed', 'Could not upload cover image.', 'error');
    } finally {
      setUploadingCover(false);
    }
  };

  // Handle Banner File Upload
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const url = await uploadMediaFile(file, 'banners');
      setSeriesForm((prev) => ({ ...prev, bannerUrl: url }));
      showToast('Banner Uploaded', 'Banner image saved.', 'success');
    } catch {
      showToast('Upload Failed', 'Could not upload banner.', 'error');
    } finally {
      setUploadingBanner(false);
    }
  };

  // Save Series
  const handleSaveSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesForm.title.trim()) {
      showToast('Missing Title', 'Series title is required.', 'error');
      return;
    }

    try {
      const payload: Partial<Series> = {
        title: seriesForm.title.trim(),
        altTitles: seriesForm.altTitles.split(',').map((s) => s.trim()).filter(Boolean),
        slug: seriesForm.slug.trim() || seriesForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        synopsis: seriesForm.synopsis.trim(),
        type: seriesForm.type,
        status: seriesForm.status,
        contentRating: seriesForm.contentRating,
        author: seriesForm.author.trim() || 'Manga24 Originals',
        artist: seriesForm.artist.trim(),
        genres: seriesForm.genres,
        tags: seriesForm.tags.split(',').map((s) => s.trim()).filter(Boolean),
        coverUrl: seriesForm.coverUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
        bannerUrl: seriesForm.bannerUrl,
        featured: seriesForm.featured,
        isDraft: seriesForm.isDraft,
      };

      if (editingSeries) {
        await dbUpdateSeries(editingSeries.id, payload);
        showToast('Series Updated', `"${payload.title}" has been saved.`, 'success');
      } else {
        await dbCreateSeries(payload);
        showToast('Series Published', `"${payload.title}" is now created.`, 'success');
      }

      setSeriesModalOpen(false);
      setEditingSeries(null);
      loadData();
    } catch (err) {
      showToast('Error', 'Failed to save series.', 'error');
    }
  };

  // Delete Series
  const handleDeleteSeries = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;
    try {
      await dbDeleteSeries(id);
      showToast('Series Deleted', `"${title}" was removed.`, 'info');
      loadData();
    } catch {
      showToast('Error', 'Failed to delete series.', 'error');
    }
  };

  // Handle Chapter Pages Upload (Multiple Images)
  const handlePagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingPages(true);

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadMediaFile(files[i], 'chapters');
        uploadedUrls.push(url);
      }
      setChapterForm((prev) => ({
        ...prev,
        pages: [...prev.pages, ...uploadedUrls],
      }));
      showToast('Pages Uploaded', `Added ${uploadedUrls.length} page(s).`, 'success');
    } catch {
      showToast('Upload Failed', 'Error uploading pages.', 'error');
    } finally {
      setUploadingPages(false);
    }
  };

  // Move Chapter Page Up/Down
  const movePage = (index: number, direction: 'up' | 'down') => {
    setChapterForm((prev) => {
      const newPages = [...prev.pages];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newPages.length) return prev;
      const temp = newPages[index];
      newPages[index] = newPages[targetIndex];
      newPages[targetIndex] = temp;
      return { ...prev, pages: newPages };
    });
  };

  const removePage = (index: number) => {
    setChapterForm((prev) => ({
      ...prev,
      pages: prev.pages.filter((_, i) => i !== index),
    }));
  };

  // Save Chapter
  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeriesId) {
      showToast('Error', 'Please select a series first.', 'error');
      return;
    }

    try {
      const payload: Partial<Chapter> = {
        seriesId: selectedSeriesId,
        number: Number(chapterForm.number),
        title: chapterForm.title.trim() || `Chapter ${chapterForm.number}`,
        pages: chapterType === 'manga' ? chapterForm.pages : [],
        textContent: chapterType === 'novel' ? chapterForm.textContent : '',
        isDraft: chapterForm.isDraft,
        scheduledAt: chapterForm.scheduledAt || undefined,
        publishedAt: chapterForm.scheduledAt || new Date().toISOString(),
      };

      if (editingChapter) {
        await dbUpdateChapter(editingChapter.id, payload);
        showToast('Chapter Updated', `Chapter ${payload.number} updated.`, 'success');
      } else {
        await dbCreateChapter(payload);
        showToast('Chapter Published', `Chapter ${payload.number} is now live.`, 'success');
      }

      setChapterModalOpen(false);
      setEditingChapter(null);
      // Reload chapters
      const chs = await dbGetChapters(selectedSeriesId, true);
      setChaptersList(chs);
      loadData();
    } catch {
      showToast('Error', 'Failed to save chapter.', 'error');
    }
  };

  const handleDeleteChapter = async (id: string, num: number) => {
    if (!window.confirm(`Delete Chapter ${num}?`)) return;
    try {
      await dbDeleteChapter(id);
      showToast('Deleted', `Chapter ${num} removed.`, 'info');
      if (selectedSeriesId) {
        const chs = await dbGetChapters(selectedSeriesId, true);
        setChaptersList(chs);
      }
    } catch {
      showToast('Error', 'Failed to delete chapter.', 'error');
    }
  };

  // AI Generation Handlers
  const handleRunAi = async () => {
    setAiLoading(true);
    setAiOutput('');
    try {
      if (geminiKeyInput.trim()) {
        saveAdminGeminiKey(geminiKeyInput);
      }

      let res = '';
      if (aiSubTab === 'story') {
        res = await aiWriter.generateStoryIdea(aiStoryParams);
      } else if (aiSubTab === 'world') {
        res = await aiWriter.generateCharacterAndWorld(aiWorldParams);
      } else if (aiSubTab === 'outline') {
        res = await aiWriter.generateChapterOutline(aiOutlineParams);
      } else if (aiSubTab === 'draft') {
        res = await aiWriter.generateFullChapterDraft(aiDraftParams);
      } else if (aiSubTab === 'meta') {
        const meta = await aiWriter.generateSeriesMetadata(aiMetaParams);
        res = JSON.stringify(meta, null, 2);
      } else if (aiSubTab === 'prompt') {
        res = await aiWriter.generateCoverArtPrompt(aiPromptParams.title, aiPromptParams.synopsis, aiPromptParams.style);
      }
      setAiOutput(res);
      showToast('Generation Complete', 'Original creative writing generated.', 'success');
    } catch (err: any) {
      setAiOutput(`Error: ${err.message}`);
      showToast('AI Error', err.message, 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleRefineAi = async (action: 'longer' | 'dialogue' | 'translate_hindi' | 'translate_english' | 'polish') => {
    if (!aiOutput) return;
    setAiLoading(true);
    try {
      const refined = await aiWriter.refineText(aiOutput, action);
      setAiOutput(refined);
      showToast('Refinement Applied', 'Story updated.', 'success');
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // Load AI draft into Novel Chapter Editor
  const handleLoadDraftToChapter = () => {
    if (!aiOutput) return;
    setChapterType('novel');
    setChapterForm((prev) => ({
      ...prev,
      title: aiDraftParams.chapterTitle || `Chapter ${aiDraftParams.chapterNumber}`,
      number: aiDraftParams.chapterNumber,
      textContent: aiOutput,
    }));
    setActiveTab('chapters');
    setChapterModalOpen(true);
    showToast('Loaded into Editor', 'Your AI chapter draft is ready to review and publish.', 'success');
  };

  // Total metrics
  const totalSeries = seriesList.length;
  const totalChapters = seriesList.reduce((acc, s) => acc + (s.totalChapters || 0), 0);
  const totalUsers = usersList.length;
  const totalViews = seriesList.reduce((acc, s) => acc + (s.views || 0), 0);

  // 7-day mock view distribution for visualization
  const last7Days = [
    { day: 'Mon', count: Math.round(totalViews * 0.12) + 24 },
    { day: 'Tue', count: Math.round(totalViews * 0.14) + 38 },
    { day: 'Wed', count: Math.round(totalViews * 0.11) + 19 },
    { day: 'Thu', count: Math.round(totalViews * 0.18) + 45 },
    { day: 'Fri', count: Math.round(totalViews * 0.22) + 62 },
    { day: 'Sat', count: Math.round(totalViews * 0.26) + 85 },
    { day: 'Sun', count: Math.round(totalViews * 0.28) + 94 },
  ];
  const maxDayCount = Math.max(...last7Days.map((d) => d.count), 100);

  // Role gate: Only users with role "admin" can access /admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#171122] border border-[#2C2340] light:bg-white light:border-[#E2D9F3] text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#FF4D6D]/15 text-[#FF4D6D] border border-[#FF4D6D]/30 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold font-heading text-[#F5F1FF] light:text-[#1A1429] mb-2">
            Admin Access Restricted
          </h2>
          <p className="text-xs text-[#A79FC0] light:text-[#6E6288] leading-relaxed mb-6">
            Only users with role <span className="font-mono text-[#FF4D6D] font-bold">admin</span> can access the Manga24 management console.
          </p>

          {!user ? (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-3 rounded-xl bg-gradient-brand text-white font-heading font-bold text-xs shadow-lg hover:opacity-95 transition"
            >
              Sign In to Continue
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#0E0A14] light:bg-[#F3EEFC] text-[11px] text-[#A79FC0] light:text-[#6E6288]">
                Signed in as <span className="font-bold text-[#F5F1FF] light:text-[#1A1429]">{user.email || user.username}</span> (Role: <span className="font-mono text-[#FF9F1C] font-bold">{user.role}</span>)
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-[#F5F1FF] light:text-[#1A1429]">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3] shadow-xl mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF4D6D]/15 text-[#FF4D6D] border border-[#FF4D6D]/30 uppercase tracking-wider">
              Control Center
            </span>
            <span className="text-xs text-[#A79FC0] light:text-[#6E6288] font-mono-meta">
              Manga24 v2.0 • {isFirebaseConfigured() ? 'Cloud Firestore Connected' : 'Local Persistence Engine (Ready to connect)'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
            Manga24 Administrator
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingSeries(null);
              setSeriesForm({
                title: '',
                altTitles: '',
                slug: '',
                synopsis: '',
                type: 'Manga',
                status: 'Ongoing',
                contentRating: 'Safe',
                author: '',
                artist: '',
                genres: ['Action', 'Fantasy'],
                tags: '',
                coverUrl: '',
                bannerUrl: '',
                featured: false,
                isDraft: false,
              });
              setSeriesModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl font-heading font-bold text-xs bg-gradient-brand text-white shadow-lg shadow-[#FF4D6D]/20 hover:opacity-95 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Publish New Series</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 mb-6 scrollbar-none border-b border-[#2C2340] light:border-[#E2D9F3]">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'series', label: `Series (${totalSeries})`, icon: BookOpen },
          { id: 'chapters', label: 'Chapter Manager', icon: FileText },
          { id: 'ai_studio', label: 'AI Writing Studio', icon: Sparkles, highlight: true },
          { id: 'creator_queue', label: 'Creator Queue', icon: Upload },
          { id: 'comments', label: 'Moderation', icon: MessageSquare },
          { id: 'users', label: 'Users & Roles', icon: Users },
          { id: 'settings', label: 'Site Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isCurrent = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold font-heading whitespace-nowrap transition flex items-center gap-2 ${
                isCurrent
                  ? tab.highlight
                    ? 'bg-gradient-brand text-white shadow-md shadow-[#FF4D6D]/20'
                    : 'bg-[#FF4D6D] text-white shadow-sm'
                  : 'bg-[#171122] light:bg-[#F3EEFC] hover:bg-[#1F1830] text-[#A79FC0] hover:text-white light:text-[#6E6288] light:hover:text-[#1A1429]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3] shadow-md">
              <div className="flex items-center justify-between text-[#A79FC0] light:text-[#6E6288] mb-2">
                <span className="text-xs font-semibold">Total Series</span>
                <BookOpen className="w-4 h-4 text-[#FF4D6D]" />
              </div>
              <p className="text-3xl font-black font-heading">{totalSeries}</p>
              <span className="text-[10px] text-emerald-400 mt-1 block">Live in catalog</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3] shadow-md">
              <div className="flex items-center justify-between text-[#A79FC0] light:text-[#6E6288] mb-2">
                <span className="text-xs font-semibold">Total Chapters</span>
                <FileText className="w-4 h-4 text-[#8B5CFF]" />
              </div>
              <p className="text-3xl font-black font-heading">{totalChapters}</p>
              <span className="text-[10px] text-[#A79FC0] mt-1 block">Manga & Novel chapters</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3] shadow-md">
              <div className="flex items-center justify-between text-[#A79FC0] light:text-[#6E6288] mb-2">
                <span className="text-xs font-semibold">Registered Users</span>
                <Users className="w-4 h-4 text-[#FF9F1C]" />
              </div>
              <p className="text-3xl font-black font-heading">{totalUsers}</p>
              <span className="text-[10px] text-emerald-400 mt-1 block">Active readers & creators</span>
            </div>

            <div className="p-5 rounded-2xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3] shadow-md">
              <div className="flex items-center justify-between text-[#A79FC0] light:text-[#6E6288] mb-2">
                <span className="text-xs font-semibold">Total Page Views</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-black font-heading">{totalViews.toLocaleString()}</p>
              <span className="text-[10px] text-emerald-400 mt-1 block">Across all readers</span>
            </div>
          </div>

          {/* Views Activity Chart (7 Days) */}
          <div className="p-6 rounded-3xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3] shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold font-heading">Weekly Readership Activity</h3>
                <p className="text-xs text-[#A79FC0] light:text-[#6E6288]">
                  Aggregated views across manga pages and serialized novel chapters
                </p>
              </div>
              <span className="text-xs font-mono-meta font-bold text-[#FF4D6D] bg-[#FF4D6D]/10 px-3 py-1 rounded-full">
                Past 7 Days
              </span>
            </div>

            <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-[#2C2340] light:border-[#E2D9F3]">
              {last7Days.map((bar) => {
                const heightPercent = Math.round((bar.count / maxDayCount) * 100);
                return (
                  <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <span className="text-[10px] font-mono-meta text-[#A79FC0] opacity-0 group-hover:opacity-100 transition">
                      {bar.count}
                    </span>
                    <div
                      style={{ height: `${Math.max(12, heightPercent)}%` }}
                      className="w-full max-w-[48px] rounded-t-xl bg-gradient-to-t from-[#8B5CFF] to-[#FF4D6D] group-hover:brightness-125 transition shadow-lg shadow-[#FF4D6D]/15"
                    />
                    <span className="text-xs font-semibold text-[#A79FC0] light:text-[#6E6288] pb-1">
                      {bar.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Launchpad */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => setActiveTab('series')}
              className="p-5 rounded-2xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3] hover:border-[#FF4D6D]/50 cursor-pointer transition"
            >
              <h4 className="font-heading font-bold text-sm mb-1 flex items-center justify-between">
                <span>Manage Catalog</span>
                <ArrowUpRight className="w-4 h-4 text-[#FF4D6D]" />
              </h4>
              <p className="text-xs text-[#A79FC0] light:text-[#6E6288]">
                Publish new titles, edit synopsis, genres, or toggle homepage featured status.
              </p>
            </div>

            <div
              onClick={() => setActiveTab('chapters')}
              className="p-5 rounded-2xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3] hover:border-[#8B5CFF]/50 cursor-pointer transition"
            >
              <h4 className="font-heading font-bold text-sm mb-1 flex items-center justify-between">
                <span>Chapter Upload & Story Writer</span>
                <ArrowUpRight className="w-4 h-4 text-[#8B5CFF]" />
              </h4>
              <p className="text-xs text-[#A79FC0] light:text-[#6E6288]">
                Upload image pages or write novel-style prose with the integrated editor.
              </p>
            </div>

            <div
              onClick={() => setActiveTab('ai_studio')}
              className="p-5 rounded-2xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3] hover:border-[#FF9F1C]/50 cursor-pointer transition"
            >
              <h4 className="font-heading font-bold text-sm mb-1 flex items-center justify-between">
                <span>AI Writing Assistant</span>
                <ArrowUpRight className="w-4 h-4 text-[#FF9F1C]" />
              </h4>
              <p className="text-xs text-[#A79FC0] light:text-[#6E6288]">
                Generate original story pitches, world lore, episodic outlines, and full chapter drafts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. SERIES MANAGER TAB */}
      {activeTab === 'series' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-heading">All Published & Draft Series</h2>
            <button
              onClick={() => {
                setEditingSeries(null);
                setSeriesForm({
                  title: '',
                  altTitles: '',
                  slug: '',
                  synopsis: '',
                  type: 'Manga',
                  status: 'Ongoing',
                  contentRating: 'Safe',
                  author: '',
                  artist: '',
                  genres: ['Action', 'Fantasy'],
                  tags: '',
                  coverUrl: '',
                  bannerUrl: '',
                  featured: false,
                  isDraft: false,
                });
                setSeriesModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-heading font-bold bg-gradient-brand text-white shadow hover:opacity-90 transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Series</span>
            </button>
          </div>

          {seriesList.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3]">
              <BookOpen className="w-12 h-12 text-[#FF4D6D]/40 mx-auto mb-3" />
              <h3 className="text-base font-bold font-heading mb-1">No series created yet</h3>
              <p className="text-xs text-[#A79FC0] max-w-sm mx-auto mb-4">
                The platform catalog is completely empty. Click below to publish your first manga, webtoon, or novel!
              </p>
              <button
                onClick={() => setSeriesModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-brand text-white"
              >
                Create First Series
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3] shadow-md">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#2C2340] light:border-[#E2D9F3] bg-[#0E0A14] light:bg-[#F3EEFC] text-[#A79FC0] light:text-[#6E6288] font-mono-meta uppercase">
                  <tr>
                    <th className="p-3.5">Series</th>
                    <th className="p-3.5">Format</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Chapters</th>
                    <th className="p-3.5">Views</th>
                    <th className="p-3.5">Featured</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2C2340]/50 light:divide-[#E2D9F3]">
                  {seriesList.map((s) => (
                    <tr key={s.id} className="hover:bg-[#1F1830]/50 light:hover:bg-[#F9F6FE] transition">
                      <td className="p-3.5 flex items-center gap-3">
                        <img
                          src={s.coverUrl || s.coverImage}
                          alt={s.title}
                          className="w-10 h-14 object-cover rounded-lg bg-[#0E0A14] border border-[#2C2340]"
                        />
                        <div>
                          <p className="font-bold text-sm text-[#F5F1FF] light:text-[#1A1429] line-clamp-1">{s.title}</p>
                          <p className="text-[11px] text-[#A79FC0] light:text-[#6E6288]">By {s.author}</p>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8B5CFF]/15 text-[#8B5CFF] border border-[#8B5CFF]/30">
                          {s.type}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.isDraft
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {s.isDraft ? 'Draft' : s.status}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono-meta">{s.totalChapters || 0} ch</td>
                      <td className="p-3.5 font-mono-meta">{s.views?.toLocaleString() || 0}</td>
                      <td className="p-3.5">
                        {s.featured ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF4D6D]/15 text-[#FF4D6D] border border-[#FF4D6D]/30">
                            ★ Hero
                          </span>
                        ) : (
                          <span className="text-[#A79FC0] text-[11px]">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedSeriesId(s.id);
                            setActiveTab('chapters');
                          }}
                          className="p-1.5 rounded-lg bg-[#0E0A14] hover:bg-[#2C2340] text-[#8B5CFF] transition"
                          title="Manage Chapters"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingSeries(s);
                            setSeriesForm({
                              title: s.title,
                              altTitles: (s.altTitles || []).join(', '),
                              slug: s.slug || '',
                              synopsis: s.synopsis || '',
                              type: s.type,
                              status: s.status,
                              contentRating: s.contentRating,
                              author: s.author || '',
                              artist: s.artist || '',
                              genres: s.genres || [],
                              tags: (s.tags || []).join(', '),
                              coverUrl: s.coverUrl || s.coverImage || '',
                              bannerUrl: s.bannerUrl || s.bannerImage || '',
                              featured: Boolean(s.featured),
                              isDraft: Boolean(s.isDraft),
                            });
                            setSeriesModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-[#0E0A14] hover:bg-[#2C2340] text-[#FF9F1C] transition"
                          title="Edit Series"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSeries(s.id, s.title)}
                          className="p-1.5 rounded-lg bg-[#0E0A14] hover:bg-red-500/20 text-red-400 transition"
                          title="Delete Series"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. CHAPTER MANAGER TAB */}
      {activeTab === 'chapters' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Series selector bar */}
          <div className="p-4 rounded-2xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-[#A79FC0] uppercase tracking-wider font-mono-meta">
                Target Series:
              </label>
              <select
                value={selectedSeriesId}
                onChange={(e) => setSelectedSeriesId(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] text-[#F5F1FF] light:text-[#1A1429] font-bold"
              >
                {seriesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.type})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                if (!selectedSeriesId) {
                  showToast('Select Series', 'Please choose a series first.', 'error');
                  return;
                }
                const nextNum = (chaptersList[0]?.number || 0) + 1;
                setEditingChapter(null);
                setChapterForm({
                  seriesId: selectedSeriesId,
                  number: nextNum,
                  title: `Chapter ${nextNum}`,
                  pages: [],
                  textContent: '',
                  isDraft: false,
                  scheduledAt: '',
                });
                setChapterModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-brand text-white shadow flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Chapter</span>
            </button>
          </div>

          {/* Chapters Table */}
          {chaptersList.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3]">
              <FileText className="w-12 h-12 text-[#8B5CFF]/40 mx-auto mb-3" />
              <h3 className="text-base font-bold font-heading mb-1">No chapters published yet</h3>
              <p className="text-xs text-[#A79FC0] max-w-sm mx-auto mb-4">
                Upload image pages for a manga/webtoon chapter, or write novel chapters using the rich story editor.
              </p>
              <button
                onClick={() => setChapterModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-brand text-white"
              >
                Create Chapter 1
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3] shadow-md">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#2C2340] light:border-[#E2D9F3] bg-[#0E0A14] light:bg-[#F3EEFC] text-[#A79FC0] light:text-[#6E6288] font-mono-meta uppercase">
                  <tr>
                    <th className="p-3.5">#</th>
                    <th className="p-3.5">Title</th>
                    <th className="p-3.5">Format</th>
                    <th className="p-3.5">Release Date</th>
                    <th className="p-3.5">Views</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2C2340]/50 light:divide-[#E2D9F3]">
                  {chaptersList.map((ch) => (
                    <tr key={ch.id} className="hover:bg-[#1F1830]/50 light:hover:bg-[#F9F6FE] transition">
                      <td className="p-3.5 font-bold font-mono-meta text-[#FF4D6D]">Ch. {ch.number}</td>
                      <td className="p-3.5 font-semibold text-[#F5F1FF] light:text-[#1A1429]">{ch.title}</td>
                      <td className="p-3.5">
                        {ch.textContent ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF9F1C]/15 text-[#FF9F1C] border border-[#FF9F1C]/30">
                            Novel Prose
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8B5CFF]/15 text-[#8B5CFF] border border-[#8B5CFF]/30">
                            {ch.pages?.length || 0} Pages
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono-meta text-[#A79FC0]">
                        {ch.publishedAt?.split('T')[0] || 'Live'}
                      </td>
                      <td className="p-3.5 font-mono-meta">{ch.views || 0}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ch.isDraft
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {ch.isDraft ? 'Draft' : 'Published'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingChapter(ch);
                            setChapterType(ch.textContent ? 'novel' : 'manga');
                            setChapterForm({
                              seriesId: ch.seriesId,
                              number: ch.number,
                              title: ch.title,
                              pages: ch.pages || [],
                              textContent: ch.textContent || '',
                              isDraft: Boolean(ch.isDraft),
                              scheduledAt: ch.scheduledAt || '',
                            });
                            setChapterModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-[#0E0A14] hover:bg-[#2C2340] text-[#FF9F1C] transition"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteChapter(ch.id, ch.number)}
                          className="p-1.5 rounded-lg bg-[#0E0A14] hover:bg-red-500/20 text-red-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. AI WRITING ASSISTANT TAB */}
      {activeTab === 'ai_studio' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#1F1830] to-[#171122] border border-[#8B5CFF]/30 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8B5CFF]/20 text-[#8B5CFF] border border-[#8B5CFF]/40 uppercase tracking-wider mb-2 inline-block">
                  Powered by Gemini 3.8 Flash
                </span>
                <h2 className="text-xl font-black font-heading text-white">
                  Manga24 AI Story Studio
                </h2>
                <p className="text-xs text-[#A79FC0] max-w-xl mt-1">
                  Brainstorm original story premises, develop complex world systems, draft multi-chapter arcs, and compose full publication-ready chapters.
                </p>
              </div>

              {/* API Key quick setup */}
              <div className="p-3 rounded-xl bg-[#0E0A14] border border-[#2C2340] flex items-center gap-2">
                <Key className="w-4 h-4 text-[#FF9F1C]" />
                <input
                  type="password"
                  placeholder={hasGeminiApiKey() ? 'API Key Active ✓' : 'Paste Gemini API Key'}
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none w-36"
                />
                <button
                  onClick={() => {
                    if (geminiKeyInput.trim()) {
                      saveAdminGeminiKey(geminiKeyInput);
                      showToast('API Key Saved', 'Gemini Key saved for your session.', 'success');
                      setGeminiKeyInput('');
                    }
                  }}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#FF4D6D] text-white"
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* AI Subtabs */}
          <div className="flex gap-2 border-b border-[#2C2340] pb-2 overflow-x-auto scrollbar-none">
            {[
              { id: 'story', label: 'Story Pitches' },
              { id: 'world', label: 'World & Lore' },
              { id: 'outline', label: 'Arc Outline' },
              { id: 'draft', label: 'Chapter Drafter' },
              { id: 'meta', label: 'Synopsis & Tags' },
              { id: 'prompt', label: 'Cover Art Prompts' },
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => setAiSubTab(sub.id as any)}
                className={`py-2 px-3.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  aiSubTab === sub.id
                    ? 'bg-[#8B5CFF] text-white shadow-md'
                    : 'bg-[#171122] text-[#A79FC0] hover:text-white'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* Form & Output Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Column */}
            <div className="lg:col-span-5 space-y-4 p-5 rounded-2xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3]">
              {aiSubTab === 'story' && (
                <div className="space-y-3">
                  <h3 className="font-heading font-bold text-sm">Generate Original Story Pitches</h3>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A79FC0] mb-1">Genre</label>
                    <select
                      value={aiStoryParams.genre}
                      onChange={(e) => setAiStoryParams({ ...aiStoryParams, genre: e.target.value })}
                      className="w-full p-2 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-xs text-white"
                    >
                      {ALL_GENRES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A79FC0] mb-1">Tone</label>
                    <input
                      type="text"
                      value={aiStoryParams.tone}
                      onChange={(e) => setAiStoryParams({ ...aiStoryParams, tone: e.target.value })}
                      placeholder="e.g. Gritty, High-Octane, Whimsical, Dark"
                      className="w-full p-2 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A79FC0] mb-1">Format</label>
                    <select
                      value={aiStoryParams.format}
                      onChange={(e) => setAiStoryParams({ ...aiStoryParams, format: e.target.value })}
                      className="w-full p-2 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-xs text-white"
                    >
                      <option value="Webtoon">Webtoon (Vertical Scroll)</option>
                      <option value="Manga">Manga (Right to Left)</option>
                      <option value="Novel">Serialized Web Novel</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A79FC0] mb-1">Themes & Keywords</label>
                    <textarea
                      rows={3}
                      value={aiStoryParams.themes}
                      onChange={(e) => setAiStoryParams({ ...aiStoryParams, themes: e.target.value })}
                      placeholder="e.g. Cosmic constellations, ancient debt, hidden academy"
                      className="w-full p-2 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {aiSubTab === 'world' && (
                <div className="space-y-3">
                  <h3 className="font-heading font-bold text-sm">Character Profiles & World Lore</h3>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A79FC0] mb-1">Story Premise</label>
                    <textarea
                      rows={3}
                      value={aiWorldParams.storyPremise}
                      onChange={(e) => setAiWorldParams({ ...aiWorldParams, storyPremise: e.target.value })}
                      placeholder="e.g. In a city where debts are paid with personal lifespan..."
                      className="w-full p-2 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A79FC0] mb-1">Power / Tech System</label>
                    <input
                      type="text"
                      value={aiWorldParams.magicOrTechSystem}
                      onChange={(e) => setAiWorldParams({ ...aiWorldParams, magicOrTechSystem: e.target.value })}
                      placeholder="e.g. Cybernetic soul implants"
                      className="w-full p-2 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {aiSubTab === 'outline' && (
                <div className="space-y-3">
                  <h3 className="font-heading font-bold text-sm">Chapter-by-Chapter Outline</h3>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A79FC0] mb-1">Series Title</label>
                    <input
                      type="text"
                      value={aiOutlineParams.storyTitle}
                      onChange={(e) => setAiOutlineParams({ ...aiOutlineParams, storyTitle: e.target.value })}
                      placeholder="e.g. Sovereign of Shattered Stars"
                      className="w-full p-2 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A79FC0] mb-1">Premise Summary</label>
                    <textarea
                      rows={3}
                      value={aiOutlineParams.synopsis}
                      onChange={(e) => setAiOutlineParams({ ...aiOutlineParams, synopsis: e.target.value })}
                      placeholder="Brief summary of the arc or series"
                      className="w-full p-2 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A79FC0] mb-1">Chapter Count</label>
                    <input
                      type="number"
                      min={3}
                      max={20}
                      value={aiOutlineParams.targetChapterCount}
                      onChange={(e) => setAiOutlineParams({ ...aiOutlineParams, targetChapterCount: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {aiSubTab === 'draft' && (
                <div className="space-y-3">
                  <h3 className="font-heading font-bold text-sm">Write Full Chapter Draft</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#A79FC0] mb-1">Series Name</label>
                      <input
                        type="text"
                        value={aiDraftParams.seriesTitle}
                        onChange={(e) => setAiDraftParams({ ...aiDraftParams, seriesTitle: e.target.value })}
                        placeholder="Series Title"
                        className="w-full p-2 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#A79FC0] mb-1">Chapter Number</label>
                      <input
                        type="number"
                        value={aiDraftParams.chapterNumber}
                        onChange={(e) => setAiDraftParams({ ...aiDraftParams, chapterNumber: Number(e.target.value) })}
                        className="w-full p-2 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-xs text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A79FC0] mb-1">Chapter Subtitle</label>
                    <input
                      type="text"
                      value={aiDraftParams.chapterTitle}
                      onChange={(e) => setAiDraftParams({ ...aiDraftParams, chapterTitle: e.target.value })}
                      placeholder="e.g. Awakening in the Obsidian Gate"
                      className="w-full p-2 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A79FC0] mb-1">Outline / Directive</label>
                    <textarea
                      rows={4}
                      value={aiDraftParams.outlineOrScenePrompt}
                      onChange={(e) => setAiDraftParams({ ...aiDraftParams, outlineOrScenePrompt: e.target.value })}
                      placeholder="What happens in this chapter? Key beats, dialogue, cliffhanger."
                      className="w-full p-2 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A79FC0] mb-1">Prose Length</label>
                    <select
                      value={aiDraftParams.length}
                      onChange={(e) => setAiDraftParams({ ...aiDraftParams, length: e.target.value as any })}
                      className="w-full p-2 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-xs text-white"
                    >
                      <option value="Short (~800 words)">Short (~800 words)</option>
                      <option value="Standard (~1,500 words)">Standard (~1,500 words)</option>
                      <option value="Detailed (~2,500 words)">Detailed (~2,500 words)</option>
                    </select>
                  </div>
                </div>
              )}

              {aiSubTab === 'meta' && (
                <div className="space-y-3">
                  <h3 className="font-heading font-bold text-sm">Generate Synopsis & Tags</h3>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A79FC0] mb-1">Story Concept</label>
                    <textarea
                      rows={4}
                      value={aiMetaParams.concept}
                      onChange={(e) => setAiMetaParams({ ...aiMetaParams, concept: e.target.value })}
                      placeholder="Describe the story core in 1-2 sentences"
                      className="w-full p-2 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {aiSubTab === 'prompt' && (
                <div className="space-y-3">
                  <h3 className="font-heading font-bold text-sm">Cover Art Prompt Generator</h3>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A79FC0] mb-1">Series Title</label>
                    <input
                      type="text"
                      value={aiPromptParams.title}
                      onChange={(e) => setAiPromptParams({ ...aiPromptParams, title: e.target.value })}
                      placeholder="Title of your story"
                      className="w-full p-2 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A79FC0] mb-1">Synopsis</label>
                    <textarea
                      rows={3}
                      value={aiPromptParams.synopsis}
                      onChange={(e) => setAiPromptParams({ ...aiPromptParams, synopsis: e.target.value })}
                      placeholder="Brief story premise"
                      className="w-full p-2 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-xs text-white"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleRunAi}
                disabled={aiLoading}
                className="w-full py-2.5 rounded-xl font-heading font-bold text-xs bg-gradient-brand text-white shadow-lg shadow-[#FF4D6D]/20 hover:opacity-95 transition flex items-center justify-center gap-2"
              >
                {aiLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate with AI</span>
                  </>
                )}
              </button>
            </div>

            {/* Output Column */}
            <div className="lg:col-span-7 flex flex-col p-5 rounded-2xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3]">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#2C2340] light:border-[#E2D9F3] mb-3">
                <span className="text-xs font-bold font-mono-meta text-[#A79FC0]">AI Output Canvas</span>

                {aiOutput && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => handleRefineAi('longer')}
                      disabled={aiLoading}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#0E0A14] hover:bg-[#2C2340] text-white border border-[#2C2340]"
                    >
                      + Make Longer
                    </button>
                    <button
                      onClick={() => handleRefineAi('dialogue')}
                      disabled={aiLoading}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#0E0A14] hover:bg-[#2C2340] text-white border border-[#2C2340]"
                    >
                      Improve Dialogue
                    </button>
                    <button
                      onClick={() => handleRefineAi('translate_hindi')}
                      disabled={aiLoading}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#0E0A14] hover:bg-[#2C2340] text-[#FF9F1C] border border-[#2C2340] flex items-center gap-1"
                    >
                      <Languages className="w-3 h-3" />
                      <span>Hindi</span>
                    </button>
                    <button
                      onClick={() => handleRefineAi('translate_english')}
                      disabled={aiLoading}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#0E0A14] hover:bg-[#2C2340] text-white border border-[#2C2340]"
                    >
                      English
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 min-h-[360px] p-4 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-xs text-[#F5F1FF] font-sans leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[500px]">
                {aiLoading ? (
                  <div className="h-full flex flex-col items-center justify-center text-[#A79FC0] gap-3">
                    <div className="w-6 h-6 border-2 border-[#8B5CFF]/30 border-t-[#8B5CFF] rounded-full animate-spin" />
                    <span>Gemini is crafting original fiction...</span>
                  </div>
                ) : aiOutput ? (
                  aiOutput
                ) : (
                  <span className="text-[#A79FC0]/50 italic">
                    Select a generator from the left and click "Generate with AI". Output will appear here and can be loaded directly into your chapter story editor.
                  </span>
                )}
              </div>

              {aiOutput && aiSubTab === 'draft' && (
                <div className="mt-4 pt-3 border-t border-[#2C2340] flex items-center justify-end">
                  <button
                    onClick={handleLoadDraftToChapter}
                    className="px-4 py-2 rounded-xl text-xs font-heading font-bold bg-gradient-brand text-white shadow flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Load into Novel Chapter Editor</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. CREATOR QUEUE TAB */}
      {activeTab === 'creator_queue' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 rounded-3xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3]">
            <h3 className="text-base font-bold font-heading mb-1">Creator Submission & Review Queue</h3>
            <p className="text-xs text-[#A79FC0] mb-4">
              Approved writers and artists with the Creator role submit original manga and web novels here before they go live on Manga24.
            </p>

            <div className="p-8 text-center rounded-2xl bg-[#0E0A14] border border-[#2C2340]">
              <Upload className="w-10 h-10 text-[#8B5CFF]/40 mx-auto mb-2" />
              <p className="text-xs font-bold text-[#F5F1FF] mb-1">Queue is Clear</p>
              <p className="text-[11px] text-[#A79FC0] max-w-sm mx-auto">
                No pending submissions requiring editorial review. Creators can submit works at <code className="text-[#FF4D6D]">/creator-upload</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODERATION TAB */}
      {activeTab === 'comments' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 rounded-3xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold font-heading">Comments & Discussion Moderation</h3>
                <p className="text-xs text-[#A79FC0]">Review and moderate reader feedback across chapters and series</p>
              </div>
            </div>

            {commentsList.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#0E0A14] border border-[#2C2340]">
                <MessageSquare className="w-10 h-10 text-[#FF4D6D]/40 mx-auto mb-2" />
                <p className="text-xs font-bold text-[#F5F1FF]">No Comments Yet</p>
                <p className="text-[11px] text-[#A79FC0]">Reader comments will appear here for moderation.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {commentsList.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl bg-[#0E0A14] border border-[#2C2340] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-xs text-[#F5F1FF]">{c.authorName}</span>
                        <span className="text-[10px] text-[#A79FC0] font-mono-meta">{c.createdAt}</span>
                      </div>
                      <p className="text-xs text-[#A79FC0] truncate">{c.content}</p>
                    </div>
                    <button
                      onClick={async () => {
                        await dbDeleteComment(c.id);
                        setCommentsList((prev) => prev.filter((item) => item.id !== c.id));
                        showToast('Comment Removed', 'Deleted by moderator.', 'info');
                      }}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. USERS & ROLES TAB */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 rounded-3xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3]">
            <h3 className="text-base font-bold font-heading mb-1">User & Role Management</h3>
            <p className="text-xs text-[#A79FC0] mb-4">Grant administrator privileges, approve creator status, or ban abusive accounts.</p>

            <div className="overflow-x-auto rounded-2xl bg-[#0E0A14] border border-[#2C2340]">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#2C2340] text-[#A79FC0] uppercase font-mono-meta">
                  <tr>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2C2340]">
                  {usersList.map((u) => (
                    <tr key={u.id}>
                      <td className="p-3.5 flex items-center gap-2">
                        <img src={u.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                        <span className="font-bold text-white">{u.username}</span>
                      </td>
                      <td className="p-3.5 font-mono-meta text-[#A79FC0]">{u.email}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8B5CFF]/20 text-[#8B5CFF] border border-[#8B5CFF]/30 uppercase">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {u.isBanned ? (
                          <span className="text-red-400 font-bold">Banned</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">Active</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        {u.role !== 'admin' && (
                          <button
                            onClick={async () => {
                              await dbUpdateUserRole(u.id, 'admin');
                              setUsersList((prev) => prev.map((item) => (item.id === u.id ? { ...item, role: 'admin' } : item)));
                              showToast('Role Updated', `${u.username} is now an Admin.`, 'success');
                            }}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#FF4D6D]/15 text-[#FF4D6D] border border-[#FF4D6D]/30"
                          >
                            Make Admin
                          </button>
                        )}
                        {u.role !== 'creator' && (
                          <button
                            onClick={async () => {
                              await dbUpdateUserRole(u.id, 'creator');
                              setUsersList((prev) => prev.map((item) => (item.id === u.id ? { ...item, role: 'creator' } : item)));
                              showToast('Role Updated', `${u.username} is now a Creator.`, 'success');
                            }}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#8B5CFF]/15 text-[#8B5CFF] border border-[#8B5CFF]/30"
                          >
                            Make Creator
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            const newStatus = !u.isBanned;
                            await dbToggleBanUser(u.id, newStatus);
                            setUsersList((prev) => prev.map((item) => (item.id === u.id ? { ...item, isBanned: newStatus } : item)));
                            showToast(newStatus ? 'User Banned' : 'User Unbanned', '', 'info');
                          }}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20"
                        >
                          {u.isBanned ? 'Unban' : 'Ban'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 8. SITE SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 rounded-3xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3] max-w-2xl">
            <h3 className="text-base font-bold font-heading mb-1">Global Platform Settings</h3>
            <p className="text-xs text-[#A79FC0] mb-6">Configure website branding, announcement banner, and homepage features.</p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (siteSettings) {
                  await dbUpdateSiteSettings(siteSettings);
                  showToast('Settings Saved', 'Site configuration updated.', 'success');
                }
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-[#A79FC0] mb-1">Site Title / Brand</label>
                <input
                  type="text"
                  value={siteSettings?.siteName || 'Manga24'}
                  onChange={(e) => setSiteSettings(siteSettings ? { ...siteSettings, siteName: e.target.value } : null)}
                  className="w-full p-2.5 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#A79FC0] mb-1">Announcement Banner Text</label>
                <input
                  type="text"
                  value={siteSettings?.announcementText || ''}
                  onChange={(e) => setSiteSettings(siteSettings ? { ...siteSettings, announcementText: e.target.value } : null)}
                  className="w-full p-2.5 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="enableAnnouncement"
                  checked={siteSettings?.announcementEnabled ?? true}
                  onChange={(e) => setSiteSettings(siteSettings ? { ...siteSettings, announcementEnabled: e.target.checked } : null)}
                  className="w-4 h-4 rounded accent-[#FF4D6D]"
                />
                <label htmlFor="enableAnnouncement" className="font-semibold text-[#F5F1FF]">
                  Display announcement banner at top of site
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allowCreatorUploads"
                  checked={siteSettings?.allowCreatorSubmissions ?? true}
                  onChange={(e) => setSiteSettings(siteSettings ? { ...siteSettings, allowCreatorSubmissions: e.target.checked } : null)}
                  className="w-4 h-4 rounded accent-[#8B5CFF]"
                />
                <label htmlFor="allowCreatorUploads" className="font-semibold text-[#F5F1FF]">
                  Enable community Creator Upload portal
                </label>
              </div>

              <button
                type="submit"
                className="mt-4 px-6 py-2.5 rounded-xl font-heading font-bold text-xs bg-gradient-brand text-white shadow"
              >
                Save Settings
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SERIES CREATE / EDIT MODAL */}
      {seriesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-[#171122] border border-[#2C2340] shadow-2xl p-6 text-[#F5F1FF] max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold font-heading mb-4">
              {editingSeries ? `Edit Series: ${editingSeries.title}` : 'Publish New Series'}
            </h3>

            <form onSubmit={handleSaveSeries} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#A79FC0] mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={seriesForm.title}
                    onChange={(e) => setSeriesForm({ ...seriesForm, title: e.target.value })}
                    placeholder="e.g. Solo Astral Monarch"
                    className="w-full p-2.5 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#A79FC0] mb-1">Format Type</label>
                  <select
                    value={seriesForm.type}
                    onChange={(e) => setSeriesForm({ ...seriesForm, type: e.target.value as MangaType })}
                    className="w-full p-2.5 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-white"
                  >
                    <option value="Manga">Manga</option>
                    <option value="Manhwa">Manhwa</option>
                    <option value="Manhua">Manhua</option>
                    <option value="Webtoon">Webtoon</option>
                    <option value="Novel">Novel (Serialized Prose)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#A79FC0] mb-1">Alternative Titles (comma-separated)</label>
                <input
                  type="text"
                  value={seriesForm.altTitles}
                  onChange={(e) => setSeriesForm({ ...seriesForm, altTitles: e.target.value })}
                  placeholder="e.g. Star Sovereign, 星皇"
                  className="w-full p-2.5 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#A79FC0] mb-1">Synopsis</label>
                <textarea
                  rows={3}
                  value={seriesForm.synopsis}
                  onChange={(e) => setSeriesForm({ ...seriesForm, synopsis: e.target.value })}
                  placeholder="Compelling blurb for readers..."
                  className="w-full p-2.5 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#A79FC0] mb-1">Status</label>
                  <select
                    value={seriesForm.status}
                    onChange={(e) => setSeriesForm({ ...seriesForm, status: e.target.value as MangaStatus })}
                    className="w-full p-2.5 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-white"
                  >
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Hiatus">Hiatus</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#A79FC0] mb-1">Content Rating</label>
                  <select
                    value={seriesForm.contentRating}
                    onChange={(e) => setSeriesForm({ ...seriesForm, contentRating: e.target.value as ContentRating })}
                    className="w-full p-2.5 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-white"
                  >
                    <option value="Safe">Safe</option>
                    <option value="Suggestive">Suggestive</option>
                    <option value="Mature">Mature</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#A79FC0] mb-1">Author</label>
                  <input
                    type="text"
                    value={seriesForm.author}
                    onChange={(e) => setSeriesForm({ ...seriesForm, author: e.target.value })}
                    placeholder="Author name"
                    className="w-full p-2.5 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-white"
                  />
                </div>
              </div>

              {/* Genres Multi-Select */}
              <div>
                <label className="block font-semibold text-[#A79FC0] mb-1.5">Select Genres</label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-xl bg-[#0E0A14] border border-[#2C2340]">
                  {ALL_GENRES.map((g) => {
                    const isSelected = seriesForm.genres.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          setSeriesForm({
                            ...seriesForm,
                            genres: isSelected
                              ? seriesForm.genres.filter((item) => item !== g)
                              : [...seriesForm.genres, g],
                          });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                          isSelected
                            ? 'bg-[#FF4D6D] text-white'
                            : 'bg-[#171122] text-[#A79FC0] hover:text-white'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cover Image Upload / URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#A79FC0] mb-1">Cover Image</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={seriesForm.coverUrl}
                      onChange={(e) => setSeriesForm({ ...seriesForm, coverUrl: e.target.value })}
                      placeholder="Paste Image URL..."
                      className="flex-1 p-2 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-white text-xs"
                    />
                  </div>
                  <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[#8B5CFF]/40 bg-[#8B5CFF]/5 hover:bg-[#8B5CFF]/10 cursor-pointer transition">
                    <Upload className="w-4 h-4 text-[#8B5CFF]" />
                    <span className="text-xs font-bold text-[#8B5CFF]">
                      {uploadingCover ? 'Uploading...' : 'Upload Cover File'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                  </label>
                </div>

                <div>
                  <label className="block font-semibold text-[#A79FC0] mb-1">Banner Image (Optional)</label>
                  <input
                    type="text"
                    value={seriesForm.bannerUrl}
                    onChange={(e) => setSeriesForm({ ...seriesForm, bannerUrl: e.target.value })}
                    placeholder="Paste Banner URL..."
                    className="w-full p-2 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-white text-xs mb-2"
                  />
                  <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[#2C2340] hover:border-[#FF4D6D]/40 cursor-pointer transition">
                    <ImageIcon className="w-4 h-4 text-[#A79FC0]" />
                    <span className="text-xs font-bold text-[#A79FC0]">
                      {uploadingBanner ? 'Uploading...' : 'Upload Banner File'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-6 pt-2 border-t border-[#2C2340]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={seriesForm.featured}
                    onChange={(e) => setSeriesForm({ ...seriesForm, featured: e.target.checked })}
                    className="w-4 h-4 rounded accent-[#FF4D6D]"
                  />
                  <span className="font-bold">Featured on Homepage Hero</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={seriesForm.isDraft}
                    onChange={(e) => setSeriesForm({ ...seriesForm, isDraft: e.target.checked })}
                    className="w-4 h-4 rounded accent-amber-500"
                  />
                  <span className="font-bold text-amber-400">Save as Draft (Hidden from public)</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#2C2340]">
                <button
                  type="button"
                  onClick={() => setSeriesModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0E0A14] text-[#A79FC0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-xs font-heading font-bold bg-gradient-brand text-white shadow"
                >
                  {editingSeries ? 'Update Series' : 'Publish Series'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHAPTER CREATE / EDIT MODAL */}
      {chapterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-[#171122] border border-[#2C2340] shadow-2xl p-6 text-[#F5F1FF] max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#2C2340] mb-4">
              <div>
                <h3 className="text-lg font-bold font-heading">
                  {editingChapter ? `Edit Chapter ${editingChapter.number}` : 'Publish New Chapter'}
                </h3>
                <p className="text-xs text-[#A79FC0]">
                  Supports both graphic manga/webtoon pages and serialized novel prose
                </p>
              </div>

              {/* Format Switcher */}
              <div className="flex p-1 rounded-xl bg-[#0E0A14] border border-[#2C2340]">
                <button
                  type="button"
                  onClick={() => setChapterType('manga')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    chapterType === 'manga' ? 'bg-[#FF4D6D] text-white shadow' : 'text-[#A79FC0]'
                  }`}
                >
                  Manga / Webtoon (Images)
                </button>
                <button
                  type="button"
                  onClick={() => setChapterType('novel')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    chapterType === 'novel' ? 'bg-[#8B5CFF] text-white shadow' : 'text-[#A79FC0]'
                  }`}
                >
                  Novel (Rich Text Story)
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveChapter} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#A79FC0] mb-1">Chapter Number *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={chapterForm.number}
                    onChange={(e) => setChapterForm({ ...chapterForm, number: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#A79FC0] mb-1">Chapter Title</label>
                  <input
                    type="text"
                    value={chapterForm.title}
                    onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                    placeholder="e.g. Clash at the Obsidian Gate"
                    className="w-full p-2.5 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-white"
                  />
                </div>
              </div>

              {/* MANGA FORMAT: MULTIPLE IMAGE UPLOADER & REORDER */}
              {chapterType === 'manga' && (
                <div className="space-y-3 p-4 rounded-2xl bg-[#0E0A14] border border-[#2C2340]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#F5F1FF]">Chapter Page Images</h4>
                      <p className="text-[11px] text-[#A79FC0]">
                        Upload images in order. You can drag and drop or reorder pages below.
                      </p>
                    </div>
                    <span className="font-mono-meta text-xs text-[#FF4D6D] font-bold">
                      {chapterForm.pages.length} Pages
                    </span>
                  </div>

                  {/* Drop zone */}
                  <label className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-[#8B5CFF]/40 bg-[#8B5CFF]/5 hover:bg-[#8B5CFF]/10 cursor-pointer transition">
                    <Upload className="w-8 h-8 text-[#8B5CFF] mb-2" />
                    <span className="text-xs font-bold text-white">
                      {uploadingPages ? 'Uploading pages...' : 'Click or Drag & Drop Manga Pages Here'}
                    </span>
                    <span className="text-[10px] text-[#A79FC0] mt-0.5">Supports PNG, JPG, WebP</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePagesUpload}
                      disabled={uploadingPages}
                      className="hidden"
                    />
                  </label>

                  {/* Page previews & Reordering */}
                  {chapterForm.pages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-60 overflow-y-auto p-2">
                      {chapterForm.pages.map((url, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#2C2340] bg-[#171122]">
                          <img src={url} alt={`Page ${idx + 1}`} className="w-full h-24 object-cover" />
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-mono-meta font-bold text-white">
                            #{idx + 1}
                          </span>
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => movePage(idx, 'up')}
                                className="p-1 rounded bg-[#2C2340] text-white hover:bg-[#FF4D6D]"
                                title="Move Earlier"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                            )}
                            {idx < chapterForm.pages.length - 1 && (
                              <button
                                type="button"
                                onClick={() => movePage(idx, 'down')}
                                className="p-1 rounded bg-[#2C2340] text-white hover:bg-[#FF4D6D]"
                                title="Move Later"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removePage(idx)}
                              className="p-1 rounded bg-red-500/80 text-white hover:bg-red-600"
                              title="Delete Page"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* NOVEL FORMAT: RICH STORY EDITOR */}
              {chapterType === 'novel' && (
                <div className="space-y-3 p-4 rounded-2xl bg-[#0E0A14] border border-[#2C2340]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#F5F1FF]">Story Chapter Text</h4>
                      <p className="text-[11px] text-[#A79FC0]">
                        Full prose novel content with markdown formatting and reading time tracking.
                      </p>
                    </div>
                    <span className="font-mono-meta text-xs text-[#8B5CFF] font-bold">
                      {chapterForm.textContent.split(/\s+/).filter(Boolean).length} Words
                    </span>
                  </div>

                  {/* Formatting toolbar */}
                  <div className="flex flex-wrap gap-1 p-1.5 rounded-xl bg-[#171122] border border-[#2C2340]">
                    <button
                      type="button"
                      onClick={() => setChapterForm((p) => ({ ...p, textContent: p.textContent + '\n## Section Title\n' }))}
                      className="px-2 py-1 rounded text-[10px] font-bold bg-[#0E0A14] hover:bg-[#2C2340] text-[#A79FC0] hover:text-white"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onClick={() => setChapterForm((p) => ({ ...p, textContent: p.textContent + ' **bold text** ' }))}
                      className="px-2 py-1 rounded text-[10px] font-bold bg-[#0E0A14] hover:bg-[#2C2340] text-[#A79FC0] hover:text-white font-serif"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => setChapterForm((p) => ({ ...p, textContent: p.textContent + ' *italic text* ' }))}
                      className="px-2 py-1 rounded text-[10px] font-bold bg-[#0E0A14] hover:bg-[#2C2340] text-[#A79FC0] hover:text-white italic"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => setChapterForm((p) => ({ ...p, textContent: p.textContent + '\n> "Dialogue or quote"\n' }))}
                      className="px-2 py-1 rounded text-[10px] font-bold bg-[#0E0A14] hover:bg-[#2C2340] text-[#A79FC0] hover:text-white"
                    >
                      Quote
                    </button>
                    <button
                      type="button"
                      onClick={() => setChapterForm((p) => ({ ...p, textContent: p.textContent + '\n\n* * *\n\n' }))}
                      className="px-2 py-1 rounded text-[10px] font-bold bg-[#0E0A14] hover:bg-[#2C2340] text-[#A79FC0] hover:text-white"
                    >
                      Scene Divider
                    </button>
                  </div>

                  <textarea
                    rows={12}
                    value={chapterForm.textContent}
                    onChange={(e) => setChapterForm({ ...chapterForm, textContent: e.target.value })}
                    placeholder="Write or paste your story chapter here. Use paragraphs and dialogue quotes freely..."
                    className="w-full p-4 rounded-xl bg-[#171122] border border-[#2C2340] text-xs text-[#F5F1FF] font-sans leading-relaxed focus:outline-none focus:border-[#8B5CFF]"
                  />
                </div>
              )}

              {/* Draft Mode & Schedule */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#2C2340]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={chapterForm.isDraft}
                    onChange={(e) => setChapterForm({ ...chapterForm, isDraft: e.target.checked })}
                    className="w-4 h-4 rounded accent-amber-500"
                  />
                  <span className="font-bold text-amber-400">Draft Mode (Hold publication)</span>
                </label>

                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#A79FC0]" />
                  <label className="text-[11px] text-[#A79FC0]">Schedule Date/Time:</label>
                  <input
                    type="datetime-local"
                    value={chapterForm.scheduledAt}
                    onChange={(e) => setChapterForm({ ...chapterForm, scheduledAt: e.target.value })}
                    className="p-1.5 rounded-lg bg-[#0E0A14] border border-[#2C2340] text-[11px] text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#2C2340]">
                <button
                  type="button"
                  onClick={() => setChapterModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0E0A14] text-[#A79FC0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-xs font-heading font-bold bg-gradient-brand text-white shadow"
                >
                  {editingChapter ? 'Update Chapter' : 'Publish Chapter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
