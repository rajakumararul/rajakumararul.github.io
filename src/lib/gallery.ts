import { getCollection, type CollectionEntry } from 'astro:content';
import { dateKey, formatDate } from './format';

export type Album = CollectionEntry<'gallery'>;

export const categoryLabels: Record<Album['data']['category'], string> = {
  'awards-recognition': 'Awards & Recognition',
  'faculty-development': 'Faculty Development Programmes',
  conferences: 'Conferences',
  'invited-talks': 'Invited Talks',
  workshops: 'Workshops',
  'research-lab': 'Research & Laboratory',
  'academic-leadership': 'Academic Leadership',
  industry: 'Industry Interactions',
  international: 'International Collaborations',
  'student-activities': 'Student Activities',
};

/** Albums sorted newest first; undated albums (date to be confirmed) come first, then by `order`. */
export async function getAlbums(filter?: (a: Album) => boolean): Promise<Album[]> {
  const albums = await getCollection('gallery', filter);
  return albums.sort((a, b) => {
    const da = a.data.eventDate ? dateKey(a.data.eventDate) : '9999';
    const db = b.data.eventDate ? dateKey(b.data.eventDate) : '9999';
    return db.localeCompare(da) || a.data.order - b.data.order;
  });
}

export function albumDate(album: Album): string | null {
  const { eventDate, endDate } = album.data;
  if (!eventDate) return null;
  if (!endDate) return formatDate(eventDate, 'long');
  return `${formatDate(eventDate)} – ${formatDate(endDate)}`;
}

/** Cover first, then the remaining photographs. */
export function albumPhotos(album: Album) {
  const list = [] as { src: ImageMetadata; caption?: string; alt: string }[];
  if (album.data.cover) list.push({ src: album.data.cover, alt: album.data.coverAlt ?? album.data.title, caption: album.data.coverAlt });
  for (const p of album.data.photos) list.push({ src: p.src, caption: p.caption, alt: p.alt ?? p.caption ?? album.data.title });
  return list;
}
