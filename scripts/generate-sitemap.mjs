#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'https://wellnexus.vn';

const routes = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/dashboard/marketplace', priority: 0.9, changefreq: 'daily' },
  { path: '/dashboard/wallet', priority: 0.8, changefreq: 'weekly' },
  { path: '/dashboard/profile', priority: 0.6, changefreq: 'weekly', requiresAuth: true },
  { path: '/login', priority: 0.5, changefreq: 'monthly' },
  { path: '/signup', priority: 0.5, changefreq: 'monthly' },
  { path: '/forgot-password', priority: 0.3, changefreq: 'yearly' },
];

// Filter out auth-required routes (not indexable)
const publicRoutes = routes.filter(r => !r.requiresAuth);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publicRoutes
  .map(
    route => `  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

const outputPath = join(process.cwd(), 'public', 'sitemap.xml');
writeFileSync(outputPath, sitemap, 'utf-8');

console.log(`✅ Sitemap generated: ${outputPath}`);
console.log(`📝 Included ${publicRoutes.length} routes`);
