import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ShieldCheck, Mail, AlertTriangle, Send } from 'lucide-react';

export const DMCAPage: React.FC = () => {
  const { showToast } = useAppStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [copyrightOwner, setCopyrightOwner] = useState('');
  const [workUrl, setWorkUrl] = useState('');
  const [declaration, setDeclaration] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!declaration) {
      showToast('Declaration Required', 'Please confirm the good-faith declaration.', 'error');
      return;
    }
    showToast('Notice Received', 'Your DMCA notice has been logged. Our legal team processes notices within 24 hours.', 'success');
    setName('');
    setEmail('');
    setCopyrightOwner('');
    setWorkUrl('');
    setDeclaration(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-[#FF4D6D]/15 flex items-center justify-center text-[#FF4D6D] mx-auto shadow-md">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black font-heading text-[#F5F1FF] light:text-[#1A1429]">
          DMCA Copyright & Takedown Policy
        </h1>
        <p className="text-xs sm:text-sm text-[#A79FC0] light:text-[#6E6288] max-w-xl mx-auto">
          Manga24 (Manga24.xyz) respects the intellectual property rights of all manga authors, artists, and publishers.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-[#171122] border border-[#2C2340] light:bg-white light:border-[#E2D9F3] text-xs sm:text-sm text-[#FAF7FF] light:text-[#1A1429] space-y-4 leading-relaxed shadow-lg">
        <h3 className="text-base font-bold font-heading text-[#FF9F1C]">
          Notice and Procedure for Making Claims of Copyright Infringement
        </h3>
        <p>
          It is our policy to respond expeditiously to clear notices of alleged copyright infringement that comply with the United States Digital Millennium Copyright Act (DMCA) and international copyright legislation.
        </p>
        <p>
          If you are a copyright owner, or are authorized to act on behalf of one, please report alleged copyright infringements taking place on or through the Manga24 website by submitting the designated form below or contacting our Copyright Agent at <strong className="text-[#FF4D6D]">dmca@manga24.xyz</strong>.
        </p>

        <div className="p-4 rounded-2xl bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] space-y-2 text-xs">
          <p className="font-bold text-[#FF9F1C]">Designated DMCA Agent Information:</p>
          <p>Manga24 Legal & Copyright Compliance Bureau</p>
          <p>Email: dmca@manga24.xyz</p>
          <p>Response SLA: Within 24-48 business hours</p>
        </div>
      </div>

      {/* Takedown Submission Form */}
      <div className="p-6 rounded-3xl bg-[#171122] border border-[#2C2340] light:bg-white light:border-[#E2D9F3] shadow-xl">
        <h3 className="text-base font-bold font-heading mb-4 text-[#F5F1FF] light:text-[#1A1429]">
          Submit an Expedited Takedown Request
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#A79FC0] light:text-[#6E6288] mb-1 font-medium">
                Your Full Legal Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full p-2.5 rounded-xl bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3]"
              />
            </div>

            <div>
              <label className="block text-[#A79FC0] light:text-[#6E6288] mb-1 font-medium">
                Official Contact Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="legal@publisher.com"
                className="w-full p-2.5 rounded-xl bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#A79FC0] light:text-[#6E6288] mb-1 font-medium">
              Copyright Owner / Publishing Entity
            </label>
            <input
              type="text"
              required
              value={copyrightOwner}
              onChange={(e) => setCopyrightOwner(e.target.value)}
              placeholder="e.g. Shueisha Inc. / Studio Dragon / Independent Creator"
              className="w-full p-2.5 rounded-xl bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3]"
            />
          </div>

          <div>
            <label className="block text-[#A79FC0] light:text-[#6E6288] mb-1 font-medium">
              Specific Manga24 URL(s) to be removed
            </label>
            <input
              type="url"
              required
              value={workUrl}
              onChange={(e) => setWorkUrl(e.target.value)}
              placeholder="https://manga24.xyz/series/astral-monarch/chapter/1"
              className="w-full p-2.5 rounded-xl bg-[#0E0A14] light:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3]"
            />
          </div>

          <label className="flex items-start gap-2.5 pt-2 text-[#A79FC0] light:text-[#6E6288] cursor-pointer">
            <input
              type="checkbox"
              required
              checked={declaration}
              onChange={(e) => setDeclaration(e.target.checked)}
              className="mt-0.5 rounded accent-[#FF4D6D]"
            />
            <span>
              I have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law, and that this notice is accurate under penalty of perjury.
            </span>
          </label>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-brand text-white font-heading font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 hover:opacity-95 transition active:scale-98"
          >
            <Send className="w-4 h-4" />
            <span>Transmit Official DMCA Notice</span>
          </button>
        </form>
      </div>
    </div>
  );
};
