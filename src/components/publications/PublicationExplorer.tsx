/**
 * Searchable, filterable publication list (React island).
 * All data is prepared at build time in src/pages/publications.astro.
 */
import { useEffect, useMemo, useState } from 'react';

export interface PubItem {
  id: string;
  type: string;
  typeLabel: string;
  status: 'published' | 'accepted' | 'under-review' | 'preprint' | 'unconfirmed';
  title: string;
  authors: { text: string; isOwner: boolean }[];
  venue: string;
  publisher?: string;
  year: number | null;
  details: string;
  doi?: string;
  url?: string;
  pdf?: string;
  areas: { id: string; label: string }[];
  keywords: string[];
  featured: boolean;
  verify: string[];
  bibtex: string;
  citation: string;
}

interface Props {
  pubs: PubItem[];
  types: { id: string; label: string; count: number }[];
  areas: { id: string; label: string }[];
  showVerify: boolean;
  /** Base URL of the research page, for "research theme" links on each record. */
  researchHref: string;
}

const statusLabel: Record<PubItem['status'], string | null> = {
  published: null,
  accepted: 'Accepted',
  'under-review': 'Under review',
  preprint: 'Preprint',
  unconfirmed: 'Status unconfirmed',
};

function normalise(s: string) {
  return s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

function Svg({ d, size = 14 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
const ICON = {
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20 20l-3.5-3.5',
  link: 'M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  copy: 'M8 8h12v12H8zM16 8V4H4v12h4',
  check: 'm5 12 5 5L20 7',
  star: 'm12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z',
  pdf: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5ZM14 3v5h5',
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<'idle' | 'done' | 'failed'>('idle');
  return (
    <button
      type="button"
      onClick={async () => {
        setState((await copyText(text)) ? 'done' : 'failed');
        setTimeout(() => setState('idle'), 2000);
      }}
      className="chip cursor-pointer transition-colors hover:border-accent hover:text-accent"
      aria-label={state === 'done' ? `${label} copied` : state === 'failed' ? `Could not copy ${label}` : `Copy ${label}`}
    >
      <Svg d={state === 'done' ? ICON.check : ICON.copy} size={12} />
      {state === 'done' ? 'Copied' : state === 'failed' ? 'Copy failed' : label}
    </button>
  );
}

export default function PublicationExplorer({ pubs, types, areas, showVerify, researchHref }: Props) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [year, setYear] = useState('all');
  const [area, setArea] = useState('all');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  // Deep links from other pages: /publications?area=post-quantum-cryptography (also ?type=, ?q=).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const a = params.get('area');
    const t = params.get('type');
    const q = params.get('q');
    if (a && areas.some((x) => x.id === a)) setArea(a);
    if (t && types.some((x) => x.id === t)) setType(t);
    if (q) setQuery(q);
  }, []);

  const years = useMemo(
    () => [...new Set(pubs.map((p) => p.year).filter((y): y is number => y !== null))].sort((a, b) => b - a),
    [pubs],
  );
  const hasUndated = pubs.some((p) => p.year === null);

  const index = useMemo(
    () =>
      new Map(
        pubs.map((p) => [
          p.id,
          normalise([p.title, p.venue, p.publisher ?? '', ...p.authors.map((a) => a.text), ...p.keywords, ...p.areas.map((a) => a.label)].join(' ')),
        ]),
      ),
    [pubs],
  );

  const results = useMemo(() => {
    const terms = normalise(query).split(/\s+/).filter(Boolean);
    const list = pubs.filter((p) => {
      if (type !== 'all' && p.type !== type) return false;
      if (year === 'none' ? p.year !== null : year !== 'all' && String(p.year) !== year) return false;
      if (area !== 'all' && !p.areas.some((a) => a.id === area)) return false;
      if (featuredOnly && !p.featured) return false;
      const hay = index.get(p.id)!;
      return terms.every((t) => hay.includes(t));
    });
    return list.sort((a, b) => {
      const ya = a.year ?? (sort === 'newest' ? -1 : 9999);
      const yb = b.year ?? (sort === 'newest' ? -1 : 9999);
      return sort === 'newest' ? yb - ya : ya - yb;
    });
  }, [pubs, index, query, type, year, area, sort, featuredOnly]);

  const groups = useMemo(() => {
    const map = new Map<string, PubItem[]>();
    for (const p of results) {
      const k = p.year ? String(p.year) : 'Year not stated';
      map.set(k, [...(map.get(k) ?? []), p]);
    }
    return [...map.entries()];
  }, [results]);

  const filtered = query || type !== 'all' || year !== 'all' || area !== 'all' || featuredOnly;
  const reset = () => {
    setQuery('');
    setType('all');
    setYear('all');
    setArea('all');
    setFeaturedOnly(false);
  };

  const selectCls =
    'rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-ink focus:border-accent focus:outline-none';

  return (
    <div>
      {/* ── Controls ── */}
      <div className="card mb-10 grid gap-4 p-4 sm:p-5">
        <label className="relative block">
          <span className="sr-only">Search publications by title, author or keyword</span>
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
            <Svg d={ICON.search} size={17} />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, author, venue or keyword…"
            className="w-full rounded-full border border-line bg-bg py-3 pl-11 pr-4 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </label>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by publication type">
          {[{ id: 'all', label: 'All types', count: pubs.length }, ...types].map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={type === t.id}
              onClick={() => setType(t.id)}
              className="filter-chip"
            >
              {t.label} <span className="opacity-60">{t.count}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label>
            <span className="sr-only">Filter by year</span>
            <select value={year} onChange={(e) => setYear(e.target.value)} className={selectCls}>
              <option value="all">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
              {hasUndated && <option value="none">Year not stated</option>}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by research area</span>
            <select value={area} onChange={(e) => setArea(e.target.value)} className={selectCls}>
              <option value="all">All research areas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Sort order</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')} className={selectCls}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
          <button type="button" aria-pressed={featuredOnly} onClick={() => setFeaturedOnly((v) => !v)} className="filter-chip">
            <Svg d={ICON.star} size={13} /> Featured
          </button>
          {filtered && (
            <button type="button" onClick={reset} className="ml-auto text-sm text-muted underline-offset-4 hover:text-accent hover:underline">
              Clear filters
            </button>
          )}
        </div>
      </div>

      <p className="mb-6 text-sm text-muted" aria-live="polite">
        Showing <span className="font-medium text-ink">{results.length}</span> of {pubs.length} records
      </p>

      {/* ── Results ── */}
      {groups.length === 0 && <p className="card p-10 text-center text-muted">No publications match these filters.</p>}

      {groups.map(([label, items]) => (
        <section key={label} aria-label={label} className="mb-10">
          <h2 className="sticky top-[4.5rem] z-10 -mx-1 mb-2 bg-bg/90 px-1 py-2 font-serif text-2xl text-ink backdrop-blur">{label}</h2>
          <ol>
            {items.map((p) => (
              <li key={p.id} id={p.id} className="border-b border-line py-6 last:border-b-0">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.14em]">
                  <span className="text-accent">{p.typeLabel}</span>
                  {p.featured && (
                    <span className="inline-flex items-center gap-1 text-accent-2">
                      <Svg d={ICON.star} size={11} /> Featured
                    </span>
                  )}
                  {statusLabel[p.status] && (
                    <span className="rounded-full border border-accent-2/40 px-2 py-0.5 normal-case tracking-normal text-accent-2">
                      {statusLabel[p.status]}
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-[1.2rem] font-medium leading-snug text-ink">
                  {p.doi || p.url ? (
                    <a
                      href={p.doi ? `https://doi.org/${p.doi}` : p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="decoration-accent/40 underline-offset-4 hover:text-accent-ink hover:underline"
                    >
                      {p.title}
                    </a>
                  ) : (
                    p.title
                  )}
                </h3>
                {p.authors.length > 0 ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {p.authors.map((a, i) => (
                      <span key={i}>
                        {a.isOwner ? <strong className="font-semibold text-ink">{a.text}</strong> : a.text}
                        {i < p.authors.length - 1 && ', '}
                      </span>
                    ))}
                  </p>
                ) : null}
                <p className="mt-1.5 text-sm text-ink-soft">
                  <em>{p.venue}</em>
                  {p.publisher && p.publisher !== p.venue && <span className="text-muted"> · {p.publisher}</span>}
                  {p.details && <span className="text-muted">, {p.details}</span>}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {p.doi && (
                    <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer" className="chip font-mono transition-colors hover:border-accent hover:text-accent">
                      <Svg d={ICON.link} size={12} /> DOI
                      <span className="sr-only"> {p.doi} (opens in a new tab)</span>
                    </a>
                  )}
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="chip transition-colors hover:border-accent hover:text-accent">
                      <Svg d={ICON.external} size={12} /> Publisher
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  )}
                  {p.pdf && (
                    <a href={p.pdf} target="_blank" rel="noopener noreferrer" className="chip transition-colors hover:border-accent hover:text-accent">
                      <Svg d={ICON.pdf} size={12} /> PDF
                    </a>
                  )}
                  <CopyButton text={p.citation} label="Citation" />
                  <CopyButton text={p.bibtex} label="BibTeX" />
                  {p.areas.map((a) => (
                    <a key={a.id} href={`${researchHref}#${a.id}`} className="chip transition-colors hover:border-accent hover:text-accent">
                      <span className="sr-only">Research theme: </span>
                      {a.label}
                    </a>
                  ))}
                  {showVerify && p.verify.length > 0 && (
                    <span
                      className="inline-flex cursor-help items-center gap-1 rounded-full border border-warn-line bg-warn-soft px-2 py-0.5 font-mono text-[0.62rem] font-medium uppercase tracking-wider text-warn"
                      title={p.verify.join(' • ')}
                      aria-label={`To verify: ${p.verify.join(' • ')}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" /> To verify
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
