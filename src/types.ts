export type MangaType = 'Manga' | 'Manhwa' | 'Manhua' | 'Webtoon' | 'Novel' | 'Comic';
export type SeriesType = MangaType;

export const ALL_GENRES: string[] = [
  'Action', 'Fantasy', 'Novel', 'System', 'Dungeon', 'Martial Arts', 'Murim',
  'Isekai', 'Reincarnation', 'Magic', 'Academy', 'Supernatural', 'Cyberpunk', 'Sci-Fi',
  'Slice of Life', 'Cooking', 'Comedy', 'Mystery', 'Romance', 'Otome', 'Psychological',
  'Horror', 'Historical', 'Sports', 'Gaming', 'Adventure', 'Drama'
];

export type MangaStatus = 'Ongoing' | 'Completed' | 'Hiatus';
export type PublicationStatus = MangaStatus;
export type StoryApprovalStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'under-review';
export type ModerationStatus = 'active' | 'suspended';
export type CreatorStatus = 'active' | 'suspended' | 'banned';

export type Demographic = 'Shounen' | 'Seinen' | 'Shoujo' | 'Josei' | 'All Ages';

export type ContentRating = 'safe' | '16+' | '18+';

export type ReadingStatus = 'Reading' | 'Plan to Read' | 'Completed' | 'Dropped';

export type ReadingMode = 'webtoon' | 'paged-ltr' | 'paged-rtl';

export type FitMode = 'width' | 'height' | 'original';

export interface Chapter {
  id: string;
  seriesId: string;
  number: number;
  chapterNumber?: number; // backwards compatibility alias
  volume?: number;
  title: string;
  releaseDate?: string;
  publishedAt: string;
  scanlationGroup?: string;
  views: number;
  likes: number;
  pageCount?: number;
  pages: string[]; // List of page image URLs
  textContent?: string; // Novel/story prose content
  isDraft: boolean;
  scheduledAt?: string;
  approvalStatus?: StoryApprovalStatus | 'approved';
  creatorId?: string;
  authorId?: string;
  authorName?: string;
}

export interface ChapterPage {
  pageNumber: number;
  imageUrl?: string;
  panelLayout?: 'action-split' | 'dialogue-focus' | 'full-splash' | 'webtoon-scroll';
  dialogue?: string[];
  soundEffect?: string;
  sceneDescription?: string;
  paletteTheme?: 'violet-noir' | 'crimson-fire' | 'golden-dawn' | 'cyber-neon' | 'mystic-forest';
}

export interface Series {
  id: string;
  title: string;
  altTitles: string[];
  slug: string;
  synopsis: string;
  type: MangaType;
  genres: string[];
  tags: string[];
  status: MangaStatus;
  contentRating: ContentRating;
  coverUrl: string;
  coverImage?: string; // compatibility alias
  bannerUrl?: string;
  bannerImage?: string; // compatibility alias
  author: string;
  authors?: string[]; // compatibility alias
  artist?: string;
  artists?: string[]; // compatibility alias
  featured: boolean;
  isFeatured?: boolean; // compatibility alias
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
  views: number;
  followersCount: number;
  followers?: number; // compatibility alias
  rating: number; // 0 - 5.0
  ratingCount: number;
  rank?: number;
  themeColor?: string;
  totalChapters?: number;
  latestChapterNumber?: number;
  latestUpdateDate?: string;
  serialization?: string;
  releaseYear?: number;
  language?: string;
  demographic?: Demographic;
  isEditorPick?: boolean;
  isTrending?: boolean;
  creatorId?: string;
  authorId?: string;
  authorName?: string;
  approvalStatus?: StoryApprovalStatus | 'approved';
  moderationStatus?: ModerationStatus;
  flaggedForReview?: boolean;
  moderationUpdatedAt?: string;
  moderationUpdatedBy?: string;
  coverAssetId?: string;
  rejectionReason?: string;
  chapters?: Chapter[];
  uploadedBy?: string;
  uploadedAt?: string;
  uploadDeclarations?: UploadDeclarations;
}

export interface UploadDeclarations {
  originalCreator: boolean;
  adultCharacters: boolean;
  noRealPeople: boolean;
  acceptsPolicies: boolean;
  acceptedAt: string;
}

export interface UploadSubmission {
  id: string;
  groupName: string;
  contactEmail: string;
  seriesTitle: string;
  seriesType: MangaType;
  contentRating: ContentRating;
  sampleLink: string;
  notes: string;
  uploadedBy?: string;
  uploadedAt: string;
  authorId?: string;
  seriesId?: string;
  chapterId?: string;
  declarations: UploadDeclarations;
  status: 'pending' | 'approved' | 'rejected';
}

export type ReportReason = 'Copyright/stolen' | 'Minor/child content' | 'Non-consensual/real person' | 'Wrong content rating' | 'Other';

export interface ContentReport {
  id: string;
  reporterId?: string;
  seriesId: string;
  chapterId?: string;
  reason: ReportReason;
  message: string;
  createdAt: string;
  status: 'open' | 'dismissed' | 'unpublished';
}

export interface UserComment {
  id: string;
  seriesId?: string;
  chapterId?: string;
  postId?: string;
  authorId?: string;
  authorName: string;
  authorAvatar: string;
  authorBadge?: string;
  content: string;
  createdAt: string;
  likes: number;
  dislikes: number;
  isSpoiler?: boolean;
  isDeleted?: boolean;
  userVote?: 'like' | 'dislike' | null;
  replies?: UserComment[];
}

export interface CommunityPost {
  id: string;
  title: string;
  authorId?: string;
  authorName: string;
  authorAvatar: string;
  authorBadge?: string;
  category: string;
  content?: string;
  excerpt?: string;
  createdAt: string;
  upvotes?: number;
  likes?: number;
  viewCount?: number;
  replyCount?: number;
  commentCount?: number;
  tags?: string[];
  pinned?: boolean;
  comments?: UserComment[];
}

export interface TopUploader {
  id?: string;
  rank: number;
  name: string;
  team?: string;
  uploads?: string;
  chaptersUploaded?: number | string;
  badge: string;
  avatar: string;
}

export interface UserCollection {
  id: string;
  name: string;
  description: string;
  ownerId?: string;
  ownerName: string;
  ownerAvatar: string;
  seriesIds: string[];
  isPublic: boolean;
  updatedAt: string;
}

export interface ReadingProgress {
  seriesId: string;
  chapterNumber: number;
  pageNumber: number;
  lastReadAt: string;
  percentage: number;
}

export interface LibraryItem {
  seriesId: string;
  status: ReadingStatus;
  userRating?: number;
  addedAt: string;
  isBookmarked: boolean;
}

export interface FilterOptions {
  query?: string;
  genres: string[];
  types: MangaType[];
  statuses: MangaStatus[];
  demographics?: Demographic[];
  contentRatings: ContentRating[];
  year?: number | null;
  sortBy: 'popular' | 'latest' | 'rating' | 'az' | 'chapters';
  viewMode?: 'grid' | 'list';
  page: number;
  limit: number;
  includeAdult?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'chapter_release' | 'comment_reply' | 'system';
  targetUrl: string;
  seriesTitle?: string;
  seriesCover?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  role: 'admin' | 'creator' | 'reader' | 'VIP' | 'user';
  isBanned?: boolean;
  bio: string;
  joinedDate: string;
  readerDefaultMode: ReadingMode;
  readerFitMode: FitMode;
  readerDarkTrueBlack: boolean;
  contentRatingFilter: 'all' | 'safe_only';
  ageConfirmedAt?: string;
  strikes?: number;
  approvedAdultChapters?: number;
  defaultPenName?: string;
  creatorStatus?: CreatorStatus;
  emailNormalized?: string;
  moderationUpdatedAt?: string;
  moderationUpdatedBy?: string;
}

export interface AdminLog {
  id: string;
  actorUid: string;
  actorEmail: string;
  action: string;
  targetType: 'story' | 'writer' | 'chapter' | 'system';
  targetId?: string;
  targetLabel?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface SiteSettings {
  siteName: string;
  logoUrl?: string;
  announcementText: string;
  announcementEnabled: boolean;
  featuredSeriesIds: string[];
  allowCreatorSubmissions: boolean;
}
