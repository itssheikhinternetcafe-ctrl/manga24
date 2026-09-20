import React from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useAppStore } from '../store/useAppStore';
import { Download } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'nav' | 'card' | 'compact';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'nav',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { setIosGuideOpen } = useAppStore();

  if (isInstalled) {
    return null;
  }

  const handleClick = () => {
    if (isInstallable) {
      install();
    } else if (isIOS) {
      setIosGuideOpen(true);
    } else {
      // Fallback guide
      setIosGuideOpen(true);
    }
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#1F1830] text-[#FF9F1C] hover:bg-[#2C2340] light:bg-[#F3EEFC] light:hover:bg-[#E2D9F3] border border-[#2C2340] light:border-[#E2D9F3] transition ${className}`}
        title="Install Manga24 App"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`p-4 rounded-2xl bg-gradient-to-br from-[#1F1830] to-[#171122] border border-[#2C2340] light:from-white light:to-[#F3EEFC] light:border-[#E2D9F3] relative overflow-hidden ${className}`}>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#FF4D6D]/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white shadow-md">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold font-heading">Install Manga24 PWA</h4>
            <p className="text-[11px] text-[#A79FC0] light:text-[#6E6288]">Read offline 24/7 on any device</p>
          </div>
        </div>
        <p className="text-xs text-[#A79FC0] light:text-[#6E6288] mb-3">
          Experience instant chapter loading, fullscreen immersive reading, and home screen launch.
        </p>
        <button
          onClick={handleClick}
          className="w-full py-2 px-3 rounded-xl bg-gradient-brand text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition active:scale-[0.98]"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install Now (Free)</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-brand shadow-sm hover:opacity-95 transition active:scale-95 ${className}`}
    >
      <Download className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Install App</span>
    </button>
  );
};
