/**
 * Citation helpers: BibTeX export and an IEEE-style formatted reference,
 * generated only from fields present in the record (nothing is inferred).
 */
import type { CollectionEntry } from 'astro:content';

type Pub = CollectionEntry<'publications'>['data'];

const bibType: Record<Pub['type'], string> = {
  journal: 'article',
  conference: 'inproceedings',
  chapter: 'incollection',
  book: 'book',
  thesis: 'phdthesis',
  article: 'article',
  preprint: 'misc',
};

/** "Rajakumar Arul" → "Arul, Rajakumar"; initials-style names are kept as written. */
function bibName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  const last = parts.pop()!;
  return `${last}, ${parts.join(' ')}`;
}

const esc = (v: string) => v.replace(/([{}])/g, '\\$1');

export function citationKey(pub: Pub): string {
  const first = pub.authors[0]?.trim().split(/\s+/).pop()?.toLowerCase().replace(/[^a-z]/g, '') || 'anon';
  const word = pub.title.toLowerCase().match(/[a-z]{4,}/)?.[0] ?? 'untitled';
  return `${first}${pub.year ?? ''}${word}`;
}

export function toBibtex(pub: Pub): string {
  const fields: [string, string | undefined][] = [
    ['title', `{${esc(pub.title)}}`],
    ['author', pub.authors.length ? pub.authors.map(bibName).join(' and ') : undefined],
    [pub.type === 'journal' || pub.type === 'article' ? 'journal' : pub.type === 'thesis' ? 'school' : 'booktitle', pub.type === 'book' ? undefined : pub.venue],
    ['publisher', pub.publisher],
    ['year', pub.year?.toString()],
    ['volume', pub.volume],
    ['number', pub.issue],
    ['pages', pub.pages?.replace(/–/g, '--')],
    ['doi', pub.doi],
    ['url', pub.url ?? (pub.doi ? `https://doi.org/${pub.doi}` : undefined)],
    ['note', pub.status === 'accepted' ? 'Accepted for publication' : pub.status === 'under-review' ? 'Under review' : undefined],
  ];
  const body = fields
    .filter(([, v]) => v)
    .map(([k, v]) => `  ${k} = {${v}}`)
    .join(',\n');
  return `@${bibType[pub.type]}{${citationKey(pub)},\n${body}\n}`;
}

/** "R. Arul" style initials for IEEE references. */
function ieeeName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  const last = parts.pop()!;
  const initials = parts.map((p) => (p.endsWith('.') ? p : `${p[0]}.`)).join(' ');
  return `${initials} ${last}`;
}

function joinAuthors(names: string[]): string {
  if (names.length <= 2) return names.join(' and ');
  return `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}`;
}

export function formatCitation(pub: Pub): string {
  const authors = pub.authors.length ? `${joinAuthors(pub.authors.map(ieeeName))}, ` : '';
  const parts: string[] = [];
  if (pub.volume) parts.push(`vol. ${pub.volume}`);
  if (pub.issue) parts.push(`no. ${pub.issue}`);
  if (pub.pages) parts.push(pub.pages.includes('–') ? `pp. ${pub.pages}` : `Art. no. ${pub.pages}`);
  if (pub.year) parts.push(String(pub.year));
  const where =
    pub.type === 'conference' || pub.type === 'chapter' ? `in ${pub.venue}` : pub.type === 'book' ? pub.publisher ?? pub.venue : pub.venue;
  const tail = [where, ...parts].filter(Boolean).join(', ');
  const doi = pub.doi ? `, doi: ${pub.doi}` : '';
  const status = pub.status === 'accepted' ? ' (accepted)' : pub.status === 'under-review' ? ' (under review)' : '';
  return `${authors}“${pub.title},” ${tail}${doi}.${status}`;
}
