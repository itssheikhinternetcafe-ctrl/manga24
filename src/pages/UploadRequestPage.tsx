import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Sparkles, Upload, CheckCircle2, ShieldCheck, Send } from 'lucide-react';

export const UploadRequestPage: React.FC = () => {
  const { showToast } = useAppStore();
  const [groupName, setGroupName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [seriesTitle, setSeriesTitle] = useState('');
  const [seriesType, setSeriesType] = useState('Manhwa');
  const [sampleLink, setSampleLink] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Upload Request Logged', 'Our curation team will review your submission and grant upload rights.', 'success');
    setGroupName('');
    setContactEmail('');
    setSeriesTitle('');
    setSampleLink('');
    setNotes('');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center text-white mx-auto shadow-md">
          <Upload className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black font-heading text-[#F5F1FF] light:text-[#1A1429]">
          Content Upload & Scanlation Portal
        </h1>
        <p className="text-xs sm:text-sm text-[#A79FC0] light:text-[#6E6288] max-w-lg mx-auto">
          Share your translations, independent webtoons, or official scanlations with hundreds of thousands of daily readers.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-[#171122] border border-[#2C2340] light:bg-white light:border-[#E2D9F3] shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#A79FC0] light:text-[#6E6288] mb-1 font-medium">
                Scanlation Team / Creator Name
              </label>
              <input
                type="text"
                required
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Asura Scans / Solo Artist"
                className="w-full p-2.5 rounded-xl bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3]"
              />
            </div>

            <div>
              <label className="block text-[#A79FC0] light:text-[#6E6288] mb-1 font-medium">
                Primary Contact Email
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="leader@team.com"
                className="w-full p-2.5 rounded-xl bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#A79FC0] light:text-[#6E6288] mb-1 font-medium">
                Series Title
              </label>
              <input
                type="text"
                required
                value={seriesTitle}
                onChange={(e) => setSeriesTitle(e.target.value)}
                placeholder="e.g. Return of the Shadow Sovereign"
                className="w-full p-2.5 rounded-xl bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3]"
              />
            </div>

            <div>
              <label className="block text-[#A79FC0] light:text-[#6E6288] mb-1 font-medium">
                Type
              </label>
              <select
                value={seriesType}
                onChange={(e) => setSeriesType(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3]"
              >
                <option value="Manhwa">Manhwa (Korean)</option>
                <option value="Manga">Manga (Japanese)</option>
                <option value="Manhua">Manhua (Chinese)</option>
                <option value="Webtoon">Original Webtoon</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#A79FC0] light:text-[#6E6288] mb-1 font-medium">
              Sample Chapter Link / Google Drive / ZIP / Discord
            </label>
            <input
              type="text"
              required
              value={sampleLink}
              onChange={(e) => setSampleLink(e.target.value)}
              placeholder="https://drive.google.com/... or Discord link"
              className="w-full p-2.5 rounded-xl bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3]"
            />
          </div>

          <div>
            <label className="block text-[#A79FC0] light:text-[#6E6288] mb-1 font-medium">
              Additional Notes / Release Schedule
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Tell us about release frequency, proofreading standards, or credit preferences..."
              className="w-full p-2.5 rounded-xl bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-brand text-white font-heading font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 hover:opacity-95 transition"
          >
            <Send className="w-4 h-4" />
            <span>Submit Verification & Upload Application</span>
          </button>
        </form>
      </div>
    </div>
  );
};
