import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store/useAppStore';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { BrowsePage } from './pages/BrowsePage';
import { SeriesDetailPage } from './pages/SeriesDetailPage';
import { ReaderPage } from './pages/ReaderPage';
import { LibraryPage } from './pages/LibraryPage';
import { CommunityPage } from './pages/CommunityPage';
import { DMCAPage } from './pages/DMCAPage';
import { UploadRequestPage } from './pages/UploadRequestPage';
import { AdminPage } from './pages/AdminPage';
import { CreatorUploadPage } from './pages/CreatorUploadPage';
import { WriterDashboardPage } from './pages/WriterDashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="browse" element={<BrowsePage />} />
            <Route path="series/:id" element={<SeriesDetailPage />} />
            <Route path="series/:id/chapter/:chapterNumber" element={<ReaderPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="community" element={<CommunityPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="creator-upload" element={<CreatorUploadPage />} />
            <Route path="writer" element={<WriterDashboardPage />} />
            <Route path="dmca" element={<DMCAPage />} />
            <Route path="upload-request" element={<UploadRequestPage />} />
            <Route path="404" element={<NotFoundPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
