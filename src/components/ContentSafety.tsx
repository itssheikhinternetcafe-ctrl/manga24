import React from 'react';
import { ShieldAlert } from 'lucide-react';

const AGE_CONFIRMATION_KEY = 'manga24_age_confirmed_session';

export function isMatureRating(rating?: string): boolean {
  return rating === '16+' || rating === '18+';
}

export const isAdultRating = isMatureRating;

export function isMatureCategory(value?: string): boolean {
  return /mature|16\+|18\+/i.test(value || '');
}

export function hasAgeConfirmation(): boolean {
  try {
    return sessionStorage.getItem(AGE_CONFIRMATION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function rememberAgeConfirmation(): void {
  try {
    sessionStorage.setItem(AGE_CONFIRMATION_KEY, 'true');
  } catch {
    // Some privacy modes disable session storage; the gate remains active for this session.
  }
}

export const AgeGate: React.FC<{ onConfirm: () => void; onLeave: () => void }> = ({ onConfirm, onLeave }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0E0A14]/80 px-4 py-6 backdrop-blur-sm">
    <div role="dialog" aria-modal="true" aria-labelledby="age-verification-title" className="max-w-md w-full p-8 rounded-3xl bg-[#171122] light:bg-white border border-[#FF4D6D]/40 text-center shadow-2xl">
      <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-[#FF4D6D]" />
      <h1 id="age-verification-title" className="text-2xl font-black font-heading text-[#F5F1FF] light:text-[#1A1429]">Age Verification</h1>
      <p className="mt-3 text-sm text-[#A79FC0] light:text-[#6E6288]">This section contains mature content intended for readers 16+ or 18+ depending on the series. Are you old enough to view this content?</p>
      <div className="grid grid-cols-2 gap-3 mt-7">
        <button onClick={onLeave} className="py-3 rounded-xl border border-[#2C2340] text-xs font-bold">No</button>
        <button onClick={onConfirm} className="py-3 rounded-xl bg-gradient-brand text-white text-xs font-bold">Yes, I'm old enough</button>
      </div>
      <p className="mt-4 text-[11px] text-[#A79FC0] light:text-[#6E6288]">*You can change this anytime in settings.</p>
    </div>
  </div>
);

export const AdultCoverPlaceholder: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#0E0A14] text-center p-4">
      <div className="text-xs font-semibold text-[#A79FC0]">18+ content<br /><span className="font-normal">Confirm your age to view {title}.</span></div>
    </div>
  );
};