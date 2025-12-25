// Firebase Firestore Activity Feed Service
// LIMITED USE: Only for real-time activity feeds (50K reads/day limit)
// All other data is stored in Supabase PostgreSQL
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { getFirestoreDb } from './client';
export type ActivityType =
  | 'animal_added'
  | 'animal_updated'
  | 'animal_sold'
  | 'milk_logged'
  | 'health_record_added'
  | 'breeding_record_added'
  | 'expense_added'
  | 'sale_recorded'
  | 'staff_invited'
  | 'staff_joined'
  | 'payment_received'
  | 'subscription_updated'
  | 'farm_application_submitted'
  | 'farm_application_approved'
  | 'farm_application_rejected';
export interface ActivityFeedItem {
  id?: string;
  tenantId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: ActivityType;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp | Date;
}
const ACTIVITY_COLLECTION = 'activity_feeds';
/**
 * Add a new activity to the feed
 * Use sparingly to stay within 50K reads/day limit
 */
export async function addActivity(
  activity: Omit<ActivityFeedItem, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const db = getFirestoreDb();
    const docRef = await addDoc(collection(db, ACTIVITY_COLLECTION), {
      ...activity,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    throw error;
  }
}
/**
 * Subscribe to real-time activity feed for a tenant
 * Returns unsubscribe function
 */
export function subscribeToActivityFeed(
  tenantId: string,
  onUpdate: (activities: ActivityFeedItem[]) => void,
  maxItems: number = 20
): Unsubscribe {
  const db = getFirestoreDb();
  const q = query(
    collection(db, ACTIVITY_COLLECTION),
    where('tenantId', '==', tenantId),
    orderBy('createdAt', 'desc'),
    limit(maxItems)
  );
  return onSnapshot(q, snapshot => {
    const activities: ActivityFeedItem[] = [];
    snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      activities.push({
        id: doc.id,
        ...doc.data(),
      } as ActivityFeedItem);
    });
    onUpdate(activities);
  });
}
/**
 * Subscribe to platform-wide activity feed (for super admins)
 * Shows all farm applications and important platform events
 */
export function subscribeToPlatformActivityFeed(
  onUpdate: (activities: ActivityFeedItem[]) => void,
  maxItems: number = 50
): Unsubscribe {
  const db = getFirestoreDb();
  const platformTypes: ActivityType[] = [
    'farm_application_submitted',
    'farm_application_approved',
    'farm_application_rejected',
    'payment_received',
    'subscription_updated',
  ];
  const q = query(
    collection(db, ACTIVITY_COLLECTION),
    where('type', 'in', platformTypes),
    orderBy('createdAt', 'desc'),
    limit(maxItems)
  );
  return onSnapshot(q, snapshot => {
    const activities: ActivityFeedItem[] = [];
    snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      activities.push({
        id: doc.id,
        ...doc.data(),
      } as ActivityFeedItem);
    });
    onUpdate(activities);
  });
}
/**
 * Helper to create activity messages
 */
export const activityMessages: Record<
  ActivityType,
  (metadata?: Record<string, unknown>) => { title: string; description: string }
> = {
  animal_added: m => ({
    title: 'New Animal Added',
    description: `${m?.name || 'An animal'} (${m?.species || 'unknown'}) was added to the farm`,
  }),
  animal_updated: m => ({
    title: 'Animal Updated',
    description: `${m?.name || 'An animal'}'s information was updated`,
  }),
  animal_sold: m => ({
    title: 'Animal Sold',
    description: `${m?.name || 'An animal'} was marked as sold`,
  }),
  milk_logged: m => ({
    title: 'Milk Production Logged',
    description: `${m?.quantity || 0}L recorded for ${m?.session || 'session'}`,
  }),
  health_record_added: m => ({
    title: 'Health Record Added',
    description: `${m?.type || 'Health'} record added for ${m?.animalName || 'an animal'}`,
  }),
  breeding_record_added: m => ({
    title: 'Breeding Record Added',
    description: `Breeding record added for ${m?.animalName || 'an animal'}`,
  }),
  expense_added: m => ({
    title: 'Expense Recorded',
    description: `Rs. ${m?.amount || 0} expense added for ${m?.category || 'misc'}`,
  }),
  sale_recorded: m => ({
    title: 'Sale Recorded',
    description: `Rs. ${m?.total || 0} sale recorded for ${m?.type || 'products'}`,
  }),
  staff_invited: m => ({
    title: 'Staff Invited',
    description: `Invitation sent to ${m?.email || 'a user'} as ${m?.role || 'staff'}`,
  }),
  staff_joined: m => ({
    title: 'Staff Joined',
    description: `${m?.name || 'A user'} joined as ${m?.role || 'staff'}`,
  }),
  payment_received: m => ({
    title: 'Payment Received',
    description: `Rs. ${m?.amount || 0} payment received via ${m?.gateway || 'bank'}`,
  }),
  subscription_updated: m => ({
    title: 'Subscription Updated',
    description: `Subscription changed to ${m?.plan || 'new plan'}`,
  }),
  farm_application_submitted: m => ({
    title: 'New Farm Application',
    description: `${m?.farmName || 'A farm'} applied for registration`,
  }),
  farm_application_approved: m => ({
    title: 'Farm Application Approved',
    description: `${m?.farmName || 'A farm'} was approved with ID: ${m?.farmId || 'N/A'}`,
  }),
  farm_application_rejected: m => ({
    title: 'Farm Application Rejected',
    description: `${m?.farmName || 'A farm'} application was rejected`,
  }),
};
/**
 * Create and add an activity with auto-generated message
 */
export async function logActivity(
  tenantId: string,
  userId: string,
  userName: string,
  type: ActivityType,
  metadata?: Record<string, unknown>,
  userAvatar?: string
): Promise<string> {
  const { title, description } = activityMessages[type](metadata);
  return addActivity({
    tenantId,
    userId,
    userName,
    userAvatar,
    type,
    title,
    description,
    metadata,
  });
}