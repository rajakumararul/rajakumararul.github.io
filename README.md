# Dr. Rajakumar Arul — Academic Portfolio

Astro + Tailwind CSS static site, with React available for interactive islands.

## Run locally

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

## Editing content (no design changes needed)

All academic content lives in `src/content/`:

| File | What it controls |
|---|---|
| `profile.yaml` | Name, designation, bio, photo, profile links, memberships |
| `research-areas.yaml` | Research focus cards (primary / secondary) |
| `projects/*.md` | One file per funded project (`featured: true` → homepage) |
| `innovations.yaml` | Software / teaching tools on `/projects` — live URL and source-code URL for each (e.g. Quantum Learning Lab) |
| `publications.yaml` | All publications (`featured: true` → homepage) |
| `news/*.md` | One file per news item (latest 6 shown on homepage) |
| `leadership.yaml` | Current role, departmental initiatives, responsibilities |
| `achievements.yaml` | Awards, recognitions and certifications (optional photo / certificate / credential link) |
| `gallery/<album>/` | Academic Moments photo albums — see [docs/ADDING-GALLERY-ALBUMS.md](docs/ADDING-GALLERY-ALBUMS.md) |
| `social.yaml` | **All** profile links and contact links, in one place |
| `metrics.yaml` | Manually verified citation metrics (Google Scholar) |
| `experience.yaml`, `education.yaml` | Timeline |

Dates may be `2025`, `2025-07` or `2025-07-14`. Any entry can carry
`verify: ["note"]` — a private to-do note. It appears as an amber **To verify** marker
only in the local preview (`npm run dev`), never on the live site; remove the note once
the detail is confirmed. (`showVerificationNotes` in `src/config/site.ts` controls this.)

The build validates every file against the schemas in `src/content.config.ts`,
so a typo fails the build with a clear message instead of breaking a page.

**Publications import (Google Scholar BibTeX / ORCID):** see
[docs/PUBLICATIONS-IMPORT.md](docs/PUBLICATIONS-IMPORT.md).

**Adding the photograph:** put the image in `public/images/` and set
`photo: /images/<file>.jpg` in `profile.yaml`.

## Deployment

### GitHub Pages
1. Push the repository to GitHub (branch `main`). Repository: `rajakumararul.github.io`
   (a user site, served at `https://rajakumararul.github.io/`).
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. `.github/workflows/deploy.yml` builds and publishes on every push. The site
   URL and base path come from GitHub automatically.

### Custom domain (GoDaddy), later
1. In **Settings → Pages → Custom domain**, enter e.g. `www.example.com`.
2. In GoDaddy DNS, add:
   - `A` records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` for `www` → `<github-username>.github.io`
3. Once DNS resolves, enable **Enforce HTTPS**. No code changes are needed.
