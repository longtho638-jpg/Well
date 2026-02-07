# Phase 04: SEO Optimization

## Context

Optimize WellNexus for search engines to improve discoverability, ranking, and organic traffic. Implement comprehensive meta tags, structured data, sitemap, and technical SEO best practices.

**Current State:**
- Basic meta tags in index.html
- No structured data (JSON-LD)
- No sitemap.xml or robots.txt optimization
- Missing Open Graph and Twitter Card tags
- No canonical URLs

**Target State:**
- Lighthouse SEO score 90+
- Complete Open Graph and Twitter Card metadata
- JSON-LD structured data for Organization, Product, BreadcrumbList
- Dynamic sitemap generation
- Optimized robots.txt
- Canonical URLs on all pages

## Requirements

### Functional Requirements
- **FR-01:** Dynamic meta tags per route (title, description, OG, Twitter)
- **FR-02:** JSON-LD structured data (Organization, Product, WebSite, BreadcrumbList)
- **FR-03:** Auto-generated sitemap.xml with priority and changefreq
- **FR-04:** Optimized robots.txt with sitemap reference
- **FR-05:** Canonical URLs to prevent duplicate content

### Non-Functional Requirements
- **NFR-01:** Lighthouse SEO score 90+
- **NFR-02:** All pages have unique titles (50-60 chars) and descriptions (150-160 chars)
- **NFR-03:** Structured data validates on Google Rich Results Test
- **NFR-04:** Sitemap includes all public pages, excludes admin routes

## Architecture

### SEO Component Structure

```
src/
├── components/
│   └── seo/
│       ├── seo-head.tsx              # Dynamic meta tags component
│       ├── structured-data.tsx       # JSON-LD schemas
│       └── breadcrumbs.tsx           # Breadcrumb navigation + schema
├── config/
│   └── seo-config.ts                 # SEO metadata per route
└── utils/
    └── seo-utils.ts                  # SEO helper functions

scripts/
└── generate-sitemap.mjs              # Sitemap generator

public/
├── robots.txt                        # Enhanced robots.txt
└── sitemap.xml                       # Generated sitemap
```

### Structured Data Schemas

```json
{
  "Organization": {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "WellNexus",
    "url": "https://wellnexus.vn",
    "logo": "https://wellnexus.vn/logo.png",
    "description": "Premium health product distribution platform"
  },
  "WebSite": {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://wellnexus.vn",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://wellnexus.vn/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  },
  "Product": {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Product Name",
    "offers": {
      "@type": "Offer",
      "price": "100000",
      "priceCurrency": "VND"
    }
  }
}
```

## Implementation Steps

### Step 1: Create SEO Configuration

**File:** `src/config/seo-config.ts`

```typescript
export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
}

export const seoConfig: Record<string, SEOConfig> = {
  '/': {
    title: 'WellNexus - Nền tảng Phân phối Sản phẩm Sức khỏe',
    description: 'Hệ thống phân phối đa cấp với hoa hồng minh bạch, sản phẩm chất lượng cao, và công nghệ hiện đại. Tham gia WellNexus hôm nay.',
    keywords: ['wellnexus', 'phân phối', 'sức khỏe', 'hoa hồng', 'MLM'],
    ogImage: 'https://wellnexus.vn/og-home.png',
  },
  '/products': {
    title: 'Sản phẩm - WellNexus',
    description: 'Khám phá bộ sưu tập sản phẩm sức khỏe cao cấp với chứng nhận quốc tế, giá cạnh tranh và chương trình hoa hồng hấp dẫn.',
    keywords: ['sản phẩm sức khỏe', 'thực phẩm chức năng', 'wellnexus'],
    ogImage: 'https://wellnexus.vn/og-products.png',
  },
  '/commission': {
    title: 'Hệ thống Hoa hồng - WellNexus',
    description: 'Hệ thống hoa hồng 9 cấp minh bạch, tự động tính toán, và thanh toán nhanh chóng. Theo dõi thu nhập real-time.',
    keywords: ['hoa hồng', 'thu nhập thụ động', 'MLM', 'wellnexus'],
    ogImage: 'https://wellnexus.vn/og-commission.png',
  },
  '/auth/login': {
    title: 'Đăng nhập - WellNexus',
    description: 'Đăng nhập vào tài khoản WellNexus để quản lý đơn hàng, theo dõi hoa hồng và truy cập dashboard.',
    noindex: true, // Don't index auth pages
  },
  '/admin': {
    title: 'Admin Dashboard - WellNexus',
    description: 'WellNexus Admin Panel',
    noindex: true,
  },
};

export const defaultSEO: SEOConfig = {
  title: 'WellNexus',
  description: 'Nền tảng phân phối sản phẩm sức khỏe cao cấp',
  ogImage: 'https://wellnexus.vn/og-default.png',
};
```

### Step 2: Create SEO Head Component

**File:** `src/components/seo/seo-head.tsx`

```typescript
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { seoConfig, defaultSEO } from '@/config/seo-config';

interface SEOHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  noindex?: boolean;
}

export function SEOHead({ title, description, ogImage, noindex }: SEOHeadProps) {
  const location = useLocation();
  const routeConfig = seoConfig[location.pathname] || defaultSEO;

  const finalTitle = title || routeConfig.title;
  const finalDescription = description || routeConfig.description;
  const finalOGImage = ogImage || routeConfig.ogImage || defaultSEO.ogImage;
  const shouldNoIndex = noindex ?? routeConfig.noindex ?? false;
  const canonicalUrl = `https://wellnexus.vn${location.pathname}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      {routeConfig.keywords && (
        <meta name="keywords" content={routeConfig.keywords.join(', ')} />
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Robots */}
      {shouldNoIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalOGImage} />
      <meta property="og:site_name" content="WellNexus" />
      <meta property="og:locale" content="vi_VN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalOGImage} />

      {/* Additional Meta Tags */}
      <meta name="author" content="WellNexus" />
      <meta name="theme-color" content="#6366f1" />
    </Helmet>
  );
}
```

### Step 3: Create Structured Data Component

**File:** `src/components/seo/structured-data.tsx`

```typescript
import { Helmet } from 'react-helmet-async';

interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
}

export function OrganizationSchema({
  name = 'WellNexus',
  url = 'https://wellnexus.vn',
  logo = 'https://wellnexus.vn/logo.png',
}: OrganizationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description: 'Nền tảng phân phối sản phẩm sức khỏe cao cấp với hệ thống hoa hồng đa cấp',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+84-xxx-xxx-xxx',
      contactType: 'Customer Service',
      availableLanguage: ['Vietnamese', 'English'],
    },
    sameAs: [
      'https://facebook.com/wellnexus',
      'https://twitter.com/wellnexus',
      'https://instagram.com/wellnexus',
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

interface WebSiteSchemaProps {
  url?: string;
}

export function WebSiteSchema({ url = 'https://wellnexus.vn' }: WebSiteSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url,
    name: 'WellNexus',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

interface ProductSchemaProps {
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
}

export function ProductSchema({
  name,
  description,
  image,
  price,
  currency = 'VND',
  availability = 'InStock',
}: ProductSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    offers: {
      '@type': 'Offer',
      price: price.toString(),
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      url: window.location.href,
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
```

### Step 4: Create Breadcrumbs Component

**File:** `src/components/seo/breadcrumbs.tsx`

```typescript
import { Link, useLocation } from 'react-router-dom';
import { BreadcrumbSchema } from './structured-data';
import { useTranslation } from 'react-i18next';

const routeNames: Record<string, string> = {
  '/': 'home',
  '/products': 'products',
  '/commission': 'commission',
  '/orders': 'orders',
  '/profile': 'profile',
  '/admin': 'admin',
};

export function Breadcrumbs() {
  const { t } = useTranslation();
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const breadcrumbItems = [
    { name: t('nav.home'), url: 'https://wellnexus.vn/' },
  ];

  let currentPath = '';
  for (const segment of pathSegments) {
    currentPath += `/${segment}`;
    const routeKey = routeNames[currentPath];
    if (routeKey) {
      breadcrumbItems.push({
        name: t(`nav.${routeKey}`),
        url: `https://wellnexus.vn${currentPath}`,
      });
    }
  }

  if (breadcrumbItems.length <= 1) return null;

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />

      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-gray-400">
          {breadcrumbItems.map((item, index) => (
            <li key={item.url} className="flex items-center gap-2">
              {index > 0 && <span>/</span>}
              {index === breadcrumbItems.length - 1 ? (
                <span className="text-white font-medium">{item.name}</span>
              ) : (
                <Link
                  to={item.url.replace('https://wellnexus.vn', '')}
                  className="hover:text-white transition-colors"
                >
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
```

### Step 5: Create Sitemap Generator

**File:** `scripts/generate-sitemap.mjs`

```javascript
#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'https://wellnexus.vn';

const routes = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/products', priority: 0.9, changefreq: 'daily' },
  { path: '/commission', priority: 0.8, changefreq: 'weekly' },
  { path: '/orders', priority: 0.7, changefreq: 'daily', requiresAuth: true },
  { path: '/profile', priority: 0.6, changefreq: 'weekly', requiresAuth: true },
  { path: '/about', priority: 0.5, changefreq: 'monthly' },
  { path: '/contact', priority: 0.5, changefreq: 'monthly' },
  { path: '/terms', priority: 0.3, changefreq: 'yearly' },
  { path: '/privacy', priority: 0.3, changefreq: 'yearly' },
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
```

### Step 6: Update Robots.txt

**File:** `public/robots.txt`

```txt
# WellNexus - Robots.txt

User-agent: *
Allow: /
Disallow: /admin/
Disallow: /auth/
Disallow: /api/
Disallow: /*.json$

# Sitemap
Sitemap: https://wellnexus.vn/sitemap.xml

# Crawl delay (optional, for heavy crawlers)
Crawl-delay: 1

# Specific bots
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# Block bad bots
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /
```

### Step 7: Add SEO to Routes

**File:** `src/pages/Home.tsx` (example)

```typescript
import { SEOHead } from '@/components/seo/seo-head';
import { OrganizationSchema, WebSiteSchema } from '@/components/seo/structured-data';

export function HomePage() {
  return (
    <>
      <SEOHead />
      <OrganizationSchema />
      <WebSiteSchema />

      {/* Page content */}
      <div>
        {/* ... */}
      </div>
    </>
  );
}
```

**File:** `src/pages/ProductDetail.tsx` (example)

```typescript
import { SEOHead } from '@/components/seo/seo-head';
import { ProductSchema } from '@/components/seo/structured-data';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';

export function ProductDetailPage({ product }) {
  return (
    <>
      <SEOHead
        title={`${product.name} - WellNexus`}
        description={product.description}
        ogImage={product.image}
      />
      <ProductSchema
        name={product.name}
        description={product.description}
        image={product.image}
        price={product.price}
      />

      <div className="container">
        <Breadcrumbs />
        {/* Product content */}
      </div>
    </>
  );
}
```

### Step 8: Add Helmet Provider

**File:** `src/main.tsx` (wrap app)

```typescript
import { HelmetProvider } from 'react-helmet-async';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);
```

### Step 9: Add NPM Scripts

**File:** `package.json`

```json
{
  "scripts": {
    "sitemap:generate": "node scripts/generate-sitemap.mjs",
    "prebuild": "npm run sitemap:generate && npm run i18n:validate"
  }
}
```

### Step 10: Install Dependencies

```bash
npm install react-helmet-async
```

## Verification & Success Criteria

### Lighthouse SEO Audit

```bash
# Build and preview
npm run build
npm run preview

# Run Lighthouse in Chrome DevTools
# Navigate to Lighthouse tab
# Run SEO audit

# Target: SEO score 90+
```

### Structured Data Validation

```bash
# Test structured data
# 1. Visit https://search.google.com/test/rich-results
# 2. Enter URL: https://wellnexus.vn
# 3. Verify all schemas detected:
#    - Organization
#    - WebSite (with SearchAction)
#    - BreadcrumbList
```

### Manual SEO Checks

1. **Meta Tags Validation:**
   ```html
   <!-- View page source on each route -->
   <!-- Verify present: -->
   <title>Page Title - WellNexus</title>
   <meta name="description" content="..." />
   <meta property="og:title" content="..." />
   <meta property="og:image" content="..." />
   <meta name="twitter:card" content="summary_large_image" />
   <link rel="canonical" href="https://wellnexus.vn/..." />
   ```

2. **Sitemap Validation:**
   ```bash
   # Visit https://wellnexus.vn/sitemap.xml
   # Verify:
   # - All public routes present
   # - No auth routes (/admin, /auth)
   # - Valid XML format
   # - Correct priorities and changefreq
   ```

3. **Robots.txt Validation:**
   ```bash
   # Visit https://wellnexus.vn/robots.txt
   # Verify:
   # - Sitemap reference present
   # - Admin routes disallowed
   # - Public routes allowed
   ```

4. **Open Graph Preview:**
   - Use https://www.opengraph.xyz/
   - Enter URL: https://wellnexus.vn
   - Verify preview card shows correct image, title, description

5. **Twitter Card Validation:**
   - Use https://cards-dev.twitter.com/validator
   - Enter URL: https://wellnexus.vn
   - Verify card renders correctly

### Success Criteria Checklist

- [ ] Lighthouse SEO score 90+
- [ ] All routes have unique titles (50-60 chars)
- [ ] All routes have unique descriptions (150-160 chars)
- [ ] Open Graph tags on all pages
- [ ] Twitter Card tags on all pages
- [ ] Canonical URLs on all pages
- [ ] Organization schema on homepage
- [ ] WebSite schema on homepage
- [ ] Product schema on product pages
- [ ] BreadcrumbList schema on all non-home pages
- [ ] Sitemap.xml generated and accessible
- [ ] Robots.txt optimized
- [ ] No index on admin/auth routes
- [ ] Structured data validates on Google Rich Results Test
- [ ] react-helmet-async installed and configured

### SEO Checklist (Google)

```bash
# Run Google's SEO Starter Guide checks:
# https://developers.google.com/search/docs/beginner/seo-starter-guide

✅ Descriptive page titles
✅ Meta descriptions
✅ Heading hierarchy (H1, H2, H3)
✅ Descriptive URLs
✅ Alt text on images
✅ Mobile-friendly (responsive)
✅ Fast loading (Lighthouse Performance)
✅ HTTPS enabled
✅ Structured data
✅ Sitemap
```

## Rollback Plan

1. **Remove SEO components:**
   ```bash
   git rm -r src/components/seo
   git commit -m "Rollback: Remove SEO components"
   ```

2. **Revert to basic meta tags:**
   ```html
   <!-- index.html -->
   <title>WellNexus</title>
   <meta name="description" content="..." />
   ```

3. **Remove Helmet provider:**
   ```typescript
   // src/main.tsx
   // Remove HelmetProvider wrapper
   ```

## Next Steps

After Phase 4 completion:
- Proceed to Phase 5 (Admin Dashboard - Aura Elite)
- Submit sitemap to Google Search Console
- Monitor SEO performance in Google Analytics
- Consider schema.org FAQ/HowTo for help pages

---

**Estimated Effort:** 2 hours
**Dependencies:** react-helmet-async
**Risk Level:** Low (SEO is additive, doesn't break existing functionality)
