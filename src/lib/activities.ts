import { getCollection, type CollectionEntry } from 'astro:content';
import { dateKey, formatDate, formatRange } from './format';

export type Activity = CollectionEntry<'activities'>;

export const activityCategoryLabel: Record<Activity['data']['category'], string> = {
  talk: 'Invited talks',
  fdp: 'FDPs',
  workshop: 'Workshops',
  conference: 'Conferences',
  editorial: 'Editorial roles',
  'session-chair': 'Session chair roles',
  mentoring: 'Mentoring',
  hackathon: 'Hackathons',
  service: 'Professional service',
  industry: 'Industry interaction',
  outreach: 'Academic outreach',
};

export const activityCategoryIcon: Record<Activity['data']['category'], string> = {
  talk: 'users',
  fdp: 'layers',
  workshop: 'layers',
  conference: 'file',
  editorial: 'book',
  'session-chair': 'flag',
  mentoring: 'spark',
  hackathon: 'compass',
  service: 'institution',
  industry: 'handshake',
  outreach: 'users',
};

/** Newest first; ongoing roles (endDate: null) sort by their start date. */
export async function getActivities(filter?: (a: Activity) => boolean): Promise<Activity[]> {
  const key = (a: Activity) => (a.data.date ? dateKey(a.data.date) : '0000');
  return (await getCollection('activities', filter)).sort((a, b) => key(b).localeCompare(key(a)) || a.data.order - b.data.order);
}

/** "18 Nov 2025", "Jun 2024 – Aug 2024", "Apr 2023 – Present"; null when undated. */
export function activityDate(a: Activity): string | null {
  const { date, endDate } = a.data;
  if (!date) return null;
  if (endDate === undefined) return formatDate(date, 'long');
  return formatRange(date, endDate);
}
