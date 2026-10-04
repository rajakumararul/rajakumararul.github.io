---
# ── Album template ── copy this whole folder, rename it (lowercase-with-hyphens),
#    put your photographs next to this file, then fill in the fields below.
#    Folders starting with "_" are ignored, so this template never appears on the site.

title: "Event title"                     # required
eventDate: 2026-01-15                    # optional: 2026, 2026-01 or 2026-01-15
# endDate: 2026-01-17                    # optional, for multi-day events
# location: "VIT Chennai"                # optional
category: workshops                      # required — one of:
#   awards-recognition · faculty-development · conferences · invited-talks · workshops
#   research-lab · academic-leadership · industry · international · student-activities
description: "One or two sentences about the event."   # required

cover: ./cover.jpg                        # the main photograph (file in this folder)
coverAlt: "Describe the cover photo for screen readers"

photos:                                   # optional — any number of extra photographs
  - src: ./photo-01.jpg
    caption: "Caption shown in the lightbox"
  - src: ./photo-02.jpg
    caption: "Another caption"

featured: true                            # true → appears in the homepage carousel
# relatedNews: [2026-01-workshop]         # optional — news file names (without .md)
# externalLink: "https://…"               # optional — event or organiser page
---
