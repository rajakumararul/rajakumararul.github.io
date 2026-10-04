/**
 * Prefix an internal path with the configured base path, so links keep working
 * when the site is served from a GitHub Pages sub-path (e.g. /portfolio/).
 */
export function url(path = '/'): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean}` || '/';
}

/** True when `href` is the current page or one of its children. */
export function isActive(href: string, pathname: string): boolean {
  const target = url(href).replace(/\/$/, '');
  const current = pathname.replace(/\/$/, '');
  return current === target || current.startsWith(`${target}/`);
}
