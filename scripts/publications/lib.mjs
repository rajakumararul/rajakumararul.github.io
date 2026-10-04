/**
 * Shared helpers for the publication import workflow.
 * Nothing here writes to src/content/publications.yaml.
 */
import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import { parse as parseBib } from '@retorquere/bibtex-parser';

export const PUBLICATIONS_FILE = new URL('../../src/content/publications.yaml', import.meta.url);
const UA = 'rajakumar-arul-portfolio/publication-importer (manual review tool)';

// ── Normalisation ────────────────────────────────────────────────────────────

export const normDoi = (d) =>
  d ? String(d).trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, '').replace(/^doi:\s*/, '') : undefined;

export const normTitle = (t) =>
  String(t ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/(\w)is(ation|ing|ed|e)\b/g, '$1iz$2') // British → American spelling
    .trim();

/** Dice coefficient on word bigrams — robust to small wording differences. */
export function titleSimilarity(a, b) {
  const grams = (s) => {
    const w = normTitle(s).split(' ').filter(Boolean);
    const g = new Map();
    for (let i = 0; i < w.length - 1; i++) {
      const k = `${w[i]} ${w[i + 1]}`;
      g.set(k, (g.get(k) ?? 0) + 1);
    }
    if (w.length === 1) g.set(w[0], 1);
    return g;
  };
  const A = grams(a);
  const B = grams(b);
  let overlap = 0;
  for (const [k, n] of A) overlap += Math.min(n, B.get(k) ?? 0);
  const total = [...A.values()].reduce((s, n) => s + n, 0) + [...B.values()].reduce((s, n) => s + n, 0);
  return total ? (2 * overlap) / total : 0;
}

const STOP = new Set(['a', 'an', 'the', 'of', 'in', 'on', 'for', 'and', 'to', 'with', 'using', 'based', 'by', 'via']);

/**
 * Share of the shorter title's significant words found in the longer one.
 * Acronyms count when they match the initials of consecutive words
 * (e.g. "CNN" ↔ "convolutional neural network").
 */
export function titleContainment(a, b) {
  const wa = normTitle(a).split(' ').filter((w) => w && !STOP.has(w));
  const wb = normTitle(b).split(' ').filter((w) => w && !STOP.has(w));
  const [short, long] = wa.length <= wb.length ? [wa, wb] : [wb, wa];
  if (!short.length) return 0;
  const longSet = new Set(long);
  const allLong = normTitle(wa.length <= wb.length ? b : a).split(' ');
  const initials = (n) => allLong.map((_, i) => allLong.slice(i, i + n).map((w) => w[0]).join(''));
  let hit = 0;
  for (const w of short) {
    if (longSet.has(w)) hit++;
    else if (/^[a-z]{2,5}$/.test(w) && initials(w.length).includes(w)) hit++;
  }
  return hit / short.length;
}

export const surname = (name) => {
  const s = String(name).trim();
  return normTitle(s.includes(',') ? s.split(',')[0] : s.split(/\s+/).pop());
};

export const slug = (s, max = 6) =>
  normTitle(s)
    .split(' ')
    .filter((w) => w.length > 2)
    .slice(0, max)
    .join('-');

// ── Existing records ─────────────────────────────────────────────────────────

export async function loadExisting() {
  const text = await readFile(PUBLICATIONS_FILE, 'utf8');
  return { text, records: parseYaml(text) ?? [] };
}

// ── Type mapping ─────────────────────────────────────────────────────────────

const PREPRINT = /arxiv|preprint|ssrn|biorxiv|medrxiv|research square|techrxiv|authorea/i;

export function mapBibType(type, venue = '') {
  if (PREPRINT.test(venue)) return { type: 'preprint', status: 'preprint' };
  switch (type) {
    case 'article':
      return { type: 'journal', status: 'unconfirmed' };
    case 'inproceedings':
    case 'conference':
    case 'proceedings':
      return { type: 'conference', status: 'unconfirmed' };
    case 'incollection':
    case 'inbook':
      return { type: 'chapter', status: 'unconfirmed' };
    case 'book':
      return { type: 'book', status: 'unconfirmed' };
    case 'phdthesis':
    case 'mastersthesis':
      return { type: 'thesis', status: 'unconfirmed' };
    default:
      return { type: 'article', status: 'unconfirmed', unknownType: type };
  }
}

export function mapOrcidType(type, venue = '') {
  const map = {
    'journal-article': 'article',
    'conference-paper': 'inproceedings',
    'book-chapter': 'incollection',
    book: 'book',
    'dissertation-thesis': 'phdthesis',
    preprint: 'misc-preprint',
  };
  if (type === 'preprint') return { type: 'preprint', status: 'preprint' };
  return mapBibType(map[type] ?? type, venue);
}

const crossrefType = {
  'journal-article': 'journal',
  'proceedings-article': 'conference',
  'book-chapter': 'chapter',
  book: 'book',
  'edited-book': 'book',
  monograph: 'book',
  'posted-content': 'preprint',
  dissertation: 'thesis',
};

// ── Parsers → common candidate shape ─────────────────────────────────────────

const fullName = (c) => [c.firstName, c.lastName].filter(Boolean).join(' ') || c.name || '';
const first = (v) => (Array.isArray(v) ? v[0] : v);

export function fromBibtex(text) {
  const { entries, errors } = parseBib(text, { sentenceCase: false });
  const records = entries.map((e) => {
    const f = e.fields;
    const venue = first(f.journal) ?? first(f.booktitle) ?? first(f.school) ?? first(f.publisher) ?? first(f.howpublished) ?? '';
    const t = mapBibType(e.type, venue);
    return {
      sourceKey: e.key,
      source: 'bibtex',
      ...t,
      title: String(first(f.title) ?? '').trim(),
      authors: (f.author ?? []).map(fullName).filter(Boolean),
      venue: String(venue),
      publisher: first(f.publisher),
      year: f.year ? Number(String(first(f.year)).slice(0, 4)) : null,
      volume: first(f.volume),
      issue: first(f.number),
      pages: first(f.pages)?.replace(/--?/g, '–'),
      doi: normDoi(first(f.doi)),
      url: first(f.url),
    };
  });
  return { records, errors };
}

export async function fromOrcid(orcid) {
  const base = `https://pub.orcid.org/v3.0/${orcid}`;
  const get = async (path) => {
    const res = await fetch(`${base}${path}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
    if (!res.ok) throw new Error(`ORCID ${path}: HTTP ${res.status}`);
    return res.json();
  };
  const summary = await get('/works');
  const putCodes = summary.group.map((g) => g['work-summary'][0]['put-code']);
  const records = [];
  for (let i = 0; i < putCodes.length; i += 50) {
    const bulk = await get(`/works/${putCodes.slice(i, i + 50).join(',')}`);
    for (const item of bulk.bulk) {
      const w = item.work;
      if (!w) continue;
      const ids = w['external-ids']?.['external-id'] ?? [];
      const doi = normDoi(ids.find((x) => x['external-id-type'] === 'doi')?.['external-id-value']);
      const venue = w['journal-title']?.value ?? '';
      const t = mapOrcidType(w.type, venue);
      records.push({
        sourceKey: `orcid:${w['put-code']}`,
        source: 'orcid',
        ...t,
        title: w.title?.title?.value ?? '',
        authors: (w.contributors?.contributor ?? []).map((c) => c['credit-name']?.value).filter(Boolean),
        venue,
        year: Number(w['publication-date']?.year?.value) || null,
        doi,
        url: w.url?.value,
      });
    }
  }
  return { records, errors: [] };
}

// ── Crossref validation ──────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fromCrossref(m) {
  return {
    title: m.title?.[0],
    authors: (m.author ?? []).map((a) => [a.given, a.family].filter(Boolean).join(' ')),
    venue: m['container-title']?.at(-1) ?? m['container-title']?.[0],
    publisher: m.publisher,
    year: m.issued?.['date-parts']?.[0]?.[0] ?? null,
    volume: m.volume,
    issue: m.issue,
    pages: (m.page ?? m['article-number'])?.replace(/-/g, '–'),
    doi: normDoi(m.DOI),
    type: crossrefType[m.type],
    crossrefType: m.type,
  };
}

export async function crossrefLookup(rec) {
  await sleep(120);
  try {
    if (rec.doi) {
      const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(rec.doi)}`, { headers: { 'User-Agent': UA } });
      if (res.ok) return { how: 'doi', ...fromCrossref((await res.json()).message) };
      return { how: 'doi-not-found' };
    }
    const q = new URLSearchParams({ 'query.bibliographic': `${rec.title} ${rec.authors[0] ?? ''}`, rows: '1' });
    const res = await fetch(`https://api.crossref.org/works?${q}`, { headers: { 'User-Agent': UA } });
    if (!res.ok) return null;
    const item = (await res.json()).message.items?.[0];
    if (item && titleSimilarity(item.title?.[0] ?? '', rec.title) >= 0.9) return { how: 'title', ...fromCrossref(item) };
    return { how: 'no-match' };
  } catch (e) {
    return { how: 'error', error: String(e) };
  }
}

// ── Reconciliation ───────────────────────────────────────────────────────────

const comparable = ['year', 'volume', 'issue', 'pages', 'doi'];
const clean = (v) => (v === undefined || v === null || v === '' ? undefined : normTitle(String(v)));

export function compareFields(existing, incoming) {
  const conflicts = [];
  const fills = [];
  for (const f of comparable) {
    const a = clean(existing[f]);
    const b = clean(incoming[f]);
    if (b === undefined) continue;
    if (a === undefined) fills.push({ field: f, value: incoming[f] });
    else if (a !== b) conflicts.push({ field: f, existing: existing[f], incoming: incoming[f] });
  }
  if ((!existing.authors || existing.authors.length === 0) && incoming.authors?.length) fills.push({ field: 'authors', value: incoming.authors });
  else if (existing.authors?.length && incoming.authors?.length && existing.authors.length !== incoming.authors.length)
    conflicts.push({ field: 'authors (count)', existing: existing.authors.length, incoming: incoming.authors.length });
  return { conflicts, fills };
}

export function findMatch(rec, existing) {
  if (rec.doi) {
    const hit = existing.find((e) => normDoi(e.doi) === rec.doi);
    if (hit) return { record: hit, how: 'DOI', score: 1 };
  }
  let best = null;
  for (const e of existing) {
    const score = titleSimilarity(e.title, rec.title);
    if (!best || score > best.score) best = { record: e, score };
  }
  if (!best) return null;
  const yearClose = !rec.year || !best.record.year || Math.abs(rec.year - best.record.year) <= 1;
  const sharedAuthor =
    !rec.authors.length || !best.record.authors?.length || rec.authors.some((a) => best.record.authors.some((b) => surname(a) === surname(b)));
  if (best.score >= 0.9 && yearClose) return { ...best, how: 'title', possible: !sharedAuthor };
  if (best.score >= 0.7) return { ...best, how: 'similar title', possible: true };
  // Same words, different spelling / abbreviations — always a human decision.
  let contained = null;
  for (const e of existing) {
    const c = titleContainment(e.title, rec.title);
    if (c >= 0.85 && (!contained || c > contained.score)) contained = { record: e, score: c };
  }
  if (contained) return { ...contained, how: 'same keywords (spelling/abbreviation differs)', possible: true };
  return null;
}
