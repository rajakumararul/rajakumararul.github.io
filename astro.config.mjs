// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Deployment target is controlled by environment variables so the same code
// works on GitHub Pages (project or user site) and later on a custom domain.
//   SITE_URL   e.g. https://<user>.github.io  or  https://www.yourdomain.com
//   BASE_PATH  e.g. /portfolio-website  (omit for a user site or custom domain)
const site = process.env.SITE_URL || 'https://rajakumararul.github.io';
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
