import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Share, PlusSquare, X } from 'lucide-react';

export const PWAInstallModal: React.FC = () => {
  const { iosGuideOpen, setIosGuideOpen } = useAppStore();

  if (!iosGuideOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-[#171122] border border-[#2C2340] p-6 shadow-2xl text-[#F5F1FF] light:bg-white light:border-[#E2D9F3] light:text-[#1A1429]">
        <div className="flex items-center justify-between pb-4 border-b border-[#2C2340] light:border-[#E2D9F3]">
          <div className="flex items-center gap-3">
            <img src="/icon.svg" alt="Manhwa24" className="w-10 h-10 rounded-xl" />
            <div>
              <h3 className="text-base font-bold font-heading">Install Manhwa24</h3>
              <p className="text-xs text-[#A79FC0] light:text-[#6E6288]">Manhwa24 PWA</p>
            </div>
          </div>
          <button
            onClick={() => setIosGuideOpen(false)}
            className="p-1 rounded-lg hover:bg-[#1F1830] light:hover:bg-[#F3EEFC] text-[#A79FC0]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3.5 text-sm">
          <p className="text-xs text-[#A79FC0] light:text-[#6E6288]">
            Install Manhwa24 on your iPhone or iPad for fullscreen reading, fast offline caching, and instant 24/7 access:
          </p>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#1F1830] light:bg-[#F3EEFC]">
            <div className="p-2 rounded-lg bg-[#0E0A14] text-[#FF4D6D] light:bg-white shrink-0">
              <Share className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-xs">1. Tap the Share button</p>
              <p className="text-xs text-[#A79FC0] light:text-[#6E6288]">Located in your Safari bottom toolbar or browser menu.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#1F1830] light:bg-[#F3EEFC]">
            <div className="p-2 rounded-lg bg-[#0E0A14] text-[#FF9F1C] light:bg-white shrink-0">
              <PlusSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-xs">2. Select "Add to Home Screen"</p>
              <p className="text-xs text-[#A79FC0] light:text-[#6E6288]">Scroll down the share sheet and tap Add to Home Screen.</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIosGuideOpen(false)}
          className="mt-5 w-full rounded-xl py-2.5 bg-gradient-brand text-white font-semibold text-sm hover:opacity-90 transition shadow-lg"
        >
          Got it, let's read!
        </button>
      </div>
    </div>
  );
};
