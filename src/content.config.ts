/**
 * Content schemas.
 *
 * Every piece of academic content lives in `src/content/` as YAML or Markdown.
 * The schemas below validate those files at build time, so a typo or missing
 * field fails the build with a clear message instead of silently breaking a page.
 *
 * Any entry may carry `verify: [...]` — notes about details that still need
 * confirmation. These are rendered as amber "To verify" markers on the site
 * (toggle with `showVerificationNotes` in src/config/site.ts).
 */
import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Dates may be written as `2025`, `2025-07` or `2025-07-14`. YAML turns some of
 * these into numbers or Date objects, so normalise everything to a string and
 * keep the precision the author intended.
 */
const partialDate = z
  .union([z.string(), z.number(), z.date()])
  .transform((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v)))
  .pipe(z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'Use YYYY, YYYY-MM or YYYY-MM-DD'));

const verify = z.array(z.string()).default([]);

/** Research area ids — shared by projects, publications and news for filtering. */
const areaId = z.enum([
  'quantum-computing',
  'post-quantum-cryptography',
  'quantum-key-distribution',
  'network-security',
  'blockchain-iot',
  'ai-ml',
]);

const profile = defineCollection({
  loader: file('src/content/profile.yaml'),
  schema: z.object({
    name: z.string(),
    honorific: z.string(),
    shortName: z.string(),
    designation: z.string(),
    leadershipRole: z.string(),
    department: z.string(),
    school: z.string().optional(),
    institution: z.string(),
    institutionShort: z.string(),
    location: z.string(),
    tagline: z.string(),
    specializations: z.array(z.string()),
    bio: z.array(z.string()),
    photo: z.string().nullable(),
    memberships: z.array(z.string()),
    verify,
  }),
});

const researchAreas = defineCollection({
  loader: file('src/content/research-areas.yaml'),
  schema: z.object({
    id: areaId,
    title: z.string(),
    short: z.string(),
    tier: z.enum(['primary', 'secondary']),
    order: z.number(),
    icon: z.string(),
    summary: z.string(),
    keywords: z.array(z.string()),
    evidence: z.array(z.string()).default([]),
    verify,
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    shortTitle: z.string().optional(),
    kind: z.enum(['research-grant', 'seed-grant', 'training-programme', 'consultancy']),
    role: z.string(),
    funder: z.string(),
    /** Short funder name used in compact lists, e.g. "SERB". */
    funderShort: z.string().optional(),
    amount: z.number().nullable().default(null),
    currency: z.enum(['INR', 'USD', 'CAD', 'EUR', 'GBP']).nullable().default(null),
    start: partialDate,
    end: partialDate.nullable().default(null),
    status: z.enum(['ongoing', 'completed', 'to-verify']),
    areas: z.array(areaId),
    collaborators: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    order: z.number().default(100),
    verify,
  }),
});

/**
 * Innovations — software and teaching tools (src/content/innovations.yaml).
 * Links stay empty ("") until provided; an empty liveUrl shows a disabled
 * "link to be added" button, an empty sourceUrl hides the Source Code button.
 */
const httpsOrEmpty = z
  .string()
  .refine((v) => v === '' || v.startsWith('https://'), 'Use an https:// link, or leave empty');

const innovations = defineCollection({
  loader: file('src/content/innovations.yaml'),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    tagline: z.string(),
    description: z.string(),
    category: z.string(),
    status: z.enum(['active', 'in-development', 'archived']),
    highlights: z.array(z.string()).default([]),
    audience: z.string().optional(),
    liveUrl: httpsOrEmpty.default(''),
    sourceUrl: httpsOrEmpty.default(''),
    areas: z.array(areaId).default([]),
    featured: z.boolean().default(false),
    order: z.number().default(100),
    verify,
  }),
});

const publications = defineCollection({
  loader: file('src/content/publications.yaml'),
  schema: z.object({
    id: z.string(),
    type: z.enum(['journal', 'conference', 'chapter', 'book', 'thesis', 'article', 'preprint']),
    /** Only `published` records count towards published-work totals. */
    status: z.enum(['published', 'accepted', 'under-review', 'preprint', 'unconfirmed']).default('published'),
    title: z.string(),
    authors: z.array(z.string()),
    venue: z.string(),
    publisher: z.string().optional(),
    year: z.number().nullable(),
    volume: z.string().optional(),
    issue: z.string().optional(),
    pages: z.string().optional(),
    doi: z.string().optional(),
    /** Publisher / landing page link. */
    url: z.url().optional(),
    /** Open-access or author-accepted PDF — only where sharing is permitted. */
    pdf: z.string().optional(),
    keywords: z.array(z.string()).default([]),
    areas: z.array(areaId).default([]),
    featured: z.boolean().default(false),
    note: z.string().optional(),
    /** Where the record was confirmed: existing-site, crossref, orcid, scholar … */
    sources: z.array(z.string()).default([]),
    verify,
  }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    /** Leave out when the date is not yet confirmed — the item is then shown as "Date to be confirmed". */
    date: partialDate.optional(),
    category: z.enum(['appointment', 'talk', 'publication', 'project', 'award', 'certification', 'event', 'mentoring']),
    summary: z.string(),
    link: z.url().optional(),
    achievement: reference('achievements').optional(),
    album: reference('gallery').optional(),
    areas: z.array(areaId).default([]),
    verify,
  }),
});

const leadership = defineCollection({
  loader: file('src/content/leadership.yaml'),
  schema: z.object({
    id: z.string(),
    /** current-role: the headline role · portfolio: departmental work · responsibility: other service */
    group: z.enum(['current-role', 'portfolio', 'responsibility']),
    title: z.string(),
    organisation: z.string().optional(),
    start: partialDate.optional(),
    end: partialDate.nullable().optional(),
    description: z.string().optional(),
    /** established = ongoing, in place · in-development = initiative being set up */
    status: z.enum(['established', 'in-development']).optional(),
    /** Named sub-areas, e.g. research clusters — rendered as chips. */
    clusters: z.array(z.string()).default([]),
    icon: z.string().optional(),
    order: z.number().default(100),
    verify,
  }),
});

const experience = defineCollection({
  loader: file('src/content/experience.yaml'),
  schema: z.object({
    id: z.string(),
    track: z.enum(['academic', 'advisory', 'research']),
    title: z.string(),
    organisation: z.string(),
    location: z.string().optional(),
    start: partialDate,
    end: partialDate.nullable(),
    note: z.string().optional(),
    verify,
  }),
});

const education = defineCollection({
  loader: file('src/content/education.yaml'),
  schema: z.object({
    id: z.string(),
    degree: z.string(),
    field: z.string(),
    institution: z.string(),
    year: z.number(),
    detail: z.string().optional(),
    link: z.url().optional(),
    verify,
  }),
});

/**
 * Awards, fellowships, recognitions and certifications.
 * Images are optional; place them in src/assets/achievements/ and reference
 * them relative to achievements.yaml, e.g. ../assets/achievements/service-award.jpg
 */
const achievements = defineCollection({
  loader: file('src/content/achievements.yaml'),
  schema: ({ image }) =>
    z.object({
      id: z.string(),
      kind: z.enum(['award', 'fellowship', 'recognition', 'certification']),
      title: z.string(),
      /** Credential name, e.g. "Quantum Excellence". */
      credential: z.string().optional(),
      issuer: z.string(),
      category: z.string(),
      years: z.array(z.number()).default([]),
      date: partialDate.optional(),
      validUntil: partialDate.optional(),
      description: z.string().optional(),
      photo: image().optional(),
      certificateImage: image().optional(),
      credentialUrl: z.url().optional(),
      album: reference('gallery').optional(),
      areas: z.array(areaId).default([]),
      featured: z.boolean().default(false),
      order: z.number().default(100),
      verify,
    }),
});

/** Gallery categories — ids used in album front matter. Labels live in src/lib/gallery.ts. */
export const galleryCategories = [
  'awards-recognition',
  'faculty-development',
  'conferences',
  'invited-talks',
  'workshops',
  'research-lab',
  'academic-leadership',
  'industry',
  'international',
  'student-activities',
] as const;

/**
 * Academic Moments — one folder per album: src/content/gallery/<album>/index.md
 * with the photographs alongside. Folders starting with "_" are ignored (templates).
 */
const gallery = defineCollection({
  loader: glob({
    pattern: ['*/index.md', '!_*/**'],
    base: './src/content/gallery',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      eventDate: partialDate.optional(),
      endDate: partialDate.optional(),
      location: z.string().optional(),
      category: z.enum(galleryCategories),
      description: z.string(),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      photos: z
        .array(
          z.object({
            src: image(),
            caption: z.string().optional(),
            alt: z.string().optional(),
          }),
        )
        .default([]),
      featured: z.boolean().default(false),
      relatedNews: z.array(reference('news')).default([]),
      relatedAchievement: reference('achievements').optional(),
      externalLink: z.url().optional(),
      /**
       * Internal flag: the cover is a third-party stock photograph standing in for
       * the event photograph. Never shown to visitors — replace `cover.jpg`, then
       * remove this line and `coverCredit`.
       */
      temporaryImage: z.boolean().default(false),
      /** Attribution for a third-party cover photograph (listed on /credits). */
      coverCredit: z
        .object({
          creator: z.string(),
          creatorUrl: z.url().optional(),
          provider: z.string(),
          sourceUrl: z.url(),
          license: z.string(),
          licenseUrl: z.url().optional(),
        })
        .optional(),
      order: z.number().default(100),
      verify,
    }),
});

/** Every public profile / contact link, edited in one place: src/content/social.yaml */
const social = defineCollection({
  loader: file('src/content/social.yaml'),
  schema: z.object({
    id: z.string(),
    group: z.enum(['academic', 'professional', 'contact']),
    label: z.string(),
    /** https:// or mailto: link. Leave empty ("") until verified — empty links are never shown. */
    url: z
      .string()
      .refine((v) => v === '' || /^(https:\/\/|mailto:)/.test(v), 'Use an https:// or mailto: link, or leave empty'),
    handle: z.string().optional(),
    icon: z.string(),
    /** Set false to keep a verified link private (not displayed). */
    public: z.boolean().default(true),
    placements: z.array(z.enum(['hero', 'footer', 'about', 'contact'])).default(['footer', 'about', 'contact']),
    order: z.number().default(100),
    verify,
  }),
});

/**
 * Citation metrics — entered manually from a verified source (e.g. Google Scholar).
 * null values are never displayed.
 */
const metrics = defineCollection({
  loader: file('src/content/metrics.yaml'),
  schema: z.object({
    source: z.string(),
    sourceUrl: z.url().optional(),
    publications: z.number().nullable(),
    citations: z.number().nullable(),
    hIndex: z.number().nullable(),
    i10Index: z.number().nullable(),
    lastVerified: partialDate.nullable(),
  }),
});

export const collections = {
  profile,
  researchAreas,
  projects,
  innovations,
  publications,
  news,
  leadership,
  experience,
  education,
  achievements,
  gallery,
  social,
  metrics,
};
