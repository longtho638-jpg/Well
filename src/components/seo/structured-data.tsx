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
