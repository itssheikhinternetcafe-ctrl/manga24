import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmActionModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({ open, title, message, confirmLabel = 'Confirm', onConfirm, onCancel, busy }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md border border-[#3A294A] bg-[#171122] p-6 text-[#F5F1FF] shadow-2xl rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400"><AlertTriangle className="h-5 w-5" /></div>
            <div><h2 className="font-heading text-lg font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#A79FC0]">{message}</p></div>
          </div>
          <button aria-label="Close" onClick={onCancel} className="text-[#A79FC0] hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} disabled={busy} className="rounded-lg border border-[#3A294A] px-4 py-2 text-xs font-bold text-[#A79FC0] hover:text-white">Cancel</button>
          <button onClick={onConfirm} disabled={busy} className="rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{busy ? 'Working...' : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};
