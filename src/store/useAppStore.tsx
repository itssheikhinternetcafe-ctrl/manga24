import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../firebase';
import {
  UserProfile,
  ReadingStatus,
  ReadingProgress,
  LibraryItem,
  UserCollection,
  ReadingMode,
  FitMode,
  NotificationItem,
} from '../types';
import {
  dbGetUserProfile,
  dbSaveUserProfile,
  dbRequestCreator,
  dbSaveLibraryItem,
  dbSaveReadingProgress,
  dbGetUserLibrary,
  dbGetUserHistory,
} from '../services/db';

interface ToastInfo {
  id: string;
  type: 'success' | 'info' | 'error';
  title: string;
  message: string;
}

interface AppContextType {
  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Auth & Profile
  user: UserProfile | null;
  login: (username: string, email: string, role?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  claimAdminRole: () => Promise<void>;
  requestCreatorRole: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;

  // Library & Reading History
  library: Record<string, LibraryItem>;
  setSeriesLibraryStatus: (seriesId: string, status: ReadingStatus | null) => void;
  toggleBookmark: (seriesId: string) => void;
  setSeriesRating: (seriesId: string, rating: number) => void;
  readingHistory: Record<string, ReadingProgress>;
  updateReadingProgress: (seriesId: string, chapterNumber: number, pageNumber: number, percentage: number) => void;

  // Custom Collections
  collections: UserCollection[];
  createCollection: (name: string, description: string) => void;
  addSeriesToCollection: (collectionId: string, seriesId: string) => void;
  removeSeriesFromCollection: (collectionId: string, seriesId: string) => void;

  // Reader Settings
  readingMode: ReadingMode;
  setReadingMode: (mode: ReadingMode) => void;
  fitMode: FitMode;
  setFitMode: (fit: FitMode) => void;
  zoom: number;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  darkReaderMode: boolean;
  setDarkReaderMode: (enabled: boolean | ((prev: boolean) => boolean)) => void;

  // Notifications
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Toasts
  toasts: ToastInfo[];
  showToast: (title: string, message: string, type?: 'success' | 'info' | 'error') => void;
  dismissToast: (id: string) => void;

  // iOS PWA Guide Modal
  iosGuideOpen: boolean;
  setIosGuideOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('manga24_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('manga24_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // User Auth State - Starts completely empty until real user signs in
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('manga24_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          !parsed ||
          parsed.username?.toLowerCase().includes('mangalover') ||
          parsed.id?.startsWith('usr-fake') ||
          parsed.email?.includes('manga24.xyz') ||
          parsed.id?.includes('usr-17')
        ) {
          localStorage.removeItem('manga24_user');
          return null;
        }
        return parsed;
      } catch (e) {}
    }
    return null;
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Sync Firebase Auth state if active
  useEffect(() => {
    if (isFirebaseConfigured() && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          // Fetch existing user doc from Firestore 'users' collection
          const existingProfile = await dbGetUserProfile(fbUser.uid);
          const assignedRole = existingProfile?.role || 'user';

          const profile: UserProfile = {
            id: fbUser.uid,
            username: existingProfile?.username || fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email || existingProfile?.email || '',
            avatar: fbUser.photoURL || existingProfile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
            role: assignedRole,
            bio: existingProfile?.bio || 'Manga24 reader',
            joinedDate: existingProfile?.joinedDate || new Date().toLocaleDateString(),
            themePreference: existingProfile?.themePreference || theme,
            readerDefaultMode: existingProfile?.readerDefaultMode || 'webtoon',
            readerFitMode: existingProfile?.readerFitMode || 'width',
            readerDarkTrueBlack: existingProfile?.readerDarkTrueBlack || false,
            contentRatingFilter: existingProfile?.contentRatingFilter || 'all',
          };

          setUser(profile);
          localStorage.setItem('manga24_user', JSON.stringify(profile));

          if (!existingProfile) {
            // Persist new document in 'users' collection with role 'user'
            await dbSaveUserProfile(profile);
          }

          // Load remote library & history
          const remoteLib = await dbGetUserLibrary(fbUser.uid);
          if (Object.keys(remoteLib).length > 0) {
            setLibrary(remoteLib);
          }
          const remoteHist = await dbGetUserHistory(fbUser.uid);
          if (Object.keys(remoteHist).length > 0) {
            setReadingHistory(remoteHist);
          }
        } else {
          setUser(null);
          localStorage.removeItem('manga24_user');
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const login = async (username: string, email: string, role = 'user') => {
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      username,
      email,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      role: role as any,
      bio: 'Manga24 reader',
      joinedDate: 'Just now',
      themePreference: theme,
      readerDefaultMode: 'webtoon',
      readerFitMode: 'width',
      readerDarkTrueBlack: false,
      contentRatingFilter: 'all',
    };
    setUser(newUser);
    localStorage.setItem('manga24_user', JSON.stringify(newUser));
    dbSaveUserProfile(newUser);
    setAuthModalOpen(false);
    showToast('Signed In', `Welcome, ${username}!`, 'success');
  };

  const loginWithGoogle = async () => {
    if (isFirebaseConfigured() && auth) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const fbUser = result.user;

        // Check if document exists in 'users' collection
        const existingDoc = await dbGetUserProfile(fbUser.uid);
        const role = existingDoc?.role || 'user';

        const profile: UserProfile = {
          id: fbUser.uid,
          username: existingDoc?.username || fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          email: fbUser.email || '',
          avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
          role: role,
          bio: existingDoc?.bio || 'Manga24 reader',
          joinedDate: existingDoc?.joinedDate || new Date().toLocaleDateString(),
          themePreference: theme,
          readerDefaultMode: 'webtoon',
          readerFitMode: 'width',
          readerDarkTrueBlack: false,
          contentRatingFilter: 'all',
        };

        setUser(profile);
        localStorage.setItem('manga24_user', JSON.stringify(profile));
        await dbSaveUserProfile(profile);
        setAuthModalOpen(false);
        showToast('Signed In with Google', `Welcome, ${profile.username}!`, 'success');
        return;
      } catch (err: any) {
        console.warn('Google sign-in error:', err);
        showToast('Sign-In Error', err.message || 'Failed to authenticate with Google.', 'error');
        return;
      }
    }

    // Local instant fallback
    showToast('Not Connected', 'Firebase is not configured. Add the VITE_FIREBASE_* keys.', 'error');
  };

  const loginWithEmail = async (email: string, pass: string) => {
    if (isFirebaseConfigured() && auth) {
      try {
        const result = await signInWithEmailAndPassword(auth, email, pass);
        const fbUser = result.user;

        // Retrieve existing role from 'users' collection
        const existingDoc = await dbGetUserProfile(fbUser.uid);
        const role = existingDoc?.role || 'user';

        const profile: UserProfile = {
          id: fbUser.uid,
          username: existingDoc?.username || fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          email: fbUser.email || '',
          avatar: fbUser.photoURL || existingDoc?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
          role: role,
          bio: existingDoc?.bio || 'Manga24 reader',
          joinedDate: existingDoc?.joinedDate || new Date().toLocaleDateString(),
          themePreference: theme,
          readerDefaultMode: 'webtoon',
          readerFitMode: 'width',
          readerDarkTrueBlack: false,
          contentRatingFilter: 'all',
        };

        setUser(profile);
        localStorage.setItem('manga24_user', JSON.stringify(profile));
        await dbSaveUserProfile(profile);
        setAuthModalOpen(false);
        showToast('Welcome back!', `Signed in as ${profile.email}`, 'success');
        return;
      } catch (err: any) {
        showToast('Login Failed', err.message || 'Invalid email or password.', 'error');
        throw err;
      }
    }

    // Local fallback
    showToast('Not Connected', 'Firebase is not configured. Add the VITE_FIREBASE_* keys.', 'error');
  };

  const signupWithEmail = async (email: string, pass: string, username: string) => {
    if (isFirebaseConfigured() && auth) {
      try {
        const result = await createUserWithEmailAndPassword(auth, email, pass);
        const fbUser = result.user;

        // When a new user signs up, create a document in "users" with role "user"
        const profile: UserProfile = {
          id: fbUser.uid,
          username: username || fbUser.email?.split('@')[0] || 'User',
          email: fbUser.email || '',
          avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
          role: 'user',
          bio: 'Manga24 member',
          joinedDate: new Date().toLocaleDateString(),
          themePreference: theme,
          readerDefaultMode: 'webtoon',
          readerFitMode: 'width',
          readerDarkTrueBlack: false,
          contentRatingFilter: 'all',
        };

        setUser(profile);
        localStorage.setItem('manga24_user', JSON.stringify(profile));
        // Save to Firestore 'users' collection
        await dbSaveUserProfile(profile);
        setAuthModalOpen(false);
        showToast('Account Created!', `Welcome to Manga24, ${profile.username}!`, 'success');
        return;
      } catch (err: any) {
        showToast('Registration Failed', err.message || 'Could not create account.', 'error');
        throw err;
      }
    }

    // Local fallback with role: 'user'
    showToast('Not Connected', 'Firebase is not configured. Add the VITE_FIREBASE_* keys.', 'error');
  };

  const logout = async () => {
    if (isFirebaseConfigured() && auth) {
      try {
        await signOut(auth);
      } catch {}
    }
    setUser(null);
    localStorage.removeItem('manga24_user');
    showToast('Signed Out', 'You are now browsing as a Guest.', 'info');
  };

  // SECURITY: admin role can NEVER be self-assigned from the browser.
  // Set it manually in Firebase Console > Firestore > users > {your uid} > role = "admin".
  const claimAdminRole = async () => {
    showToast(
      'Admin role is protected',
      'Set role = "admin" on your document in Firestore (users collection) from the Firebase Console.',
      'info'
    );
  };

  // Creator request: only flags the account. An admin must approve it from the Admin Panel.
  const requestCreatorRole = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    try {
      await dbRequestCreator(user.id);
      showToast('Request Sent', 'An admin will review your creator request.', 'success');
    } catch {
      showToast('Error', 'Could not send creator request.', 'error');
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('manga24_user', JSON.stringify(updated));
    await dbSaveUserProfile(updated);
    showToast('Settings Saved', 'Your profile preferences were updated.', 'success');
  };

  // Library & Bookmarks - Starts 100% empty
  const [library, setLibrary] = useState<Record<string, LibraryItem>>(() => {
    const saved = localStorage.getItem('manga24_library');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('manga24_library', JSON.stringify(library));
  }, [library]);

  const setSeriesLibraryStatus = (seriesId: string, status: ReadingStatus | null) => {
    setLibrary((prev) => {
      const copy = { ...prev };
      if (!status) {
        delete copy[seriesId];
        showToast('Removed from Library', 'Series removed from your library.', 'info');
      } else {
        const item: LibraryItem = {
          seriesId,
          status,
          userRating: copy[seriesId]?.userRating,
          addedAt: copy[seriesId]?.addedAt || 'Just now',
          isBookmarked: true,
        };
        copy[seriesId] = item;
        if (user) {
          dbSaveLibraryItem(user.id, item);
        }
        showToast('Library Updated', `Moved to "${status}".`, 'success');
      }
      return copy;
    });
  };

  const toggleBookmark = (seriesId: string) => {
    setLibrary((prev) => {
      const copy = { ...prev };
      if (copy[seriesId]) {
        delete copy[seriesId];
        showToast('Bookmark Removed', 'Series removed from your library bookmarks.', 'info');
      } else {
        const item: LibraryItem = {
          seriesId,
          status: 'Reading',
          addedAt: 'Just now',
          isBookmarked: true,
        };
        copy[seriesId] = item;
        if (user) {
          dbSaveLibraryItem(user.id, item);
        }
        showToast('Bookmarked', 'Series added to your bookmarks.', 'success');
      }
      return copy;
    });
  };

  const setSeriesRating = (seriesId: string, rating: number) => {
    setLibrary((prev) => {
      const copy = { ...prev };
      const current = copy[seriesId] || {
        seriesId,
        status: 'Reading' as ReadingStatus,
        addedAt: 'Just now',
        isBookmarked: false,
      };
      copy[seriesId] = { ...current, userRating: rating };
      if (user) {
        dbSaveLibraryItem(user.id, copy[seriesId]);
      }
      return copy;
    });
    showToast('Rating Saved', `You gave this series ${rating} ★`, 'success');
  };

  // Reading History - Starts 100% empty
  const [readingHistory, setReadingHistory] = useState<Record<string, ReadingProgress>>(() => {
    const saved = localStorage.getItem('manga24_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('manga24_history', JSON.stringify(readingHistory));
  }, [readingHistory]);

  const updateReadingProgress = (
    seriesId: string,
    chapterNumber: number,
    pageNumber: number,
    percentage: number
  ) => {
    const progress: ReadingProgress = {
      seriesId,
      chapterNumber,
      pageNumber,
      lastReadAt: new Date().toISOString(),
      percentage,
    };
    setReadingHistory((prev) => ({
      ...prev,
      [seriesId]: progress,
    }));
    if (user) {
      dbSaveReadingProgress(user.id, progress);
    }
  };

  // Custom Collections
  const [collections, setCollections] = useState<UserCollection[]>(() => {
    const saved = localStorage.getItem('manga24_collections');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('manga24_collections', JSON.stringify(collections));
  }, [collections]);

  const createCollection = (name: string, description: string) => {
    const newCol: UserCollection = {
      id: `col-${Date.now()}`,
      name,
      description,
      ownerId: user?.id,
      ownerName: user?.username || 'Curator',
      ownerAvatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80',
      seriesIds: [],
      isPublic: true,
      updatedAt: 'Just now',
    };
    setCollections((prev) => [newCol, ...prev]);
    showToast('Collection Created', `Created "${name}" shelf.`, 'success');
  };

  const addSeriesToCollection = (collectionId: string, seriesId: string) => {
    setCollections((prev) =>
      prev.map((c) => {
        if (c.id === collectionId && !c.seriesIds.includes(seriesId)) {
          return { ...c, seriesIds: [...c.seriesIds, seriesId], updatedAt: 'Just now' };
        }
        return c;
      })
    );
    showToast('Added to Shelf', 'Series added to your custom collection.', 'success');
  };

  const removeSeriesFromCollection = (collectionId: string, seriesId: string) => {
    setCollections((prev) =>
      prev.map((c) => {
        if (c.id === collectionId) {
          return { ...c, seriesIds: c.seriesIds.filter((id) => id !== seriesId) };
        }
        return c;
      })
    );
  };

  // Reader Settings
  const [readingMode, setReadingMode] = useState<ReadingMode>(() => {
    return (localStorage.getItem('manga24_read_mode') as ReadingMode) || 'webtoon';
  });

  const [fitMode, setFitMode] = useState<FitMode>(() => {
    return (localStorage.getItem('manga24_fit_mode') as FitMode) || 'width';
  });

  const [zoom, setZoom] = useState<number>(100);
  const [darkReaderMode, setDarkReaderMode] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('manga24_read_mode', readingMode);
  }, [readingMode]);

  useEffect(() => {
    localStorage.setItem('manga24_fit_mode', fitMode);
  }, [fitMode]);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Welcome to Manga24!',
      message: 'Explore reader modes, publish stories in Admin Panel, and read 24/7.',
      timestamp: 'Just now',
      read: false,
      type: 'system',
      targetUrl: '/',
    },
  ]);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Toast System
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  const showToast = (title: string, message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // iOS Guide Modal
  const [iosGuideOpen, setIosGuideOpen] = useState(false);

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        user,
        login,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,
        claimAdminRole,
        requestCreatorRole,
        updateProfile,
        authModalOpen,
        setAuthModalOpen,
        library,
        setSeriesLibraryStatus,
        toggleBookmark,
        setSeriesRating,
        readingHistory,
        updateReadingProgress,
        collections,
        createCollection,
        addSeriesToCollection,
        removeSeriesFromCollection,
        readingMode,
        setReadingMode,
        fitMode,
        setFitMode,
        zoom,
        setZoom,
        darkReaderMode,
        setDarkReaderMode,
        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        toasts,
        showToast,
        dismissToast,
        iosGuideOpen,
        setIosGuideOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
};
