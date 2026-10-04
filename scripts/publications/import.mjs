#!/usr/bin/env node
/**
 * Publication import — PREVIEW ONLY. Never modifies src/content/publications.yaml.
 *
 *   npm run pubs:import -- --bib path/to/scholar-export.bib [--crossref]
 *   npm run pubs:import -- --orcid 0000-0002-1385-7965 [--crossref]
 *
 * Writes a review folder in publication-imports/<date>-<source>/ containing:
 *   report.html     — visual preview (open in a browser)
 *   report.md       — the same summary as text
 *   candidates.yaml — records awaiting approval, already in the site's schema
 * Approve selected candidates afterwards with:  npm run pubs:approve -- <folder> <id> …
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { stringify } from 'yaml';
import {
  loadExisting,
  fromBibtex,
  fromOrcid,
  crossrefLookup,
  findMatch,
  compareFields,
  titleSimilarity,
  slug,
} from './lib.mjs';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const bibPath = opt('--bib');
const orcid = opt('--orcid');
const useCrossref = args.includes('--crossref');

if (!bibPath && !orcid) {
  console.error('Usage: npm run pubs:import -- (--bib <file.bib> | --orcid <ORCID iD>) [--crossref]');
  process.exit(1);
}

const sourceName = bibPath ? 'bibtex' : 'orcid';
console.log(`\n▸ Reading ${bibPath ? bibPath : `ORCID ${orcid}`} …`);
const { records: incoming, errors } = bibPath ? fromBibtex(await readFile(bibPath, 'utf8')) : await fromOrcid(orcid);
if (errors?.length) console.warn(`  ${errors.length} BibTeX parse warning(s)`);
const { records: existing } = await loadExisting();
console.log(`  ${incoming.length} incoming records · ${existing.length} existing records`);

// ── Optional Crossref validation ──
if (useCrossref) {
  console.log('▸ Validating against Crossref …');
  for (const rec of incoming) rec.crossref = await crossrefLookup(rec);
}

// ── Reconcile ──
const result = { new: [], matched: [], possible: [], internalDuplicates: [] };
const seen = [];
for (const rec of incoming) {
  const twin = seen.find((s) => (rec.doi && s.doi === rec.doi) || titleSimilarity(s.title, rec.title) >= 0.9);
  if (twin) {
    result.internalDuplicates.push({ rec, twin });
    continue;
  }
  seen.push(rec);

  const cr = rec.crossref && rec.crossref.title ? rec.crossref : null;
  const match = findMatch(cr?.doi && !rec.doi ? { ...rec, doi: cr.doi } : rec, existing);
  if (match && !match.possible) {
    const { conflicts, fills } = compareFields(match.record, rec);
    const crCheck = cr ? compareFields(match.record, cr) : null;
    result.matched.push({ rec, match, conflicts, fills, crCheck });
  } else if (match?.possible) {
    result.possible.push({ rec, match });
  } else {
    result.new.push({ rec });
  }
}

// ── Build candidate records (site schema) for everything needing approval ──
const existingIds = new Set(existing.map((e) => e.id));
function toCandidate(rec, reason) {
  const cr = rec.crossref && rec.crossref.title ? rec.crossref : null;
  const verify = [];
  let status = rec.status;
  let type = rec.type;
  // Publication status is confirmed only by a publisher (Crossref) record.
  if (cr && cr.type && cr.type !== 'preprint') {
    status = 'published';
    type = cr.type;
  } else if (status === 'unconfirmed') verify.push('Publication status not confirmed by a publisher record');
  if (rec.unknownType) verify.push(`Source type "${rec.unknownType}" — classify manually`);
  if (!rec.authors.length && !cr?.authors?.length) verify.push('Authors missing');
  if (!(rec.year ?? cr?.year)) verify.push('Year missing');
  if (cr?.how === 'title') verify.push('DOI found by Crossref title search — confirm it is the same work');
  if (reason) verify.push(reason);

  let id = `${slug(rec.title, 5)}-${rec.year ?? cr?.year ?? 'nd'}`;
  while (existingIds.has(id)) id += '-x';
  existingIds.add(id);

  const pick = (f) => cr?.[f] ?? rec[f];
  const out = {
    id,
    type,
    status,
    title: cr?.title ?? rec.title,
    authors: cr?.authors?.length ? cr.authors : rec.authors,
    venue: pick('venue') || '',
    publisher: pick('publisher'),
    year: pick('year') ?? null,
    volume: pick('volume'),
    issue: pick('issue'),
    pages: pick('pages'),
    doi: pick('doi'),
    url: rec.url && !/doi\.org/.test(rec.url) ? rec.url : undefined,
    areas: [],
    sources: [rec.source, ...(cr ? ['crossref'] : [])],
    verify,
  };
  for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k];
  return out;
}

const candidates = [
  ...result.new.map(({ rec }) => toCandidate(rec)),
  ...result.possible.map(({ rec, match }) =>
    toCandidate(rec, `Possible duplicate of existing "${match.record.id}" (${Math.round(match.score * 100)}% title similarity)`),
  ),
];

// ── Write review folder ──
const stamp = new Date().toISOString().slice(0, 10);
const dir = new URL(`../../publication-imports/${stamp}-${sourceName}/`, import.meta.url);
await mkdir(dir, { recursive: true });

await writeFile(
  new URL('candidates.yaml', dir),
  `# Records awaiting approval — generated ${new Date().toISOString()} from ${bibPath ?? `ORCID ${orcid}`}.\n` +
    `# Review, edit if needed (add "areas", fix "type"), then approve with:\n` +
    `#   npm run pubs:approve -- publication-imports/${stamp}-${sourceName} <id> [<id> …]\n` +
    `# Nothing here is published until approved.\n\n` +
    stringify(candidates, { lineWidth: 0 }),
);

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fmtRec = (r) => `${r.title} — ${r.venue || 'venue not stated'}${r.year ? ` (${r.year})` : ''}${r.doi ? ` · doi:${r.doi}` : ''}`;
const conflictsTotal = result.matched.reduce((n, m) => n + m.conflicts.length, 0);

const md = [
  `# Publication import preview — ${stamp}`,
  ``,
  `Source: ${bibPath ?? `ORCID ${orcid} (public API)`}${useCrossref ? ' · validated against Crossref' : ''}`,
  ``,
  `| | Count |`,
  `|---|---|`,
  `| Incoming records | ${incoming.length} |`,
  `| Already in the site (matched) | ${result.matched.length} |`,
  `| **New — awaiting approval** | ${result.new.length} |`,
  `| Possible duplicates — awaiting decision | ${result.possible.length} |`,
  `| Duplicates within the import | ${result.internalDuplicates.length} |`,
  `| Metadata conflicts on matched records | ${conflictsTotal} |`,
  ``,
  `## New publications`,
  ...result.new.map(({ rec }) => `- ${fmtRec(rec)}`),
  ``,
  `## Possible duplicates`,
  ...result.possible.map(({ rec, match }) => `- ${fmtRec(rec)}\n  - resembles existing \`${match.record.id}\` (${Math.round(match.score * 100)}%, ${match.how})`),
  ``,
  `## Existing publications matched`,
  ...result.matched.map(
    ({ match, conflicts, fills }) =>
      `- \`${match.record.id}\` ← ${match.how}` +
      conflicts.map((c) => `\n  - ⚠ conflict **${c.field}**: site "${c.existing}" vs import "${c.incoming}"`).join('') +
      fills.map((f) => `\n  - ＋ could fill **${f.field}**: ${Array.isArray(f.value) ? f.value.join(', ') : f.value}`).join(''),
  ),
  ``,
  `## Duplicates inside the import`,
  ...result.internalDuplicates.map(({ rec }) => `- ${fmtRec(rec)}`),
  ``,
  `No changes have been made to src/content/publications.yaml.`,
].join('\n');
await writeFile(new URL('report.md', dir), md);

const section = (title, tone, rows) =>
  `<section><h2><span class="dot ${tone}"></span>${esc(title)} <small>${rows.length}</small></h2>${rows.length ? `<ul>${rows.join('')}</ul>` : '<p class="none">None</p>'}</section>`;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Publication import preview — ${stamp}</title>
<style>
:root{--bg:#f7f6f2;--s:#fff;--ink:#0d1526;--m:#5d6678;--l:#e3e0d7;--a:#4f3bd1;--c:#0b8aa3;--w:#9a5b00;--ws:#fdf1dc}
@media (prefers-color-scheme:dark){:root{--bg:#070b15;--s:#0f1626;--ink:#e9ecf4;--m:#949db2;--l:#1d2640;--a:#a898ff;--c:#4fd1e8;--w:#f3c46b;--ws:#2a2010}}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 system-ui,-apple-system,sans-serif}
main{max-width:960px;margin:0 auto;padding:40px 16px}h1{font:500 2rem Georgia,serif;margin:0 0 4px}
.meta{color:var(--m);margin-bottom:28px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:32px}
.stat{background:var(--s);border:1px solid var(--l);border-radius:14px;padding:16px}.stat b{display:block;font:500 2rem Georgia,serif}.stat span{color:var(--m);font-size:13px}
section{background:var(--s);border:1px solid var(--l);border-radius:16px;padding:20px 24px;margin-bottom:16px}h2{font:500 1.2rem Georgia,serif;margin:0 0 12px;display:flex;align-items:center;gap:10px}
h2 small{color:var(--m);font:13px system-ui}ul{margin:0;padding-left:18px}li{margin:8px 0}.none{color:var(--m);margin:0}
.dot{width:9px;height:9px;border-radius:50%;display:inline-block}.new{background:var(--a)}.ok{background:var(--c)}.warn{background:var(--w)}
.id{font-family:ui-monospace,monospace;font-size:12px;color:var(--m)}.conf{color:var(--w)}.fill{color:var(--c)}
.note{background:var(--ws);color:var(--w);border-radius:12px;padding:12px 16px;margin-bottom:24px}
</style></head><body><main>
<h1>Publication import preview</h1>
<p class="meta">${esc(bibPath ?? `ORCID ${orcid} (public API)`)} · ${stamp}${useCrossref ? ' · validated against Crossref' : ''}</p>
<p class="note">Preview only — <b>src/content/publications.yaml has not been changed.</b> Approve records with <code>npm run pubs:approve</code>.</p>
<div class="grid">
<div class="stat"><b>${incoming.length}</b><span>Incoming records</span></div>
<div class="stat"><b>${result.matched.length}</b><span>Already on the site</span></div>
<div class="stat"><b>${result.new.length}</b><span>New · awaiting approval</span></div>
<div class="stat"><b>${result.possible.length}</b><span>Possible duplicates</span></div>
<div class="stat"><b>${conflictsTotal}</b><span>Metadata conflicts</span></div>
</div>
${section('New publications — awaiting approval', 'new', result.new.map(({ rec }) => {
  const c = candidates.find((x) => x.title === (rec.crossref?.title ?? rec.title));
  return `<li>${esc(fmtRec(rec))}<br><span class="id">candidate id: ${esc(c?.id)} · status: ${esc(c?.status)}</span></li>`;
}))}
${section('Possible duplicates — needs your decision', 'warn', result.possible.map(({ rec, match }) => `<li>${esc(fmtRec(rec))}<br><span class="id">resembles ${esc(match.record.id)} · ${Math.round(match.score * 100)}% similar</span></li>`))}
${section('Existing publications matched', 'ok', result.matched.map(({ match, conflicts, fills }) =>
  `<li><span class="id">${esc(match.record.id)}</span> — matched by ${esc(match.how)}${conflicts.map((c) => `<br><span class="conf">⚠ ${esc(c.field)}: site “${esc(c.existing)}” vs import “${esc(c.incoming)}”</span>`).join('')}${fills.map((f) => `<br><span class="fill">＋ could fill ${esc(f.field)}: ${esc(Array.isArray(f.value) ? f.value.join(', ') : f.value)}</span>`).join('')}</li>`))}
${section('Duplicates within the import', 'warn', result.internalDuplicates.map(({ rec }) => `<li>${esc(fmtRec(rec))}</li>`))}
</main></body></html>`;
await writeFile(new URL('report.html', dir), html);

const rel = `publication-imports/${stamp}-${sourceName}`;
console.log(`\n✓ Preview written to ${rel}/`);
console.log(`  matched ${result.matched.length} · new ${result.new.length} · possible duplicates ${result.possible.length} · conflicts ${conflictsTotal}`);
console.log(`  Open ${rel}/report.html in a browser to review. publications.yaml was NOT modified.\n`);
