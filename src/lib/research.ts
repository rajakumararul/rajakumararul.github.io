import { getCollection, type CollectionEntry } from 'astro:content';

export type AreaId = CollectionEntry<'publications'>['data']['areas'][number];

/** Published and accepted works tagged with a research area, newest first (thesis excluded). */
export async function relatedPublications(area: string) {
  return (
    await getCollection(
      'publications',
      (p) => p.data.areas.includes(area as AreaId) && p.data.type !== 'thesis' && ['published', 'accepted'].includes(p.data.status),
    )
  ).sort((a, b) => (b.data.year ?? 0) - (a.data.year ?? 0) || Number(b.data.featured) - Number(a.data.featured));
}
