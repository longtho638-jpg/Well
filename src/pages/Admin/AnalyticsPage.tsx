/**
 * Analytics Dashboard Page (Phase 5 - ROIaaS)
 * Real-time analytics: license usage, revenue, API consumption
 * Admin-only access via AdminRoute guard
 */

import { LicenseAnalyticsDashboard } from '@/components/admin/LicenseAnalyticsDashboard';
import { AdminRoute } from '@/components/AdminRoute';

export default function AnalyticsPage() {
  return (
    <AdminRoute>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">
              Real-time metrics: license usage, revenue, API consumption
            </p>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
          <LicenseAnalyticsDashboard />
        </div>
      </div>
    </AdminRoute>
  );
}
