import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { Series } from '../types';
import { NotificationsDropdown } from './NotificationsDropdown';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Search,
  Compass,
  Sun,
  Moon,
  Bell,
  Menu,
  X,
  User,
  LogOut,
  Bookmark,
  Users,
  Sparkles,
  ChevronRight,
  Star,
  Shield,
  Upload,
  BookOpen,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    theme,
    toggleTheme,
    user,
    logout,
    setAuthModalOpen,
    unreadNotificationsCount,
    library,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Series[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const bookmarkedCount = Object.values(library).filter((i) => i.isBookmarked).length;

  // Live suggestions query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await api.searchSuggestions(searchQuery);
      setSuggestions(results);
      setIsSearching(false);
    }, 120);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside search
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setSearchOpen(false);
    setNotifOpen(false);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const selectSuggestion = (seriesId: string) => {
    navigate(`/series/${seriesId}`);
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-nav transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-2 group">
            {/* Manhwa24 Icon */}
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-gradient-brand flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-white"
              >
                {/* Speech bubble / brush fold */}
                <path
                  d="M10 14C10 11.79 11.79 10 14 10H34C36.21 10 38 11.79 38 14V28C38 30.21 36.21 32 34 32H22L14 38V32H14C11.79 32 10 30.21 10 28V14Z"
                  fill="#0E0A14"
                />
                <text
                  x="24"
                  y="26"
                  fontFamily="'Sora', sans-serif"
                  fontWeight="900"
                  fontSize="14"
                  fill="#F5F1FF"
                  textAnchor="middle"
                >
                  24
                </text>
              </svg>
            </div>

            {/* Wordmark */}
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="font-heading font-extrabold text-lg sm:text-xl tracking-tight text-[#F5F1FF] light:text-[#1A1429]">
                  Manhwa<span className="text-gradient-brand">24</span>
                </span>
                <span className="ml-1 text-[10px] font-mono-meta px-1.5 py-0.5 rounded bg-[#FF4D6D]/15 text-[#FF4D6D] font-bold hidden md:inline-block">
                  .XYZ
                </span>
              </div>
              <span className="text-[9px] font-mono-meta text-[#A79FC0] light:text-[#6E6288] -mt-1 hidden lg:block tracking-wider">
                READ FAST • FREE • 24/7
              </span>
            </div>
          </Link>

          {/* Browse quick link */}
          <Link
            to="/browse"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#F5F1FF] hover:text-white bg-[#1F1830] hover:bg-[#2C2340] light:bg-[#F3EEFC] light:text-[#1A1429] light:hover:bg-[#E2D9F3] border border-[#2C2340] light:border-[#E2D9F3] transition"
          >
            <Compass className="w-3.5 h-3.5 text-[#FF9F1C]" />
            <span>Browse</span>
          </Link>

          {/* Community link */}
          <Link
            to="/community"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#A79FC0] hover:text-[#F5F1FF] light:text-[#6E6288] light:hover:text-[#1A1429] transition"
          >
            <Users className="w-3.5 h-3.5 text-[#8B5CFF]" />
            <span>Community</span>
          </Link>
        </div>

        {/* Center Live Search Bar */}
        <div ref={searchBoxRef} className="flex-1 max-w-lg relative mx-1 sm:mx-2">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search series, genres, authors..."
              className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm bg-[#171122] text-[#F5F1FF] light:bg-white light:text-[#1A1429] border border-[#2C2340] light:border-[#E2D9F3] focus:outline-none focus:border-[#FF4D6D] transition shadow-inner placeholder:text-[#A79FC0]/60 light:placeholder:text-[#6E6288]/70"
            />
            <Search className="w-4 h-4 text-[#A79FC0] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSuggestions([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A79FC0] hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Live Search Suggestions Dropdown */}
          {searchOpen && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl bg-[#171122] border border-[#2C2340] shadow-2xl p-2 z-50 text-[#F5F1FF] light:bg-white light:border-[#E2D9F3] light:text-[#1A1429] animate-in fade-in">
              <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-semibold text-[#A79FC0] light:text-[#6E6288] border-b border-[#2C2340]/50 light:border-[#E2D9F3]">
                <span>SEARCH RESULTS ({suggestions.length})</span>
                {isSearching && <span className="animate-pulse">Searching...</span>}
              </div>

              {suggestions.length === 0 && !isSearching ? (
                <div className="py-6 text-center text-xs text-[#A79FC0] light:text-[#6E6288]">
                  No matching titles found for "{searchQuery}".
                  <button
                    onClick={handleSearchSubmit}
                    className="block mx-auto mt-2 text-[#FF9F1C] hover:underline font-semibold"
                  >
                    Open advanced browse search
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#2C2340]/40 light:divide-[#E2D9F3]/60 max-h-80 overflow-y-auto">
                  {suggestions.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => selectSuggestion(item.id)}
                      className="p-2 flex items-center gap-3 rounded-xl hover:bg-[#1F1830] light:hover:bg-[#F3EEFC] cursor-pointer transition"
                    >
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="w-10 h-14 rounded-lg object-cover shadow-sm shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono-meta px-1.5 py-0.5 rounded bg-[#8B5CFF]/20 text-[#8B5CFF] font-bold">
                            {item.type}
                          </span>
                          <span className="text-[10px] text-[#A79FC0] light:text-[#6E6288] font-mono-meta">
                            Ch. {item.latestChapterNumber}
                          </span>
                        </div>
                        <p className="text-xs font-bold font-heading truncate mt-0.5">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#A79FC0] light:text-[#6E6288]">
                          <span className="flex items-center gap-0.5 text-[#FF9F1C]">
                            <Star className="w-3 h-3 fill-[#FF9F1C]" />
                            {item.rating}
                          </span>
                          <span>•</span>
                          <span className="truncate">{item.genres.slice(0, 2).join(', ')}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#A79FC0] shrink-0" />
                    </div>
                  ))}

                  <button
                    onClick={handleSearchSubmit}
                    className="w-full py-2 text-center text-xs font-semibold text-gradient-brand hover:opacity-80 transition"
                  >
                    View all results for "{searchQuery}" →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Nav Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Creator Upload button */}
          <Link
            to="/creator-upload"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#8B5CFF]/15 hover:bg-[#8B5CFF]/25 border border-[#8B5CFF]/30 text-[#8B5CFF] text-xs font-bold transition"
            title="Submit Original Work"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Submit Work</span>
          </Link>

          {/* Admin Panel Quick Access */}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF4D6D]/15 hover:bg-[#FF4D6D]/25 border border-[#FF4D6D]/40 text-[#FF4D6D] text-xs font-bold font-heading transition"
              title="Admin Dashboard"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {/* In-App PWA Install */}
          <div className="hidden lg:block">
            <PWAInstallButton variant="nav" />
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] text-[#F5F1FF] light:text-[#1A1429] transition shadow-sm"
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#FF9F1C]" />
            ) : (
              <Moon className="w-4 h-4 text-[#8B5CFF]" />
            )}
          </button>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2 rounded-xl bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] text-[#F5F1FF] light:text-[#1A1429] transition relative shadow-sm"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-[#A79FC0] light:text-[#6E6288]" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF4D6D] text-[10px] font-bold text-white flex items-center justify-center font-mono-meta ring-2 ring-[#0E0A14] light:ring-white">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
            <NotificationsDropdown isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
          </div>

          {/* User Auth Profile / Login */}
          {user ? (
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] transition"
              >
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-[#FF4D6D]"
                />
                <span className="text-xs font-semibold hidden md:inline-block max-w-[90px] truncate text-[#F5F1FF] light:text-[#1A1429]">
                  {user.username}
                </span>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#171122] border border-[#2C2340] shadow-2xl p-2 z-50 text-[#F5F1FF] light:bg-white light:border-[#E2D9F3] light:text-[#1A1429] animate-in fade-in">
                  <div className="px-3 py-2 border-b border-[#2C2340]/60 light:border-[#E2D9F3]">
                    <p className="text-xs font-bold font-heading truncate">{user.username}</p>
                    <p className="text-[11px] text-[#A79FC0] light:text-[#6E6288] truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[9px] font-mono-meta px-1.5 py-0.5 rounded bg-[#FF4D6D]/20 text-[#FF4D6D] font-bold">
                      {user.role}
                    </span>
                  </div>

                  <div className="py-1 space-y-0.5">
                    <Link
                      to="/library"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-[#1F1830] light:hover:bg-[#F3EEFC] transition"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-[#FF9F1C]" />
                      <span>Library ({bookmarkedCount})</span>
                    </Link>
                    <Link
                      to="/library?tab=history"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-[#1F1830] light:hover:bg-[#F3EEFC] transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#8B5CFF]" />
                      <span>Reading History</span>
                    </Link>
                    <Link
                      to="/library?tab=settings"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs hover:bg-[#1F1830] light:hover:bg-[#F3EEFC] transition"
                    >
                      <User className="w-3.5 h-3.5 text-[#FF4D6D]" />
                      <span>Settings & Reader</span>
                    </Link>
                    <Link
                      to="/creator-upload"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#8B5CFF] hover:bg-[#8B5CFF]/10 transition"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#8B5CFF]" />
                      <span>Creator Studio</span>
                    </Link>
                    <Link
                      to="/writer"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#FF9F1C] hover:bg-[#FF9F1C]/10 transition"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#FF9F1C]" />
                      <span>Writer Dashboard</span>
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#FF4D6D] hover:bg-[#FF4D6D]/10 transition"
                      >
                        <Shield className="w-3.5 h-3.5 text-[#FF4D6D]" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}
                  </div>

                  <div className="pt-1 border-t border-[#2C2340]/60 light:border-[#E2D9F3]">
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#FF4D6D] hover:bg-[#FF4D6D]/10 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-brand text-white font-heading font-bold text-xs shadow-md hover:opacity-95 transition whitespace-nowrap"
            >
              Login / Sign up
            </button>
          )}

          {/* Mobile hamburger menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-[#171122] hover:bg-[#1F1830] light:bg-white light:hover:bg-[#F3EEFC] border border-[#2C2340] light:border-[#E2D9F3] text-[#F5F1FF] light:text-[#1A1429] md:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#2C2340] light:border-[#E2D9F3] bg-[#0E0A14]/98 light:bg-white/98 backdrop-blur-xl px-4 py-4 space-y-3 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-2">
            {!user && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalOpen(true);
                }}
                className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-brand text-white font-heading font-bold text-xs shadow-md"
              >
                <User className="w-4 h-4" />
                <span>Login / Sign up</span>
              </button>
            )}
            <Link
              to="/browse"
              className="flex items-center gap-2 p-3 rounded-xl bg-[#171122] light:bg-[#F3EEFC] text-xs font-semibold"
            >
              <Compass className="w-4 h-4 text-[#FF9F1C]" />
              <span>Browse All</span>
            </Link>
            <Link
              to="/library"
              className="flex items-center gap-2 p-3 rounded-xl bg-[#171122] light:bg-[#F3EEFC] text-xs font-semibold"
            >
              <Bookmark className="w-4 h-4 text-[#FF4D6D]" />
              <span>My Library ({bookmarkedCount})</span>
            </Link>
            <Link
              to="/community"
              className="flex items-center gap-2 p-3 rounded-xl bg-[#171122] light:bg-[#F3EEFC] text-xs font-semibold"
            >
              <Users className="w-4 h-4 text-[#8B5CFF]" />
              <span>Community Forum</span>
            </Link>
            <Link
              to="/upload-request"
              className="flex items-center gap-2 p-3 rounded-xl bg-[#171122] light:bg-[#F3EEFC] text-xs font-semibold"
            >
              <Sparkles className="w-4 h-4 text-[#FF9F1C]" />
              <span>Upload Request</span>
            </Link>
            <Link
              to="/creator-upload"
              className="flex items-center gap-2 p-3 rounded-xl bg-[#171122] light:bg-[#F3EEFC] text-xs font-semibold text-[#8B5CFF]"
            >
              <Upload className="w-4 h-4 text-[#8B5CFF]" />
              <span>Creator Studio</span>
            </Link>
            {user && (
              <Link
                to="/writer"
                className="flex items-center gap-2 p-3 rounded-xl bg-[#171122] light:bg-[#F3EEFC] text-xs font-semibold text-[#FF9F1C]"
              >
                <BookOpen className="w-4 h-4 text-[#FF9F1C]" />
                <span>Writer Dashboard</span>
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl bg-[#FF4D6D]/15 border border-[#FF4D6D]/40 text-xs font-bold text-[#FF4D6D]"
              >
                <Shield className="w-4 h-4 text-[#FF4D6D]" />
                <span>Admin Dashboard</span>
              </Link>
            )}
          </div>

          <div className="pt-2 border-t border-[#2C2340] light:border-[#E2D9F3]">
            <PWAInstallButton variant="compact" className="w-full justify-center py-2.5" />
          </div>
        </div>
      )}
    </header>
  );
};
