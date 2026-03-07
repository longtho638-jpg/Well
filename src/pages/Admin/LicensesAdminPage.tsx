/**
 * RaaS License Management Admin Page
 * Tích hợp Analytics Dashboard với tab navigation
 */

import { useState } from 'react';
import { LicenseList } from '@/components/admin/LicenseList';
import { LicenseAuditLogViewer } from '@/components/admin/LicenseAuditLogViewer';
import { CreateLicenseModal } from '@/components/admin/CreateLicenseModal';
import { LicenseAnalyticsDashboard } from '@/components/admin/LicenseAnalyticsDashboard';

export default function LicensesAdminPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'licenses' | 'analytics'>('licenses');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý License RaaS</h1>
          <p className="text-gray-400 text-sm mt-1">
            Quản lý license keys, kích hoạt, thu hồi và xem audit logs
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg font-medium"
        >
          + Tạo License
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
          Danh sách License
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'analytics'
              ? 'text-white border-b-2 border-primary'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Analytics Dashboard
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'licenses' ? (
        <div className="grid gap-6">
          {/* License List */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Danh sách License</h2>
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
