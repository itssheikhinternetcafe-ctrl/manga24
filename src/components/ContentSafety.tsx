import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { UserProfile } from '../types';

const AGE_CONFIRMATION_KEY = 'manga24_age_confirmed_18';

export function isAdultRating(rating?: string): boolean {
  return rating === '18+';
}

export function hasAgeConfirmation(user: UserProfile | null): boolean {
  if (user?.ageConfirmedAt) return true;
  try {
    return localStorage.getItem(AGE_CONFIRMATION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function rememberAgeConfirmation(user: UserProfile | null, updateProfile: (updates: Partial<UserProfile>) => Promise<void>): void {
  const confirmedAt = new Date().toISOString();
  if (user) {
    void updateProfile({ ageConfirmedAt: confirmedAt });
    return;
  }
  try {
    localStorage.setItem(AGE_CONFIRMATION_KEY, 'true');
  } catch {
    // Some privacy modes disable local storage; the gate remains active for this session.
  }
}

export const AgeGate: React.FC<{ onConfirm: () => void; onLeave: () => void }> = ({ onConfirm, onLeave }) => (
  <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
    <div className="max-w-md w-full p-8 rounded-3xl bg-[#171122] light:bg-white border border-[#FF4D6D]/40 text-center shadow-2xl">
      <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-[#FF4D6D]" />
      <h1 className="text-2xl font-black font-heading text-[#F5F1FF] light:text-[#1A1429]">18+ content</h1>
      <p className="mt-3 text-sm text-[#A79FC0] light:text-[#6E6288]">This series contains adult content. You must be 18 or older to continue.</p>
      <div className="grid grid-cols-2 gap-3 mt-7">
        <button onClick={onLeave} className="py-3 rounded-xl border border-[#2C2340] text-xs font-bold">Leave</button>
        <button onClick={onConfirm} className="py-3 rounded-xl bg-gradient-brand text-white text-xs font-bold">I am 18+ - Enter</button>
      </div>
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