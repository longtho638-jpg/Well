# Phase 5: SEO Optimization

## Context Links
- [Plan Overview](./plan.md)
- [Phase 4: i18n & PWA](./phase-04-i18n-pwa.md)
- [README.md](../../README.md)
- [System Architecture](../../docs/system-architecture.md)

## Overview

**Priority:** P2 Medium
**Status:** ⏳ Pending (Can start after Phase 4)
**Effort:** 3 hours
**Dependencies:** Phase 4 (i18n needed for meta tags)

Implement comprehensive SEO optimization with meta tags, sitemap, robots.txt, structured data, and performance enhancements for search engine visibility.

## Key Insights

1. **Current SEO State**: Basic meta tags, no sitemap, no structured data
2. **Target Keywords**: "HealthFi Vietnam", "MLM platform", "community commerce", "distributor portal"
3. **Performance Impact**: SEO and performance are interconnected (Core Web Vitals)
4. **Structured Data**: JSON-LD for Organization, Product, LocalBusiness
5. **Social Sharing**: Open Graph and Twitter Cards for social media

## Requirements

### Functional Requirements
- FR1: All pages must have unique, descriptive title tags (< 60 chars)
- FR2: All pages must have unique meta descriptions (< 160 chars)
- FR3: XML sitemap must list all public pages with priority/frequency
- FR4: Robots.txt must allow/disallow appropriate paths
- FR5: Structured data (JSON-LD) for Organization and LocalBusiness
- FR6: Open Graph tags for social media sharing
- FR7: Twitter Card tags for Twitter sharing

### Non-Functional Requirements
- NFR1: Meta tags must be i18n-aware (switch with language)
- NFR2: Sitemap must auto-generate on build
- NFR3: Lighthouse SEO score must be 100
- NFR4: Core Web Vitals must pass (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- NFR5: Images must have alt attributes for accessibility + SEO

## Architecture

### Meta Tag Flow
```
Route Change → useEffect → Update document.head
                             ↓
                    <title>, <meta name="description">, <meta property="og:*">
```

### Sitemap Generation
```
Build Time → Scan routes → Generate sitemap.xml → Output to /public
```

### Structured Data
```
Page Render → Inject JSON-LD script → Search Engine Crawl → Rich Snippets
```

## Related Code Files

### Files to Modify
- `index.html` - Add default meta tags
- `src/App.tsx` - Add SEO component wrapper
- `src/pages/*.tsx` - Add page-specific meta tags
- `vite.config.ts` - Add sitemap generation plugin

### Files to Create
- `src/components/seo-head.tsx` - Reusable SEO component
- `src/utils/seo-config.ts` - SEO configuration and defaults
- `scripts/generate-sitemap.ts` - Sitemap generation script
- `public/robots.txt` - Robots directives
- `src/components/structured-data.tsx` - JSON-LD component
- `scripts/verify-seo.ts` - Automated SEO validation

### Files to Reference
- `src/locales/en.ts`, `src/locales/vi.ts` - SEO text translations

## Implementation Steps

### Step 1: Create SEO Infrastructure (1h)

1. **SEO Configuration**:
   ```typescript
   // src/utils/seo-config.ts
   export const seoConfig = {
     defaultTitle: 'WellNexus - HealthFi Community Commerce Platform',
     titleTemplate: '%s | WellNexus',
     defaultDescription: 'Join Vietnam\'s leading HealthFi community commerce platform. Earn commissions, build your network, and access AI-powered business tools.',
     siteUrl: 'https://wellnexus.vn',
     defaultImage: 'https://wellnexus.vn/og-image.png',
     twitterHandle: '@wellnexus',
     organization: {
       name: 'WellNexus',
       url: 'https://wellnexus.vn',
       logo: 'https://wellnexus.vn/logo.png',
     },
   };

   export const pageSEO = {
     home: {
       title: 'Home',
       description: 'Transform your health journey with WellNexus HealthFi platform',
       keywords: ['healthfi', 'vietnam', 'mlm', 'community commerce'],
     },
     dashboard: {
       title: 'Dashboard',
       description: 'Manage your distributor business with AI-powered insights',
       keywords: ['distributor dashboard', 'mlm dashboard', 'sales tracking'],
     },
     marketplace: {
       title: 'Marketplace',
       description: 'Browse premium health products and earn commissions',
       keywords: ['health products', 'marketplace', 'wellness'],
     },
     // ... more pages
   };
   ```

2. **SEO Head Component**:
   ```typescript
   // src/components/seo-head.tsx
   import { useEffect } from 'react';
   import { useTranslation } from 'react-i18next';
   import { seoConfig, pageSEO } from '@/utils/seo-config';

   interface SEOHeadProps {
     page: keyof typeof pageSEO;
     customTitle?: string;
     customDescription?: string;
     customImage?: string;
     noIndex?: boolean;
   }

   export const SEOHead: React.FC<SEOHeadProps> = ({
     page,
     customTitle,
     customDescription,
     customImage,
     noIndex = false,
   }) => {
     const { t, i18n } = useTranslation();
     const config = pageSEO[page];

     const title = customTitle || t(`seo.${page}.title`) || config.title;
     const description = customDescription || t(`seo.${page}.description`) || config.description;
     const image = customImage || seoConfig.defaultImage;
     const url = `${seoConfig.siteUrl}${window.location.pathname}`;

     useEffect(() => {
       // Title
       document.title = seoConfig.titleTemplate.replace('%s', title);

       // Meta description
       updateMetaTag('name', 'description', description);

       // Keywords
       updateMetaTag('name', 'keywords', config.keywords.join(', '));

       // Language
       document.documentElement.lang = i18n.language;

       // Open Graph
       updateMetaTag('property', 'og:title', title);
       updateMetaTag('property', 'og:description', description);
       updateMetaTag('property', 'og:image', image);
       updateMetaTag('property', 'og:url', url);
       updateMetaTag('property', 'og:type', 'website');
       updateMetaTag('property', 'og:locale', i18n.language === 'vi' ? 'vi_VN' : 'en_US');

       // Twitter Cards
       updateMetaTag('name', 'twitter:card', 'summary_large_image');
       updateMetaTag('name', 'twitter:title', title);
       updateMetaTag('name', 'twitter:description', description);
       updateMetaTag('name', 'twitter:image', image);
       updateMetaTag('name', 'twitter:site', seoConfig.twitterHandle);

       // Robots
       if (noIndex) {
         updateMetaTag('name', 'robots', 'noindex, nofollow');
       } else {
         updateMetaTag('name', 'robots', 'index, follow');
       }

       // Canonical
       updateLinkTag('canonical', url);
     }, [title, description, image, url, i18n.language, noIndex]);

     return null;
   };

   function updateMetaTag(attr: string, attrValue: string, content: string) {
     let element = document.querySelector(`meta[${attr}="${attrValue}"]`);
     if (!element) {
       element = document.createElement('meta');
       element.setAttribute(attr, attrValue);
       document.head.appendChild(element);
     }
     element.setAttribute('content', content);
   }

   function updateLinkTag(rel: string, href: string) {
     let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
     if (!element) {
       element = document.createElement('link');
       element.rel = rel;
       document.head.appendChild(element);
     }
     element.href = href;
   }
   ```

3. **Apply to Pages**:
   ```typescript
   // src/pages/Home.tsx
   import { SEOHead } from '@/components/seo-head';

   export const Home: React.FC = () => {
     return (
       <>
         <SEOHead page="home" />
         {/* Page content */}
       </>
     );
   };

   // src/pages/Dashboard.tsx
   export const Dashboard: React.FC = () => {
     return (
       <>
         <SEOHead page="dashboard" noIndex={true} /> {/* Private page */}
         {/* Page content */}
       </>
     );
   };
   ```

### Step 2: Generate Sitemap & Robots.txt (30min)

1. **Sitemap Generation Script**:
   ```typescript
   // scripts/generate-sitemap.ts
   import { writeFileSync } from 'fs';
   import { seoConfig } from '../src/utils/seo-config';

   const routes = [
     { path: '/', priority: 1.0, changefreq: 'daily' },
     { path: '/marketplace', priority: 0.9, changefreq: 'daily' },
     { path: '/about', priority: 0.7, changefreq: 'monthly' },
     { path: '/contact', priority: 0.6, changefreq: 'monthly' },
     // Exclude: /dashboard, /admin (private routes)
   ];

   const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     ${routes.map(route => `
       <url>
         <loc>${seoConfig.siteUrl}${route.path}</loc>
         <lastmod>${new Date().toISOString()}</lastmod>
         <changefreq>${route.changefreq}</changefreq>
         <priority>${route.priority}</priority>
       </url>
     `).join('')}
   </urlset>`;

   writeFileSync('public/sitemap.xml', sitemap.trim());
   console.log('✅ Sitemap generated at public/sitemap.xml');
   ```

2. **Robots.txt**:
   ```txt
   # public/robots.txt
   User-agent: *
   Allow: /
   Disallow: /dashboard
   Disallow: /admin
   Disallow: /api
   Disallow: /_vercel

   Sitemap: https://wellnexus.vn/sitemap.xml
   ```

3. **Add to Build Process**:
   ```json
   // package.json
   {
     "scripts": {
       "build": "tsx scripts/generate-sitemap.ts && vite build"
     }
   }
   ```

### Step 3: Add Structured Data (1h)

1. **Structured Data Component**:
   ```typescript
   // src/components/structured-data.tsx
   import { useEffect } from 'react';
   import { seoConfig } from '@/utils/seo-config';

   interface StructuredDataProps {
     type: 'Organization' | 'LocalBusiness' | 'Product';
     data?: any;
   }

   export const StructuredData: React.FC<StructuredDataProps> = ({ type, data }) => {
     useEffect(() => {
       const schema = generateSchema(type, data);
       const script = document.createElement('script');
       script.type = 'application/ld+json';
       script.text = JSON.stringify(schema);
       script.id = `structured-data-${type}`;

       // Remove existing script
       const existing = document.getElementById(`structured-data-${type}`);
       if (existing) existing.remove();

       document.head.appendChild(script);

       return () => {
         script.remove();
       };
     }, [type, data]);

     return null;
   };

   function generateSchema(type: string, data?: any) {
     switch (type) {
       case 'Organization':
         return {
           '@context': 'https://schema.org',
           '@type': 'Organization',
           name: seoConfig.organization.name,
           url: seoConfig.organization.url,
           logo: seoConfig.organization.logo,
           sameAs: [
             'https://facebook.com/wellnexus',
             'https://twitter.com/wellnexus',
           ],
           contactPoint: {
             '@type': 'ContactPoint',
             telephone: '+84-xxx-xxx-xxx',
             contactType: 'Customer Service',
             areaServed: 'VN',
             availableLanguage: ['Vietnamese', 'English'],
           },
         };

       case 'LocalBusiness':
         return {
           '@context': 'https://schema.org',
           '@type': 'LocalBusiness',
           name: seoConfig.organization.name,
           image: seoConfig.organization.logo,
           '@id': seoConfig.siteUrl,
           url: seoConfig.siteUrl,
           telephone: '+84-xxx-xxx-xxx',
           address: {
             '@type': 'PostalAddress',
             streetAddress: 'Your Street',
             addressLocality: 'Ho Chi Minh City',
             postalCode: '700000',
             addressCountry: 'VN',
           },
           geo: {
             '@type': 'GeoCoordinates',
             latitude: 10.8231,
             longitude: 106.6297,
           },
           openingHoursSpecification: {
             '@type': 'OpeningHoursSpecification',
             dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
             opens: '09:00',
             closes: '18:00',
           },
         };

       case 'Product':
         return {
           '@context': 'https://schema.org',
           '@type': 'Product',
           name: data?.name,
           image: data?.image,
           description: data?.description,
           offers: {
             '@type': 'Offer',
             price: data?.price,
             priceCurrency: 'VND',
             availability: 'https://schema.org/InStock',
           },
         };

       default:
         return {};
     }
   }
   ```

2. **Apply to Home Page**:
   ```typescript
   // src/pages/Home.tsx
   import { StructuredData } from '@/components/structured-data';

   export const Home: React.FC = () => {
     return (
       <>
         <SEOHead page="home" />
         <StructuredData type="Organization" />
         <StructuredData type="LocalBusiness" />
         {/* Page content */}
       </>
     );
   };
   ```

### Step 4: SEO Validation & Optimization (30min)

1. **Create SEO Validation Script**:
   ```typescript
   // scripts/verify-seo.ts
   import { readFileSync } from 'fs';

   function validateSEO() {
     const errors: string[] = [];

     // Check sitemap exists
     try {
       readFileSync('public/sitemap.xml', 'utf-8');
       console.log('✅ sitemap.xml exists');
     } catch {
       errors.push('❌ sitemap.xml missing');
     }

     // Check robots.txt exists
     try {
       const robots = readFileSync('public/robots.txt', 'utf-8');
       if (!robots.includes('Sitemap:')) {
         errors.push('❌ robots.txt missing Sitemap directive');
       } else {
         console.log('✅ robots.txt configured');
       }
     } catch {
       errors.push('❌ robots.txt missing');
     }

     // Check for images without alt
     // (Would need to parse HTML/JSX - complex, skip for now or use manual check)

     if (errors.length > 0) {
       console.error('\n' + errors.join('\n'));
       process.exit(1);
     }

     console.log('\n✅ All SEO checks passed!');
   }

   validateSEO();
   ```

2. **Add to CI/CD**:
   ```json
   // package.json
   {
     "scripts": {
       "verify:seo": "tsx scripts/verify-seo.ts"
     }
   }
   ```

3. **Update Image Alt Attributes**:
   ```bash
   # Find images without alt
   grep -rn '<img' src/ --include="*.tsx" | grep -v 'alt='

   # Add alt to all images
   <img src={logo} alt="WellNexus logo" />
   <img src={product.image} alt={product.name} />
   ```

## Todo List

- [ ] Create src/utils/seo-config.ts with SEO defaults
- [ ] Create src/components/seo-head.tsx
- [ ] Create src/components/structured-data.tsx
- [ ] Add SEOHead to all public pages (Home, Marketplace, About)
- [ ] Add noIndex to private pages (Dashboard, Admin)
- [ ] Create scripts/generate-sitemap.ts
- [ ] Create public/robots.txt
- [ ] Add sitemap generation to build script
- [ ] Add StructuredData to Home page
- [ ] Add product structured data to Marketplace
- [ ] Add i18n translations for SEO (seo.home.title, etc.)
- [ ] Create scripts/verify-seo.ts
- [ ] Add alt attributes to all images
- [ ] Create OG image (1200x630px)
- [ ] Test meta tags with Facebook Debugger
- [ ] Test Twitter Cards with Twitter Card Validator
- [ ] Run Lighthouse SEO audit (score 100)
- [ ] Verify build passes: `npm run build`
- [ ] Submit sitemap to Google Search Console

## Success Criteria

### Automated Verification
```bash
# All must pass:
npm run build           # Includes sitemap generation
npm run verify:seo      # SEO validation
npm run lighthouse:seo  # Lighthouse SEO score 100
```

### Manual Verification
- [ ] All public pages have unique titles and descriptions
- [ ] sitemap.xml accessible at https://wellnexus.vn/sitemap.xml
- [ ] robots.txt accessible at https://wellnexus.vn/robots.txt
- [ ] Facebook Debugger shows correct OG tags
- [ ] Twitter Card Validator shows correct preview
- [ ] Google Rich Results Test validates structured data
- [ ] All images have meaningful alt attributes
- [ ] Core Web Vitals pass in PageSpeed Insights

### SEO Checklist
- [ ] Title tags: Unique, < 60 chars, include primary keyword
- [ ] Meta descriptions: Unique, < 160 chars, compelling CTA
- [ ] Open Graph tags: title, description, image, url, type
- [ ] Twitter Cards: card, title, description, image
- [ ] Structured data: Organization, LocalBusiness
- [ ] Canonical URLs: Set on all pages
- [ ] Language tags: html lang attribute set
- [ ] Sitemap: All public pages listed
- [ ] Robots.txt: Allow public, disallow private

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Duplicate meta tags | Medium | Low | useEffect cleanup removes old tags |
| Sitemap includes private pages | High | Low | Explicit route allowlist in script |
| Structured data validation errors | Medium | Low | Test with Google Rich Results Tool |
| OG image not loading | Low | Low | Host on CDN, verify URL |
| Robots.txt blocks legitimate crawlers | High | Low | Test with robots.txt tester |

## Security Considerations

### SEO Security
- **Meta Tag Injection**: Sanitize all user-generated content in meta tags
- **Sitemap Exposure**: Don't include sensitive routes in sitemap
- **Robots.txt**: Don't disclose sensitive directory structure

## Next Steps

After Phase 5 completion:

1. **Submit to Search Engines**:
   - Google Search Console: Submit sitemap
   - Bing Webmaster Tools: Submit sitemap
   - Monitor indexing status

2. **Monitor Performance**:
   - Track organic traffic growth
   - Monitor Core Web Vitals
   - A/B test meta descriptions

3. **Content Optimization**:
   - Create SEO-optimized blog content
   - Build backlinks from health/wellness sites
   - Optimize for Vietnamese local search

---

**Phase Effort:** 3 hours
**Critical Path:** No (final phase)
**Automation Level:** High (75% automated verification)

---

## Final Deployment Checklist

After completing all 5 phases:

### Pre-Deploy Verification
```bash
npm run build                 # ✅ 0 TypeScript errors
npm run test:run              # ✅ 100% pass rate
npm run verify:security       # ✅ Security headers validated
npm run verify:i18n           # ✅ i18n keys validated
npm run verify:seo            # ✅ SEO checks passed
npm run lighthouse            # ✅ All scores 90+
```

### Manual QA
- [ ] Test payment flow end-to-end (PayOS)
- [ ] Test admin dashboard on mobile/tablet/desktop
- [ ] Test PWA install on iOS and Android
- [ ] Test offline mode
- [ ] Test language switcher
- [ ] Verify all meta tags in view-source
- [ ] Test social media sharing (Facebook, Twitter)

### Production Deployment
```bash
git add .
git commit -m "feat: complete platform upgrade (security, PayOS, admin, i18n, PWA, SEO)"
git push origin main
# → Vercel auto-deploys to wellnexus.vn
```

### Post-Deploy Monitoring
- [ ] Monitor Sentry for errors (24h)
- [ ] Monitor payment success rate
- [ ] Monitor Core Web Vitals
- [ ] Monitor PWA install rate
- [ ] Check Google Search Console for indexing
- [ ] Verify SSL Labs rating: A+

**Plan Completed:** Target 2026-02-10
**Total Effort:** 20 hours (5 phases)
