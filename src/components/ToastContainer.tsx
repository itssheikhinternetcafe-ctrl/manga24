import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { CheckCircle, Info, AlertCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-16 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 bg-[#171122]/95 border-[#2C2340] text-[#F5F1FF] light:bg-white/95 light:border-[#E2D9F3] light:text-[#1A1429]"
          >
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-[#FF9F1C] shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-[#8B5CFF] shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-[#FF4D6D] shrink-0 mt-0.5" />}

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold font-heading">{toast.title}</p>
              <p className="text-xs text-[#A79FC0] light:text-[#6E6288] mt-0.5 line-clamp-2">{toast.message}</p>
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="text-[#A79FC0] hover:text-[#F5F1FF] transition-colors p-1"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
