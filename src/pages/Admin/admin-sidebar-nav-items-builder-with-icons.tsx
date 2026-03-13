/**
 * Admin sidebar navigation items configuration.
 * Separated from admin-sidebar-nav.tsx to keep component under 200 LOC.
 */

import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  Wallet,
  DollarSign,
  Package,
  ClipboardList,
  Settings,
  Activity,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
}

/**
 * Build nav items array with translated labels.
 * Called inside the component so t() runs inside React context.
 */
export function buildNavItems(t: (key: string) => string): NavItem[] {
  return [
    { id: 'overview', label: t('admin.nav.overview'), icon: <LayoutDashboard size={20} />, path: '/admin', badge: '3' },
    { id: 'cms', label: t('admin.nav.content'), icon: <FileText size={20} />, path: '/admin/cms' },
    { id: 'partners', label: t('admin.nav.partners'), icon: <Users size={20} />, path: '/admin/partners', badge: '5' },
    { id: 'finance', label: t('admin.nav.finance'), icon: <Wallet size={20} />, path: '/admin/finance', badge: '2' },
    { id: 'orders', label: t('admin.nav.orders'), icon: <DollarSign size={20} />, path: '/admin/orders' },
    { id: 'products', label: t('admin.nav.products'), icon: <Package size={20} />, path: '/admin/products' },
    { id: 'strategy', label: t('admin.nav.strategy'), icon: <Settings size={20} />, path: '/admin/policy-engine' },
    { id: 'audit', label: t('admin.nav.auditLog'), icon: <ClipboardList size={20} />, path: '/admin/audit-log' },
    { id: 'licenses', label: t('admin.nav.licenses'), icon: <Settings size={20} />, path: '/admin/licenses' },
    { id: 'metering', label: t('admin.nav.metering'), icon: <Activity size={20} />, path: '/admin/metering' },
  ];
}
