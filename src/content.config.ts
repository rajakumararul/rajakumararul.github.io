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
import { defineCollection } from 'astro:content';
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

const link = z.object({
  label: z.string(),
  url: z.url(),
});

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
    email: z.email().nullable(),
    links: z.array(link.extend({ kind: z.string() })),
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

const publications = defineCollection({
  loader: file('src/content/publications.yaml'),
  schema: z.object({
    id: z.string(),
    type: z.enum(['journal', 'conference', 'chapter', 'book', 'thesis', 'article']),
    status: z.enum(['published', 'accepted', 'under-review']).default('published'),
    title: z.string(),
    authors: z.array(z.string()),
    venue: z.string(),
    publisher: z.string().optional(),
    year: z.number().nullable(),
    volume: z.string().optional(),
    issue: z.string().optional(),
    pages: z.string().optional(),
    doi: z.string().optional(),
    url: z.url().optional(),
    areas: z.array(areaId).default([]),
    featured: z.boolean().default(false),
    note: z.string().optional(),
    verify,
  }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: partialDate,
    category: z.enum(['appointment', 'talk', 'publication', 'project', 'award', 'event', 'mentoring']),
    summary: z.string(),
    link: z.url().optional(),
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

const awards = defineCollection({
  loader: file('src/content/awards.yaml'),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    body: z.string(),
    years: z.array(z.number()).default([]),
    detail: z.string().optional(),
    featured: z.boolean().default(false),
    verify,
  }),
});

export const collections = {
  profile,
  researchAreas,
  projects,
  publications,
  news,
  leadership,
  experience,
  education,
  awards,
};
