import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Bell, CheckCheck, Sparkles, BookOpen, MessageSquare } from 'lucide-react';

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useAppStore();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-[#171122] border border-[#2C2340] shadow-2xl p-4 text-[#F5F1FF] light:bg-white light:border-[#E2D9F3] light:text-[#1A1429] z-50 animate-in fade-in slide-in-from-top-2"
    >
      <div className="flex items-center justify-between pb-3 border-b border-[#2C2340] light:border-[#E2D9F3]">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#FF4D6D]" />
          <h4 className="text-sm font-bold font-heading">Notifications</h4>
        </div>
        <button
          onClick={markAllNotificationsAsRead}
          className="flex items-center gap-1 text-[11px] font-medium text-[#FF9F1C] hover:underline"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Mark all read</span>
        </button>
      </div>

      <div className="mt-2 divide-y divide-[#2C2340]/60 light:divide-[#E2D9F3] max-h-80 overflow-y-auto pr-1">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#A79FC0] light:text-[#6E6288]">
            No notifications right now.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                markNotificationAsRead(n.id);
                onClose();
                navigate(n.targetUrl);
              }}
              className={`py-3 px-2 flex items-start gap-3 rounded-xl cursor-pointer transition hover:bg-[#1F1830] light:hover:bg-[#F3EEFC] ${
                !n.read ? 'bg-[#1F1830]/40 light:bg-[#F3EEFC]/60' : ''
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  n.type === 'chapter_release'
                    ? 'bg-[#FF4D6D]/15 text-[#FF4D6D]'
                    : n.type === 'comment_reply'
                    ? 'bg-[#8B5CFF]/15 text-[#8B5CFF]'
                    : 'bg-[#FF9F1C]/15 text-[#FF9F1C]'
                }`}
              >
                {n.type === 'chapter_release' ? (
                  <BookOpen className="w-4 h-4" />
                ) : n.type === 'comment_reply' ? (
                  <MessageSquare className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-semibold truncate">{n.title}</p>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-[#FF4D6D] shrink-0" />
                  )}
                </div>
                <p className="text-xs text-[#A79FC0] light:text-[#6E6288] mt-0.5 line-clamp-2 leading-relaxed">
                  {n.message}
                </p>
                <span className="text-[10px] text-[#A79FC0]/80 light:text-[#6E6288] font-mono-meta block mt-1">
                  {n.timestamp}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-2.5 mt-2 border-t border-[#2C2340] light:border-[#E2D9F3] text-center">
        <span className="text-[11px] text-[#A79FC0] light:text-[#6E6288]">
          Real-time updates enabled • Manhwa24
        </span>
      </div>
    </div>
  );
};
