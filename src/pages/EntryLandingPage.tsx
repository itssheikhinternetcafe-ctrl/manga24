import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight } from 'lucide-react';
import { SITE_NAME, SITE_URL } from '../config';
import { HomePage } from './HomePage';

const ENTRY_SESSION_KEY = 'manga24_site_entered_session';
const landingGenres = [
  { label: 'Action', path: '/browse?genre=Action' },
  { label: 'Romance', path: '/browse?genre=Romance' },
  { label: 'Fantasy', path: '/browse?genre=Fantasy' },
  { label: 'Isekai', path: '/browse?genre=Isekai' },
  { label: 'Mystery', path: '/browse?genre=Mystery' },
  { label: 'Sci-Fi', path: '/browse?genre=Sci-Fi' },
];

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

  useEffect(() => {
    if (entered) return;

    const description = 'Read manga online, discover free manhwa and manhua, and follow the latest webtoon updates on Manhwa24.';
    const previousTitle = document.title;
    const descriptionTag = document.querySelector('meta[name="description"]') || document.createElement('meta');
    const previousDescription = descriptionTag.getAttribute('content');
    const schema = document.createElement('script');

    document.title = 'Manhwa24 - Read Manga, Manhwa & Manhua Online Free';
    descriptionTag.setAttribute('name', 'description');
    descriptionTag.setAttribute('content', description);
    document.head.appendChild(descriptionTag);

    schema.type = 'application/ld+json';
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      description,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/browse?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    });
    document.head.appendChild(schema);

    return () => {
      document.title = previousTitle;
      if (previousDescription === null) {
        descriptionTag.remove();
      } else {
        descriptionTag.setAttribute('content', previousDescription);
      }
      schema.remove();
    };
  }, [entered]);

  const markSiteEntered = () => {
    try {
      sessionStorage.setItem(ENTRY_SESSION_KEY, 'true');
    } catch {
      // Continue into the site if session storage is unavailable.
    }
    setEntered(true);
  };

  const enterSite = () => {
    markSiteEntered();
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
        <h1 className="font-heading text-3xl font-black text-[#F5F1FF] light:text-[#1A1429] sm:text-5xl">
          Manhwa24 &mdash; Read Manga, Manhwa &amp; Manhua Online Free
        </h1>
        <button
          type="button"
          onClick={enterSite}
          className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-[#FF4D6D]/20 transition hover:opacity-90 active:scale-95"
        >
          Enter Site
          <ArrowRight className="h-4 w-4" />
        </button>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#A79FC0] light:text-[#6E6288]">
          Manhwa24 is a welcoming place to read manga online and discover stories from across Asia. Browse free manhwa from Korea, Japanese manga, and Chinese manhua in one easy-to-use library, with new chapters and latest webtoon updates added daily. Whether you are looking for a fast-paced action series, a thoughtful romance, or an imaginative fantasy adventure, you can find your next read without a signup. Explore by genre, follow the series you love, and return whenever a new chapter drops. Our reader is designed for comfortable browsing across desktop and mobile, so you can enjoy your reading list wherever you are.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2" aria-label="Browse genres">
          {landingGenres.map((genre) => (
            <Link
              key={genre.label}
              to={genre.path}
              onClick={markSiteEntered}
              className="rounded-lg border border-[#2C2340] bg-[#171122] px-3 py-1.5 text-xs font-semibold text-[#F5F1FF] transition hover:border-[#FF4D6D] hover:text-[#FF4D6D] light:bg-white light:text-[#1A1429] light:border-[#E2D9F3]"
            >
              {genre.label}
            </Link>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] text-[#A79FC0] light:text-[#6E6288]">
          <span>Age-verified 18+ content</span>
          <span>DMCA compliant</span>
          <span>No malware, no intrusive ads</span>
        </div>
      </main>
    </div>
  );
};
