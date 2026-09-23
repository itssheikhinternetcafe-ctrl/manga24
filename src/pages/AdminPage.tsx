import React, { useEffect, useMemo, useState } from 'react';
import { LayoutDashboard, BookOpen, Users, ClipboardList, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { AdminLoginForm } from '../components/admin/AdminLoginForm';
import { AdminOverview } from '../components/admin/AdminOverview';
import { AdminStoriesTable } from '../components/admin/AdminStoriesTable';
import { AdminWritersPanel } from '../components/admin/AdminWritersPanel';
import { AdminLogsTable } from '../components/admin/AdminLogsTable';
import { ConfirmActionModal } from '../components/admin/ConfirmActionModal';
import { AdminLog, Series, UserProfile } from '../types';
import { dbGetAdminLogs, dbGetSeries, dbGetUsers } from '../services/db';
import { deleteStoryPermanently, moderateStory, moderateWriter } from '../services/admin';

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'stories', label: 'Stories', icon: BookOpen },
  { id: 'writers', label: 'Writers', icon: Users },
  { id: 'logs', label: 'Logs', icon: ClipboardList },
] as const;
type Tab = typeof tabs[number]['id'];

export const AdminPage: React.FC = () => {
  const { user, showToast } = useAppStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [stories, setStories] = useState<Series[]>([]);
  const [writers, setWriters] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [query, setQuery] = useState('');
  const [rating, setRating] = useState('all');
  const [status, setStatus] = useState('all');
  const [flagged, setFlagged] = useState('all');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Series | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [seriesResult, usersResult, logsResult] = await Promise.all([dbGetSeries({ includeAdult: true }, true), dbGetUsers(), dbGetAdminLogs()]);
      setStories(seriesResult.items);
      setWriters(usersResult.filter((writer) => writer.role === 'creator' || seriesResult.items.some((story) => story.authorId === writer.id)));
      setLogs(logsResult);
    } catch (error) {
      showToast('Dashboard error', error instanceof Error ? error.message : 'Could not load admin data.', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (user?.role === 'admin') void load(); }, [user?.id, user?.role]);

  const filteredStories = useMemo(() => stories.filter((story) => {
    const text = query.trim().toLowerCase();
    return (!text || story.title.toLowerCase().includes(text) || (story.authorName || story.author).toLowerCase().includes(text)) &&
      (rating === 'all' || story.contentRating === rating) &&
      (status === 'all' || (status === 'published' && story.moderationStatus !== 'suspended' && story.approvalStatus !== 'draft') || (status === 'suspended' && story.moderationStatus === 'suspended') || (status === 'draft' && story.approvalStatus === 'draft')) &&
      (flagged === 'all' || (flagged === 'flagged' && story.flaggedForReview) || (flagged === 'clear' && !story.flaggedForReview));
  }), [stories, query, rating, status, flagged]);

  if (!user || user.role !== 'admin') return <AdminLoginForm />;

  const updateStory = async (story: Series, updates: Partial<Series>) => {
    try { await moderateStory(story, updates); showToast('Story updated', `${story.title} moderation settings saved.`, 'success'); await load(); }
    catch (error) { showToast('Update failed', error instanceof Error ? error.message : 'The story could not be updated.', 'error'); }
  };
  const updateWriter = async (writer: UserProfile, creatorStatus: 'active' | 'suspended' | 'banned') => {
    try { await moderateWriter(writer, creatorStatus); showToast('Writer updated', `${writer.username} is now ${creatorStatus}.`, 'success'); await load(); }
    catch (error) { showToast('Update failed', error instanceof Error ? error.message : 'The writer could not be updated.', 'error'); }
  };
  const deleteStory = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try { await deleteStoryPermanently(pendingDelete, async (url) => { const token = await (await import('../firebase')).auth?.currentUser?.getIdToken(); const response = await fetch('/api/admin/delete-cloudinary-asset', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ url }) }); if (!response.ok) throw new Error('The cover asset could not be deleted.'); }); showToast('Story deleted', `${pendingDelete.title} and its chapters were removed.`, 'success'); setPendingDelete(null); await load(); }
    catch (error) { showToast('Delete failed', error instanceof Error ? error.message : 'The story could not be deleted.', 'error'); }
    finally { setDeleting(false); }
  };

  return <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 text-[#F5F1FF] sm:px-6 lg:px-8"><header className="mb-6 flex flex-col justify-between gap-4 border-b border-[#2C2340] pb-6 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF4D6D]"><ShieldCheck className="h-4 w-4" /> Admin control center</div><h1 className="font-heading text-3xl font-black">Manhwa24 moderation</h1><p className="mt-2 text-sm text-[#A79FC0]">Review stories, creators, and every administrative action.</p></div><button onClick={() => void load()} className="flex items-center gap-2 self-start rounded-lg border border-[#3A294A] px-3 py-2 text-xs font-bold text-[#A79FC0] hover:text-white"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button></header><nav className="mb-6 flex gap-2 overflow-x-auto border-b border-[#2C2340] pb-2">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-xs font-bold ${tab === id ? 'bg-[#FF4D6D] text-white' : 'text-[#A79FC0] hover:bg-white/5 hover:text-white'}`}><Icon className="h-4 w-4" />{label}</button>)}</nav>{tab === 'overview' && <><AdminOverview stories={stories} writers={writers} /><div className="mt-6"><AdminStoriesTable stories={stories} onModerate={updateStory} onDelete={setPendingDelete} /></div></>}{tab === 'stories' && <><div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto_auto_auto]"><label className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-[#A79FC0]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or author" className="w-full rounded-lg border border-[#3A294A] bg-[#171122] py-2.5 pl-9 pr-3 text-xs text-white outline-none focus:border-[#FF4D6D]" /></label><select value={rating} onChange={(event) => setRating(event.target.value)} className="rounded-lg border border-[#3A294A] bg-[#171122] px-3 text-xs"><option value="all">All ratings</option><option value="safe">Safe</option><option value="16+">Mature</option><option value="18+">18+</option></select><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-[#3A294A] bg-[#171122] px-3 text-xs"><option value="all">All statuses</option><option value="published">Published</option><option value="suspended">Suspended</option><option value="draft">Draft</option></select><select value={flagged} onChange={(event) => setFlagged(event.target.value)} className="rounded-lg border border-[#3A294A] bg-[#171122] px-3 text-xs"><option value="all">All review states</option><option value="flagged">Flagged</option><option value="clear">Not flagged</option></select></div><AdminStoriesTable stories={filteredStories} onModerate={updateStory} onDelete={setPendingDelete} /></>}{tab === 'writers' && <AdminWritersPanel writers={writers} stories={stories} onStatus={updateWriter} />}{tab === 'logs' && <AdminLogsTable logs={logs} />}<ConfirmActionModal open={Boolean(pendingDelete)} title="Delete story permanently?" message={`This removes ${pendingDelete?.title || 'the story'}, all associated chapters, and its cover asset. This action cannot be undone.`} confirmLabel="Delete permanently" busy={deleting} onCancel={() => setPendingDelete(null)} onConfirm={() => void deleteStory()} /></div>;
};
