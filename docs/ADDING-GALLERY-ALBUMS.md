# Adding a photo album to "Academic Moments"

Every album is a **folder** inside:

```
src/content/gallery/
```

The folder holds the photographs plus one small text file, `index.md`, that describes the event.

## Step by step

1. **Copy the template folder**
   `src/content/gallery/_template` → rename the copy using lowercase words and hyphens, e.g.
   `src/content/gallery/fdp-quantum-computing-2026`
   (The folder name becomes the web address: `/gallery/fdp-quantum-computing-2026`.)

2. **Add your photographs to that folder**
   - JPG, PNG or WebP. Phone photos are fine — no resizing needed.
   - Use simple file names without spaces: `cover.jpg`, `photo-01.jpg`, `photo-02.jpg` …
   - The original files stay in this folder. When the site is built, Astro automatically
     creates small, fast versions (AVIF/WebP in 400–960 px widths, plus a 1600 px version for
     the lightbox); pages only load these optimised versions.
   - Note: Astro also copies each original into the build under an unlinked file name. Very
     large camera files (over ~5 MB) are best reduced to about 2400 px on the long side before
     adding them; keep the full-resolution files in your own photo archive.

3. **Edit `index.md`** in the folder — fill in the fields between the `---` lines:

   ```yaml
   ---
   title: "Faculty Development Programme on Quantum Computing"
   eventDate: 2026-01-15            # or 2026-01, or 2026 — leave out if unsure
   location: "VIT Chennai"
   category: faculty-development
   description: "Five-day FDP covering quantum algorithms and Qiskit."
   cover: ./cover.jpg
   coverAlt: "Participants at the FDP inaugural session"
   photos:
     - src: ./photo-01.jpg
       caption: "Hands-on Qiskit session"
     - src: ./photo-02.jpg
       caption: "Valedictory"
   featured: true                   # show in the homepage carousel
   ---
   ```

   **Categories** (use exactly one id):

   | id | Shown as |
   |---|---|
   | `awards-recognition` | Awards & Recognition |
   | `faculty-development` | Faculty Development Programmes |
   | `conferences` | Conferences |
   | `invited-talks` | Invited Talks |
   | `workshops` | Workshops |
   | `research-lab` | Research & Laboratory |
   | `academic-leadership` | Academic Leadership |
   | `industry` | Industry Interactions |
   | `international` | International Collaborations |
   | `student-activities` | Student Activities |

   Optional extras: `endDate`, `relatedNews: [news-file-name]`, `externalLink: "https://…"`,
   `order` (lower numbers first when dates are equal).

4. **Preview**: `npm run dev` → open http://localhost:4321/gallery
   If a field is wrong, the terminal shows exactly which file and field to fix.

## Replacing a placeholder album

Albums created for existing events currently contain **sample placeholder images**
(`placeholder-cover.jpg`, `placeholder-02.jpg`, …) and `placeholder: true`.

1. Delete the `placeholder-*.jpg` files and add your photographs.
2. Update `cover:` and `photos:` in `index.md` to the new file names.
3. Remove the line `placeholder: true` (and any `verify:` notes you have resolved).

## Achievement photographs and certificates

Put them in `src/assets/achievements/` and reference them in
`src/content/achievements.yaml`:

```yaml
photo: ../assets/achievements/vit-five-years-service.jpg
certificateImage: ../assets/achievements/qiskit-gss-2026-certificate.png
credentialUrl: "https://…"     # public verification link, if any
```

## Later: editing through a web interface

The folder-per-album structure, plain YAML front matter and relative image paths are the
format used by Git-based CMS tools (e.g. Pages CMS, Decap CMS). A future phase can add a
browser editor that commits to GitHub — no upload server is needed, so nothing insecure runs
on GitHub Pages.
