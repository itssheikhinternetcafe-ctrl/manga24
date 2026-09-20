import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import {
  dbCreateChapter,
  dbCreateSeries,
  dbGetChapters,
  dbGetSeriesByAuthor,
  dbUpdateChapter,
  dbUpdateSeries,
} from '../services/db';
import { uploadMediaFile } from '../firebase';
import { MangaType, Series, StoryApprovalStatus } from '../types';
import {
  BookOpen,
  Check,
  Edit3,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Save,
  Upload,
  User,
  X,
} from 'lucide-react';

const WRITER_GENRES = ['Action', 'Fantasy', 'Romance', 'Isekai', 'Martial Arts', 'Sci-Fi'];
const WRITER_TYPES: { value: MangaType; label: string }[] = [
  { value: 'Manga', label: 'Manga' },
  { value: 'Manhwa', label: 'Manhwa' },
  { value: 'Manhua', label: 'Manhua' },
  { value: 'Webtoon', label: 'Webtoon' },
  { value: 'Novel', label: 'Web novel' },
];

type DashboardView = 'overview' | 'new' | 'comments' | 'profile';

const statusLabel: Record<string, string> = {
  published: 'Published',
  pending: 'In review',
  draft: 'Draft',
  rejected: 'Rejected',
  approved: 'Published',
};

const statusClass: Record<string, string> = {
  published: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  draft: 'bg-[#A79FC0]/15 text-[#A79FC0] border-[#A79FC0]/30',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export const WriterDashboardPage: React.FC = () => {
  const { user, setAuthModalOpen, showToast } = useAppStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<DashboardView>(searchParams.get('edit') ? 'new' : 'overview');
  const [stories, setStories] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPages, setUploadingPages] = useState(false);
  const [pageUploadProgress, setPageUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [editingStory, setEditingStory] = useState<Series | null>(null);
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    type: 'Manga' as MangaType,
    genres: [] as string[],
    description: '',
    coverUrl: '',
    chapterTitle: 'Chapter 1',
    pages: [] as string[],
    textContent: '',
  });

  const loadStories = async () => {
    if (!user) return;
    setLoading(true);
    try {
      setStories((await dbGetSeriesByAuthor(user.id)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    } catch {
      setError('Could not load your stories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, [user?.id]);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || stories.length === 0) return;
    const story = stories.find((item) => item.id === editId);
    if (story) openEditor(story);
  }, [searchParams, stories]);

  const openEditor = async (story?: Series) => {
    setError('');
    setEditingStory(story || null);
    setChapterId(null);
    if (!story) {
      setForm({
        title: '',
        type: 'Manga',
        genres: [],
        description: '',
        coverUrl: '',
        chapterTitle: 'Chapter 1',
        pages: [],
        textContent: '',
      });
      setView('new');
      return;
    }

    const chapters = await dbGetChapters(story.id, true);
    const firstChapter = chapters.find((chapter) => chapter.number === 1) || chapters[0];
    setChapterId(firstChapter?.id || null);
    setForm({
      title: story.title,
      type: story.type,
      genres: story.genres || [],
      description: story.synopsis || '',
      coverUrl: story.coverUrl || story.coverImage || '',
      chapterTitle: firstChapter?.title || 'Chapter 1',
      pages: firstChapter?.pages || [],
      textContent: firstChapter?.textContent || '',
    });
    setView('new');
  };

  const updateForm = (field: keyof typeof form, value: string | string[]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      updateForm('coverUrl', await uploadMediaFile(file, 'writer_covers'));
      showToast('Cover ready', 'Your cover image was added.', 'success');
    } catch {
      setError('The cover could not be uploaded. Please try another image.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handlePagesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setUploadingPages(true);
    setPageUploadProgress('');
    try {
      const urls: string[] = [];
      for (let index = 0; index < files.length; index += 1) {
        setPageUploadProgress(`Uploading ${index + 1} of ${files.length}`);
        urls.push(await uploadMediaFile(files[index], 'writer_chapters'));
      }
      updateForm('pages', [...form.pages, ...urls]);
      showToast('Pages ready', `${urls.length} page image(s) added.`, 'success');
    } catch {
      setError('One or more pages could not be uploaded. Please try again.');
    } finally {
      setUploadingPages(false);
      setPageUploadProgress('');
    }
  };

  const saveStory = async (approvalStatus: StoryApprovalStatus) => {
    if (!user) return;
    setError('');
    if (!form.title.trim() || !form.description.trim() || !form.coverUrl.trim()) {
      setError('Please add a title, cover image, and description.');
      return;
    }
    if (form.genres.length === 0) {
      setError('Please choose at least one genre.');
      return;
    }
    if (form.type === 'Novel' ? !form.textContent.trim() : form.pages.length === 0) {
      setError(form.type === 'Novel' ? 'Please write Chapter 1.' : 'Please upload at least one Chapter 1 page.');
      return;
    }

    setSaving(true);
    try {
      const story = editingStory
        ? await dbUpdateSeries(editingStory.id, {
            title: form.title.trim(),
            type: form.type,
            genres: form.genres,
            synopsis: form.description.trim(),
            coverUrl: form.coverUrl,
            approvalStatus,
            isDraft: approvalStatus !== 'published',
            authorId: user.id,
            authorName: user.username,
            creatorId: user.id,
          })
        : await dbCreateSeries({
            title: form.title.trim(),
            type: form.type,
            genres: form.genres,
            synopsis: form.description.trim(),
            coverUrl: form.coverUrl,
            author: user.username,
            authorId: user.id,
            authorName: user.username,
            creatorId: user.id,
            approvalStatus,
            isDraft: approvalStatus !== 'published',
          });

      if (!story) throw new Error('Story could not be saved.');
      const chapterData = {
        seriesId: story.id,
        number: 1,
        title: form.chapterTitle.trim() || 'Chapter 1',
        pages: form.type === 'Novel' ? [] : form.pages,
        textContent: form.type === 'Novel' ? form.textContent : '',
        isDraft: approvalStatus !== 'published',
        approvalStatus,
        creatorId: user.id,
        authorId: user.id,
        authorName: user.username,
      } as const;

      if (chapterId) await dbUpdateChapter(chapterId, chapterData);
      else await dbCreateChapter(chapterData);

      showToast(approvalStatus === 'pending' ? 'Submitted for review' : 'Draft saved', approvalStatus === 'pending' ? 'An admin will review your story.' : 'Your story is saved privately.', 'success');
      await loadStories();
      setView('overview');
      navigate('/writer');
    } catch (err: any) {
      setError(err.message || 'Could not save your story.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#171122] border border-[#2C2340] text-center">
          <BookOpen className="w-10 h-10 text-[#FF4D6D] mx-auto mb-4" />
          <h1 className="text-xl font-black font-heading mb-2">Writer Dashboard</h1>
          <p className="text-xs text-[#A79FC0] mb-5">Sign in to create and manage your stories.</p>
          <button onClick={() => setAuthModalOpen(true)} className="px-4 py-2.5 rounded-xl bg-gradient-brand text-white text-xs font-bold">Sign in</button>
        </div>
      </div>
    );
  }

  const totalReads = stories.reduce((sum, story) => sum + (story.views || 0), 0);
  const totalFollowers = stories.reduce((sum, story) => sum + (story.followersCount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 text-[#F5F1FF] light:text-[#1A1429]">
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-56 shrink-0">
          <div className="lg:sticky lg:top-24 p-3 rounded-2xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3]">
            <div className="px-3 py-3 border-b border-[#2C2340] light:border-[#E2D9F3] mb-2">
              <p className="text-[10px] uppercase tracking-wider text-[#8B5CFF] font-bold">Writer Dashboard</p>
              <p className="text-sm font-bold font-heading truncate mt-1">{user.username}</p>
            </div>
            {([
              ['overview', 'Overview', LayoutDashboard],
              ['new', 'New story', Plus],
              ['comments', 'Comments', MessageSquare],
              ['profile', 'Profile', User],
            ] as const).map(([key, label, Icon]) => (
              <button key={key} onClick={() => setView(key)} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition ${view === key ? 'bg-[#FF4D6D] text-white' : 'text-[#A79FC0] hover:bg-[#1F1830] light:hover:bg-[#F3EEFC]'}`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
            <Link to="/creator-upload" className="flex items-center gap-2 px-3 py-2.5 mt-2 rounded-xl text-xs font-semibold text-[#8B5CFF] hover:bg-[#8B5CFF]/10"><Upload className="w-4 h-4" />Existing Submit Work</Link>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          {view === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-3"><div><h1 className="text-2xl font-black font-heading">Overview</h1><p className="text-xs text-[#A79FC0] mt-1">Your stories, reads, and review status.</p></div><button onClick={() => openEditor()} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-brand text-white text-xs font-bold"><Plus className="w-4 h-4" />New story</button></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[['Stories', stories.length], ['Total reads', totalReads.toLocaleString()], ['Followers', totalFollowers.toLocaleString()]].map(([label, value]) => <div key={label} className="p-4 rounded-2xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3]"><p className="text-xs text-[#A79FC0]">{label}</p><p className="text-2xl font-black font-heading mt-2">{value}</p></div>)}
              </div>
              <section className="rounded-2xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3] overflow-hidden"><div className="p-4 border-b border-[#2C2340] light:border-[#E2D9F3]"><h2 className="font-bold font-heading">My stories</h2></div>{loading ? <p className="p-8 text-center text-xs text-[#A79FC0]">Loading your stories...</p> : stories.length === 0 ? <div className="p-10 text-center text-xs text-[#A79FC0]">You have not created a story yet.</div> : <div className="divide-y divide-[#2C2340]/60 light:divide-[#E2D9F3]">{stories.map((story) => <div key={story.id} className="p-3 sm:p-4 flex items-center gap-3"><img src={story.coverUrl || story.coverImage} alt="" className="w-11 h-14 object-cover rounded-lg shrink-0 bg-[#0E0A14]" /><div className="flex-1 min-w-0"><p className="font-bold text-sm truncate">{story.title}</p><p className="text-[11px] text-[#A79FC0] mt-1">{story.type} · {story.totalChapters || 0} chapters · {(story.views || 0).toLocaleString()} reads</p>{story.approvalStatus === 'rejected' && story.rejectionReason && <p className="text-[11px] text-red-400 mt-1 truncate">Reason: {story.rejectionReason}</p>}</div><span className={`hidden sm:inline-block px-2 py-1 rounded-full border text-[10px] font-bold ${statusClass[story.approvalStatus || 'draft']}`}>{statusLabel[story.approvalStatus || 'draft']}</span><button onClick={() => openEditor(story)} className="p-2 rounded-lg text-[#FF9F1C] hover:bg-[#FF9F1C]/10" title="Edit story"><Edit3 className="w-4 h-4" /></button></div>)}</div>}</section>
            </div>
          )}

          {view === 'new' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 className="text-2xl font-black font-heading">{editingStory ? 'Edit story' : 'New story'}</h1><p className="text-xs text-[#A79FC0] mt-1">Save privately or send it to admin review.</p></div><div className="flex gap-2"><button disabled={saving} onClick={() => saveStory('draft')} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#2C2340] text-xs font-bold"><Save className="w-4 h-4" />Save draft</button><button disabled={saving} onClick={() => saveStory('pending')} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-brand text-white text-xs font-bold"><Check className="w-4 h-4" />Submit for review</button></div></div>
              {error && <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{error}</div>}
              <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5"><section className="p-4 rounded-2xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3] h-fit"><label className="text-xs font-bold block mb-2">Cover image</label><div className="aspect-[3/4] rounded-xl border border-dashed border-[#8B5CFF]/40 bg-[#0E0A14] light:bg-[#F3EEFC] overflow-hidden flex items-center justify-center">{form.coverUrl ? <img src={form.coverUrl} alt="Cover preview" className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-[#8B5CFF]/60" />}</div><label className="mt-3 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#8B5CFF]/15 text-[#8B5CFF] text-xs font-bold cursor-pointer"><Upload className="w-4 h-4" />{uploadingCover ? 'Uploading...' : 'Upload cover'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleCoverUpload} className="hidden" /></label></section><section className="p-4 rounded-2xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3] space-y-4"><div><label className="text-xs font-bold block mb-1.5">Title</label><input value={form.title} onChange={(e) => updateForm('title', e.target.value)} className="writer-input" placeholder="Story title" /></div><div><label className="text-xs font-bold block mb-1.5">Type</label><select value={form.type} onChange={(e) => updateForm('type', e.target.value)} className="writer-input">{WRITER_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div><div><label className="text-xs font-bold block mb-1.5">Genres</label><div className="flex flex-wrap gap-2">{WRITER_GENRES.map((genre) => <button type="button" key={genre} onClick={() => updateForm('genres', form.genres.includes(genre) ? form.genres.filter((item) => item !== genre) : [...form.genres, genre])} className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold ${form.genres.includes(genre) ? 'bg-[#8B5CFF] border-[#8B5CFF] text-white' : 'border-[#2C2340] text-[#A79FC0]'}`}>{genre}</button>)}</div></div><div><label className="text-xs font-bold block mb-1.5">Description</label><textarea rows={6} value={form.description} onChange={(e) => updateForm('description', e.target.value)} className="writer-input resize-y" placeholder="Tell readers what your story is about..." /></div></section></div>
              <section className="p-4 rounded-2xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3] space-y-4"><div className="flex items-center justify-between"><div><h2 className="font-bold font-heading">Chapter 1</h2><p className="text-[11px] text-[#A79FC0]">Add the first chapter before submitting.</p></div><FileText className="w-5 h-5 text-[#FF9F1C]" /></div><input value={form.chapterTitle} onChange={(e) => updateForm('chapterTitle', e.target.value)} className="writer-input" placeholder="Chapter title" /><div className="flex gap-2"><button type="button" onClick={() => updateForm('textContent', form.textContent)} className={`px-3 py-2 rounded-lg text-xs font-bold ${form.type === 'Novel' ? 'bg-[#FF9F1C] text-[#171122]' : 'bg-[#0E0A14] text-[#A79FC0]'}`}>Write text</button><label className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer ${form.type !== 'Novel' ? 'bg-[#8B5CFF] text-white' : 'bg-[#0E0A14] text-[#A79FC0]'}`}><Upload className="w-3.5 h-3.5 inline mr-1" />Upload pages<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handlePagesUpload} className="hidden" /></label></div>{form.type === 'Novel' ? <textarea rows={14} value={form.textContent} onChange={(e) => updateForm('textContent', e.target.value)} className="writer-input resize-y" placeholder="Write Chapter 1 here..." /> : <div className="flex flex-wrap gap-2">{form.pages.map((page, index) => <div key={`${page}-${index}`} className="relative"><img src={page} alt={`Page ${index + 1}`} className="w-16 h-20 object-cover rounded-lg" /><button type="button" onClick={() => updateForm('pages', form.pages.filter((_, item) => item !== index))} className="absolute -right-1 -top-1 rounded-full bg-red-500 text-white p-0.5"><X className="w-3 h-3" /></button></div>)}{uploadingPages && <span className="text-xs text-[#A79FC0]">{pageUploadProgress || 'Uploading...'}</span>}</div>}</section>
            </div>
          )}

          {view === 'comments' && <EmptyPanel icon={MessageSquare} title="Comments" text="Comments on your published stories will appear here." />}
          {view === 'profile' && <div className="p-6 rounded-2xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3]"><User className="w-7 h-7 text-[#FF9F1C] mb-3" /><h2 className="text-lg font-bold font-heading">Writer profile</h2><p className="text-xs text-[#A79FC0] mt-2">{user.username} · {user.email}</p><p className="text-xs text-[#A79FC0] mt-1">Joined {user.joinedDate}</p></div>}
        </main>
      </div>
    </div>
  );
};

const EmptyPanel: React.FC<{ icon: React.ElementType; title: string; text: string }> = ({ icon: Icon, title, text }) => (
  <div className="p-10 text-center rounded-2xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3]"><Icon className="w-8 h-8 text-[#8B5CFF] mx-auto mb-3" /><h2 className="font-bold font-heading">{title}</h2><p className="text-xs text-[#A79FC0] mt-2">{text}</p></div>
);
