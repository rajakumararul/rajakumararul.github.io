import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { dateKey } from './format';

export type News = CollectionEntry<'news'>;

export const newsCategoryLabel: Record<News['data']['category'], string> = {
  appointment: 'Appointment',
  award: 'Award',
  publication: 'Publication',
  project: 'Project',
  certification: 'Certification',
  workshop: 'Workshop',
  talk: 'Invited talk',
  department: 'Department activity',
  collaboration: 'Collaboration',
  achievement: 'Academic achievement',
  event: 'Event',
  mentoring: 'Mentoring',
};

export const newsCategoryIcon: Record<News['data']['category'], string> = {
  appointment: 'flag',
  award: 'award',
  publication: 'file',
  project: 'compass',
  certification: 'certificate',
  workshop: 'layers',
  talk: 'users',
  department: 'institution',
  collaboration: 'handshake',
  achievement: 'award',
  event: 'calendar',
  mentoring: 'users',
};

/** Undated items are recent additions without a confirmed date, so they lead the list. */
const newsKey = (d?: string) => (d ? dateKey(d) : '9999');

export async function getNews(filter?: (n: News) => boolean): Promise<News[]> {
  return (await getCollection('news', filter)).sort((a, b) => newsKey(b.data.date).localeCompare(newsKey(a.data.date)));
}

/** The item's own cover, else the cover of its related album. */
type Credit = CollectionEntry<'gallery'>['data']['coverCredit'];

export async function newsCover(item: News): Promise<{ src: ImageMetadata; alt: string; credit?: Credit } | null> {
  if (item.data.cover) return { src: item.data.cover, alt: item.data.coverAlt ?? item.data.title };
  if (item.data.album) {
    const album = await getEntry(item.data.album);
    if (album?.data.cover) return { src: album.data.cover, alt: album.data.coverAlt ?? album.data.title, credit: album.data.coverCredit };
  }
  return null;
}
