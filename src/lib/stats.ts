/**
 * Homepage statistics, computed from the content collections so they always
 * match the records. Each stat carries `pending` notes for records that are
 * incomplete or unverified; these are shown as "To verify" markers rather than
 * being silently counted as confirmed.
 */
import { getCollection, getEntry } from 'astro:content';

export interface Stat {
  value: string;
  label: string;
  hint: string;
  pending: string[];
  pendingLabel?: string;
}

export async function getHomeStats(): Promise<Stat[]> {
  const stats: Stat[] = [];

  // Publications — published items only; accepted / under review are reported separately.
  const pubs = await getCollection('publications', (p) => p.data.type !== 'thesis');
  const published = pubs.filter((p) => p.data.status === 'published');
  const accepted = pubs.filter((p) => p.data.status === 'accepted');
  const incomplete = published.filter((p) => p.data.verify.length > 0);
  stats.push({
    value: String(published.length),
    label: 'Publications',
    hint: `Published works${accepted.length ? ` · ${accepted.length} more accepted` : ''}`,
    pending: incomplete.length
      ? [`${incomplete.length} of ${published.length} records have incomplete details (year, authors or venue)`]
      : [],
    pendingLabel: `${incomplete.length} incomplete`,
  });

  // Funded projects — grants only (training programmes excluded).
  const grants = (await getCollection('projects', (p) => p.data.kind !== 'training-programme')).sort(
    (a, b) => a.data.order - b.data.order,
  );
  const funders = [...new Set(grants.map((g) => g.data.funderShort ?? g.data.funder))];
  const grantNotes = grants.flatMap((g) => {
    const name = g.data.funderShort ?? g.data.shortTitle ?? g.data.title;
    const notes = [...g.data.verify];
    if (g.data.status === 'to-verify' && !notes.some((n) => /status|ongoing/i.test(n))) notes.push('Status to verify');
    return notes.map((n) => `${name}: ${n}`);
  });
  const grantsPending = grants.filter((g) => g.data.verify.length > 0 || g.data.status === 'to-verify').length;
  stats.push({
    value: String(grants.length),
    label: 'Funded projects',
    hint: funders.join(' · '),
    pending: grantNotes,
    pendingLabel: `${grantsPending} to verify`,
  });

  // Faculty Research Award streak.
  const award = await getEntry('achievements', 'vit-faculty-research-award');
  if (award && award.data.years.length) {
    const years = [...award.data.years].sort();
    stats.push({
      value: `${years.length}×`,
      label: award.data.title,
      hint: `${award.data.issuer}, ${years.length > 1 ? `${years[0]}–${years.at(-1)}` : years[0]}`,
      pending: award.data.verify,
    });
  }

  // Professional standing — from the memberships list.
  const profile = (await getEntry('profile', 'main'))!.data;
  const ieee = profile.memberships.find((m) => /senior member,?\s*ieee/i.test(m));
  if (ieee) {
    const other = profile.memberships.find((m) => m !== ieee && /life member/i.test(m));
    stats.push({
      value: 'IEEE',
      label: 'Senior Member',
      hint: other ? other.replace(/\s*\(.*\)$/, '') : 'Institute of Electrical and Electronics Engineers',
      pending: [],
    });
  }

  return stats;
}
