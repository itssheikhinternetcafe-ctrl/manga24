import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store/useAppStore';
import { Layout } from './components/Layout';
import { EntryLandingPage } from './pages/EntryLandingPage';
import { BrowsePage } from './pages/BrowsePage';
import { SeriesDetailPage } from './pages/SeriesDetailPage';
import { ReaderPage } from './pages/ReaderPage';
import { LibraryPage } from './pages/LibraryPage';
import { CommunityPage } from './pages/CommunityPage';
import { DMCAPage } from './pages/DMCAPage';
import { AdminPage } from './pages/AdminPage';
import { CreatorUploadPage } from './pages/CreatorUploadPage';
import { WriterDashboardPage } from './pages/WriterDashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { TermsPage, PrivacyPage, ContentPolicyPage, CommunityGuidelinesPage } from './pages/LegalPages';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<EntryLandingPage />} />
            <Route path="browse" element={<BrowsePage />} />
            <Route path="series/:id" element={<SeriesDetailPage />} />
            <Route path="series/:id/chapter/:chapterNumber" element={<ReaderPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="community" element={<CommunityPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="creator-upload" element={<CreatorUploadPage />} />
            <Route path="writer" element={<WriterDashboardPage />} />
            <Route path="dmca" element={<DMCAPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="content-policy" element={<ContentPolicyPage />} />
            <Route path="community-guidelines" element={<CommunityGuidelinesPage />} />
            <Route path="404" element={<NotFoundPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
