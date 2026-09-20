import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShieldCheck, Sparkles, Send, Github, Download, Compass, Bookmark, MessageSquare } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const Footer: React.FC = () => {
  const { setIosGuideOpen } = useAppStore();

  return (
    <footer className="w-full bg-[#0E0A14] border-t border-[#2C2340] light:bg-[#F3EEFC] light:border-[#E2D9F3] text-[#A79FC0] light:text-[#6E6288] mt-16 transition-colors">
      {/* Top Banner / Newsletter / PWA Callout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 border-b border-[#2C2340]/60 light:border-[#E2D9F3]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-6 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D6D] animate-ping" />
              <span className="text-xs font-bold font-heading text-[#F5F1FF] light:text-[#1A1429] uppercase tracking-wider">
                Read Anywhere, Anytime 24/7
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-heading text-[#F5F1FF] light:text-[#1A1429]">
              Install Manga24 as a Progressive Web App
            </h3>
            <p className="text-xs sm:text-sm text-[#A79FC0] light:text-[#6E6288] leading-relaxed">
              Get an app icon on your home screen, zero browser address bars, instant chapter caching, and seamless reader mode.
            </p>
          </div>

          <div className="md:col-span-6 flex flex-wrap items-center md:justify-end gap-3">
            <button
              onClick={() => setIosGuideOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-brand text-white font-heading font-bold text-xs sm:text-sm shadow-xl hover:opacity-95 active:scale-95 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Install Manga24 PWA</span>
            </button>
            <Link
              to="/upload-request"
              className="px-4 py-2.5 rounded-2xl bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#E2D9F3] text-[#F5F1FF] light:text-[#1A1429] border border-[#2C2340] light:border-[#E2D9F3] font-semibold text-xs sm:text-sm transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#FF9F1C]" />
              <span>Submit Series Upload</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Links Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Col 1: Brand & Tagline */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center text-white shadow-md">
                <span className="font-heading font-black text-sm">24</span>
              </div>
              <span className="font-heading font-extrabold text-xl tracking-tight text-[#F5F1FF] light:text-[#1A1429]">
                Manga<span className="text-gradient-brand">24</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed max-w-sm">
              Read fast. Read free. Read 24/7. Your modern portal for high-definition webtoons, Korean manhwa, Japanese manga, and Chinese manhua.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <a
                href="https://discord.gg"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#E2D9F3] text-[#A79FC0] hover:text-[#5865F2] border border-[#2C2340] light:border-[#E2D9F3] transition"
                aria-label="Discord"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#E2D9F3] text-[#A79FC0] hover:text-white light:hover:text-[#1A1429] border border-[#2C2340] light:border-[#E2D9F3] transition"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <Link
                to="/community"
                className="p-2 rounded-xl bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#E2D9F3] text-[#A79FC0] hover:text-[#FF4D6D] border border-[#2C2340] light:border-[#E2D9F3] transition"
                aria-label="Community"
              >
                <Heart className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold font-heading uppercase tracking-wider text-[#F5F1FF] light:text-[#1A1429]">
              Explore
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/browse?type=Manga" className="hover:text-[#FF4D6D] transition">
                  Japanese Manga
                </Link>
              </li>
              <li>
                <Link to="/browse?type=Manhwa" className="hover:text-[#FF4D6D] transition">
                  Korean Manhwa
                </Link>
              </li>
              <li>
                <Link to="/browse?type=Manhua" className="hover:text-[#FF4D6D] transition">
                  Chinese Manhua
                </Link>
              </li>
              <li>
                <Link to="/browse?type=Webtoon" className="hover:text-[#FF4D6D] transition">
                  Vertical Webtoons
                </Link>
              </li>
              <li>
                <Link to="/browse?sort=popular" className="hover:text-[#FF4D6D] transition">
                  Top Ranked Series
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: User & Community */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold font-heading uppercase tracking-wider text-[#F5F1FF] light:text-[#1A1429]">
              Community
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/community" className="hover:text-[#FF9F1C] transition">
                  Discussion Forum
                </Link>
              </li>
              <li>
                <Link to="/library?tab=collections" className="hover:text-[#FF9F1C] transition">
                  Curated Collections
                </Link>
              </li>
              <li>
                <Link to="/community" className="hover:text-[#FF9F1C] transition">
                  Scanlation Leaderboards
                </Link>
              </li>
              <li>
                <Link to="/upload-request" className="hover:text-[#FF9F1C] transition">
                  Submit Scanlations
                </Link>
              </li>
              <li>
                <Link to="/community-guidelines" className="hover:text-[#FF9F1C] transition">
                  Community Guidelines
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & DMCA */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold font-heading uppercase tracking-wider text-[#F5F1FF] light:text-[#1A1429]">
              Legal & Safety
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/dmca" className="hover:text-[#8B5CFF] font-semibold transition flex items-center gap-1 text-[#FF4D6D]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>DMCA & Copyright</span>
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#8B5CFF] transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[#8B5CFF] transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/content-policy" className="hover:text-[#8B5CFF] transition">
                  Content Rating Policy
                </Link>
              </li>
              <li>
                <a
                  href="mailto:contact@manga24.xyz"
                  className="hover:text-[#8B5CFF] transition"
                >
                  Contact: contact@manga24.xyz
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & disclaimer */}
        <div className="pt-8 mt-8 border-t border-[#2C2340]/60 light:border-[#E2D9F3] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} Manga24 (Manga24.xyz). Built for manga readers worldwide.
          </p>

          <p className="flex items-center gap-1.5 text-center sm:text-right">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-[#FF4D6D] fill-[#FF4D6D]" />
            <span>for manga & webtoon culture</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
