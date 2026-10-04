# Importing and reviewing publications

`src/content/publications.yaml` is the single source of truth for the Publications page and
all publication counts. The import tools **never change it automatically** — they produce a
preview that you review, and only the records you approve are appended.

## Sources

| Source | How | Notes |
|---|---|---|
| **Google Scholar** | Export BibTeX (below) | Scholar has no public API and its terms do not allow automated scraping, so the site never scrapes it. |
| **ORCID** | Public API — automatic | Permitted, reliable; only shows works you have added to ORCID. |
| **Any BibTeX file** | Zotero, Mendeley, Scopus, publisher pages, doi.org | |

### Exporting from Google Scholar

1. Sign in and open your profile: https://scholar.google.com/citations?user=UzhDslYAAAAJ
2. Tick the checkbox at the top of the article list to select all (use “Show more” first to load every article).
3. Click **Export → BibTeX** and save the file, e.g. `scholar.bib`.

## 1. Preview an import

```bash
npm run pubs:import -- --bib ~/Downloads/scholar.bib --crossref
npm run pubs:import -- --orcid 0000-0002-1385-7965 --crossref
```

`--crossref` checks every record against Crossref (publisher metadata). It confirms the
publication type and status, and finds DOIs where possible. **Only records confirmed by a
publisher record get `status: published`**; others are imported as `unconfirmed` (or
`preprint`) and are listed but **not counted** in published totals.

The preview is written to `publication-imports/<date>-<source>/`:

- `report.html` — open in a browser: new publications, existing matches, possible duplicates,
  metadata conflicts, duplicates inside the export
- `report.md` — the same as text
- `candidates.yaml` — records awaiting approval, already in the site's format

Records are matched by DOI, then normalised title (spelling and abbreviation aware), year
and author surnames.

## 2. Review

- Edit `candidates.yaml` if needed: add `areas`, fix `type`, mark `featured: true`.
- For **possible duplicates**, decide whether it is the same work (e.g. a conference paper later
  published as a book chapter). If so, update the existing record by hand instead of approving.
- **Conflicts** (e.g. online-first year vs issue year) are never changed automatically — edit
  `publications.yaml` yourself if the import is right.

## 3. Approve selected records

```bash
npm run pubs:approve -- publication-imports/2026-10-04-orcid naecp-attention-based-neural-architecture-2026
npm run build      # validates the result
git diff           # see exactly what changed
```

Existing records are never modified or removed by this command.

## Citation metrics

Citation counts, h-index and i10-index are **not** fetched automatically. Copy them from
Google Scholar into `src/content/metrics.yaml` with the date you checked. Empty (`null`)
values are not shown. Local publication totals are calculated from `publications.yaml` and
are always shown separately from these manually verified figures.
