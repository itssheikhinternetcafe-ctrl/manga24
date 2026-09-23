/**
 * Manga24 API Client Service Layer
 * 
 * Powered by Firestore with fallback local persistence.
 * All functions return promises and query the real database collections.
 */

import {
  dbGetSeries,
  dbGetSeriesById,
  dbGetChapters,
  dbGetChapter,
  dbGetComments,
  dbPostComment,
  dbGetCommunityPosts,
  dbCreateCommunityPost,
  dbGetSiteSettings,
  dbIncrementSeriesView,
} from './db';
import { Series, Chapter, FilterOptions, CommunityPost, UserCollection, UserComment } from '../types';

export const api = {
  /**
   * Fetch published series with optional filtering, sorting, and pagination
   */
  async getSeries(filters?: Partial<FilterOptions>, includeDrafts = false): Promise<{ items: Series[]; total: number; totalPages: number }> {
    return dbGetSeries(filters, includeDrafts);
  },

  /**
   * Fetch single series detail by ID or slug
   */
  async getSeriesById(idOrSlug: string): Promise<Series | null> {
    const series = await dbGetSeriesById(idOrSlug);
    if (series && !series.isDraft && series.moderationStatus !== 'suspended') {
      dbIncrementSeriesView(series.id);
      return series;
    }
    return null;
  },

  /**
   * Fetch chapters for a given series
   */
  async getChapters(seriesId: string, includeDrafts = false): Promise<Chapter[]> {
    return dbGetChapters(seriesId, includeDrafts);
  },

  /**
   * Fetch reader chapter
   */
  async getChapter(seriesId: string, chapterNumber: number): Promise<Chapter | null> {
    return dbGetChapter(seriesId, chapterNumber);
  },

  /**
   * Fetch chapter pages (maps image URLs from Firestore or generates fallback panels)
   */
  async getChapterPages(seriesId: string, chapterNumber: number): Promise<any[]> {
    const chapter = await dbGetChapter(seriesId, chapterNumber);
    if (!chapter) return [];

    if (chapter.pages && chapter.pages.length > 0) {
      return chapter.pages.map((url, idx) => ({
        pageNumber: idx + 1,
        imageUrl: url,
        isCustomImage: true,
      }));
    }

    // If novel text content is present, return empty pages so ReaderPage knows to render Novel Reader
    if (chapter.textContent) {
      return [];
    }

    return [];
  },

  /**
   * Fetch fast search suggestions for header search dropdown
   */
  async searchSuggestions(queryStr: string): Promise<Series[]> {
    if (!queryStr || queryStr.trim().length < 1) return [];
    const { items } = await dbGetSeries({ query: queryStr, limit: 7 }, false);
    return items;
  },

  /**
   * Fetch featured carousel titles
   */
  async getFeaturedSeries(): Promise<Series[]> {
    const { items } = await dbGetSeries({ limit: 10 }, false);
    const settings = await dbGetSiteSettings();
    const explicitFeatured = items.filter((s) => s.featured || settings.featuredSeriesIds?.includes(s.id));
    return explicitFeatured.length > 0 ? explicitFeatured.slice(0, 6) : items.slice(0, 5);
  },

  /**
   * Fetch trending series
   */
  async getTrendingSeries(): Promise<Series[]> {
    const { items } = await dbGetSeries({ sortBy: 'popular', limit: 10 }, false);
    return items;
  },

  /**
   * Fetch Most Followed New Series
   */
  async getMostFollowed(): Promise<Series[]> {
    const { items } = await dbGetSeries({ sortBy: 'popular', limit: 10 }, false);
    return items;
  },

  /**
   * Fetch Editor's Picks
   */
  async getEditorPicks(): Promise<Series[]> {
    const { items } = await dbGetSeries({ limit: 10 }, false);
    const picks = items.filter((s) => s.isEditorPick);
    return picks.length > 0 ? picks : items.slice(0, 6);
  },

  /**
   * Fetch Latest Updates
   */
  async getLatestUpdates(type: 'all' | 'hot' | 'new' = 'all'): Promise<Series[]> {
    const sortBy = type === 'hot' ? 'popular' : 'latest';
    const { items } = await dbGetSeries({ sortBy, limit: 18 }, false);
    return items;
  },

  /**
   * Fetch community posts
   */
  async getCommunityPosts(category?: string): Promise<CommunityPost[]> {
    return dbGetCommunityPosts(category);
  },

  /**
   * Create community post
   */
  async createCommunityPost(post: Partial<CommunityPost>): Promise<CommunityPost> {
    return dbCreateCommunityPost(post);
  },

  /**
   * Fetch user collections
   */
  async getUserCollections(): Promise<UserCollection[]> {
    return [];
  },

  /**
   * Fetch comments for a series or chapter
   */
  async getComments(seriesId: string, chapterId?: string): Promise<UserComment[]> {
    return dbGetComments(seriesId, chapterId);
  },

  /**
   * Post a new comment
   */
  async postComment(comment: Partial<UserComment>): Promise<UserComment> {
    return dbPostComment(comment);
  },
};
