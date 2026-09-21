import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CommunityPost } from '../types';
import { useAppStore } from '../store/useAppStore';
import {
  MessageSquare,
  Trophy,
  Plus,
  Search,
  ThumbsUp,
  Eye,
  Filter,
  CheckCircle,
  Flame,
  Award,
  Sparkles,
} from 'lucide-react';

const categories = [
  'All',
  'General',
  'Chapter Discussions',
  'Recommendations',
  'Creator News',
  'Bug Reports',
];

export const CommunityPage: React.FC = () => {
  const { user, showToast } = useAppStore();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'discussions' | 'leaderboard'>('discussions');
  const [newPostModal, setNewPostModal] = useState(false);

  // New post form fields
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState('General');
  const [postContent, setPostContent] = useState('');

  useEffect(() => {
    async function loadPosts() {
      const p = await api.getCommunityPosts(selectedCategory);
      setPosts(p);
    }
    loadPosts();
  }, [selectedCategory]);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;

    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      title: postTitle.trim(),
      authorName: user?.username || 'CommunityMember',
      authorAvatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80',
      authorBadge: user?.role || 'Reader',
      category: postCategory as any,
      excerpt: postContent.slice(0, 140) + '...',
      replyCount: 0,
      viewCount: 1,
      likes: 1,
      createdAt: 'Just now',
    };

    setPosts([newPost, ...posts]);
    setPostTitle('');
    setPostContent('');
    setNewPostModal(false);
    showToast('Post Published', 'Your topic is now live on the forum!', 'success');
  };

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (p.excerpt || p.content || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      p.authorName.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-[#F5F1FF] light:text-[#1A1429]">
            Manhwa24 Community Hub
          </h1>
          <p className="text-xs sm:text-sm text-[#A79FC0] light:text-[#6E6288] mt-1">
            Connect with 50,000+ manga readers, scanlators, and webtoon creators 24/7
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1 rounded-xl bg-[#171122] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] flex items-center">
            <button
              onClick={() => setActiveTab('discussions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'discussions'
                  ? 'bg-gradient-brand text-white shadow-sm'
                  : 'text-[#A79FC0] light:text-[#6E6288]'
              }`}
            >
              Discussions
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                activeTab === 'leaderboard'
                  ? 'bg-gradient-brand text-white shadow-sm'
                  : 'text-[#A79FC0] light:text-[#6E6288]'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Leaderboard</span>
            </button>
          </div>

          <button
            onClick={() => setNewPostModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-brand text-white font-heading font-bold text-xs shadow-md active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Topic</span>
          </button>
        </div>
      </div>

      {activeTab === 'discussions' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Topics Feed */}
          <div className="lg:col-span-8 space-y-4">
            {/* Search and Category Filter */}
            <div className="p-3.5 rounded-2xl bg-[#171122] border border-[#2C2340] light:bg-white light:border-[#E2D9F3] space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-[#A79FC0] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search community discussions, theories, recommendations..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] focus:outline-none focus:border-[#FF4D6D]"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCategory(c)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition ${
                      selectedCategory === c
                        ? 'bg-[#FF4D6D] text-white shadow-sm'
                        : 'bg-[#0E0A14] hover:bg-[#1F1830] light:bg-[#F3EEFC] text-[#A79FC0] light:text-[#6E6288]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Posts List */}
            <div className="space-y-3">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#171122] border border-[#2C2340] light:bg-white light:border-[#E2D9F3] hover:border-[#FF4D6D]/40 transition group shadow-md"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono-meta font-bold px-2 py-0.5 rounded bg-[#8B5CFF]/20 text-[#8B5CFF]">
                        {post.category}
                      </span>
                      <span className="text-[10px] text-[#A79FC0] light:text-[#6E6288] font-mono-meta">
                        {post.createdAt}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#A79FC0] light:text-[#6E6288] font-mono-meta">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {post.viewCount}
                      </span>
                      <span className="flex items-center gap-1 text-[#FF4D6D]">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        {post.likes}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold font-heading text-[#F5F1FF] light:text-[#1A1429] group-hover:text-[#FF4D6D] transition mb-1">
                    {post.title}
                  </h3>

                  <p className="text-xs text-[#A79FC0] light:text-[#6E6288] line-clamp-2 leading-relaxed mb-3">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-[#2C2340]/60 light:border-[#E2D9F3]">
                    <div className="flex items-center gap-2">
                      <img
                        src={post.authorAvatar}
                        alt={post.authorName}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-xs font-semibold text-[#F5F1FF] light:text-[#1A1429]">
                        {post.authorName}
                      </span>
                      <span className="text-[9px] font-mono-meta px-1.5 py-0.5 rounded bg-[#FF9F1C]/20 text-[#FF9F1C]">
                        {post.authorBadge}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[#FF9F1C] font-semibold">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{post.replyCount} Replies</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Forum Rules & Guidelines */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-4 rounded-2xl bg-[#171122] border border-[#2C2340] light:bg-white light:border-[#E2D9F3] shadow-lg space-y-3">
              <h4 className="text-xs font-bold font-heading text-[#F5F1FF] light:text-[#1A1429] uppercase tracking-wider">
                Community Rules
              </h4>
              <ul className="space-y-2 text-xs text-[#A79FC0] light:text-[#6E6288] list-disc list-inside leading-relaxed">
                <li>Always use the spoiler tag for recent raw chapters.</li>
                <li>Respect creators and authorized publishers.</li>
                <li>No hate speech, toxic flame wars, or piracy leaks.</li>
                <li>Keep discussion threads in relevant categories.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FF4D6D]/15 via-[#171122] to-[#1F1830] border border-[#FF4D6D]/30 light:from-[#FF4D6D]/10 light:to-white light:border-[#FF4D6D]/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#FF4D6D]" />
                <h4 className="text-xs font-bold font-heading text-[#F5F1FF] light:text-[#1A1429]">
                  Creator Verification
                </h4>
              </div>
              <p className="text-xs text-[#A79FC0] light:text-[#6E6288] mb-3 leading-relaxed">
                Are you a creator or authorized publisher? Verify your account to unlock direct chapter uploads and reader analytics.
              </p>
              <a
                href="/upload-request"
                className="inline-block w-full py-2 rounded-xl bg-gradient-brand text-white font-heading font-bold text-xs text-center shadow-md"
              >
                Apply for Group Badge
              </a>
            </div>
          </div>
        </div>
      ) : (
        /* Creator leaderboard view */
        <div className="max-w-3xl mx-auto p-6 rounded-3xl bg-[#171122] border border-[#2C2340] light:bg-white light:border-[#E2D9F3] shadow-xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#2C2340]/60 light:border-[#E2D9F3]">
            <div className="w-10 h-10 rounded-2xl bg-[#FF9F1C] flex items-center justify-center text-black shadow-lg">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-[#F5F1FF] light:text-[#1A1429]">
                Top Creators & Uploaders
              </h2>
              <p className="text-xs text-[#A79FC0] light:text-[#6E6288]">
                Ranked by weekly releases and community quality score
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-8 text-center rounded-2xl bg-[#0E0A14] light:bg-[#F3EEFC] border border-dashed border-[#2C2340] light:border-[#E2D9F3]">
              <Trophy className="w-8 h-8 text-[#A79FC0] mx-auto mb-2 opacity-40" />
              <p className="text-xs font-bold text-[#F5F1FF] light:text-[#1A1429]">
                No creator data yet
              </p>
              <p className="text-[11px] text-[#A79FC0] light:text-[#6E6288] max-w-sm mx-auto mt-1">
                As creators publish chapters on Manhwa24, real-time release rankings and leaderboards will appear here.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* New Post Modal */}
      {newPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#171122] border border-[#2C2340] p-6 shadow-2xl text-[#F5F1FF] light:bg-white light:border-[#E2D9F3] light:text-[#1A1429]">
            <h3 className="text-base font-bold font-heading mb-4">Start New Community Discussion</h3>
            <form onSubmit={handleCreatePost} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#A79FC0] mb-1">Topic Title</label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. Chapter 68 Theory: The Astral Monarch's Identity"
                  className="w-full p-2.5 rounded-xl text-xs bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] focus:outline-none focus:border-[#FF4D6D]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A79FC0] mb-1">Category</label>
                <select
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-xs bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3]"
                >
                  {categories.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A79FC0] mb-1">Post Content</label>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={4}
                  placeholder="Write your discussion points, thoughts, or review..."
                  className="w-full p-2.5 rounded-xl text-xs bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] focus:outline-none focus:border-[#FF4D6D] resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewPostModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#1F1830] text-xs font-semibold text-[#A79FC0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!postTitle.trim() || !postContent.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-brand text-white text-xs font-bold font-heading shadow-md disabled:opacity-40"
                >
                  Publish Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
