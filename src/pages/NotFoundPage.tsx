import React from 'react';
import { Link } from 'react-router-dom';
import { MascotIllustration } from '../components/MascotIllustration';
import { Home, Compass, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
      <MascotIllustration size={180} mood="confused" className="mx-auto" />

      <div className="space-y-2">
        <span className="font-mono-meta font-black text-4xl sm:text-5xl text-gradient-brand">
          404
        </span>
        <h1 className="text-2xl sm:text-3xl font-black font-heading text-[#F5F1FF] light:text-[#1A1429]">
          Lost in the Manga Multiverse
        </h1>
        <p className="text-xs sm:text-sm text-[#A79FC0] light:text-[#6E6288] max-w-sm mx-auto leading-relaxed">
          The panel or chapter you are looking for has been erased by the Void, or the cosmic portal address is mistyped.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          to="/"
          className="px-5 py-2.5 rounded-2xl bg-gradient-brand text-white font-heading font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-[#FF4D6D]/20 hover:opacity-95 transition"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>

        <Link
          to="/browse"
          className="px-5 py-2.5 rounded-2xl bg-[#171122] hover:bg-[#1F1830] light:bg-[#F3EEFC] text-[#F5F1FF] light:text-[#1A1429] border border-[#2C2340] light:border-[#E2D9F3] font-semibold text-xs sm:text-sm flex items-center gap-2 transition"
        >
          <Compass className="w-4 h-4 text-[#FF9F1C]" />
          <span>Browse All Manga</span>
        </Link>
      </div>
    </div>
  );
};
