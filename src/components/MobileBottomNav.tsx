import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Bookmark, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const MobileBottomNav: React.FC = () => {
  const { library, user, setAuthModalOpen } = useAppStore();
  const bookmarkedCount = Object.values(library).filter((i) => i.isBookmarked).length;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#171122]/95 light:bg-white/95 backdrop-blur-lg border-t border-[#2C2340] light:border-[#E2D9F3] px-3 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${
            isActive
              ? 'text-[#FF4D6D] font-bold'
              : 'text-[#A79FC0] light:text-[#6E6288] hover:text-[#F5F1FF] light:hover:text-[#1A1429]'
          }`
        }
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Home</span>
      </NavLink>

      <NavLink
        to="/browse"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${
            isActive
              ? 'text-[#FF9F1C] font-bold'
              : 'text-[#A79FC0] light:text-[#6E6288] hover:text-[#F5F1FF] light:hover:text-[#1A1429]'
          }`
        }
      >
        <Compass className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Browse</span>
      </NavLink>

      <NavLink
        to="/library"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition relative ${
            isActive
              ? 'text-[#8B5CFF] font-bold'
              : 'text-[#A79FC0] light:text-[#6E6288] hover:text-[#F5F1FF] light:hover:text-[#1A1429]'
          }`
        }
      >
        <div className="relative">
          <Bookmark className="w-5 h-5" />
          {bookmarkedCount > 0 && (
            <span className="absolute -top-1 -right-2 px-1 rounded-full bg-[#FF4D6D] text-[9px] font-mono-meta font-bold text-white leading-none py-0.5">
              {bookmarkedCount}
            </span>
          )}
        </div>
        <span className="text-[10px] tracking-tight">Library</span>
      </NavLink>

      {user ? (
        <NavLink
          to="/library?tab=settings"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${
              isActive
                ? 'text-[#FF4D6D] font-bold'
                : 'text-[#A79FC0] light:text-[#6E6288] hover:text-[#F5F1FF] light:hover:text-[#1A1429]'
            }`
          }
        >
          <img
            src={user.avatar}
            alt={user.username}
            className="w-5 h-5 rounded-full object-cover ring-1 ring-[#FF4D6D]"
          />
          <span className="text-[10px] tracking-tight">Profile</span>
        </NavLink>
      ) : (
        <button
          onClick={() => setAuthModalOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-3 text-[#A79FC0] light:text-[#6E6288] hover:text-[#FF4D6D]"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Sign In</span>
        </button>
      )}
    </nav>
  );
};
