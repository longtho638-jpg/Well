import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { seoConfig, defaultSEO } from '@/config/seo-config';

interface SEOHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  noindex?: boolean;
  keywords?: string[];
  canonical?: string;
}

export function SEOHead({ title, description, ogImage, noindex, keywords, canonical }: SEOHeadProps) {
  const location = useLocation();
  const routeConfig = seoConfig[location.pathname] || defaultSEO;

  const finalTitle = title || routeConfig.title;
  const finalDescription = description || routeConfig.description;
  const finalOGImage = ogImage || routeConfig.ogImage || defaultSEO.ogImage;
  const shouldNoIndex = noindex ?? routeConfig.noindex ?? false;
  const finalKeywords = keywords || routeConfig.keywords;
  const finalCanonical = canonical || `https://wellnexus.vn${location.pathname}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      {finalKeywords && (
        <meta name="keywords" content={finalKeywords.join(', ')} />
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={finalCanonical} />

      {/* Robots */}
      {shouldNoIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={finalCanonical} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalOGImage} />
      <meta property="og:site_name" content="WellNexus" />
      <meta property="og:locale" content="vi_VN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={finalCanonical} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalOGImage} />

      {/* Additional Meta Tags */}
      <meta name="author" content="WellNexus" />
      <meta name="theme-color" content="#6366f1" />
    </Helmet>
  );
}
