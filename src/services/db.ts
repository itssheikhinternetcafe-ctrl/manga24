/**
 * Manga24 Firestore Database Service
 * 
 * Provides unified data access for Manga24:
 * - When Firebase is configured in `src/firebase.ts`, performs live reads and writes to Cloud Firestore.
 * - When Firebase keys are in placeholder mode, operates an isolated, persistent local storage
 *   engine with identical schema and behaviors so the site starts 100% EMPTY, never crashes,
 *   and allows the admin to immediately publish content.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  increment,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import {
  Series,
  Chapter,
  UserComment,
  CommunityPost,
  UserCollection,
  UserProfile,
  SiteSettings,
  FilterOptions,
  LibraryItem,
  ReadingProgress,
  StoryApprovalStatus,
  UploadSubmission,
  ContentReport,
  ReportReason,
  AdminLog,
  ContentRating,
  ModerationStatus,
  CreatorStatus,
} from '../types';

const STORAGE_KEYS = {
  SERIES: 'manga24_db_series',
  CHAPTERS: 'manga24_db_chapters',
  COMMENTS: 'manga24_db_comments',
  POSTS: 'manga24_db_posts',
  COLLECTIONS: 'manga24_db_collections',
  SETTINGS: 'manga24_db_settings',
  USERS: 'manga24_db_users',
  LIBRARY: 'manga24_db_library',
  HISTORY: 'manga24_db_history',
  FOLLOWS: 'manga24_db_follows',
  SUBMISSIONS: 'manga24_db_submissions',
  REPORTS: 'manga24_db_reports',
  ADMIN_LOGS: 'manga24_db_admin_logs',
};

// Fallback local storage helpers
function getLocal<T>(key: string, defaultVal: T): T {
  // When Firebase is configured, NEVER read from the browser (no fake/local data).
  if (isFirebaseConfigured()) return defaultVal;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocal<T>(key: string, val: T): void {
  if (isFirebaseConfigured()) return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.warn('[LocalStorage] Quota exceeded or error saving:', err);
  }
}

export const defaultSettings: SiteSettings = {
  siteName: 'Manhwa24',
  logoUrl: '',
  announcementText: 'Welcome to Manhwa24 — Read fast, free, and 24/7!',
  announcementEnabled: true,
  featuredSeriesIds: [],
  allowCreatorSubmissions: true,
};

// ----------------------------------------------------------------------
// SERIES OPERATIONS
// ----------------------------------------------------------------------

export async function dbGetSeries(filters?: Partial<FilterOptions>, includeDrafts = false): Promise<{ items: Series[]; total: number; totalPages: number }> {
  let allSeries: Series[] = [];

  if (isFirebaseConfigured() && db) {
    try {
      const seriesCol = collection(db, 'series');
      let q = query(seriesCol);
      if (!includeDrafts) {
        q = query(seriesCol, where('approvalStatus', '==', 'published'));
      }
      const snapshot = await getDocs(q);
      allSeries = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Series));
    } catch (err) {
      console.warn('[Firestore] Error fetching series, falling back to local store:', err);
      allSeries = getLocal<Series[]>(STORAGE_KEYS.SERIES, []);
    }
  } else {
    allSeries = getLocal<Series[]>(STORAGE_KEYS.SERIES, []);
    if (!includeDrafts) {
      allSeries = allSeries.filter((s) => s.approvalStatus === 'published');
    }
  }

  // Ensure compatibility fields
  allSeries = allSeries.map(normalizeSeries);

  // Apply filters
  let filtered = [...allSeries];

  if (filters?.query && filters.query.trim() !== '') {
    const q = filters.query.toLowerCase().trim();
    filtered = filtered.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.altTitles && s.altTitles.some((alt) => alt.toLowerCase().includes(q))) ||
        (s.author && s.author.toLowerCase().includes(q)) ||
        (s.genres && s.genres.some((g) => g.toLowerCase().includes(q)))
    );
  }

  if (filters?.types && filters.types.length > 0) {
    filtered = filtered.filter((s) => filters.types!.includes(s.type));
  }

  if (filters?.statuses && filters.statuses.length > 0) {
    filtered = filtered.filter((s) => filters.statuses!.includes(s.status));
  }

  if (filters?.genres && filters.genres.length > 0) {
    filtered = filtered.filter((s) => filters.genres!.every((g) => s.genres?.includes(g)));
  }

  if (filters?.contentRatings && filters.contentRatings.length > 0) {
    filtered = filtered.filter((s) => filters.contentRatings!.includes(s.contentRating));
  }

  if (!filters?.includeAdult) {
    filtered = filtered.filter((s) => s.contentRating !== '18+');
  }

  // Sort
  if (filters?.sortBy) {
    switch (filters.sortBy) {
      case 'popular':
        filtered.sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0));
        break;
      case 'latest':
        filtered.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'az':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'chapters':
        filtered.sort((a, b) => (b.totalChapters || 0) - (a.totalChapters || 0));
        break;
      default:
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    }
  } else {
    filtered.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  }

  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return { items: paginated, total, totalPages };
}

export async function dbGetSeriesById(idOrSlug: string): Promise<Series | null> {
  if (isFirebaseConfigured() && db) {
    try {
      // Check by ID
      const docRef = doc(db, 'series', idOrSlug);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const item = { id: snapshot.id, ...snapshot.data() } as Series;
        return normalizeSeries(item);
      }

      // Check by slug
      const q = query(collection(db, 'series'), where('slug', '==', idOrSlug), where('approvalStatus', '==', 'published'), firestoreLimit(1));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const first = querySnap.docs[0];
        return normalizeSeries({ id: first.id, ...first.data() } as Series);
      }
    } catch (err) {
      console.warn('[Firestore] Error getting series by ID:', err);
    }
  }

  const local = getLocal<Series[]>(STORAGE_KEYS.SERIES, []);
  const found = local.find((s) => s.id === idOrSlug || s.slug === idOrSlug);
  return found ? normalizeSeries(found) : null;
}

export async function dbCreateSeries(seriesData: Partial<Series>): Promise<Series> {
  const now = new Date().toISOString();
  const id = seriesData.id || `series-${Date.now()}`;
  const slug = (seriesData.slug || seriesData.title || id)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const newSeries: Series = {
    id,
    slug,
    title: seriesData.title || 'Untitled Series',
    altTitles: seriesData.altTitles || [],
    synopsis: seriesData.synopsis || '',
    type: seriesData.type || 'Manga',
    genres: seriesData.genres || [],
    tags: seriesData.tags || [],
    status: seriesData.status || 'Ongoing',
    contentRating: seriesData.contentRating || 'safe',
    coverUrl: seriesData.coverUrl || seriesData.coverImage || '',
    bannerUrl: seriesData.bannerUrl || seriesData.bannerImage || '',
    author: seriesData.author || (seriesData.authors?.[0]) || 'Unknown Author',
    artist: seriesData.artist || (seriesData.artists?.[0]) || '',
    featured: Boolean(seriesData.featured || seriesData.isFeatured),
    isDraft: Boolean(seriesData.isDraft),
    createdAt: now,
    updatedAt: now,
    views: 0,
    followersCount: 0,
    rating: 5.0,
    ratingCount: 1,
    totalChapters: 0,
    latestChapterNumber: 0,
    latestUpdateDate: now.split('T')[0],
    creatorId: seriesData.creatorId,
    approvalStatus: seriesData.approvalStatus || 'published',
    authorId: seriesData.authorId || seriesData.creatorId,
    authorName: seriesData.authorName || seriesData.author || 'Unknown Author',
    rejectionReason: seriesData.rejectionReason || '',
    uploadedBy: seriesData.uploadedBy || seriesData.authorId || seriesData.creatorId,
    uploadedAt: seriesData.uploadedAt || now,
    uploadDeclarations: seriesData.uploadDeclarations,
  };

  normalizeSeries(newSeries);

  if (isFirebaseConfigured() && db) {
    try {
      const isAuthorSubmission = Boolean(newSeries.authorId) && ['draft', 'pending', 'published'].includes(newSeries.approvalStatus || '');
      if (isAuthorSubmission) {
        const {
          featured: _featured,
          isFeatured: _isFeatured,
          isTrending: _isTrending,
          isEditorPick: _isEditorPick,
          views: _views,
          followersCount: _followersCount,
          rating: _rating,
          ratingCount: _ratingCount,
          createdAt: _createdAt,
          ...writerSeries
        } = newSeries;
        await setDoc(doc(db, 'series', id), { ...writerSeries, createdAt: serverTimestamp() });
      } else {
        await setDoc(doc(db, 'series', id), newSeries);
      }
    } catch (err) {
      console.error('[Firestore] Save error:', err);
      throw err;
    }
  }

  // Always keep local updated
  const local = getLocal<Series[]>(STORAGE_KEYS.SERIES, []);
  setLocal(STORAGE_KEYS.SERIES, [newSeries, ...local.filter((s) => s.id !== id)]);

  return newSeries;
}

export async function dbCreateSubmission(data: Omit<UploadSubmission, 'id' | 'uploadedAt' | 'status'>): Promise<UploadSubmission> {
  const submission: UploadSubmission = {
    ...data,
    id: `submission-${Date.now()}`,
    uploadedAt: new Date().toISOString(),
    status: 'pending',
  };
  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, 'submissions', submission.id), submission);
  }
  const saved = getLocal<UploadSubmission[]>(STORAGE_KEYS.SUBMISSIONS, []);
  setLocal(STORAGE_KEYS.SUBMISSIONS, [submission, ...saved]);
  return submission;
}

export async function dbCreateReport(data: { reporterId?: string; seriesId: string; chapterId?: string; reason: ReportReason; message: string }): Promise<ContentReport> {
  const report: ContentReport = { ...data, id: `report-${Date.now()}`, createdAt: new Date().toISOString(), status: 'open' };
  if (isFirebaseConfigured() && db) await setDoc(doc(db, 'reports', report.id), report);
  const reports = getLocal<ContentReport[]>(STORAGE_KEYS.REPORTS, []);
  setLocal(STORAGE_KEYS.REPORTS, [report, ...reports]);
  const targetReports = (await dbGetReports()).filter((item) => item.status === 'open' && item.seriesId === report.seriesId && item.chapterId === report.chapterId && item.reporterId);
  if (new Set(targetReports.map((item) => item.reporterId)).size >= 3) {
    if (report.chapterId) {
      await dbUpdateChapter(report.chapterId, { approvalStatus: 'under-review', isDraft: true });
    } else {
      await dbUpdateSeries(report.seriesId, { approvalStatus: 'under-review', isDraft: true });
    }
  }
  return report;
}

export async function dbGetReports(): Promise<ContentReport[]> {
  if (isFirebaseConfigured() && db) {
    const snap = await getDocs(collection(db, 'reports'));
    return snap.docs.map((item) => ({ id: item.id, ...item.data() } as ContentReport));
  }
  return getLocal<ContentReport[]>(STORAGE_KEYS.REPORTS, []);
}

export async function dbUpdateReport(id: string, updates: Partial<ContentReport>): Promise<void> {
  if (isFirebaseConfigured() && db) await updateDoc(doc(db, 'reports', id), updates);
  const reports = getLocal<ContentReport[]>(STORAGE_KEYS.REPORTS, []);
  setLocal(STORAGE_KEYS.REPORTS, reports.map((report) => report.id === id ? { ...report, ...updates } : report));
}

export async function dbAddUserStrike(userId: string): Promise<void> {
  if (isFirebaseConfigured() && db) await updateDoc(doc(db, 'users', userId), { strikes: increment(1) });
  const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, []);
  setLocal(STORAGE_KEYS.USERS, users.map((user) => user.id === userId ? { ...user, strikes: (user.strikes || 0) + 1 } : user));
}

export async function dbIncrementApprovedAdultChapters(userId: string): Promise<void> {
  if (isFirebaseConfigured() && db) await updateDoc(doc(db, 'users', userId), { approvedAdultChapters: increment(1) });
  const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, []);
  setLocal(STORAGE_KEYS.USERS, users.map((user) => user.id === userId ? { ...user, approvedAdultChapters: (user.approvedAdultChapters || 0) + 1 } : user));
}

export async function dbUpdateSeries(id: string, updates: Partial<Series>): Promise<Series | null> {
  const now = new Date().toISOString();
  const existing = await dbGetSeriesById(id);
  if (!existing) return null;

  const updated: Series = {
    ...existing,
    ...updates,
    updatedAt: now,
    approvalStatus: updates.approvalStatus || existing.approvalStatus || (updates.isDraft ? 'draft' : 'published'),
    coverUrl: updates.coverUrl || updates.coverImage || existing.coverUrl,
    bannerUrl: updates.bannerUrl || updates.bannerImage || existing.bannerUrl,
  };

  normalizeSeries(updated);

  if (isFirebaseConfigured() && db) {
    try {
      const firestoreUpdates: Partial<Series> = {
        ...updates,
        updatedAt: now,
        coverUrl: updates.coverUrl || updates.coverImage,
        bannerUrl: updates.bannerUrl || updates.bannerImage,
      };
      delete firestoreUpdates.coverImage;
      delete firestoreUpdates.bannerImage;
      await setDoc(doc(db, 'series', id), firestoreUpdates, { merge: true });
    } catch (err) {
      console.error('[Firestore] Update series error:', err);
      throw err;
    }
  }

  const local = getLocal<Series[]>(STORAGE_KEYS.SERIES, []);
  setLocal(
    STORAGE_KEYS.SERIES,
    local.map((s) => (s.id === id ? updated : s))
  );

  return updated;
}

export async function dbGetSeriesByAuthor(authorId: string): Promise<Series[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(query(collection(db, 'series'), where('authorId', '==', authorId)));
      return snap.docs.map((item) => normalizeSeries({ id: item.id, ...item.data() } as Series));
    } catch (err) {
      console.warn('[Firestore] Error getting author stories:', err);
      return [];
    }
  }

  return getLocal<Series[]>(STORAGE_KEYS.SERIES, [])
    .filter((series) => series.authorId === authorId)
    .map(normalizeSeries);
}

export async function dbUpdateAuthorStories(authorId: string, author: string): Promise<number> {
  const stories = (await dbGetSeriesByAuthor(authorId)).filter((series) => series.approvalStatus !== 'rejected');
  for (const story of stories) {
    await dbUpdateSeries(story.id, { author, authorName: author });
  }
  return stories.length;
}

export async function dbDeleteSeries(id: string): Promise<boolean> {
  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, 'series', id));
    } catch (err) {
      console.error('[Firestore] Delete series error:', err);
      throw err;
    }
  }

  const local = getLocal<Series[]>(STORAGE_KEYS.SERIES, []);
  setLocal(
    STORAGE_KEYS.SERIES,
    local.filter((s) => s.id !== id)
  );

  // Delete all chapters belonging to this series
  const chapters = getLocal<Chapter[]>(STORAGE_KEYS.CHAPTERS, []);
  setLocal(
    STORAGE_KEYS.CHAPTERS,
    chapters.filter((c) => c.seriesId !== id)
  );

  return true;
}

export async function dbModerateSeries(id: string, updates: {
  contentRating?: ContentRating;
  moderationStatus?: ModerationStatus;
  flaggedForReview?: boolean;
  moderationUpdatedAt?: string;
  moderationUpdatedBy?: string;
}): Promise<void> {
  if (isFirebaseConfigured() && db) {
    await updateDoc(doc(db, 'series', id), updates);
  }
  const series = getLocal<Series[]>(STORAGE_KEYS.SERIES, []);
  setLocal(STORAGE_KEYS.SERIES, series.map((item) => item.id === id ? { ...item, ...updates } : item));
}

export async function dbModerateWriter(userId: string, updates: {
  creatorStatus: CreatorStatus;
  moderationUpdatedAt: string;
  moderationUpdatedBy: string;
}): Promise<void> {
  if (isFirebaseConfigured() && db) {
    await updateDoc(doc(db, 'users', userId), updates);
  }
  const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, []);
  setLocal(STORAGE_KEYS.USERS, users.map((item) => item.id === userId ? { ...item, ...updates } : item));
  const stories = getLocal<Series[]>(STORAGE_KEYS.SERIES, []);
  setLocal(STORAGE_KEYS.SERIES, stories.map((item) => item.authorId === userId ? {
    ...item,
    moderationStatus: updates.creatorStatus === 'active' ? 'active' : 'suspended',
    moderationUpdatedAt: updates.moderationUpdatedAt,
    moderationUpdatedBy: updates.moderationUpdatedBy,
  } : item));
}

export async function dbGetAdminLogs(): Promise<AdminLog[]> {
  if (isFirebaseConfigured() && db) {
    const snapshot = await getDocs(query(collection(db, 'adminLogs'), orderBy('createdAt', 'desc'), firestoreLimit(250)));
    return snapshot.docs.map((item) => {
      const data = item.data() as Omit<AdminLog, 'id' | 'createdAt'> & { createdAt?: string | { toDate?: () => Date } };
      const createdAt = typeof data.createdAt === 'string' ? data.createdAt : data.createdAt?.toDate?.().toISOString() || new Date().toISOString();
      return { id: item.id, ...data, createdAt } as AdminLog;
    });
  }
  return getLocal<AdminLog[]>(STORAGE_KEYS.ADMIN_LOGS, []);
}

export async function dbSaveAdminLog(log: AdminLog): Promise<void> {
  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, 'adminLogs', log.id), { ...log, createdAt: serverTimestamp() });
  }
  const logs = getLocal<AdminLog[]>(STORAGE_KEYS.ADMIN_LOGS, []);
  setLocal(STORAGE_KEYS.ADMIN_LOGS, [log, ...logs]);
}

// ----------------------------------------------------------------------
// CHAPTER OPERATIONS
// ----------------------------------------------------------------------

export async function dbGetChapters(seriesId: string, includeDrafts = false): Promise<Chapter[]> {
  let list: Chapter[] = [];

  if (isFirebaseConfigured() && db) {
    try {
      const q = includeDrafts
        ? query(collection(db, 'chapters'), where('seriesId', '==', seriesId))
        : query(collection(db, 'chapters'), where('seriesId', '==', seriesId), where('approvalStatus', '==', 'published'), where('isDraft', '==', false));
      const snap = await getDocs(q);
      list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Chapter));
    } catch (err) {
      console.error('[Firestore] Error getting chapters:', err);
      list = [];
    }
  } else {
    list = getLocal<Chapter[]>(STORAGE_KEYS.CHAPTERS, []).filter((c) => c.seriesId === seriesId);
  }

  if (!includeDrafts) {
    list = list.filter((c) => !c.isDraft && c.approvalStatus === 'published');
  }

  return list.sort((a, b) => b.number - a.number);
}

export async function dbGetChapter(seriesId: string, chapterNumber: number, includeDrafts = false): Promise<Chapter | null> {
  const chapters = await dbGetChapters(seriesId, includeDrafts);
  return chapters.find((c) => c.number === chapterNumber || c.chapterNumber === chapterNumber) || null;
}

export async function dbCreateChapter(chapterData: Partial<Chapter>): Promise<Chapter> {
  const now = new Date().toISOString();
  const num = chapterData.number ?? chapterData.chapterNumber ?? 1;
  const id = chapterData.id || `${chapterData.seriesId}-ch-${num}-${Date.now()}`;

  const newChapter: Chapter = {
    id,
    seriesId: chapterData.seriesId!,
    number: num,
    chapterNumber: num,
    title: chapterData.title || `Chapter ${num}`,
    pages: chapterData.pages || [],
    textContent: chapterData.textContent || '',
    publishedAt: chapterData.publishedAt || now,
    views: 0,
    likes: 0,
    isDraft: Boolean(chapterData.isDraft),
    scheduledAt: chapterData.scheduledAt,
    approvalStatus: chapterData.approvalStatus || 'published',
    creatorId: chapterData.creatorId,
    authorId: chapterData.authorId || chapterData.creatorId,
    authorName: chapterData.authorName,
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'chapters', id), newChapter);
    } catch (err) {
      console.error('[Firestore] Create chapter error:', err);
      throw err;
    }
  }

  const local = getLocal<Chapter[]>(STORAGE_KEYS.CHAPTERS, []);
  setLocal(STORAGE_KEYS.CHAPTERS, [newChapter, ...local.filter((c) => c.id !== id)]);

  // Update series latest chapter info
  const series = await dbGetSeriesById(newChapter.seriesId);
  if (series) {
    const allSeriesChapters = await dbGetChapters(newChapter.seriesId, false);
    const maxNum = allSeriesChapters.reduce((max, chapter) => Math.max(max, chapter.number), 0);
    await dbUpdateSeries(series.id, {
      totalChapters: allSeriesChapters.length,
      latestChapterNumber: maxNum,
      latestUpdateDate: now.split('T')[0],
    });
  }

  return newChapter;
}

export async function dbUpdateChapter(id: string, updates: Partial<Chapter>): Promise<Chapter | null> {
  const local = getLocal<Chapter[]>(STORAGE_KEYS.CHAPTERS, []);
  let existing = local.find((c) => c.id === id);

  if (!existing && isFirebaseConfigured() && db) {
    const snapshot = await getDoc(doc(db, 'chapters', id));
    if (snapshot.exists()) existing = { id: snapshot.id, ...snapshot.data() } as Chapter;
  }

  if (!existing) return null;

  const updated: Chapter = {
    ...existing,
    ...updates,
    seriesId: existing.seriesId,
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'chapters', id), updated, { merge: true });
    } catch (err) {
      console.error('[Firestore] Update chapter error:', err);
      throw err;
    }
  }

  setLocal(
    STORAGE_KEYS.CHAPTERS,
    [updated, ...local.filter((c) => c.id !== id)]
  );

  const publishedChapters = await dbGetChapters(updated.seriesId, false);
  const series = await dbGetSeriesById(updated.seriesId);
  if (series) {
    await dbUpdateSeries(series.id, {
      totalChapters: publishedChapters.length,
      latestChapterNumber: publishedChapters.reduce((max, chapter) => Math.max(max, chapter.number), 0),
      latestUpdateDate: new Date().toISOString().split('T')[0],
    });
  }

  return updated;
}

export async function dbDeleteChapter(id: string): Promise<boolean> {
  const local = getLocal<Chapter[]>(STORAGE_KEYS.CHAPTERS, []);
  const chapter = local.find((c) => c.id === id);
  if (!chapter) return false;

  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, 'chapters', id));
    } catch (err) {
      console.error('[Firestore] Delete chapter error:', err);
      throw err;
    }
  }

  setLocal(
    STORAGE_KEYS.CHAPTERS,
    local.filter((c) => c.id !== id)
  );

  // Recount series chapters
  const remaining = local.filter((c) => c.seriesId === chapter.seriesId && c.id !== id && !c.isDraft);
  const maxNum = remaining.reduce((max, c) => Math.max(max, c.number), 0);
  await dbUpdateSeries(chapter.seriesId, {
    totalChapters: remaining.length,
    latestChapterNumber: maxNum,
  });

  return true;
}

export async function dbIncrementSeriesView(seriesId: string): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      await updateDoc(doc(db, 'series', seriesId), {
        views: increment(1),
      });
    } catch {
      // Ignored
    }
  }

  const local = getLocal<Series[]>(STORAGE_KEYS.SERIES, []);
  setLocal(
    STORAGE_KEYS.SERIES,
    local.map((s) => (s.id === seriesId ? { ...s, views: (s.views || 0) + 1 } : s))
  );
}

// ----------------------------------------------------------------------
// COMMENTS
// ----------------------------------------------------------------------

export async function dbGetComments(seriesId?: string, chapterId?: string): Promise<UserComment[]> {
  let comments = getLocal<UserComment[]>(STORAGE_KEYS.COMMENTS, []);

  if (isFirebaseConfigured() && db) {
    try {
      const col = collection(db, 'comments');
      let q = query(col);
      if (chapterId) {
        q = query(col, where('chapterId', '==', chapterId));
      } else if (seriesId) {
        q = query(col, where('seriesId', '==', seriesId));
      }
      const snap = await getDocs(q);
      comments = snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserComment));
    } catch (err) {
      console.warn('[Firestore] Error getting comments:', err);
    }
  }

  if (chapterId) {
    comments = comments.filter((c) => c.chapterId === chapterId && !c.isDeleted);
  } else if (seriesId) {
    comments = comments.filter((c) => c.seriesId === seriesId && !c.isDeleted);
  }

  return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function dbPostComment(commentData: Partial<UserComment>): Promise<UserComment> {
  const id = `comment-${Date.now()}`;
  const newComment: UserComment = {
    id,
    seriesId: commentData.seriesId,
    chapterId: commentData.chapterId,
    postId: commentData.postId,
    authorId: commentData.authorId || 'usr-anon',
    authorName: commentData.authorName || 'Reader',
    authorAvatar: commentData.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80',
    authorBadge: commentData.authorBadge || 'Reader',
    content: commentData.content || '',
    createdAt: new Date().toISOString(),
    likes: 0,
    dislikes: 0,
    isSpoiler: Boolean(commentData.isSpoiler),
    isDeleted: false,
    replies: [],
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'comments', id), newComment);
    } catch (err) {
      console.error('[Firestore] Post comment error:', err);
      throw err;
    }
  }

  const local = getLocal<UserComment[]>(STORAGE_KEYS.COMMENTS, []);
  setLocal(STORAGE_KEYS.COMMENTS, [newComment, ...local]);

  return newComment;
}

export async function dbDeleteComment(commentId: string): Promise<boolean> {
  if (isFirebaseConfigured() && db) {
    try {
      await updateDoc(doc(db, 'comments', commentId), { isDeleted: true });
    } catch (err) {
      console.error('[Firestore] Delete comment error:', err);
      throw err;
    }
  }

  const local = getLocal<UserComment[]>(STORAGE_KEYS.COMMENTS, []);
  setLocal(
    STORAGE_KEYS.COMMENTS,
    local.map((c) => (c.id === commentId ? { ...c, isDeleted: true } : c))
  );

  return true;
}

// ----------------------------------------------------------------------
// COMMUNITY POSTS
// ----------------------------------------------------------------------

export async function dbGetCommunityPosts(category?: string): Promise<CommunityPost[]> {
  let posts = getLocal<CommunityPost[]>(STORAGE_KEYS.POSTS, []);

  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(collection(db, 'posts'));
      posts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CommunityPost));
    } catch (err) {
      console.warn('[Firestore] Error getting posts:', err);
    }
  }

  if (category && category !== 'All') {
    posts = posts.filter((p) => p.category === category);
  }

  return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function dbCreateCommunityPost(post: Partial<CommunityPost>): Promise<CommunityPost> {
  const id = `post-${Date.now()}`;
  const newPost: CommunityPost = {
    id,
    title: post.title || 'Untitled Post',
    category: post.category || 'General',
    content: post.content || '',
    excerpt: (post.content || '').slice(0, 150),
    authorId: post.authorId || 'usr-anon',
    authorName: post.authorName || 'Community Member',
    authorAvatar: post.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80',
    authorBadge: post.authorBadge || 'Reader',
    createdAt: new Date().toISOString(),
    likes: 0,
    commentCount: 0,
    pinned: false,
    tags: post.tags || [],
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'posts', id), newPost);
    } catch (err) {
      console.error('[Firestore] Create post error:', err);
      throw err;
    }
  }

  const local = getLocal<CommunityPost[]>(STORAGE_KEYS.POSTS, []);
  setLocal(STORAGE_KEYS.POSTS, [newPost, ...local]);

  return newPost;
}

// ----------------------------------------------------------------------
// USER MANAGEMENT & ROLES
// ----------------------------------------------------------------------

export async function dbGetUsers(): Promise<UserProfile[]> {
  let users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, []);

  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(collection(db, 'users'));
      users = snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserProfile));
    } catch (err) {
      console.warn('[Firestore] Error getting users:', err);
    }
  }

  return users;
}

export async function dbGetUserProfile(userId: string): Promise<UserProfile | null> {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as UserProfile;
      }
    } catch (err) {
      console.warn('[Firestore] Error getting user profile:', err);
    }
  }

  const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, []);
  return users.find((u) => u.id === userId) || null;
}

export async function dbSaveUserProfile(profile: UserProfile): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'users', profile.id), profile, { merge: true });
    } catch (err) {
      console.error('[Firestore] Save user error:', err);
      throw err;
    }
  }

  const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, []);
  setLocal(
    STORAGE_KEYS.USERS,
    [profile, ...users.filter((u) => u.id !== profile.id)]
  );
}

export async function dbUpdateUserRole(userId: string, role: 'admin' | 'creator' | 'reader' | 'VIP' | 'user'): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      await updateDoc(doc(db, 'users', userId), { role });
    } catch (err) {
      console.error('[Firestore] Update user role error:', err);
      throw err;
    }
  }

  const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, []);
  setLocal(
    STORAGE_KEYS.USERS,
    users.map((u) => (u.id === userId ? { ...u, role } : u))
  );
}

export async function dbRequestCreator(userId: string): Promise<void> {
  if (isFirebaseConfigured() && db) {
    await updateDoc(doc(db, 'users', userId), { creatorRequested: true });
  }
}

export async function dbToggleBanUser(userId: string, isBanned: boolean): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      await updateDoc(doc(db, 'users', userId), { isBanned });
    } catch (err) {
      console.error('[Firestore] Ban user error:', err);
      throw err;
    }
  }

  const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, []);
  setLocal(
    STORAGE_KEYS.USERS,
    users.map((u) => (u.id === userId ? { ...u, isBanned } : u))
  );
}

// ----------------------------------------------------------------------
// SITE SETTINGS
// ----------------------------------------------------------------------

export async function dbGetSiteSettings(): Promise<SiteSettings> {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDoc(doc(db, 'settings', 'global'));
      if (snap.exists()) {
        return { ...defaultSettings, ...snap.data() } as SiteSettings;
      }
    } catch (err) {
      console.warn('[Firestore] Error getting settings:', err);
    }
  }

  return getLocal<SiteSettings>(STORAGE_KEYS.SETTINGS, defaultSettings);
}

export async function dbUpdateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await dbGetSiteSettings();
  const merged = { ...current, ...settings };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'settings', 'global'), merged, { merge: true });
    } catch (err) {
      console.error('[Firestore] Save settings error:', err);
      throw err;
    }
  }

  setLocal(STORAGE_KEYS.SETTINGS, merged);
  return merged;
}

// ----------------------------------------------------------------------
// USER LIBRARY, FOLLOWS & HISTORY
// ----------------------------------------------------------------------

export async function dbGetUserLibrary(userId: string): Promise<Record<string, LibraryItem>> {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, 'library'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const res: Record<string, LibraryItem> = {};
      snap.docs.forEach((d) => {
        const data = d.data() as LibraryItem & { seriesId: string };
        res[data.seriesId] = data;
      });
      return res;
    } catch (err) {
      console.warn('[Firestore] Error getting library:', err);
    }
  }

  return getLocal<Record<string, LibraryItem>>(`${STORAGE_KEYS.LIBRARY}_${userId}`, {});
}

export async function dbSaveLibraryItem(userId: string, item: LibraryItem): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'library', `${userId}_${item.seriesId}`), { ...item, userId });
    } catch (err) {
      console.error('[Firestore] Save library error:', err);
      throw err;
    }
  }

  const lib = getLocal<Record<string, LibraryItem>>(`${STORAGE_KEYS.LIBRARY}_${userId}`, {});
  lib[item.seriesId] = item;
  setLocal(`${STORAGE_KEYS.LIBRARY}_${userId}`, lib);
}

export async function dbGetUserHistory(userId: string): Promise<Record<string, ReadingProgress>> {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, 'readingHistory'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const res: Record<string, ReadingProgress> = {};
      snap.docs.forEach((d) => {
        const data = d.data() as ReadingProgress & { seriesId: string };
        res[data.seriesId] = data;
      });
      return res;
    } catch (err) {
      console.warn('[Firestore] Error getting history:', err);
    }
  }

  return getLocal<Record<string, ReadingProgress>>(`${STORAGE_KEYS.HISTORY}_${userId}`, {});
}

export async function dbSaveReadingProgress(userId: string, progress: ReadingProgress): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'readingHistory', `${userId}_${progress.seriesId}`), { ...progress, userId });
    } catch (err) {
      console.error('[Firestore] Save history error:', err);
      throw err;
    }
  }

  const hist = getLocal<Record<string, ReadingProgress>>(`${STORAGE_KEYS.HISTORY}_${userId}`, {});
  hist[progress.seriesId] = progress;
  setLocal(`${STORAGE_KEYS.HISTORY}_${userId}`, hist);
}

export async function dbToggleFollow(userId: string, seriesId: string): Promise<boolean> {
  const followDocId = `${userId}_${seriesId}`;
  let isFollowing = false;

  const follows = getLocal<string[]>(`${STORAGE_KEYS.FOLLOWS}_${userId}`, []);
  if (follows.includes(seriesId)) {
    const updated = follows.filter((id) => id !== seriesId);
    setLocal(`${STORAGE_KEYS.FOLLOWS}_${userId}`, updated);
    isFollowing = false;
  } else {
    setLocal(`${STORAGE_KEYS.FOLLOWS}_${userId}`, [...follows, seriesId]);
    isFollowing = true;
  }

  if (isFirebaseConfigured() && db) {
    try {
      if (isFollowing) {
        await setDoc(doc(db, 'follows', followDocId), { userId, seriesId, createdAt: new Date().toISOString() });
        await updateDoc(doc(db, 'series', seriesId), { followersCount: increment(1) });
      } else {
        await deleteDoc(doc(db, 'follows', followDocId));
        await updateDoc(doc(db, 'series', seriesId), { followersCount: increment(-1) });
      }
    } catch (err) {
      console.error('[Firestore] Toggle follow error:', err);
      throw err;
    }
  }

  // Update local series counter
  const seriesList = getLocal<Series[]>(STORAGE_KEYS.SERIES, []);
  setLocal(
    STORAGE_KEYS.SERIES,
    seriesList.map((s) => (s.id === seriesId ? { ...s, followersCount: Math.max(0, (s.followersCount || 0) + (isFollowing ? 1 : -1)) } : s))
  );

  return isFollowing;
}

// ----------------------------------------------------------------------
// NORMALIZATION HELPER
// ----------------------------------------------------------------------

function normalizeSeries(s: Series): Series {
  s.coverUrl = s.coverUrl || s.coverImage || '';
  s.coverImage = s.coverUrl;
  s.bannerUrl = s.bannerUrl || s.bannerImage || '';
  s.bannerImage = s.bannerUrl;
  s.author = s.author || (s.authors?.[0]) || 'Unknown';
  s.authorName = s.authorName || s.author;
  s.authors = s.authors?.length ? s.authors : [s.author];
  s.artist = s.artist || (s.artists?.[0]) || '';
  s.artists = s.artists?.length ? s.artists : (s.artist ? [s.artist] : []);
  s.featured = Boolean(s.featured ?? s.isFeatured);
  s.isFeatured = s.featured;
  s.followersCount = s.followersCount ?? s.followers ?? 0;
  s.followers = s.followersCount;
  s.totalChapters = s.totalChapters ?? 0;
  s.latestChapterNumber = s.latestChapterNumber ?? 0;
  s.rating = s.rating ?? 5.0;
  s.ratingCount = s.ratingCount ?? 0;
  s.views = s.views ?? 0;
  s.altTitles = s.altTitles ?? [];
  s.genres = s.genres ?? [];
  s.tags = s.tags ?? [];
  const legacyRating = String(s.contentRating || '').toLowerCase();
  s.contentRating = legacyRating === 'mature' || legacyRating === '18+' ? '18+' : legacyRating === 'suggestive' || legacyRating === '16+' ? '16+' : 'safe';
  s.isDraft = Boolean(s.isDraft);
  s.moderationStatus = s.moderationStatus || 'active';
  s.flaggedForReview = Boolean(s.flaggedForReview);
  return s;
}
