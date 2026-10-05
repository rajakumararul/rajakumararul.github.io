/** schema.org helpers — only facts already recorded in the content files. */
import { getCollection, getEntry } from 'astro:content';
import { url } from './url';

/** Person schema for the site owner. `site` is Astro.site (the absolute site origin). */
export async function personJsonLd(site: URL | undefined) {
  const abs = (path: string) => new URL(url(path), site).href;
  const profile = (await getEntry('profile', 'main'))!.data;
  const social = await getCollection('social', (s) => s.data.public && s.data.url.startsWith('https://'));
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.shortName,
    honorificPrefix: profile.honorific,
    givenName: profile.name.split(' ')[0],
    familyName: profile.name.split(' ').slice(1).join(' '),
    jobTitle: [profile.designation, profile.leadershipRole],
    worksFor: { '@type': 'CollegeOrUniversity', name: profile.institution },
    url: abs('/'),
    image: profile.photo ? abs(profile.photo) : undefined,
    knowsAbout: profile.specializations,
    sameAs: social.map((s) => s.data.url),
  };
}
