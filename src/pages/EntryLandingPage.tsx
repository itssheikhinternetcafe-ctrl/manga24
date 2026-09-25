import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight } from 'lucide-react';
import { SITE_NAME } from '../config';
import { HomePage } from './HomePage';

const ENTRY_SESSION_KEY = 'manga24_site_entered_session';

function hasEnteredSite(): boolean {
  try {
    return sessionStorage.getItem(ENTRY_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export const EntryLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [entered, setEntered] = useState(hasEnteredSite);

  const enterSite = () => {
    try {
      sessionStorage.setItem(ENTRY_SESSION_KEY, 'true');
    } catch {
      // Continue into the site if session storage is unavailable.
    }
    setEntered(true);
    navigate('/');
  };

  if (entered) return <HomePage />;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 bg-[#0E0A14] text-[#F5F1FF] light:bg-[#FAF7FF] light:text-[#1A1429]">
      <main className="w-full max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-xl shadow-[#FF4D6D]/20">
          <BookOpen className="h-8 w-8" />
        </div>
        <p className="mb-3 text-xs font-mono-meta font-bold uppercase tracking-[0.2em] text-[#FF4D6D]">
          Welcome to
        </p>
        <h1 className="font-heading text-4xl font-black text-[#F5F1FF] light:text-[#1A1429] sm:text-5xl">
          {SITE_NAME}
        </h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-[#A79FC0] light:text-[#6E6288]">
          Discover your next favorite manga, manhwa, manhua, and webtoon.
        </p>
        <button
          type="button"
          onClick={enterSite}
          className="mx-auto mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#FF4D6D]/20 transition hover:opacity-90 active:scale-95"
        >
          Enter Site
          <ArrowRight className="h-4 w-4" />
        </button>
      </main>
    </div>
  );
};
