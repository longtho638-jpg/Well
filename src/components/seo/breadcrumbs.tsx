import { Link, useLocation } from 'react-router-dom';
import { BreadcrumbSchema } from './structured-data';
import { useTranslation } from 'react-i18next';

const routeNames: Record<string, string> = {
  '/': 'home',
  '/dashboard': 'dashboard',
  '/dashboard/marketplace': 'marketplace',
  '/dashboard/wallet': 'commission_wallet',
  '/dashboard/orders': 'orders',
  '/dashboard/profile': 'profile',
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
    // Check if we have a translation, otherwise capitalize segment
    const routeKey = routeNames[currentPath];
    const name = routeKey
      ? t(`nav.${routeKey}` as any)
      : segment.charAt(0).toUpperCase() + segment.slice(1);

    breadcrumbItems.push({
      name,
      url: `https://wellnexus.vn${currentPath}`,
    });
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
