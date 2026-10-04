#!/usr/bin/env node
/**
 * Append approved candidates to src/content/publications.yaml.
 *
 *   npm run pubs:approve -- publication-imports/<folder> <candidate-id> [<candidate-id> …]
 *   npm run pubs:approve -- publication-imports/<folder> --all
 *
 * Existing records are never modified or removed; candidates whose id already
 * exists are skipped. Review the diff (git diff) before committing.
 */
import { readFile, appendFile } from 'node:fs/promises';
import { parse, stringify } from 'yaml';
import { loadExisting, PUBLICATIONS_FILE } from './lib.mjs';

const [folder, ...ids] = process.argv.slice(2);
if (!folder || ids.length === 0) {
  console.error('Usage: npm run pubs:approve -- publication-imports/<folder> <id> [<id> …] | --all');
  process.exit(1);
}
const candidates = parse(await readFile(new URL(`../../${folder.replace(/\/$/, '')}/candidates.yaml`, import.meta.url), 'utf8')) ?? [];
const { records } = await loadExisting();
const have = new Set(records.map((r) => r.id));
const chosen = ids.includes('--all') ? candidates : candidates.filter((c) => ids.includes(c.id));

const missing = ids.filter((id) => id !== '--all' && !candidates.some((c) => c.id === id));
if (missing.length) console.warn(`  Not found in candidates.yaml: ${missing.join(', ')}`);

const toAdd = chosen.filter((c) => !have.has(c.id));
if (!toAdd.length) {
  console.log('Nothing to add.');
  process.exit(0);
}
const block =
  `\n# ─── Imported ${new Date().toISOString().slice(0, 10)} from ${folder} — review "verify" notes ───\n\n` +
  stringify(toAdd, { lineWidth: 0 });
await appendFile(PUBLICATIONS_FILE, block);
console.log(`✓ Appended ${toAdd.length} record(s) to src/content/publications.yaml:`);
toAdd.forEach((c) => console.log(`  + ${c.id}`));
console.log('Run `npm run build` to validate, then review with `git diff`.');
