const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Format a partial date ("2025", "2025-07", "2025-07-14") at the precision it was written. */
export function formatDate(value: string, style: 'short' | 'long' = 'short'): string {
  const [y, m, d] = value.split('-');
  if (!m) return y;
  const month = MONTHS[Number(m) - 1];
  if (!d || style === 'short') return `${month} ${y}`;
  return `${Number(d)} ${month} ${y}`;
}

/** "Oct 2022 – Present", "2018 – 2021", "Jan 2025 – Jun 2025" */
export function formatRange(start: string, end: string | null | undefined): string {
  const s = formatDate(start);
  if (end === null || end === undefined) return `${s} – Present`;
  const e = formatDate(end);
  return s === e ? s : `${s} – ${e}`;
}

/** Sortable key for partial dates (missing parts sort as earliest). */
export function dateKey(value: string): string {
  const [y, m = '00', d = '00'] = value.split('-');
  return `${y}-${m}-${d}`;
}

export function formatAmount(amount: number | null, currency: string | null): string | null {
  if (amount === null || currency === null) return null;
  if (currency === 'INR') {
    const lakhs = amount / 100000;
    return `₹${lakhs.toLocaleString('en-IN', { maximumFractionDigits: 2 })} lakh`;
  }
  const symbol: Record<string, string> = { USD: 'US$', CAD: 'CA$', EUR: '€', GBP: '£' };
  return `${symbol[currency] ?? currency + ' '}${amount.toLocaleString('en-US')}`;
}

/** Shorten an author list and emphasise the site owner. */
/** Matches the spellings of the site owner's name used in author lists. */
export const OWNER_NAME = /^(Rajakumar Arul|R\.? Arul|A\.? Rajakumar|Rajakumar A\.?|Arul,? Rajakumar)$/i;

export function formatAuthors(authors: string[], max = 6): { text: string; isOwner: boolean }[] {
  const list = authors.slice(0, max).map((a) => ({ text: a, isOwner: OWNER_NAME.test(a.trim()) }));
  if (authors.length > max) list.push({ text: `+${authors.length - max} more`, isOwner: false });
  return list;
}

export const publicationTypeLabel: Record<string, string> = {
  journal: 'Journal',
  conference: 'Conference',
  chapter: 'Book chapter',
  book: 'Book',
  thesis: 'Thesis',
  article: 'Article',
  preprint: 'Preprint',
};
