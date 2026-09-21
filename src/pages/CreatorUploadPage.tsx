import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { dbCreateSeries, dbCreateChapter } from '../services/db';
import { uploadMediaFile } from '../firebase';
import { ContentRating, MangaType, ALL_GENRES, UploadDeclarations } from '../types';
import { Upload, Sparkles, CheckCircle2, ShieldAlert, ArrowRight, BookOpen, FileText } from 'lucide-react';

export const CreatorUploadPage: React.FC = () => {
  const { user, requestCreatorRole, showToast } = useAppStore();

  const [submissionType, setSubmissionType] = useState<'series' | 'chapter'>('series');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Series Form
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [type, setType] = useState<MangaType>('Webtoon');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Fantasy', 'Action']);
  const [coverUrl, setCoverUrl] = useState('');
  const [contentRating, setContentRating] = useState<ContentRating>('safe');
  const [declarations, setDeclarations] = useState<UploadDeclarations>({
    originalCreator: false,
    adultCharacters: false,
    noRealPeople: false,
    acceptsPolicies: false,
    acceptedAt: '',
  });
  const [uploadingCover, setUploadingCover] = useState(false);

  // Chapter Form
  const [seriesId, setSeriesId] = useState('');
  const [chapterNum, setChapterNum] = useState(1);
  const [chapterTitle, setChapterTitle] = useState('');
  const [textContent, setTextContent] = useState('');

  const isCreator = user?.role === 'creator' || user?.role === 'admin';

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadMediaFile(file, 'creator_submissions');
      setCoverUrl(url);
      showToast('Cover Uploaded', 'Cover processed.', 'success');
    } catch {
      showToast('Upload Error', 'Failed to upload cover.', 'error');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSeriesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (user?.isBanned || (user?.strikes || 0) >= 3) {
      showToast('Upload Disabled', 'This account is banned from uploading.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await dbCreateSeries({
        title: title.trim(),
        synopsis: synopsis.trim(),
        type,
        genres: selectedGenres,
        contentRating,
        coverUrl: coverUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
        author: user?.username || 'Creator',
        creatorId: user?.id,
        approvalStatus: user?.role === 'admin' || contentRating !== '18+' || (user?.approvedAdultChapters || 0) >= 2 ? 'published' : 'pending',
        isDraft: user?.role !== 'admin' && contentRating === '18+' && (user?.approvedAdultChapters || 0) < 2,
        uploadedBy: user?.id,
        uploadedAt: new Date().toISOString(),
        uploadDeclarations: { ...declarations, acceptedAt: new Date().toISOString() },
      });
      setSuccessMessage(
        user?.role === 'admin'
          ? `Series "${title}" published immediately!`
          : `Series "${title}" submitted to the editorial review queue. Our moderators will verify originality and approve it shortly.`
      );
      setTitle('');
      setSynopsis('');
      setCoverUrl('');
      setContentRating('safe');
      setDeclarations({ originalCreator: false, adultCharacters: false, noRealPeople: false, acceptsPolicies: false, acceptedAt: '' });
      showToast('Submitted', 'Series submitted successfully.', 'success');
    } catch {
      showToast('Error', 'Submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isCreator) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 max-w-lg mx-auto">
        <div className="p-8 rounded-3xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3] text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-[#8B5CFF]/15 text-[#8B5CFF] border border-[#8B5CFF]/30 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black font-heading text-[#F5F1FF] light:text-[#1A1429] mb-2">
            Manhwa24 Creator Portal
          </h2>
          <p className="text-xs text-[#A79FC0] light:text-[#6E6288] mb-6 leading-relaxed">
            Are you an indie mangaka, webtoon illustrator, or serialized web novel author? Join our approved creator community to publish your original work to thousands of readers.
          </p>

          <button
            onClick={() => requestCreatorRole()}
            className="w-full py-3 px-4 rounded-xl font-heading font-bold text-xs bg-gradient-brand text-white shadow-lg shadow-[#FF4D6D]/20 hover:opacity-95 transition flex items-center justify-center gap-2"
          >
            <span>Activate Creator Status (Instant)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-4 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-[#F5F1FF] light:text-[#1A1429]">
      <div className="p-6 rounded-3xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3] shadow-xl mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8B5CFF]/20 text-[#8B5CFF] border border-[#8B5CFF]/30 uppercase tracking-wider">
            Creator Dashboard
          </span>
          <span className="text-xs text-[#A79FC0] light:text-[#6E6288]">Verified Artist / Author</span>
        </div>
        <h1 className="text-2xl font-black font-heading">Submit Original Work</h1>
        <p className="text-xs text-[#A79FC0] light:text-[#6E6288] mt-1">
          All submissions must be 100% original. Submitted works appear in the editorial queue for quality and DMCA compliance check before going live.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="p-6 rounded-3xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3] shadow-lg">
        <form onSubmit={handleSeriesSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#A79FC0] mb-1">Series Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Chronicles of the Silver Spire"
                className="w-full p-2.5 rounded-xl bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] text-white light:text-[#1A1429]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#A79FC0] mb-1">Content Rating *</label>
              <select required value={contentRating} onChange={(e) => setContentRating(e.target.value as ContentRating)} className="w-full p-2.5 rounded-xl bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] text-white light:text-[#1A1429]">
                <option value="safe">Safe</option>
                <option value="16+">16+</option>
                <option value="18+">18+</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#A79FC0] mb-1">Format</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MangaType)}
                className="w-full p-2.5 rounded-xl bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] text-white light:text-[#1A1429]"
              >
                <option value="Webtoon">Webtoon (Long Strip)</option>
                <option value="Manga">Manga</option>
                <option value="Manhwa">Manhwa</option>
                <option value="Novel">Serialized Web Novel (Text Prose)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#A79FC0] mb-1">Synopsis</label>
            <textarea
              rows={4}
              required
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Tell readers what your original story is about..."
              className="w-full p-2.5 rounded-xl bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] text-white light:text-[#1A1429]"
            />
          </div>

          {/* Genres */}
          <div>
            <label className="block font-semibold text-[#A79FC0] mb-1.5">Select Genres</label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-xl bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3]">
              {ALL_GENRES.map((g) => {
                const isSel = selectedGenres.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() =>
                      setSelectedGenres(isSel ? selectedGenres.filter((item) => item !== g) : [...selectedGenres, g])
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      isSel ? 'bg-[#8B5CFF] text-white' : 'bg-[#171122] light:bg-white text-[#A79FC0]'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cover upload */}
          <div>
            <label className="block font-semibold text-[#A79FC0] mb-1">Cover Artwork File or URL</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="Or paste an image URL directly..."
                className="flex-1 p-2 rounded-xl bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] text-white light:text-[#1A1429]"
              />
            </div>
            <label className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-[#8B5CFF]/40 bg-[#8B5CFF]/5 hover:bg-[#8B5CFF]/10 cursor-pointer transition">
              <Upload className="w-4 h-4 text-[#8B5CFF]" />
              <span className="text-xs font-bold text-[#8B5CFF]">
                {uploadingCover ? 'Uploading...' : 'Upload Original Cover File'}
              </span>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleCoverUpload} className="hidden" />
            </label>
          </div>

          <div className="p-3 rounded-xl bg-[#0E0A14] border border-[#2C2340] text-[11px] text-[#A79FC0] space-y-2">
            <div className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-[#FF9F1C] shrink-0" /><span>Required upload declarations</span></div>
            {([
              ['originalCreator', 'I am the original creator or I have written permission to publish this work.'],
              ['adultCharacters', 'All characters shown in sexual or adult content are clearly adults (18+). No minors, no school-age looking characters in sexual content.'],
              ['noRealPeople', 'This work has no real people, photos or deepfakes.'],
              ['acceptsPolicies', 'I accept the Terms, Content Policy and DMCA policy.'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-start gap-2"><input required type="checkbox" checked={declarations[key]} onChange={(e) => setDeclarations((prev) => ({ ...prev, [key]: e.target.checked }))} /><span>{label}</span></label>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl font-heading font-bold text-xs bg-gradient-brand text-white shadow-lg shadow-[#FF4D6D]/20 hover:opacity-95 transition"
          >
            {submitting ? 'Submitting to Queue...' : 'Submit Original Series for Review'}
          </button>
        </form>
      </div>
    </div>
  );
};
