import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { ToastContainer } from './ToastContainer';
import { AuthModal } from './AuthModal';
import AdBanner from './AdBanner';
import PopunderAd from './PopunderAd';
import { hasEnteredSite } from '../pages/EntryLandingPage';

export const Layout: React.FC = () => {
  const location = useLocation();

  // Hide standard Navbar and Footer on the immersive Reader page for complete distraction-free viewing
  const isReaderPage = location.pathname.includes('/chapter/');

  // Don't show ads on legal/policy pages
  const noAdPaths = ['/terms', '/privacy', '/dmca', '/community-guidelines'];
  const isLegalPage = noAdPaths.some((path) =>
    location.pathname.toLowerCase().includes(path)
  );

  // Don't show ads until the user has clicked past the entry/welcome page
  const showAds = !isLegalPage && hasEnteredSite();

  return (
    <div className="min-h-screen flex flex-col bg-[#0E0A14] text-[#F5F1FF] light:bg-[#FAF7FF] light:text-[#1A1429] transition-colors duration-200 selection:bg-[#FF4D6D] selection:text-white">
      {!isReaderPage && <Navbar />}

      <main className="flex-1 w-full pb-16 md:pb-0">
        <Outlet />
      </main>

      {showAds && <AdBanner zoneId="6041584" />}
      {showAds && <PopunderAd />}

      {!isReaderPage && <Footer />}
      {!isReaderPage && <MobileBottomNav />}

      <ToastContainer />
      <AuthModal />
    </div>
  );
};
