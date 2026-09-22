import { auth, db, isFirebaseConfigured } from '../firebase';
import { collection, deleteDoc, doc, getDocs, query, setDoc, where, writeBatch } from 'firebase/firestore';
import { AdminLog, ContentRating, CreatorStatus, Series, UserProfile } from '../types';
import {
  dbDeleteSeries,
  dbGetSeriesByAuthor,
  dbModerateSeries,
  dbModerateWriter,
  dbSaveAdminLog,
} from './db';

function requireAdmin(): { uid: string; email: string } {
  const currentUser = auth?.currentUser;
  if (!currentUser) throw new Error('Admin authentication is required.');
  return { uid: currentUser.uid, email: currentUser.email || '' };
}

async function record(action: string, targetType: AdminLog['targetType'], targetId?: string, targetLabel?: string, metadata?: Record<string, unknown>) {
  const actor = requireAdmin();
  await dbSaveAdminLog({
    id: `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    actorUid: actor.uid,
    actorEmail: actor.email,
    action,
    targetType,
    targetId,
    targetLabel,
    metadata,
    createdAt: new Date().toISOString(),
  });
}

export async function moderateStory(story: Series, updates: { contentRating?: ContentRating; moderationStatus?: 'active' | 'suspended'; flaggedForReview?: boolean }) {
  requireAdmin();
  const timestamp = new Date().toISOString();
  await dbModerateSeries(story.id, { ...updates, moderationUpdatedAt: timestamp, moderationUpdatedBy: auth!.currentUser!.uid });
  await record('story.moderated', 'story', story.id, story.title, updates);
}

export async function moderateWriter(writer: UserProfile, creatorStatus: CreatorStatus) {
  requireAdmin();
  const timestamp = new Date().toISOString();
  await dbModerateWriter(writer.id, { creatorStatus, moderationUpdatedAt: timestamp, moderationUpdatedBy: auth!.currentUser!.uid });
  if (isFirebaseConfigured() && db) {
    const stories = await dbGetSeriesByAuthor(writer.id);
    const batch = writeBatch(db);
    stories.forEach((story) => batch.update(doc(db!, 'series', story.id), {
      moderationStatus: creatorStatus === 'active' ? 'active' : 'suspended',
      moderationUpdatedAt: timestamp,
      moderationUpdatedBy: auth!.currentUser!.uid,
    }));
    await batch.commit();
    if (writer.email) {
      const bannedEmail = doc(db, 'bannedEmails', writer.email.trim().toLowerCase());
      if (creatorStatus === 'banned') await setDoc(bannedEmail, { userId: writer.id, createdAt: new Date().toISOString() });
      else await deleteDoc(bannedEmail);
    }
  }
  await record('writer.status_changed', 'writer', writer.id, writer.username, { creatorStatus });
}

export async function deleteStoryPermanently(story: Series, onDeleteAsset?: (url: string) => Promise<void>) {
  requireAdmin();
  if (isFirebaseConfigured() && db) {
    const chapterSnapshot = await getDocs(query(collection(db, 'chapters'), where('seriesId', '==', story.id)));
    const batch = writeBatch(db);
    chapterSnapshot.docs.forEach((chapter) => batch.delete(chapter.ref));
    batch.delete(doc(db, 'series', story.id));
    await batch.commit();
  } else {
    await dbDeleteSeries(story.id);
  }
  if (onDeleteAsset && story.coverUrl) await onDeleteAsset(story.coverUrl);
  await record('story.deleted', 'story', story.id, story.title, { chapterCascade: true, coverDeleted: Boolean(story.coverUrl) });
}

export async function suspendWriterStories(writerId: string) {
  const stories = await dbGetSeriesByAuthor(writerId);
  await Promise.all(stories.map((story) => dbModerateSeries(story.id, { moderationStatus: 'suspended' })));
}

export async function verifyAdminClaim(): Promise<boolean> {
  const currentUser = auth?.currentUser;
  if (!currentUser) return false;
  const token = await currentUser.getIdTokenResult(true);
  return token.claims.admin === true;
}
