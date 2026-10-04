import { getCollection, type CollectionEntry } from 'astro:content';

type Placement = 'hero' | 'footer' | 'about' | 'contact';
export type SocialLink = CollectionEntry<'social'>['data'];

/** Links that may be shown: public, with a verified (non-empty) URL. */
export async function getSocialLinks(placement?: Placement): Promise<SocialLink[]> {
  const all = await getCollection('social');
  return all
    .map((e) => e.data)
    .filter((l) => l.public && l.url !== '' && (!placement || l.placements.includes(placement)))
    .sort((a, b) => a.order - b.order);
}

/** Profiles still waiting for a verified URL (for reporting / admin notes). */
export async function getMissingSocialLinks(): Promise<SocialLink[]> {
  return (await getCollection('social')).map((e) => e.data).filter((l) => l.url === '');
}

export const isExternal = (url: string) => url.startsWith('https://');
