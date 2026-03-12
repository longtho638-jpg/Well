/**
 * RaaS License Management Admin Page
 * Tích hợp Analytics Dashboard với tab navigation
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LicenseList } from '@/components/admin/LicenseList';
import { LicenseAuditLogViewer } from '@/components/admin/LicenseAuditLogViewer';
import { CreateLicenseModal } from '@/components/admin/CreateLicenseModal';
import { LicenseAnalyticsDashboard } from '@/components/admin/LicenseAnalyticsDashboard';

export default function LicensesAdminPage() {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'licenses' | 'analytics'>('licenses');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('admin.licenses.create_title')}</h1>
          <p className="text-gray-400 text-sm mt-1">
            {t('admin.licenses.page_description')}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg font-medium"
        >
          {t('admin.licenses.create_button')}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('licenses')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'licenses'
              ? 'text-white border-b-2 border-primary'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('admin.licenses.list_title')}
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'analytics'
              ? 'text-white border-b-2 border-primary'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('admin.nav.analytics')}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'licenses' ? (
        <div className="grid gap-6">
          {/* License List */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">{t('admin.licenses.list_title')}</h2>
            <LicenseList
              onRevoke={() => {}}
              onActivate={() => {}}
            />
          </div>

          {/* Audit Log Viewer */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <LicenseAuditLogViewer />
          </div>
        </div>
      ) : (
        /* Analytics Dashboard Tab */
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
          <LicenseAnalyticsDashboard />
        </div>
      )}

      {/* Create Modal */}
      <CreateLicenseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
